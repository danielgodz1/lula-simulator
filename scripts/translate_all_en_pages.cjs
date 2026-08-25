// scripts/translate_all_en_pages.cjs — Tradução Integral de 100% das Páginas e Módulos em /en/

const fs = require('fs');

function processCommonAssetPaths(html) {
  html = html.replace(/href="css\//g, 'href="/css/');
  html = html.replace(/src="js\//g, 'src="/js/');
  html = html.replace(/from '\.\/js\//g, "from '/js/");
  html = html.replace(/from "\.\/js\//g, 'from "/js/');
  html = html.replace(/href="img\//g, 'href="/img/');
  html = html.replace(/src="img\//g, 'src="/img/');
  html = html.replace(/url\(['"]?img\//g, "url('/img/");
  return html;
}

// -------------------------------------------------------------
// 1. EN/LOJA.HTML
// -------------------------------------------------------------
let loja = fs.readFileSync('loja.html', 'utf8');
loja = loja.replace('<html lang="pt-BR">', '<html lang="en">');
loja = loja.replace('<title>🛍️ Loja Oficial de Skins & Prestígio — Flappy Lula</title>', '<title>🛍️ Official Skin Shop & Prestige — Flappy Lula</title>');
loja = loja.replace('<meta name="description" content="Personalize seus personagens favoritos com skins exclusivas e avance no sistema de prestígio no Lula Simulator!">', '<meta name="description" content="Customize your favorite characters with exclusive skins and advance in the Prestige system in Flappy Lula!">');
loja = loja.replace('https://lulasimulator.com.br/loja.html', 'https://flappylula.com/loja.html');
loja = loja.replace('<meta property="og:locale" content="pt_BR">', '<meta property="og:locale" content="en_US">');

loja = loja.replace('🛍️ LOJA OFICIAL DE SKINS & PRESTÍGIO', '🛍️ OFFICIAL SKIN SHOP & PRESTIGE');
loja = loja.replace('Personalize seus políticos favoritos com visuais épicos e desbloqueie o Prestígio Máximo!', 'Customize your favorite characters with epic skins and unlock Maximum Prestige!');

loja = loja.replace('🥩 PICANHAS FLAPPY', '🥩 FLAPPY STEAKS');
loja = loja.replace('💰 MOEDAS 3D', '💰 3D RUNNER COINS');
loja = loja.replace('⭐ NÍVEL DE PRESTÍGIO', '⭐ PRESTIGE LEVEL');

loja = loja.replace('⭐ SISTEMA DE PRESTÍGIO (REINICIE COM GLÓRIA)', '⭐ PRESTIGE SYSTEM (RESET WITH GLORY)');
loja = loja.replace('Ao atingir <strong>10.000 Picanhas</strong>, você pode prestigiar sua conta: suas picanhas reiniciam a zero em troca de um <strong>Selo de Prestígio Permanente ⭐</strong> exibido no ranking nacional e sobre a foto do seu perfil!', 'Upon reaching <strong>10,000 Steaks</strong>, you can prestige your account: your steaks reset to zero in exchange for a permanent <strong>Prestige Badge ⭐</strong> displayed in the global leaderboard and profile!');
loja = loja.replace('Acumule 10.000 Picanhas para avançar de Prestígio.', 'Accumulate 10,000 Steaks to advance in Prestige.');
loja = loja.replace('⭐ PRESTIGIAR AGORA', '⭐ ACTIVATE PRESTIGE NOW');

loja = loja.replace('🎯 MISSÕES DIÁRIAS (RESET À MEIA-NOITE)', '🎯 DAILY MISSIONS (RESET AT MIDNIGHT)');
loja = loja.replace('Cumpra os objetivos diários para faturar Picanhas e Moedas extras!', 'Complete daily objectives to earn extra Steaks and Coins!');
loja = loja.replace('📅 Hoje', '📅 Today');

loja = loja.replace('🌟 Todas as Skins', '🌟 All Skins');
loja = loja.replace('🏙️ Empresário 3D', '🏙️ 3D Runner');

// Navbar
loja = loja.replace('>Início<', '>Home<');
loja = loja.replace('>🏃 Empresário 3D<', '>🏃 3D Runner<');
loja = loja.replace('>👥 Social & Duelos<', '>👥 Social & Duels<');
loja = loja.replace('>🛍️ Loja de Skins<', '>🛍️ Skin Shop<');
loja = loja.replace('>🏅 Conquistas<', '>🏅 Achievements<');
loja = loja.replace('>🏆 Ranking<', '>🏆 Leaderboard<');
loja = loja.replace('>🌍 Visitantes<', '>🌍 Visitors<');
loja = loja.replace('>⭐ Feedbacks<', '>⭐ Feedback<');
loja = loja.replace('>📬 Contato<', '>📬 Contact<');
loja = loja.replace('🇧🇷 LULA SIMULATOR', '🐦 FLAPPY LULA');

// Links
loja = loja.replace(/href="index\.html"/g, 'href="/en/index.html"');
loja = loja.replace(/href="jogo\.html"/g, 'href="/en/jogo.html"');
loja = loja.replace(/href="correr\.html"/g, 'href="/en/correr.html"');
loja = loja.replace(/href="social\.html"/g, 'href="/en/social.html"');
loja = loja.replace(/href="loja\.html"/g, 'href="/en/loja.html"');
loja = loja.replace(/href="conquistas\.html"/g, 'href="/en/conquistas.html"');
loja = loja.replace(/href="ranking\.html"/g, 'href="/en/ranking.html"');
loja = loja.replace(/href="visitantes\.html"/g, 'href="/en/visitantes.html"');
loja = loja.replace(/href="feedback\.html"/g, 'href="/en/feedback.html"');
loja = loja.replace(/href="contato\.html"/g, 'href="/en/contato.html"');

// Script replacements inside loja.html for english skin rendering
loja = loja.replace(
  'document.getElementById(\'displayPrestigeLevel\').textContent = prestige > 0 ? `⭐ Prestígio ${prestige}` : \'Nível 0\';',
  'document.getElementById(\'displayPrestigeLevel\').textContent = prestige > 0 ? `⭐ Prestige ${prestige}` : \'Level 0\';'
);
loja = loja.replace(
  'btnPrestige.textContent = `⭐ ATIVAR PRESTÍGIO NÍVEL ${prestige + 1}!`;',
  'btnPrestige.textContent = `⭐ ACTIVATE PRESTIGE LEVEL ${prestige + 1}!`;'
);
loja = loja.replace(
  'btnPrestige.textContent = \'⭐ PRESTIGIAR (10.000 🥩)\';',
  'btnPrestige.textContent = \'⭐ PRESTIGE (10,000 🥩)\';'
);
loja = loja.replace(
  'document.getElementById(\'missionsDateLabel\').textContent = `📅 Missões de ${data.date}`;',
  'document.getElementById(\'missionsDateLabel\').textContent = `📅 Missions of ${data.date}`;'
);
loja = loja.replace(
  '<span>Progresso: <b>${m.current} / ${m.target}</b></span>',
  '<span>Progress: <b>${m.current} / ${m.target}</b></span>'
);
loja = loja.replace(
  '<span style="color:var(--amarelo-brasil); font-weight:700;">Recompensa: +${m.reward} ${unit}</span>',
  '<span style="color:var(--amarelo-brasil); font-weight:700;">Reward: +${m.reward} ${unit}</span>'
);
loja = loja.replace(
  '${m.claimed \n              ? \'<span style="font-size:12px; font-weight:800; color:var(--verde-neon);">✅ RECOMPENSA COLETADA</span>\'\n              : `<button class="btn-claim-mission" ${!isReady ? \'disabled\' : \'\'} data-id="${m.id}">\n                  ${isReady ? `🎁 RESGATAR (+${m.reward} ${unit})` : \'EM ANDAMENTO\'}\n                </button>`\n            }',
  '${m.claimed \n              ? \'<span style="font-size:12px; font-weight:800; color:var(--verde-neon);">✅ REWARD CLAIMED</span>\'\n              : `<button class="btn-claim-mission" ${!isReady ? \'disabled\' : \'\'} data-id="${m.id}">\n                  ${isReady ? `🎁 CLAIM (+${m.reward} ${unit})` : \'IN PROGRESS\'}\n                </button>`\n            }'
);

loja = loja.replace(
  '${skin.badge}',
  '${skin.badge_en || skin.badge}'
);
loja = loja.replace(
  '<div class="skin-name">${skin.name}</div>',
  '<div class="skin-name">${skin.name_en || skin.name}</div>'
);
loja = loja.replace(
  '<div class="skin-char-name">Personagem: ${skin.charId.toUpperCase()}</div>',
  '<div class="skin-char-name">Character: ${skin.charId.toUpperCase()}</div>'
);
loja = loja.replace(
  '<div class="skin-desc">${skin.desc}</div>',
  '<div class="skin-desc">${skin.desc_en || skin.desc}</div>'
);
loja = loja.replace(
  '🛒 COMPRAR (${skin.price} ${unit})',
  '🛒 BUY (${skin.price} ${unit})'
);
loja = loja.replace(
  '✅ EQUIPADA',
  '✅ EQUIPPED'
);
loja = loja.replace(
  '🔄 PADRÃO',
  '🔄 DEFAULT'
);
loja = loja.replace(
  '⚡ EQUIPAR SKIN',
  '⚡ EQUIP SKIN'
);

loja = processCommonAssetPaths(loja);
fs.writeFileSync('en/loja.html', loja, 'utf8');
console.log('✔ en/loja.html fully translated');

// -------------------------------------------------------------
// 2. EN/SOCIAL.HTML
// -------------------------------------------------------------
let social = fs.readFileSync('social.html', 'utf8');
social = social.replace('<html lang="pt-BR">', '<html lang="en">');
social = social.replace('<title>Social & Duelos 👥⚔️ — Flappy Lula</title>', '<title>Social Hub & Duels 👥⚔️ — Flappy Lula</title>');
social = social.replace('<meta name="description" content="Adicione amigos, desafie jogadores em duelos assíncronos e dispute o Torneio Semanal no Lula Simulator!">', '<meta name="description" content="Add friends, challenge players in asynchronous duels, and compete in the Weekly Tournament in Flappy Lula!">');
social = social.replace('https://lulasimulator.com.br/social.html', 'https://flappylula.com/social.html');
social = social.replace('<meta property="og:locale" content="pt_BR">', '<meta property="og:locale" content="en_US">');

social = social.replace('👥 SOCIAL, DUELOS & TORNEIO SEMANAL ⚔️', '👥 SOCIAL HUB, DUELS & WEEKLY TOURNAMENT ⚔️');
social = social.replace('Adicione rivais, desafie em duelos assíncronos valendo Picanhas e dispute o troféu do torneio!', 'Add friends, send duel challenges wagering Steaks, and compete for the weekly champion trophy!');

social = social.replace('🏆 TORNEIO SEMANAL', '🏆 WEEKLY TOURNAMENT');
social = social.replace('Termina em:', 'Ends in:');
social = social.replace('Prêmio:', 'Grand Prize:');
social = social.replace('PARTICIPAR DO TORNEIO', 'JOIN TOURNAMENT');

social = social.replace('👥 AMIGOS & PEDIDOS', '👥 FRIENDS & REQUESTS');
social = social.replace('Buscar Jogador pelo Nome', 'Search Player by Username');
social = social.replace('Enviar Pedido', 'Send Request');
social = social.replace('Pedidos Pendentes', 'Pending Requests');
social = social.replace('Seus Amigos', 'Your Friends');
social = social.replace('Nenhum pedido pendente.', 'No pending friend requests.');
social = social.replace('Nenhum amigo adicionado ainda.', 'No friends added yet. Search a player above!');

social = social.replace('⚔️ DUELOS ASSÍNCRONOS', '⚔️ ASYNCHRONOUS DUELS');
social = social.replace('Desafie um amigo: jogue sua melhor partida e envie o desafio. Quem fizer mais pontos leva as Picanhas!', 'Challenge a friend: play your best match and send the challenge. Whoever scores higher wins the Steaks!');
social = social.replace('CRIAR NOVO DUELO', 'CREATE NEW DUEL');
social = social.replace('Duelos Ativos', 'Active Duels');
social = social.replace('Histórico de Duelos', 'Duel History');
social = social.replace('Nenhum duelo ativo.', 'No active duels right now.');

social = social.replace('📢 FEED DE ATIVIDADES GLOBAIS', '📢 GLOBAL ACTIVITY FEED');
social = social.replace('Carregando atividades em tempo real...', 'Loading real-time global activities...');

// Menu
social = social.replace('>Início<', '>Home<');
social = social.replace('>🏃 Empresário 3D<', '>🏃 3D Runner<');
social = social.replace('>👥 Social & Duelos<', '>👥 Social & Duels<');
social = social.replace('>🛍️ Loja de Skins<', '>🛍️ Skin Shop<');
social = social.replace('>🏅 Conquistas<', '>🏅 Achievements<');
social = social.replace('>🏆 Ranking<', '>🏆 Leaderboard<');
social = social.replace('>🌍 Visitantes<', '>🌍 Visitors<');
social = social.replace('>⭐ Feedbacks<', '>⭐ Feedback<');
social = social.replace('>📬 Contato<', '>📬 Contact<');
social = social.replace('🇧🇷 LULA SIMULATOR', '🐦 FLAPPY LULA');

social = social.replace(/href="index\.html"/g, 'href="/en/index.html"');
social = social.replace(/href="jogo\.html"/g, 'href="/en/jogo.html"');
social = social.replace(/href="correr\.html"/g, 'href="/en/correr.html"');
social = social.replace(/href="social\.html"/g, 'href="/en/social.html"');
social = social.replace(/href="loja\.html"/g, 'href="/en/loja.html"');
social = social.replace(/href="conquistas\.html"/g, 'href="/en/conquistas.html"');
social = social.replace(/href="ranking\.html"/g, 'href="/en/ranking.html"');
social = social.replace(/href="visitantes\.html"/g, 'href="/en/visitantes.html"');
social = social.replace(/href="feedback\.html"/g, 'href="/en/feedback.html"');
social = social.replace(/href="contato\.html"/g, 'href="/en/contato.html"');

social = processCommonAssetPaths(social);
fs.writeFileSync('en/social.html', social, 'utf8');
console.log('✔ en/social.html fully translated');

// -------------------------------------------------------------
// 3. EN/CONQUISTAS.HTML
// -------------------------------------------------------------
let conquistas = fs.readFileSync('conquistas.html', 'utf8');
conquistas = conquistas.replace('<html lang="pt-BR">', '<html lang="en">');
conquistas = conquistas.replace('<title>Conquistas & Badges Lendárias — Lula Simulator</title>', '<title>Achievements & Legendary Badges — Flappy Lula</title>');
conquistas = conquistas.replace('<meta name="description" content="Desbloqueie conquistas, badges lendárias e figuras políticas no Lula Simulator. Veja suas picanhas acumuladas e recordes!">', '<meta name="description" content="Unlock achievements, legendary badges, and political roster in Flappy Lula. Track your steaks and records!">\n  <meta property="og:locale" content="en_US">');
conquistas = conquistas.replace('https://lulasimulator.com.br/conquistas.html', 'https://flappylula.com/conquistas.html');
conquistas = conquistas.replace('<meta property="og:locale" content="pt_BR">', '');

conquistas = conquistas.replace('🏅 CONQUISTAS & BADGES LENDÁRIAS', '🏅 ACHIEVEMENTS & LEGENDARY BADGES');
conquistas = conquistas.replace('Junte picanhas, sobreviva a canos e desbloqueie as badges oficiais mais raras da política brasileira!', 'Collect steaks, survive obstacles, and unlock the rarest collectible badges in Brazilian politics!');

conquistas = conquistas.replace('🥩 PICANHAS TOTAIS ACUMULADAS', '🥩 TOTAL ACCUMULATED STEAKS');
conquistas = conquistas.replace('DESBLOQUEIOS ESPECIAIS', 'SPECIAL UNLOCKS');
conquistas = conquistas.replace('✨ DESBLOQUEADO', '✨ UNLOCKED');
conquistas = conquistas.replace('🔒 BLOQUEADO', '🔒 LOCKED');
conquistas = conquistas.replace('PROGRESSO:', 'PROGRESS:');

conquistas = conquistas.replace('🎭 ROSTER DE PERSONAGENS POLÍTICOS', '🎭 POLITICAL CHARACTER ROSTER');
conquistas = conquistas.replace('Desbloqueie todos os personagens jogando e acumulando picanhas!', 'Unlock all characters by playing and collecting steaks!');

conquistas = conquistas.replace('>Início<', '>Home<');
conquistas = conquistas.replace('>🏃 Empresário 3D<', '>🏃 3D Runner<');
conquistas = conquistas.replace('>👥 Social & Duelos<', '>👥 Social & Duels<');
conquistas = conquistas.replace('>🛍️ Loja de Skins<', '>🛍️ Skin Shop<');
conquistas = conquistas.replace('>🏅 Conquistas<', '>🏅 Achievements<');
conquistas = conquistas.replace('>🏆 Ranking<', '>🏆 Leaderboard<');
conquistas = conquistas.replace('>🌍 Visitantes<', '>🌍 Visitors<');
conquistas = conquistas.replace('>⭐ Feedbacks<', '>⭐ Feedback<');
conquistas = conquistas.replace('>📬 Contato<', '>📬 Contact<');
conquistas = conquistas.replace('🇧🇷 LULA SIMULATOR', '🐦 FLAPPY LULA');

conquistas = conquistas.replace(/href="index\.html"/g, 'href="/en/index.html"');
conquistas = conquistas.replace(/href="jogo\.html"/g, 'href="/en/jogo.html"');
conquistas = conquistas.replace(/href="correr\.html"/g, 'href="/en/correr.html"');
conquistas = conquistas.replace(/href="social\.html"/g, 'href="/en/social.html"');
conquistas = conquistas.replace(/href="loja\.html"/g, 'href="/en/loja.html"');
conquistas = conquistas.replace(/href="conquistas\.html"/g, 'href="/en/conquistas.html"');
conquistas = conquistas.replace(/href="ranking\.html"/g, 'href="/en/ranking.html"');
conquistas = conquistas.replace(/href="visitantes\.html"/g, 'href="/en/visitantes.html"');
conquistas = conquistas.replace(/href="feedback\.html"/g, 'href="/en/feedback.html"');
conquistas = conquistas.replace(/href="contato\.html"/g, 'href="/en/contato.html"');

conquistas = processCommonAssetPaths(conquistas);
fs.writeFileSync('en/conquistas.html', conquistas, 'utf8');
console.log('✔ en/conquistas.html fully translated');

// -------------------------------------------------------------
// 4. EN/RANKING.HTML
// -------------------------------------------------------------
let ranking = fs.readFileSync('ranking.html', 'utf8');
ranking = ranking.replace('<html lang="pt-BR">', '<html lang="en">');
ranking = ranking.replace('<title>Ranking Nacional — Placar Oficial do Lula Simulator</title>', '<title>Global Leaderboard — Official Hall of Fame | Flappy Lula</title>');
ranking = ranking.replace('<meta name="description" content="Confira o ranking dos melhores jogadores de Flappy Lula e Empresário 3D. Disputa pelo pódio nacional!">', '<meta name="description" content="Check out the global rankings for Flappy Lula and 3D Runner. Compete for the world record podium!">\n  <meta property="og:locale" content="en_US">');
ranking = ranking.replace('https://lulasimulator.com.br/ranking.html', 'https://flappylula.com/ranking.html');
ranking = ranking.replace('<meta property="og:locale" content="pt_BR">', '');

ranking = ranking.replace('🏆 TOP 300 NACIONAL', '🏆 GLOBAL TOP 300 LEADERBOARD');
ranking = ranking.replace('Ranking oficial de recordes do Flappy Lula e Empresário 3D!', 'Official world rankings for Flappy Lula and 3D Runner!');

ranking = ranking.replace('🐦 Flappy Lula (Picanhas)', '🐦 Flappy Lula (Steaks)');
ranking = ranking.replace('🏃 Empresário 3D (km)', '🏃 3D Runner (km)');

ranking = ranking.replace('🌐 Geral (Todos os Países)', '🌐 Global (All Countries)');
ranking = ranking.replace('🇧🇷 Brasil Apenas', '🇧🇷 Brazil Only');
ranking = ranking.replace('🏆 Geral (Hall da Fama)', '🏆 All-Time (Hall of Fame)');
ranking = ranking.replace('🔥 Semanal (Esta Semana)', '🔥 Weekly (This Week)');
ranking = ranking.replace('🔍 Buscar jogador pelo nome...', '🔍 Search player by username...');

ranking = ranking.replace('POSIÇÃO', 'RANK');
ranking = ranking.replace('JOGADOR', 'PLAYER');
ranking = ranking.replace('RECORDE', 'SCORE');
ranking = ranking.replace('DATA', 'DATE');

ranking = ranking.replace('>Início<', '>Home<');
ranking = ranking.replace('>🏃 Empresário 3D<', '>🏃 3D Runner<');
ranking = ranking.replace('>👥 Social & Duelos<', '>👥 Social & Duels<');
ranking = ranking.replace('>🛍️ Loja de Skins<', '>🛍️ Skin Shop<');
ranking = ranking.replace('>🏅 Conquistas<', '>🏅 Achievements<');
ranking = ranking.replace('>🏆 Ranking<', '>🏆 Leaderboard<');
ranking = ranking.replace('>🌍 Visitantes<', '>🌍 Visitors<');
ranking = ranking.replace('>⭐ Feedbacks<', '>⭐ Feedback<');
ranking = ranking.replace('>📬 Contato<', '>📬 Contact<');
ranking = ranking.replace('🇧🇷 LULA SIMULATOR', '🐦 FLAPPY LULA');

ranking = ranking.replace(/href="index\.html"/g, 'href="/en/index.html"');
ranking = ranking.replace(/href="jogo\.html"/g, 'href="/en/jogo.html"');
ranking = ranking.replace(/href="correr\.html"/g, 'href="/en/correr.html"');
ranking = ranking.replace(/href="social\.html"/g, 'href="/en/social.html"');
ranking = ranking.replace(/href="loja\.html"/g, 'href="/en/loja.html"');
ranking = ranking.replace(/href="conquistas\.html"/g, 'href="/en/conquistas.html"');
ranking = ranking.replace(/href="ranking\.html"/g, 'href="/en/ranking.html"');
ranking = ranking.replace(/href="visitantes\.html"/g, 'href="/en/visitantes.html"');
ranking = ranking.replace(/href="feedback\.html"/g, 'href="/en/feedback.html"');
ranking = ranking.replace(/href="contato\.html"/g, 'href="/en/contato.html"');

ranking = processCommonAssetPaths(ranking);
fs.writeFileSync('en/ranking.html', ranking, 'utf8');
console.log('✔ en/ranking.html fully translated');

// -------------------------------------------------------------
// 5. EN/FEEDBACK.HTML
// -------------------------------------------------------------
let feedback = fs.readFileSync('feedback.html', 'utf8');
feedback = feedback.replace('<html lang="pt-BR">', '<html lang="en">');
feedback = feedback.replace('<title>Feedbacks & Avaliações da Comunidade — Lula Simulator</title>', '<title>Community Reviews & Feedback — Flappy Lula</title>');
feedback = feedback.replace('<meta name="description" content="Deixe seu feedback sobre o Lula Simulator! Avalie os jogos Flappy Lula e Empresário 3D e envie sugestões.">', '<meta name="description" content="Leave your review for Flappy Lula! Rate the game, suggest features, and join the community.">\n  <meta property="og:locale" content="en_US">');
feedback = feedback.replace('https://lulasimulator.com.br/feedback.html', 'https://flappylula.com/feedback.html');
feedback = feedback.replace('<meta property="og:locale" content="pt_BR">', '');

feedback = feedback.replace('⭐ FEEDBACKS & AVALIAÇÕES DA COMUNIDADE', '⭐ COMMUNITY REVIEWS & FEEDBACK');
feedback = feedback.replace('Sua opinião ajuda a melhorar o jogo! Deixe sua nota e comentário.', 'Your feedback helps improve the game! Leave your rating and suggestions.');

feedback = feedback.replace('DEIXAR UMA AVALIAÇÃO', 'SUBMIT A REVIEW');
feedback = feedback.replace('Seu Nome ou Apelido', 'Your Name or Username');
feedback = feedback.replace('Sua Avaliação (1 a 5 estrelas)', 'Your Rating (1 to 5 stars)');
feedback = feedback.replace('Sua Mensagem ou Sugestão...', 'Your Message or Suggestion...');
feedback = feedback.replace('ENVIAR FEEDBACK ⭐', 'SUBMIT FEEDBACK ⭐');
feedback = feedback.replace('💬 AVALIAÇÕES RECENTES', '💬 RECENT REVIEWS');

feedback = feedback.replace('>Início<', '>Home<');
feedback = feedback.replace('>🏃 Empresário 3D<', '>🏃 3D Runner<');
feedback = feedback.replace('>👥 Social & Duelos<', '>👥 Social & Duels<');
feedback = feedback.replace('>🛍️ Loja de Skins<', '>🛍️ Skin Shop<');
feedback = feedback.replace('>🏅 Conquistas<', '>🏅 Achievements<');
feedback = feedback.replace('>🏆 Ranking<', '>🏆 Leaderboard<');
feedback = feedback.replace('>🌍 Visitantes<', '>🌍 Visitors<');
feedback = feedback.replace('>⭐ Feedbacks<', '>⭐ Feedback<');
feedback = feedback.replace('>📬 Contato<', '>📬 Contact<');
feedback = feedback.replace('🇧🇷 LULA SIMULATOR', '🐦 FLAPPY LULA');

feedback = feedback.replace(/href="index\.html"/g, 'href="/en/index.html"');
feedback = feedback.replace(/href="jogo\.html"/g, 'href="/en/jogo.html"');
feedback = feedback.replace(/href="correr\.html"/g, 'href="/en/correr.html"');
feedback = feedback.replace(/href="social\.html"/g, 'href="/en/social.html"');
feedback = feedback.replace(/href="loja\.html"/g, 'href="/en/loja.html"');
feedback = feedback.replace(/href="conquistas\.html"/g, 'href="/en/conquistas.html"');
feedback = feedback.replace(/href="ranking\.html"/g, 'href="/en/ranking.html"');
feedback = feedback.replace(/href="visitantes\.html"/g, 'href="/en/visitantes.html"');
feedback = feedback.replace(/href="feedback\.html"/g, 'href="/en/feedback.html"');
feedback = feedback.replace(/href="contato\.html"/g, 'href="/en/contato.html"');

feedback = processCommonAssetPaths(feedback);
fs.writeFileSync('en/feedback.html', feedback, 'utf8');
console.log('✔ en/feedback.html fully translated');

// -------------------------------------------------------------
// 6. EN/CONTATO.HTML
// -------------------------------------------------------------
let contato = fs.readFileSync('contato.html', 'utf8');
contato = contato.replace('<html lang="pt-BR">', '<html lang="en">');
contato = contato.replace('<title>Contato — Desenvolvedor do Lula Simulator</title>', '<title>Contact — Flappy Lula Developer</title>');
contato = contato.replace('<meta name="description" content="Entre em contato com o desenvolvedor do Lula Simulator para parcerias, sugestões ou suporte.">', '<meta name="description" content="Contact the developer of Flappy Lula for business inquiries, suggestions, or support.">\n  <meta property="og:locale" content="en_US">');
contato = contato.replace('https://lulasimulator.com.br/contato.html', 'https://flappylula.com/contato.html');
contato = contato.replace('<meta property="og:locale" content="pt_BR">', '');

contato = contato.replace('📬 FALE COM O DESENVOLVEDOR', '📬 CONTACT THE DEVELOPER');
contato = contato.replace('Dúvidas, sugestões de novos personagens, parcerias ou suporte? Envie uma mensagem!', 'Questions, character suggestions, partnerships, or support? Send a message!');

contato = contato.replace('ENVIAR MENSAGEM DIRETA', 'SEND DIRECT MESSAGE');
contato = contato.replace('Seu Nome', 'Your Name');
contato = contato.replace('Seu E-mail', 'Your Email');
contato = contato.replace('Assunto', 'Subject');
contato = contato.replace('Sua Mensagem...', 'Your Message...');
contato = contato.replace('ENVIAR MENSAGEM 🚀', 'SEND MESSAGE 🚀');
contato = contato.replace('📍 INFORMAÇÕES DO PROJETO', '📍 PROJECT INFORMATION');

contato = contato.replace('>Início<', '>Home<');
contato = contato.replace('>🏃 Empresário 3D<', '>🏃 3D Runner<');
contato = contato.replace('>👥 Social & Duelos<', '>👥 Social & Duels<');
contato = contato.replace('>🛍️ Loja de Skins<', '>🛍️ Skin Shop<');
contato = contato.replace('>🏅 Conquistas<', '>🏅 Achievements<');
contato = contato.replace('>🏆 Ranking<', '>🏆 Leaderboard<');
contato = contato.replace('>🌍 Visitantes<', '>🌍 Visitors<');
contato = contato.replace('>⭐ Feedbacks<', '>⭐ Feedback<');
contato = contato.replace('>📬 Contato<', '>📬 Contact<');
contato = contato.replace('🇧🇷 LULA SIMULATOR', '🐦 FLAPPY LULA');

contato = contato.replace(/href="index\.html"/g, 'href="/en/index.html"');
contato = contato.replace(/href="jogo\.html"/g, 'href="/en/jogo.html"');
contato = contato.replace(/href="correr\.html"/g, 'href="/en/correr.html"');
contato = contato.replace(/href="social\.html"/g, 'href="/en/social.html"');
contato = contato.replace(/href="loja\.html"/g, 'href="/en/loja.html"');
contato = contato.replace(/href="conquistas\.html"/g, 'href="/en/conquistas.html"');
contato = contato.replace(/href="ranking\.html"/g, 'href="/en/ranking.html"');
contato = contato.replace(/href="visitantes\.html"/g, 'href="/en/visitantes.html"');
contato = contato.replace(/href="feedback\.html"/g, 'href="/en/feedback.html"');
contato = contato.replace(/href="contato\.html"/g, 'href="/en/contato.html"');

contato = processCommonAssetPaths(contato);
fs.writeFileSync('en/contato.html', contato, 'utf8');
console.log('✔ en/contato.html fully translated');

// -------------------------------------------------------------
// 7. EN/VISITANTES.HTML
// -------------------------------------------------------------
let visitantes = fs.readFileSync('visitantes.html', 'utf8');
visitantes = visitantes.replace('<html lang="pt-BR">', '<html lang="en">');
visitantes = visitantes.replace('<title>Visitantes Globais em Tempo Real — Lula Simulator</title>', '<title>Real-Time Global Visitors — Flappy Lula</title>');
visitantes = visitantes.replace('<meta name="description" content="Acompanhe em tempo real os visitantes de todo o mundo jogando Lula Simulator. Estatísticas por país e mapa interativo!">', '<meta name="description" content="Track in real-time visitors from around the world playing Flappy Lula. Country stats and live interactive map!">\n  <meta property="og:locale" content="en_US">');
visitantes = visitantes.replace('https://lulasimulator.com.br/visitantes.html', 'https://flappylula.com/visitantes.html');
visitantes = visitantes.replace('<meta property="og:locale" content="pt_BR">', '');

visitantes = visitantes.replace('🌍 VISITANTES GLOBAIS EM TEMPO REAL', '🌍 REAL-TIME GLOBAL VISITORS');
visitantes = visitantes.replace('Acompanhe de onde estão jogando o Flappy Lula e Empresário 3D!', 'Track where players are connecting from across the globe!');

visitantes = visitantes.replace('TOTAL DE VISITAS', 'TOTAL VISITS');
visitantes = visitantes.replace('PAÍSES ALCANÇADOS', 'COUNTRIES REACHED');
visitantes = visitantes.replace('RECORDES SALVOS', 'SAVED RECORDS');

visitantes = visitantes.replace('>Início<', '>Home<');
visitantes = visitantes.replace('>🏃 Empresário 3D<', '>🏃 3D Runner<');
visitantes = visitantes.replace('>👥 Social & Duelos<', '>👥 Social & Duels<');
visitantes = visitantes.replace('>🛍️ Loja de Skins<', '>🛍️ Skin Shop<');
visitantes = visitantes.replace('>🏅 Conquistas<', '>🏅 Achievements<');
visitantes = visitantes.replace('>🏆 Ranking<', '>🏆 Leaderboard<');
visitantes = visitantes.replace('>🌍 Visitantes<', '>🌍 Visitors<');
visitantes = visitantes.replace('>⭐ Feedbacks<', '>⭐ Feedback<');
visitantes = visitantes.replace('>📬 Contato<', '>📬 Contact<');
visitantes = visitantes.replace('🇧🇷 LULA SIMULATOR', '🐦 FLAPPY LULA');

visitantes = visitantes.replace(/href="index\.html"/g, 'href="/en/index.html"');
visitantes = visitantes.replace(/href="jogo\.html"/g, 'href="/en/jogo.html"');
visitantes = visitantes.replace(/href="correr\.html"/g, 'href="/en/correr.html"');
visitantes = visitantes.replace(/href="social\.html"/g, 'href="/en/social.html"');
visitantes = visitantes.replace(/href="loja\.html"/g, 'href="/en/loja.html"');
visitantes = visitantes.replace(/href="conquistas\.html"/g, 'href="/en/conquistas.html"');
visitantes = visitantes.replace(/href="ranking\.html"/g, 'href="/en/ranking.html"');
visitantes = visitantes.replace(/href="visitantes\.html"/g, 'href="/en/visitantes.html"');
visitantes = visitantes.replace(/href="feedback\.html"/g, 'href="/en/feedback.html"');
visitantes = visitantes.replace(/href="contato\.html"/g, 'href="/en/contato.html"');

visitantes = processCommonAssetPaths(visitantes);
fs.writeFileSync('en/visitantes.html', visitantes, 'utf8');
console.log('✔ en/visitantes.html fully translated');

console.log('🎉 All English pages translated and generated!');
