// api/feedback.js — Vercel Serverless Function com sanitização total contra Script Injection (XSS), CORS restrito e Proteção Anti-Spam
import { applyCors } from './_cors.js';

// Memória local para rate limit básico de feedback (máx 6 envios em 10 min por IP)
const feedbackRateLimits = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'motoai-43ed4';

  const sanitizeStr = (str, maxLen = 100) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/<[^>]*>?/gm, '')
      .replace(/[\r\n\t]/g, ' ')
      .trim()
      .slice(0, maxLen);
  };

  if (req.method === 'GET') {
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_feedbacks?pageSize=${limit}`;
      const fireRes = await fetch(url);
      if (!fireRes.ok) throw new Error('Firestore response error');
      const data = await fireRes.json();
      if (data.documents && data.documents.length > 0) {
        const feedbacks = data.documents.map(doc => ({
          name: sanitizeStr(doc.fields?.name?.stringValue || 'Anônimo', 40),
          stars: Math.max(1, Math.min(5, parseInt(doc.fields?.stars?.integerValue || '5', 10))),
          comment: sanitizeStr(doc.fields?.comment?.stringValue || '', 500),
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
    const { name, stars, comment, _gotcha, botField } = req.body || {};

    // Honeypot anti-bot
    if (_gotcha || botField) {
      return res.status(200).json({ success: true, message: 'Avaliação enviada com sucesso!' });
    }

    const cleanName = sanitizeStr(name, 40) || 'Anônimo';
    const cleanComment = sanitizeStr(comment, 500);
    const numStars = Math.max(1, Math.min(5, parseInt(stars || 5, 10)));

    if (!cleanComment) {
      return res.status(400).json({ success: false, error: 'O comentário não pode ser vazio.' });
    }

    // Rate limiting por IP
    const ip = getClientIp(req);
    const now = Date.now();
    const limit = feedbackRateLimits.get(ip) || { count: 0, first: now };
    if (now - limit.first > 10 * 60 * 1000) {
      feedbackRateLimits.set(ip, { count: 1, first: now });
    } else {
      limit.count += 1;
      if (limit.count > 6) {
        return res.status(429).json({
          success: false,
          error: 'Muitas avaliações enviadas recentemente. Por favor aguarde um momento.'
        });
      }
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

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
}
