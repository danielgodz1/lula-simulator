// scripts/fix_en_navbars.cjs — Padroniza a barra de navegação 100% em inglês em todas as páginas de /en/

const fs = require('fs');
const path = require('path');

const enNavMap = [
  { pt: '>Início<', en: '>Home<' },
  { pt: '>🐦 Flappy Lula<', en: '>🐦 Flappy Lula<' },
  { pt: '>🏃 Empresário 3D<', en: '>🏃 3D Runner<' },
  { pt: '>👥 Social & Duelos<', en: '>👥 Social & Duels<' },
  { pt: '>🛍️ Loja de Skins<', en: '>🛍️ Skin Shop<' },
  { pt: '>🏅 Conquistas<', en: '>🏅 Achievements<' },
  { pt: '>🏆 Ranking<', en: '>🏆 Leaderboard<' },
  { pt: '>🌍 Visitantes<', en: '>🌍 Visitors<' },
  { pt: '>⭐ Feedbacks<', en: '>⭐ Feedback<' },
  { pt: '>⭐ Avaliações<', en: '>⭐ Feedback<' },
  { pt: '>Avaliações<', en: '>Feedback<' },
  { pt: '>Tráfego<', en: '>Visitors<' },
  { pt: '>Contato<', en: '>Contact<' },
  { pt: '>📬 Contato<', en: '>📬 Contact<' },
  { pt: '🇧🇷 LULA SIMULATOR', en: '🐦 FLAPPY LULA' }
];

const files = fs.readdirSync('en').filter(f => f.endsWith('.html'));

for (const f of files) {
  const fullPath = path.join('en', f);
  let content = fs.readFileSync(fullPath, 'utf8');

  for (const item of enNavMap) {
    content = content.replace(new RegExp(item.pt, 'g'), item.en);
  }

  // Garante que o menu toggle diga "☰ Menu" e aria-label esteja em inglês
  content = content.replace('aria-label="Menu de Navegação"', 'aria-label="Navigation Menu"');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✔ Normalized EN navbar in:', fullPath);
}
