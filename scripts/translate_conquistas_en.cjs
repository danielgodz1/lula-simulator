// scripts/translate_conquistas_en.cjs — Tradução completa dos cards e badges em en/conquistas.html

const fs = require('fs');

let c = fs.readFileSync('en/conquistas.html', 'utf8');

c = c.replace('<span>🎖️ MEDALHAS DE HONRA & SELOS EXCLUSIVOS DO RANKING</span>', '<span>🎖️ MEDALS OF HONOR & EXCLUSIVE LEADERBOARD BADGES</span>');
c = c.replace('<span>🎭 CONQUISTAS POLÍTICAS & PERSONAGENS</span>', '<span>🎭 POLITICAL ACHIEVEMENTS & CHARACTER UNLOCKS</span>');

// Badge 1 (Bolsonaro Medal)
c = c.replace('Medalha Imbrochável (Clube Bolsonaro)', 'Never-Give-Up Medal (Bolsonaro Club)');
c = c.replace('🎖️ 3.000 Picanhas Acumuladas', '🎖️ 3,000 Accumulated Steaks');
c = c.replace('A relíquia máxima dos patriotas: Imorrível, Imbrochável e Incomível! Equipe para exibir o selo dourado <strong>[🎖️ Imbrochável]</strong> ao lado do seu nome no topo do Ranking!', 'The ultimate patriotic badge! Equip to display the shining golden tag <strong>[🎖️ Imbrochável]</strong> beside your name at the top of the Global Leaderboard!');
c = c.replace('0 / 3000 Picanhas', '0 / 3,000 Steaks');

// Badge 2 (Golden Steak)
c = c.replace('Selo Presidencial "Picanha de Ouro"', 'Presidential "Golden Steak" Seal');
c = c.replace('🥩 1.500 Picanhas Acumuladas', '🥩 1,500 Accumulated Steaks');
c = c.replace('O diploma máximo de churrasqueiro nacional com isenção total de impostos! Equipe para exibir o selo <strong>[🥩 Picanha Ouro]</strong> no Ranking!', 'The ultimate grill master diploma with zero tax deduction! Equip to display the tag <strong>[🥩 Golden Steak]</strong> on the Leaderboard!');
c = c.replace('0 / 1500 Picanhas', '0 / 1,500 Steaks');

// Badge 3 (Habeas Corpus)
c = c.replace('Habeas Corpus Supremo (STF)', 'Supreme Habeas Corpus (STF)');
c = c.replace('⚖️ 2.500 Picanhas Acumuladas', '⚖️ 2,500 Accumulated Steaks');
c = c.replace('Imunidade jurídica total concedida pela Suprema Corte dos Canos! Equipe para exibir o selo <strong>[⚖️ STF]</strong> no Ranking!', 'Total legal immunity granted by the Supreme Pipe Court! Equip to display the tag <strong>[⚖️ STF]</strong> on the Leaderboard!');
c = c.replace('0 / 2500 Picanhas', '0 / 2,500 Steaks');

// Badge 4 (Mindset 3X)
c = c.replace('Código Quântico do Mindset 3X', 'Quantum Mindset 3X Code');
c = c.replace('🚀 2.000 Picanhas Acumuladas', '🚀 2,000 Accumulated Steaks');
c = c.replace('Destrave o código da sua mente de piloto e mostre quem manda! Equipe para exibir o selo <strong>[🚀 Mindset 3X]</strong> no Ranking!', 'Unlock the code of your peak performance mindset! Equip to display the tag <strong>[🚀 Mindset 3X]</strong> on the Leaderboard!');
c = c.replace('0 / 2000 Picanhas', '0 / 2,000 Steaks');

// Badge 5 (Wind Stocker)
c = c.replace('Selo Estocador de Vento Oficial', 'Official Galactic Wind Stocker Seal');
c = c.replace('🌪️ 1.000 Picanhas Acumuladas', '🌪️ 1,000 Accumulated Steaks');
c = c.replace('Certificado de saudação à mandioca e armazenamento de energia cósmica! Equipe para exibir o selo <strong>[🌪️ Vento]</strong> no Ranking!', 'Certificate of cosmic energy storage and gentle gravity control! Equip to display the tag <strong>[🌪️ Wind]</strong> on the Leaderboard!');
c = c.replace('0 / 1000 Picanhas', '0 / 1,000 Steaks');

// Badge 6 (Trio)
c = c.replace('Selo Supremo "Trio de Brasília"', 'Supreme "Brasília Trio" Seal');
c = c.replace('⚡ 500 Picanhas Acumuladas', '⚡ 500 Accumulated Steaks');
c = c.replace('A união mais inacreditável da história! Lula com a capa, Bolsonaro assustado e Alexandre de Moraes voando juntos entre os canos!', 'The most unbelievable political team-up! Lula, Bolsonaro, and Alexandre de Moraes flying together through obstacles!');
c = c.replace('0 / 500 Picanhas', '0 / 500 Steaks');

// Badge 7 (Lula Solo)
c = c.replace('Selo "Voa, Meu Povo!"', 'Official "Fly, My People!" Seal');
c = c.replace('🥩 50 Picanhas Acumuladas', '🥩 50 Accumulated Steaks');
c = c.replace('O Presidente voa triunfante pelos céus de Brasília, distribuindo picanha de primeira com a bandeira do Brasil ao fundo!', 'The President flies triumphantly across Brasília, distributing top-tier steaks with the national flag in the background!');
c = c.replace('0 / 50 Picanhas', '0 / 50 Steaks');

// Extra Character Badges
c = c.replace('Janja da Silva (Primeira-Dama)', 'Janja da Silva (The First Lady)');
c = c.replace('💖 Desbloquear com 25 Picanhas', '💖 Unlock with 25 Steaks');
c = c.replace('Chuva de curtidas e corações bônus concedendo +2 pontos.', 'Rain of bonus likes and hearts granting +2 points.');

c = c.replace('Nikolas Ferreira (O Deputado Viral)', 'Nikolas Ferreira (The Viral Deputy)');
c = c.replace('⚡ Missão: 300 pts Flappy + 300 km 3D', '⚡ Mission: 300 pts Flappy + 300 km 3D');
c = c.replace('Velocidade turbo e 2x picanhas por cano!', 'Turbo speed and 2x steaks per pipe!');

c = c.replace('Alexandre de Moraes (Xandão)', 'Alexandre de Moraes (Xandão)');
c = c.replace('🛡️ Desbloquear com 120 Picanhas', '🛡️ Unlock with 120 Steaks');
c = c.replace('Escudo Supremo que quebra o primeiro cano sem morrer!', 'Supreme Shield that breaks the first pipe without dying!');

c = c.replace('Jair Bolsonaro (O Capitão)', 'Jair Bolsonaro (The Captain)');
c = c.replace('🎯 Desbloquear com 60 Picanhas', '🎯 Unlock with 60 Steaks');
c = c.replace('Espaço 15% mais aberto entre os canos para manobras fáceis.', '15% wider gap between pipes for easy navigation.');

c = c.replace('Dilma Rousseff (Coração Valente)', 'Dilma Rousseff (Brave Heart)');
c = c.replace('💨 Desbloquear com 100 Picanhas', '💨 Unlock with 100 Steaks');
c = c.replace('Gravidade 10% mais suave permitindo planeios perfeitos.', '10% lighter gravity allowing smooth gliding.');

c = c.replace('Pablo Marçal (Mindset Quântico)', 'Pablo Marçal (Quantum Mindset)');
c = c.replace('🚀 Missão: 900 pts com Nikolas', '🚀 Mission: 900 pts with Nikolas');
c = c.replace('Triplica todos os pontos (3X) e solta chuva de notas e dólares!', 'Triples all points (3X) and releases rain of banknotes!');

fs.writeFileSync('en/conquistas.html', c, 'utf8');
console.log('✔ en/conquistas.html badge cards fully translated!');
