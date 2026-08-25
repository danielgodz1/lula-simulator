// scripts/generate_en_pages.js — Gerador Automático e Tradutor das Páginas em /en/

const fs = require('fs');
const path = require('path');

if (!fs.existsSync('en')) {
  fs.mkdirSync('en', { recursive: true });
}

// -------------------------------------------------------------
// 1. JOGO.HTML -> EN/JOGO.HTML
// -------------------------------------------------------------
let jogoHtml = fs.readFileSync('jogo.html', 'utf8');
jogoHtml = jogoHtml.replace('<html lang="pt-BR">', '<html lang="en">');
jogoHtml = jogoHtml.replace('<title>Flappy Lula — Jogo do Lula 2D Arcade Online | Lula Simulator</title>', '<title>Flappy Lula — Play 2D Arcade Game Online | Lula Simulator</title>');
jogoHtml = jogoHtml.replace('<meta name="description" content="Jogue Flappy Lula online grátis! Voe entre os canos, colete picanhas, desbloqueie personagens lendários e fuja da prisão no jogo 2D oficial do Lula Simulator.">', '<meta name="description" content="Play Flappy Lula free online in your browser! Fly between pipes, collect steaks, unlock legendary characters, and survive prison mode.">');
jogoHtml = jogoHtml.replace('<link rel="canonical" href="https://lulasimulator.com.br/jogo.html">', '<link rel="canonical" href="https://flappylula.com/jogo.html">');
jogoHtml = jogoHtml.replace('<meta property="og:url" content="https://lulasimulator.com.br/jogo.html">', '<meta property="og:url" content="https://flappylula.com/jogo.html">');
jogoHtml = jogoHtml.replace('<meta property="og:title" content="Flappy Lula — Jogo do Lula 2D Arcade Online">', '<meta property="og:title" content="Flappy Lula — 2D Arcade Meme Game">');
jogoHtml = jogoHtml.replace('<meta property="og:description" content="Voe com o Lula, desvie de canos, pegue picanhas e dispute o Top 1 do Ranking Nacional!">', '<meta property="og:description" content="Fly with Lula, dodge pipes, collect steaks, and compete for Top 1 on the Global Leaderboard!">\n  <meta property="og:locale" content="en_US">');
jogoHtml = jogoHtml.replace('<meta property="og:locale" content="pt_BR">', '');
jogoHtml = jogoHtml.replace('"inLanguage": "pt-BR"', '"inLanguage": "en"');

jogoHtml = jogoHtml.replace('<label>Picanhas</label>', '<label>Steaks</label>');
jogoHtml = jogoHtml.replace('<label>Recorde</label>', '<label>Best</label>');
jogoHtml = jogoHtml.replace('🎭 Políticos', '🎭 Characters');
jogoHtml = jogoHtml.replace('title="Som"', 'title="Sound"');
jogoHtml = jogoHtml.replace('title="Tela Cheia"', 'title="Fullscreen"');

jogoHtml = jogoHtml.replace('🐦 FLAPPY LULA OFICIAL', '🐦 OFFICIAL FLAPPY LULA');
jogoHtml = jogoHtml.replace('Voe entre os canos, junte picanhas para destravar o <strong>Selo de 50 Picanhas</strong> e o lendário <strong>Trio de 500 Picanhas</strong>!', 'Fly between pipes, collect steaks to unlock the <strong>50 Steaks Badge</strong> and the legendary <strong>500 Steaks Trio</strong>!');
jogoHtml = jogoHtml.replace('🎭 TROCAR', '🎭 CHANGE');
jogoHtml = jogoHtml.replace('🔊 TOQUE PARA JOGAR!', '🔊 TAP TO PLAY!');

jogoHtml = jogoHtml.replace('🎭 PERSONAGENS POLÍTICOS', '🎭 POLITICAL CHARACTERS');
jogoHtml = jogoHtml.replace('Junte picanhas para liberar figuras históricas!', 'Collect steaks to unlock historical political figures!');
jogoHtml = jogoHtml.replace('🛍️ Abrir Loja', '🛍️ Open Shop');
jogoHtml = jogoHtml.replace('>Voltar</button>', '>Back</button>');
jogoHtml = jogoHtml.replace('✨ EQUIPAR E JOGAR', '✨ EQUIP & PLAY');
jogoHtml = jogoHtml.replace('🎁 Ganhar +10 Picanhas Grátis (Patrocinador)', '🎁 Get +10 Free Steaks (Sponsor)');

jogoHtml = jogoHtml.replace('✎ Trocar', '✎ Change');
jogoHtml = jogoHtml.replace('<label>MEDALHA</label>', '<label>MEDAL</label>');
jogoHtml = jogoHtml.replace('"Companheiro, bateu no cano e a Receita Federal confiscou a picanha!"', '"Comrade, you hit the pipe and taxes took away your steak!"');
jogoHtml = jogoHtml.replace('🏆 TOP PLACAR NACIONAL', '🏆 GLOBAL LEADERBOARD');
jogoHtml = jogoHtml.replace('Carregando placar...', 'Loading leaderboard...');
jogoHtml = jogoHtml.replace('>VOCÊ (Jogador)<', '>YOU (Player)<');
jogoHtml = jogoHtml.replace('▶ JOGAR', '▶ PLAY AGAIN');
jogoHtml = jogoHtml.replace('🔗 COPIAR', '🔗 COPY');
jogoHtml = jogoHtml.replace('🏠 INÍCIO', '🏠 HOME');
jogoHtml = jogoHtml.replace('🎁 GANHAR +10 PICANHAS BÔNUS', '🎁 GET +10 BONUS STEAKS');

jogoHtml = jogoHtml.replace('🚨 13 PONTOS: MODO CADEIA ATIVADO!', '🚨 13 POINTS: PRISON MODE ACTIVATED!');
jogoHtml = jogoHtml.replace('MODO CADEIA ATIVADO! TERREMOTO!', 'PRISON MODE ACTIVATED! EARTHQUAKE!');
jogoHtml = jogoHtml.replace('HABEAS CORPUS! LIBERDADE!', 'HABEAS CORPUS! FREEDOM!');
jogoHtml = jogoHtml.replace('LULA DESACELEROU O TEMPO (-3x)!', 'LULA SLOWED DOWN TIME (-3x)!');
jogoHtml = jogoHtml.replace('O HOMEM É UMA MÁQUINA!', 'THE MAN IS A MACHINE!');
jogoHtml = jogoHtml.replace('DIFICULDADE 2.0x ATINGIDA!', '2.0x DIFFICULTY REACHED!');
jogoHtml = jogoHtml.replace('RITMO INTENSO 3.5x!', '3.5x INTENSE TEMPO REACHED!');
jogoHtml = jogoHtml.replace('DIFICULDADE MÁXIMA 5.0x LENDÁRIA!', '5.0x LEGENDARY MAX DIFFICULTY!');
jogoHtml = jogoHtml.replace('30s DE JOGO: RITMO AUMENTANDO LEVEMENTE!', '30s IN GAME: SPEED INCREASING SLIGHTLY!');

fs.writeFileSync('en/jogo.html', jogoHtml, 'utf8');
console.log('✔ en/jogo.html created');

// -------------------------------------------------------------
// 2. CORRER.HTML -> EN/CORRER.HTML
// -------------------------------------------------------------
let correrHtml = fs.readFileSync('correr.html', 'utf8');
correrHtml = correrHtml.replace('<html lang="pt-BR">', '<html lang="en">');
correrHtml = correrHtml.replace('<title>Empresário Fugindo 3D — Jogo do Lula Simulator (Endless Runner)</title>', '<title>Businessman 3D Runner — Play 3D Endless Runner Online | Lula Simulator</title>');
correrHtml = correrHtml.replace('<meta name="description" content="Jogue Empresário vs CLT 3D online! Fuja de impostos, carteira assinada e boletos correndo pelos morros do Brasil em Three.js no Lula Simulator.">', '<meta name="description" content="Play Businessman 3D Runner online! Dodge subway trains, toll barriers, stop signs, and taxes across Brazil in Three.js.">');
correrHtml = correrHtml.replace('<link rel="canonical" href="https://lulasimulator.com.br/correr.html">', '<link rel="canonical" href="https://flappylula.com/correr.html">');
correrHtml = correrHtml.replace('<meta property="og:url" content="https://lulasimulator.com.br/correr.html">', '<meta property="og:url" content="https://flappylula.com/correr.html">');
correrHtml = correrHtml.replace('<meta property="og:locale" content="pt_BR">', '<meta property="og:locale" content="en_US">');
correrHtml = correrHtml.replace('"inLanguage": "pt-BR"', '"inLanguage": "en"');

correrHtml = correrHtml.replace('🏃 EMPRESÁRIO 3D', '🏃 3D RUNNER');
correrHtml = correrHtml.replace('<label>Distância</label>', '<label>Distance</label>');
correrHtml = correrHtml.replace('<label>Recorde</label>', '<label>Best</label>');
correrHtml = correrHtml.replace('<label>Moedas</label>', '<label>Coins</label>');

correrHtml = correrHtml.replace('EMPRESÁRIO FUGINDO 3D', 'BUSINESSMAN 3D RUNNER');
correrHtml = correrHtml.replace('Fuja da CLT, dos boletos e dos trens do metrô!', 'Dodge subway trains, stop barriers, and bills in 3D!');
correrHtml = correrHtml.replace('TOQUE PARA CORRER!', 'TAP TO RUN!');
correrHtml = correrHtml.replace('COMO JOGAR:', 'HOW TO PLAY:');
correrHtml = correrHtml.replace('Deslize ou use as setas para mudar de pista, pular ou rolar.', 'Swipe or use arrow keys / A-D to change lanes, jump, or slide.');
correrHtml = correrHtml.replace('JOGAR NOVAMENTE', 'PLAY AGAIN');
correrHtml = correrHtml.replace('MENU PRINCIPAL', 'MAIN MENU');

fs.writeFileSync('en/correr.html', correrHtml, 'utf8');
console.log('✔ en/correr.html created');

// -------------------------------------------------------------
// 3. RANKING.HTML -> EN/RANKING.HTML
// -------------------------------------------------------------
let rankingHtml = fs.readFileSync('ranking.html', 'utf8');
rankingHtml = rankingHtml.replace('<html lang="pt-BR">', '<html lang="en">');
rankingHtml = rankingHtml.replace('<title>Ranking Geral & Placar Nacional — Lula Simulator</title>', '<title>Global Leaderboards & Hall of Fame — Flappy Lula</title>');
rankingHtml = rankingHtml.replace('<meta name="description" content="Confira o ranking nacional em tempo real dos melhores jogadores de Flappy Lula e Empresário 3D. Veja quem é o maior pontuador do Brasil!">', '<meta name="description" content="Check real-time global leaderboards for Flappy Lula and 3D Runner. See who holds the world record score!">\n  <meta property="og:locale" content="en_US">');
rankingHtml = rankingHtml.replace('<link rel="canonical" href="https://lulasimulator.com.br/ranking.html">', '<link rel="canonical" href="https://flappylula.com/ranking.html">');
rankingHtml = rankingHtml.replace('<meta property="og:url" content="https://lulasimulator.com.br/ranking.html">', '<meta property="og:url" content="https://flappylula.com/ranking.html">');
rankingHtml = rankingHtml.replace('<meta property="og:locale" content="pt_BR">', '');

// Menu
rankingHtml = rankingHtml.replace('Início', 'Home');
rankingHtml = rankingHtml.replace('🐦 Flappy Lula', '🐦 Flappy Lula');
rankingHtml = rankingHtml.replace('🏃 Empresário 3D', '🏃 3D Runner');
rankingHtml = rankingHtml.replace('👥 Social & Duelos', '👥 Social & Duels');
rankingHtml = rankingHtml.replace('🛍️ Loja de Skins', '🛍️ Skin Shop');
rankingHtml = rankingHtml.replace('🏅 Conquistas', '🏅 Achievements');
rankingHtml = rankingHtml.replace('🏆 Ranking', '🏆 Leaderboard');
rankingHtml = rankingHtml.replace('🌍 Visitantes', '🌍 Visitors');
rankingHtml = rankingHtml.replace('⭐ Feedbacks', '⭐ Feedback');
rankingHtml = rankingHtml.replace('📬 Contato', '📬 Contact');

// Titles & Texts
rankingHtml = rankingHtml.replace('🏆 RANKING GERAL & PLACAR NACIONAL 🇧🇷', '🏆 GLOBAL LEADERBOARD & HALL OF FAME 🌍');
rankingHtml = rankingHtml.replace('Confira os recordes oficiais em tempo real de ambos os modos de jogo!', 'Check official real-time records across all game modes!');
rankingHtml = rankingHtml.replace('Flappy Lula (Picanhas)', 'Flappy Lula (Steaks)');
rankingHtml = rankingHtml.replace('Empresário 3D (km)', '3D Runner (km)');
rankingHtml = rankingHtml.replace('Semanal', 'Weekly');
rankingHtml = rankingHtml.replace('Geral (Todos os Tempos)', 'All-Time General');
rankingHtml = rankingHtml.replace('Carregando ranking...', 'Loading leaderboards...');

fs.writeFileSync('en/ranking.html', rankingHtml, 'utf8');
console.log('✔ en/ranking.html created');

// -------------------------------------------------------------
// 4. CONQUISTAS.HTML -> EN/CONQUISTAS.HTML
// -------------------------------------------------------------
let conquistasHtml = fs.readFileSync('conquistas.html', 'utf8');
conquistasHtml = conquistasHtml.replace('<html lang="pt-BR">', '<html lang="en">');
conquistasHtml = conquistasHtml.replace('<title>Conquistas, Badges & Personagens — Lula Simulator</title>', '<title>Achievements, Badges & Political Roster — Flappy Lula</title>');
conquistasHtml = conquistasHtml.replace('<meta name="description" content="Desbloqueie conquistas, badges e figuras históricas como Lula, Janja, Bolsonaro, Dilma, Moraes e Pablo Marçal no Lula Simulator!">', '<meta name="description" content="Unlock achievements, collectible badges, and iconic political characters in Flappy Lula!">\n  <meta property="og:locale" content="en_US">');
conquistasHtml = conquistasHtml.replace('<link rel="canonical" href="https://lulasimulator.com.br/conquistas.html">', '<link rel="canonical" href="https://flappylula.com/conquistas.html">');
conquistasHtml = conquistasHtml.replace('<meta property="og:url" content="https://lulasimulator.com.br/conquistas.html">', '<meta property="og:url" content="https://flappylula.com/conquistas.html">');
conquistasHtml = conquistasHtml.replace('<meta property="og:locale" content="pt_BR">', '');

// Menu
conquistasHtml = conquistasHtml.replace('Início', 'Home');
conquistasHtml = conquistasHtml.replace('🐦 Flappy Lula', '🐦 Flappy Lula');
conquistasHtml = conquistasHtml.replace('🏃 Empresário 3D', '🏃 3D Runner');
conquistasHtml = conquistasHtml.replace('👥 Social & Duelos', '👥 Social & Duels');
conquistasHtml = conquistasHtml.replace('🛍️ Loja de Skins', '🛍️ Skin Shop');
conquistasHtml = conquistasHtml.replace('🏅 Conquistas', '🏅 Achievements');
conquistasHtml = conquistasHtml.replace('🏆 Ranking', '🏆 Leaderboard');
conquistasHtml = conquistasHtml.replace('🌍 Visitantes', '🌍 Visitors');
conquistasHtml = conquistasHtml.replace('⭐ Feedbacks', '⭐ Feedback');
conquistasHtml = conquistasHtml.replace('📬 Contato', '📬 Contact');

conquistasHtml = conquistasHtml.replace('🏅 CONQUISTAS & BADGES LENDÁRIAS', '🏅 ACHIEVEMENTS & LEGENDARY BADGES');
conquistasHtml = conquistasHtml.replace('Junte picanhas, atinja altas pontuações e desbloqueie todas as medalhas!', 'Collect steaks, reach high scores, and unlock all special badges!');

fs.writeFileSync('en/conquistas.html', conquistasHtml, 'utf8');
console.log('✔ en/conquistas.html created');

// -------------------------------------------------------------
// 5. LOJA.HTML -> EN/LOJA.HTML
// -------------------------------------------------------------
let lojaHtml = fs.readFileSync('loja.html', 'utf8');
lojaHtml = lojaHtml.replace('<html lang="pt-BR">', '<html lang="en">');
lojaHtml = lojaHtml.replace('<title>🛍️ Loja Oficial de Skins & Prestígio — Lula Simulator</title>', '<title>🛍️ Official Skin Shop & Prestige — Flappy Lula</title>');
lojaHtml = lojaHtml.replace('<meta name="description" content="Personalize seus personagens favoritos com skins cosméticas exclusivas (Lula, Bolsonaro, Nikolas, Janja, Moraes, Dilma, Marçal, Empresário) e ative o Prestígio Lendário no Lula Simulator!">', '<meta name="description" content="Customize your favorite characters with exclusive cosmetic skins and activate Legendary Prestige in Flappy Lula!">\n  <meta property="og:locale" content="en_US">');
lojaHtml = lojaHtml.replace('<link rel="canonical" href="https://lulasimulator.com.br/loja.html">', '<link rel="canonical" href="https://flappylula.com/loja.html">');

lojaHtml = lojaHtml.replace('Início', 'Home');
lojaHtml = lojaHtml.replace('🐦 Flappy Lula', '🐦 Flappy Lula');
lojaHtml = lojaHtml.replace('🏃 Empresário 3D', '🏃 3D Runner');
lojaHtml = lojaHtml.replace('👥 Social & Duelos', '👥 Social & Duels');
lojaHtml = lojaHtml.replace('🛍️ Loja de Skins', '🛍️ Skin Shop');
lojaHtml = lojaHtml.replace('🏅 Conquistas', '🏅 Achievements');
lojaHtml = lojaHtml.replace('🏆 Ranking', '🏆 Leaderboard');
lojaHtml = lojaHtml.replace('🌍 Visitantes', '🌍 Visitors');
lojaHtml = lojaHtml.replace('⭐ Feedbacks', '⭐ Feedback');
lojaHtml = lojaHtml.replace('📬 Contato', '📬 Contact');

lojaHtml = lojaHtml.replace('🛍️ LOJA OFICIAL DE SKINS & PRESTÍGIO', '🛍️ OFFICIAL SKIN SHOP & PRESTIGE');
lojaHtml = lojaHtml.replace('Personalize seus personagens favoritos com visuais exclusivos e suba de nível de Prestígio!', 'Customize your favorite characters with exclusive skins and level up your Prestige!');

fs.writeFileSync('en/loja.html', lojaHtml, 'utf8');
console.log('✔ en/loja.html created');

// -------------------------------------------------------------
// 6. SOCIAL.HTML -> EN/SOCIAL.HTML
// -------------------------------------------------------------
let socialHtml = fs.readFileSync('social.html', 'utf8');
socialHtml = socialHtml.replace('<html lang="pt-BR">', '<html lang="en">');
socialHtml = socialHtml.replace('<title>Central Social & Duelos 👥⚔️ — Lula Simulator</title>', '<title>Social Hub & Duels 👥⚔️ — Flappy Lula</title>');
socialHtml = socialHtml.replace('<meta name="description" content="Adicione amigos, dispute duelos assíncronos valendo Invictos e acompanhe o Torneio Semanal no Lula Simulator!">', '<meta name="description" content="Add friends, challenge players in asynchronous duels, and compete in the Weekly Tournament!">\n  <meta property="og:locale" content="en_US">');
socialHtml = socialHtml.replace('<link rel="canonical" href="https://lulasimulator.com.br/social.html">', '<link rel="canonical" href="https://flappylula.com/social.html">');

socialHtml = socialHtml.replace('Início', 'Home');
socialHtml = socialHtml.replace('🐦 Flappy Lula', '🐦 Flappy Lula');
socialHtml = socialHtml.replace('🏃 Empresário 3D', '🏃 3D Runner');
socialHtml = socialHtml.replace('👥 Social & Duelos', '👥 Social & Duels');
socialHtml = socialHtml.replace('🛍️ Loja de Skins', '🛍️ Skin Shop');
socialHtml = socialHtml.replace('🏅 Conquistas', '🏅 Achievements');
socialHtml = socialHtml.replace('🏆 Ranking', '🏆 Leaderboard');
socialHtml = socialHtml.replace('🌍 Visitantes', '🌍 Visitors');
socialHtml = socialHtml.replace('⭐ Feedbacks', '⭐ Feedback');
socialHtml = socialHtml.replace('📬 Contato', '📬 Contact');

socialHtml = socialHtml.replace('👥 CENTRAL SOCIAL & DUELOS ⚔️', '👥 SOCIAL HUB & DUELS ⚔️');

fs.writeFileSync('en/social.html', socialHtml, 'utf8');
console.log('✔ en/social.html created');

// -------------------------------------------------------------
// 7. VISITANTES.HTML -> EN/VISITANTES.HTML
// -------------------------------------------------------------
let visitantesHtml = fs.readFileSync('visitantes.html', 'utf8');
visitantesHtml = visitantesHtml.replace('<html lang="pt-BR">', '<html lang="en">');
visitantesHtml = visitantesHtml.replace('<title>Visitantes do Mundo & Estatísticas — Lula Simulator</title>', '<title>Global Visitors & Statistics — Flappy Lula</title>');
visitantesHtml = visitantesHtml.replace('<meta name="description" content="Acompanhe em tempo real os jogadores de vários países acessando o Lula Simulator e veja o ranking de acessos globais!">', '<meta name="description" content="Track in real-time players from countries all around the world accessing Flappy Lula!">\n  <meta property="og:locale" content="en_US">');
visitantesHtml = visitantesHtml.replace('<link rel="canonical" href="https://lulasimulator.com.br/visitantes.html">', '<link rel="canonical" href="https://flappylula.com/visitantes.html">');

visitantesHtml = visitantesHtml.replace('Início', 'Home');
visitantesHtml = visitantesHtml.replace('🐦 Flappy Lula', '🐦 Flappy Lula');
visitantesHtml = visitantesHtml.replace('🏃 Empresário 3D', '🏃 3D Runner');
visitantesHtml = visitantesHtml.replace('👥 Social & Duelos', '👥 Social & Duels');
visitantesHtml = visitantesHtml.replace('🛍️ Loja de Skins', '🛍️ Skin Shop');
visitantesHtml = visitantesHtml.replace('🏅 Conquistas', '🏅 Achievements');
visitantesHtml = visitantesHtml.replace('🏆 Ranking', '🏆 Leaderboard');
visitantesHtml = visitantesHtml.replace('🌍 Visitantes', '🌍 Visitors');
visitantesHtml = visitantesHtml.replace('⭐ Feedbacks', '⭐ Feedback');
visitantesHtml = visitantesHtml.replace('📬 Contato', '📬 Contact');

visitantesHtml = visitantesHtml.replace('🌍 VISITANTES DO MUNDO EM TEMPO REAL', '🌍 REAL-TIME GLOBAL VISITORS');

fs.writeFileSync('en/visitantes.html', visitantesHtml, 'utf8');
console.log('✔ en/visitantes.html created');

// -------------------------------------------------------------
// 8. FEEDBACK.HTML -> EN/FEEDBACK.HTML
// -------------------------------------------------------------
let feedbackHtml = fs.readFileSync('feedback.html', 'utf8');
feedbackHtml = feedbackHtml.replace('<html lang="pt-BR">', '<html lang="en">');
feedbackHtml = feedbackHtml.replace('<title>Feedbacks & Avaliações da Comunidade — Lula Simulator</title>', '<title>Community Feedback & Reviews — Flappy Lula</title>');
feedbackHtml = feedbackHtml.replace('<meta name="description" content="Leia as avaliações dos jogadores e envie seu feedback sobre o Lula Simulator!">', '<meta name="description" content="Read player reviews and submit your feedback about Flappy Lula!">\n  <meta property="og:locale" content="en_US">');
feedbackHtml = feedbackHtml.replace('<link rel="canonical" href="https://lulasimulator.com.br/feedback.html">', '<link rel="canonical" href="https://flappylula.com/feedback.html">');

feedbackHtml = feedbackHtml.replace('Início', 'Home');
feedbackHtml = feedbackHtml.replace('🐦 Flappy Lula', '🐦 Flappy Lula');
feedbackHtml = feedbackHtml.replace('🏃 Empresário 3D', '🏃 3D Runner');
feedbackHtml = feedbackHtml.replace('👥 Social & Duelos', '👥 Social & Duels');
feedbackHtml = feedbackHtml.replace('🛍️ Loja de Skins', '🛍️ Skin Shop');
feedbackHtml = feedbackHtml.replace('🏅 Conquistas', '🏅 Achievements');
feedbackHtml = feedbackHtml.replace('🏆 Ranking', '🏆 Leaderboard');
feedbackHtml = feedbackHtml.replace('🌍 Visitantes', '🌍 Visitors');
feedbackHtml = feedbackHtml.replace('⭐ Feedbacks', '⭐ Feedback');
feedbackHtml = feedbackHtml.replace('📬 Contato', '📬 Contact');

feedbackHtml = feedbackHtml.replace('⭐ FEEDBACKS & AVALIAÇÕES DA COMUNIDADE', '⭐ COMMUNITY REVIEWS & FEEDBACK');
feedbackHtml = feedbackHtml.replace('ENVIAR FEEDBACK', 'SUBMIT FEEDBACK');

fs.writeFileSync('en/feedback.html', feedbackHtml, 'utf8');
console.log('✔ en/feedback.html created');

// -------------------------------------------------------------
// 9. CONTATO.HTML -> EN/CONTATO.HTML
// -------------------------------------------------------------
let contatoHtml = fs.readFileSync('contato.html', 'utf8');
contatoHtml = contatoHtml.replace('<html lang="pt-BR">', '<html lang="en">');
contatoHtml = contatoHtml.replace('<title>Contato com o Desenvolvedor — Lula Simulator</title>', '<title>Contact the Developer — Flappy Lula</title>');
contatoHtml = contatoHtml.replace('<meta name="description" content="Entre em contato com o desenvolvedor do Lula Simulator para sugestões, dúvidas, elogios e parcerias comerciais!">', '<meta name="description" content="Contact the developer of Flappy Lula for suggestions, inquiries, and commercial partnerships!">\n  <meta property="og:locale" content="en_US">');
contatoHtml = contatoHtml.replace('<link rel="canonical" href="https://lulasimulator.com.br/contato.html">', '<link rel="canonical" href="https://flappylula.com/contato.html">');

contatoHtml = contatoHtml.replace('Início', 'Home');
contatoHtml = contatoHtml.replace('🐦 Flappy Lula', '🐦 Flappy Lula');
contatoHtml = contatoHtml.replace('🏃 Empresário 3D', '🏃 3D Runner');
contatoHtml = contatoHtml.replace('👥 Social & Duelos', '👥 Social & Duels');
contatoHtml = contatoHtml.replace('🛍️ Loja de Skins', '🛍️ Skin Shop');
contatoHtml = contatoHtml.replace('🏅 Conquistas', '🏅 Achievements');
contatoHtml = contatoHtml.replace('🏆 Ranking', '🏆 Leaderboard');
contatoHtml = contatoHtml.replace('🌍 Visitantes', '🌍 Visitors');
contatoHtml = contatoHtml.replace('⭐ Feedbacks', '⭐ Feedback');
contatoHtml = contatoHtml.replace('📬 Contato', '📬 Contact');

contatoHtml = contatoHtml.replace('📬 FALE COM O DESENVOLVEDOR', '📬 CONTACT THE DEVELOPER');
contatoHtml = contatoHtml.replace('ENVIAR MENSAGEM', 'SEND MESSAGE');

fs.writeFileSync('en/contato.html', contatoHtml, 'utf8');
console.log('✔ en/contato.html created');

console.log('All 9 pages in /en/ created successfully!');
