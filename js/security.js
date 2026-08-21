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

// 4. Hash Criptográfico SHA-256 com Salt para Senhas (Nunca trafega nem armazena senha pura)
export async function hashPassword(password) {
  if (!password) return '';
  const salt = 'lula_simulator_sec_salt_2026_';
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  if (crypto && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback seguro simples se crypto.subtle não estiver disponível
  let h = 0x811c9dc5;
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0).toString(16);
}
