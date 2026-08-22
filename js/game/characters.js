// js/game/characters.js — Sistema de Personagens Políticos Reais e Sincronização Cloud de Picanhas
import { firebaseConfig } from '../firebase-config.js';

export const CHARACTERS = [
  {
    id: 'lula',
    name: 'Lula da Silva',
    nickname: 'O Presidente',
    title: 'Lula da Silva — O Presidente',
    desc: 'Terno presidencial, carisma popular e voo macio distribuindo picanha para o povo.',
    sprite: 'img/lula.png',
    requiredPicanhas: 0, // Sempre liberado
    skillName: '🕊️ Voo Tolerante & Picanha',
    skillDesc: 'Hitbox menor e mais generosa. Voo suave e tolerante a colisões leves.',
    auraColor: '#ffdf00',
    modifier: (state) => {
      state.HITBOX_R = 0.024;
      state.GAP_RATIO = 0.42;
      state.SPEED_MULT = 1.0;
      state.EXTRA_SCORE_PER_PIPE = 1;
      state.hasShield = false;
      state.isTurboAllowed = false;
      state.spawnExtraLikes = false;
    }
  },
  {
    id: 'janja',
    name: 'Janja da Silva',
    nickname: 'A Primeira-Dama',
    title: 'Janja da Silva — A Primeira-Dama',
    desc: 'Óculos modernos, visual vibrante e presença marcante com chuva de corações bônus.',
    sprite: 'img/janja.png',
    requiredPicanhas: 25,
    skillName: '💖 Chuva de Curtidas (+2 pts)',
    skillDesc: 'Curtidas e corações bônus aparecem no trajeto concedendo +2 pontos adicionais.',
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
    id: 'nikolas',
    name: 'Nikolas Ferreira',
    nickname: 'O Deputado Viral',
    title: 'Nikolas Ferreira — O Deputado Viral',
    desc: 'Microfone em punho e gravata verde-amarela. Velocidade turbo com dobro de picanhas!',
    sprite: 'img/nikolas.png',
    requiredPicanhas: 60,
    skillName: '⚡ Ritmo Acelerado (2x Picanhas)',
    skillDesc: 'Velocidade turbo e 2x picanhas. A cada 1 min, o Lula aparece dando 20s de lentidão e 3x pontos!',
    auraColor: '#06b6d4',
    modifier: (state) => {
      state.HITBOX_R = 0.028;
      state.GAP_RATIO = 0.40;
      state.SPEED_MULT = 1.35;
      state.EXTRA_SCORE_PER_PIPE = 2;
      state.spawnExtraLikes = false;
      state.hasShield = false;
      state.isTurboAllowed = false;
    }
  },
  {
    id: 'moraes',
    name: 'Alexandre de Moraes',
    nickname: 'Xandão do STF',
    title: 'Alexandre de Moraes — Xandão',
    desc: 'Toga da Suprema Corte e martelo da justiça. Possui escudo blindado contra colisões.',
    sprite: 'img/moraes.png',
    requiredPicanhas: 120,
    skillName: '🛡️ Mandado Blindado (Escudo)',
    skillDesc: 'Possui 1 Escudo Protetor por partida. Quebra o 1º cano sem morrer!',
    auraColor: '#a855f7',
    modifier: (state) => {
      state.HITBOX_R = 0.026;
      state.GAP_RATIO = 0.42;
      state.SPEED_MULT = 1.0;
      state.EXTRA_SCORE_PER_PIPE = 1;
      state.spawnExtraLikes = false;
      state.hasShield = true;
      state.shieldCharges = 1;
      state.isTurboAllowed = false;
    }
  },
  {
    id: 'bolsonaro',
    name: 'Jair Bolsonaro',
    nickname: 'O Capitão',
    title: 'Jair Bolsonaro — O Capitão',
    desc: 'Faixa presidencial e pose clássica. Acumule 4 canos perfeitos para ativar o Modo Turbo!',
    sprite: 'img/bolsonaro.png',
    requiredPicanhas: 200,
    skillName: '🚀 Modo Turbo Patriota',
    skillDesc: 'A cada 4 canos perfeitos sem bater, ativa 4s de super velocidade e ímã de picanha!',
    auraColor: '#22c55e',
    modifier: (state) => {
      state.HITBOX_R = 0.026;
      state.GAP_RATIO = 0.42;
      state.SPEED_MULT = 1.0;
      state.EXTRA_SCORE_PER_PIPE = 1;
      state.spawnExtraLikes = false;
      state.hasShield = false;
      state.isTurboAllowed = true;
      state.comboGoal = 4;
    }
  },
  {
    id: 'dilma',
    name: 'Dilma Rousseff',
    nickname: 'A Estocadora de Vento',
    title: 'Dilma Rousseff — A Estocadora',
    desc: 'Saudação à mandioca! Ao passar pelos canos, chovem mandiocas douradas (pontua picanhas normalmente)!',
    sprite: 'img/dilma.png',
    requiredPicanhas: 100, // Liberada com 100 picanhas
    skillName: '🥔 Saudação à Mandioca',
    skillDesc: 'Chuva de mandiocas e aipins nos canos! Acúmulo de picanhas padrão e voo suave.',
    auraColor: '#ef4444',
    modifier: (state) => {
      state.HITBOX_R = 0.025;
      state.GAP_RATIO = 0.42;
      state.SPEED_MULT = 1.0;
      state.EXTRA_SCORE_PER_PIPE = 1;
      state.spawnExtraLikes = false;
      state.hasShield = false;
      state.isTurboAllowed = false;
    }
  },
  {
    id: 'marcal',
    name: 'Pablo Marçal',
    nickname: 'O Homem do Código',
    title: 'Pablo Marçal — Mindset Quântico',
    desc: 'Requer liberar a Dilma e conquistar 200 pontos jogando com a Dilma! Velocidade acelerada, 3X pontos e chuva de dinheiro!',
    sprite: 'img/marcal.png',
    requiredPicanhas: 0, // Desbloqueio especial por missão da Dilma
    skillName: '💵 Mindset 3X & Chuva de Grana',
    skillDesc: 'Velocidade 1.35x maior, triplica os pontos obtidos (3X) e solta chuva de notas e dólares!',
    auraColor: '#0ea5e9',
    modifier: (state) => {
      state.HITBOX_R = 0.027;
      state.GAP_RATIO = 0.40;
      state.SPEED_MULT = 1.35;
      state.EXTRA_SCORE_PER_PIPE = 3;
      state.spawnExtraLikes = false;
      state.hasShield = false;
      state.isTurboAllowed = false;
    }
  }
];

const SELECTED_CHAR_KEY = 'flappy_selected_character_id';
const TOTAL_PICANHAS_KEY = 'flappy_total_accumulated_picanhas';
const DILMA_BEST_SCORE_KEY = 'flappy_dilma_record_score';

export class CharacterInventory {
  static getTotalPicanhas() {
    return parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
  }

  static setTotalPicanhas(amount) {
    const val = Math.max(0, parseInt(amount, 10) || 0);
    localStorage.setItem(TOTAL_PICANHAS_KEY, val.toString());
    return val;
  }

  static getDilmaBest() {
    return parseInt(localStorage.getItem(DILMA_BEST_SCORE_KEY) || '0', 10);
  }

  static recordDilmaScore(score) {
    const num = parseInt(score, 10) || 0;
    const current = this.getDilmaBest();
    if (num > current) {
      localStorage.setItem(DILMA_BEST_SCORE_KEY, num.toString());
    }
    return Math.max(num, current);
  }

  static addPicanhas(amount) {
    if (amount <= 0) return this.getTotalPicanhas();
    const current = this.getTotalPicanhas();
    const updated = current + amount;
    localStorage.setItem(TOTAL_PICANHAS_KEY, updated.toString());
    return updated;
  }

  static async syncPicanhasNow() {
    const total = this.getTotalPicanhas();
    this.syncPicanhasToCloud(total);
  }

  static async syncPicanhasToCloud(total) {
    try {
      let playerName = '';
      const rawUser = localStorage.getItem('lula_current_user_v2');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u && u.username) playerName = u.username;
      }
      if (!playerName) {
        playerName = localStorage.getItem('lula_player') || '';
      }
      if (!playerName) return;

      const norm = playerName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(norm)}?updateMask.fieldPaths=totalPicanhas&updateMask.fieldPaths=lastSync`;
      
      const payload = {
        fields: {
          totalPicanhas: { integerValue: total.toString() },
          lastSync: { timestampValue: new Date().toISOString() }
        }
      };

      fetch(docUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (e) {}
  }

  static isUnlocked(charId) {
    const char = CHARACTERS.find(c => c.id === charId || c.id === this.mapLegacyId(charId));
    if (!char) return false;

    // Desbloqueio Especial do Pablo Marçal
    if (char.id === 'marcal') {
      const isDilmaUnlocked = this.isUnlocked('dilma');
      const dilmaBest = this.getDilmaBest();
      return isDilmaUnlocked && dilmaBest >= 200;
    }

    return this.getTotalPicanhas() >= char.requiredPicanhas;
  }

  static getUnlockDescription(charId) {
    const char = CHARACTERS.find(c => c.id === charId || c.id === this.mapLegacyId(charId));
    if (!char) return '';

    if (char.id === 'marcal') {
      const isDilmaUnlocked = this.isUnlocked('dilma');
      const dilmaBest = this.getDilmaBest();
      if (!isDilmaUnlocked) {
        return `🔒 Requer liberar a Dilma (100 🥩)`;
      }
      if (dilmaBest < 200) {
        return `🔒 Faça 200 pts com a Dilma (${dilmaBest}/200 pts)`;
      }
      return `✨ DESBLOQUEADO!`;
    }

    if (this.isUnlocked(char.id)) {
      return `✨ DESBLOQUEADO`;
    }
    return `🔒 ${char.requiredPicanhas} 🥩`;
  }

  static mapLegacyId(id) {
    const map = {
      'president': 'lula',
      'first_lady': 'janja',
      'young_viral': 'nikolas',
      'minister': 'moraes',
      'ex_president': 'bolsonaro'
    };
    return map[id] || id;
  }

  static getSelectedCharacter() {
    let savedId = localStorage.getItem(SELECTED_CHAR_KEY) || 'lula';
    savedId = this.mapLegacyId(savedId);
    const found = CHARACTERS.find(c => c.id === savedId);
    if (found && this.isUnlocked(found.id)) {
      return found;
    }
    return CHARACTERS[0];
  }

  static setSelectedCharacter(charId) {
    const mapped = this.mapLegacyId(charId);
    if (this.isUnlocked(mapped)) {
      localStorage.setItem(SELECTED_CHAR_KEY, mapped);
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
