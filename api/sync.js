// api/sync.js — Sincronização Inteligente Bidirecional de Perfil, Recordes e Avatares com Firebase Admin SDK
import admin, { db, hasAdminCredentials } from './_firebaseAdmin.js';
import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const sanitizeName = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/<[^>]*>?/gm, '').replace(/[^a-zA-Z0-9_\- .À-ÿ]/g, '').trim().slice(0, 30);
  };

  const sanitizeAvatar = (str) => {
    if (!str || typeof str !== 'string') return '';
    const trimmed = str.trim();
    // Permite Data URLs de imagem base64 seguras ou URLs HTTPS válidas (máximo 25KB para manter leveza total)
    if (trimmed.startsWith('data:image/') && trimmed.length <= 25000) {
      return trimmed;
    }
    if ((trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('img/')) && trimmed.length <= 500) {
      return trimmed;
    }
    return '';
  };

  if (req.method === 'POST') {
    const {
      username,
      flappyScore = 0,
      runnerScore = 0,
      dilmaScore = 0,
      nikolasScore = 0,
      totalPicanhas = 0,
      lifetimePicanhas = 0,
      runnerCoins = 0,
      unlockedCharacters = [],
      unlockedSkins = [],
      equippedSkins = {},
      prestigeLevel = 0,
      loginStreak = 1,
      lastLoginDate = '',
      dailyMissions = {},
      avatar = '',
      country = 'BR'
    } = req.body || {};

    const cleanName = sanitizeName(username);
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome de usuário inválido.' });
    }

    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    try {
      let existingData = {};
      let userRef = null;

      if (hasAdminCredentials && db) {
        try {
          userRef = db.collection('lula_users_v2').doc(normalizedName);
          const userSnap = await userRef.get();
          existingData = userSnap.exists ? userSnap.data() : {};
        } catch (dbErr) {
          console.warn('Aviso ao consultar lula_users_v2 via Admin SDK:', dbErr.message);
        }
      }

      const localFlappy = Math.max(0, parseInt(flappyScore || 0, 10));
      const localRunner = Math.max(0, parseInt(runnerScore || 0, 10));
      const localDilma = Math.max(0, parseInt(dilmaScore || 0, 10));
      const localNikolas = Math.max(0, parseInt(nikolasScore || 0, 10));
      const localPicanhas = Math.max(0, parseInt(totalPicanhas || 0, 10));
      const localLifetimePicanhas = Math.max(localPicanhas, parseInt(lifetimePicanhas || 0, 10));
      const localCoins = Math.max(0, parseInt(runnerCoins || 0, 10));
      const localPrestige = Math.max(0, parseInt(prestigeLevel || 0, 10));

      const cloudFlappy = Math.max(0, parseInt(existingData.flappyScore || 0, 10));
      const cloudRunner = Math.max(0, parseInt(existingData.runnerScore || 0, 10));
      const cloudDilma = Math.max(0, parseInt(existingData.dilmaScore || 0, 10));
      const cloudNikolas = Math.max(0, parseInt(existingData.nikolasScore || 0, 10));
      const cloudPicanhas = Math.max(0, parseInt(existingData.totalPicanhas || 0, 10));
      const cloudLifetimePicanhas = Math.max(0, parseInt(existingData.lifetimePicanhas || existingData.totalPicanhas || 0, 10));
      const cloudCoins = Math.max(0, parseInt(existingData.runnerCoins || 0, 10));
      const cloudPrestige = Math.max(0, parseInt(existingData.prestigeLevel || 0, 10));

      // Fusão segura: sempre o maior valor entre Local e Cloud
      const mergedFlappy = Math.max(localFlappy, cloudFlappy);
      const mergedRunner = Math.max(localRunner, cloudRunner);
      const mergedDilma = Math.max(localDilma, cloudDilma);
      const mergedNikolas = Math.max(localNikolas, cloudNikolas);
      const mergedPicanhas = Math.max(localPicanhas, cloudPicanhas);
      const mergedLifetimePicanhas = Math.max(localLifetimePicanhas, cloudLifetimePicanhas);
      const mergedCoins = Math.max(localCoins, cloudCoins);
      const mergedPrestige = Math.max(localPrestige, cloudPrestige);

      // Fusão de personagens desbloqueados (unifica arrays)
      const cloudUnlocked = Array.isArray(existingData.unlockedCharacters) ? existingData.unlockedCharacters : [];
      const localUnlocked = Array.isArray(unlockedCharacters) ? unlockedCharacters : [];
      const mergedUnlockedSet = new Set([...cloudUnlocked, ...localUnlocked]);

      // Requisito Nikolas: 300 pts Flappy Lula + 300 km Empresário 3D
      if (mergedFlappy >= 300 && mergedRunner >= 300) {
        mergedUnlockedSet.add('nikolas');
      }

      // Requisito Pablo Marçal: 900 pts com Nikolas Ferreira
      if (mergedNikolas >= 900) {
        mergedUnlockedSet.add('marcal');
      }

      // Regra dos 3000: se histórico de picanhas >= 3000, libera todos os personagens
      if (mergedLifetimePicanhas >= 3000) {
        ['lula', 'janja', 'nikolas', 'moraes', 'bolsonaro', 'dilma', 'marcal'].forEach(c => mergedUnlockedSet.add(c));
      }
      const mergedUnlocked = Array.from(mergedUnlockedSet);

      // Fusão de skins desbloqueadas
      const cloudSkins = Array.isArray(existingData.unlockedSkins) ? existingData.unlockedSkins : [];
      const localSkins = Array.isArray(unlockedSkins) ? unlockedSkins : [];
      const mergedSkins = Array.from(new Set([...cloudSkins, ...localSkins]));

      // Fusão de skins equipadas
      const mergedEquippedSkins = {
        ...(existingData.equippedSkins && typeof existingData.equippedSkins === 'object' ? existingData.equippedSkins : {}),
        ...(equippedSkins && typeof equippedSkins === 'object' ? equippedSkins : {})
      };

      // Tratamento do Avatar: prioriza novo avatar enviado válido, ou mantém o do banco
      const cleanAvatar = sanitizeAvatar(avatar);
      const finalAvatar = cleanAvatar || existingData.avatar || '';

      const updatedPayload = {
        username: existingData.username || cleanName,
        flappyScore: mergedFlappy,
        runnerScore: mergedRunner,
        dilmaScore: mergedDilma,
        nikolasScore: mergedNikolas,
        totalPicanhas: mergedPicanhas,
        lifetimePicanhas: mergedLifetimePicanhas,
        runnerCoins: mergedCoins,
        unlockedCharacters: mergedUnlocked,
        unlockedSkins: mergedSkins,
        equippedSkins: mergedEquippedSkins,
        prestigeLevel: mergedPrestige,
        loginStreak: (loginStreak && parseInt(loginStreak, 10) > 0)
          ? Math.max(parseInt(loginStreak, 10), existingData.loginStreak || 1)
          : (existingData.loginStreak || 1),
        lastLoginDate: lastLoginDate || existingData.lastLoginDate || '',
        dailyMissions: (dailyMissions && typeof dailyMissions === 'object' && Object.keys(dailyMissions).length > 0)
          ? dailyMissions
          : (existingData.dailyMissions || {}),
        avatar: finalAvatar,
        lastSync: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!existingData.createdAt) {
        updatedPayload.createdAt = (hasAdminCredentials && admin) ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
        updatedPayload.hasPassword = false;
      }

      if (userRef) {
        try {
          await userRef.set(updatedPayload, { merge: true });
        } catch (setErr) {
          console.warn('Aviso ao salvar lula_users_v2:', setErr.message);
        }
      }

      // Atualiza Documento Consolidado de Acumulados (Top 300)
      const updateAccumulatedLeaderboards = async () => {
        if (!hasAdminCredentials || !db) return;
        try {
          const updateBoard = async (docName, scoreValue) => {
            const lbRef = db.collection('lula_leaderboards_v2').doc(docName);
            const snap = await lbRef.get();
            let scoresList = [];
            if (snap.exists) {
              const data = snap.data();
              scoresList = Array.isArray(data.scores) ? data.scores : [];
            }
            const pKey = cleanName.toLowerCase();
            const exIdx = scoresList.findIndex(s => (s.player || '').toLowerCase() === pKey);
            if (exIdx !== -1) {
              scoresList[exIdx].score = scoreValue;
              if (finalAvatar) scoresList[exIdx].avatar = finalAvatar;
              if (mergedPrestige) scoresList[exIdx].prestigeLevel = mergedPrestige;
              scoresList[exIdx].updatedAt = new Date().toISOString();
            } else {
              scoresList.push({
                player: cleanName,
                score: scoreValue,
                avatar: finalAvatar,
                country: country || 'BR',
                prestigeLevel: mergedPrestige,
                updatedAt: new Date().toISOString()
              });
            }
            scoresList.sort((a, b) => b.score - a.score);
            await lbRef.set({
              game: docName,
              scores: scoresList.slice(0, 300),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          };

          if (mergedPicanhas > 0) await updateBoard('flappy_accumulated', mergedPicanhas);
          if (mergedCoins > 0) await updateBoard('runner_accumulated', mergedCoins);
        } catch (e) {
          console.warn('Aviso: falha ao atualizar ranking acumulado:', e);
        }
      };

      await updateAccumulatedLeaderboards();

      // Registra evento no Feed de Atividades caso haja novo recorde significativo
      const oldFlappy = existingData.flappyScore || 0;
      if (mergedFlappy >= 50 && mergedFlappy > oldFlappy && hasAdminCredentials && db) {
        try {
          await db.collection('lula_activity_feed').add({
            username: cleanName,
            avatar: finalAvatar,
            eventType: 'new_record',
            details: `Bateu recorde de ${mergedFlappy} pts no Flappy Lula! 🚀`,
            score: mergedFlappy,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch(e) {}
      }

      return res.status(200).json({
        success: true,
        user: {
          username: existingData.username || cleanName,
          hasPassword: !!existingData.hasPassword,
          flappyScore: mergedFlappy,
          runnerScore: mergedRunner,
          dilmaScore: mergedDilma,
          nikolasScore: mergedNikolas,
          totalPicanhas: mergedPicanhas,
          runnerCoins: mergedCoins,
          unlockedCharacters: mergedUnlocked,
          unlockedSkins: mergedSkins,
          equippedSkins: mergedEquippedSkins,
          prestigeLevel: mergedPrestige,
          loginStreak: updatedPayload.loginStreak,
          lastLoginDate: updatedPayload.lastLoginDate,
          dailyMissions: updatedPayload.dailyMissions,
          avatar: finalAvatar
        }
      });
    } catch (err) {
      console.error('❌ Erro na sincronização /api/sync:', err);
      return res.status(500).json({
        success: false,
        error: `Erro ao sincronizar dados: ${err.message || 'Falha no servidor.'}`
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
}
