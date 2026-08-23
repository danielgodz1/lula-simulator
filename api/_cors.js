// api/_cors.js — Controle de Origem Restrito e Seguro (CORS) para Vercel Serverless Functions

const ALLOWED_ORIGINS = [
  'https://lulasimulator.com.br',
  'https://www.lulasimulator.com.br',
  'https://lula-simulator.vercel.app'
];

const LOCALHOST_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Aplica os cabeçalhos de CORS restritos.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} Retorna true se for uma requisição OPTIONS já respondida
 */
export function applyCors(req, res) {
  const origin = req.headers.origin;

  if (origin && (ALLOWED_ORIGINS.includes(origin) || LOCALHOST_REGEX.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://lulasimulator.com.br');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PATCH,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Session-Token, X-Firebase-AppCheck'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}
