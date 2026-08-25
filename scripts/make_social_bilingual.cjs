// scripts/make_social_bilingual.cjs — Injeta suporte bilíngue completo no js/social-manager.js

const fs = require('fs');

let code = fs.readFileSync('js/social-manager.js', 'utf8');

function isEn() {
  return typeof window !== 'undefined' && (window.location.pathname.startsWith('/en/') || window.location.hostname.includes('flappylula.com'));
}

if (!code.includes('function isEnglishContext()')) {
  code = code.replace(
    "class SocialManager {",
    `function isEnglishContext() {\n  return typeof window !== 'undefined' && (window.location.pathname.startsWith('/en/') || window.location.hostname.includes('flappylula.com'));\n}\n\nclass SocialManager {`
  );
}

// 1. Notificações dropdown
code = code.replace(
  "Nenhuma notificação nova no momento. 📭",
  "${isEnglishContext() ? 'No new notifications at the moment. 📭' : 'Nenhuma notificação nova no momento. 📭'}"
);

// 2. Feed de Atividades
code = code.replace(
  "Aguardando novos recordes e duelos da comunidade... ⚡",
  "${isEnglishContext() ? 'Waiting for new community records and duels... ⚡' : 'Aguardando novos recordes e duelos da comunidade... ⚡'}"
);
code = code.replace(
  "${isDuel ? '⚔️ DUELO' : '⭐ RECORDE'}",
  "${isDuel ? (isEnglishContext() ? '⚔️ DUEL' : '⚔️ DUELO') : (isEnglishContext() ? '⭐ RECORD' : '⭐ RECORDE')}"
);

// 3. Fallback do Torneio
code = code.replace(
  "name: 'Copa Brasília · Edição Semanal Oficial',",
  "name: isEnglishContext() ? 'Brasília Cup · Official Weekly Tournament' : 'Copa Brasília · Edição Semanal Oficial',"
);

fs.writeFileSync('js/social-manager.js', code, 'utf8');
console.log('✔ js/social-manager.js bilingue atualizado!');
