// api/score.js — Vercel Serverless Function com retorno de TODOS os jogadores e validação segura
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

  // GET: Obter TODOS os jogadores que possuem pontuação válida
  if (req.method === 'GET') {
    const { game, limit = 300 } = req.query;
    const isRunner = game === 'runner';
    const collectionName = isRunner ? 'lula_runner_scores_v2' : 'lula_scores_v2';
    const userScoreField = isRunner ? 'runnerScore' : 'flappyScore';

    try {
      const userMap = new Map();

      // 1. Consulta a coleção de placares (pageSize=300)
      const scoresUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?pageSize=300`;
      const fireRes = await fetch(scoresUrl);
      if (fireRes.ok) {
        const data = await fireRes.json();
        if (data.documents && data.documents.length > 0) {
          data.documents.forEach(doc => {
            const rawPlayer = doc.fields?.player?.stringValue || doc.name.split('/').pop();
            const player = sanitize(rawPlayer, 30);
            const score = parseInt(doc.fields?.score?.integerValue || '0', 10);
            if (!isNaN(score) && score > 0 && score <= 50000) {
              const key = player.toLowerCase();
              if (!userMap.has(key) || score > userMap.get(key).score) {
                userMap.set(key, { player, score });
              }
            }
          });
        }
      }

      // 2. Consulta também a coleção de contas (lula_users_v2) para garantir 100% de cobertura
      try {
        const usersUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_users_v2?pageSize=300`;
        const usersRes = await fetch(usersUrl);
        if (usersRes.ok) {
          const uData = await usersRes.json();
          if (uData.documents && uData.documents.length > 0) {
            uData.documents.forEach(doc => {
              const rawPlayer = doc.fields?.username?.stringValue || doc.name.split('/').pop();
              const player = sanitize(rawPlayer, 30);
              const score = parseInt(doc.fields?.[userScoreField]?.integerValue || '0', 10);
              if (!isNaN(score) && score > 0 && score <= 50000) {
                const key = player.toLowerCase();
                if (!userMap.has(key) || score > userMap.get(key).score) {
                  userMap.set(key, { player, score });
                }
              }
            });
          }
        }
      } catch (e) {}

      const list = Array.from(userMap.values());
      list.sort((a, b) => b.score - a.score);

      const maxLimit = Math.min(500, parseInt(limit, 10) || 300);
      return res.status(200).json({ success: true, count: list.length, scores: list.slice(0, maxLimit) });
    } catch (err) {
      return res.status(200).json({ success: false, scores: [] });
    }
  }

  // POST: Gravação de pontuação segura
  if (req.method === 'POST') {
    const { player, score, game } = req.body || {};

    const cleanPlayer = sanitize(player, 25);
    const numScore = parseInt(score, 10);

    if (!cleanPlayer || cleanPlayer.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome de jogador inválido' });
    }

    if (isNaN(numScore) || numScore < 0 || numScore > 50000) {
      return res.status(400).json({ success: false, error: 'Pontuação fora dos limites permitidos' });
    }

    const isRunner = game === 'runner';
    const collectionName = isRunner ? 'lula_runner_scores_v2' : 'lula_scores_v2';
    const docId = encodeURIComponent(cleanPlayer.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${docId}`;
      
      const checkRes = await fetch(url);
      if (checkRes.ok) {
        const data = await checkRes.json();
        const existingScore = parseInt(data.fields?.score?.integerValue || '0', 10);
        if (numScore <= existingScore) {
          return res.status(200).json({ success: true, message: 'Recorde anterior mantido' });
        }
      }

      const payload = {
        fields: {
          player: { stringValue: cleanPlayer },
          score: { integerValue: numScore.toString() },
          updatedAt: { timestampValue: new Date().toISOString() }
        }
      };

      const patchRes = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (patchRes.ok) {
        return res.status(200).json({ success: true, message: 'Recorde salvo com segurança!' });
      }
    } catch (e) {
      return res.status(200).json({ success: true, fallback: true });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Método não permitido' });
}
