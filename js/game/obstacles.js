// js/game/obstacles.js — Spawn, Lógica de Obstáculos e Coletáveis (Subway Surfers Brasil)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LANES } from './character.js';
import { gameAudio } from './audio.js';

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.movingTrains = [];

    this.textureLoader = new THREE.TextureLoader();
    this.picanhaTexture = this.textureLoader.load('img/picanha.png');

    // Texturas Procedurais Nítidas
    this.cltTexture = this.createCLTTexture();
    this.bolsaFamiliaTexture = this.createBolsaFamiliaTexture();
    this.auxilioTexture = this.createAuxilioTexture();
  }

  // 1. TEXTURAS NÍTIDAS GERADAS EM CANVAS 2D
  createCLTTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 340;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f3a68'; // Azul Oficial da Carteira
    ctx.fillRect(0, 0, 512, 340);

    ctx.strokeStyle = '#d4af37'; // Moldura Dourada
    ctx.lineWidth = 12;
    ctx.strokeRect(16, 16, 480, 308);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REPÚBLICA FEDERATIVA DO BRASIL', 256, 60);

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('CARTEIRA DE TRABALHO', 256, 130);
    ctx.fillText('E PREVIDÊNCIA SOCIAL', 256, 175);

    ctx.fillStyle = '#ff4d4d';
    ctx.font = '900 48px Bangers, sans-serif';
    ctx.fillText('⚠️ CLT 44H SEMANAIS!', 256, 260);

    return new THREE.CanvasTexture(canvas);
  }

  createBolsaFamiliaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 320;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#facc15');
    grad.addColorStop(1, '#16a34a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    ctx.fillStyle = '#d4af37';
    ctx.fillRect(40, 100, 70, 55);
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 3;
    ctx.strokeRect(40, 100, 70, 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px Bangers, sans-serif';
    ctx.fillText('BOLSA FAMÍLIA', 140, 140);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('CAIXA ECONÔMICA FEDERAL', 140, 180);

    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 32px Bangers, sans-serif';
    ctx.fillText('SAQUE R$ 600,00', 40, 260);

    return new THREE.CanvasTexture(canvas);
  }

  createAuxilioTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 320;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 50px Bangers, sans-serif';
    ctx.fillText('AUXÍLIO BRASIL', 50, 120);

    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('GOVERNO FEDERAL 🇧🇷', 50, 180);

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 36px Bangers, sans-serif';
    ctx.fillText('BENEFÍCIO APROVADO!', 50, 260);

    return new THREE.CanvasTexture(canvas);
  }

  // 2. SPAWN DE OBSTÁCULOS E COLETÁVEIS EM CADA BLOCO
  spawnSegmentEntities(parent, segZ, segmentLength = 85) {
    const spawnPoints = [-segmentLength / 2 + 16, -segmentLength / 2 + 42, -segmentLength / 2 + 66];

    spawnPoints.forEach(localZ => {
      const worldZ = segZ + localZ;
      const lane = Math.floor(Math.random() * 3);
      const rand = Math.random();

      // 1. CLT 44H
      if (rand < 0.28) {
        this.createCLT(parent, LANES[lane], localZ, worldZ);
      }
      // 2. BOLSA FAMÍLIA OU AUXÍLIO
      else if (rand < 0.52) {
        if (Math.random() > 0.5) {
          this.createBolsaFamilia(parent, LANES[lane], localZ, worldZ);
        } else {
          this.createAuxilio(parent, LANES[lane], localZ, worldZ);
        }
      }
      // 3. TREM DE METRÔ EM MOVIMENTO COM RAMPA
      else if (rand < 0.78) {
        this.createMetroTrain(parent, LANES[lane], localZ, worldZ);
      }
      // 4. VARAL DE ROUPAS (EXIGE SLIDE)
      else {
        this.createClothesline(parent, LANES[lane], localZ, worldZ);
      }

      // Spawn de Coletáveis nas outras faixas
      const freeLane1 = (lane + 1) % 3;
      const freeLane2 = (lane + 2) % 3;

      if (Math.random() < 0.45) {
        this.spawnPicanha(parent, LANES[freeLane1], localZ, worldZ);
      } else {
        this.spawnCoinTrack(parent, LANES[freeLane1], localZ - 6, worldZ - 6);
      }

      // Power-up Raro
      if (Math.random() < 0.20) {
        this.spawnPowerup(parent, LANES[freeLane2], localZ + 8, worldZ + 8);
      }
    });
  }

  createCLT(parent, x, localZ, worldZ) {
    const group = new THREE.Group();
    group.position.set(x, 0, localZ);

    const book = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.4, 0.35), new THREE.MeshLambertMaterial({ map: this.cltTexture }));
    book.position.y = 0.95;
    book.castShadow = true;
    group.add(book);

    parent.add(group);

    this.obstacles.push({
      type: 'clt',
      name: 'Carteira de Trabalho (CLT 44h)',
      x: x,
      z: worldZ,
      width: 2.1,
      height: 1.4,
      depth: 0.6,
      canJumpOver: true,
      canSlideUnder: false,
      mesh: group
    });
  }

  createBolsaFamilia(parent, x, localZ, worldZ) {
    const group = new THREE.Group();
    group.position.set(x, 0, localZ);

    const card = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.45, 0.25), new THREE.MeshLambertMaterial({ map: this.bolsaFamiliaTexture }));
    card.position.y = 0.95;
    card.castShadow = true;
    group.add(card);

    parent.add(group);

    this.obstacles.push({
      type: 'bolsafamilia',
      name: 'Cartão Bolsa Família',
      x: x,
      z: worldZ,
      width: 2.3,
      height: 1.45,
      depth: 0.5,
      canJumpOver: true,
      canSlideUnder: false,
      mesh: group
    });
  }

  createAuxilio(parent, x, localZ, worldZ) {
    const group = new THREE.Group();
    group.position.set(x, 0, localZ);

    const card = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.45, 0.25), new THREE.MeshLambertMaterial({ map: this.auxilioTexture }));
    card.position.y = 0.95;
    card.castShadow = true;
    group.add(card);

    parent.add(group);

    this.obstacles.push({
      type: 'auxilio',
      name: 'Cartão Auxílio Brasil',
      x: x,
      z: worldZ,
      width: 2.3,
      height: 1.45,
      depth: 0.5,
      canJumpOver: true,
      canSlideUnder: false,
      mesh: group
    });
  }

  createMetroTrain(parent, x, localZ, worldZ) {
    const trainGroup = new THREE.Group();
    trainGroup.position.set(x, 0, localZ);

    const trainLength = 11;
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.9, trainLength), bodyMat);
    body.position.y = 1.5;
    body.castShadow = true;
    body.receiveShadow = true;
    trainGroup.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.3, trainLength), metalMat);
    roof.position.y = 2.95;
    trainGroup.add(roof);

    [-0.7, 0.7].forEach(fx => {
      const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.1), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      headlight.position.set(fx, 1.2, trainLength / 2 + 0.05);
      trainGroup.add(headlight);
    });

    // Rampa Traseira para subir no teto
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 3.5), new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
    ramp.position.set(0, 1.4, -trainLength / 2 - 1.4);
    ramp.rotation.x = Math.PI / 8;
    trainGroup.add(ramp);

    // Moedas no teto
    for (let rz = -3; rz <= 3; rz += 2.2) {
      const roofCoin = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16), new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0x713f12 }));
      roofCoin.rotation.x = Math.PI / 2;
      roofCoin.position.set(0, 3.4, rz);
      trainGroup.add(roofCoin);

      this.coins.push({
        type: 'coin',
        value: 10,
        x: x,
        z: worldZ + rz,
        y: 3.4,
        mesh: roofCoin,
        collected: false
      });
    }

    parent.add(trainGroup);

    const isMoving = Math.random() > 0.35;
    if (isMoving) {
      gameAudio.playTrainHorn();
    }

    const obsObj = {
      type: 'train',
      name: 'Trem do Metrô Rio',
      x: x,
      z: worldZ,
      width: 2.4,
      height: 3.0,
      depth: trainLength + 3.0,
      canJumpOver: false,
      canSlideUnder: false,
      isMoving: isMoving,
      trainSpeed: isMoving ? 18 : 0,
      mesh: trainGroup
    };

    this.obstacles.push(obsObj);
    if (isMoving) this.movingTrains.push(obsObj);
  }

  createClothesline(parent, x, localZ, worldZ) {
    const group = new THREE.Group();
    group.position.set(x, 0, localZ);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 0.15), new THREE.MeshLambertMaterial({ color: 0x78350f }));
    beam.position.y = 2.0;
    beam.castShadow = true;
    group.add(beam);

    [-1.15, 1.15].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.3, 8), new THREE.MeshLambertMaterial({ color: 0x334155 }));
      post.position.set(px, 1.15, 0);
      group.add(post);
    });

    const colors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981];
    for (let i = 0; i < 3; i++) {
      const shirt = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.7), new THREE.MeshLambertMaterial({ color: colors[i], side: THREE.DoubleSide }));
      shirt.position.set(-0.6 + i * 0.6, 1.55, 0);
      group.add(shirt);
    }

    parent.add(group);

    this.obstacles.push({
      type: 'varal',
      name: 'Varal de Roupas da Favela',
      x: x,
      z: worldZ,
      width: 2.4,
      height: 1.2,
      minY: 1.35,
      depth: 0.4,
      canSlideUnder: true,
      canJumpOver: false,
      mesh: group
    });
  }

  spawnPicanha(parent, x, localZ, worldZ) {
    const picanhaMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.7),
      new THREE.MeshBasicMaterial({ map: this.picanhaTexture, transparent: true, side: THREE.DoubleSide })
    );
    picanhaMesh.position.set(x, 1.1, localZ);
    parent.add(picanhaMesh);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.65, 16),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    halo.position.set(0, 0, -0.05);
    picanhaMesh.add(halo);

    this.coins.push({
      type: 'picanha',
      value: 50,
      x: x,
      z: worldZ,
      y: 1.1,
      mesh: picanhaMesh,
      collected: false
    });
  }

  spawnCoinTrack(parent, x, localZ, worldZ) {
    const coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16);
    const coinMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0x713f12 });

    for (let i = 0; i < 4; i++) {
      const offsetZ = i * 2.2;
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.rotation.x = Math.PI / 2;
      coinMesh.position.set(x, 0.9, localZ + offsetZ);
      coinMesh.castShadow = true;
      parent.add(coinMesh);

      this.coins.push({
        type: 'coin',
        value: 10,
        x: x,
        z: worldZ + offsetZ,
        y: 0.9,
        mesh: coinMesh,
        collected: false
      });
    }
  }

  spawnPowerup(parent, x, localZ, worldZ) {
    const isMagnet = Math.random() > 0.5;
    const color = isMagnet ? 0xef4444 : 0x10b981;
    const itemMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4 }));
    itemMesh.position.set(x, 1.2, localZ);
    parent.add(itemMesh);

    this.powerups.push({
      type: isMagnet ? 'magnet' : 'superjump',
      x: x,
      z: worldZ,
      y: 1.2,
      mesh: itemMesh,
      collected: false
    });
  }

  update(moveZ, dt, player, onCollectCoin, onCollectPicanha, onCollectPowerup, onCrash) {
    // 1. Atualizar Trens em Movimento
    for (const obs of this.obstacles) {
      obs.z += moveZ;
      if (obs.isMoving) {
        obs.z += obs.trainSpeed * dt;
        if (obs.mesh) obs.mesh.position.z += obs.trainSpeed * dt;
      }
    }

    // 2. Atualizar Moedas e Picanhas
    for (const coin of this.coins) {
      coin.z += moveZ;
      if (coin.mesh) coin.mesh.rotation.z += 4.0 * dt;
    }

    // 3. Atualizar Power-ups
    for (const p of this.powerups) {
      p.z += moveZ;
      if (p.mesh) {
        p.mesh.rotation.y += 3.0 * dt;
        p.mesh.rotation.x += 2.0 * dt;
      }
    }

    // 4. Detecção de Colisão AABB (Bounding Box)
    this.checkCollisions(player, onCollectCoin, onCollectPicanha, onCollectPowerup, onCrash);

    // 5. Limpeza de Entidades Fora da Visão
    this.obstacles = this.obstacles.filter(o => o.z < 30);
    this.coins = this.coins.filter(c => c.z < 30);
    this.powerups = this.powerups.filter(p => p.z < 30);
  }

  checkCollisions(player, onCollectCoin, onCollectPicanha, onCollectPowerup, onCrash) {
    if (player.isDead) return;

    const px = player.x;
    const py = player.isSliding ? 0.35 : player.y + 1.0;
    const pz = 0;

    let targetGroundY = 0;

    // Colisão com Obstáculos e Plataforma de Teto do Metrô
    for (const obs of this.obstacles) {
      const dz = Math.abs(obs.z - pz);
      const dx = Math.abs(obs.x - px);

      if (obs.type === 'train') {
        const trainHalfDepth = obs.depth / 2;
        const rampZ = obs.z - trainHalfDepth;

        // Se o jogador estiver na mesma linha do trem
        if (dx < (obs.width / 2 + 0.35)) {
          // Dentro do comprimento do corpo do trem
          if (dz < (trainHalfDepth - 0.5)) {
            // Se estiver em cima do teto ou descendo de um salto
            if (player.y >= 2.3 || (player.isJumping && player.y >= 1.8)) {
              targetGroundY = 3.0; // Anda perfeitamente no teto do trem!
              continue;
            } else {
              // Bateu de frente no nível do chão
              onCrash(obs);
              return;
            }
          }
          // Na rampa traseira do trem
          else if (Math.abs(rampZ - pz) < 2.0) {
            targetGroundY = 3.0;
            continue;
          }
        }
      } else {
        // Obstáculos normais (CLT, Bolsa Família, Auxílio, Varal)
        if (dz < (obs.depth / 2 + 0.35) && dx < (obs.width / 2 + 0.45)) {
          if (obs.canJumpOver && player.y >= (obs.height - 0.2)) continue;
          if (obs.canSlideUnder && player.isSliding) continue;

          onCrash(obs);
          return;
        }
      }
    }

    player.groundY = targetGroundY;

    // Coleta de Moedas e Picanhas
    for (const item of this.coins) {
      if (item.collected) continue;

      if (player.magnetActive) {
        item.x += (px - item.x) * 0.25;
        item.y += (py - item.y) * 0.25;
      }

      const dz = Math.abs(item.z - pz);
      if (dz < 1.3 && Math.abs(item.x - px) < 1.2) {
        item.collected = true;
        item.mesh.visible = false;

        if (item.type === 'picanha') {
          gameAudio.playPicanha();
          onCollectPicanha(item.value);
        } else {
          gameAudio.playCoin();
          onCollectCoin(item.value);
        }
      }
    }

    // Coleta de Power-ups
    for (const p of this.powerups) {
      if (p.collected) continue;
      const dz = Math.abs(p.z - pz);
      if (dz < 1.3 && Math.abs(p.x - px) < 1.2) {
        p.collected = true;
        p.mesh.visible = false;
        gameAudio.playPowerup();
        onCollectPowerup(p.type);
      }
    }
  }

  reset() {
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.movingTrains = [];
  }
}
