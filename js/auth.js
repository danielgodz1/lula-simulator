// js/auth.js — Sistema de Contas, Perfis com Foto/Avatar Otimizado, Sincronização Cloud de Pablo Marçal e Recordes
import { firebaseConfig } from './firebase-config.js';
import { escapeHTML } from './security.js';

const USERS_DB_KEY = 'lula_users_db_v2';
const CURRENT_USER_KEY = 'lula_current_user_v2';
const TOTAL_PICANHAS_KEY = 'flappy_total_accumulated_picanhas';

// Avatar padrão elegante em SVG Data URL (Zero requisições de rede, 100% offline-ready)
export const DEFAULT_AVATAR_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='50' r='48' fill='none' stroke='%23ffdf00' stroke-width='3'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2394a3b8'/%3E%3Cpath d='M20 86c0-16.5 13.5-30 30-30s30 13.5 30 30' fill='%2394a3b8'/%3E%3C/svg%3E";

export const PRESET_AVATARS = [
  { id: 'lula', name: 'Lula', src: 'img/lula.png' },
  { id: 'marcal', name: 'Marçal', src: 'img/marcal.png' },
  { id: 'dilma', name: 'Dilma', src: 'img/dilma.png' },
  { id: 'empresario', name: 'Empresário', src: 'img/favela.png' },
  { id: 'bolsonaro', name: 'Capitão', src: 'img/bolsonaro.png' },
  { id: 'moraes', name: 'Xandão', src: 'img/moraes.png' },
  { id: 'nikolas', name: 'Nikolas', src: 'img/nikolas.png' },
  { id: 'janja', name: 'Janja', src: 'img/janja.png' }
];

class AuthManager {
  constructor() {
    this.currentUser = this.loadCurrentUser();
    // Inicia sincronização em background se houver usuário conectado
    if (this.currentUser) {
      this.syncFromCloud();
    }
  }

  loadCurrentUser() {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
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
          ✂️ AJUSTAR & ENQUADRAR FOTO
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.3;">
          Arraste a imagem para posicionar e use o slider para dar zoom no rosto!
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
            SALVAR FOTO ✂️
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
    const localAvatar = this.currentUser.avatar || '';

    // Extrai personagens desbloqueados
    const localUnlocked = [];
    if (localDilma >= 200) localUnlocked.push('marcal');
    try {
      const runnerUnlocks = JSON.parse(localStorage.getItem('runner_unlocked_characters') || '[]');
      if (Array.isArray(runnerUnlocks)) localUnlocked.push(...runnerUnlocks);
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
          totalPicanhas: Math.max(localPicanhas, this.currentUser.totalPicanhas || 0),
          runnerCoins: Math.max(localRunnerCoins, this.currentUser.runnerCoins || 0),
          unlockedCharacters: localUnlocked,
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
            isMarcalUnlocked: (data.user.dilmaScore >= 200 || (data.user.unlockedCharacters && data.user.unlockedCharacters.includes('marcal')))
          };
        }
      }
    } catch (err) {
      console.warn('Tentando fallback Firestore para sincronização:', err);
    }

    // 2. Fallback direto ao Firestore com username incluído
    const normalizedName = username.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    try {
      const checkUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
      const res = await fetch(checkUrl);
      if (res.ok) {
        const doc = await res.json();
        const cloudPicanhas = parseInt(doc.fields?.totalPicanhas?.integerValue || '0', 10);
        const cloudFlappy = parseInt(doc.fields?.flappyScore?.integerValue || '0', 10);
        const cloudRunner = parseInt(doc.fields?.runnerScore?.integerValue || '0', 10);
        const cloudDilma = parseInt(doc.fields?.dilmaScore?.integerValue || '0', 10);
        const cloudRunnerCoins = parseInt(doc.fields?.runnerCoins?.integerValue || '0', 10);
        const cloudAvatar = doc.fields?.avatar?.stringValue || '';

        const mergedPicanhas = Math.max(localPicanhas, cloudPicanhas, this.currentUser.totalPicanhas || 0);
        const mergedFlappy = Math.max(localFlappy, cloudFlappy, this.currentUser.flappyScore || 0);
        const mergedRunner = Math.max(localRunner, cloudRunner, this.currentUser.runnerScore || 0);
        const mergedDilma = Math.max(localDilma, cloudDilma, this.currentUser.dilmaScore || 0);
        const mergedRunnerCoins = Math.max(localRunnerCoins, cloudRunnerCoins, this.currentUser.runnerCoins || 0);
        const mergedAvatar = localAvatar || cloudAvatar || '';

        const mergedUser = {
          ...this.currentUser,
          username,
          totalPicanhas: mergedPicanhas,
          flappyScore: mergedFlappy,
          runnerScore: mergedRunner,
          dilmaScore: mergedDilma,
          runnerCoins: mergedRunnerCoins,
          avatar: mergedAvatar
        };

        this.setCurrentUser(mergedUser);

        // Atualiza cloud com todos os campos incluindo username
        const patchUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}?updateMask.fieldPaths=username&updateMask.fieldPaths=totalPicanhas&updateMask.fieldPaths=flappyScore&updateMask.fieldPaths=runnerScore&updateMask.fieldPaths=dilmaScore&updateMask.fieldPaths=runnerCoins&updateMask.fieldPaths=avatar&updateMask.fieldPaths=lastSync`;
        const patchPayload = {
          fields: {
            username: { stringValue: username },
            totalPicanhas: { integerValue: mergedPicanhas.toString() },
            flappyScore: { integerValue: mergedFlappy.toString() },
            runnerScore: { integerValue: mergedRunner.toString() },
            dilmaScore: { integerValue: mergedDilma.toString() },
            runnerCoins: { integerValue: mergedRunnerCoins.toString() },
            avatar: { stringValue: mergedAvatar },
            lastSync: { timestampValue: new Date().toISOString() }
          }
        };

        fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchPayload)
        }).catch(() => {});

        return {
          success: true,
          user: mergedUser,
          isMarcalUnlocked: (mergedDilma >= 200)
        };
      }
    } catch (e) {}

    return {
      success: true,
      user: this.currentUser,
      isMarcalUnlocked: (localDilma >= 200)
    };
  }

  // 1. JOGAR SEM SENHA COM NOME ESCOLHIDO PELO JOGADOR
  async playWithChosenName(username) {
    const cleanName = (username || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Digite um nome de jogador válido (mínimo 2 letras)!' };
    }

    const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const localDB = this.getLocalUsersDB();

    if (localDB[normalizedName] && localDB[normalizedName].hasPassword) {
      return {
        success: false,
        error: `O nome "${cleanName}" pertence a uma conta protegida por senha! Digite a senha na aba "Entrar" ou escolha outro nome.`
      };
    }

    let remoteUser = null;
    try {
      const checkUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
      const res = await fetch(checkUrl);
      if (res.ok) {
        const doc = await res.json();
        const hasPassword = doc.fields?.hasPassword?.booleanValue;
        if (hasPassword) {
          return {
            success: false,
            error: `O nome "${cleanName}" já está cadastrado com senha! Faça login na aba "Entrar" ou escolha outro nome.`
          };
        }
        remoteUser = {
          username: doc.fields?.username?.stringValue || cleanName,
          hasPassword: false,
          flappyScore: parseInt(doc.fields?.flappyScore?.integerValue || '0', 10),
          runnerScore: parseInt(doc.fields?.runnerScore?.integerValue || '0', 10),
          dilmaScore: parseInt(doc.fields?.dilmaScore?.integerValue || '0', 10),
          totalPicanhas: parseInt(doc.fields?.totalPicanhas?.integerValue || '0', 10),
          runnerCoins: parseInt(doc.fields?.runnerCoins?.integerValue || '0', 10),
          avatar: doc.fields?.avatar?.stringValue || '',
          createdAt: doc.fields?.createdAt?.timestampValue || new Date().toISOString()
        };
      }
    } catch (e) {}

    const localPicanhas = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
    const localFlappy = parseInt(localStorage.getItem('lula_best') || '0', 10);
    const localRunner = parseInt(localStorage.getItem('run_best') || '0', 10);
    const localDilma = parseInt(localStorage.getItem('flappy_dilma_record_score') || '0', 10);
    const localRunnerCoins = parseInt(localStorage.getItem('runner_total_coins') || '0', 10);

    let userObj = remoteUser || localDB[normalizedName] || {
      username: cleanName,
      hasPassword: false,
      flappyScore: localFlappy,
      runnerScore: localRunner,
      dilmaScore: localDilma,
      totalPicanhas: localPicanhas,
      runnerCoins: localRunnerCoins,
      avatar: '',
      createdAt: new Date().toISOString()
    };

    userObj.totalPicanhas = Math.max(userObj.totalPicanhas || 0, localPicanhas);
    userObj.flappyScore = Math.max(userObj.flappyScore || 0, localFlappy);
    userObj.runnerScore = Math.max(userObj.runnerScore || 0, localRunner);
    userObj.dilmaScore = Math.max(userObj.dilmaScore || 0, localDilma);
    userObj.runnerCoins = Math.max(userObj.runnerCoins || 0, localRunnerCoins);

    localDB[normalizedName] = userObj;
    this.saveLocalUsersDB(localDB);

    try {
      const publicDocUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/lula_users_v2/${encodeURIComponent(normalizedName)}`;
      const publicPayload = {
        fields: {
          username: { stringValue: cleanName },
          hasPassword: { booleanValue: false },
          flappyScore: { integerValue: (userObj.flappyScore || 0).toString() },
          runnerScore: { integerValue: (userObj.runnerScore || 0).toString() },
          dilmaScore: { integerValue: (userObj.dilmaScore || 0).toString() },
          totalPicanhas: { integerValue: (userObj.totalPicanhas || 0).toString() },
          runnerCoins: { integerValue: (userObj.runnerCoins || 0).toString() },
          avatar: { stringValue: userObj.avatar || '' },
          createdAt: { timestampValue: userObj.createdAt }
        }
      };
      fetch(publicDocUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publicPayload)
      }).catch(() => {});
    } catch (e) {}

    this.setCurrentUser(userObj);
    return { success: true, user: userObj };
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
      localStorage.setItem('lula_best', Math.max(cur, user.flappyScore).toString());
    }
    if (user.runnerScore !== undefined) {
      const cur = parseInt(localStorage.getItem('run_best') || '0', 10);
      localStorage.setItem('run_best', Math.max(cur, user.runnerScore).toString());
    }
    if (user.totalPicanhas !== undefined) {
      const cur = parseInt(localStorage.getItem(TOTAL_PICANHAS_KEY) || '0', 10);
      const finalPicanhas = Math.max(cur, user.totalPicanhas);
      localStorage.setItem(TOTAL_PICANHAS_KEY, finalPicanhas.toString());
    }
    if (user.dilmaScore !== undefined) {
      const cur = parseInt(localStorage.getItem('flappy_dilma_record_score') || '0', 10);
      const finalDilma = Math.max(cur, user.dilmaScore);
      localStorage.setItem('flappy_dilma_record_score', finalDilma.toString());
    }
    if (user.runnerCoins !== undefined) {
      const cur = parseInt(localStorage.getItem('runner_total_coins') || '0', 10);
      const finalCoins = Math.max(cur, user.runnerCoins);
      localStorage.setItem('runner_total_coins', finalCoins.toString());
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('lula_player');
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
    const dilmaBest = Math.max(parseInt(localStorage.getItem('flappy_dilma_record_score') || '0', 10), user?.dilmaScore || 0);
    const runnerCoins = parseInt(localStorage.getItem('runner_total_coins') || '0', 10);
    const isMarcalUnlocked = dilmaBest >= 200 || (Array.isArray(user?.unlockedCharacters) && user.unlockedCharacters.includes('marcal'));

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
          ${isUserLoggedIn ? '🇧🇷 PERFIL DO JOGADOR' : '🇧🇷 ACESSO / IDENTIFICAÇÃO'}
        </h2>
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0 0 16px 0;">
          ${isUserLoggedIn ? 'Gerencie sua foto de perfil, recordes e sincronização na nuvem.' : 'Escolha seu nome público ou proteja sua conta com senha!'}
        </p>

        <!-- TABS DE NAVEGAÇÃO DO MODAL -->
        <div style="display: flex; gap: 6px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
          ${isUserLoggedIn ? `
            <button id="tabProfile" class="auth-tab active" style="flex:1; padding:8px; border-radius:8px; border:none; background:var(--azul-bandeira, #1e3a8a); color:#fff; font-weight:700; cursor:pointer; font-size:12px;">👤 Meu Perfil</button>
            <button id="tabSync" class="auth-tab" style="flex:1; padding:8px; border-radius:8px; border:none; background:transparent; color:#94a3b8; font-weight:700; cursor:pointer; font-size:12px;">☁️ Sincronizar</button>
            <button id="tabSwitchAcc" class="auth-tab" style="flex:1; padding:8px; border-radius:8px; border:none; background:transparent; color:#94a3b8; font-weight:700; cursor:pointer; font-size:12px;">🔄 Trocar Conta</button>
          ` : `
            <button id="tabChosenName" class="auth-tab active" style="flex:1; padding:8px; border-radius:8px; border:none; background:var(--azul-bandeira, #1e3a8a); color:#fff; font-weight:700; cursor:pointer; font-size:12px;">👤 Jogar sem Senha</button>
            <button id="tabRegister" class="auth-tab" style="flex:1; padding:8px; border-radius:8px; border:none; background:transparent; color:#94a3b8; font-weight:700; cursor:pointer; font-size:12px;">🔒 Criar Conta</button>
            <button id="tabLogin" class="auth-tab" style="flex:1; padding:8px; border-radius:8px; border:none; background:transparent; color:#94a3b8; font-weight:700; cursor:pointer; font-size:12px;">🔑 Entrar</button>
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
                  ${user.hasPassword ? '🔒 Conta Protegida por Senha' : '👤 Nome Público de Jogador'}
                </div>
              </div>
            </div>

            <!-- PRESETS DE AVATAR RÁPIDO -->
            <div style="margin-bottom: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px;">
              <div style="font-size: 11px; color: #cbd5e1; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                🎨 Escolher Avatar do Jogo ou Enviar Foto:
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

            <!-- ESTATÍSTICAS E STATUS DO PABLO MARÇAL -->
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,223,0,0.2); border-radius: 12px; padding: 12px; margin-bottom: 14px;">
              <div style="font-size: 12px; font-weight: 700; color: var(--amarelo-brasil, #ffd700); margin-bottom: 8px;">
                📊 Estatísticas & Desbloqueios da Conta:
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                <div>🥩 Picanhas: <b style="color: #fff;">${totalPicanhas}</b></div>
                <div>💰 Moedas 3D: <b style="color: #fff;">${runnerCoins}</b></div>
                <div>🐦 Flappy Recorde: <b style="color: var(--verde-neon);">${flappyBest} pts</b></div>
                <div>🏃 Runner Recorde: <b style="color: var(--verde-neon);">${runnerBest} km</b></div>
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span>🥔 Recorde c/ Dilma: <b>${dilmaBest} pts</b></span>
                <span style="font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 6px; ${isMarcalUnlocked ? 'background: rgba(14,165,233,0.2); color: #38bdf8; border: 1px solid #0284c7;' : 'background: rgba(239,68,68,0.2); color: #fca5a5; border: 1px solid #ef4444;'}">
                  ${isMarcalUnlocked ? '✨ Marçal Desbloqueado' : '🔒 Marçal (200 pts Dilma)'}
                </span>
              </div>
            </div>

            <button id="btnProfileSyncNow" class="btn-primary" style="width: 100%; padding: 10px; font-size: 14px; letter-spacing: 0.5px; margin-bottom: 8px;">
              🔄 SINCRONIZAR DADOS COM A NUVEM
            </button>
          </div>

          <!-- PAINEL: SINCRONIZAR NUVEM -->
          <div id="panelSync" class="auth-form-panel" style="display: none;">
            <div style="text-align: center; padding: 10px 0 16px;">
              <div style="font-size: 38px; margin-bottom: 8px;">☁️</div>
              <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px;">Sincronização Multi-Dispositivos</div>
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.4;">
                Se você desbloqueou o Pablo Marçal, acumulou picanhas ou bateu recordes no celular ou no PC, clique abaixo para fundir e salvar tudo na nuvem!
              </p>
            </div>
            <button id="btnExplicitSyncAction" class="btn-primary" style="width: 100%; padding: 12px; font-size: 15px; letter-spacing: 0.5px; margin-bottom: 10px;">
              🔄 SINCRONIZAR AGORA 🚀
            </button>
            <div id="syncReportDetails" style="font-size: 11px; color: #cbd5e1; background: rgba(0,0,0,0.4); border-radius: 8px; padding: 8px; display: none;"></div>
          </div>
        ` : ''}

        <!-- FORM: JOGAR SEM SENHA -->
        <div id="formChosenName" class="auth-form-panel" style="${isUserLoggedIn ? 'display:none;' : ''}">
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Seu Nome no Placar:</label>
            <input type="text" id="inputChosenName" maxlength="25" value="${escapeHTML(currentName)}" placeholder="Ex: Lula_Gamer_BR" style="
              width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <button id="btnSubmitChosenName" class="btn-primary" style="width: 100%; padding: 12px; font-size: 14px;">SALVAR E JOGAR 🚀</button>
        </div>

        <!-- FORM: CRIAR CONTA COM SENHA -->
        <div id="formRegister" class="auth-form-panel" style="display: none;">
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Nome de Jogador:</label>
            <input type="text" id="inputRegUser" maxlength="25" value="${escapeHTML(currentName)}" placeholder="Ex: Empresario_Ouro" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Palavra-Chave / Senha:</label>
            <input type="password" id="inputRegPass" maxlength="40" placeholder="Digite uma senha simples" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <button id="btnSubmitRegister" class="btn-secondary" style="width: 100%; padding: 12px; font-size: 14px; background: linear-gradient(135deg, #ffd700, #f59e0b); color: #000; border: none;">CRIAR CONTA PROTEGIDA 🔒</button>
        </div>

        <!-- FORM: ENTRAR -->
        <div id="formLogin" class="auth-form-panel" style="display: none;">
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Nome de Jogador:</label>
            <input type="text" id="inputLoginUser" maxlength="25" value="${escapeHTML(currentName)}" placeholder="Seu nome cadastrado" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; color: #cbd5e1; display: block; margin-bottom: 4px;">Palavra-Chave / Senha:</label>
            <input type="password" id="inputLoginPass" maxlength="40" placeholder="Sua senha" style="
              width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
              background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box;
            ">
          </div>
          <button id="btnSubmitLogin" class="btn-primary" style="width: 100%; padding: 12px; font-size: 14px; background: linear-gradient(135deg, #38bdf8, #2563eb); border: none;">ENTRAR NA CONTA 🔑</button>
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
              <img class="mobile-user-avatar-img" src="${userAvatar}" onerror="this.src='${DEFAULT_AVATAR_SVG}'" alt="Avatar">
              <div class="mobile-user-info">
                <div class="mobile-user-name">${safeUsername}</div>
                <div class="mobile-user-stats">🥩 <b>${totalPicanhas}</b> Picanhas · 💰 <b>${runnerCoins}</b> Moedas</div>
              </div>
            </div>
            <div class="mobile-user-buttons">
              <button id="btnMobileEditProfile" class="btn-user-action btn-user-change">👤 Ver Perfil & Foto</button>
              <button id="btnMobileLogoutAcc" class="btn-user-action btn-user-logout">🚪 Sair</button>
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
              🔑 ENTRAR / ESCOLHER NICK
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
          <img src="${userAvatar}" onerror="this.src='${DEFAULT_AVATAR_SVG}'" alt="Avatar" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1px solid var(--amarelo-brasil); background: #1e293b;">
          <span style="font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap;">
            ${safeUsername} <b style="color: var(--verde-neon); margin-left: 2px;">(${totalPicanhas} 🥩)</b>
          </span>
        </div>
        <button id="btnLogoutProfile" title="Trocar ou Sair da Conta" style="
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25);
          color: #fff; border-radius: 8px; padding: 6px 10px; font-size: 11px; cursor: pointer; font-weight:700; transition:all 0.2s; white-space:nowrap;
        ">Sair</button>
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
        ">🔑 Entrar / Mudar Nome</button>
      `;
      document.getElementById('btnLoginProfile').onclick = (e) => {
        e.stopPropagation();
        this.mountAuthModal(() => this.renderProfileBadge(containerSelector));
      };
    }
  }
}

export const auth = new AuthManager();
