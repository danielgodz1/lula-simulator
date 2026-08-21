// js/game/characters.js — Sistema Modular de Inventário de Personagens e Habilidades
//
// COMO ADICIONAR UM NOVO PERSONAGEM:
// 1. Adicione um novo objeto no array CHARACTERS abaixo com:
//    - id: identificador único em string (ex: 'astronauta')
//    - name: Nome do personagem
//    - title: Título/Arquétipo
//    - desc: Descrição visual
//    - sprite: Caminho da imagem em 'img/nome_da_imagem.png'
//    - requiredPicanhas: Pontuação total acumulada necessária para destravar (0 para inicial)
//    - skillName: Nome da habilidade especial
//    - skillDesc: Resumo do efeito na gameplay
//    - auraColor: Cor da aura de salto em hexadecimal (ex: '#ffdf00')
//    - modifier: Função que ajusta parâmetros do gameState (ex: hitbox, speed, jump, special)

export const CHARACTERS = [
  {
    id: 'president',
    name: 'O Presidente Popular',
    title: 'Arquétipo Carismático',
    desc: 'Terno simples, aceno de mão e visual caloroso.',
    sprite: 'img/lula.png',
    requiredPicanhas: 0, // Sempre desbloqueado
    skillName: '🕊️ Pulo Tolerante',
    skillDesc: 'Hitbox menor e mais generosa. Pulo macio e tolerante a erros.',
    auraColor: '#ffdf00',
    modifier: (state) => {
      state.HITBOX_R = 0.024; // Hitbox reduzida
      state.GAP_RATIO = 0.42;
      state.SPEED_MULT = 1.0;
      state.EXTRA_SCORE_PER_PIPE = 1;
      state.hasShield = false;
      state.isTurboAllowed = false;
    }
  },
  {
    id: 'first_lady',
    name: 'A Primeira-Dama Influencer',
    title: 'Arquétipo Fashionista',
    desc: 'Estilo moderno, óculos escuros e aura reluzente ao pular.',
    sprite: 'img/first_lady.png',
    requiredPicanhas: 25,
    skillName: '💖 Chuva de Curtidas',
    skillDesc: 'Curtidas e corações bônus aparecem no trajeto dando +2 pontos extras.',
    auraColor: '#ec4899',
    modifier: (state) => {
      state.HITBOX_R = 0.026;
      state.GAP_RATIO = 0.42;
      state.SPEED_MULT = 1.0;
      state.EXTRA_SCORE_PER_PIPE = 1;
      state.spawnExtraLikes = true;
      state.hasShield = false;
      state.isTurboAllowed = false;
    }
  },
  {
    id: 'young_viral',
    name: 'O Jovem Conservador Viral',
    title: 'Arquétipo Orador de Palco',
    desc: 'Microfone na mão e energia de comício vibrante.',
    sprite: 'img/young_viral.png',
    requiredPicanhas: 60,
    skillName: '⚡ Ritmo Acelerado (2x Pontos)',
    skillDesc: 'Velocidade 1.35x maior, porém cada cano ultrapassado vale 2 picanhas!',
    auraColor: '#06b6d4',
    modifier: (state) => {
      state.HITBOX_R = 0.028;
      state.GAP_RATIO = 0.40;
      state.SPEED_MULT = 1.35; // Mais rápido
      state.EXTRA_SCORE_PER_PIPE = 2; // Dobro de pontos
      state.hasShield = false;
      state.isTurboAllowed = false;
    }
  },
  {
    id: 'minister',
    name: 'O Ministro Linha-Dura',
    title: 'Arquétipo Guardião da Toga',
    desc: 'Toga clássica estilizada e olhar firme da justiça.',
    sprite: 'img/minister.png',
    requiredPicanhas: 120,
    skillName: '🛡️ Escudo da Lei',
    skillDesc: 'Possui 1 Escudo Protetor por partida. Resiste à 1ª colisão sem morrer!',
    auraColor: '#a855f7',
    modifier: (state) => {
      state.HITBOX_R = 0.026;
      state.GAP_RATIO = 0.42;
      state.SPEED_MULT = 1.0;
      state.EXTRA_SCORE_PER_PIPE = 1;
      state.hasShield = true; // Escudo protetor
      state.shieldCharges = 1;
      state.isTurboAllowed = false;
    }
  },
  {
    id: 'ex_president',
    name: 'O Ex-Presidente Nostálgico',
    title: 'Arquétipo Patriota Clássico',
    desc: 'Farda verde-oliva cerimonial e óculos escuros aviador.',
    sprite: 'img/ex_president.png',
    requiredPicanhas: 200,
    skillName: '🚀 Modo Turbo Combo',
    skillDesc: 'Após 4 canos perfeitos sem bater, ativa 4s de super velocidade e ímã!',
    auraColor: '#22c55e',
    modifier: (state) => {
      state.HITBOX_R = 0.026;
      state.GAP_RATIO = 0.42;
      state.SPEED_MULT = 1.0;
      state.EXTRA_SCORE_PER_PIPE = 1;
      state.hasShield = false;
      state.isTurboAllowed = true;
      state.comboGoal = 4;
    }
  }
];

const SELECTED_CHAR_KEY = 'flappy_selected_character_id';
const TOTAL_PICANHAS_KEY = 'flappy_total_accumulated_picanhas';

export class CharacterInventory {
  static getTotalPicanhas() {
    return parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
  }

  static addPicanhas(amount) {
    if (amount <= 0) return this.getTotalPicanhas();
    const current = this.getTotalPicanhas();
    const updated = current + amount;
    localStorage.setItem(TOTAL_PICANHAS_KEY, updated.toString());
    return updated;
  }

  static isUnlocked(charId) {
    const char = CHARACTERS.find(c => c.id === charId);
    if (!char) return false;
    return this.getTotalPicanhas() >= char.requiredPicanhas;
  }

  static getSelectedCharacter() {
    const savedId = localStorage.getItem(SELECTED_CHAR_KEY) || 'president';
    const found = CHARACTERS.find(c => c.id === savedId);
    if (found && this.isUnlocked(found.id)) {
      return found;
    }
    return CHARACTERS[0]; // Padrão
  }

  static setSelectedCharacter(charId) {
    if (this.isUnlocked(charId)) {
      localStorage.setItem(SELECTED_CHAR_KEY, charId);
      return true;
    }
    return false;
  }

  static applyModifier(character, gameState) {
    if (character && typeof character.modifier === 'function') {
      character.modifier(gameState);
    }
  }
}
