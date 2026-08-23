// api/score.js — Vercel Serverless Function com documento consolidado único (1 leitura por consulta)
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

  const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';

  const sanitize = (str, maxLen = 30) => {
    if (!str || typeof str !== 'string') return 'Jogador';
    return str
      .replace(/<[^>]*>?/gm, '')
      .replace(/[^a-zA-Z0-9_\- .À-ÿ]/g, '')
      .trim()
      .slice(0, maxLen) || 'Jogador';
  };

  const sanitizeAvatar = (str) => {
    if (!str || typeof str !== 'string') return '';
    const trimmed = str.trim();
    if (trimmed.startsWith('data:image/') && trimmed.length <= 25000) {
      return trimmed;
    }
    if ((trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('img/')) && trimmed.length <= 500) {
      return trimmed;
    }
    return '';
  };

  const parseLeaderboardDoc = (doc) => {
    if (!doc || !doc.fields) return [];
    const rawValues = doc.fields?.scores?.arrayValue?.values || [];
    const list = rawValues.map(v => {
      const p = v.mapValue?.fields?.player?.stringValue || 'Anônimo';
      const s = parseInt(v.mapValue?.fields?.score?.integerValue || '0', 10);
      const u = v.mapValue?.fields?.updatedAt?.timestampValue || '';
      const a = v.mapValue?.fields?.avatar?.stringValue || '';
      return { player: sanitize(p, 25), score: s, updatedAt: u, avatar: sanitizeAvatar(a) };
    }).filter(item => !isNaN(item.score) && item.score > 0);

    list.sort((a, b) => b.score - a.score);
    return list;
  };

  const formatLeaderboardPayload = (game, scoresList) => {
    return {
      fields: {
        game: { stringValue: game },
        updatedAt: { timestampValue: new Date().toISOString() },
        scores: {
          arrayValue: {
            values: scoresList.slice(0, 300).map(s => {
              const fields = {
                player: { stringValue: sanitize(s.player, 25) },
                score: { integerValue: parseInt(s.score, 10).toString() },
                updatedAt: { timestampValue: s.updatedAt || new Date().toISOString() }
              };
              if (s.avatar && typeof s.avatar === 'string') {
                fields.avatar = { stringValue: sanitizeAvatar(s.avatar) };
              }
              return { mapValue: { fields } };
            })
          }
        }
      }
    };
  };

  // 1. GET: Consulta de 1 ÚNICA LEITURA no documento consolidado
  if (req.method === 'GET') {
    const { game = 'flappy', limit = 300 } = req.query;
    const cleanGame = game === 'runner' ? 'runner' : 'flappy';
    const leaderboardDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_leaderboards_v2/${cleanGame}`;

    try {
      // 1 Leitura no documento único consolidado
      const lbRes = await fetch(leaderboardDocUrl);
      if (lbRes.ok) {
        const doc = await lbRes.json();
        const scores = parseLeaderboardDoc(doc);
        const maxLimit = Math.min(300, Math.max(1, parseInt(limit, 10) || 300));
        return res.status(200).json({ success: true, count: scores.length, scores: scores.slice(0, maxLimit) });
      }

      // Se o documento ainda não existir (primeira execução), faz fallback/migração inicial
      if (lbRes.status === 404) {
        const fallbackCollection = cleanGame === 'runner' ? 'lula_runner_scores_v2' : 'lula_scores_v2';
        const seedUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${fallbackCollection}?pageSize=300`;
        const seedRes = await fetch(seedUrl);
        let initialScores = [];

        if (seedRes.ok) {
          const sData = await seedRes.json();
          if (sData.documents && sData.documents.length > 0) {
            const userMap = new Map();
            sData.documents.forEach(d => {
              const p = sanitize(d.fields?.player?.stringValue || d.name.split('/').pop(), 25);
              const s = parseInt(d.fields?.score?.integerValue || '0', 10);
              const u = d.fields?.updatedAt?.timestampValue || new Date().toISOString();
              if (s > 0 && s <= 50000) {
                const k = p.toLowerCase();
                if (!userMap.has(k) || s > userMap.get(k).score) {
                  userMap.set(k, { player: p, score: s, updatedAt: u });
                }
              }
            });
            initialScores = Array.from(userMap.values()).sort((a, b) => b.score - a.score).slice(0, 300);
          }
        }

        // Salva documento consolidado inicial
        if (initialScores.length > 0) {
          await fetch(leaderboardDocUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formatLeaderboardPayload(cleanGame, initialScores))
          }).catch(() => {});
        }

        const maxLimit = Math.min(300, Math.max(1, parseInt(limit, 10) || 300));
        return res.status(200).json({ success: true, count: initialScores.length, scores: initialScores.slice(0, maxLimit) });
      }

      return res.status(200).json({ success: true, scores: [] });
    } catch (err) {
      return res.status(200).json({ success: false, scores: [] });
    }
  }

  // 2. POST: Gravação Segura e Otimizada
  if (req.method === 'POST') {
    const { player, score, game = 'flappy', avatar = '' } = req.body || {};

    const cleanPlayer = sanitize(player, 25);
    const numScore = parseInt(score, 10);
    const cleanGame = game === 'runner' ? 'runner' : 'flappy';
    const cleanAvatar = sanitizeAvatar(avatar);

    if (!cleanPlayer || cleanPlayer.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome de jogador inválido' });
    }

    if (isNaN(numScore) || numScore <= 0 || numScore > 50000) {
      return res.status(400).json({ success: false, error: 'Pontuação fora dos limites permitidos' });
    }

    const collectionName = cleanGame === 'runner' ? 'lula_runner_scores_v2' : 'lula_scores_v2';
    const docId = encodeURIComponent(cleanPlayer.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

    try {
      // 1. Grava / Atualiza documento individual do jogador
      const userDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${docId}`;
      const userDocRes = await fetch(userDocUrl);
      let isNewPersonalRecord = true;
      let existingAvatar = '';

      if (userDocRes.ok) {
        const uDoc = await userDocRes.json();
        const existingScore = parseInt(uDoc.fields?.score?.integerValue || '0', 10);
        existingAvatar = sanitizeAvatar(uDoc.fields?.avatar?.stringValue || '');
        if (numScore <= existingScore) {
          isNewPersonalRecord = false;
        }
      }

      const finalAvatar = cleanAvatar || existingAvatar || '';

      if (isNewPersonalRecord || (cleanAvatar && cleanAvatar !== existingAvatar)) {
        const userFields = {
          player: { stringValue: cleanPlayer },
          score: { integerValue: numScore.toString() },
          updatedAt: { timestampValue: new Date().toISOString() }
        };
        if (finalAvatar) {
          userFields.avatar = { stringValue: finalAvatar };
        }

        await fetch(userDocUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: userFields })
        });
      }

      // 2. Atualiza Documento Consolidado (Top 300) se for elegível
      const leaderboardDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_leaderboards_v2/${cleanGame}`;
      const lbRes = await fetch(leaderboardDocUrl);
      let currentScores = [];

      if (lbRes.ok) {
        const lbDoc = await lbRes.json();
        currentScores = parseLeaderboardDoc(lbDoc);
      }

      const playerKey = cleanPlayer.toLowerCase();
      const existingIdx = currentScores.findIndex(s => s.player.toLowerCase() === playerKey);

      let shouldUpdateLeaderboard = false;

      if (existingIdx !== -1) {
        if (numScore > currentScores[existingIdx].score) {
          currentScores[existingIdx].score = numScore;
          currentScores[existingIdx].updatedAt = new Date().toISOString();
          if (finalAvatar) currentScores[existingIdx].avatar = finalAvatar;
          shouldUpdateLeaderboard = true;
        } else if (finalAvatar && currentScores[existingIdx].avatar !== finalAvatar) {
          currentScores[existingIdx].avatar = finalAvatar;
          shouldUpdateLeaderboard = true;
        }
      } else {
        const lowestScore = currentScores.length >= 300 ? currentScores[currentScores.length - 1].score : 0;
        if (currentScores.length < 300 || numScore > lowestScore) {
          currentScores.push({
            player: cleanPlayer,
            score: numScore,
            avatar: finalAvatar,
            updatedAt: new Date().toISOString()
          });
          shouldUpdateLeaderboard = true;
        }
      }

      if (shouldUpdateLeaderboard) {
        currentScores.sort((a, b) => b.score - a.score);
        const top300 = currentScores.slice(0, 300);
        await fetch(leaderboardDocUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formatLeaderboardPayload(cleanGame, top300))
        });
      }

      return res.status(200).json({ success: true, message: 'Recorde processado com sucesso' });
    } catch (e) {
      return res.status(200).json({ success: true, fallback: true });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido' });
}
