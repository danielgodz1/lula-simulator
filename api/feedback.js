// api/feedback.js — Vercel Serverless Function com Firebase Admin SDK, sanitização total contra Script Injection (XSS), CORS restrito e Proteção Anti-Spam
import admin, { db, hasAdminCredentials } from './_firebaseAdmin.js';
import { Resend } from 'resend';
import { applyCors } from './_cors.js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Memória local para rate limit básico de feedback (máx 6 envios em 10 min por IP)
const feedbackRateLimits = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🇧🇷';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🇧🇷';
  }
}

const COUNTRY_NAMES = {
  BR: 'Brasil',
  US: 'Estados Unidos',
  PT: 'Portugal',
  JP: 'Japão',
  AR: 'Argentina',
  DE: 'Alemanha',
  FR: 'França',
  GB: 'Reino Unido',
  IT: 'Itália',
  ES: 'Espanha',
  CA: 'Canadá',
  MX: 'México',
  UY: 'Uruguai',
  CL: 'Chile',
  PY: 'Paraguai'
};

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
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit || '30', 10)));
    try {
      if (hasAdminCredentials && db) {
        try {
          const snap = await db.collection('lula_feedbacks')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

          if (!snap.empty) {
            const feedbacks = snap.docs.map(doc => {
              const data = doc.data() || {};
              const country = sanitizeStr(data.country || 'BR', 5).toUpperCase();
              let createdAtStr = '';
              if (data.createdAt) {
                if (typeof data.createdAt.toDate === 'function') {
                  createdAtStr = data.createdAt.toDate().toISOString();
                } else if (typeof data.createdAt === 'string') {
                  createdAtStr = data.createdAt;
                } else if (data.createdAt._seconds) {
                  createdAtStr = new Date(data.createdAt._seconds * 1000).toISOString();
                }
              }
              return {
                id: doc.id,
                name: sanitizeStr(data.name || 'Anônimo', 40),
                stars: Math.max(1, Math.min(5, parseInt(data.stars || 5, 10))),
                comment: sanitizeStr(data.comment || data.message || '', 500),
                createdAt: createdAtStr || new Date().toISOString(),
                country: country,
                countryName: sanitizeStr(data.countryName || COUNTRY_NAMES[country] || 'Brasil', 40),
                flag: sanitizeStr(data.flag || getCountryFlag(country), 10)
              };
            }).filter(fb => fb.comment.length > 0);

            return res.status(200).json({ success: true, feedbacks });
          }
        } catch (adminErr) {
          console.warn('Aviso: Fallback Firestore REST no GET:', adminErr.message);
        }
      }

      // Fallback REST
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_feedbacks?pageSize=${limit}`;
      const fireRes = await fetch(url);
      if (fireRes.ok) {
        const data = await fireRes.json();
        if (data.documents && data.documents.length > 0) {
          const feedbacks = data.documents
            .map(doc => {
              const country = sanitizeStr(doc.fields?.country?.stringValue || 'BR', 5).toUpperCase();
              return {
                name: sanitizeStr(doc.fields?.name?.stringValue || 'Anônimo', 40),
                stars: Math.max(1, Math.min(5, parseInt(doc.fields?.stars?.integerValue || '5', 10))),
                comment: sanitizeStr(doc.fields?.comment?.stringValue || doc.fields?.message?.stringValue || '', 500),
                createdAt: doc.fields?.createdAt?.timestampValue || '',
                country: country,
                countryName: sanitizeStr(doc.fields?.countryName?.stringValue || COUNTRY_NAMES[country] || 'Brasil', 40),
                flag: sanitizeStr(doc.fields?.flag?.stringValue || getCountryFlag(country), 10)
              };
            })
            .filter(fb => fb.comment.length > 0);
          return res.status(200).json({ success: true, feedbacks });
        }
      }
      return res.status(200).json({ success: true, feedbacks: [] });
    } catch (e) {
      console.error('❌ Erro ao consultar feedbacks:', e);
      return res.status(200).json({ success: true, feedbacks: [] });
    }
  }

  if (req.method === 'POST') {
    const { name, stars, comment, message, country, countryName, flag, _gotcha, botField } = req.body || {};

    // Honeypot anti-bot
    if (_gotcha || botField) {
      return res.status(200).json({ success: true, message: 'Avaliação enviada com sucesso!' });
    }

    const cleanName = sanitizeStr(name, 40) || 'Anônimo';
    const cleanComment = sanitizeStr(comment || message, 500);
    const numStars = Math.max(1, Math.min(5, parseInt(stars || 5, 10)));

    if (!cleanComment || cleanComment.length < 2) {
      return res.status(400).json({ success: false, error: 'O comentário não pode ser vazio.' });
    }

    const headerCountry = (req.headers['x-vercel-ip-country'] || '').toUpperCase();
    const cleanCountry = sanitizeStr(country || headerCountry || 'BR', 5).toUpperCase();
    const cleanFlag = sanitizeStr(flag || getCountryFlag(cleanCountry), 10);
    const cleanCountryName = sanitizeStr(countryName || COUNTRY_NAMES[cleanCountry] || cleanCountry, 40);

    // Rate limiting por IP
    const ip = getClientIp(req);
    const now = Date.now();
    const limit = feedbackRateLimits.get(ip) || { count: 0, first: now };
    if (now - limit.first > 10 * 60 * 1000) {
      feedbackRateLimits.set(ip, { count: 1, first: now });
    } else {
      limit.count += 1;
      if (limit.count > 10) {
        return res.status(429).json({
          success: false,
          error: 'Muitas avaliações enviadas recentemente. Por favor aguarde um momento.'
        });
      }
    }

    try {
      const feedbackPayload = {
        name: cleanName,
        stars: numStars,
        comment: cleanComment,
        country: cleanCountry,
        countryName: cleanCountryName,
        flag: cleanFlag,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      let saved = false;

      if (hasAdminCredentials && db) {
        try {
          await db.collection('lula_feedbacks').add(feedbackPayload);
          saved = true;
        } catch (adminErr) {
          console.warn('Aviso: Fallback Firestore REST no POST:', adminErr.message);
        }
      }

      if (!saved) {
        // Fallback REST
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/lula_feedbacks`;
        const payload = {
          fields: {
            name: { stringValue: cleanName },
            stars: { integerValue: numStars.toString() },
            comment: { stringValue: cleanComment },
            country: { stringValue: cleanCountry },
            countryName: { stringValue: cleanCountryName },
            flag: { stringValue: cleanFlag },
            createdAt: { timestampValue: new Date().toISOString() }
          }
        };

        const fireRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (fireRes.ok) {
          saved = true;
        }
      }

      // Notificação opcional por e-mail via Resend
      const recipient = process.env.CONTACT_EMAIL;
      if (resend && recipient) {
        try {
          resend.emails.send({
            from: 'onboarding@resend.dev',
            to: recipient,
            subject: `Nova Avaliação ⭐ ${numStars}/5 — ${cleanName}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <h3 style="color: #009c3b; margin-top: 0;">⭐ Nova Avaliação no Lula Simulator</h3>
                <p><strong>Jogador:</strong> ${cleanName} (${cleanFlag} ${cleanCountryName})</p>
                <p><strong>Nota:</strong> ${'⭐'.repeat(numStars)} (${numStars}/5)</p>
                <div style="background: #f8fafc; padding: 12px; border-left: 4px solid #ffdf00; border-radius: 6px;">
                  <p style="margin: 0; font-style: italic;">"${cleanComment}"</p>
                </div>
              </div>
            `
          }).catch(err => console.error('Erro Resend Feedback:', err));
        } catch(e) {}
      }

      return res.status(200).json({ success: true, message: 'Avaliação enviada com sucesso!' });
    } catch (e) {
      console.error('❌ Falha ao salvar feedback:', e);
      return res.status(500).json({
        success: false,
        error: `Erro ao registrar avaliação: ${e.message || 'Falha no banco de dados.'}`
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
}
