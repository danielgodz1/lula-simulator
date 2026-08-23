// api/sync.js — Sincronização Inteligente Bidirecional de Perfil, Recordes e Avatares com Firebase Admin SDK
import admin, { db } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
      totalPicanhas = 0,
      runnerCoins = 0,
      unlockedCharacters = [],
      avatar = ''
    } = req.body || {};

    const cleanName = sanitizeName(username);
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome de usuário inválido.' });
    }

    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const userRef = db.collection('lula_users_v2').doc(normalizedName);

    try {
      const userSnap = await userRef.get();
      const existingData = userSnap.exists ? userSnap.data() : {};

      const localFlappy = Math.max(0, parseInt(flappyScore || 0, 10));
      const localRunner = Math.max(0, parseInt(runnerScore || 0, 10));
      const localDilma = Math.max(0, parseInt(dilmaScore || 0, 10));
      const localPicanhas = Math.max(0, parseInt(totalPicanhas || 0, 10));
      const localCoins = Math.max(0, parseInt(runnerCoins || 0, 10));

      const cloudFlappy = Math.max(0, parseInt(existingData.flappyScore || 0, 10));
      const cloudRunner = Math.max(0, parseInt(existingData.runnerScore || 0, 10));
      const cloudDilma = Math.max(0, parseInt(existingData.dilmaScore || 0, 10));
      const cloudPicanhas = Math.max(0, parseInt(existingData.totalPicanhas || 0, 10));
      const cloudCoins = Math.max(0, parseInt(existingData.runnerCoins || 0, 10));

      // Fusão segura: sempre o maior valor entre Local e Cloud
      const mergedFlappy = Math.max(localFlappy, cloudFlappy);
      const mergedRunner = Math.max(localRunner, cloudRunner);
      const mergedDilma = Math.max(localDilma, cloudDilma);
      const mergedPicanhas = Math.max(localPicanhas, cloudPicanhas);
      const mergedCoins = Math.max(localCoins, cloudCoins);

      // Fusão de personagens desbloqueados (unifica arrays)
      const cloudUnlocked = Array.isArray(existingData.unlockedCharacters) ? existingData.unlockedCharacters : [];
      const localUnlocked = Array.isArray(unlockedCharacters) ? unlockedCharacters : [];
      const mergedUnlockedSet = new Set([...cloudUnlocked, ...localUnlocked]);

      // Se dilmaScore >= 200, garante desbloqueio do Pablo Marçal
      if (mergedDilma >= 200) {
        mergedUnlockedSet.add('marcal');
      }
      const mergedUnlocked = Array.from(mergedUnlockedSet);

      // Tratamento do Avatar: prioriza novo avatar enviado válido, ou mantém o do banco
      const cleanAvatar = sanitizeAvatar(avatar);
      const finalAvatar = cleanAvatar || existingData.avatar || '';

      const updatedPayload = {
        username: existingData.username || cleanName,
        flappyScore: mergedFlappy,
        runnerScore: mergedRunner,
        dilmaScore: mergedDilma,
        totalPicanhas: mergedPicanhas,
        runnerCoins: mergedCoins,
        unlockedCharacters: mergedUnlocked,
        avatar: finalAvatar,
        lastSync: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!userSnap.exists) {
        updatedPayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
        updatedPayload.hasPassword = false;
      }

      await userRef.set(updatedPayload, { merge: true });

      // Propaga o avatar atualizado para os placares e rankings consolidados
      if (finalAvatar) {
        const updateLeaderboardAvatar = async (gameType) => {
          try {
            const lbRef = db.collection('lula_leaderboards_v2').doc(gameType);
            const snap = await lbRef.get();
            if (!snap.exists) return;
            const data = snap.data();
            const scores = Array.isArray(data.scores) ? data.scores : [];
            let changed = false;
            const updated = scores.map(item => {
              if (item && item.player && item.player.toLowerCase() === cleanName.toLowerCase()) {
                changed = true;
                return { ...item, avatar: finalAvatar };
              }
              return item;
            });
            if (changed) {
              await lbRef.set({ scores: updated, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            }
          } catch (e) {
            console.warn(`Aviso: falha ao atualizar avatar no ranking ${gameType}:`, e);
          }
        };

        const updateScoreDocs = async () => {
          try {
            const fScoreRef = db.collection('lula_scores_v2').doc(normalizedName);
            const rScoreRef = db.collection('lula_runner_scores_v2').doc(normalizedName);
            await Promise.allSettled([
              fScoreRef.set({ avatar: finalAvatar, player: cleanName }, { merge: true }),
              rScoreRef.set({ avatar: finalAvatar, player: cleanName }, { merge: true }),
              updateLeaderboardAvatar('flappy'),
              updateLeaderboardAvatar('runner')
            ]);
          } catch(e) {}
        };

        await updateScoreDocs();
      }

      return res.status(200).json({
        success: true,
        user: {
          username: existingData.username || cleanName,
          hasPassword: !!existingData.hasPassword,
          flappyScore: mergedFlappy,
          runnerScore: mergedRunner,
          dilmaScore: mergedDilma,
          totalPicanhas: mergedPicanhas,
          runnerCoins: mergedCoins,
          unlockedCharacters: mergedUnlocked,
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
