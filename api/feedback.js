// api/feedback.js — Vercel Serverless Function para avaliações e comentários seguros
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

  if (req.method === 'GET') {
    const limit = parseInt(req.query.limit || '20', 10);
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_feedbacks?pageSize=${limit}`;
      const fireRes = await fetch(url);
      if (!fireRes.ok) throw new Error('Firestore response error');
      const data = await fireRes.json();
      if (data.documents && data.documents.length > 0) {
        const feedbacks = data.documents.map(doc => ({
          name: (doc.fields?.name?.stringValue || 'Anônimo').slice(0, 40),
          stars: Math.max(1, Math.min(5, parseInt(doc.fields?.stars?.integerValue || '5', 10))),
          comment: (doc.fields?.comment?.stringValue || '').slice(0, 500),
          createdAt: doc.fields?.createdAt?.timestampValue || ''
        }));
        return res.status(200).json({ success: true, feedbacks });
      }
      return res.status(200).json({ success: true, feedbacks: [] });
    } catch (e) {
      return res.status(200).json({ success: false, feedbacks: [] });
    }
  }

  if (req.method === 'POST') {
    const { name, stars, comment } = req.body || {};

    const cleanName = (name || 'Anônimo').trim().slice(0, 40);
    const cleanComment = (comment || '').trim().slice(0, 500);
    const numStars = Math.max(1, Math.min(5, parseInt(stars || 5, 10)));

    if (!cleanComment) {
      return res.status(400).json({ success: false, error: 'O comentário não pode ser vazio' });
    }

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_feedbacks`;
      const payload = {
        fields: {
          name: { stringValue: cleanName },
          stars: { integerValue: numStars.toString() },
          comment: { stringValue: cleanComment },
          createdAt: { timestampValue: new Date().toISOString() }
        }
      };

      const fireRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (fireRes.ok) {
        return res.status(200).json({ success: true, message: 'Avaliação enviada com sucesso!' });
      }
    } catch (e) {
      return res.status(200).json({ success: true, fallback: true });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Método não permitido' });
}
