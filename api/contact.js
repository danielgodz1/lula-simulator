// api/contact.js — Vercel Serverless Function com Resend Email e Firestore
import { Resend } from 'resend';
import admin, { db } from './_firebaseAdmin.js';
import { applyCors } from './_cors.js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

  // 1. Salva no Firestore
  try {
    await db.collection('lula_contact_messages').add({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      ip,
      userAgent: req.headers['user-agent'] || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (dbErr) {
    console.warn('⚠️ Aviso ao gravar contato no Firestore:', dbErr);
  }

  // 2. Envia e-mail via Resend
  if (resend) {
    try {
      const recipient = process.env.CONTACT_EMAIL || 'insanodanieldoublegaming@gmail.com';
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: recipient,
        reply_to: cleanEmail || undefined,
        subject: `Novo contato: ${cleanSubject || cleanName}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #009c3b; margin: 0; font-size: 22px;">📬 Nova Mensagem de Contato</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Lula Simulator Oficial</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tr style="background: #f8fafc;">
                <td style="padding: 10px 12px; font-weight: bold; width: 110px; color: #475569; border-bottom: 1px solid #e2e8f0;">Nome:</td>
                <td style="padding: 10px 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${cleanName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0;">E-mail:</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${cleanEmail}" style="color: #0284c7; text-decoration: none;">${cleanEmail || 'Não informado'}</a></td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0;">Assunto:</td>
                <td style="padding: 10px 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${cleanSubject || 'Sem Assunto'}</td>
              </tr>
            </table>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #009c3b; margin: 18px 0;">
              <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Mensagem:</div>
              <p style="white-space: pre-wrap; margin: 0; color: #1e293b; font-size: 14px;">${cleanMessage}</p>
            </div>
            <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 20px; text-align: center;">
              Enviado automaticamente pelo formulário de contato do <a href="https://www.lulasimulator.com.br" style="color: #009c3b;">Lula Simulator</a> em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.
            </div>
          </div>
        `
      });
    } catch (err) {
      console.error('❌ Erro no envio de e-mail via Resend (/api/contact):', err);
    }
  } else {
    console.warn('⚠️ RESEND_API_KEY não encontrada nas variáveis de ambiente.');
  }

  return res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso!' });
}
