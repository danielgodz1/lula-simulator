// js/game/main.js — Loop Principal, Ciclo Dia/Noite 24h Suave, Áudio Dinâmico de Velocidade e Sincronização
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { GameScene } from './scene.js';
import { gameAudio } from './audio.js';
import { Character } from './character.js';
import { Environment } from './environment.js';
import { ObstacleManager } from './obstacles.js';
import { UIManager } from './ui.js';
import { CtpsBoss } from './boss.js';
import { savePlayerScore, startScoreSession } from '../firebase-config.js';
import { auth } from '../auth.js';
import { RunnerInventory } from './characters.js';
import { modelLoader } from './model-loader.js';
import { profiler } from './profiler.js';

export class Game {
  constructor() {
    this.sceneManager = new GameScene('canvasContainer');
    this.character = new Character(this.sceneManager.scene);
    this.boss = new CtpsBoss(this.sceneManager.scene);
    this.environment = new Environment(this.sceneManager.scene);
    this.obstacleManager = new ObstacleManager(this.sceneManager.scene);
    this.ui = new UIManager(this.sceneManager);

    profiler.attach(this.sceneManager.renderer, this.sceneManager.scene);

    // Conecta a troca de personagem em tempo real na cena
    this.ui.onCharacterChanged = (charId) => {
      this.character.setCharacter(charId);
    };

    // Conecta início de jogo via botão direto no modal de seleção de personagem
    this.ui.onStartGameRequest = () => {
      if (this.state !== this.STATE.PLAYING) {
        this.start();
      }
    };

    // Estados do Jogo
    this.STATE = { WAITING: 0, PLAYING: 1, GAMEOVER: 2 };
    this.state = this.STATE.WAITING;

    // Velocidade Calibrada (Progressão suave até 6x em 20.000m / 20km)
    this.baseSpeed = 22;
    this.speed = this.baseSpeed;
    this.maxSpeed = this.baseSpeed * 6.0; // 132 (6x max)
    this.savedSpeedOnDeath = this.baseSpeed;
    this.distance = 0;
    this.coins = 0;
    this.picanhas = 0;
    this.multiplier = 1;
    this.consecutiveCoins = 0;

    const userObj = auth.getCurrentUser();
    const localRunBest = parseInt(localStorage.getItem('run_best') || '0', 10);
    this.bestDistance = (userObj && typeof userObj.runnerScore === 'number') ? Math.max(localRunBest, userObj.runnerScore) : localRunBest;
    localStorage.setItem('run_best', this.bestDistance.toString());

    // Power-ups
    this.magnetActive = false;
    this.magnetTimer = 0;
    this.superJumpActive = false;
    this.superJumpTimer = 0;

    // Segunda Chance (Revive)
    this.reviveUsed = false;

    this.clock = new THREE.Clock();
    this.init();
  }

  init() {
    // Aplica o personagem ativo salvo no inventário
    const selectedChar = RunnerInventory.getSelectedCharacter();
    this.character.setCharacter(selectedChar.id);

    this.ui.showStartScreen(() => this.start());

    for (let i = 2; i < this.environment.segments.length; i++) {
      const seg = this.environment.segments[i];
      this.obstacleManager.spawnSegmentEntities(seg, seg.position.z);
    }

    this.updateHUD();
    this.loop();
  }

  start() {
    // SEGURANÇA: Exige nickname válido antes de entrar em STATE.PLAYING
    auth.requireValidNick(() => {
      gameAudio.init();
      gameAudio.stopAllVoiceAudios();
      gameAudio.playStartVinheta();
      gameAudio.startAmbience();
      this.state = this.STATE.PLAYING;
      startScoreSession('runner');
      this.speed = this.baseSpeed;
      this.distance = 0;
      this.coins = 0;
      this.picanhas = 0;
      this.multiplier = 1;
      this.consecutiveCoins = 0;
      this.reviveUsed = false;
      this.character.reset();
      this.boss.startRun();
    });
  }

  restart() {
    // SEGURANÇA: Exige nickname válido antes de reiniciar o jogo
    auth.requireValidNick(() => {
      gameAudio.stopAllVoiceAudios();
      this.ui.hideGameOver();
      this.environment.reset();
      this.obstacleManager.reset();
      this.boss.reset();

      for (let i = 2; i < this.environment.segments.length; i++) {
        const seg = this.environment.segments[i];
        seg.position.z = (i - 2) * 50;
        this.obstacleManager.spawnSegmentEntities(seg, seg.position.z);
      }

      this.start();
    });
  }

  onStumble(obstacle) {
    if (this.state !== this.STATE.PLAYING) return;

    // Se a Carteira de Trabalho já estiver colada atrás (segundo tropeço consecutivo) -> Morte Fatal
    if (this.boss.isAggressive && this.boss.z < 2.4) {
      this.onCrash(obstacle, 'ASSINADO E CARIMBADO NA CLT!');
      return;
    }

    this.character.triggerStumble();
    this.boss.triggerStumbleChase();
    this.sceneManager.triggerCameraShake(0.50, 0.40);
    this.speed = Math.max(this.baseSpeed * 0.85, this.speed * 0.72);
    this.ui.showStumbleAlert();
  }

  onCrash(obstacle, customReason) {
    if (this.state !== this.STATE.PLAYING) return;
    if (this.character && this.character.isInvulnerable) return;

    this.savedSpeedOnDeath = this.speed;
    this.state = this.STATE.GAMEOVER;
    this.character.die();
    this.boss.triggerKillStamp(this.character.x, this.character.y);
    this.sceneManager.triggerCameraShake(0.65, 0.50);
    gameAudio.playCrash();
    gameAudio.stopAmbience();

    // Distância final exata em metros sem divisões espúrias
    const finalDistanceMeters = Math.floor(this.distance);
    if (finalDistanceMeters > this.bestDistance) {
      this.bestDistance = finalDistanceMeters;
      localStorage.setItem('run_best', this.bestDistance.toString());
    }

    auth.updateUserScore('runner', finalDistanceMeters);
    savePlayerScore('runner', finalDistanceMeters, finalDistanceMeters);

    const punchlines = [
      'ASSINADO E CARIMBADO NA CLT!',
      'REGISTRADO COM CARGA 44H SEMANAIS!',
      'FOI PEGO PELA CARTEIRA DE TRABALHO!',
      'AUDITADO PELA RECEITA FEDERAL!',
      'O LEÃO DO IRPF NÃO PERDOOU!'
    ];
    const finalReason = customReason || punchlines[Math.floor(Math.random() * punchlines.length)];

    setTimeout(() => {
      this.ui.showGameOver(
        obstacle,
        finalDistanceMeters,
        this.coins,
        this.picanhas,
        () => this.restart(),
        finalReason,
        this.bestDistance,
        () => this.revive(),
        this.reviveUsed
      );
    }, 650);
  }

  revive() {
    if (this.reviveUsed) return;
    this.reviveUsed = true;
    this.state = this.STATE.PLAYING;
    // Restaura a velocidade rápida exata de quando morreu (sem reiniciar lento)
    this.speed = Math.max(this.baseSpeed, this.savedSpeedOnDeath || this.baseSpeed);
    this.character.revive();
    this.boss.x = 0;
    this.boss.y = 0;
    this.boss.z = 8;
    this.boss.isAggressive = false;
    if (this.ui.gameOverModal) this.ui.gameOverModal.style.display = 'none';
    gameAudio.startAmbience();
    gameAudio.playSwipe();
  }

  onCollectCoin(value) {
    this.consecutiveCoins++;
    // Multiplicador equilibrado: 2x a cada 25 moedas consecutivas (máx 2x)
    this.multiplier = this.consecutiveCoins >= 25 ? 2 : 1;

    const earned = 1 * this.multiplier;
    this.coins += earned;
    RunnerInventory.addCoins(earned);
    this.updateHUD();
  }

  onCollectPicanha() {
    this.picanhas += 1;
    RunnerInventory.addPicanhas(1);
    this.sceneManager.triggerFovPulse(54, 0.40);
    this.updateHUD();
  }

  onCollectPowerup(type) {
    this.sceneManager.triggerFovPulse(52, 0.45);
    if (type === 'magnet') {
      this.magnetActive = true;
      this.magnetTimer = 10.0;
      this.character.setMagnetVisual(true);
    } else if (type === 'superjump') {
      this.superJumpActive = true;
      this.superJumpTimer = 10.0;
      this.character.setJumpBootsVisual(true);
    }
  }

  updateHUD() {
    const distanceMeters = Math.floor(this.distance);
    const bestMeters = Math.floor(this.bestDistance);
    const speedRatio = this.speed / this.baseSpeed;

    const powerups = {
      magnetTimer: this.magnetActive ? this.magnetTimer : 0,
      superJumpTimer: this.superJumpActive ? this.superJumpTimer : 0
    };

    const timeStr = this.sceneManager.getFormattedTime ? this.sceneManager.getFormattedTime() : '12:00';
    const totalCoins = RunnerInventory.getTotalCoins();
    this.ui.updateHUD(distanceMeters, bestMeters, speedRatio, this.coins, this.picanhas, powerups, timeStr, totalCoins);
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    profiler.beginFrame();

    const dt = Math.min(this.clock.getDelta(), 0.0333);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Atualização do Ciclo Dia/Noite com base no tempo decorrido total
    const isNight = this.sceneManager.updateDayNightCycle(elapsedTime);
    const playerZ = (this.character && this.character.mesh) ? this.character.mesh.position.z : 0;
    this.environment.updateNightLights(isNight, this.sceneManager.timeOfDay, playerZ);

    if (this.state === this.STATE.PLAYING) {
      // 2. Distância e Aceleração Progressiva até 6x em 20.000m (20km)
      this.distance += (this.speed * 0.45) * dt;

      const speedProgress = Math.min(1.0, this.distance / 20000);
      const targetSpeed = this.baseSpeed * (1.0 + 5.0 * Math.pow(speedProgress, 0.85));
      this.speed = Math.min(this.maxSpeed, targetSpeed);

      // 3. Timers de Power-up
      if (this.magnetActive) {
        this.magnetTimer -= dt;
        if (this.magnetTimer <= 0) {
          this.magnetActive = false;
          this.character.setMagnetVisual(false);
        }
      }
      this.character.magnetActive = this.magnetActive;

      if (this.superJumpActive) {
        this.superJumpTimer -= dt;
        if (this.superJumpTimer <= 0) {
          this.superJumpActive = false;
          this.character.superJump = false;
        }
      }

      // 4. Atualização do Personagem
      this.character.update(dt, this.speed);

      // 5. Atualização do Boss Carteira de Trabalho Viva 3D (Subway Surfers Chaser)
      this.boss.update(dt, this.character.x, this.character.y, this.speed);

      // 6. Esteira Contínua da Favela e Reciclagem
      this.environment.update(this.speed, dt, (seg, newZ) => {
        this.obstacleManager.spawnSegmentEntities(seg, newZ);
      });

      // 7. Atualização de Obstáculos, Trens e Detecção AABB/Tropeço
      this.obstacleManager.update(
        dt,
        this.character,
        elapsedTime,
        (obs) => this.onCrash(obs),
        (val) => this.onCollectCoin(val),
        (val) => this.onCollectPicanha(val),
        (type) => this.onCollectPowerup(type),
        (obs) => this.onStumble(obs)
      );

      this.updateHUD();
    } else if (this.state === this.STATE.GAMEOVER) {
      this.character.update(dt, 0);
      this.boss.update(dt, this.character.x, this.character.y, 0);
    }

    // 7. Atualização da Câmera em 3ª Pessoa
    this.sceneManager.updateCamera(
      this.character.x,
      this.character.y,
      this.state === this.STATE.GAMEOVER,
      dt,
      elapsedTime
    );

    profiler.markUpdateEnd();

    // 8. Renderização WebGL
    this.sceneManager.render();

    profiler.markRenderEnd();
    profiler.endFrame();
  }
}

export function initGame() {
  const selectedChar = RunnerInventory.getSelectedCharacter();
  // 1. Instancia o jogo e conecta botões/HUD imediatamente (0ms de espera)
  window.currentGameInstance = new Game();

  // 2. Dispara o carregamento dos modelos 3D em segundo plano sem travar cliques
  modelLoader.preloadAll(selectedChar.id).catch(() => {});
}
