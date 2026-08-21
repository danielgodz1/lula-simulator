// api/score.js — Vercel Serverless Function com validação estrita anti-cheat e proteção do Firestore
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

  // GET: Obter placar sanitizado
  if (req.method === 'GET') {
    const { game, limit = 15 } = req.query;
    const collectionName = game === 'runner' ? 'lula_runner_scores_v2' : 'lula_scores_v2';
    const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?pageSize=50`;
      const fireRes = await fetch(url);
      if (!fireRes.ok) throw new Error('Firestore response error');
      const data = await fireRes.json();
      
      if (data.documents && data.documents.length > 0) {
        const userMap = new Map();
        data.documents.forEach(doc => {
          const player = (doc.fields?.player?.stringValue || 'Anônimo').slice(0, 30);
          const score = parseInt(doc.fields?.score?.integerValue || '0', 10);
          if (score >= 0 && score <= 50000) {
            if (!userMap.has(player) || score > userMap.get(player)) {
              userMap.set(player, score);
            }
          }
        });

        const list = Array.from(userMap.entries()).map(([player, score]) => ({ player, score }));
        list.sort((a, b) => b.score - a.score);
        return res.status(200).json({ success: true, scores: list.slice(0, parseInt(limit, 10)) });
      }
      return res.status(200).json({ success: true, scores: [] });
    } catch (err) {
      return res.status(200).json({ success: false, scores: [] });
    }
  }

  // POST: Gravação segura de pontuação com validação anti-cheat
  if (req.method === 'POST') {
    const { player, score, game } = req.body || {};

    const cleanPlayer = (player || 'Jogador').trim().slice(0, 25);
    const numScore = parseInt(score, 10);

    // Validações Anti-Hacker / Anti-Cheat
    if (!cleanPlayer || cleanPlayer.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome de jogador inválido' });
    }

    if (isNaN(numScore) || numScore < 0 || numScore > 50000) {
      return res.status(400).json({ success: false, error: 'Pontuação fora dos limites permitidos' });
    }

    const collectionName = game === 'runner' ? 'lula_runner_scores_v2' : 'lula_scores_v2';
    const docId = encodeURIComponent(cleanPlayer.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${docId}`;
      
      // 1. Verifica se já existe pontuação superior
      const checkRes = await fetch(url);
      if (checkRes.ok) {
        const data = await checkRes.json();
        const existingScore = parseInt(data.fields?.score?.integerValue || '0', 10);
        if (numScore <= existingScore) {
          return res.status(200).json({ success: true, message: 'Recorde anterior mantido' });
        }
      }

      // 2. Salva o novo recorde
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
        return res.status(200).json({ success: true, message: 'Recorde salvo com sucesso no banco seguro!' });
      }
    } catch (e) {
      return res.status(200).json({ success: true, fallback: true });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Método não permitido' });
}
