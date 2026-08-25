// scripts/update_all_translations.cjs — Atualização completa e profunda de todos os arquivos e módulos em inglês

const fs = require('fs');

console.log('--- 1. Traduzindo en/conquistas.html ---');
let con = fs.readFileSync('en/conquistas.html', 'utf8');

con = con.replace('<h1>🏅 BADGES & CONQUISTAS DO GAME</h1>', '<h1>🏅 ACHIEVEMENTS & EXCLUSIVE BADGES</h1>');
con = con.replace('<p>Colete picanhas no Flappy Lula e escape das armadilhas da CLT no Empresário 3D para desbloquear selos históricos e raros da política brasileira!</p>', '<p>Collect steaks in Flappy Lula and dodge corporate obstacles in 3D Runner to unlock historic and legendary political badges!</p>');

con = con.replace('<span class="stat-label">Jogador</span>', '<span class="stat-label">Player</span>');
con = con.replace('<span class="stat-label">🥩 Total de Picanhas</span>', '<span class="stat-label">🥩 Total Steaks</span>');
con = con.replace('<span class="stat-label">🐦 Recorde Flappy</span>', '<span class="stat-label">🐦 Flappy Best</span>');
con = con.replace('<span class="stat-label">🏃 Recorde Empresário</span>', '<span class="stat-label">🏃 3D Runner Best</span>');
con = con.replace('<span class="stat-label">🏆 Badges Liberadas</span>', '<span class="stat-label">🏆 Badges Unlocked</span>');
con = con.replace('title="Sincronizar com o banco de dados">🔄 Sincronizar</button>', 'title="Sync with cloud database">🔄 Sync Cloud</button>');
con = con.replace('🎁 GANHAR +10 PICANHAS BÔNUS (PARCEIRO)', '🎁 GET +10 BONUS STEAKS (SPONSOR)');

con = con.replace("title: 'Nikolas Ferreira — O Deputado Viral',", "title: 'Nikolas Ferreira — The Viral Deputy',");
con = con.replace("req: '⚡ 100 pts no Flappy + 300 km no 3D',", "req: '⚡ 100 pts Flappy + 300 km 3D',");
con = con.replace("desc: 'Nikolas Ferreira em velocidade máxima no comício! Cada cano ultrapassado rende o dobro de picanhas no placar (2x Pontos).'", "desc: 'Nikolas Ferreira at maximum rally speed! Each pipe passed grants 2x steaks on the scoreboard (2x Points).'");

con = con.replace("title: 'Alexandre de Moraes — Xandão do STF',", "title: 'Alexandre de Moraes — Supreme Xandão',");
con = con.replace("req: '🛡️ 120 Picanhas Acumuladas',", "req: '🛡️ 120 Accumulated Steaks',");
con = con.replace("desc: 'Xandão e a toga inquebrável. Possui um escudo protetor que salva o jogador da primeira batida violenta em um cano!'", "desc: 'Xandão and his unbreakable robe. Grants a protective shield saving the player from the first violent pipe collision!'");

con = con.replace("title: 'Jair Bolsonaro — O Capitão Patriota',", "title: 'Jair Bolsonaro — The Captain',");
con = con.replace("req: '🚀 200 Picanhas Acumuladas',", "req: '🚀 200 Accumulated Steaks',");
con = con.replace("desc: 'Jair Bolsonaro com a faixa e pose clássica. Ao engatar 4 canos seguidos, ativa 4 segundos de super velocidade e ímã de picanha!'", "desc: 'Jair Bolsonaro with the classic presidential sash. Clearing 4 pipes in a row triggers 4 seconds of super speed and steak magnet!'");

con = con.replace("title: 'Dilma Rousseff — A Estocadora de Vento',", "title: 'Dilma Rousseff — Cosmic Wind Stocker',");
con = con.replace("req: '🥔 100 Picanhas Acumuladas',", "req: '🥔 100 Accumulated Steaks',");
con = con.replace("desc: 'Saudação à mandioca! Ao passar pelos canos, chovem mandiocas douradas pelo cenário (acumula picanhas normalmente)!'", "desc: 'Cosmic energy and lighter gravity! Golden crops rain across the scenery while accumulating steaks normally!'");

con = con.replace("title: 'Pablo Marçal — O Homem do Código',", "title: 'Pablo Marçal — The Code Master',");
con = con.replace("req: '💵 Liberar Nikolas + Fazer 900 pts jogando com ele',", "req: '💵 Unlock Nikolas + Score 900 pts with him',");
con = con.replace("desc: 'Mindset quântico e velocidade turbo: triplica todos os pontos obtidos (3X) e solta chuva de notas de dinheiro pelo ar!'", "desc: 'Quantum mindset and turbo speed: triples all points earned (3X) and releases rain of banknotes through the air!'");

con = con.replace("if (picEl) picEl.textContent = `${currentPicanhas} 🥩 (Histórico: ${lifetimePicanhas})`;", "if (picEl) picEl.textContent = `${currentPicanhas} 🥩 (Lifetime: ${lifetimePicanhas})`;");
con = con.replace("modalReq.textContent = isUnlocked ? `✓ DESBLOQUEADO (${badge.req})` : `🔒 BLOQUEADO (${badge.req})`;", "modalReq.textContent = isUnlocked ? `✓ UNLOCKED (${badge.req})` : `🔒 LOCKED (${badge.req})`;");
con = con.replace("btnEquip.textContent = '✓ EQUIPADO NO RANKING';", "btnEquip.textContent = '✓ EQUIPPED ON LEADERBOARD';");
con = con.replace("btnEquip.textContent = '🎖️ EQUIPAR NO RANKING';", "btnEquip.textContent = '🎖️ EQUIP ON LEADERBOARD';");
con = con.replace("alert(`🎉 ${currentSelectedBadge.title} equipada com sucesso! O selo aparecerá ao lado do seu nome no Ranking Nacional! 🚀`);", "alert(`🎉 ${currentSelectedBadge.title} equipped successfully! The badge will appear beside your name on the Global Leaderboard! 🚀`);");
con = con.replace("alert(`🎁 Recompensa coletada! +${bonus} picanhas adicionadas à sua conta!`);", "alert(`🎁 Reward claimed! +${bonus} bonus steaks added to your account!`);");

con = con.replace("if (text) text.textContent = `✨ DESBLOQUEADO (${nikolasBest}/900 pts com Nikolas)`;", "if (text) text.textContent = `✨ UNLOCKED (${nikolasBest}/900 pts w/ Nikolas)`;");
con = con.replace("if (text) text.textContent = `Passo 1: Liberar Nikolas (300 pts Flappy + 300 km 3D)`;", "if (text) text.textContent = `Step 1: Unlock Nikolas (300 pts Flappy + 300 km 3D)`;");
con = con.replace("if (text) text.textContent = `Passo 2: Fazer 900 pts com Nikolas (${nikolasBest}/900 pts)`;", "if (text) text.textContent = `Step 2: Score 900 pts w/ Nikolas (${nikolasBest}/900 pts)`;");
con = con.replace("Picanhas Históricas", "Lifetime Steaks");

fs.writeFileSync('en/conquistas.html', con, 'utf8');
console.log('✔ en/conquistas.html atualizado!');

// -------------------------------------------------------------
// 2. Traduzindo en/correr.html
// -------------------------------------------------------------
console.log('--- 2. Traduzindo en/correr.html ---');
let cor = fs.readFileSync('en/correr.html', 'utf8');

cor = cor.replace('<label>Velocidade</label>', '<label>Speed</label>');
cor = cor.replace('🎭 PERSONAGENS', '🎭 CHARACTERS');
cor = cor.replace('title="Selecionar Personagem"', 'title="Select 3D Character"');
cor = cor.replace('title="Som"', 'title="Sound"');
cor = cor.replace('title="Tela Cheia"', 'title="Fullscreen"');

cor = cor.replace('title="Esquerda"', 'title="Left"');
cor = cor.replace('title="Pular"', 'title="Jump"');
cor = cor.replace('title="Deslizar"', 'title="Slide"');
cor = cor.replace('title="Direita"', 'title="Right"');

cor = cor.replace('🏃 EMPRESÁRIO NA FAVELA 3D', '🏃 3D ENDLESS RUNNER');
cor = cor.replace('Corra pelos trilhos da <strong>Favela do Rio</strong> desviando da <strong>CLT 44h</strong>, <strong>Bolsa Família</strong>, <strong>Auxílio Brasil</strong> e <strong>Trens de Metrô</strong> em 3D real!', 'Run along the tracks of Rio dodging welfare bills, work overload contracts, and oncoming Subway Trains in real 3D!');

cor = cor.replace('🎮 <strong>Como Jogar (Subway Surfers):</strong>', '🎮 <strong>How to Play (Subway Surfers Style):</strong>');
cor = cor.replace('• <strong>← → / A D / Swipe:</strong> Mudar de Faixa (Agilidade Dinâmica)', '• <strong>← → / A D / Swipe:</strong> Switch Lanes (Dynamic Agility)');
cor = cor.replace('• <strong>↑ / W / Espaço / Swipe Cima:</strong> Pular Barreiras', '• <strong>↑ / W / Space / Swipe Up:</strong> Jump Obstacles');
cor = cor.replace('• <strong>↓ / S / Swipe Baixo:</strong> Deslizar / Slide por baixo de Varais', '• <strong>↓ / S / Swipe Down:</strong> Slide Under Clotheslines & Barriers');
cor = cor.replace('• ⚡ <strong>Velocidade Acelerada:</strong> Aumenta gradativamente até 10.0x!', '• ⚡ <strong>Dynamic Speed:</strong> Gradually accelerates up to 10.0x!');
cor = cor.replace('• 💰 <strong>Colete Moedas e Picanhas</strong> para liberar novos personagens!', '• 💰 <strong>Collect Coins and Steaks</strong> to unlock new characters!');

cor = cor.replace('🔊 TOQUE PARA INICIAR A CORRIDA!', '🔊 TAP TO START RUNNING!');
cor = cor.replace('🎭 ESCOLHER PERSONAGEM (LULA / BOLSONARO)', '🎭 CHOOSE CHARACTER (LULA / BOLSONARO)');

cor = cor.replace('🎭 PERSONAGENS 3D', '🎭 3D CHARACTERS');
cor = cor.replace('Saldo de Moedas Acumuladas:', 'Accumulated Coins Balance:');
cor = cor.replace('💰 0 MOEDAS', '💰 0 COINS');
cor = cor.replace('EMPRESÁRIO', 'BUSINESSMAN');
cor = cor.replace('Personagem Inicial Padrão', 'Default Starting Character');
cor = cor.replace('🔄 Arraste para girar 360°', '🔄 Drag to rotate 360°');
cor = cor.replace('🚀 JOGAR COM O EMPRESÁRIO', '🚀 PLAY WITH THIS CHARACTER');

cor = cor.replace('<div class="modal-title">CAPTURADO!</div>', '<div class="modal-title">GAME OVER!</div>');
cor = cor.replace('<div class="modal-subtitle" id="goTitle">OBSTÁCULO</div>', '<div class="modal-subtitle" id="goTitle">OBSTACLE</div>');
cor = cor.replace('<div class="modal-message" id="goMessage">Você foi pego pelo sistema!</div>', '<div class="modal-message" id="goMessage">You were caught by the obstacle!</div>');
cor = cor.replace('0 KM PERCORRIDOS', '0 KM TRAVELED');
cor = cor.replace('🔄 REINICIAR CORRIDA 3D', '🔄 PLAY AGAIN');
cor = cor.replace('🏠 INÍCIO', '🏠 HOME');
cor = cor.replace('🎭 ESCOLHER OUTRO PERSONAGEM', '🎭 CHANGE CHARACTER');
cor = cor.replace('🎁 GANHAR +100 MOEDAS BÔNUS (PARCEIRO)', '🎁 GET +100 BONUS COINS (SPONSOR)');

fs.writeFileSync('en/correr.html', cor, 'utf8');
console.log('✔ en/correr.html atualizado!');

// -------------------------------------------------------------
// 3. Traduzindo en/jogo.html
// -------------------------------------------------------------
console.log('--- 3. Traduzindo en/jogo.html ---');
let jog = fs.readFileSync('en/jogo.html', 'utf8');

jog = jog.replace('🚨 13 PONTOS: MODO CADEIA ATIVADO!', '🚨 13 POINTS: PRISON MODE ACTIVATED!');
jog = jog.replace('🕊️ Voo Tolerante & Picanha', '🕊️ Forgiving Flight & Steaks');
jog = jog.replace('Habilidade: Voo Tolerante & Picanha', 'Ability: Forgiving Flight & Steaks');
jog = jog.replace('Hitbox menor e mais generosa. Voo suave e tolerante a colisões leves.', 'Smaller, forgiving hitbox. Smooth flight tolerant of light collisions.');

fs.writeFileSync('en/jogo.html', jog, 'utf8');
console.log('✔ en/jogo.html atualizado!');

// -------------------------------------------------------------
// 4. Traduzindo en/visitantes.html
// -------------------------------------------------------------
console.log('--- 4. Traduzindo en/visitantes.html ---');
let vis = fs.readFileSync('en/visitantes.html', 'utf8');

vis = vis.replace('<span>Radar Global em Tempo Real</span>', '<span>Real-Time Global Traffic Radar</span>');
vis = vis.replace('<h1>VISITANTES DO MUNDO 🌍</h1>', '<h1>GLOBAL VISITORS 🌍</h1>');
vis = vis.replace('Veja em tempo real de quais partes do planeta os patriotas e jogadores estão acessando o <strong>Lula Simulator</strong>!', 'Track in real time where players around the globe are playing Flappy Lula and 3D Runner!');

vis = vis.replace('<span class="kpi-title">Total de Acessos</span>', '<span class="kpi-title">Total Pageviews</span>');
vis = vis.replace('<div class="kpi-sub">Sessões globais registradas</div>', '<div class="kpi-sub">Global sessions recorded</div>');

vis = vis.replace('<span class="kpi-title">Países Conectados</span>', '<span class="kpi-title">Connected Countries</span>');
vis = vis.replace('<div class="kpi-sub">Nações diferentes no mapa</div>', '<div class="kpi-sub">Distinct nations on the map</div>');

vis = vis.replace('<span class="kpi-title">País Mais Patriota</span>', '<span class="kpi-title">Top Player Country</span>');
vis = vis.replace('<div class="kpi-sub" id="statTopCountryPercent">Líder isolado</div>', '<div class="kpi-sub" id="statTopCountryPercent">Top leaderboard nation</div>');

vis = vis.replace('<span class="kpi-title">Status da Rede</span>', '<span class="kpi-title">Network Status</span>');
vis = vis.replace('>AO VIVO<', '>LIVE<');
vis = vis.replace('<div class="kpi-sub">Sincronização Cloud Ativa</div>', '<div class="kpi-sub">Cloud Telemetry Active</div>');

vis = vis.replace('<h3>O Brasil lidera a comunidade patriótica!</h3>', '<h3>Brazil leads the global player community!</h3>');
vis = vis.replace('<p>A imensa maioria dos jogadores acessa diretamente de terras tupiniquins com orgulho e picanha!</p>', '<p>The majority of players join in to enjoy steaks, memes, and endless running!</p>');

vis = vis.replace('<span>🏆 Ranking por Países</span>', '<span>🏆 Country Leaderboard</span>');
vis = vis.replace('placeholder="Buscar país ou código..."', 'placeholder="Search country or ISO code..."');
vis = vis.replace('<span>Clique em qualquer país para filtrar o radar de acessos ao lado!</span>', '<span>Click any country to filter telemetry metrics!</span>');
vis = vis.replace('<p>Carregando mapa de nações... 🇧🇷</p>', '<p>Loading nation analytics... 🌍</p>');

fs.writeFileSync('en/visitantes.html', vis, 'utf8');
console.log('✔ en/visitantes.html atualizado!');

// -------------------------------------------------------------
// 5. Traduzindo en/social.html
// -------------------------------------------------------------
console.log('--- 5. Traduzindo en/social.html ---');
let soc = fs.readFileSync('en/social.html', 'utf8');

soc = soc.replace('<h1>CENTRAL SOCIAL & DUELOS 🇧🇷</h1>', '<h1>SOCIAL HUB & DUELS 👥</h1>');
soc = soc.replace('Adicione amigos da comunidade, dispute duelos assíncronos valendo sequências de vitórias (Win Streaks) e dispute o Torneio Semanal da Copa Brasília!', 'Add community friends, battle in asynchronous duels for Win Streaks, and compete in the official Weekly Tournament!');

soc = soc.replace('>👥 AMIGOS & BUSCA<', '>👥 FRIENDS & SEARCH<');
soc = soc.replace('>⚔️ MEUS DUELOS<', '>⚔️ MY DUELS<');

soc = soc.replace('🔍 ADICIONAR E ENCONTRAR AMIGOS', '🔍 ADD & FIND FRIENDS');
soc = soc.replace('placeholder="Digite o username do amigo (ex: Daniel, Capitão, Lula...)"', 'placeholder="Enter friend\'s username (e.g. Daniel, Victor, Lula...)"');
soc = soc.replace('➕ ADICIONAR', '➕ ADD');
soc = soc.replace('🔍 BUSCAR', '🔍 SEARCH');
soc = soc.replace('Resultados da Busca', 'Search Results');
soc = soc.replace('📬 SOLICITAÇÕES DE AMIZADE RECEBIDAS', '📬 INCOMING FRIEND REQUESTS');
soc = soc.replace('📤 SOLICITAÇÕES ENVIADAS (AGUARDANDO CONFIRMAÇÃO)', '📤 SENT FRIEND REQUESTS (PENDING)');
soc = soc.replace('⭐ MEUS AMIGOS CONECTADOS', '⭐ CONNECTED FRIENDS');
soc = soc.replace('Carregando seus amigos... ⏳', 'Loading your friends... ⏳');

soc = soc.replace('⚔️ CENTRAL DE DUELOS ASSÍNCRONOS', '⚔️ ASYNCHRONOUS DUELS HUB');
soc = soc.replace('Desafie qualquer jogador: seu recorde é travado e o adversário tem 48h para superar a marca!', 'Challenge any player: your score is locked in and your opponent has 48h to beat it!');
soc = soc.replace('➕ NOVO DESAFIO', '➕ NEW CHALLENGE');
soc = soc.replace('⏳ DUELOS EM ANDAMENTO', '⏳ ACTIVE DUELS');
soc = soc.replace('Carregando duelos...', 'Loading duels...');
soc = soc.replace('📜 HISTÓRICO DE DUELOS RECENTES', '📜 RECENT DUEL HISTORY');
soc = soc.replace('Carregando histórico...', 'Loading duel history...');

soc = soc.replace('🏆 COPA BRASÍLIA · TORNEIO SEMANAL', '🏆 BRASÍLIA CUP · WEEKLY TOURNAMENT');
soc = soc.replace('Os 8 melhores colocados da semana competem em chaveamento eliminatório direto (Quartas, Semis e Final)!', 'The top 8 weekly players face off in a single-elimination tournament bracket (Quarters, Semis, and Finals)!');
soc = soc.replace('Montando chaveamento oficial... ⏳', 'Assembling tournament bracket... ⏳');

soc = soc.replace('⚔️ DESAFIAR JOGADOR', '⚔️ CHALLENGE PLAYER');
soc = soc.replace('Seu recorde atual será travado como meta. O adversário terá 48h para superar sua pontuação!', 'Your score will be locked in as the target. Your opponent will have 48h to beat it!');
soc = soc.replace('Nome do Adversário', 'Opponent Username');
soc = soc.replace('placeholder="Digite o username exato..."', 'placeholder="Enter exact username..."');
soc = soc.replace('Modalidade do Duelo', 'Game Mode');
soc = soc.replace('🐦 Flappy Lula (Picanhas)', '🐦 Flappy Lula (Steaks)');
soc = soc.replace('🏃 Empresário 3D (Distância km)', '🏃 3D Runner (Distance km)');
soc = soc.replace('>Cancelar<', '>Cancel<');
soc = soc.replace('DISPARAR DESAFIO ⚔️', 'SEND CHALLENGE ⚔️');

fs.writeFileSync('en/social.html', soc, 'utf8');
console.log('✔ en/social.html atualizado!');

// -------------------------------------------------------------
// 6. Traduzindo Footer em en/index.html
// -------------------------------------------------------------
console.log('--- 6. Traduzindo footer em en/index.html ---');
let idx = fs.readFileSync('en/index.html', 'utf8');
idx = idx.replace('Desenvolvido por <strong>Daniel dos Santos</strong> no <strong>SENAI</strong> (Programação com IA) · 2026', 'Developed by <strong>Daniel dos Santos</strong> at <strong>SENAI</strong> (AI & Software Engineering) · 2026');
fs.writeFileSync('en/index.html', idx, 'utf8');
console.log('✔ en/index.html atualizado!');
