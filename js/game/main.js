// js/game/main.js — Loop Principal, Ciclo Dia/Noite 24h Suave, Áudio Dinâmico de Velocidade e Sincronização
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { GameScene } from './scene.js';
import { gameAudio } from './audio.js';
import { Character } from './character.js';
import { Environment } from './environment.js';
import { ObstacleManager } from './obstacles.js';
import { UIManager } from './ui.js';
import { savePlayerScore, startScoreSession } from '../firebase-config.js';
import { RunnerInventory } from './characters.js';
import { modelLoader } from './model-loader.js';
import { profiler } from './profiler.js';

export class Game {
  constructor() {
    this.sceneManager = new GameScene('canvasContainer');
    this.character = new Character(this.sceneManager.scene);
    this.environment = new Environment(this.sceneManager.scene);
    this.obstacleManager = new ObstacleManager(this.sceneManager.scene);
    this.ui = new UIManager();

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

    // Velocidade Calibrada (1.0x até 10.0x)
    this.baseSpeed = 32;
    this.speed = this.baseSpeed;
    this.maxSpeed = 320; // 10.0x baseSpeed
    this.distance = 0;
    this.coins = 0;
    const userObj = auth.getCurrentUser();
    const localRunBest = parseInt(localStorage.getItem('run_best') || '0', 10);
    this.bestDistance = (userObj && typeof userObj.runnerScore === 'number') ? Math.max(localRunBest, userObj.runnerScore) : localRunBest;
    localStorage.setItem('run_best', this.bestDistance.toString());

    // Power-ups
    this.magnetActive = false;
    this.magnetTimer = 0;
    this.superJumpActive = false;
    this.superJumpTimer = 0;

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
    this.character.reset();
  }

  restart() {
    gameAudio.stopAllVoiceAudios();
    this.ui.hideGameOver();
    this.environment.reset();
    this.obstacleManager.reset();

    for (let i = 2; i < this.environment.segments.length; i++) {
      const seg = this.environment.segments[i];
      this.obstacleManager.spawnSegmentEntities(seg, seg.position.z);
    }

    this.start();
  }

  onCrash(obstacle) {
    if (this.state !== this.STATE.PLAYING) return;

    this.state = this.STATE.GAMEOVER;
    this.character.die();
    gameAudio.playCrash();
    gameAudio.stopAmbience();

    const distanceKm = Math.floor(this.distance / 10);
    if (distanceKm > this.bestDistance) {
      this.bestDistance = distanceKm;
      localStorage.setItem('run_best', this.bestDistance.toString());
    }

    auth.updateUserScore('runner', distanceKm);
    savePlayerScore('runner', distanceKm, distanceKm);

    setTimeout(() => {
      this.ui.showGameOver(obstacle, distanceKm, this.coins, this.picanhas, () => this.restart());
    }, 600);
  }

  onCollectCoin(value) {
    this.coins += value;
    RunnerInventory.addCoins(value);
    auth.updateMissionProgress('m_runner_coins', value);
    this.updateHUD();
  }

  onCollectPicanha(value) {
    this.picanhas++;
    this.coins += value;
    RunnerInventory.addCoins(value);
    auth.updateMissionProgress('m_runner_coins', value);
    this.updateHUD();
  }

  onCollectPowerup(type) {
    if (type === 'magnet') {
      this.magnetActive = true;
      this.magnetTimer = 9.0;
    } else if (type === 'superjump') {
      this.superJumpActive = true;
      this.superJumpTimer = 10.0;
      this.character.superJump = true;
    }
  }

  updateHUD() {
    const distanceKm = Math.floor(this.distance / 10);
    const speedRatio = this.speed / this.baseSpeed;

    let powerupText = '';
    if (this.magnetActive) powerupText += '🧲 ';
    if (this.superJumpActive) powerupText += '👟 ';

    const timeStr = this.sceneManager.getFormattedTime();
    const totalCoins = RunnerInventory.getTotalCoins();
    this.ui.updateHUD(distanceKm, this.bestDistance, speedRatio, this.coins, this.picanhas, powerupText, timeStr, totalCoins);
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    profiler.beginFrame();

    const dt = Math.min(this.clock.getDelta(), 0.0333);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Atualização do Ciclo Dia/Noite com base no tempo decorrido total
    const isNight = this.sceneManager.updateDayNightCycle(elapsedTime);
    this.environment.updateNightLights(isNight, this.sceneManager.timeOfDay);

    if (this.state === this.STATE.PLAYING) {
      // 2. Aceleração e Distância Progressiva e Suave
      this.distance += this.speed * dt;
      if (this.speed < this.maxSpeed) {
        // Curva de velocidade calibrada: ritmo inicial suave e aumento gradual
        const currentRatio = this.speed / this.baseSpeed;
        let accel = 0.20;
        if (currentRatio < 2.0) {
          accel = 0.14; // 1.0x a 2.0x (ritmo inicial agradável e acessível)
        } else if (currentRatio < 3.5) {
          accel = 0.20; // 2.0x a 3.5x (progressão equilibrada)
        } else if (currentRatio < 5.0) {
          accel = 0.26; // 3.5x a 5.0x (desafio intermediário que leva tempo para atingir)
        } else {
          accel = 0.32; // Acima de 5.0x (endgame de alta velocidade)
        }
        this.speed += accel * dt;
      }

      // 3. Timers de Power-up
      if (this.magnetActive) {
        this.magnetTimer -= dt;
        if (this.magnetTimer <= 0) this.magnetActive = false;
      }
      this.character.magnetActive = this.magnetActive;

      if (this.superJumpActive) {
        this.superJumpTimer -= dt;
        if (this.superJumpTimer <= 0) {
          this.superJumpActive = false;
          this.character.superJump = false;
        }
      }

      // 4. Atualização do Personagem (com AABB Y dinâmica no pulo e slide 90º)
      this.character.update(dt, this.speed);

      // 5. Esteira Contínua da Favela e Reciclagem (Object Pooling)
      this.environment.update(this.speed, dt, (seg, newZ) => {
        this.obstacleManager.spawnSegmentEntities(seg, newZ);
      });

      // 6. Atualização de Obstáculos, Efeitos Sonoros de Trem e Detecção AABB
      this.obstacleManager.update(
        dt,
        this.character,
        elapsedTime,
        (obs) => this.onCrash(obs),
        (val) => this.onCollectCoin(val),
        (val) => this.onCollectPicanha(val),
        (type) => this.onCollectPowerup(type)
      );

      this.updateHUD();
    } else if (this.state === this.STATE.GAMEOVER) {
      this.character.update(dt, 0);
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
