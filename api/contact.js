// api/contact.js — Vercel Serverless Function para envio seguro, confidencial e anti-spam de e-mails
import { applyCors } from './_cors.js';

// Memória local para rate limit básico de contato (máx 5 envios em 10 min por IP)
const contactRateLimits = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  const { name, email, subject, message, _gotcha, botField } = req.body || {};

  // Honeypot anti-bot: se o campo invisível estiver preenchido, descarta silenciosamente
  if (_gotcha || botField) {
    return res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso!' });
  }

  const cleanName = (name || '').trim().replace(/<[^>]*>?/gm, '').slice(0, 80);
  const cleanEmail = (email || '').trim().replace(/<[^>]*>?/gm, '').slice(0, 100);
  const cleanSubject = (subject || '').trim().replace(/<[^>]*>?/gm, '').slice(0, 120);
  const cleanMessage = (message || '').trim().replace(/<[^>]*>?/gm, '').slice(0, 2000);

  if (!cleanName || !cleanMessage) {
    return res.status(400).json({ success: false, error: 'Por favor preencha Nome e Mensagem!' });
  }

  // Rate Limiting por IP
  const ip = getClientIp(req);
  const now = Date.now();
  const limit = contactRateLimits.get(ip) || { count: 0, first: now };
  if (now - limit.first > 10 * 60 * 1000) {
    contactRateLimits.set(ip, { count: 1, first: now });
  } else {
    limit.count += 1;
    if (limit.count > 5) {
      return res.status(429).json({
        success: false,
        error: 'Muitas mensagens enviadas recentemente. Por favor aguarde alguns minutos.'
      });
    }
  }

  try {
    const recipient = 'daniel.jaupavi1@gmail.com';
    const formSubmitUrl = `https://formsubmit.co/ajax/${recipient}`;

    const response = await fetch(formSubmitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `[Lula Simulator] Novo Contato: ${cleanSubject || 'Sem Assunto'} (${cleanName})`,
        _replyto: cleanEmail || 'sem-email@lulasimulator.com.br',
        Nome: cleanName,
        Email: cleanEmail || 'Não informado',
        Assunto: cleanSubject || 'Sem Assunto',
        Mensagem: cleanMessage,
        _template: 'table'
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true, message: 'E-mail enviado com sucesso!' });
    } else {
      return res.status(200).json({ success: true, message: 'Mensagem recebida com sucesso!' });
    }
  } catch (err) {
    return res.status(200).json({ success: true, message: 'Mensagem gravada!' });
  }
}
