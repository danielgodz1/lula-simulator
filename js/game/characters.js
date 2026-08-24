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
    flySprite: 'img/characters/lula_fly.png',
    requiredPicanhas: 0, // Sempre liberado
    skillName: '🕊️ Voo Tolerante & Picanha',
    skillDesc: 'Hitbox menor e mais generosa. Voo suave e tolerante a colisões leves.',
    auraColor: '#ffdf00',
    modifier: (state) => {
      state.HITBOX_WIDTH_RATIO = 0.062;
      state.HITBOX_HEIGHT_RATIO = 0.032;
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
    flySprite: 'img/characters/janja_fly.png',
    requiredPicanhas: 25,
    skillName: '💖 Chuva de Curtidas (+2 pts)',
    skillDesc: 'Curtidas e corações bônus aparecem no trajeto concedendo +2 pontos adicionais.',
    auraColor: '#ec4899',
    modifier: (state) => {
      state.HITBOX_WIDTH_RATIO = 0.064;
      state.HITBOX_HEIGHT_RATIO = 0.033;
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
    desc: 'Requer 100 pontos no Flappy Lula e 300 km no Empresário 3D! Velocidade turbo com dobro de picanhas (2X)!',
    sprite: 'img/nikolas.png',
    flySprite: 'img/characters/nikolas_fly.png',
    requiredPicanhas: 0, // Desbloqueio especial por missão: 100 pts no Flappy + 300 km no 3D
    skillName: '⚡ Ritmo Acelerado (2x Picanhas)',
    skillDesc: 'Velocidade turbo e 2x picanhas. A cada 1 min, o Lula aparece dando 20s de lentidão e 3x pontos!',
    auraColor: '#06b6d4',
    modifier: (state) => {
      state.HITBOX_WIDTH_RATIO = 0.062;
      state.HITBOX_HEIGHT_RATIO = 0.032;
      state.GAP_RATIO = 0.42;
      state.SPEED_MULT = 1.15;
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
    flySprite: 'img/characters/moraes_fly.png',
    requiredPicanhas: 120,
    skillName: '🛡️ Mandado Blindado (Escudo)',
    skillDesc: 'Possui 1 Escudo Protetor por partida. Quebra o 1º cano sem morrer!',
    auraColor: '#a855f7',
    modifier: (state) => {
      state.HITBOX_WIDTH_RATIO = 0.062;
      state.HITBOX_HEIGHT_RATIO = 0.032;
      state.GAP_RATIO = 0.44;
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
    flySprite: 'img/characters/bolsonaro_fly.png',
    requiredPicanhas: 200,
    skillName: '🚀 Modo Turbo Patriota',
    skillDesc: 'A cada 4 canos perfeitos sem bater, ativa 4s de super velocidade e ímã de picanha!',
    auraColor: '#22c55e',
    modifier: (state) => {
      state.HITBOX_WIDTH_RATIO = 0.064;
      state.HITBOX_HEIGHT_RATIO = 0.034;
      state.GAP_RATIO = 0.43;
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
    flySprite: 'img/characters/dilma_fly.png',
    requiredPicanhas: 100, // Liberada com 100 picanhas
    skillName: '🥔 Saudação à Mandioca',
    skillDesc: 'Chuva de mandiocas e aipins nos canos! Acúmulo de picanhas padrão e voo suave.',
    auraColor: '#ef4444',
    modifier: (state) => {
      state.HITBOX_WIDTH_RATIO = 0.063;
      state.HITBOX_HEIGHT_RATIO = 0.033;
      state.GAP_RATIO = 0.43;
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
    desc: 'Requer liberar a Dilma e conquistar 200 pontos jogando com a Dilma! Velocidade ágil, 3X pontos e chuva de dinheiro!',
    sprite: 'img/marcal.png',
    flySprite: 'img/characters/marcal_fly.png',
    requiredPicanhas: 0, // Desbloqueio especial por missão da Dilma
    skillName: '💵 Mindset 3X & Chuva de Grana',
    skillDesc: 'Ritmo acelerado, triplica os pontos obtidos (3X por cano) e solta chuva de notas e dólares!',
    auraColor: '#0ea5e9',
    modifier: (state) => {
      state.HITBOX_WIDTH_RATIO = 0.062;
      state.HITBOX_HEIGHT_RATIO = 0.032;
      state.GAP_RATIO = 0.43;
      state.SPEED_MULT = 1.15;
      state.EXTRA_SCORE_PER_PIPE = 3;
      state.spawnExtraLikes = false;
      state.hasShield = false;
      state.isTurboAllowed = false;
    }
  }
];

const SELECTED_CHAR_KEY = 'flappy_selected_character_id';
const TOTAL_PICANHAS_KEY = 'flappy_total_accumulated_picanhas';
const LIFETIME_PICANHAS_KEY = 'flappy_lifetime_accumulated_picanhas';
const DILMA_BEST_SCORE_KEY = 'flappy_dilma_record_score';

export class CharacterInventory {
  static getTotalPicanhas() {
    return parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
  }

  static getLifetimePicanhas() {
    const stored = parseInt(localStorage.getItem(LIFETIME_PICANHAS_KEY) || '0', 10);
    const current = this.getTotalPicanhas();
    let userLifetime = 0;
    try {
      const rawUser = localStorage.getItem('lula_current_user_v2');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u) userLifetime = parseInt(u.lifetimePicanhas || u.totalPicanhas || 0, 10);
      }
    } catch(e) {}
    const val = Math.max(stored, current, userLifetime);
    localStorage.setItem(LIFETIME_PICANHAS_KEY, val.toString());
    return val;
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
    const newBest = Math.max(num, current);
    localStorage.setItem(DILMA_BEST_SCORE_KEY, newBest.toString());
    if (newBest > 0) {
      this.syncDilmaScoreToCloud(newBest);
    }
    return newBest;
  }

  static addPicanhas(amount) {
    if (amount <= 0) return this.getTotalPicanhas();
    const current = this.getTotalPicanhas();
    const updated = current + amount;
    localStorage.setItem(TOTAL_PICANHAS_KEY, updated.toString());

    const lifetime = this.getLifetimePicanhas() + amount;
    localStorage.setItem(LIFETIME_PICANHAS_KEY, lifetime.toString());

    try {
      const rawUser = localStorage.getItem('lula_current_user_v2');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u) {
          u.totalPicanhas = updated;
          u.lifetimePicanhas = Math.max(u.lifetimePicanhas || 0, lifetime);
          localStorage.setItem('lula_current_user_v2', JSON.stringify(u));
        }
      }
    } catch(e) {}

    // Verifica se atingiu marcas de desbloqueio permanente
    CHARACTERS.forEach(c => {
      if (c.requiredPicanhas > 0 && lifetime >= c.requiredPicanhas) {
        this.recordUnlockedCharacter(c.id);
      }
    });
    if (lifetime >= 3000) {
      CHARACTERS.forEach(c => this.recordUnlockedCharacter(c.id));
    }

    return updated;
  }

  static async syncPicanhasNow() {
    const total = this.getTotalPicanhas();
    this.syncPicanhasToCloud(total);
  }

  static async syncDilmaScoreToCloud(score) {
    try {
      let playerName = '';
      let curUser = null;
      const rawUser = localStorage.getItem('lula_current_user_v2');
      if (rawUser) {
        curUser = JSON.parse(rawUser);
        if (curUser && curUser.username) playerName = curUser.username;
      }
      if (!playerName) {
        playerName = localStorage.getItem('lula_player') || '';
      }
      if (!playerName) return;

      // 1. Tenta sincronizar via API serverless
      try {
        const syncRes = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: playerName,
            dilmaScore: score,
            totalPicanhas: this.getTotalPicanhas(),
            runnerCoins: parseInt(localStorage.getItem('runner_total_coins') || '0', 10),
            avatar: curUser?.avatar || ''
          })
        });
        if (syncRes.ok) return;
      } catch (e) {}

      // 2. Fallback direto ao Firestore com username incluído
      const norm = playerName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(norm)}?updateMask.fieldPaths=username&updateMask.fieldPaths=dilmaScore&updateMask.fieldPaths=lastSync`;
      
      const payload = {
        fields: {
          username: { stringValue: playerName },
          dilmaScore: { integerValue: score.toString() },
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

  static async syncPicanhasToCloud(total) {
    try {
      let playerName = '';
      let curUser = null;
      const rawUser = localStorage.getItem('lula_current_user_v2');
      if (rawUser) {
        curUser = JSON.parse(rawUser);
        if (curUser && curUser.username) playerName = curUser.username;
      }
      if (!playerName) {
        playerName = localStorage.getItem('lula_player') || '';
      }
      if (!playerName) return;

      const dilmaBest = this.getDilmaBest();

      // 1. Tenta sincronizar via API serverless
      try {
        const syncRes = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: playerName,
            totalPicanhas: total,
            runnerCoins: parseInt(localStorage.getItem('runner_total_coins') || '0', 10),
            dilmaScore: dilmaBest,
            avatar: curUser?.avatar || ''
          })
        });
        if (syncRes.ok) return;
      } catch (e) {}

      // 2. Fallback direto ao Firestore
      const norm = playerName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const docUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(norm)}?updateMask.fieldPaths=username&updateMask.fieldPaths=totalPicanhas&updateMask.fieldPaths=dilmaScore&updateMask.fieldPaths=lastSync`;
      
      const payload = {
        fields: {
          username: { stringValue: playerName },
          totalPicanhas: { integerValue: total.toString() },
          dilmaScore: { integerValue: dilmaBest.toString() },
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
    if (char.id === 'lula') return true;

    // 1. CHECAGEM CLOUD-FIRST & RETROCOMPATIBILIDADE (FONTE DE VERDADE: lula_users_v2)
    // Se o personagem já está no array unlockedCharacters do perfil do usuário, MANTÉM ACESSO PERMANENTE.
    try {
      const rawUser = localStorage.getItem('lula_current_user_v2') || localStorage.getItem('lula_current_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (Array.isArray(u?.unlockedCharacters) && u.unlockedCharacters.includes(char.id)) {
          return true;
        }
      }
    } catch (e) {}

    try {
      const localFlappyUnlocks = JSON.parse(localStorage.getItem('flappy_unlocked_characters') || '[]');
      if (Array.isArray(localFlappyUnlocks) && localFlappyUnlocks.includes(char.id)) {
        return true;
      }
    } catch (e) {}

    // REGRA DE OURO DOS 3000: Ao atingir 3000 Picanhas Históricas, libera TODOS os personagens permanentemente!
    const lifetimePicanhas = this.getLifetimePicanhas();
    if (lifetimePicanhas >= 3000) {
      this.recordUnlockedCharacter(char.id);
      return true;
    }

    // 2. REQUISITO DO NIKOLAS FERREIRA: 100 pts no Flappy Lula E 300 km no Empresário 3D
    if (char.id === 'nikolas') {
      const flappyBest = Math.max(
        parseInt(localStorage.getItem('lula_best') || '0', 10),
        parseInt(localStorage.getItem('lula_synced_best') || '0', 10)
      );
      const runnerBest = Math.max(
        parseInt(localStorage.getItem('run_best') || '0', 10),
        parseInt(localStorage.getItem('run_synced_best') || '0', 10)
      );
      const meetsNikolasReq = flappyBest >= 100 && runnerBest >= 300;
      if (meetsNikolasReq) {
        this.recordUnlockedCharacter('nikolas');
      }
      return meetsNikolasReq;
    }

    // 3. DESBLOQUEIO ESPECIAL DO PABLO MARÇAL (200 pts com a Dilma)
    if (char.id === 'marcal') {
      const isDilmaUnlocked = this.isUnlocked('dilma');
      const dilmaBest = Math.max(this.getDilmaBest(), parseInt(localStorage.getItem('flappy_dilma_record_score') || '0', 10));
      const meetsMarcalReq = isDilmaUnlocked && dilmaBest >= 200;
      if (meetsMarcalReq) {
        this.recordUnlockedCharacter('marcal');
      }
      return meetsMarcalReq;
    }

    // 4. PERSONAGENS POR PICANHAS HISTÓRICAS ACUMULADAS (Janja, Moraes, Bolsonaro, Dilma)
    // Usa o histórico vitalício que nunca diminui ao gastar na loja!
    const hasPicanhas = lifetimePicanhas >= char.requiredPicanhas;
    if (hasPicanhas && char.requiredPicanhas > 0) {
      this.recordUnlockedCharacter(char.id);
    }
    return hasPicanhas;
  }

  static recordUnlockedCharacter(charId) {
    try {
      const raw = localStorage.getItem('flappy_unlocked_characters');
      const list = raw ? JSON.parse(raw) : [];
      if (!list.includes(charId)) {
        list.push(charId);
        localStorage.setItem('flappy_unlocked_characters', JSON.stringify(list));
      }

      const rawUser = localStorage.getItem('lula_current_user_v2');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u) {
          if (!Array.isArray(u.unlockedCharacters)) u.unlockedCharacters = [];
          if (!u.unlockedCharacters.includes(charId)) {
            u.unlockedCharacters.push(charId);
            localStorage.setItem('lula_current_user_v2', JSON.stringify(u));
          }
        }
      }
    } catch(e) {}
  }

  static getUnlockDescription(charId) {
    const char = CHARACTERS.find(c => c.id === charId || c.id === this.mapLegacyId(charId));
    if (!char) return '';

    if (this.isUnlocked(char.id)) {
      return `✨ DESBLOQUEADO`;
    }

    if (char.id === 'nikolas') {
      const flappyBest = parseInt(localStorage.getItem('lula_best') || '0', 10);
      const runnerBest = parseInt(localStorage.getItem('run_best') || '0', 10);
      return `🔒 100 pts Flappy + 300 km 3D (${flappyBest}/100 pts · ${runnerBest}/300 km)`;
    }

    if (char.id === 'marcal') {
      const isDilmaUnlocked = this.isUnlocked('dilma');
      const dilmaBest = this.getDilmaBest();
      if (!isDilmaUnlocked) {
        return `🔒 Requer liberar a Dilma (100 🥩)`;
      }
      return `🔒 Faça 200 pts com a Dilma (${dilmaBest}/200 pts)`;
    }

    return `🔒 ${char.requiredPicanhas} 🥩 (${this.getTotalPicanhas()}/${char.requiredPicanhas})`;
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

// ============================================================================
// SISTEMA DE PERSONAGENS 3D E ECONOMIA DE MOEDAS DO EMPRESÁRIO 3D
// ============================================================================

export const RUNNER_CHARACTERS = [
  {
    id: 'empresario',
    name: 'Empresário Faria Lima',
    nickname: 'O Faria Limer',
    title: 'Empresário Faria Lima — O Faria Limer',
    desc: 'Terno italiano, gravata vermelha, óculos escuros, maleta de couro e fugindo das obrigações trabalhistas na favela.',
    cost: 0, // Personagem inicial gratuito
    sprite: 'img/favela.png',
    themeColor: '#38bdf8'
  },
  {
    id: 'lula',
    name: 'Lula da Silva',
    nickname: 'O Presidente',
    title: 'Lula da Silva — O Presidente',
    desc: 'Caricatura satírica do Presidente em fuga! Cabelo e barba grisalha volumosa, terno azul-marinho presidencial e faixa presidencial verde-amarela cruzada no peito.',
    cost: 300, // 300 moedas
    sprite: 'img/lula.png',
    themeColor: '#ffdf00'
  },
  {
    id: 'bolsonaro',
    name: 'Jair Bolsonaro',
    nickname: 'O Capitão',
    title: 'Jair Bolsonaro — O Capitão',
    desc: 'Caricatura satírica do Capitão! Corte de cabelo característico, terno escuro, gravata verde-amarela e faixa presidencial verde-amarela.',
    cost: 500, // 500 moedas
    sprite: 'img/bolsonaro.png',
    themeColor: '#22c55e'
  }
];

const RUNNER_COINS_KEY = 'runner_total_coins';
const RUNNER_UNLOCKED_KEY = 'runner_unlocked_characters';
const RUNNER_SELECTED_KEY = 'runner_selected_character';

export class RunnerInventory {
  static getTotalCoins() {
    return parseInt(localStorage.getItem(RUNNER_COINS_KEY) || '0', 10);
  }

  static setTotalCoins(amount) {
    const val = Math.max(0, parseInt(amount, 10) || 0);
    localStorage.setItem(RUNNER_COINS_KEY, val.toString());
    return val;
  }

  static addCoins(amount) {
    if (amount <= 0) return this.getTotalCoins();
    const current = this.getTotalCoins();
    const updated = current + amount;
    localStorage.setItem(RUNNER_COINS_KEY, updated.toString());
    try {
      const rawUser = localStorage.getItem('lula_current_user_v2');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u) {
          u.runnerCoins = updated;
          localStorage.setItem('lula_current_user_v2', JSON.stringify(u));
        }
      }
    } catch(e) {}
    return updated;
  }

  static getUnlockedCharacters() {
    const set = new Set(['empresario']);
    try {
      const raw = localStorage.getItem(RUNNER_UNLOCKED_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) list.forEach(x => set.add(x));
      }
    } catch(e) {}

    try {
      const rawUser = localStorage.getItem('lula_current_user_v2') || localStorage.getItem('lula_current_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (Array.isArray(u?.unlockedCharacters)) {
          u.unlockedCharacters.forEach(x => set.add(x));
        }
      }
    } catch(e) {}

    return Array.from(set);
  }

  static isUnlocked(charId) {
    if (charId === 'empresario') return true;
    const unlocked = this.getUnlockedCharacters();
    return unlocked.includes(charId);
  }

  static unlockCharacter(charId) {
    const char = RUNNER_CHARACTERS.find(c => c.id === charId);
    if (!char) return { success: false, message: 'Personagem não encontrado.' };
    if (this.isUnlocked(charId)) return { success: true, message: 'Já desbloqueado!' };

    const totalCoins = this.getTotalCoins();
    if (totalCoins < char.cost) {
      return { success: false, message: `Moedas insuficientes! Requer ${char.cost} moedas (Você tem ${totalCoins}).` };
    }

    // Deduz moedas e adiciona aos desbloqueados
    this.setTotalCoins(totalCoins - char.cost);
    const unlocked = this.getUnlockedCharacters();
    if (!unlocked.includes(charId)) {
      unlocked.push(charId);
      localStorage.setItem(RUNNER_UNLOCKED_KEY, JSON.stringify(unlocked));
    }

    return { success: true, message: `${char.name} desbloqueado com sucesso!` };
  }

  static getSelectedCharacter() {
    const savedId = localStorage.getItem(RUNNER_SELECTED_KEY) || 'empresario';
    if (this.isUnlocked(savedId)) {
      const found = RUNNER_CHARACTERS.find(c => c.id === savedId);
      if (found) return found;
    }
    return RUNNER_CHARACTERS[0];
  }

  static setSelectedCharacter(charId) {
    if (this.isUnlocked(charId)) {
      localStorage.setItem(RUNNER_SELECTED_KEY, charId);
      return true;
    }
    return false;
  }
}

