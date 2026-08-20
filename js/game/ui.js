// js/game/ui.js — Gerenciador de HUD, Controles de Áudio e Modal de Game Over com Frases Hilárias
import { gameAudio } from './audio.js';

export class UIManager {
  constructor() {
    this.distDisplay = document.getElementById('distDisplay');
    this.bestDisplay = document.getElementById('bestDisplay');
    this.speedDisplay = document.getElementById('speedDisplay');
    this.btnSoundToggle = document.getElementById('btnSoundToggle');

    this.startOverlay = document.getElementById('startOverlay');
    this.gameOverModal = document.getElementById('gameOverModal');
    this.goTitle = document.getElementById('goTitle');
    this.goMessage = document.getElementById('goMessage');
    this.goDistance = document.getElementById('goDistance');
    this.btnRestart = document.getElementById('btnRestart');

    this.setupSoundButton();
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

  updateHUD(distanceKm, bestDistanceKm, speedRatio, coins, picanhas, powerupStatus = '') {
    if (this.distDisplay) this.distDisplay.textContent = `${distanceKm} km`;
    if (this.bestDisplay) this.bestDisplay.textContent = `${bestDistanceKm} km`;
    if (this.speedDisplay) {
      this.speedDisplay.textContent = `${speedRatio.toFixed(1)}x ${powerupStatus}`;
    }
  }

  showStartScreen(onStart) {
    if (this.startOverlay) {
      this.startOverlay.style.display = 'flex';
      this.startOverlay.onclick = () => {
        this.startOverlay.style.display = 'none';
        onStart();
      };
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
      this.goDistance.textContent = `${distanceKm} KM PERCORRIDOS · R$ ${coins} LUCRO · 🥩 ${picanhas} PICANHAS`;
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
