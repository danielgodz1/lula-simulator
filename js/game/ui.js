// js/game/ui.js — Gerenciador de HUD, Modal de Seleção de Personagens 3D, Áudio e Game Over
import { gameAudio } from './audio.js';
import { RUNNER_CHARACTERS, RunnerInventory } from './characters.js';

export class UIManager {
  constructor() {
    this.distDisplay = document.getElementById('distDisplay');
    this.bestDisplay = document.getElementById('bestDisplay');
    this.speedDisplay = document.getElementById('speedDisplay');
    this.coinsDisplay = document.getElementById('coinsDisplay');
    this.btnSoundToggle = document.getElementById('btnSoundToggle');

    this.startOverlay = document.getElementById('startOverlay');
    this.gameOverModal = document.getElementById('gameOverModal');
    this.goTitle = document.getElementById('goTitle');
    this.goMessage = document.getElementById('goMessage');
    this.goDistance = document.getElementById('goDistance');
    this.btnRestart = document.getElementById('btnRestart');

    // Modal de Seleção de Personagens
    this.charSelectModal = document.getElementById('charSelectModal');
    this.btnCloseCharSelect = document.getElementById('btnCloseCharSelect');
    this.characterCardsContainer = document.getElementById('characterCardsContainer');
    this.charModalCoinBalance = document.getElementById('charModalCoinBalance');

    this.onCharacterChanged = null;

    this.setupSoundButton();
    this.setupCharacterSelect();
  }

  setupSoundButton() {
    if (this.btnSoundToggle) {
      this.btnSoundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isMuted = gameAudio.toggleMute();
        this.btnSoundToggle.textContent = isMuted ? '🔇' : '🔊';
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
  }

  openCharacterModal() {
    if (!this.charSelectModal) return;
    this.renderCharacterCards();
    this.charSelectModal.style.display = 'flex';
    this.charSelectModal.style.zIndex = '1300';
  }

  closeCharacterModal() {
    if (!this.charSelectModal) return;
    this.charSelectModal.style.display = 'none';
  }

  renderCharacterCards() {
    if (!this.characterCardsContainer) return;
    const totalCoins = RunnerInventory.getTotalCoins();
    if (this.charModalCoinBalance) {
      this.charModalCoinBalance.textContent = `💰 ${totalCoins} MOEDAS`;
    }

    const selectedChar = RunnerInventory.getSelectedCharacter();
    this.characterCardsContainer.innerHTML = '';

    RUNNER_CHARACTERS.forEach(char => {
      const isUnlocked = RunnerInventory.isUnlocked(char.id);
      const isEquipped = selectedChar.id === char.id;

      const card = document.createElement('div');
      card.className = 'character-card-runner';
      card.style.cssText = `
        background: rgba(15, 23, 42, 0.95);
        border: 2px solid ${isEquipped ? 'var(--amarelo-brasil)' : isUnlocked ? '#38bdf8' : '#475569'};
        border-radius: 16px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
        box-shadow: ${isEquipped ? '0 0 20px rgba(255, 223, 0, 0.3)' : 'none'};
      `;

      card.innerHTML = `
        <div style="width:70px; height:70px; border-radius:50%; background:rgba(0,0,0,0.4); border:2px solid ${char.themeColor || '#eab308'}; display:flex; align-items:center; justify-content:center; margin-bottom:8px; overflow:hidden;">
          <img src="${char.sprite || 'img/favela.png'}" alt="${char.name}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div style="font-family:'Bangers',cursive; font-size:19px; color:${char.themeColor || '#fef08a'}; margin-bottom:2px;">
          ${char.name}
        </div>
        <div style="font-size:10px; color:#94a3b8; margin-bottom:8px; min-height:30px; line-height:1.3;">
          ${char.desc}
        </div>
        <div style="margin-top:auto; width:100%;">
          ${isEquipped ? `
            <button class="btn-primary" style="width:100%; padding:7px 0; font-size:14px; background:#16a34a; border-color:#22c55e; cursor:default;">
              ✓ EQUIPADO
            </button>
          ` : isUnlocked ? `
            <button class="btn-primary btn-equip-char" data-id="${char.id}" style="width:100%; padding:7px 0; font-size:14px; background:#0284c7; border-color:#38bdf8; cursor:pointer;">
              EQUIPAR
            </button>
          ` : `
            <button class="btn-primary btn-unlock-char" data-id="${char.id}" style="width:100%; padding:7px 0; font-size:13px; background:#ca8a04; border-color:#eab308; cursor:pointer;">
              🔒 DESBLOQUEAR (${char.cost} 💰)
            </button>
          `}
        </div>
      `;

      // Eventos de clique
      const equipBtn = card.querySelector('.btn-equip-char');
      if (equipBtn) {
        equipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          RunnerInventory.setSelectedCharacter(char.id);
          if (typeof this.onCharacterChanged === 'function') {
            this.onCharacterChanged(char.id);
          }
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

  updateHUD(distanceKm, bestDistanceKm, speedRatio, coins, picanhas, powerupStatus = '', timeOfDayStr = '', totalCoins = 0) {
    if (this.distDisplay) this.distDisplay.textContent = `${distanceKm} km`;
    if (this.bestDisplay) this.bestDisplay.textContent = `${bestDistanceKm} km`;
    if (this.coinsDisplay) this.coinsDisplay.textContent = `💰 ${totalCoins || coins}`;
    if (this.speedDisplay) {
      const timePrefix = timeOfDayStr ? `${timeOfDayStr} · ` : '';
      this.speedDisplay.textContent = `${timePrefix}${speedRatio.toFixed(1)}x ${powerupStatus}`;
    }
  }

  showStartScreen(onStart) {
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

  // MENSAGENS HILÁRIAS DE MORTE POR TIPO DE OBSTÁCULO
  getFunnyDeathMessage(obstacle) {
    const type = obstacle ? obstacle.type : 'general';

    const messages = {
      clt: [
        "Você não aguentou a escala 6x1 e foi de CLT!",
        "O RH te pegou no corredor! Agora vai ter que bater ponto às 7h da manhã!",
        "Adeus férias infinitas de PJ, você foi contratado com carteira assinada!",
        "Não conseguiu fugir do desconto do INSS na folha de pagamento!"
      ],
      bolsafamilia: [
        "Seu Bolsa Família foi aprovado, agora você não precisa mais correr!",
        "Caiu no pente fino do Cadastro Único da Caixa Econômica!",
        "Tentou sacar o benefício e ficou preso na fila da agência!",
        "O dinheiro do Bolsa Família caiu na conta e você parou pra comemorar!"
      ],
      auxilio: [
        "Seu Auxílio Brasil foi liberado! O empresário virou beneficiário!",
        "Tentou cadastrar o CPF no app do Caixa Tem e deu erro no servidor!",
        "O benefício foi aprovado com sucesso, hora de descansar!"
      ],
      train: [
        "O Expresso Central do Brasil não espera empresário atrasado!",
        "Tentou surfar no teto do trem da Central e o guarda te pegou!",
        "O ramal Japeri passou por cima dos seus lucros empresariais!",
        "Ficou preso na catraca do metrô sem saldo no Riocard!"
      ],
      varal: [
        "Ficou preso no gato de luz da comunidade da favela!",
        "Levou uma rasteira do lençol do varal da vizinha!",
        "Tropeçou no fio clandestino e caiu direto na laje!"
      ],
      general: [
        "O sistema te alcançou na velocidade da luz!",
        "Você tropeçou na ladeira da favela e perdeu a maleta!",
        "A burocracia brasileira foi mais rápida que o seu terno!"
      ]
    };

    const list = messages[type] || messages.general;
    return list[Math.floor(Math.random() * list.length)];
  }

  showGameOver(obstacle, distanceKm, coins, picanhas, onRestart) {
    if (!this.gameOverModal) return;

    const funnyMsg = this.getFunnyDeathMessage(obstacle);
    if (this.goTitle) this.goTitle.textContent = obstacle ? obstacle.name : 'OBSTÁCULO';
    if (this.goMessage) this.goMessage.textContent = funnyMsg;
    if (this.goDistance) {
      this.goDistance.textContent = `${distanceKm} KM PERCORRIDOS · +R$ ${coins} MOEDAS · 🥩 ${picanhas} PICANHAS`;
    }

    this.gameOverModal.style.display = 'flex';

    if (this.btnRestart) {
      this.btnRestart.onclick = () => {
        this.gameOverModal.style.display = 'none';
        onRestart();
      };
    }
  }

  hideGameOver() {
    if (this.gameOverModal) this.gameOverModal.style.display = 'none';
  }
}

