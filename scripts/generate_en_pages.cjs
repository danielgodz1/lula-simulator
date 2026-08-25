// scripts/generate_en_pages.cjs — Gerador Robusto das Páginas em /en/

const fs = require('fs');

if (!fs.existsSync('en')) {
  fs.mkdirSync('en', { recursive: true });
}

function processCommonAssetPaths(html) {
  // Ajusta caminhos para serem absolutos a partir da raiz
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
// 1. INDEX.HTML -> EN/INDEX.HTML
// -------------------------------------------------------------
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace('<html lang="pt-BR">', '<html lang="en">');
indexHtml = indexHtml.replace('<title>Flappy Lula - O Jogo Meme das Eleições 2026</title>', '<title>Flappy Lula - The Brazilian Political Meme Game</title>');
indexHtml = indexHtml.replace('<meta name="description" content="Voe pelos obstáculos neste jogo satírico do Flappy Lula. Sobreviva ao cenário político brasileiro! Jogue grátis no navegador, sem baixar nada.">', '<meta name="description" content="Fly through obstacles in this hilarious Brazilian political satire game. Survive Brazil\'s wildest political scenario! Free browser game, no download needed.">');
indexHtml = indexHtml.replace('<link rel="canonical" href="https://lulasimulator.com.br/">', '<link rel="canonical" href="https://flappylula.com/">');
indexHtml = indexHtml.replace('<meta property="og:url" content="https://lulasimulator.com.br/">', '<meta property="og:url" content="https://flappylula.com/">');
indexHtml = indexHtml.replace('<meta property="og:title" content="Flappy Lula - O Jogo Meme das Eleições 2026">', '<meta property="og:title" content="Flappy Lula - The Brazilian Political Meme Game">');
indexHtml = indexHtml.replace('<meta property="og:description" content="Voe pelos obstáculos neste jogo satírico do Flappy Lula. Sobreviva ao cenário político brasileiro! Jogue grátis no navegador, sem baixar nada.">', '<meta property="og:description" content="Fly through obstacles in this hilarious Brazilian political satire game. Free browser game, no download needed.">');
indexHtml = indexHtml.replace('<meta property="og:locale" content="pt_BR">', '<meta property="og:locale" content="en_US">');
indexHtml = indexHtml.replace('"inLanguage": "pt-BR"', '"inLanguage": "en"');

indexHtml = indexHtml.replace('🇧🇷 O SIMULADOR POLÍTICO MAIS DIVERTIDO DO BRASIL', '🇧🇷 THE FUNNIEST POLITICAL SATIRE GAME');
indexHtml = indexHtml.replace('<span class="verde">LULA</span><br>\n          <span class="amarelo">SIMULATOR</span>', '<span class="verde">FLAPPY</span><br>\n          <span class="amarelo">LULA</span>');
indexHtml = indexHtml.replace('Faça o presidente voar no <strong>Flappy Lula</strong> distribuindo picanha, junte badges lendárias de <strong>50 e 500 Picanhas</strong> com figuras históricas da política ou fuja da CLT no <strong>Empresário 3D</strong>!', 'Make the president fly in <strong>Flappy Lula</strong> distributing juicy steaks, collect legendary badges with iconic political characters, or run away from taxes in <strong>3D Runner</strong>!');

indexHtml = indexHtml.replace('🐦 JOGAR FLAPPY LULA', '🐦 PLAY FLAPPY LULA');
indexHtml = indexHtml.replace('🏃 JOGAR EMPRESÁRIO 3D', '🏃 PLAY 3D RUNNER');
indexHtml = indexHtml.replace('👥 AMIGOS & DUELOS', '👥 FRIENDS & DUELS');
indexHtml = indexHtml.replace('🏆 VER RANKING', '🏆 LEADERBOARD');
indexHtml = indexHtml.replace('⭐ ARTE OFICIAL DO JOGO ⭐', '⭐ OFFICIAL GAME ART ⭐');

indexHtml = indexHtml.replace('🏆 TOP 3 DO BRASIL EM TEMPO REAL 🇧🇷', '🏆 REAL-TIME TOP 3 LEADERBOARD 🌍');
indexHtml = indexHtml.replace('Confira o pódio oficial dos melhores jogadores ou dispute uma vaga no ranking completo!', 'Check out the top scoring players or compete to enter the global Hall of Fame!');
indexHtml = indexHtml.replace('🐦 Flappy Lula (Picanhas)', '🐦 Flappy Lula (Steaks)');
indexHtml = indexHtml.replace('🏃 Empresário 3D (km)', '🏃 3D Runner (km)');
indexHtml = indexHtml.replace('Consultando os melhores jogadores do Brasil... 🇧🇷', 'Loading leaderboard champions... 🌍');
indexHtml = indexHtml.replace('🏆 VER RANKING COMPLETO (TOP 300) ➜', '🏆 VIEW FULL LEADERBOARD (TOP 300) ➜');

indexHtml = indexHtml.replace('MODOS DE JOGO & RECURSOS 🎮', 'GAME MODES & HIGHLIGHTS 🎮');
indexHtml = indexHtml.replace('Flappy Lula 2D', 'Flappy Lula 2D');
indexHtml = indexHtml.replace('Ajude o Lula a voar entre os canos e soltar picanhas. A cada 13 pontos, entre e saia do cenário dinâmico de cadeia com os 171!', 'Help Lula fly between industrial pipes and throw steaks. Every 13 points, survive the dynamic prison mode with earthquake tremors!');
indexHtml = indexHtml.replace('Empresário 3D Real', 'Businessman 3D Runner');
indexHtml = indexHtml.replace('Motor Three.js com iluminação tropical radiante! Fuja do Bolsa Família, Auxílio e Carteira Assinada nos morros do Rio.', 'High-performance 3D engine! Dodge subway trains, toll barriers, stop signs, and welfare bills across Rio\'s iconic hills.');
indexHtml = indexHtml.replace('Badges & Conquistas', 'Badges & Achievements');
indexHtml = indexHtml.replace('Colete 50 picanhas para desbloquear o <strong>Selo Lula Solo</strong> e 500 picanhas para o <strong>Trio Polêmico Supremo</strong>!', 'Collect 50 steaks to unlock the <strong>Solo Lula Badge</strong> and 500 steaks for the legendary <strong>Supreme Political Trio</strong>!');
indexHtml = indexHtml.replace('Visitantes do Mundo', 'Global Visitors');
indexHtml = indexHtml.replace('Acompanhe em tempo real as nações que acessam o site, o ranking patriótico e as bandeiras de cada jogador!', 'Track in real-time visitors from all continents, national leaderboards, and international flags for every player!');

indexHtml = indexHtml.replace('PERGUNTAS FREQUENTES (FAQ) ❓', 'FREQUENTLY ASKED QUESTIONS (FAQ) ❓');
indexHtml = indexHtml.replace('🎮 O que é o Lula Simulator?', '🎮 What is Flappy Lula?');
indexHtml = indexHtml.replace('O <strong>Lula Simulator</strong> é um jogo arcade satírico brasileiro e 100% gratuito para jogar no navegador (PC e Celular), com modos como o clássico <strong>Flappy Lula</strong> e o frenético <strong>Empresário vs CLT 3D</strong>.', '<strong>Flappy Lula</strong> is a 100% free-to-play satirical browser game, featuring the classic <strong>2D Flappy arcade mode</strong> and the intense <strong>3D Businessman endless runner</strong>.');
indexHtml = indexHtml.replace('🕹️ Como jogar o Jogo do Lula?', '🕹️ How to play the game?');
indexHtml = indexHtml.replace('No <strong>Flappy Lula</strong>, clique na tela ou aperte Barra de Espaço para voar desviando dos canos e coletar picanhas. No <strong>Empresário 3D</strong>, use as setas ou deslize no celular para desviar de boletos, CLT e Bolsa Família.', 'In <strong>Flappy Lula</strong>, click/tap the screen or hit Spacebar to fly, dodge pipes, and collect steaks. In <strong>3D Runner</strong>, use arrow keys or swipe on mobile to dodge obstacles, trains, and bills.');
indexHtml = indexHtml.replace('🎭 Quais personagens posso jogar?', '🎭 Which characters can I play?');
indexHtml = indexHtml.replace('Você pode jogar com o <strong>Lula</strong>, <strong>Janja</strong>, <strong>Alexandre de Moraes</strong>, <strong>Nikolas Ferreira</strong>, <strong>Jair Bolsonaro</strong>, <strong>Dilma Rousseff</strong> e desbloquear o lendário <strong>Pablo Marçal (Mindset Quântico 3X)</strong>!', 'You can play with <strong>Lula</strong>, <strong>Janja</strong>, <strong>Alexandre de Moraes</strong>, <strong>Nikolas Ferreira</strong>, <strong>Jair Bolsonaro</strong>, <strong>Dilma Rousseff</strong>, and unlock the legendary <strong>Pablo Marçal (3X Quantum Mindset)</strong>!');
indexHtml = indexHtml.replace('📱 Preciso baixar ou instalar algum aplicativo?', '📱 Do I need to download or install an app?');
indexHtml = indexHtml.replace('Não! O jogo roda instantaneamente em qualquer navegador moderno (Chrome, Safari, Edge, Firefox) no Android, iPhone ou PC com suporte a 60 FPS e WebGL 3D.', 'No! The game runs instantly in any modern web browser (Chrome, Safari, Edge, Firefox) on Android, iPhone, Mac, or PC with buttery smooth 60-120 FPS WebGL rendering.');

indexHtml = indexHtml.replace('DESENVOLVIDO POR DANIEL DOS SANTOS', 'DEVELOPED BY DANIEL DOS SANTOS');
indexHtml = indexHtml.replace('Projeto Interativo · SENAI — Curso de Programação com Inteligência Artificial', 'Interactive Project · SENAI — Artificial Intelligence & Software Development Program');
indexHtml = indexHtml.replace('Este jogo foi desenvolvido por <strong>Daniel dos Santos</strong> como um projeto interativo no <strong>SENAI</strong>, no curso de <strong>Programação com Inteligência Artificial</strong>, no qual tive um imenso aprendizado e evolução para a minha carreira profissional. O jogo foi criado como uma <strong>crítica social engraçada e bem-humorada sobre a realidade do Brasil</strong>, unindo inteligência artificial, renderização gráfica 3D e física interativa em tempo real.', 'This game was created by <strong>Daniel dos Santos</strong> as an interactive capstone project at <strong>SENAI</strong>, in the <strong>AI & Software Engineering</strong> course. The game was designed as a <strong>humorous and satirical social commentary on Brazilian culture and politics</strong>, combining artificial intelligence, real-time 3D graphics rendering, and interactive physics.');

// Menu links in en/index.html
indexHtml = indexHtml.replace('🇧🇷 LULA SIMULATOR', '🐦 FLAPPY LULA');
indexHtml = indexHtml.replace('>Início<', '>Home<');
indexHtml = indexHtml.replace('>🏃 Empresário 3D<', '>🏃 3D Runner<');
indexHtml = indexHtml.replace('>👥 Social & Duelos<', '>👥 Social & Duels<');
indexHtml = indexHtml.replace('>🛍️ Loja de Skins<', '>🛍️ Skin Shop<');
indexHtml = indexHtml.replace('>🏅 Conquistas<', '>🏅 Achievements<');
indexHtml = indexHtml.replace('>🏆 Ranking<', '>🏆 Leaderboard<');
indexHtml = indexHtml.replace('>🌍 Visitantes<', '>🌍 Visitors<');
indexHtml = indexHtml.replace('>⭐ Feedbacks<', '>⭐ Feedback<');
indexHtml = indexHtml.replace('>📬 Contato<', '>📬 Contact<');

indexHtml = indexHtml.replace('href="index.html"', 'href="/en/index.html"');
indexHtml = indexHtml.replace('href="jogo.html"', 'href="/en/jogo.html"');
indexHtml = indexHtml.replace('href="correr.html"', 'href="/en/correr.html"');
indexHtml = indexHtml.replace('href="social.html"', 'href="/en/social.html"');
indexHtml = indexHtml.replace('href="loja.html"', 'href="/en/loja.html"');
indexHtml = indexHtml.replace('href="conquistas.html"', 'href="/en/conquistas.html"');
indexHtml = indexHtml.replace('href="ranking.html"', 'href="/en/ranking.html"');
indexHtml = indexHtml.replace('href="visitantes.html"', 'href="/en/visitantes.html"');
indexHtml = indexHtml.replace('href="feedback.html"', 'href="/en/feedback.html"');
indexHtml = indexHtml.replace('href="contato.html"', 'href="/en/contato.html"');

indexHtml = processCommonAssetPaths(indexHtml);
fs.writeFileSync('en/index.html', indexHtml, 'utf8');
console.log('✔ en/index.html updated');

// -------------------------------------------------------------
// 2. JOGO.HTML -> EN/JOGO.HTML
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

// Menu links in en/jogo.html
jogoHtml = jogoHtml.replace('href="index.html"', 'href="/en/index.html"');
jogoHtml = jogoHtml.replace('href="jogo.html"', 'href="/en/jogo.html"');
jogoHtml = jogoHtml.replace('href="correr.html"', 'href="/en/correr.html"');
jogoHtml = jogoHtml.replace('href="social.html"', 'href="/en/social.html"');
jogoHtml = jogoHtml.replace('href="loja.html"', 'href="/en/loja.html"');
jogoHtml = jogoHtml.replace('href="conquistas.html"', 'href="/en/conquistas.html"');
jogoHtml = jogoHtml.replace('href="ranking.html"', 'href="/en/ranking.html"');
jogoHtml = jogoHtml.replace('href="visitantes.html"', 'href="/en/visitantes.html"');
jogoHtml = jogoHtml.replace('href="feedback.html"', 'href="/en/feedback.html"');
jogoHtml = jogoHtml.replace('href="contato.html"', 'href="/en/contato.html"');

jogoHtml = processCommonAssetPaths(jogoHtml);
fs.writeFileSync('en/jogo.html', jogoHtml, 'utf8');
console.log('✔ en/jogo.html updated');

// -------------------------------------------------------------
// 3. CORRER.HTML -> EN/CORRER.HTML
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

// Menu links in en/correr.html
correrHtml = correrHtml.replace('href="index.html"', 'href="/en/index.html"');
correrHtml = correrHtml.replace('href="jogo.html"', 'href="/en/jogo.html"');
correrHtml = correrHtml.replace('href="correr.html"', 'href="/en/correr.html"');
correrHtml = correrHtml.replace('href="social.html"', 'href="/en/social.html"');
correrHtml = correrHtml.replace('href="loja.html"', 'href="/en/loja.html"');
correrHtml = correrHtml.replace('href="conquistas.html"', 'href="/en/conquistas.html"');
correrHtml = correrHtml.replace('href="ranking.html"', 'href="/en/ranking.html"');
correrHtml = correrHtml.replace('href="visitantes.html"', 'href="/en/visitantes.html"');
correrHtml = correrHtml.replace('href="feedback.html"', 'href="/en/feedback.html"');
correrHtml = correrHtml.replace('href="contato.html"', 'href="/en/contato.html"');

correrHtml = processCommonAssetPaths(correrHtml);
fs.writeFileSync('en/correr.html', correrHtml, 'utf8');
console.log('✔ en/correr.html updated');

// -------------------------------------------------------------
// 4-10: RANKING, CONQUISTAS, LOJA, SOCIAL, VISITANTES, FEEDBACK, CONTATO
// -------------------------------------------------------------
const otherPages = [
  { file: 'ranking.html', title: 'Global Leaderboards & Hall of Fame — Flappy Lula', desc: 'Check real-time global leaderboards for Flappy Lula and 3D Runner. See who holds the world record score!' },
  { file: 'conquistas.html', title: 'Achievements, Badges & Political Roster — Flappy Lula', desc: 'Unlock achievements, collectible badges, and iconic political characters in Flappy Lula!' },
  { file: 'loja.html', title: '🛍️ Official Skin Shop & Prestige — Flappy Lula', desc: 'Customize your favorite characters with exclusive skins and level up your Prestige in Flappy Lula!' },
  { file: 'social.html', title: 'Social Hub & Duels 👥⚔️ — Flappy Lula', desc: 'Add friends, challenge players in asynchronous duels, and compete in the Weekly Tournament!' },
  { file: 'visitantes.html', title: 'Global Visitors & Statistics — Flappy Lula', desc: 'Track in real-time players from countries all around the world accessing Flappy Lula!' },
  { file: 'feedback.html', title: 'Community Reviews & Feedback — Flappy Lula', desc: 'Read player reviews and submit your feedback about Flappy Lula!' },
  { file: 'contato.html', title: 'Contact the Developer — Flappy Lula', desc: 'Contact the developer of Flappy Lula for suggestions, inquiries, and commercial partnerships!' }
];

for (const p of otherPages) {
  let content = fs.readFileSync(p.file, 'utf8');
  content = content.replace('<html lang="pt-BR">', '<html lang="en">');
  content = content.replace(/<title>.*?<\/title>/, `<title>${p.title}</title>`);
  content = content.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${p.desc}">`);
  content = content.replace(new RegExp(`https://lulasimulator\\.com\\.br/${p.file}`, 'g'), `https://flappylula.com/${p.file}`);
  content = content.replace('<meta property="og:locale" content="pt_BR">', '<meta property="og:locale" content="en_US">');

  // Menu items
  content = content.replace('>Início<', '>Home<');
  content = content.replace('>🏃 Empresário 3D<', '>🏃 3D Runner<');
  content = content.replace('>👥 Social & Duelos<', '>👥 Social & Duels<');
  content = content.replace('>🛍️ Loja de Skins<', '>🛍️ Skin Shop<');
  content = content.replace('>🏅 Conquistas<', '>🏅 Achievements<');
  content = content.replace('>🏆 Ranking<', '>🏆 Leaderboard<');
  content = content.replace('>🌍 Visitantes<', '>🌍 Visitors<');
  content = content.replace('>⭐ Feedbacks<', '>⭐ Feedback<');
  content = content.replace('>📬 Contato<', '>📬 Contact<');
  content = content.replace('🇧🇷 LULA SIMULATOR', '🐦 FLAPPY LULA');

  // Links
  content = content.replace(/href="index\.html"/g, 'href="/en/index.html"');
  content = content.replace(/href="jogo\.html"/g, 'href="/en/jogo.html"');
  content = content.replace(/href="correr\.html"/g, 'href="/en/correr.html"');
  content = content.replace(/href="social\.html"/g, 'href="/en/social.html"');
  content = content.replace(/href="loja\.html"/g, 'href="/en/loja.html"');
  content = content.replace(/href="conquistas\.html"/g, 'href="/en/conquistas.html"');
  content = content.replace(/href="ranking\.html"/g, 'href="/en/ranking.html"');
  content = content.replace(/href="visitantes\.html"/g, 'href="/en/visitantes.html"');
  content = content.replace(/href="feedback\.html"/g, 'href="/en/feedback.html"');
  content = content.replace(/href="contato\.html"/g, 'href="/en/contato.html"');

  content = processCommonAssetPaths(content);
  fs.writeFileSync(`en/${p.file}`, content, 'utf8');
  console.log(`✔ en/${p.file} updated`);
}

console.log('✨ All 10 EN pages are 100% processed and configured with absolute asset paths!');
