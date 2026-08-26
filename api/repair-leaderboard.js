// api/repair-leaderboard.js — Reconstrói os Leaderboards Gerais a partir dos Perfis de Usuários
// PROTEÇÃO: Requer chave secreta via query ?key=REPAIR_SECRET (env var na Vercel)
// USO:
//   GET  /api/repair-leaderboard?key=SUA_CHAVE  → dry-run: conta quantos usuários têm scores
//   POST /api/repair-leaderboard?key=SUA_CHAVE  → executa o repair e reconstrói os rankings
import { db, hasAdminCredentials } from './_firebaseAdmin.js';
import { applyCors } from './_cors.js';

function getFlagEmoji(countryCode) {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) return '🇧🇷';
  return String.fromCodePoint(
    ...countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0))
  );
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  // ── Proteção por chave secreta ─────────────────────────────────────────────
  const repairKey = process.env.REPAIR_SECRET;
  const providedKey = req.query.key;

  if (!repairKey) {
    return res.status(501).json({
      success: false,
      error: 'REPAIR_SECRET não configurado nas variáveis de ambiente da Vercel.'
    });
  }
  if (!providedKey || providedKey !== repairKey) {
    return res.status(403).json({ success: false, error: 'Chave de reparo inválida.' });
  }

  if (!hasAdminCredentials || !db) {
    return res.status(500).json({
      success: false,
      error: 'Admin SDK não inicializado. Verifique FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.'
    });
  }

  // ── GET: Dry-run — conta usuários sem modificar nada ──────────────────────
  if (req.method === 'GET') {
    try {
      const usersSnap = await db.collection('lula_users_v2').get();
      let flappyCount = 0, runnerCount = 0;
      usersSnap.forEach(doc => {
        const d = doc.data();
        if ((d.flappyScore || 0) > 0) flappyCount++;
        if ((d.runnerScore || 0) > 0) runnerCount++;
      });
      return res.status(200).json({
        success: true,
        dryRun: true,
        totalUsers: usersSnap.size,
        usersWithFlappyScore: flappyCount,
        usersWithRunnerScore: runnerCount,
        message: 'Faça POST neste endpoint com a mesma chave para executar o reparo.'
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // ── POST: Executa o repair ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      console.log('🔧 [repair-leaderboard] Iniciando reconstrução dos rankings...');

      // 1. Lê todos os perfis de usuário (Admin SDK ignora a regra allow list: false)
      const usersSnap = await db.collection('lula_users_v2').get();

      const flappyMap = new Map(); // key: username_lower → entry
      const runnerMap = new Map();

      usersSnap.forEach(doc => {
        const d = doc.data();
        if (!d.username) return;

        const username = d.username;
        const key = username.toLowerCase();
        const country = (d.country || 'BR').toUpperCase().slice(0, 2);
        const countryName = d.countryName || country;
        const flag = d.flag || getFlagEmoji(country);
        const avatar = d.avatar || '';
        const prestige = parseInt(d.prestigeLevel || 0, 10);
        const updatedAt = d.updatedAt
          ? (typeof d.updatedAt.toDate === 'function' ? d.updatedAt.toDate().toISOString() : d.updatedAt)
          : new Date().toISOString();

        const flappy = parseInt(d.flappyScore || 0, 10);
        if (flappy > 0) {
          const existing = flappyMap.get(key);
          if (!existing || flappy > existing.score) {
            flappyMap.set(key, { player: username, score: flappy, avatar, country, countryName, flag, prestigeLevel: prestige, updatedAt });
          }
        }

        const runner = parseInt(d.runnerScore || 0, 10);
        if (runner > 0) {
          const existing = runnerMap.get(key);
          if (!existing || runner > existing.score) {
            runnerMap.set(key, { player: username, score: runner, avatar, country, countryName, flag, prestigeLevel: prestige, updatedAt });
          }
        }
      });

      // 2. Também lê os docs individuais de score (lula_scores_v2, lula_runner_scores_v2)
      //    para cobrir usuários sem conta que tiveram score gravado antes
      try {
        const flappyScoresSnap = await db.collection('lula_scores_v2').get();
        flappyScoresSnap.forEach(doc => {
          const d = doc.data();
          if (!d.player || !d.score) return;
          const key = d.player.toLowerCase();
          const sc = parseInt(d.score, 10);
          if (sc > 0) {
            const existing = flappyMap.get(key);
            if (!existing || sc > existing.score) {
              flappyMap.set(key, {
                player: d.player,
                score: sc,
                avatar: d.avatar || '',
                country: d.country || 'BR',
                countryName: d.countryName || d.country || 'BR',
                flag: d.flag || getFlagEmoji(d.country || 'BR'),
                prestigeLevel: parseInt(d.prestigeLevel || 0, 10),
                updatedAt: d.updatedAt || new Date().toISOString()
              });
            }
          }
        });

        const runnerScoresSnap = await db.collection('lula_runner_scores_v2').get();
        runnerScoresSnap.forEach(doc => {
          const d = doc.data();
          if (!d.player || !d.score) return;
          const key = d.player.toLowerCase();
          const sc = parseInt(d.score, 10);
          if (sc > 0) {
            const existing = runnerMap.get(key);
            if (!existing || sc > existing.score) {
              runnerMap.set(key, {
                player: d.player,
                score: sc,
                avatar: d.avatar || '',
                country: d.country || 'BR',
                countryName: d.countryName || d.country || 'BR',
                flag: d.flag || getFlagEmoji(d.country || 'BR'),
                prestigeLevel: parseInt(d.prestigeLevel || 0, 10),
                updatedAt: d.updatedAt || new Date().toISOString()
              });
            }
          }
        });
      } catch (scoreDocErr) {
        console.warn('⚠️ Aviso ao ler coleções de score individuais:', scoreDocErr.message);
      }

      // 3. ⭐ MAIS IMPORTANTE: lê o leaderboard existente e mescla
      //    Garante que NENHUM dado já presente no ranking seja perdido.
      //    O repair é ADITIVO: só adiciona ou melhora scores, nunca remove.
      try {
        const mergeLeaderboardIntoMap = (map, existingScores) => {
          if (!Array.isArray(existingScores)) return;
          existingScores.forEach(s => {
            if (!s || !s.player || !s.score) return;
            const key = s.player.toLowerCase();
            const sc = typeof s.score === 'number' ? s.score : parseInt(s.score, 10);
            if (sc <= 0 || isNaN(sc)) return;
            const existing = map.get(key);
            if (!existing || sc > existing.score) {
              map.set(key, {
                player: s.player,
                score: sc,
                avatar: s.avatar || existing?.avatar || '',
                country: s.country || existing?.country || 'BR',
                countryName: s.countryName || existing?.countryName || s.country || 'BR',
                flag: s.flag || existing?.flag || getFlagEmoji(s.country || 'BR'),
                prestigeLevel: parseInt(s.prestigeLevel || existing?.prestigeLevel || 0, 10),
                updatedAt: s.updatedAt || new Date().toISOString()
              });
            } else if (existing && !existing.avatar && s.avatar) {
              // aproveita avatar do leaderboard se o mapa ainda não tem
              existing.avatar = s.avatar;
            }
          });
        };

        const [existingFlappySnap, existingRunnerSnap] = await Promise.all([
          db.collection('lula_leaderboards_v2').doc('flappy').get(),
          db.collection('lula_leaderboards_v2').doc('runner').get()
        ]);

        if (existingFlappySnap.exists) {
          mergeLeaderboardIntoMap(flappyMap, existingFlappySnap.data().scores || []);
        }
        if (existingRunnerSnap.exists) {
          mergeLeaderboardIntoMap(runnerMap, existingRunnerSnap.data().scores || []);
        }
      } catch (mergeErr) {
        console.warn('⚠️ Aviso ao mesclar leaderboard existente:', mergeErr.message);
      }

      // 4. Ordena e limita a 300 entradas
      const flappyList = Array.from(flappyMap.values()).sort((a, b) => b.score - a.score).slice(0, 300);
      const runnerList = Array.from(runnerMap.values()).sort((a, b) => b.score - a.score).slice(0, 300);

      const now = new Date().toISOString();

      // 5. Grava os documentos consolidados (mescla de todas as fontes)
      await Promise.all([
        db.collection('lula_leaderboards_v2').doc('flappy').set({
          game: 'flappy',
          updatedAt: now,
          repairedAt: now,
          scores: flappyList
        }),
        db.collection('lula_leaderboards_v2').doc('runner').set({
          game: 'runner',
          updatedAt: now,
          repairedAt: now,
          scores: runnerList
        })
      ]);

      console.log(`✅ [repair-leaderboard] Concluído: flappy=${flappyList.length}, runner=${runnerList.length}`);

      return res.status(200).json({
        success: true,
        message: 'Rankings reconstruídos com sucesso! Dados existentes preservados e mesclados.',
        repairedAt: now,
        flappy: {
          totalEntries: flappyList.length,
          top5: flappyList.slice(0, 5).map(s => `${s.player}: ${s.score}`)
        },
        runner: {
          totalEntries: runnerList.length,
          top5: runnerList.slice(0, 5).map(s => `${s.player}: ${s.score}`)
        }
      });
    } catch (e) {
      console.error('❌ [repair-leaderboard] Erro:', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido. Use GET (dry-run) ou POST (executar).' });
}
