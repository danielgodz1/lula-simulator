// scripts/translate_data.cjs — Adiciona suporte multilíngue aos metadados de Skins e Personagens

const fs = require('fs');

// 1. ATUALIZA SKINS.JS
const skinsJsContent = `// js/game/skins.js — Catálogo Centralizado de Skins Cosméticas e Tabela Fixa de Preços

export const SKIN_PRICING_TABLE = {
  // --- LULA ---
  'lula_presidencial': {
    id: 'lula_presidencial',
    charId: 'lula',
    name: 'Terno Presidencial Dourado',
    name_en: 'Golden Presidential Suit',
    desc: 'Lula com terno de gala preto, gravata vermelha brilhante e faixa presidencial de ouro.',
    desc_en: 'Lula in a luxury black gala suit, radiant red tie, and pure gold presidential sash.',
    price: 500,
    currency: 'picanhas',
    emoji: '👔',
    badge: 'PRESIDENCIAL',
    badge_en: 'PRESIDENTIAL',
    glowColor: '#ffd700',
    capColor: '#eab308',
    sprite: '/img/skins/lula_presidencial.png'
  },
  'lula_cyber': {
    id: 'lula_cyber',
    charId: 'lula',
    name: 'Lula Ciborgue 2077',
    name_en: 'Lula Cyborg 2077',
    desc: 'Versão do futuro com armadura cibernética de titânio e propulsores iônicos.',
    desc_en: 'Futuristic version featuring titanium cybernetic armor and ion thrusters.',
    price: 1500,
    currency: 'picanhas',
    emoji: '🤖',
    badge: 'CYBERPUNK',
    badge_en: 'CYBERPUNK',
    glowColor: '#00f0ff',
    capColor: '#00f0ff',
    sprite: '/img/skins/lula_cyber.png'
  },
  'lula_praia': {
    id: 'lula_praia',
    charId: 'lula',
    name: 'Lula de Férias na Praia',
    name_en: 'Lula on Beach Vacation',
    desc: 'Regata azul tropical, óculos escuros espelhados e bermuda de descanso.',
    desc_en: 'Tropical blue tank top, mirrored sunglasses, and comfortable holiday shorts.',
    price: 300,
    currency: 'picanhas',
    emoji: '🏖️',
    badge: 'RELAX',
    badge_en: 'RELAX',
    glowColor: '#38bdf8',
    capColor: '#38bdf8',
    sprite: '/img/skins/lula_praia.png'
  },

  // --- BOLSONARO ---
  'bolsonaro_moto': {
    id: 'bolsonaro_moto',
    charId: 'bolsonaro',
    name: 'Capitão Motociclista',
    name_en: 'Motorcycle Captain',
    desc: 'Jaqueta de couro preta de motociclista, capacete aberto e óculos escuros.',
    desc_en: 'Black biker leather jacket, open helmet, and dark pilot sunglasses.',
    price: 800,
    currency: 'picanhas',
    emoji: '🏍️',
    badge: 'MOTOCIATA',
    badge_en: 'MOTORCADE',
    glowColor: '#f97316',
    capColor: '#f97316',
    sprite: '/img/skins/bolsonaro_moto.png'
  },
  'bolsonaro_patriota': {
    id: 'bolsonaro_patriota',
    charId: 'bolsonaro',
    name: 'Patriota Dourado Lendário',
    name_en: 'Legendary Golden Patriot',
    desc: 'Armadura patriótica reluzente verde e amarela com manto dourado reluzente.',
    desc_en: 'Shining green and yellow patriotic armor draped with a gleaming golden cape.',
    price: 1800,
    currency: 'picanhas',
    emoji: '🔰',
    badge: 'LENDÁRIO',
    badge_en: 'LEGENDARY',
    glowColor: '#22c55e',
    capColor: '#eab308',
    sprite: '/img/skins/bolsonaro_patriota.png'
  },

  // --- NIKOLAS ---
  'nikolas_gamer': {
    id: 'nikolas_gamer',
    charId: 'nikolas',
    name: 'Nikolas Gamer RGB',
    name_en: 'Nikolas RGB Gamer',
    desc: 'Headset gamer com iluminação RGB cromada e moletom streamer oficial.',
    desc_en: 'Chrome RGB gaming headset paired with the official streamer hoodie.',
    price: 600,
    currency: 'picanhas',
    emoji: '🎧',
    badge: 'STREAMER',
    badge_en: 'STREAMER',
    glowColor: '#a855f7',
    capColor: '#a855f7',
    sprite: '/img/skins/nikolas_gamer.png'
  },
  'nikolas_chupetinha': {
    id: 'nikolas_chupetinha',
    charId: 'nikolas',
    name: 'Nikole de Peruca',
    name_en: 'Nikole in Blonde Wig',
    desc: 'Peruca loira icônica e microfone com pedestal para discursos parlamentares.',
    desc_en: 'Iconic blonde wig and standing microphone for fiery viral floor speeches.',
    price: 1200,
    currency: 'picanhas',
    emoji: '👱‍♀️',
    badge: 'MEME VIZINHO',
    badge_en: 'VIRAL MEME',
    glowColor: '#ec4899',
    capColor: '#ec4899',
    sprite: '/img/skins/nikolas_chupetinha.png'
  },

  // --- JANJA ---
  'janja_gala': {
    id: 'janja_gala',
    charId: 'janja',
    name: 'Janja Alta Costura',
    name_en: 'Janja Haute Couture',
    desc: 'Vestido de gala bordado à mão em seda pura com tiara de brilhantes.',
    desc_en: 'Hand-embroidered pure silk gala gown accessorized with a diamond tiara.',
    price: 700,
    currency: 'picanhas',
    emoji: '💃',
    badge: 'ALTA COSTURA',
    badge_en: 'HAUTE COUTURE',
    glowColor: '#f43f5e',
    capColor: '#f43f5e',
    sprite: '/img/skins/janja_gala.png'
  },
  'janja_neon': {
    id: 'janja_neon',
    charId: 'janja',
    name: 'Janja Fashionista Neon',
    name_en: 'Janja Neon Fashionista',
    desc: 'Look vibrante com óculos de sol neon e sneakers plataforma de edição limitada.',
    desc_en: 'Vibrant look with glowing neon shades and limited edition platform sneakers.',
    price: 1400,
    currency: 'picanhas',
    emoji: '✨',
    badge: 'FASHION NEON',
    badge_en: 'FASHION NEON',
    glowColor: '#06b6d4',
    capColor: '#06b6d4',
    sprite: '/img/skins/janja_neon.png'
  },

  // --- MORAES (XANDÃO) ---
  'moraes_gold': {
    id: 'moraes_gold',
    charId: 'moraes',
    name: 'Xandão Toga Dourada STF',
    name_en: 'Xandão Supreme Golden Robe',
    desc: 'Toga cerimonial bordada com fios de ouro maciço e martelo de juiz celestial.',
    desc_en: 'Ceremonial robe woven with solid gold threads and celestial judge gavel.',
    price: 1000,
    currency: 'picanhas',
    emoji: '⚖️',
    badge: 'SUPREMO',
    badge_en: 'SUPREME',
    glowColor: '#ffd700',
    capColor: '#ffd700',
    sprite: '/img/skins/moraes_gold.png'
  },
  'moraes_cosmico': {
    id: 'moraes_cosmico',
    charId: 'moraes',
    name: 'Guardião Cósmico da Constituição',
    name_en: 'Cosmic Guardian of Law',
    desc: 'Aura cósmica translúcida e manto de estrelas com poder do inquérito intergaláctico.',
    desc_en: 'Translucent cosmic aura and starry cloak wielding intergalactic authority.',
    price: 2000,
    currency: 'picanhas',
    emoji: '🌌',
    badge: 'CÓSMICO',
    badge_en: 'COSMIC',
    glowColor: '#6366f1',
    capColor: '#6366f1',
    sprite: '/img/skins/moraes_cosmico.png'
  },

  // --- DILMA ---
  'dilma_mandioca_gold': {
    id: 'dilma_mandioca_gold',
    charId: 'dilma',
    name: 'Mandiocósmica Dourada',
    name_en: 'Golden Mandiocosmic',
    desc: 'Armadura dourada com mandiocas cintilantes girando ao redor em órbita perfeita.',
    desc_en: 'Golden armor surrounded by sparkling cassava roots orbiting in perfect harmony.',
    price: 900,
    currency: 'picanhas',
    emoji: '🥔',
    badge: 'MANDIOCÓSMICA',
    badge_en: 'MANDIOCOSMIC',
    glowColor: '#eab308',
    capColor: '#eab308',
    sprite: '/img/skins/dilma_mandioca_gold.png'
  },
  'dilma_vento': {
    id: 'dilma_vento',
    charId: 'dilma',
    name: 'Estocadora do Vento Galáctica',
    name_en: 'Galactic Wind Stocker',
    desc: 'Turbina eólica miniaturizada nas costas que libera brisas galácticas puras.',
    desc_en: 'Miniaturized back-mounted wind turbine storing and releasing galactic breezes.',
    price: 1600,
    currency: 'picanhas',
    emoji: '🌪️',
    badge: 'ESTOCADORA',
    badge_en: 'WIND STOCKER',
    glowColor: '#14b8a6',
    capColor: '#14b8a6',
    sprite: '/img/skins/dilma_vento.png'
  },

  // --- PABLO MARÇAL ---
  'marcal_black': {
    id: 'marcal_black',
    charId: 'marcal',
    name: 'Marçal Black Card Bilionário',
    name_en: 'Marçal Billionaire Black Card',
    desc: 'Blazer slim fit italiano, cartão Black ilimitado no bolso e headset do Mindset.',
    desc_en: 'Italian slim-fit blazer, unlimited black card in pocket, and high-energy headset.',
    price: 1500,
    currency: 'picanhas',
    emoji: '💳',
    badge: 'BLACK CARD',
    badge_en: 'BLACK CARD',
    glowColor: '#1e293b',
    capColor: '#ffd700',
    sprite: '/img/skins/marcal_black.png'
  },
  'marcal_quantico': {
    id: 'marcal_quantico',
    charId: 'marcal',
    name: 'Holográfico Quântico 3X',
    name_en: 'Quantum Hologram 3X',
    desc: 'Forma quântica etérea azul néon capaz de destravar a frequência máxima do universo.',
    desc_en: 'Neon-blue ethereal quantum form unlocking peak frequencies and 3X multiplier.',
    price: 2500,
    currency: 'picanhas',
    emoji: '🔮',
    badge: 'QUÂNTICO 3X',
    badge_en: 'QUANTUM 3X',
    glowColor: '#3b82f6',
    capColor: '#60a5fa',
    sprite: '/img/skins/marcal_quantico.png'
  },

  // --- EMPRESÁRIO 3D ---
  'empresario_faria_lima': {
    id: 'empresario_faria_lima',
    charId: 'empresario',
    name: 'Faria Lima Colete Puffer',
    name_en: 'Wall Street Puffer Vest',
    desc: 'Colete puffer azul marinho, patinete elétrico e café expresso gourmet.',
    desc_en: 'Navy puffer vest, electric kick scooter, and gourmet espresso coffee.',
    price: 1000,
    currency: 'coins',
    emoji: '🛴',
    badge: 'FARIA LIMA',
    badge_en: 'WALL STREET',
    glowColor: '#0ea5e9',
    capColor: '#0ea5e9',
    sprite: '/img/skins/empresario_faria_lima.png'
  },
  'empresario_cyberpunk': {
    id: 'empresario_cyberpunk',
    charId: 'empresario',
    name: 'Empresário Cyberpunk Neon',
    name_en: 'Cyberpunk Neon CEO',
    desc: 'Terno com fibras ópticas iluminadas e óculos de realidade aumentada.',
    desc_en: 'Glowing fiber-optic suit equipped with augmented reality cyber shades.',
    price: 2500,
    currency: 'coins',
    emoji: '🏙️',
    badge: 'CYBER CEO',
    badge_en: 'CYBER CEO',
    glowColor: '#10b981',
    capColor: '#10b981',
    sprite: '/img/skins/empresario_cyberpunk.png'
  }
};

export function getSkinById(skinId) {
  return SKIN_PRICING_TABLE[skinId] || null;
}

export function getSkinsForCharacter(charId) {
  return Object.values(SKIN_PRICING_TABLE).filter(s => s.charId === charId);
}

export function isSkinUnlocked(user, skinId) {
  if (!user || !skinId) return false;
  const skins = Array.isArray(user.unlockedSkins) ? user.unlockedSkins : [];
  return skins.includes(skinId);
}

export function getEquippedSkin(user, charId) {
  if (!user) return null;
  const equipped = user.equippedSkins || {};
  const skinId = typeof equipped === 'object' ? equipped[charId] : (typeof equipped === 'string' ? equipped : null);
  return skinId ? getSkinById(skinId) : null;
}
`;

fs.writeFileSync('js/game/skins.js', skinsJsContent, 'utf8');
console.log('✔ js/game/skins.js updated with bilingual support');
