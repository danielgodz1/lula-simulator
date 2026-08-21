// js/security.js — Módulo de Segurança e Sanitização contra Script Injection (XSS) e Manipulação

// 1. Escapa caracteres perigosos para HTML Entities (Impede execução de script no navegador)
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 2. Sanitiza strings removendo tags HTML e caracteres maliciosos
export function sanitizeUsername(name, maxLen = 25) {
  if (!name || typeof name !== 'string') return 'Jogador';
  // Remove qualquer tag HTML ou código injetado
  let clean = name.replace(/<[^>]*>?/gm, '').replace(/[\r\n\t]/g, ' ').trim();
  // Permite apenas letras, números, espaços, hífens, sublinhados, pontos e acentos
  clean = clean.replace(/[^a-zA-Z0-9_\- .À-ÿ]/g, '');
  if (!clean) clean = 'Jogador';
  return clean.slice(0, maxLen);
}

// 3. Sanitiza comentários e mensagens longas
export function sanitizeMessage(text, maxLen = 500) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/<[^>]*>?/gm, '').trim().slice(0, maxLen);
}
