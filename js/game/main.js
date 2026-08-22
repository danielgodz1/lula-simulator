// js/game/main.js — Loop Principal, Controle de Estados, Aceleração Calibrada e Sincronização
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { GameScene } from './scene.js';
import { gameAudio } from './audio.js';
import { Character } from './character.js';
import { Environment } from './environment.js';
import { ObstacleManager } from './obstacles.js';
import { UIManager } from './ui.js';
import { savePlayerScore } from '../firebase-config.js';
import { auth } from '../auth.js';

export class Game {
  constructor() {
    this.sceneManager = new GameScene('canvasContainer');
    this.character = new Character(this.sceneManager.scene);
    this.environment = new Environment(this.sceneManager.scene);
    this.obstacleManager = new ObstacleManager(this.sceneManager.scene);
    this.ui = new UIManager();

    // Estados do Jogo
    this.STATE = { WAITING: 0, PLAYING: 1, GAMEOVER: 2 };
    this.state = this.STATE.WAITING;

    // Velocidade e Pontuação Calibrada
    this.baseSpeed = 32; // Início suave e acessível
    this.speed = this.baseSpeed;
    this.maxSpeed = 68; // Velocidade máxima emocionante e controlável
    this.distance = 0; // Metros
    this.coins = 0;
    this.picanhas = 0;
    this.bestDistance = parseInt(localStorage.getItem('run_best') || '0', 10);

    // Power-ups
    this.magnetActive = false;
    this.magnetTimer = 0;
    this.superJumpActive = false;
    this.superJumpTimer = 0;

    this.clock = new THREE.Clock();
    this.init();
  }

  init() {
    this.ui.showStartScreen(() => this.start());

    // Spawn de entidades nos blocos iniciais à frente
    for (let i = 2; i < this.environment.segments.length; i++) {
      const seg = this.environment.segments[i];
      this.obstacleManager.spawnSegmentEntities(seg, seg.position.z);
    }

    this.updateHUD();
    this.loop();
  }

  start() {
    gameAudio.init();
    gameAudio.startAmbience();
    this.state = this.STATE.PLAYING;
    this.speed = this.baseSpeed;
    this.distance = 0;
    this.coins = 0;
    this.picanhas = 0;
    this.character.reset();
  }

  restart() {
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

    // Salva pontuação na conta e no ranking
    auth.updateUserScore('runner', distanceKm);
    savePlayerScore('runner', distanceKm);

    // Exibe tela de Game Over com frases engraçadas
    setTimeout(() => {
      this.ui.showGameOver(obstacle, distanceKm, this.coins, this.picanhas, () => this.restart());
    }, 600);
  }

  onCollectCoin(value) {
    this.coins += value;
    this.updateHUD();
  }

  onCollectPicanha(value) {
    this.picanhas++;
    this.coins += value;
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

    this.ui.updateHUD(distanceKm, this.bestDistance, speedRatio, this.coins, this.picanhas, powerupText);
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.state === this.STATE.PLAYING) {
      // 1. Aceleração Gradual e Fluida com a Distância
      this.distance += this.speed * dt;
      if (this.speed < this.maxSpeed) {
        this.speed += 0.35 * dt;
      }

      // 2. Timers de Power-up
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

      // 3. Atualização do Personagem
      this.character.update(dt, this.speed);

      // 4. Reciclagem Contínua dos Segmentos de Pista (Object Pooling)
      this.environment.update(this.character.z, (seg, newZ) => {
        this.obstacleManager.spawnSegmentEntities(seg, newZ);
      });

      // 5. Atualização de Obstáculos e Detecção AABB
      this.obstacleManager.update(
        dt,
        this.character,
        (obs) => this.onCrash(obs),
        (val) => this.onCollectCoin(val),
        (val) => this.onCollectPicanha(val),
        (type) => this.onCollectPowerup(type)
      );

      this.updateHUD();
    } else if (this.state === this.STATE.GAMEOVER) {
      this.character.update(dt, 0);
    }

    // 6. Atualização da Câmera em 3ª Pessoa e Renderização
    this.sceneManager.updateCamera(
      this.character.x,
      this.character.y,
      this.state === this.STATE.GAMEOVER,
      dt
    );
    this.sceneManager.render();
  }
}

export function initGame() {
  window.currentGameInstance = new Game();
}
