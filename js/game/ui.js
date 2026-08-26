// js/game/ui.js — Gerenciador de HUD, Viewport 3D Interativo de Personagens, Áudio e Game Over
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { gameAudio } from './audio.js';
import { RUNNER_CHARACTERS, RunnerInventory } from './characters.js';
import { modelLoader } from './model-loader.js';
import { AdsManager } from '../ads-manager.js';
import { getTopScores } from '../firebase-config.js';
import { auth } from '../auth.js';
import { escapeHTML } from '../security.js';

export class UIManager {
  constructor() {
    this.distDisplay = document.getElementById('distDisplay');
    this.bestDisplay = document.getElementById('bestDisplay');
    this.speedDisplay = document.getElementById('speedDisplay');
    this.coinsDisplay = document.getElementById('coinsDisplay');
    this.multiplierBadge = document.getElementById('multiplierBadge');
    this.clockDisplay = document.getElementById('clockDisplay');
    this.magnetSkillBadge = document.getElementById('magnetSkillBadge');
    this.jumpSkillBadge = document.getElementById('jumpSkillBadge');
    this.magnetSkillTimer = document.getElementById('magnetSkillTimer');
    this.jumpSkillTimer = document.getElementById('jumpSkillTimer');

    this.floatingScoreLayer = document.getElementById('floatingScoreLayer');
    this.stumbleAlertBanner = document.getElementById('stumbleAlertBanner');
    this.stumbleAlertTimer = null;
    this.btnSoundToggle = document.getElementById('btnSoundToggle');

    this.startOverlay = document.getElementById('startOverlay');
    this.gameOverModal = document.getElementById('gameOverModal');
    this.goTitle = document.getElementById('goTitle');
    this.goMessage = document.getElementById('goMessage');
    this.goCurrentScoreVal = document.getElementById('goCurrentScoreVal');
    this.goHighScoreVal = document.getElementById('goHighScoreVal');
    this.goCoinsEarned = document.getElementById('goCoinsEarned');
    this.goPicanhasEarned = document.getElementById('goPicanhasEarned');
    this.goEquippedCharImg = document.getElementById('goEquippedCharImg');
    this.goEquippedCharName = document.getElementById('goEquippedCharName');
    this.goLeaderboardList = document.getElementById('goLeaderboardList');
    this.goYouName = document.getElementById('goYouName');
    this.goYouScore = document.getElementById('goYouScore');
    this.btnRestart = document.getElementById('btnRestart');
    this.btnShareScore = document.getElementById('btnShareScore');
    this.btnRewardPicanhasGO = document.getElementById('btnRewardPicanhasGO');
    this.btnOpenCharSelectGO = document.getElementById('btnOpenCharSelectGO');

    // Modal de Seleção de Personagens
    this.charSelectModal = document.getElementById('charSelectModal');
    this.btnCloseCharSelect = document.getElementById('btnCloseCharSelect');
    this.characterCardsContainer = document.getElementById('characterCardsContainer');
    this.charModalCoinBalance = document.getElementById('charModalCoinBalance');
    this.previewCanvas = document.getElementById('charPreview3DCanvas');
    this.previewCharName = document.getElementById('previewCharName');
    this.previewCharDesc = document.getElementById('previewCharDesc');
    this.btnPlayWithSelectedChar = document.getElementById('btnPlayWithSelectedChar');

    // Viewport 3D do Preview
    this.previewRenderer = null;
    this.previewScene = null;
    this.previewCamera = null;
    this.previewModelGroup = null;
    this.previewCharId = RunnerInventory.getSelectedCharacter().id;
    this.previewAnimId = null;
    this.isDraggingPreview = false;
    this.prevMouseX = 0;

    this.onCharacterChanged = null;
    this.onStartGameRequest = null;

    this.setupSoundButton();
    this.setupCharacterSelect();
  }

  setupSoundButton() {
    if (this.btnSoundToggle) {
      const updateSoundUI = () => {
        const info = gameAudio.getModeInfo();
        this.btnSoundToggle.textContent = info.icon;
        this.btnSoundToggle.title = info.label;
      };
      updateSoundUI();

      this.btnSoundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        gameAudio.init();
        const info = gameAudio.cycleAudioMode();
        updateSoundUI();
      });
    }
  }

  setupCharacterSelect() {
    const openBtns = [
      document.getElementById('btnOpenCharSelect'),
      document.getElementById('btnOpenCharSelectStart'),
      document.getElementById('btnOpenCharSelectGO')
    ];

    openBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openCharacterModal();
        });
      }
    });

    if (this.btnCloseCharSelect) {
      this.btnCloseCharSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeCharacterModal();
      });
    }

    // Botão Direto: Jogar com o Personagem Selecionado no 3D Preview
    if (this.btnPlayWithSelectedChar) {
      this.btnPlayWithSelectedChar.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = this.previewCharId || 'empresario';
        const charData = RUNNER_CHARACTERS.find(c => c.id === targetId);

        if (!RunnerInventory.isUnlocked(targetId)) {
          const res = RunnerInventory.unlockCharacter(targetId);
          if (res.success) {
            RunnerInventory.setSelectedCharacter(targetId);
            if (typeof this.onCharacterChanged === 'function') {
              this.onCharacterChanged(targetId);
            }
            gameAudio.playPicanhaCollect();
            this.closeCharacterModal();
            this.hideStartScreen();
            if (typeof this.onStartGameRequest === 'function') {
              this.onStartGameRequest();
            }
          } else {
            alert(`⚠️ ${res.message}`);
          }
        } else {
          RunnerInventory.setSelectedCharacter(targetId);
          if (typeof this.onCharacterChanged === 'function') {
            this.onCharacterChanged(targetId);
          }
          gameAudio.playPowerup();
          this.closeCharacterModal();
          this.hideStartScreen();
          if (typeof this.onStartGameRequest === 'function') {
            this.onStartGameRequest();
          }
        }
      });
    }
  }

  init3DPreview() {
    if (!this.previewCanvas) return;
    if (this.previewRenderer) {
      this.resize3DPreview();
      return;
    }

    const width = this.previewCanvas.clientWidth || 420;
    const height = this.previewCanvas.clientHeight || 310;

    this.previewRenderer = new THREE.WebGLRenderer({
      canvas: this.previewCanvas,
      alpha: true,
      antialias: true
    });
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.previewRenderer.setSize(width, height, false);
    this.previewRenderer.shadowMap.enabled = true;
    this.previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.previewScene = new THREE.Scene();

    this.previewCamera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    this.previewCamera.position.set(0, 1.05, 2.75);
    this.previewCamera.lookAt(0, 0.95, 0);

    // Iluminação de Estúdio 3D
    const amb = new THREE.AmbientLight(0xffffff, 1.3);
    const dir = new THREE.DirectionalLight(0xffffff, 1.9);
    dir.position.set(2, 4, 3);
    dir.castShadow = true;

    const rim = new THREE.DirectionalLight(0x38bdf8, 1.3);
    rim.position.set(-2, 2, -2);

    const fill = new THREE.PointLight(0xfacc15, 1.1, 8);
    fill.position.set(0, -0.5, 2);

    this.previewScene.add(amb, dir, rim, fill);

    this.previewModelGroup = new THREE.Group();
    this.previewScene.add(this.previewModelGroup);

    // Controles de Arraste / Rotação 360 no Preview
    const onPointerDown = (clientX) => {
      this.isDraggingPreview = true;
      this.prevMouseX = clientX;
    };

    const onPointerMove = (clientX) => {
      if (this.isDraggingPreview && this.previewModelGroup) {
        const delta = clientX - this.prevMouseX;
        this.previewModelGroup.rotation.y += delta * 0.015;
        this.prevMouseX = clientX;
      }
    };

    const onPointerUp = () => {
      this.isDraggingPreview = false;
    };

    this.previewCanvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX));
    window.addEventListener('mouseup', onPointerUp);

    this.previewCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) onPointerDown(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) onPointerMove(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  }

  resize3DPreview() {
    if (!this.previewRenderer || !this.previewCanvas) return;
    const width = this.previewCanvas.clientWidth || 420;
    const height = this.previewCanvas.clientHeight || 310;
    this.previewRenderer.setSize(width, height, false);
    if (this.previewCamera) {
      this.previewCamera.aspect = width / height;
      this.previewCamera.updateProjectionMatrix();
    }
  }

  update3DPreview(charId) {
    this.previewCharId = charId;
    if (!this.previewScene || !this.previewModelGroup) return;

    // Limpa o grupo anterior
    while (this.previewModelGroup.children.length > 0) {
      this.previewModelGroup.remove(this.previewModelGroup.children[0]);
    }

    const charData = RUNNER_CHARACTERS.find(c => c.id === charId) || RUNNER_CHARACTERS[0];

    // Carrega o Modelo 3D GLB correspondente
    const glbModel = modelLoader.getModel(charId);

    if (glbModel) {
      const box = new THREE.Box3().setFromObject(glbModel);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const targetHeight = 2.10;
      const scale = targetHeight / Math.max(0.001, size.y);
      glbModel.scale.set(scale, scale, scale);
      glbModel.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      // No preview o personagem fica de frente para o jogador ver o rosto e detalhes
      glbModel.rotation.y = 0;
      this.previewModelGroup.add(glbModel);
    } else {
      // PREVIEW PROCEDURAL SE O GLB AINDA ESTIVER SENDO BAIXADO
      const procGroup = this.createProceduralPreviewModel(charId);
      this.previewModelGroup.add(procGroup);

      // Dispara download e auto-atualização no canvas
      modelLoader.loadModel(charId);
      modelLoader.onModelLoaded(charId, () => {
        if (this.previewCharId === charId) {
          this.update3DPreview(charId);
        }
      });
    }

    // Pedestal de Luz Circular Sob os Pés
    const ringGeo = new THREE.TorusGeometry(0.85, 0.028, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: charData.themeColor || 0xfacc15, wireframe: false });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    this.previewModelGroup.add(ring);

    // Atualiza Informações de Texto
    if (this.previewCharName) {
      this.previewCharName.textContent = charData.name;
      this.previewCharName.style.color = charData.themeColor || '#facc15';
    }
    if (this.previewCharDesc) {
      this.previewCharDesc.textContent = charData.desc;
    }

    // Atualiza Botão de Ação CTA
    if (this.btnPlayWithSelectedChar) {
      const isUnlocked = RunnerInventory.isUnlocked(charId);
      const isEquipped = RunnerInventory.getSelectedCharacter().id === charId;

      if (isEquipped) {
        this.btnPlayWithSelectedChar.textContent = `🚀 JOGAR COM ${charData.name.toUpperCase()} (EQUIPADO)`;
        this.btnPlayWithSelectedChar.style.background = '#16a34a';
        this.btnPlayWithSelectedChar.style.borderColor = '#22c55e';
      } else if (isUnlocked) {
        this.btnPlayWithSelectedChar.textContent = `🚀 JOGAR COM ${charData.name.toUpperCase()}`;
        this.btnPlayWithSelectedChar.style.background = '#0284c7';
        this.btnPlayWithSelectedChar.style.borderColor = '#38bdf8';
      } else {
        this.btnPlayWithSelectedChar.textContent = `🔒 DESBLOQUEAR ${charData.name.toUpperCase()} (${charData.cost} MOEDAS)`;
        this.btnPlayWithSelectedChar.style.background = '#ca8a04';
        this.btnPlayWithSelectedChar.style.borderColor = '#eab308';
      }
    }
  }

  createProceduralPreviewModel(charId) {
    const group = new THREE.Group();

    let suitColor = 0x1e293b;
    let tieColor = 0xef4444;
    let sashColor1 = 0x009c3b;
    let sashColor2 = 0xffdf00;
    let hairColor = 0x0f172a;
    let hasBeard = false;
    let hasSash = false;
    let hasGlasses = false;

    if (charId === 'lula') {
      suitColor = 0x1e3a8a;
      hairColor = 0xcbd5e1;
      hasBeard = true;
      hasSash = true;
    } else if (charId === 'bolsonaro') {
      suitColor = 0x111827;
      tieColor = 0xeab308;
      hairColor = 0x334155;
      hasSash = true;
    } else {
      suitColor = 0x1e293b;
      tieColor = 0xef4444;
      hasGlasses = true;
    }

    const suitMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.5 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const tieMat = new THREE.MeshStandardMaterial({ color: tieColor, roughness: 0.3 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });

    // Tronco
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.90, 0.44), suitMat);
    torso.position.y = 1.25;
    group.add(torso);

    // Camisa
    const shirt = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.50), shirtMat);
    shirt.position.set(0, 1.35, 0.23);
    group.add(shirt);

    // Gravata
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.04), tieMat);
    tie.position.set(0, 1.28, 0.24);
    group.add(tie);

    // Faixa Presidencial
    if (hasSash) {
      const sashMat1 = new THREE.MeshStandardMaterial({ color: sashColor1 });
      const sashMat2 = new THREE.MeshStandardMaterial({ color: sashColor2 });
      const sash1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.80, 0.48), sashMat1);
      sash1.position.set(-0.04, 1.28, 0);
      sash1.rotation.z = 0.35;
      const sash2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.80, 0.49), sashMat2);
      sash2.position.set(-0.04, 1.28, 0);
      sash2.rotation.z = 0.35;
      group.add(sash1, sash2);
    }

    // Cabeça
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.50, 0.46), skinMat);
    head.position.y = 1.95;
    group.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.50), hairMat);
    hair.position.set(0, 2.15, 0);
    group.add(hair);

    if (hasBeard) {
      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.24, 0.28), hairMat);
      beard.position.set(0, 1.82, 0.14);
      group.add(beard);
    }

    if (hasGlasses) {
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.1, metalness: 0.9 });
      const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.08), glassMat);
      glasses.position.set(0, 1.96, 0.24);
      group.add(glasses);
    }

    // Braços
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.70, 0.22), suitMat);
    lArm.position.set(-0.48, 1.28, 0);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.70, 0.22), suitMat);
    rArm.position.set(0.48, 1.28, 0);
    group.add(lArm, rArm);

    // Pernas
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.26), suitMat);
    lLeg.position.set(-0.20, 0.50, 0);
    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.42), shoeMat);
    lShoe.position.set(-0.20, 0.11, 0.06);

    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.26), suitMat);
    rLeg.position.set(0.20, 0.50, 0);
    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.42), shoeMat);
    rShoe.position.set(0.20, 0.11, 0.06);

    group.add(lLeg, lShoe, rLeg, rShoe);
    return group;
  }

  start3DPreviewLoop() {
    this.stop3DPreviewLoop();

    const animatePreview = () => {
      this.previewAnimId = requestAnimationFrame(animatePreview);

      if (this.previewModelGroup && !this.isDraggingPreview) {
        this.previewModelGroup.rotation.y += 0.014;
      }

      if (this.previewRenderer && this.previewScene && this.previewCamera) {
        this.previewRenderer.render(this.previewScene, this.previewCamera);
      }
    };

    animatePreview();
  }

  stop3DPreviewLoop() {
    if (this.previewAnimId) {
      cancelAnimationFrame(this.previewAnimId);
      this.previewAnimId = null;
    }
  }

  openCharacterModal() {
    gameAudio.stopAllVoiceAudios();
    if (!this.charSelectModal) return;
    this.previewCharId = RunnerInventory.getSelectedCharacter().id;
    this.renderCharacterCards();
    this.charSelectModal.style.display = 'flex';
    this.charSelectModal.style.zIndex = '1300';

    setTimeout(() => {
      this.init3DPreview();
      this.update3DPreview(this.previewCharId);
      this.start3DPreviewLoop();
    }, 50);
  }

  closeCharacterModal() {
    gameAudio.stopAllVoiceAudios();
    this.stop3DPreviewLoop();
    if (!this.charSelectModal) return;
    this.charSelectModal.style.display = 'none';
  }

  renderCharacterCards() {
    if (!this.characterCardsContainer) return;
    const isEn = typeof window !== 'undefined' && (window.location.pathname.startsWith('/en/') || window.location.hostname.includes('flappylula.com'));
    const totalCoins = RunnerInventory.getTotalCoins();
    if (this.charModalCoinBalance) {
      this.charModalCoinBalance.textContent = `💰 ${totalCoins} ${isEn ? 'COINS' : 'MOEDAS'}`;
    }

    const selectedChar = RunnerInventory.getSelectedCharacter();
    this.characterCardsContainer.innerHTML = '';

    RUNNER_CHARACTERS.forEach(char => {
      const isUnlocked = RunnerInventory.isUnlocked(char.id);
      const isEquipped = selectedChar.id === char.id;
      const isCurrentlyPreviewed = this.previewCharId === char.id;
      const charDisplayName = isEn && char.name_en ? char.name_en : char.name;
      const charDisplayDesc = isEn && char.desc_en ? char.desc_en : char.desc;

      const card = document.createElement('div');
      card.className = 'character-card-runner';
      card.style.cssText = `
        background: ${isCurrentlyPreviewed ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)'};
        border: 2px solid ${isCurrentlyPreviewed ? 'var(--amarelo-brasil)' : isEquipped ? '#22c55e' : isUnlocked ? '#38bdf8' : '#475569'};
        border-radius: 14px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
        cursor: pointer;
        transition: transform 0.15s ease, border-color 0.15s ease;
        box-shadow: ${isCurrentlyPreviewed ? '0 0 20px rgba(255, 223, 0, 0.35)' : 'none'};
      `;

      card.innerHTML = `
        <div style="width:58px; height:58px; border-radius:50%; background:rgba(0,0,0,0.4); border:2px solid ${char.themeColor || '#eab308'}; display:flex; align-items:center; justify-content:center; margin-bottom:6px; overflow:hidden;">
          <img src="${char.sprite || '/img/favela.png'}" alt="${charDisplayName}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div style="font-family:'Bangers',cursive; font-size:17px; color:${char.themeColor || '#fef08a'}; margin-bottom:2px;">
          ${charDisplayName}
        </div>
        <div style="font-size:10px; color:#94a3b8; margin-bottom:6px; min-height:24px; line-height:1.2;">
          ${charDisplayDesc}
        </div>
        <div style="margin-top:auto; width:100%;">
          ${isEquipped ? `
            <button class="btn-primary" style="width:100%; padding:6px 0; font-size:12px; background:#16a34a; border-color:#22c55e; cursor:default;">
              ✓ ${isEn ? 'EQUIPPED' : 'EQUIPADO'}
            </button>
          ` : isUnlocked ? `
            <button class="btn-primary btn-equip-char" data-id="${char.id}" style="width:100%; padding:6px 0; font-size:12px; background:#0284c7; border-color:#38bdf8; cursor:pointer;">
              ${isEn ? 'VIEW 3D / EQUIP' : 'VER 3D / EQUIPAR'}
            </button>
          ` : `
            <button class="btn-primary btn-unlock-char" data-id="${char.id}" style="width:100%; padding:6px 0; font-size:11px; background:#ca8a04; border-color:#eab308; cursor:pointer;">
              🔒 ${char.cost} 💰
            </button>
          `}
        </div>
      `;

      // Clicar no card seleciona no preview 3D
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        this.update3DPreview(char.id);
        this.renderCharacterCards();
      });

      const equipBtn = card.querySelector('.btn-equip-char');
      if (equipBtn) {
        equipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          RunnerInventory.setSelectedCharacter(char.id);
          if (typeof this.onCharacterChanged === 'function') {
            this.onCharacterChanged(char.id);
          }
          this.update3DPreview(char.id);
          gameAudio.playPowerup();
          this.renderCharacterCards();
        });
      }

      const unlockBtn = card.querySelector('.btn-unlock-char');
      if (unlockBtn) {
        unlockBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const res = RunnerInventory.unlockCharacter(char.id);
          if (res.success) {
            RunnerInventory.setSelectedCharacter(char.id);
            if (typeof this.onCharacterChanged === 'function') {
              this.onCharacterChanged(char.id);
            }
            this.update3DPreview(char.id);
            gameAudio.playPicanhaCollect();
            alert(`🎉 Parabéns! ${res.message}`);
          } else {
            alert(`⚠️ ${res.message}`);
          }
          this.renderCharacterCards();
        });
      }

      this.characterCardsContainer.appendChild(card);
    });
  }

  updateHUD(distanceMeters, bestDistanceMeters, speedRatio, coins, picanhas, powerups = {}, timeOfDayStr = '', totalCoins = 0) {
    const distStr = `${Math.floor(distanceMeters).toLocaleString()} m`;
    if (this.distDisplay && this._cachedDist !== distStr) {
      this.distDisplay.textContent = distStr;
      this._cachedDist = distStr;
    }

    const bestStr = `${Math.floor(bestDistanceMeters).toLocaleString()} m`;
    if (this.bestDisplay && this._cachedBest !== bestStr) {
      this.bestDisplay.textContent = bestStr;
      this._cachedBest = bestStr;
    }

    const speedStr = `${speedRatio.toFixed(1)}x`;
    if (this.speedDisplay && this._cachedSpeed !== speedStr) {
      this.speedDisplay.textContent = speedStr;
      this._cachedSpeed = speedStr;
    }

    const coinVal = `${(totalCoins || coins).toLocaleString()}`;
    if (this.coinsDisplay && this._cachedCoins !== coinVal) {
      this.coinsDisplay.textContent = coinVal;
      this._cachedCoins = coinVal;
    }

    if (this.clockDisplay && timeOfDayStr) {
      if (this._cachedClock !== timeOfDayStr) {
        this.clockDisplay.textContent = timeOfDayStr;
        this._cachedClock = timeOfDayStr;
      }
    }

    // Atualização dos Badges de Habilidades com Cronômetro em Segundos Regressivo
    if (this.magnetSkillBadge) {
      if (powerups.magnetTimer > 0) {
        this.magnetSkillBadge.style.display = 'flex';
        if (this.magnetSkillTimer) {
          this.magnetSkillTimer.textContent = `${powerups.magnetTimer.toFixed(1)}s`;
        }
      } else {
        this.magnetSkillBadge.style.display = 'none';
      }
    }

    if (this.jumpSkillBadge) {
      if (powerups.superJumpTimer > 0) {
        this.jumpSkillBadge.style.display = 'flex';
        if (this.jumpSkillTimer) {
          this.jumpSkillTimer.textContent = `${powerups.superJumpTimer.toFixed(1)}s`;
        }
      } else {
        this.jumpSkillBadge.style.display = 'none';
      }
    }
  }

  showFloatingPoints(text, color = '#facc15') {
    if (!this.floatingScoreLayer) return;
    const el = document.createElement('div');
    el.className = 'floating-point-pop';
    el.textContent = text;
    el.style.color = color;
    el.style.left = `${45 + (Math.random() - 0.5) * 18}%`;
    el.style.top = `${48 + (Math.random() - 0.5) * 12}%`;
    this.floatingScoreLayer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 750);
  }

  showStumbleAlert() {
    if (!this.stumbleAlertBanner) return;
    this.stumbleAlertBanner.style.display = 'block';
    clearTimeout(this.stumbleAlertTimer);
    this.stumbleAlertTimer = setTimeout(() => {
      if (this.stumbleAlertBanner) this.stumbleAlertBanner.style.display = 'none';
    }, 2800);
  }

  showStartScreen(onStart) {
    this.onStartGameRequest = onStart;
    if (this.startOverlay) {
      this.startOverlay.style.display = 'flex';
      const startBtn = document.getElementById('btnStartGame');
      if (startBtn) {
        startBtn.onclick = (e) => {
          e.stopPropagation();
          this.startOverlay.style.display = 'none';
          onStart();
        };
      }
    }
  }

  hideStartScreen() {
    if (this.startOverlay) this.startOverlay.style.display = 'none';
  }

  // MENSAGENS HILÁRIAS E ROTATIVAS DE MORTE POR TIPO DE OBSTÁCULO
  getFunnyDeathMessage(obstacle) {
    const type = obstacle ? obstacle.type : 'general';

    const messages = {
      clt: [
        "A CLT te pegou! 8 horas diárias, escala 6x1 e sem pejotização! 📑",
        "O RH te pegou no corredor! Agora vai ter que bater ponto biométrico às 07:00! ⏰",
        "Adeus dividendos e férias ilimitadas de PJ: você foi contratado com carteira assinada! 💼",
        "Não conseguiu fugir do desconto do INSS e do FGTS retido na folha! 💸",
        "Homologado no sindicato! O pesadelo do Faria Limer virou realidade! ⚖️",
        "O fiscal do trabalho flagrou você correndo sem EPI e assinou sua carteira na hora! 👷‍♂️",
        "Contrato PJ rescindido! Agora você tem direito a vale-transporte e vale-coxinha! 🚌",
        "Tomou advertência por faltar no plantão de sábado da firma! 📋"
      ],
      bolsafamilia: [
        "Seu Bolsa Família foi aprovado, agora você não precisa mais correr atrás de investidor! 💳",
        "Caiu no pente fino do Cadastro Único da Caixa Econômica Federal! 🏛️",
        "Tentou sacar o benefício na lotérica e ficou 3 horas na fila do sol quente! ☀️",
        "O dinheiro do Bolsa Família caiu na conta e você foi direto pro churrasco de picanha! 🥩",
        "CadÚnico bloqueado por excesso de faturamento no jogo do tigrinho! 🐯",
        "Perdeu a pesagem obrigatória no posto de saúde e o benefício congelou! ⚖️"
      ],
      auxilio: [
        "Seu Auxílio Brasil foi liberado! O grande empresário virou beneficiário assistencial! 💳",
        "Tentou cadastrar o CPF no app do Caixa Tem e o servidor travou com 2 milhões na fila! 📱",
        "O benefício foi creditado com sucesso: hora de fechar a startup e descansar na rede! 🌴",
        "Auditoria do TCU detectou que você comprou criptomoeda com o dinheiro do Auxílio! 📈",
        "O Caixa Tem mandou esperar sua vez na fila virtual até o ano que vem! ⏳"
      ],
      train: [
        "O Expresso Imposto não perdoa empresário atrasado! 🚆",
        "Tentou surfar no teto do trem da Receita e levou uma autuação tributária! 🚇",
        "O Trem do IRPF passou por cima dos seus pitches de investimento! 🚈",
        "Ficou preso na catraca do metrô da Estação Sé às 18h de uma sexta-feira chuvosa! 🌧️",
        "Problema na via da Linha 9 Esmeralda encerrou sua corrida sem previsão de retorno! 🛤️",
        "Vagão lotado te arremessou pra fora na estação Brás! 🚂"
      ],
      truck: [
        "Levou uma fechada cinematográfica do caminhão de botijão de gás subindo o morro! 🚚",
        "O caminhão de frete da favela passou por cima da sua maleta de notas de 100! 💵",
        "Tentou ultrapassar o caminhão de melancia na curva fechada e rodou na pista! 🍉",
        "Ficou preso atrás do caminhão de lixo tocando funk no talo! 🚛",
        "Carga tombada na pista: a maleta empresarial voou longe! 📦"
      ],
      varal: [
        "Ficou enroscado no gato de luz clandestino da comunidade! ⚡",
        "Levou uma rasteira épica do lençol estampado do varal da Dona Neide! 🩲",
        "Tropeçou no cabo coaxial de TV a cabo pirata e caiu direto na laje! 📡",
        "O pregador de roupa voou no seu olho enquanto fugia do leão do IR! 🧺"
      ],
      general: [
        "O sistema tributário te alcançou na velocidade da luz! ⚡",
        "Você tropeçou na ladeira da favela e a maleta de dinheiro abriu no ar! 💸",
        "A burocracia brasileira foi 10x mais rápida que o seu terno importado! 👔",
        "DARF vencida sem pagar! A Receita Federal confiscou suas milhas aéreas! 🦁",
        "A mentalidade quântica falhou na hora de desviar do obstáculo de concreto! 🧠"
      ]
    };

    const list = messages[type] || messages.general;
    return list[Math.floor(Math.random() * list.length)];
  }

  showGameOver(obstacle, distanceMeters, coins, picanhas, onRestart, customReason, bestDistance = 0) {
    if (!this.gameOverModal) return;

    const funnyMsg = customReason || this.getFunnyDeathMessage(obstacle);
    if (this.goTitle) this.goTitle.textContent = customReason ? `📘 ${customReason}` : (obstacle ? obstacle.name : 'CLT 44H');
    if (this.goMessage) this.goMessage.textContent = funnyMsg;

    // Estatísticas da Partida
    if (this.goCurrentScoreVal) this.goCurrentScoreVal.textContent = `${distanceMeters.toLocaleString()} m`;
    const finalBest = Math.max(distanceMeters, bestDistance || parseInt(localStorage.getItem('run_best') || '0', 10));
    if (this.goHighScoreVal) this.goHighScoreVal.textContent = `${finalBest.toLocaleString()} m`;
    if (this.goCoinsEarned) this.goCoinsEarned.textContent = `💰 +${coins.toLocaleString()} MOEDAS`;
    if (this.goPicanhasEarned) this.goPicanhasEarned.textContent = `🥩 +${picanhas} PICANHAS`;

    // Atualiza o Personagem Equipado no Topo do Modal
    const activeChar = RunnerInventory.getSelectedCharacter();
    if (this.goEquippedCharName && activeChar) {
      this.goEquippedCharName.textContent = activeChar.name;
    }
    if (this.goEquippedCharImg && activeChar) {
      this.goEquippedCharImg.src = activeChar.img;
    }

    // Botão de Trocar Personagem no Game Over
    if (this.btnOpenCharSelectGO) {
      this.btnOpenCharSelectGO.onclick = (e) => {
        if (e) e.stopPropagation();
        this.openCharacterSelect();
      };
    }

    // Identificação do Jogador no Rodapé do Placar
    const user = auth.getCurrentUser();
    const playerName = user ? user.username : (localStorage.getItem('lula_player') || 'Visitante');
    if (this.goYouName) this.goYouName.textContent = `VOCÊ (${playerName})`;
    if (this.goYouScore) this.goYouScore.textContent = `${finalBest.toLocaleString()} m`;

    this.gameOverModal.style.display = 'flex';

    // Carrega o Placar Nacional Oficial em Tempo Real
    this.loadGameOverLeaderboard();

    // Botão de Compartilhar / Copiar Pontuação
    if (this.btnShareScore) {
      this.btnShareScore.onclick = (e) => {
        if (e) e.stopPropagation();
        const shareText = `🏃 Corri ${distanceMeters.toLocaleString()}m no modo Empresário 3D do Lula Simulator! Consegue bater meu recorde? Jogue grátis em: https://lulasimulator.com/correr.html`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareText).then(() => {
            this.showToast('✅ Recorde copiado para a área de transferência!');
          }).catch(() => {
            this.showToast('✅ Link copiado!');
          });
        }
      };
    }

    // Botão de Smartlink / Recompensa +10 Picanhas
    if (this.btnRewardPicanhasGO) {
      this.btnRewardPicanhasGO.onclick = (e) => {
        if (e) e.stopPropagation();
        AdsManager.triggerSmartlinkReward((success) => {
          if (success) {
            RunnerInventory.addPicanhas(10);
            this.showToast('🎉 +10 PICANHAS BÔNUS CREDITADAS!');
            if (this.goPicanhasEarned) this.goPicanhasEarned.textContent = `🥩 +${picanhas + 10} PICANHAS`;
          }
        });
      };
    }

    // Botão de Reinício Principal
    if (this.btnRestart) {
      this.btnRestart.onclick = (e) => {
        if (e) e.stopPropagation();
        gameAudio.stopAllVoiceAudios();
        this.gameOverModal.style.display = 'none';
        onRestart();
      };
    }

    // Reinício via Teclado (Enter ou Espaço)
    const handleKeyRestart = (e) => {
      if (this.gameOverModal.style.display === 'flex' && (e.code === 'Space' || e.code === 'Enter')) {
        document.removeEventListener('keydown', handleKeyRestart);
        gameAudio.stopAllVoiceAudios();
        this.gameOverModal.style.display = 'none';
        onRestart();
      }
    };
    document.addEventListener('keydown', handleKeyRestart, { once: true });
  }

  async loadGameOverLeaderboard() {
    if (!this.goLeaderboardList) return;

    try {
      const scores = await getTopScores('runner', 5, true);
      if (scores && scores.length > 0) {
        this.goLeaderboardList.innerHTML = '';
        scores.forEach((item, i) => {
          const row = document.createElement('div');
          row.className = 'go-lb-row';
          const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
          const safePlayer = escapeHTML(item.player || 'Anônimo');
          const safeScore = parseInt(item.score || 0, 10);
          const safeFlag = item.flag || '🇧🇷';
          const safeCountry = escapeHTML(item.countryName || 'Brasil');
          row.innerHTML = `
            <span class="go-lb-rank">${medals[i] || (i + 1)}</span>
            <span class="go-lb-name" style="display:inline-flex; align-items:center; gap:4px;">
              <span title="${safeCountry}" style="font-size:11px;">${safeFlag}</span>
              <span>${safePlayer}</span>
            </span>
            <span class="go-lb-score">${safeScore.toLocaleString()} m</span>
          `;
          this.goLeaderboardList.appendChild(row);
        });
      } else {
        this.goLeaderboardList.innerHTML = '<div style="text-align:center; padding:8px; font-size:10px; color:#94a3b8;">Nenhum recorde ainda. Seja o 1º!</div>';
      }
    } catch (e) {
      this.goLeaderboardList.innerHTML = '<div style="text-align:center; padding:8px; font-size:10px; color:#94a3b8;">Recordes sincronizados</div>';
    }
  }

  showToast(msg) {
    let toast = document.getElementById('runnerToastMsg');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'runnerToastMsg';
      toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#0f172a; border:2px solid #facc15; border-radius:30px; color:#fff; padding:10px 22px; font-family:"Bangers",cursive; font-size:16px; letter-spacing:1px; z-index:9999; box-shadow:0 10px 30px rgba(0,0,0,0.8); transition:opacity 0.3s;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
      if (toast) toast.style.opacity = '0';
    }, 2800);
  }

  hideGameOver() {
    if (this.gameOverModal) this.gameOverModal.style.display = 'none';
  }
}

