// api/start-session.js — Emissão Segura de Tokens de Sessão de Partida Assinados com HMAC-SHA256
import crypto from 'crypto';
import { applyCors } from './_cors.js';

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.FIREBASE_PRIVATE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.error('🚨 ERRO CRÍTICO: Defina a variável SESSION_SECRET ou FIREBASE_PRIVATE_KEY no painel da Vercel!');
      return null;
    }
    return 'lula_dev_session_secret_local_only';
  }
  return secret;
}

function sanitize(str, maxLen = 30) {
  if (!str || typeof str !== 'string') return 'Jogador';
  return str
    .replace(/<[^>]*>?/gm, '')
    .replace(/[^a-zA-Z0-9_\- .À-ÿ]/g, '')
    .trim()
    .slice(0, maxLen) || 'Jogador';
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  const secret = getSessionSecret();
  if (!secret) {
    return res.status(500).json({
      success: false,
      error: 'Servidor não configurado com segredo de sessão (SESSION_SECRET / FIREBASE_PRIVATE_KEY ausente).'
    });
  }

  const { game = 'flappy', player = 'Jogador' } = req.body || {};
  const cleanGame = game === 'runner' ? 'runner' : 'flappy';
  const cleanPlayer = sanitize(player, 25);

  const payload = {
    game: cleanGame,
    player: cleanPlayer,
    t: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex')
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('base64url');

  const sessionToken = `${payloadStr}.${signature}`;

  return res.status(200).json({
    success: true,
    sessionToken,
    expiresInSec: 600 // 10 minutos de validade
  });
}
