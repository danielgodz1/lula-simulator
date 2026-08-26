// js/auth.js — Sistema de Contas, Perfis com Foto/Avatar Otimizado, Sincronização Cloud de Pablo Marçal e Recordes
import { firebaseConfig } from './firebase-config.js';
import { escapeHTML } from './security.js';
import { getDeviceId } from './device-id.js';

const USERS_DB_KEY = 'lula_users_db_v2';
const CURRENT_USER_KEY = 'lula_current_user_v2';
const TOTAL_PICANHAS_KEY = 'flappy_total_accumulated_picanhas';

const DENYLIST = [
  'visitante', 'visitor', 'jogador', 'player', 'guest', 'anon',
  'anônimo', 'anonimo', 'anonymous', 'user', 'admin', 'administrador',
  'null', 'undefined', 'bot', 'system', 'sistema'
];

function isDenylisted(name) {
  if (!name || typeof name !== 'string') return true;
  return DENYLIST.includes(name.toLowerCase().trim());
}

function isEnglishContext() {
  return typeof window !== 'undefined' && (window.location.pathname.startsWith('/en/') || window.location.hostname.includes('flappylula.com'));
}

// Avatar padrão elegante em SVG Data URL (Zero requisições de rede, 100% offline-ready)
export const DEFAULT_AVATAR_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='50' r='48' fill='none' stroke='%23ffdf00' stroke-width='3'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2394a3b8'/%3E%3Cpath d='M20 86c0-16.5 13.5-30 30-30s30 13.5 30 30' fill='%2394a3b8'/%3E%3C/svg%3E";

export const PRESET_AVATARS = [
  { id: 'lula', name: 'Lula', src: '/img/lula.png' },
  { id: 'marcal', name: 'Marçal', src: '/img/marcal.png' },
  { id: 'dilma', name: 'Dilma', src: '/img/dilma.png' },
  { id: 'empresario', name: 'Empresário', src: '/img/favela.png' },
  { id: 'bolsonaro', name: 'Capitão', src: '/img/bolsonaro.png' },
  { id: 'moraes', name: 'Xandão', src: '/img/moraes.png' },
  { id: 'nikolas', name: 'Nikolas', src: '/img/nikolas.png' },
  { id: 'janja', name: 'Janja', src: '/img/janja.png' }
];

class AuthManager {
  constructor() {
    this.currentUser = this.loadCurrentUser();
    // Inicia sincronização em background se houver usuário conectado ou nome salvo
    if (this.currentUser) {
      this.syncFromCloud().then(() => {
        this.renderProfileBadge();
        this.checkDailyLoginStreak();
      }).catch(() => {});
    } else {
      setTimeout(() => this.checkDailyLoginStreak(), 500);
    }
  }

  loadCurrentUser() {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.username) {
          if (!Array.isArray(parsed.unlockedSkins)) {
            try {
              parsed.unlockedSkins = JSON.parse(localStorage.getItem('lula_unlocked_skins') || '[]');
            } catch(e) { parsed.unlockedSkins = []; }
          }
          if (!parsed.equippedSkins) {
            try {
              parsed.equippedSkins = JSON.parse(localStorage.getItem('lula_equipped_skins') || '{}');
            } catch(e) { parsed.equippedSkins = {}; }
          }
          if (!parsed.prestigeLevel) {
            parsed.prestigeLevel = parseInt(localStorage.getItem('lula_prestige_level') || '0', 10);
          }
          return parsed;
        }
      }
      const legacyPlayer = localStorage.getItem('lula_player');
      if (legacyPlayer && legacyPlayer.trim().length >= 2) {
        return {
          username: legacyPlayer.trim(),
          hasPassword: false,
          avatar: '',
          flappyScore: parseInt(localStorage.getItem('lula_best') || '0', 10),
          runnerScore: parseInt(localStorage.getItem('run_best') || '0', 10),
          totalPicanhas: parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10),
          dilmaScore: parseInt(localStorage.getItem('flappy_dilma_record_score') || '0', 10),
          runnerCoins: parseInt(localStorage.getItem('runner_total_coins') || '0', 10),
          prestigeLevel: parseInt(localStorage.getItem('lula_prestige_level') || '0', 10),
          unlockedSkins: JSON.parse(localStorage.getItem('lula_unlocked_skins') || '[]'),
          equippedSkins: JSON.parse(localStorage.getItem('lula_equipped_skins') || '{}')
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getLocalUsersDB() {
    try {
      const data = localStorage.getItem(USERS_DB_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  saveLocalUsersDB(db) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  }

  // -------------------------------------------------------------
  // COMPRESSÃO ULTRA-LEVE DE IMAGEM NO CLIENTE VIA CANVAS (MAX 100x100px ~3KB-6KB)
  // -------------------------------------------------------------
  static compressImageToAvatar(fileOrDataUrl, cropBounds = null) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 100;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          if (cropBounds && cropBounds.w > 0 && cropBounds.h > 0) {
            ctx.drawImage(img, cropBounds.x, cropBounds.y, cropBounds.w, cropBounds.h, 0, 0, size, size);
          } else {
            // Recorte 1:1 centralizado padrão
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          }

          let base64 = canvas.toDataURL('image/webp', 0.8);
          if (!base64.startsWith('data:image/webp')) {
            base64 = canvas.toDataURL('image/jpeg', 0.8);
          }
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));

      if (typeof fileOrDataUrl === 'string') {
        img.src = fileOrDataUrl;
      } else if ((typeof File !== 'undefined' && fileOrDataUrl instanceof File) || (typeof Blob !== 'undefined' && fileOrDataUrl instanceof Blob)) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(fileOrDataUrl);
      } else {
        reject(new Error('Formato de imagem inválido'));
      }
    });
  }

  // -------------------------------------------------------------
  // MODAL INTERATIVO DE ENQUADRAMENTO / RECORTE / ZOOM DA FOTO DE PERFIL
  // -------------------------------------------------------------
  static mountAvatarCropModal(fileOrDataUrl, onCropDoneCallback) {
    let existing = document.getElementById('cropModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cropModalOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; z-index: 10050;
      padding: 16px; font-family: 'Inter', sans-serif;
    `;

    overlay.innerHTML = `
      <div style="
        background: #0f172a; border: 2px solid var(--amarelo-brasil, #ffd700);
        border-radius: 20px; width: 100%; max-width: 380px; padding: 20px;
        color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(255,215,0,0.3);
        display: flex; flex-direction: column; align-items: center; gap: 14px;
        animation: popIn 0.25s ease-out;
      ">
        <div style="font-family: 'Bangers', cursive; font-size: 22px; color: var(--amarelo-brasil, #ffd700); letter-spacing: 1px; text-align: center;">
          ${isEnglishContext() ? '✂️ ADJUST & CROP PHOTO' : '✂️ AJUSTAR & ENQUADRAR FOTO'}
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.3;">
          ${isEnglishContext() ? 'Drag to position and use slider to zoom in!' : 'Arraste a imagem para posicionar e use o slider para dar zoom no rosto!'}
        </p>

        <!-- VIEWPORT DE RECORTE COM CANVAS -->
        <div style="position: relative; width: 260px; height: 260px; border-radius: 16px; overflow: hidden; background: #000; box-shadow: 0 4px 20px rgba(0,0,0,0.8); cursor: grab; touch-action: none;">
          <canvas id="cropCanvas" width="260" height="260" style="width: 100%; height: 100%; display: block;"></canvas>
        </div>

        <!-- CONTROLE DE ZOOM -->
        <div style="width: 100%; display: flex; align-items: center; gap: 10px; font-size: 13px; color: #cbd5e1;">
          <span>🔍 Zoom:</span>
          <input type="range" id="cropZoomSlider" min="1" max="3.5" step="0.05" value="1" style="flex: 1; accent-color: var(--verde-neon, #00e676); cursor: pointer;">
          <button id="btnResetCropPos" title="Centralizar" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer;">🎯</button>
        </div>

        <!-- BOTÕES DE AÇÃO -->
        <div style="display: flex; gap: 10px; width: 100%;">
          <button id="btnCancelCrop" style="flex: 1; padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: #94a3b8; font-weight: 700; font-size: 13px; cursor: pointer;">
            Cancelar
          </button>
          <button id="btnConfirmCrop" class="btn-primary" style="flex: 1.4; padding: 10px; font-size: 14px; letter-spacing: 0.5px;">
            ${isEnglishContext() ? 'SAVE PHOTO ✂️' : 'SALVAR FOTO ✂️'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const canvas = overlay.querySelector('#cropCanvas');
    const ctx = canvas.getContext('2d');
    const zoomSlider = overlay.querySelector('#cropZoomSlider');
    const btnConfirm = overlay.querySelector('#btnConfirmCrop');
    const btnCancel = overlay.querySelector('#btnCancelCrop');
    const btnReset = overlay.querySelector('#btnResetCropPos');

    const img = new Image();
    let scale = 1.0;
    let baseScale = 1.0;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const CROP_RADIUS = 105;
    const CX = canvas.width / 2;
    const CY = canvas.height / 2;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!img.complete || img.naturalWidth === 0) return;

      const currentScale = baseScale * scale;
      const drawW = img.naturalWidth * currentScale;
      const drawH = img.naturalHeight * currentScale;

      const drawX = CX + offsetX - drawW / 2;
      const drawY = CY + offsetY - drawH / 2;

      ctx.save();
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Máscara escura com corte circular
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.arc(CX, CY, CROP_RADIUS, 0, Math.PI * 2, true);
      ctx.fill();

      // Borda circular dourada
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(CX, CY, CROP_RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    const initImage = () => {
      const minDim = Math.min(img.naturalWidth, img.naturalHeight);
      baseScale = (CROP_RADIUS * 2) / minDim;
      scale = 1.0;
      offsetX = 0;
      offsetY = 0;
      if (zoomSlider) zoomSlider.value = 1;
      draw();
    };

    img.onload = () => {
      initImage();
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else if ((typeof File !== 'undefined' && fileOrDataUrl instanceof File) || (typeof Blob !== 'undefined' && fileOrDataUrl instanceof Blob)) {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.readAsDataURL(fileOrDataUrl);
    }

    // Drag & Pan handlers
    const onPointerDown = (e) => {
      isDragging = true;
      startX = e.clientX || e.touches?.[0]?.clientX || 0;
      startY = e.clientY || e.touches?.[0]?.clientY || 0;
      canvas.parentElement.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      const dx = clientX - startX;
      const dy = clientY - startY;
      startX = clientX;
      startY = clientY;

      offsetX += dx;
      offsetY += dy;
      draw();
    };

    const onPointerUp = () => {
      isDragging = false;
      canvas.parentElement.style.cursor = 'grab';
    };

    canvas.parentElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Zoom Slider
    zoomSlider.addEventListener('input', (e) => {
      scale = parseFloat(e.target.value);
      draw();
    });

    // Reset
    btnReset.onclick = () => {
      offsetX = 0;
      offsetY = 0;
      scale = 1.0;
      zoomSlider.value = 1;
      draw();
    };

    btnCancel.onclick = () => overlay.remove();

    // Confirmar e Gerar Base64 Otimizada de 100x100
    btnConfirm.onclick = () => {
      btnConfirm.innerText = 'PROCESSANDO... ⏳';
      btnConfirm.disabled = true;

      try {
        const outCanvas = document.createElement('canvas');
        outCanvas.width = 100;
        outCanvas.height = 100;
        const outCtx = outCanvas.getContext('2d');

        const currentScale = baseScale * scale;
        const drawW = img.naturalWidth * currentScale;
        const drawH = img.naturalHeight * currentScale;

        const drawX = CX + offsetX - drawW / 2;
        const drawY = CY + offsetY - drawH / 2;

        // Mapeia a área circular (CX - CROP_RADIUS ... CX + CROP_RADIUS) para a saída 100x100
        const cropBoxSize = CROP_RADIUS * 2;
        const srcX = (CX - CROP_RADIUS - drawX) / currentScale;
        const srcY = (CY - CROP_RADIUS - drawY) / currentScale;
        const srcSize = cropBoxSize / currentScale;

        outCtx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 100, 100);

        let finalBase64 = outCanvas.toDataURL('image/webp', 0.82);
        if (!finalBase64.startsWith('data:image/webp')) {
          finalBase64 = outCanvas.toDataURL('image/jpeg', 0.82);
        }

        overlay.remove();
        if (onCropDoneCallback) onCropDoneCallback(finalBase64);
      } catch (err) {
        console.error('Erro no crop:', err);
        btnConfirm.innerText = 'SALVAR FOTO ✂️';
        btnConfirm.disabled = false;
      }
    };
  }

  // -------------------------------------------------------------
  // ATUALIZAR E SINCRONIZAR FOTO DE PERFIL DO USUÁRIO
  // -------------------------------------------------------------
  async updateUserAvatar(avatarData) {
    if (!this.currentUser) return { success: false, error: 'Faça login para salvar a foto!' };

    let finalAvatar = avatarData;
    const isString = typeof avatarData === 'string';
    const isFileOrBlob = (typeof File !== 'undefined' && avatarData instanceof File) || (typeof Blob !== 'undefined' && avatarData instanceof Blob);

    if (isFileOrBlob || (isString && avatarData.startsWith('data:image/'))) {
      try {
        finalAvatar = await AuthManager.compressImageToAvatar(avatarData);
      } catch (e) {
        console.warn('Fallback no processamento de imagem:', e);
      }
    }

    this.currentUser.avatar = finalAvatar;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));

    const localDB = this.getLocalUsersDB();
    const norm = this.currentUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (localDB[norm]) {
      localDB[norm].avatar = finalAvatar;
      this.saveLocalUsersDB(localDB);
    }

    const syncRes = await this.syncUserDataNow();
    return { success: true, avatar: finalAvatar, syncRes };
  }

  // -------------------------------------------------------------
  // SINCRONIZAÇÃO EM SEGUNDO PLANO COM O FIRESTORE (CLOUD)
  // -------------------------------------------------------------
  async syncFromCloud() {
    if (!this.currentUser || !this.currentUser.username) return;
    return await this.syncUserDataNow();
  }

  // -------------------------------------------------------------
  // SINCRONIZAÇÃO FORÇADA IMEDIATA DOS DADOS LOCAIS COM A NUVEM
  // -------------------------------------------------------------
  async syncUserDataNow() {
    if (!this.currentUser || !this.currentUser.username) {
      return { success: false, error: 'Nenhum usuário conectado.' };
    }

    const username = this.currentUser.username;
    const localPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
    const localFlappy = parseInt(localStorage.getItem('lula_best') || '0', 10);
    const localRunner = parseInt(localStorage.getItem('run_best') || '0', 10);
    const localDilma = parseInt(localStorage.getItem('flappy_dilma_record_score') || '0', 10);
    const localRunnerCoins = parseInt(localStorage.getItem('runner_total_coins') || '0', 10);
    const localAvatar = this.currentUser?.avatar || '';
    // Extrai personagens desbloqueados garantindo preservação retrocompatível
    const localUnlockedSet = new Set(['lula']);
    const localFlappyBest = Math.max(localFlappy, parseInt(localStorage.getItem('lula_best') || '0', 10));
    const localRunnerBest = Math.max(localRunner, parseInt(localStorage.getItem('run_best') || '0', 10));
    const localNikolas = Math.max(parseInt(localStorage.getItem('flappy_nikolas_record_score') || '0', 10), this.currentUser.nikolasScore || 0);

    if (localFlappyBest >= 300 && localRunnerBest >= 300) localUnlockedSet.add('nikolas');
    if (localNikolas >= 900) localUnlockedSet.add('marcal');
    try {
      const runnerUnlocks = JSON.parse(localStorage.getItem('runner_unlocked_characters') || '[]');
      if (Array.isArray(runnerUnlocks)) runnerUnlocks.forEach(x => localUnlockedSet.add(x));
    } catch(e) {}
    try {
      const flappyUnlocks = JSON.parse(localStorage.getItem('flappy_unlocked_characters') || '[]');
      if (Array.isArray(flappyUnlocks)) flappyUnlocks.forEach(x => localUnlockedSet.add(x));
    } catch(e) {}
    if (Array.isArray(this.currentUser.unlockedCharacters)) {
      this.currentUser.unlockedCharacters.forEach(x => localUnlockedSet.add(x));
    }
    const localUnlocked = Array.from(localUnlockedSet);

    const localPrestige = parseInt(localStorage.getItem('lula_prestige_level') || '0', 10);
    const localLifetimePicanhas = Math.max(localPicanhas, parseInt(localStorage.getItem('flappy_lifetime_accumulated_picanhas') || '0', 10));
    let localSkins = [];
    let localEquippedSkins = {};
    try {
      localSkins = JSON.parse(localStorage.getItem('lula_unlocked_skins') || '[]');
      localEquippedSkins = JSON.parse(localStorage.getItem('lula_equipped_skins') || '{}');
    } catch(e) {}

    // 1. Tenta sincronizar via API Serverless Segura
    try {
      const apiRes = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          flappyScore: Math.max(localFlappy, this.currentUser.flappyScore || 0),
          runnerScore: Math.max(localRunner, this.currentUser.runnerScore || 0),
          dilmaScore: Math.max(localDilma, this.currentUser.dilmaScore || 0),
          nikolasScore: Math.max(localNikolas, this.currentUser.nikolasScore || 0),
          totalPicanhas: Math.max(localPicanhas, this.currentUser.totalPicanhas || 0),
          lifetimePicanhas: Math.max(localLifetimePicanhas, this.currentUser.lifetimePicanhas || 0),
          runnerCoins: Math.max(localRunnerCoins, this.currentUser.runnerCoins || 0),
          unlockedCharacters: localUnlocked,
          unlockedSkins: localSkins.length > 0 ? localSkins : (this.currentUser.unlockedSkins || []),
          equippedSkins: Object.keys(localEquippedSkins).length > 0 ? localEquippedSkins : (this.currentUser.equippedSkins || {}),
          prestigeLevel: Math.max(localPrestige, this.currentUser.prestigeLevel || 0),
          loginStreak: this.currentUser.loginStreak || 1,
          lastLoginDate: this.currentUser.lastLoginDate || '',
          dailyMissions: this.currentUser.dailyMissions || {},
          avatar: localAvatar
        })
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.success && data.user) {
          this.setCurrentUser(data.user);
          return {
            success: true,
            user: data.user,
            isMarcalUnlocked: (data.user.nikolasScore >= 900 || (data.user.unlockedCharacters && data.user.unlockedCharacters.includes('marcal'))),
            isNikolasUnlocked: ((data.user.flappyScore >= 300 && data.user.runnerScore >= 300) || (data.user.unlockedCharacters && data.user.unlockedCharacters.includes('nikolas')))
          };
        }
      }
    } catch (err) {
      console.warn('Tentando fallback Firestore para sincronização:', err);
    }

    return {
      success: true,
      user: this.currentUser,
      isMarcalUnlocked: (localNikolas >= 900),
      isNikolasUnlocked: (localFlappyBest >= 300 && localRunnerBest >= 300)
    };
  }

  // -------------------------------------------------------------
  // LOJA DE SKINS: COMPRA E EQUIPAMENTO
  // -------------------------------------------------------------
  async buySkin(skinId) {
    const user = this.getCurrentUser();
    if (!user || !user.username) {
      return { success: false, error: 'Faça login ou escolha seu apelido para comprar skins na Loja Oficial!' };
    }

    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          skinId,
          action: 'buy',
          totalPicanhas: parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10),
          runnerCoins: parseInt(localStorage.getItem('runner_total_coins') || '0', 10)
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.totalPicanhas !== undefined) {
            localStorage.setItem(TOTAL_PICANHAS_KEY, data.totalPicanhas.toString());
            user.totalPicanhas = data.totalPicanhas;
          }
          if (data.runnerCoins !== undefined) {
            localStorage.setItem('runner_total_coins', data.runnerCoins.toString());
            user.runnerCoins = data.runnerCoins;
          }
          user.unlockedSkins = data.unlockedSkins || [];
          if (data.equippedSkins) {
            user.equippedSkins = data.equippedSkins;
            localStorage.setItem('lula_equipped_skins', JSON.stringify(user.equippedSkins));
          }
          this.setCurrentUser(user);
          localStorage.setItem('lula_unlocked_skins', JSON.stringify(user.unlockedSkins));
          this.renderProfileBadge();
          return { success: true, message: data.message };
        } else {
          return { success: false, error: data.error || 'Falha ao comprar skin.' };
        }
      }
    } catch(e) {
      return { success: false, error: 'Erro de conexão ao processar compra.' };
    }
    return { success: false, error: 'Erro desconhecido ao comprar skin.' };
  }

  async equipSkin(charId, skinId) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Usuário não conectado' };

    const equipped = (user.equippedSkins && typeof user.equippedSkins === 'object') ? { ...user.equippedSkins } : {};

    if (!skinId || skinId === 'default' || skinId === 'padrao') {
      delete equipped[charId];
      user.equippedSkins = equipped;
      this.setCurrentUser(user);
      localStorage.setItem('lula_equipped_skins', JSON.stringify(equipped));

      try {
        fetch('/api/shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            charId,
            skinId: 'default',
            action: 'equip'
          })
        }).catch(() => {});
      } catch(e) {}

      return { success: true, message: 'Skin padrão equipada com sucesso!' };
    }

    const unlocked = Array.isArray(user.unlockedSkins) ? user.unlockedSkins : [];
    if (!unlocked.includes(skinId)) {
      return { success: false, error: 'Skin não desbloqueada.' };
    }

    equipped[charId] = skinId;
    user.equippedSkins = equipped;
    this.setCurrentUser(user);
    localStorage.setItem('lula_equipped_skins', JSON.stringify(equipped));

    try {
      fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          charId,
          skinId,
          action: 'equip'
        })
      }).catch(() => {});
    } catch(e) {}

    return { success: true, message: 'Skin equipada com sucesso!' };
  }

  // -------------------------------------------------------------
  // SISTEMA DE PRESTÍGIO (RESETA PICANHAS E CONCEDE SELO PERMANENTE)
  // -------------------------------------------------------------
  async applyPrestige() {
    const user = this.getCurrentUser();
    if (!user || !user.username) {
      return { success: false, error: 'Faça login para utilizar o sistema de prestígio.' };
    }
    const currentPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
    const PRESTIGE_COST = 10000;
    if (currentPicanhas < PRESTIGE_COST) {
      return { success: false, error: `Você precisa de pelo menos ${PRESTIGE_COST} 🥩 para prestigiar. Saldo atual: ${currentPicanhas} 🥩.` };
    }

    const newPrestige = (user.prestigeLevel || 0) + 1;
    const remainingPicanhas = 0; // Conforme especificado pelo usuário
    localStorage.setItem(TOTAL_PICANHAS_KEY, remainingPicanhas.toString());
    localStorage.setItem('lula_prestige_level', newPrestige.toString());

    user.prestigeLevel = newPrestige;
    user.totalPicanhas = remainingPicanhas;
    this.setCurrentUser(user);
    await this.syncUserDataNow();
    this.renderProfileBadge();

    return {
      success: true,
      prestigeLevel: newPrestige,
      message: `🎉 Parabéns! Você atingiu o PRESTÍGIO NÍVEL ${newPrestige}! Seu selo exclusivo foi ativado.`
    };
  }

  // -------------------------------------------------------------
  // STREAK DE LOGIN DIÁRIO (FUSO DE BRASÍLIA)
  // -------------------------------------------------------------
  checkDailyLoginStreak() {
    const user = this.getCurrentUser();
    if (!user || !user.username) return;

    let todayStr;
    try {
      todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    } catch(e) {
      todayStr = new Date().toISOString().split('T')[0];
    }

    const lastDate = user.lastLoginDate || localStorage.getItem('lula_last_login_date') || '';
    if (lastDate === todayStr) {
      return; // Já resgatou o bônus hoje
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let yesterdayStr;
    try {
      yesterdayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(yesterday);
    } catch(e) {
      yesterdayStr = yesterday.toISOString().split('T')[0];
    }

    let streak = parseInt(user.loginStreak || localStorage.getItem('lula_login_streak') || '0', 10);
    if (lastDate === yesterdayStr) {
      streak = (streak % 7) + 1;
    } else {
      streak = 1;
    }

    const rewards = [
      { day: 1, picanhas: 10, coins: 0 },
      { day: 2, picanhas: 20, coins: 0 },
      { day: 3, picanhas: 35, coins: 0 },
      { day: 4, picanhas: 50, coins: 0 },
      { day: 5, picanhas: 75, coins: 0 },
      { day: 6, picanhas: 100, coins: 0 },
      { day: 7, picanhas: 150, coins: 50 }
    ];

    const currentReward = rewards[streak - 1] || rewards[0];
    const currentPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10) + currentReward.picanhas;
    const currentCoins = parseInt(localStorage.getItem('runner_total_coins') || '0', 10) + (currentReward.coins || 0);

    localStorage.setItem(TOTAL_PICANHAS_KEY, currentPicanhas.toString());
    if (currentReward.coins > 0) {
      localStorage.setItem('runner_total_coins', currentCoins.toString());
    }
    localStorage.setItem('lula_last_login_date', todayStr);
    localStorage.setItem('lula_login_streak', streak.toString());

    user.lastLoginDate = todayStr;
    user.loginStreak = streak;
    user.totalPicanhas = currentPicanhas;
    user.runnerCoins = currentCoins;
    this.setCurrentUser(user);
    this.syncUserDataNow();

    this.showDailyStreakModal(streak, currentReward, rewards);
  }

  showDailyStreakModal(streak, currentReward, rewards) {
    let existing = document.getElementById('dailyStreakModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'dailyStreakModalOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; z-index: 10060;
      padding: 16px; font-family: 'Inter', sans-serif;
    `;

    const daysHTML = rewards.map(r => `
      <div style="
        flex: 1; min-width: 38px; padding: 8px 4px; text-align: center; border-radius: 10px;
        background: ${r.day === streak ? 'rgba(0, 230, 118, 0.2)' : (r.day < streak ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)')};
        border: 1.5px solid ${r.day === streak ? '#00e676' : (r.day < streak ? '#22c55e' : 'rgba(255,255,255,0.1)')};
        color: #fff;
      ">
        <div style="font-size: 11px; font-weight: 700; opacity: 0.8;">D${r.day}</div>
        <div style="font-size: 16px; margin: 4px 0;">${r.day === streak ? '🎁' : (r.day < streak ? '✅' : '🔒')}</div>
        <div style="font-size: 10px; font-weight: 800; color: #ffd700;">+${r.picanhas}🥩</div>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div style="
        background: #0f172a; border: 2px solid #00e676; border-radius: 20px;
        width: 100%; max-width: 440px; padding: 22px; color: #fff; text-align: center;
        box-shadow: 0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(0,230,118,0.3);
      ">
        <div style="font-size: 40px; margin-bottom: 6px;">🔥</div>
        <div style="font-family: 'Bangers', cursive; font-size: 26px; color: #00e676; letter-spacing: 1px;">
          ${isEnglishContext() ? `DAILY STREAK: DAY ${streak}!` : `STREAK DIÁRIO: DIA ${streak}!`}
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 16px;">
          ${isEnglishContext() ? 'You logged in on consecutive days and claimed your daily bonus!' : 'Você entrou no jogo em dias consecutivos e resgatou sua recompensa diária!'}
        </p>

        <div style="display: flex; gap: 6px; margin-bottom: 20px; justify-content: space-between;">
          ${daysHTML}
        </div>

        <div style="background: rgba(255, 223, 0, 0.12); border: 1px solid #ffd700; border-radius: 12px; padding: 12px; margin-bottom: 18px;">
          <div style="font-size: 12px; color: #ffd700; font-weight: 700;">${isEnglishContext() ? 'BONUS CLAIMED TODAY:' : 'BÔNUS COLETADO HOJE:'}</div>
          <div style="font-size: 22px; font-weight: 900; color: #fff; margin-top: 2px;">
            +${currentReward.picanhas} ${isEnglishContext() ? '🥩 STEAKS' : '🥩 PICANHAS'} ${currentReward.coins > 0 ? (isEnglishContext() ? `+${currentReward.coins} 💰 COINS` : `+${currentReward.coins} 💰 MOEDAS`) : ''}
          </div>
        </div>

        <button id="btnCloseStreakModal" class="btn-primary" style="width: 100%; padding: 12px; font-size: 16px; background: #00e676; color: #000; font-weight: 800; border-radius: 12px; cursor: pointer; border: none;">
          ${isEnglishContext() ? 'CONTINUE PLAYING 🚀' : 'CONTINUAR JOGANDO 🇧🇷'}
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('#btnCloseStreakModal').onclick = () => overlay.remove();
  }

  // -------------------------------------------------------------
  // MISSÕES DIÁRIAS (RESET À MEIA-NOITE DE BRASÍLIA)
  // -------------------------------------------------------------
  getDailyMissions() {
    let todayStr;
    try {
      todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    } catch(e) {
      todayStr = new Date().toISOString().split('T')[0];
    }

    let data = null;
    try {
      const stored = localStorage.getItem('lula_daily_missions_data');
      if (stored) data = JSON.parse(stored);
    } catch(e) {}

    if (!data || data.date !== todayStr) {
      data = {
        date: todayStr,
        missions: [
          { id: 'm_flappy_games', title: 'Voo Sindical', desc: 'Jogue 3 partidas no Flappy Lula', target: 3, current: 0, reward: 30, currency: 'picanhas', claimed: false },
          { id: 'm_flappy_score', title: 'Churrasco Presidencial', desc: 'Atinja 25 pontos numa única corrida no Flappy Lula', target: 25, current: 0, reward: 50, currency: 'picanhas', claimed: false },
          { id: 'm_runner_coins', title: 'Investimento Faria Lima', desc: 'Colete 40 moedas no Empresário 3D', target: 40, current: 0, reward: 60, currency: 'coins', claimed: false }
        ]
      };
      localStorage.setItem('lula_daily_missions_data', JSON.stringify(data));
    }
    return data;
  }

  updateMissionProgress(missionId, progressToAdd = 1, isMax = false) {
    const data = this.getDailyMissions();
    const m = data.missions.find(x => x.id === missionId);
    if (m && !m.claimed) {
      if (isMax) {
        m.current = Math.max(m.current, progressToAdd);
      } else {
        m.current += progressToAdd;
      }
      localStorage.setItem('lula_daily_missions_data', JSON.stringify(data));
      return m;
    }
    return null;
  }

  claimMissionReward(missionId) {
    const data = this.getDailyMissions();
    const m = data.missions.find(x => x.id === missionId);
    if (m && !m.claimed && m.current >= m.target) {
      m.claimed = true;
      localStorage.setItem('lula_daily_missions_data', JSON.stringify(data));

      const user = this.getCurrentUser() || {};
      if (m.currency === 'picanhas') {
        const cur = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10) + m.reward;
        localStorage.setItem(TOTAL_PICANHAS_KEY, cur.toString());
        user.totalPicanhas = cur;
      } else {
        const cur = parseInt(localStorage.getItem('runner_total_coins') || '0', 10) + m.reward;
        localStorage.setItem('runner_total_coins', cur.toString());
        user.runnerCoins = cur;
      }
      this.setCurrentUser(user);
      this.syncUserDataNow();
      this.renderProfileBadge();
      return { success: true, mission: m };
    }
    return { success: false };
  }

  // 1. RESERVAR NICKNAME COM VALIDAÇÃO DE DISPOSITIVO (SEGURANÇA)
  async reserveNick(username) {
    const cleanName = (username || '').trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 20) {
      return { success: false, error: 'O apelido deve ter entre 2 e 20 caracteres!' };
    }

    if (isDenylisted(cleanName)) {
      return {
        success: false,
        error: 'Este apelido é reservado pelo sistema. Escolha um nome exclusivo.'
      };
    }

    const deviceId = getDeviceId();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reserve_nick',
          username: cleanName,
          deviceId
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Erro ao reservar apelido.',
          code: data.code || 'ERROR',
          hasPassword: Boolean(data.hasPassword)
        };
      }

      const userObj = {
        username: data.username || cleanName,
        hasPassword: false,
        flappyScore: parseInt(localStorage.getItem('lula_best') || '0', 10),
        runnerScore: parseInt(localStorage.getItem('run_best') || '0', 10),
        dilmaScore: parseInt(localStorage.getItem('flappy_dilma_record_score') || '0', 10),
        totalPicanhas: parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10),
        runnerCoins: parseInt(localStorage.getItem('runner_total_coins') || '0', 10),
        avatar: '',
        createdAt: new Date().toISOString()
      };

      const localDB = this.getLocalUsersDB();
      localDB[normalizedName] = userObj;
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(localDB));

      this.setCurrentUser(userObj);
      localStorage.setItem('lula_player', cleanName);

      this.renderProfileBadge();
      return { success: true, user: userObj };
    } catch (e) {
      return {
        success: false,
        error: 'Erro de conexão ao reservar apelido. Verifique sua internet.'
      };
    }
  }

  // 1.1 JOGAR SEM SENHA COM NOME ESCOLHIDO (LEGACY - AGORA USA RESERVE NICK)
  async playWithChosenName(username) {
    return await this.reserveNick(username);
  }

  // 2. REGISTRAR CONTA COM PALAVRA-CHAVE
  async register(username, password) {
    const cleanName = (username || '').trim();
    const cleanPass = (password || '').trim();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'O nome precisa ter pelo menos 2 letras!' };
    }
    if (!cleanPass || cleanPass.length < 3) {
      return { success: false, error: 'A palavra-chave precisa ter pelo menos 3 caracteres!' };
    }

    const localPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
    const prevFlappy = parseInt(localStorage.getItem('lula_best') || '0', 10);
    const prevRunner = parseInt(localStorage.getItem('run_best') || '0', 10);
    const prevDilma = parseInt(localStorage.getItem('flappy_dilma_record_score') || '0', 10);
    const prevCoins = parseInt(localStorage.getItem('runner_total_coins') || '0', 10);
    const curAvatar = this.currentUser?.avatar || '';

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          username: cleanName,
          password: cleanPass,
          flappyScore: prevFlappy,
          runnerScore: prevRunner,
          dilmaScore: prevDilma,
          runnerCoins: prevCoins,
          totalPicanhas: localPicanhas,
          avatar: curAvatar
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || (response.status === 409 ? 'Este nome já está cadastrado com senha!' : 'Erro ao registrar conta no servidor.')
        };
      }

      const userObj = {
        username: data.user?.username || cleanName,
        hasPassword: true,
        flappyScore: data.user?.flappyScore ?? prevFlappy,
        runnerScore: data.user?.runnerScore ?? prevRunner,
        dilmaScore: data.user?.dilmaScore ?? prevDilma,
        runnerCoins: data.user?.runnerCoins ?? prevCoins,
        totalPicanhas: data.user?.totalPicanhas ?? localPicanhas,
        avatar: data.user?.avatar || curAvatar,
        createdAt: new Date().toISOString()
      };

      const localDB = this.getLocalUsersDB();
      localDB[normalizedName] = userObj;
      this.saveLocalUsersDB(localDB);

      this.setCurrentUser(userObj);
      return { success: true, user: userObj };
    } catch (err) {
      return {
        success: false,
        error: 'Erro de conexão com o servidor de autenticação. Verifique sua internet.'
      };
    }
  }

  // 3. LOGIN COM NOME E PALAVRA-CHAVE
  async login(username, password) {
    const cleanName = (username || '').trim();
    const cleanPass = (password || '').trim();
    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (!cleanName || !cleanPass) {
      return { success: false, error: 'Preencha o nome e a palavra-chave!' };
    }

    try {
      const apiRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: cleanName,
          password: cleanPass
        })
      });

      const data = await apiRes.json().catch(() => ({}));

      if (!apiRes.ok || !data.success) {
        return {
          success: false,
          error: data.error || (apiRes.status === 401 ? 'Palavra-chave incorreta! Tente novamente.' : 'Erro ao autenticar no servidor.')
        };
      }

      const localDB = this.getLocalUsersDB();
      const userObj = {
        ...(localDB[normalizedName] || {}),
        ...data.user,
        username: data.user.username || cleanName,
        hasPassword: true
      };

      localDB[normalizedName] = userObj;
      this.saveLocalUsersDB(localDB);
      this.setCurrentUser(userObj);

      // Sincroniza dados com o servidor após o login
      this.syncUserDataNow().catch(() => {});

      return { success: true, user: userObj };
    } catch (err) {
      return {
        success: false,
        error: 'Erro de conexão com o servidor de autenticação. Verifique sua internet.'
      };
    }
  }

  setCurrentUser(user) {
    if (!user) return;
    this.currentUser = user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem('lula_player', user.username);

    if (user.flappyScore !== undefined) {
      const cur = parseInt(localStorage.getItem('lula_best') || '0', 10);
      const finalFlappy = Math.max(cur, user.flappyScore);
      localStorage.setItem('lula_best', finalFlappy.toString());
      user.flappyScore = finalFlappy;
    }
    if (user.runnerScore !== undefined) {
      const cur = parseInt(localStorage.getItem('run_best') || '0', 10);
      const finalRunner = Math.max(cur, user.runnerScore);
      localStorage.setItem('run_best', finalRunner.toString());
      user.runnerScore = finalRunner;
    }
    if (user.totalPicanhas !== undefined) {
      const cur = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
      const finalPicanhas = Math.max(cur, user.totalPicanhas);
      localStorage.setItem(TOTAL_PICANHAS_KEY, finalPicanhas.toString());
      user.totalPicanhas = finalPicanhas;
    }
    if (user.lifetimePicanhas !== undefined || user.totalPicanhas !== undefined) {
      const curLifetime = parseInt(localStorage.getItem('flappy_lifetime_accumulated_picanhas') || '0', 10);
      const curTotal = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
      const incoming = user.lifetimePicanhas || user.totalPicanhas || 0;
      const finalLifetime = Math.max(curLifetime, curTotal, incoming);
      localStorage.setItem('flappy_lifetime_accumulated_picanhas', finalLifetime.toString());
      user.lifetimePicanhas = finalLifetime;
    }
    if (user.dilmaScore !== undefined) {
      const cur = parseInt(localStorage.getItem('flappy_dilma_record_score') || '0', 10);
      const finalDilma = Math.max(cur, user.dilmaScore);
      localStorage.setItem('flappy_dilma_record_score', finalDilma.toString());
      user.dilmaScore = finalDilma;
    }
    if (user.runnerCoins !== undefined) {
      const cur = parseInt(localStorage.getItem('runner_total_coins') || '0', 10);
      const finalCoins = Math.max(cur, user.runnerCoins);
      localStorage.setItem('runner_total_coins', finalCoins.toString());
      user.runnerCoins = finalCoins;
    }
    if (user.prestigeLevel !== undefined) {
      const curPrestige = parseInt(localStorage.getItem('lula_prestige_level') || '0', 10);
      const finalPrestige = Math.max(curPrestige, user.prestigeLevel || 0);
      localStorage.setItem('lula_prestige_level', finalPrestige.toString());
      user.prestigeLevel = finalPrestige;
    }
    if (user.loginStreak !== undefined && user.loginStreak > 0) {
      localStorage.setItem('lula_login_streak', user.loginStreak.toString());
    }
    if (user.lastLoginDate) {
      localStorage.setItem('lula_last_login_date', user.lastLoginDate);
    }
    if (Array.isArray(user.unlockedSkins)) {
      const localSkins = JSON.parse(localStorage.getItem('lula_unlocked_skins') || '[]');
      const mergedSkins = Array.from(new Set([...localSkins, ...user.unlockedSkins]));
      localStorage.setItem('lula_unlocked_skins', JSON.stringify(mergedSkins));
      user.unlockedSkins = mergedSkins;
    }
    if (user.equippedSkins && typeof user.equippedSkins === 'object') {
      const localEquipped = JSON.parse(localStorage.getItem('lula_equipped_skins') || '{}');
      const mergedEquipped = { ...localEquipped, ...user.equippedSkins };
      localStorage.setItem('lula_equipped_skins', JSON.stringify(mergedEquipped));
      user.equippedSkins = mergedEquipped;
    }

    if (Array.isArray(user.unlockedCharacters) && user.unlockedCharacters.length > 0) {
      // 1. Sincroniza desbloqueados no Flappy
      try {
        const rawFlappy = localStorage.getItem('flappy_unlocked_characters');
        const setFlappy = new Set(rawFlappy ? JSON.parse(rawFlappy) : ['lula']);
        user.unlockedCharacters.forEach(c => setFlappy.add(c));
        localStorage.setItem('flappy_unlocked_characters', JSON.stringify(Array.from(setFlappy)));
      } catch(e) {}

      // 2. Sincroniza desbloqueados no Runner 3D
      try {
        const rawRunner = localStorage.getItem('runner_unlocked_characters');
        const setRunner = new Set(rawRunner ? JSON.parse(rawRunner) : ['empresario']);
        user.unlockedCharacters.forEach(c => setRunner.add(c));
        localStorage.setItem('runner_unlocked_characters', JSON.stringify(Array.from(setRunner)));
      } catch(e) {}
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('lula_player');
    localStorage.removeItem('lula_unlocked_skins');
    localStorage.removeItem('lula_equipped_skins');
    localStorage.removeItem('lula_prestige_level');
    localStorage.removeItem('lula_login_streak');
    localStorage.removeItem('lula_last_login_date');
    this.renderProfileBadge();
  }

  updateUserScore(gameType, score) {
    if (!this.currentUser) return;

    const key = gameType === 'runner' ? 'runnerScore' : 'flappyScore';
    const bestKey = gameType === 'runner' ? 'run_best' : 'lula_best';

    const currentBest = this.currentUser[key] || parseInt(localStorage.getItem(bestKey) || '0', 10);

    if (score > currentBest) {
      this.currentUser[key] = score;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
      localStorage.setItem(bestKey, score.toString());

      const localDB = this.getLocalUsersDB();
      const norm = this.currentUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (localDB[norm]) {
        localDB[norm][key] = score;
        this.saveLocalUsersDB(localDB);
      }

      this.syncUserDataNow().catch(() => {});
    }
  }

  addPicanhas(count) {
    const cur = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
    const updated = cur + count;
    localStorage.setItem(TOTAL_PICANHAS_KEY, updated.toString());

    if (this.currentUser) {
      this.currentUser.totalPicanhas = updated;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));

      const localDB = this.getLocalUsersDB();
      const norm = this.currentUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (localDB[norm]) {
        localDB[norm].totalPicanhas = updated;
        this.saveLocalUsersDB(localDB);
      }
    }
  }

  // -------------------------------------------------------------
  // UI DO MODAL DE AUTENTICAÇÃO E PERFIL DO USUÁRIO
  // -------------------------------------------------------------
  mountAuthModal(onSuccessCallback) {
    let existingModal = document.getElementById('authModalOverlay');
    if (existingModal) existingModal.remove();

    const user = this.getCurrentUser();
    const currentName = user ? user.username : (localStorage.getItem('lula_player') || '');
    const currentAvatar = user?.avatar || DEFAULT_AVATAR_SVG;

    const totalPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
    const flappyBest = parseInt(localStorage.getItem('lula_best') || '0', 10);
    const runnerBest = parseInt(localStorage.getItem('run_best') || '0', 10);
    const nikolasBest = Math.max(parseInt(localStorage.getItem('flappy_nikolas_record_score') || '0', 10), user?.nikolasScore || 0);
    const runnerCoins = parseInt(localStorage.getItem('runner_total_coins') || '0', 10);
    const isNikolasUnlocked = (flappyBest >= 300 && runnerBest >= 300) || (Array.isArray(user?.unlockedCharacters) && user.unlockedCharacters.includes('nikolas'));
    const isMarcalUnlocked = (isNikolasUnlocked && nikolasBest >= 900) || (Array.isArray(user?.unlockedCharacters) && user.unlockedCharacters.includes('marcal'));

    const overlay = document.createElement('div');
    overlay.id = 'authModalOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 16px; font-family: 'Inter', sans-serif;
    `;

    const isUserLoggedIn = !!user;

    overlay.innerHTML = `
      <div class="auth-modal-box" style="
        background: #0f172a; border: 2px solid var(--amarelo-brasil, #ffd700);
        border-radius: 20px; width: 100%; max-width: 440px; padding: 24px;
        color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(255,215,0,0.25);
        position: relative; animation: popIn 0.25s ease-out; max-height: 90vh; overflow-y: auto;
      ">
        <button id="closeAuthModal" style="
          position: absolute; top: 14px; right: 14px; background: none; border: none;
          color: #94a3b8; font-size: 22px; cursor: pointer; font-weight: bold; line-height:1;
        ">✕</button>

        <h2 style="font-family: 'Bangers', cursive; font-size: 26px; letter-spacing: 1px; margin: 0 0 4px 0; color: var(--amarelo-brasil, #ffd700); text-align: center;">
          ${isUserLoggedIn ? (isEnglishContext() ? '🐦 PLAYER PROFILE' : '🇧🇷 PERFIL DO JOGADOR') : (isEnglishContext() ? '🐦 SIGN IN / PLAYER ACCESS' : '🇧🇷 ACESSO / IDENTIFICAÇÃO')}
        </h2>
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0 0 16px 0;">
          ${isUserLoggedIn ? (isEnglishContext() ? 'Manage your profile avatar, high scores, and cloud synchronization.' : 'Gerencie sua foto de perfil, recordes e sincronização na nuvem.') : (isEnglishContext() ? 'Choose your public username or protect your account with a password!' : 'Escolha seu nome público ou proteja sua conta com senha!')}
        </p>

        <!-- TABS DE NAVEGAÇÃO DO MODAL -->
        <div style="display: flex; gap: 6px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
          ${isUserLoggedIn ? `
            <button id="tabProfile" class="auth-tab active" style="flex:1; padding:8px; border-radius:8px; border:none; background:var(--azul-bandeira, #1e3a8a); color:#fff; font-weight:700; cursor:pointer; font-size:12px;">${isEnglishContext() ? '👤 My Profile' : '👤 Meu Perfil'}</button>
            <button id="tabSync" class="auth-tab" style="flex:1; padding:8px; border-radius:8px; border:none; background:transparent; color:#94a3b8; font-weight:700; cursor:pointer; font-size:12px;">${isEnglishContext() ? '☁️ Cloud Sync' : '☁️ Sincronizar'}</button>
            <button id="tabSwitchAcc" class="auth-tab" style="flex:1; padding:8px; border-radius:8px; border:none; background:transparent; color:#94a3b8; font-weight:700; cursor:pointer; font-size:12px;">${isEnglishContext() ? '🔄 Switch Account' : '🔄 Trocar Conta'}</button>
          ` : `
            <button id="tabChosenName" class="auth-tab active" style="flex:1; padding:8px; border-radius:8px; border:none; background:var(--azul-bandeira, #1e3a8a); color:#fff; font-weight:700; cursor:pointer; font-size:12px;">${isEnglishContext() ? '👤 Play as Guest' : '👤 Jogar sem Senha'}</button>
            <button id="tabRegister" class="auth-tab" style="flex:1; padding:8px; border-radius:8px; border:none; background:transparent; color:#94a3b8; font-weight:700; cursor:pointer; font-size:12px;">${isEnglishContext() ? '🔒 Create Account' : '🔒 Criar Conta'}</button>
            <button id="tabLogin" class="auth-tab" style="flex:1; padding:8px; border-radius:8px; border:none; background:transparent; color:#94a3b8; font-weight:700; cursor:pointer; font-size:12px;">${isEnglishContext() ? '🔑 Sign In' : '🔑 Entrar'}</button>
          `}
        </div>

        ${isUserLoggedIn ? `
          <!-- PAINEL: MEU PERFIL -->
          <div id="panelProfile" class="auth-form-panel">
            <!-- AVATAR & NOME DO USUÁRIO -->
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 16px;">
              <div style="position: relative;">
                <img id="profileModalAvatarImg" src="${currentAvatar}" onerror="this.src='${DEFAULT_AVATAR_SVG}'" alt="Foto de Perfil" style="
                  width: 84px; height: 84px; border-radius: 50%; border: 3px solid var(--amarelo-brasil, #ffd700);
                  object-fit: cover; box-shadow: 0 0 20px rgba(255,215,0,0.35); background: #1e293b; display: block;
                ">
                <label for="avatarFileInput" title="Carregar nova foto" style="
                  position: absolute; bottom: -2px; right: -2px; background: var(--verde-neon, #00e676);
                  color: #000; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center;
                  justify-content: center; cursor: pointer; font-size: 14px; font-weight: bold; border: 2px solid #0f172a;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                ">📷</label>
                <input type="file" id="avatarFileInput" accept="image/*" style="display: none;">
              </div>

              <div style="text-align: center;">
                <div style="font-family: 'Bangers', cursive; font-size: 22px; color: #fff; letter-spacing: 0.5px;">
                  👤 ${escapeHTML(user.username)}
                </div>
                <div style="font-size: 12px; color: ${user.hasPassword ? '#86efac' : '#94a3b8'};">
                  ${user.hasPassword ? (isEnglishContext() ? '🔒 Password-Protected Account' : '🔒 Conta Protegida por Senha') : (isEnglishContext() ? '👤 Public Guest Player' : '👤 Nome Público de Jogador')}
                </div>
              </div>
            </div>

            <!-- PRESETS DE AVATAR RÁPIDO -->
            <div style="margin-bottom: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px;">
              <div style="font-size: 11px; color: #cbd5e1; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${isEnglishContext() ? '🎨 Choose Avatar or Upload Custom Photo:' : '🎨 Escolher Avatar do Jogo ou Enviar Foto:'}
              </div>
              <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;">
                ${PRESET_AVATARS.map(p => `
                  <button class="btn-preset-avatar" data-src="${p.src}" title="${p.name}" style="
                    flex-shrink: 0; background: rgba(0,0,0,0.4); border: 1.5px solid rgba(255,255,255,0.2);
                    border-radius: 50%; width: 40px; height: 40px; padding: 0; cursor: pointer; overflow: hidden;
                    transition: transform 0.15s, border-color 0.15s;
                  ">
                    <img src="${p.src}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
                  </button>
                `).join('')}
                <button id="btnUploadCustomTrigger" title="Fazer Upload de Foto do Dispositivo" style="
                  flex-shrink: 0; background: rgba(0, 230, 118, 0.15); border: 1.5px dashed var(--verde-neon, #00e676);
                  border-radius: 50%; width: 40px; height: 40px; padding: 0; cursor: pointer; color: var(--verde-neon);
                  font-size: 16px; display: flex; align-items: center; justify-content: center;
                ">➕</button>
              </div>
            </div>

            <!-- ESTATÍSTICAS E STATUS DOS PERSONAGENS -->
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,223,0,0.2); border-radius: 12px; padding: 12px; margin-bottom: 14px;">
              <div style="font-size: 12px; font-weight: 700; color: var(--amarelo-brasil, #ffd700); margin-bottom: 8px;">
                ${isEnglishContext() ? '📊 Account Stats & Character Unlocks:' : '📊 Estatísticas & Desbloqueios da Conta:'}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                <div>${isEnglishContext() ? '🥩 Steaks:' : '🥩 Picanhas:'} <b style="color: #fff;">${totalPicanhas}</b></div>
                <div>${isEnglishContext() ? '💰 3D Coins:' : '💰 Moedas 3D:'} <b style="color: #fff;">${runnerCoins}</b></div>
                <div>${isEnglishContext() ? '🐦 Flappy Best:' : '🐦 Flappy Recorde:'} <b style="color: var(--verde-neon);">${flappyBest} pts</b></div>
                <div>${isEnglishContext() ? '🏃 3D Runner Best:' : '🏃 Runner Recorde:'} <b style="color: var(--verde-neon);">${runnerBest} km</b></div>
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span>⚡ Nikolas Ferreira:</span>
                  <span style="font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 6px; ${isNikolasUnlocked ? 'background: rgba(6,182,212,0.2); color: #06b6d4; border: 1px solid #0891b2;' : 'background: rgba(239,68,68,0.2); color: #fca5a5; border: 1px solid #ef4444;'}">
                    ${isNikolasUnlocked ? (isEnglishContext() ? '✨ Unlocked' : '✨ Desbloqueado') : '🔒 300 pts Flappy + 300 km 3D'}
                  </span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span>🚀 Pablo Marçal (${nikolasBest}/900 pts Nikolas):</span>
                  <span style="font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 6px; ${isMarcalUnlocked ? 'background: rgba(14,165,233,0.2); color: #38bdf8; border: 1px solid #0284c7;' : 'background: rgba(239,68,68,0.2); color: #fca5a5; border: 1px solid #ef4444;'}">
                    ${isMarcalUnlocked ? (isEnglishContext() ? '✨ Unlocked' : '✨ Desbloqueado') : (isEnglishContext() ? '🔒 900 pts w/ Nikolas' : '🔒 900 pts c/ Nikolas')}
                  </span>
                </div>
              </div>
            </div>

            <button id="btnProfileSyncNow" class="btn-primary" style="width: 100%; padding: 10px; font-size: 14px; letter-spacing: 0.5px; margin-bottom: 8px;">
              ${isEnglishContext() ? '🔄 SYNC DATA WITH CLOUD' : '🔄 SINCRONIZAR DADOS COM A NUVEM'}
            </button>
          </div>

          <!-- PAINEL: SINCRONIZAR NUVEM -->
          <div id="panelSync" class="auth-form-panel" style="display: none;">
            <div style="text-align: center; padding: 10px 0 16px;">
              <div style="font-size: 38px; margin-bottom: 8px;">☁️</div>
              <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px;">${isEnglishContext() ? 'Multi-Device Cloud Sync' : 'Sincronização Multi-Dispositivos'}</div>
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.4;">
                ${isEnglishContext() ? 'If you unlocked characters, accumulated steaks, or set records across devices, tap below to merge and sync to the cloud!' : 'Se você desbloqueou o Pablo Marçal, acumulou picanhas ou bateu recordes no celular ou no PC, clique abaixo para fundir e salvar tudo na nuvem!'}
              </p>
            </div>
            <button id="btnExplicitSyncAction" class="btn-primary" style="width: 100%; padding: 12px; font-size: 15px; letter-spacing: 0.5px; margin-bottom: 10px;">
              ${isEnglishContext() ? '🔄 SYNC NOW 🚀' : '🔄 SINCRONIZAR AGORA 🚀'}
            </button>
            <div id="syncReportDetails" style="font-size: 11px; color: #cbd5e1; background: rgba(0,0,0,0.4); border-radius: 8px; padding: 8px; display: none;"></div>
          </div>
        ` : ''}

        <!-- FORM: JOGAR SEM SENHA -->
        <div id="formChosenName" class="auth-form-panel" style="${isUserLoggedIn ? 'display:none;' : ''}">
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">${isEnglishContext() ? 'Your Leaderboard Name:' : 'Seu Nome no Placar:'}</label>
            <input type="text" id="inputChosenName" maxlength="25" value="${escapeHTML(currentName)}" placeholder="Ex: Lula_Gamer_BR" style="
              width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <button id="btnSubmitChosenName" class="btn-primary" style="width: 100%; padding: 12px; font-size: 14px;">${isEnglishContext() ? 'SAVE & PLAY 🚀' : 'SALVAR E JOGAR 🚀'}</button>
        </div>

        <!-- FORM: CRIAR CONTA COM SENHA -->
        <div id="formRegister" class="auth-form-panel" style="display: none;">
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">${isEnglishContext() ? 'Player Username:' : 'Nome de Jogador:'}</label>
            <input type="text" id="inputRegUser" maxlength="25" value="${escapeHTML(currentName)}" placeholder="Ex: Empresario_Ouro" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">${isEnglishContext() ? 'Password / Passphrase:' : 'Palavra-Chave / Senha:'}</label>
            <input type="password" id="inputRegPass" maxlength="40" placeholder="${isEnglishContext() ? 'Enter a simple password' : 'Digite uma senha simples'}" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <button id="btnSubmitRegister" class="btn-secondary" style="width: 100%; padding: 12px; font-size: 14px; background: linear-gradient(135deg, #ffd700, #f59e0b); color: #000; border: none;">${isEnglishContext() ? 'CREATE PROTECTED ACCOUNT 🔒' : 'CRIAR CONTA PROTEGIDA 🔒'}</button>
        </div>

        <!-- FORM: ENTRAR -->
        <div id="formLogin" class="auth-form-panel" style="display: none;">
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Nome de Jogador:</label>
            <input type="text" id="inputLoginUser" maxlength="25" value="${escapeHTML(currentName)}" placeholder="${isEnglishContext() ? 'Your registered username' : 'Seu nome cadastrado'}" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Palavra-Chave / Senha:</label>
            <input type="password" id="inputLoginPass" maxlength="40" placeholder="${isEnglishContext() ? 'Your password' : 'Sua senha'}" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <button id="btnSubmitLogin" class="btn-primary" style="width: 100%; padding: 12px; font-size: 14px; background: linear-gradient(135deg, #38bdf8, #2563eb); border: none;">${isEnglishContext() ? 'SIGN IN 🔑' : 'ENTRAR NA CONTA 🔑'}</button>
        </div>

        <!-- MENSAGEM DE STATUS/ERRO -->
        <div id="authStatusMsg" style="
          margin-top: 14px; font-size: 12px; text-align: center; min-height: 18px;
          display: none; padding: 8px; border-radius: 6px; font-weight: 600;
        "></div>
      </div>
    `;

    document.body.appendChild(overlay);

    const showMsg = (txt, isErr = true) => {
      const msg = document.getElementById('authStatusMsg');
      if (!msg) return;
      msg.style.display = 'block';
      msg.style.background = isErr ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
      msg.style.color = isErr ? '#fca5a5' : '#86efac';
      msg.style.border = `1px solid ${isErr ? '#ef4444' : '#22c55e'}`;
      msg.innerText = txt;
    };

    // Navegação de Tabs
    const allTabs = overlay.querySelectorAll('.auth-tab');
    const allPanels = overlay.querySelectorAll('.auth-form-panel');

    const selectTab = (btn, targetPanel) => {
      allTabs.forEach(t => {
        t.style.background = 'transparent';
        t.style.color = '#94a3b8';
      });
      allPanels.forEach(p => p.style.display = 'none');

      btn.style.background = 'var(--azul-bandeira, #1e3a8a)';
      btn.style.color = '#fff';
      if (targetPanel) targetPanel.style.display = 'block';
      document.getElementById('authStatusMsg').style.display = 'none';
    };

    if (isUserLoggedIn) {
      const tabProf = document.getElementById('tabProfile');
      const tabSy = document.getElementById('tabSync');
      const tabSw = document.getElementById('tabSwitchAcc');
      const pProf = document.getElementById('panelProfile');
      const pSync = document.getElementById('panelSync');
      const fLog = document.getElementById('formLogin');

      if (tabProf) tabProf.onclick = () => selectTab(tabProf, pProf);
      if (tabSy) tabSy.onclick = () => selectTab(tabSy, pSync);
      if (tabSw) tabSw.onclick = () => selectTab(tabSw, fLog);
    } else {
      const tabChosen = document.getElementById('tabChosenName');
      const tabReg = document.getElementById('tabRegister');
      const tabLog = document.getElementById('tabLogin');
      const fChosen = document.getElementById('formChosenName');
      const fReg = document.getElementById('formRegister');
      const fLog = document.getElementById('formLogin');

      if (tabChosen) tabChosen.onclick = () => selectTab(tabChosen, fChosen);
      if (tabReg) tabReg.onclick = () => selectTab(tabReg, fReg);
      if (tabLog) tabLog.onclick = () => selectTab(tabLog, fLog);
    }

    document.getElementById('closeAuthModal').onclick = () => overlay.remove();

    // ---------------------------------------------------------
    // HANDLERS DE UPLOAD DE FOTO & PRESETS
    // ---------------------------------------------------------
    const avatarInput = document.getElementById('avatarFileInput');
    const modalAvatarImg = document.getElementById('profileModalAvatarImg');

    const handleAvatarUpdate = async (source) => {
      showMsg('Otimizando e salvando foto de perfil... ⏳', false);
      try {
        const res = await this.updateUserAvatar(source);
        if (res.success) {
          if (modalAvatarImg) modalAvatarImg.src = res.avatar || DEFAULT_AVATAR_SVG;
          showMsg('Foto de perfil atualizada com sucesso! ✨', false);
          this.renderProfileBadge();
        } else {
          showMsg(res.error || 'Erro ao salvar foto.');
        }
      } catch (err) {
        showMsg('Erro ao processar imagem: ' + err.message);
      }
    };

    if (avatarInput) {
      avatarInput.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          AuthManager.mountAvatarCropModal(file, async (croppedBase64) => {
            await handleAvatarUpdate(croppedBase64);
          });
        }
        // Reseta o input para permitir selecionar a mesma imagem se quiser
        avatarInput.value = '';
      };
    }

    document.getElementById('btnUploadCustomTrigger')?.addEventListener('click', () => {
      avatarInput?.click();
    });

    overlay.querySelectorAll('.btn-preset-avatar').forEach(btn => {
      btn.onclick = async () => {
        const src = btn.getAttribute('data-src');
        if (src) {
          await handleAvatarUpdate(src);
        }
      };
    });

    // ---------------------------------------------------------
    // HANDLER DO BOTÃO DE SINCRONIZAÇÃO NUVEM
    // ---------------------------------------------------------
    const runSync = async (btn) => {
      if (btn) {
        btn.innerText = 'SINCRONIZANDO COM A NUVEM... ⏳';
        btn.disabled = true;
      }
      showMsg('Conectando ao banco de dados e sincronizando recordes... ☁️', false);

      const result = await this.syncUserDataNow();
      if (btn) {
        btn.innerText = '🔄 SINCRONIZAR AGORA 🚀';
        btn.disabled = false;
      }

      if (result.success) {
        const u = result.user;
        const msg = result.isMarcalUnlocked
          ? `✅ Sincronizado com sucesso! Pablo Marçal DESBLOQUEADO (Recorde Dilma: ${u.dilmaScore || 0} pts)!`
          : `✅ Sincronizado com sucesso! Recordes e Picanhas atualizados na nuvem.`;
        showMsg(msg, false);

        const rep = document.getElementById('syncReportDetails');
        if (rep) {
          rep.style.display = 'block';
          rep.innerHTML = `
            <b>Status da Sincronização:</b><br>
            • Picanhas: <b>${u.totalPicanhas}</b> 🥩<br>
            • Recorde Flappy: <b>${u.flappyScore}</b> pts<br>
            • Recorde Dilma: <b>${u.dilmaScore}</b> pts (${result.isMarcalUnlocked ? '✨ Pablo Marçal Desbloqueado' : '🔒 Marçal Bloqueado'})<br>
            • Moedas Runner: <b>${u.runnerCoins}</b> 💰
          `;
        }

        this.renderProfileBadge();
      } else {
        showMsg(result.error || 'Erro na sincronização.');
      }
    };

    document.getElementById('btnProfileSyncNow')?.addEventListener('click', (e) => runSync(e.target));
    document.getElementById('btnExplicitSyncAction')?.addEventListener('click', (e) => runSync(e.target));

    // ---------------------------------------------------------
    // SUBMIT ACTIONS
    // ---------------------------------------------------------
    document.getElementById('btnSubmitChosenName')?.addEventListener('click', async () => {
      const name = document.getElementById('inputChosenName').value;
      const res = await this.playWithChosenName(name);
      if (res.success) {
        showMsg('Nome atualizado com sucesso! Carregando...', false);
        setTimeout(() => {
          overlay.remove();
          if (onSuccessCallback) onSuccessCallback(res.user);
        }, 600);
      } else {
        showMsg(res.error);
      }
    });

    document.getElementById('btnSubmitRegister')?.addEventListener('click', async () => {
      const name = document.getElementById('inputRegUser').value;
      const pass = document.getElementById('inputRegPass').value;
      const btn = document.getElementById('btnSubmitRegister');
      btn.innerText = 'CRIANDO CONTA... ⏳';
      btn.disabled = true;

      const res = await this.register(name, pass);
      btn.innerText = 'CRIAR CONTA PROTEGIDA 🔒';
      btn.disabled = false;

      if (res.success) {
        showMsg('Conta criada e protegida com sucesso! Carregando...', false);
        setTimeout(() => {
          overlay.remove();
          if (onSuccessCallback) onSuccessCallback(res.user);
        }, 700);
      } else {
        showMsg(res.error);
      }
    });

    document.getElementById('btnSubmitLogin')?.addEventListener('click', async () => {
      const name = document.getElementById('inputLoginUser').value;
      const pass = document.getElementById('inputLoginPass').value;
      const btn = document.getElementById('btnSubmitLogin');
      btn.innerText = 'AUTENTICANDO... ⏳';
      btn.disabled = true;

      const res = await this.login(name, pass);
      btn.innerText = 'ENTRAR NA CONTA 🔑';
      btn.disabled = false;

      if (res.success) {
        showMsg(`Bem-vindo de volta, ${res.user.username}!`, false);
        setTimeout(() => {
          overlay.remove();
          if (onSuccessCallback) onSuccessCallback(res.user);
        }, 700);
      } else {
        showMsg(res.error);
      }
    });
  }

  // -------------------------------------------------------------
  // RENDERIZAÇÃO DO BADGE NO HEADER / NAVBAR COM FOTO DE PERFIL
  // -------------------------------------------------------------
  renderProfileBadge(containerSelector = '#profileBadgeContainer') {
    let target = null;
    if (typeof containerSelector === 'string') {
      target = document.querySelector(containerSelector);
    } else if (containerSelector instanceof HTMLElement) {
      target = containerSelector;
    }

    if (!target) {
      target = document.getElementById('profileBadgeContainer') || document.getElementById('authBadge');
    }

    if (target && target.tagName === 'NAV') {
      let badgeHolder = target.querySelector('#profileBadgeContainer');
      if (!badgeHolder) {
        badgeHolder = document.createElement('div');
        badgeHolder.id = 'profileBadgeContainer';
        badgeHolder.className = 'nav-right-group';
        target.appendChild(badgeHolder);
      }
      target = badgeHolder;
    }

    const toggleBtn = document.getElementById('navToggle') || document.getElementById('btnNavToggle');
    const navLinks = document.getElementById('navLinks') || document.getElementById('navLinksList');
    if (toggleBtn && navLinks && !toggleBtn.dataset.bound) {
      toggleBtn.dataset.bound = 'true';
      toggleBtn.innerHTML = '☰ Menu';
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('open');
        toggleBtn.innerHTML = navLinks.classList.contains('open') ? '✕ Fechar' : '☰ Menu';
      };
      document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && e.target !== toggleBtn) {
          navLinks.classList.remove('open');
          toggleBtn.innerHTML = '☰ Menu';
        }
      });
    }

    const user = this.getCurrentUser();
    const totalPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
    const runnerCoins = parseInt(localStorage.getItem('runner_total_coins') || '0', 10);
    const userAvatar = user?.avatar || DEFAULT_AVATAR_SVG;

    // 1. Renderiza Card de Usuário dentro do Menu Mobile (Drawer)
    if (navLinks) {
      let mobileCard = navLinks.querySelector('.mobile-nav-profile-card');
      if (!mobileCard) {
        mobileCard = document.createElement('li');
        mobileCard.className = 'mobile-nav-profile-card';
        navLinks.insertBefore(mobileCard, navLinks.firstChild);
      }

      if (user) {
        const safeUsername = escapeHTML(user.username);
        mobileCard.innerHTML = `
          <div class="mobile-user-card-content">
            <div class="mobile-user-header">
              <img class="mobile-user-avatar-img" src="${userAvatar}" onerror="this.src='${DEFAULT_AVATAR_SVG}'" alt="Avatar do Jogador">
              <div class="mobile-user-info">
                <div class="mobile-user-name">${safeUsername}</div>
                <div class="mobile-user-stats">🥩 <b>${totalPicanhas}</b> Picanhas · 💰 <b>${runnerCoins}</b> Moedas</div>
              </div>
            </div>
            <div class="mobile-user-buttons">
              <button id="btnMobileEditProfile" class="btn-user-action btn-user-change">${isEnglishContext() ? '👤 View Profile & Avatar' : '👤 Ver Perfil & Foto'}</button>
              <button id="btnMobileLogoutAcc" class="btn-user-action btn-user-logout">${isEnglishContext() ? '🚪 Sign Out' : '🚪 Sair'}</button>
            </div>
          </div>
        `;
        mobileCard.querySelector('#btnMobileEditProfile')?.addEventListener('click', (e) => {
          e.stopPropagation();
          navLinks.classList.remove('open');
          if (toggleBtn) toggleBtn.innerHTML = '☰ Menu';
          this.mountAuthModal(() => this.renderProfileBadge(containerSelector));
        });
        mobileCard.querySelector('#btnMobileLogoutAcc')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Deseja realmente sair da sua conta?')) {
            this.logout();
            window.location.reload();
          }
        });
      } else {
        mobileCard.innerHTML = `
          <div class="mobile-user-card-content" style="padding: 10px 6px;">
            <button id="btnMobileLoginAcc" class="btn-primary" style="width:100%; font-size:15px; padding:10px 14px; letter-spacing:0.5px;">
              ${isEnglishContext() ? '🔑 SIGN IN / GUEST' : '🔑 ENTRAR / ESCOLHER NICK'}
            </button>
          </div>
        `;
        mobileCard.querySelector('#btnMobileLoginAcc')?.addEventListener('click', (e) => {
          e.stopPropagation();
          navLinks.classList.remove('open');
          if (toggleBtn) toggleBtn.innerHTML = '☰ Menu';
          this.mountAuthModal(() => this.renderProfileBadge(containerSelector));
        });
      }
    }

    // 2. Renderiza no cabeçalho Desktop
    if (!target) return;

    if (user) {
      const safeUsername = escapeHTML(user.username);
      target.innerHTML = `
        <div id="btnDesktopProfileTrigger" title="Abrir Perfil, Foto e Sincronização" class="desktop-user-pill" style="cursor: pointer; display: inline-flex; align-items: center; gap: 8px; padding: 4px 10px; background: rgba(255,255,255,0.08); border: 1.5px solid var(--amarelo-brasil); border-radius: 20px; transition: all 0.2s;">
          <img src="${userAvatar}" onerror="this.src='${DEFAULT_AVATAR_SVG}'" alt="Avatar do Jogador" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1px solid var(--amarelo-brasil); background: #1e293b;">
          <span style="font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap;">
            ${safeUsername} <b style="color: var(--verde-neon); margin-left: 2px;">(${totalPicanhas} 🥩)</b>
          </span>
        </div>
        <button id="btnLogoutProfile" title="Trocar ou Sair da Conta" style="
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25);
          color: #fff; border-radius: 8px; padding: 6px 10px; font-size: 11px; cursor: pointer; font-weight:700; transition:all 0.2s; white-space:nowrap;
        ">${isEnglishContext() ? 'Sign Out' : 'Sair'}</button>
      `;
      document.getElementById('btnDesktopProfileTrigger').onclick = (e) => {
        e.stopPropagation();
        this.mountAuthModal(() => this.renderProfileBadge(containerSelector));
      };
      document.getElementById('btnLogoutProfile').onclick = (e) => {
        e.stopPropagation();
        if (confirm('Deseja realmente sair da conta?')) {
          this.logout();
          window.location.reload();
        }
      };
    } else {
      target.innerHTML = `
        <button id="btnLoginProfile" style="
          background: rgba(255,223,0,0.18); border: 1.5px solid var(--amarelo-brasil);
          color: var(--amarelo-brasil); border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; font-weight: 800;
          box-shadow: 0 0 12px rgba(255,223,0,0.2); transition: all 0.2s; white-space:nowrap;
        ">${isEnglishContext() ? '🔑 Sign In / Profile' : '🔑 Entrar / Mudar Nome'}</button>
      `;
      document.getElementById('btnLoginProfile').onclick = (e) => {
        e.stopPropagation();
        this.mountAuthModal(() => this.renderProfileBadge(containerSelector));
      };
    }
  }

  // -------------------------------------------------------------
  // GUARDIÃO DE ENTRADA OBRIGATÓRIA DE NICKNAME (SEM X / ESC / CLIQUE FORA)
  // -------------------------------------------------------------
  requireValidNick(onConfirmed) {
    const user = this.getCurrentUser();
    if (user && user.username && user.username.trim().length >= 2 && !isDenylisted(user.username)) {
      if (onConfirmed) onConfirmed(user);
      return;
    }

    let existingModal = document.getElementById('mandatoryNickModalOverlay');
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mandatoryNickModalOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(5, 10, 24, 0.94); backdrop-filter: blur(14px);
      display: flex; align-items: center; justify-content: center; z-index: 99999;
      padding: 16px; font-family: 'Inter', sans-serif;
    `;

    overlay.innerHTML = `
      <div style="
        background: #0f172a; border: 3px solid var(--amarelo-brasil, #ffd700);
        border-radius: 24px; width: 100%; max-width: 440px; padding: 26px 24px;
        color: #fff; box-shadow: 0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(255,215,0,0.3);
        position: relative; text-align: center; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      ">
        <div style="font-size: 38px; margin-bottom: 6px;">🎮</div>
        <h2 style="font-family: 'Bangers', cursive; font-size: 28px; letter-spacing: 1.5px; margin: 0 0 6px 0; color: var(--amarelo-brasil, #ffd700);">
          ${isEnglishContext() ? 'CHOOSE YOUR NICKNAME TO PLAY' : 'ESCOLHA SEU APELIDO PARA JOGAR'}
        </h2>
        <p style="font-size: 13px; color: #94a3b8; margin: 0 0 18px 0; line-height: 1.45;">
          ${isEnglishContext() ? 'Your nickname will be reserved for this device on the National Leaderboard.' : 'Seu apelido será reservado com exclusividade para este dispositivo no Ranking Nacional.'}
        </p>

        <div style="text-align: left; margin-bottom: 14px;">
          <label style="font-size: 11px; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${isEnglishContext() ? 'Nickname (2 to 20 letters/numbers):' : 'Apelido (2 a 20 letras/números):'}
          </label>
          <input type="text" id="inputMandatoryNick" maxlength="20" placeholder="${isEnglishContext() ? 'e.g. Victor_99' : 'ex: Victor_99, Daniel_BR'}" style="
            width: 100%; padding: 12px 14px; border-radius: 12px; border: 2px solid rgba(255,223,0,0.4);
            background: rgba(255,255,255,0.06); color: #fff; font-size: 16px; font-weight: 700; box-sizing: border-box;
            outline: none; transition: border-color 0.2s;
          ">
          <div id="mandatoryNickStatus" style="display:none; font-size: 12px; margin-top: 8px; padding: 8px 12px; border-radius: 8px; font-weight: 600; text-align: left;"></div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
          <button id="btnMandatoryPlay" style="
            flex: 1; padding: 12px; border-radius: 12px; border: none; font-weight: 800; font-size: 16px;
            background: linear-gradient(135deg, #00c853, #00e676); color: #042410; cursor: pointer;
            transition: transform 0.15s, box-shadow 0.15s;
          ">${isEnglishContext() ? '▶ PLAY NOW 🚀' : '▶ JOGAR AGORA 🇧🇷'}</button>
        </div>

        <button id="btnMandatoryLogin" style="
          background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #94a3b8;
          padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        ">${isEnglishContext() ? 'Sign In / Register' : 'Entrar / Criar Conta'}</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('#inputMandatoryNick');
    const btn = overlay.querySelector('#btnMandatoryPlay');
    const btnLogin = overlay.querySelector('#btnMandatoryLogin');
    const statusDiv = overlay.querySelector('#mandatoryNickStatus');

    const showModalError = (msg) => {
      statusDiv.style.display = 'block';
      statusDiv.style.background = 'rgba(239, 68, 68, 0.15)';
      statusDiv.style.border = '1px solid #ef4444';
      statusDiv.style.color = '#fca5a5';
      statusDiv.textContent = msg;
    };

    const handleConfirm = async () => {
      const val = (input.value || '').trim();
      if (!val || val.length < 2) {
        showModalError(isEnglishContext() ? 'Nickname must have at least 2 characters.' : 'O apelido deve ter pelo menos 2 caracteres.');
        return;
      }
      if (val.length > 20) {
        showModalError(isEnglishContext() ? 'Nickname must have at most 20 characters.' : 'O apelido deve ter no máximo 20 caracteres.');
        return;
      }
      if (isDenylisted(val)) {
        showModalError(isEnglishContext() ? 'This nickname is reserved by the system.' : 'Este apelido é reservado pelo sistema.');
        return;
      }

      btn.innerText = isEnglishContext() ? '⏳ PLAYING...' : '⏳ JOGANDO...';
      btn.disabled = true;

      const res = await this.reserveNick(val);
      btn.innerText = isEnglishContext() ? '▶ PLAY NOW 🚀' : '▶ JOGAR AGORA 🇧🇷';
      btn.disabled = false;

      if (res.success) {
        overlay.remove();
        this.renderProfileBadge();
        if (onConfirmed) onConfirmed(res.user);
      } else {
        if (res.hasPassword) {
          showModalError(res.error || (isEnglishContext() ? 'This account has a password. Click Sign In.' : 'Este apelido já possui senha. Clique em Entrar na Conta.'));
        } else {
          showModalError(res.error || (isEnglishContext() ? 'Nickname unavailable.' : 'Apelido indisponível.'));
        }
      }
    };

    btn?.addEventListener('click', handleConfirm);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    });

    btnLogin?.addEventListener('click', () => {
      overlay.remove();
      this.mountAuthModal((loggedUser) => {
        this.renderProfileBadge();
        if (onConfirmed) onConfirmed(loggedUser);
      });
    });

    // Impede fechar com ESC ou clique fora
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { once: true });
  }
}

export const auth = new AuthManager();
