// js/game/obstacles.js — Spawn Inteligente, Hitbox Justa e Coleta Fluida de Moedas e Picanhas
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

    // Rastreamento para evitar repetição excessiva ou bloqueio total
    this.lastSpawnedPattern = -1;
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

  // 2. SPAWN INTELIGENTE DE OBSTÁCULOS COM ESPAÇAMENTO SEGURO E SEM BLOQUEIO TRIPLO
  spawnSegmentEntities(parent, segZ, segmentLength = 85) {
    // Espaçamento generoso entre obstáculos (2 zonas bem distribuídas)
    const spawnPoints = [-segmentLength / 2 + 22, -segmentLength / 2 + 62];

    spawnPoints.forEach((localZ) => {
      const worldZ = segZ + localZ;
      
      // Escolhe exatamente 1 faixa para obstáculo principal, garantindo 2 FAIXAS 100% LIVRES
      const obstacleLane = Math.floor(Math.random() * 3);
      const freeLane1 = (obstacleLane + 1) % 3;
      const freeLane2 = (obstacleLane + 2) % 3;

      const rand = Math.random();

      // Alterna os tipos de obstáculos (Nunca gera 2 ou 3 trens bloqueando tudo)
      if (rand < 0.38) {
        // CLT 44H (Pode pular por cima)
        this.createCLT(parent, LANES[obstacleLane], localZ, worldZ);
      } else if (rand < 0.68) {
        // Cartão Bolsa / Auxílio (Pode pular por cima)
        if (Math.random() > 0.5) {
          this.createBolsaFamilia(parent, LANES[obstacleLane], localZ, worldZ);
        } else {
          this.createAuxilio(parent, LANES[obstacleLane], localZ, worldZ);
        }
      } else if (rand < 0.88) {
        // Trem de Metrô único com rampa e moedas no teto
        this.createMetroTrain(parent, LANES[obstacleLane], localZ, worldZ);
      } else {
        // Varal de Roupas (Exige agachar/slide)
        this.createClothesline(parent, LANES[obstacleLane], localZ, worldZ);
      }

      // Faixa livre 1: Trilha de moedas para conduzir o jogador
      this.spawnCoinTrack(parent, LANES[freeLane1], localZ - 6, worldZ - 6);

      // Faixa livre 2: Picanha / Power-up ou Moedas (Totalmente desimpedida)
      if (Math.random() < 0.40) {
        this.spawnPicanha(parent, LANES[freeLane2], localZ, worldZ);
      } else if (Math.random() < 0.25) {
        this.spawnPowerup(parent, LANES[freeLane2], localZ + 4, worldZ + 4);
      } else {
        this.spawnCoinTrack(parent, LANES[freeLane2], localZ - 6, worldZ - 6);
      }
    });
  }

  createCLT(parent, x, localZ, worldZ) {
    const group = new THREE.Group();
    group.position.set(x, 0, localZ);

    const book = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.35, 0.30), new THREE.MeshLambertMaterial({ map: this.cltTexture }));
    book.position.y = 0.90;
    book.castShadow = true;
    group.add(book);

    parent.add(group);

    this.obstacles.push({
      type: 'clt',
      name: 'Carteira de Trabalho (CLT 44h)',
      x: x,
      z: worldZ,
      width: 1.8,
      height: 1.35,
      depth: 0.5,
      canJumpOver: true,
      canSlideUnder: false,
      mesh: group
    });
  }

  createBolsaFamilia(parent, x, localZ, worldZ) {
    const group = new THREE.Group();
    group.position.set(x, 0, localZ);

    const card = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 0.25), new THREE.MeshLambertMaterial({ map: this.bolsaFamiliaTexture }));
    card.position.y = 0.90;
    card.castShadow = true;
    group.add(card);

    parent.add(group);

    this.obstacles.push({
      type: 'bolsafamilia',
      name: 'Cartão Bolsa Família',
      x: x,
      z: worldZ,
      width: 1.9,
      height: 1.35,
      depth: 0.5,
      canJumpOver: true,
      canSlideUnder: false,
      mesh: group
    });
  }

  createAuxilio(parent, x, localZ, worldZ) {
    const group = new THREE.Group();
    group.position.set(x, 0, localZ);

    const card = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 0.25), new THREE.MeshLambertMaterial({ map: this.auxilioTexture }));
    card.position.y = 0.90;
    card.castShadow = true;
    group.add(card);

    parent.add(group);

    this.obstacles.push({
      type: 'auxilio',
      name: 'Cartão Auxílio Brasil',
      x: x,
      z: worldZ,
      width: 1.9,
      height: 1.35,
      depth: 0.5,
      canJumpOver: true,
      canSlideUnder: false,
      mesh: group
    });
  }

  createMetroTrain(parent, x, localZ, worldZ) {
    const trainGroup = new THREE.Group();
    trainGroup.position.set(x, 0, localZ);

    const trainLength = 10;
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.8, trainLength), bodyMat);
    body.position.y = 1.45;
    body.castShadow = true;
    body.receiveShadow = true;
    trainGroup.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.25, trainLength), metalMat);
    roof.position.y = 2.88;
    trainGroup.add(roof);

    [-0.65, 0.65].forEach(fx => {
      const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.1), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      headlight.position.set(fx, 1.2, trainLength / 2 + 0.05);
      trainGroup.add(headlight);
    });

    // Rampa Traseira para subir suave no teto
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 3.2), new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
    ramp.position.set(0, 1.35, -trainLength / 2 - 1.2);
    ramp.rotation.x = Math.PI / 8.5;
    trainGroup.add(ramp);

    // Moedas no teto do trem
    for (let rz = -2.8; rz <= 2.8; rz += 2.0) {
      const roofCoin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16), new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0x713f12 }));
      roofCoin.rotation.x = Math.PI / 2;
      roofCoin.position.set(0, 3.3, rz);
      trainGroup.add(roofCoin);

      this.coins.push({
        type: 'coin',
        value: 10,
        x: x,
        z: worldZ + rz,
        y: 3.3,
        mesh: roofCoin,
        collected: false
      });
    }

    parent.add(trainGroup);

    const isMoving = Math.random() > 0.45;
    if (isMoving) {
      gameAudio.playTrainHorn();
    }

    const obsObj = {
      type: 'train',
      name: 'Trem do Metrô Rio',
      x: x,
      z: worldZ,
      width: 2.2,
      height: 2.9,
      depth: trainLength + 2.5,
      canJumpOver: false,
      canSlideUnder: false,
      isMoving: isMoving,
      trainSpeed: isMoving ? 12 : 0, // Velocidade moderada para não atropelar de surpresa
      mesh: trainGroup
    };

    this.obstacles.push(obsObj);
    if (isMoving) this.movingTrains.push(obsObj);
  }

  createClothesline(parent, x, localZ, worldZ) {
    const group = new THREE.Group();
    group.position.set(x, 0, localZ);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.15), new THREE.MeshLambertMaterial({ color: 0x78350f }));
    beam.position.y = 1.95;
    beam.castShadow = true;
    group.add(beam);

    [-1.1, 1.1].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), new THREE.MeshLambertMaterial({ color: 0x334155 }));
      post.position.set(px, 1.1, 0);
      group.add(post);
    });

    const colors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981];
    for (let i = 0; i < 3; i++) {
      const shirt = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.65), new THREE.MeshLambertMaterial({ color: colors[i], side: THREE.DoubleSide }));
      shirt.position.set(-0.55 + i * 0.55, 1.50, 0);
      group.add(shirt);
    }

    parent.add(group);

    this.obstacles.push({
      type: 'varal',
      name: 'Varal de Roupas da Favela',
      x: x,
      z: worldZ,
      width: 2.2,
      height: 1.2,
      minY: 1.30,
      depth: 0.4,
      canSlideUnder: true,
      canJumpOver: false,
      mesh: group
    });
  }

  spawnPicanha(parent, x, localZ, worldZ) {
    const picanhaMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.75),
      new THREE.MeshBasicMaterial({ map: this.picanhaTexture, transparent: true, side: THREE.DoubleSide })
    );
    picanhaMesh.position.set(x, 1.1, localZ);
    parent.add(picanhaMesh);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.72, 16),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
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
    const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    const coinMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0x713f12 });

    for (let i = 0; i < 4; i++) {
      const offsetZ = i * 2.4;
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.rotation.x = Math.PI / 2;
      coinMesh.position.set(x, 0.95, localZ + offsetZ);
      coinMesh.castShadow = true;
      parent.add(coinMesh);

      this.coins.push({
        type: 'coin',
        value: 10,
        x: x,
        z: worldZ + offsetZ,
        y: 0.95,
        mesh: coinMesh,
        collected: false
      });
    }
  }

  spawnPowerup(parent, x, localZ, worldZ) {
    const isMagnet = Math.random() > 0.5;
    const color = isMagnet ? 0xef4444 : 0x10b981;
    const itemMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4 }));
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

  update(moveZ, dt, player, onCollectCoin, onCollectPicanha, onCollectPowerup, onCrash, speed = 40) {
    // 1. Atualizar Trens em Movimento
    for (const obs of this.obstacles) {
      obs.z += moveZ;
      if (obs.isMoving) {
        obs.z += obs.trainSpeed * dt;
        if (obs.mesh) obs.mesh.position.z += obs.trainSpeed * dt;
      }
    }

    // 2. Atualizar Moedas, Picanhas e Ímã
    const px = player.x;
    const py = player.y + 1.0;
    const pz = 0;

    for (const coin of this.coins) {
      coin.z += moveZ;
      if (coin.mesh) coin.mesh.rotation.z += 4.5 * dt;

      // Atração Magnética (Suave se perto na mesma faixa, ou forte com Power-up)
      if (!coin.collected) {
        const distToPlayer = Math.hypot(coin.x - px, coin.z - pz);

        if (player.magnetActive && distToPlayer < 10.0) {
          coin.x += (px - coin.x) * (14 * dt);
          coin.y += (py - coin.y) * (14 * dt);
          coin.z += (pz - coin.z) * (14 * dt);
          if (coin.mesh) {
            coin.mesh.position.x = coin.x;
            coin.mesh.position.y = coin.y;
          }
        } else if (distToPlayer < 3.2 && Math.abs(coin.x - px) < 1.2) {
          // Pequena atração natural para garantir que nunca "fure" a coleta
          coin.x += (px - coin.x) * (8 * dt);
          if (coin.mesh) coin.mesh.position.x = coin.x;
        }
      }
    }

    // 3. Atualizar Power-ups
    for (const p of this.powerups) {
      p.z += moveZ;
      if (p.mesh) {
        p.mesh.rotation.y += 3.0 * dt;
        p.mesh.rotation.x += 2.0 * dt;
      }
    }

    // 4. Detecção de Colisão Refinada & Justa
    this.checkCollisions(player, dt, speed, onCollectCoin, onCollectPicanha, onCollectPowerup, onCrash);

    // 5. Limpeza de Entidades Fora da Visão
    this.obstacles = this.obstacles.filter(o => o.z < 35);
    this.coins = this.coins.filter(c => c.z < 35);
    this.powerups = this.powerups.filter(p => p.z < 35);
  }

  checkCollisions(player, dt, speed, onCollectCoin, onCollectPicanha, onCollectPowerup, onCrash) {
    if (player.isDead) return;

    const px = player.x;
    const py = player.y;
    const pz = 0;

    let targetGroundY = 0;

    // 1. Colisão Justa com Obstáculos (Hitbox precisa sem falso-positivo nas faixas vizinhas)
    for (const obs of this.obstacles) {
      const dz = Math.abs(obs.z - pz);
      const dx = Math.abs(obs.x - px);

      if (obs.type === 'train') {
        const trainHalfDepth = obs.depth / 2;
        const rampZ = obs.z - trainHalfDepth;

        // Se estiver alinhado com a largura do trem
        if (dx < (obs.width / 2 + 0.15)) {
          // Dentro do comprimento do corpo do trem
          if (dz < (trainHalfDepth - 0.4)) {
            // Se estiver em cima do teto ou descendo de um salto
            if (py >= 1.8 || (player.isJumping && py >= 1.3 && player.jumpVelocity <= 0)) {
              targetGroundY = 2.9; // Anda suavemente no teto do trem!
              continue;
            } else {
              // Bateu de frente no trem
              onCrash(obs);
              return;
            }
          }
          // Na rampa traseira do trem
          else if (Math.abs(rampZ - pz) < 2.0) {
            targetGroundY = 2.9;
            continue;
          }
        }
      } else {
        // Obstáculos normais (CLT, Bolsa Família, Auxílio, Varal)
        // Hitbox horizontal justa: 0.65m para nunca colidir se o jogador estiver em outra faixa
        if (dz < (obs.depth / 2 + 0.20) && dx < (obs.width / 2 - 0.22)) {
          // Se estiver no ar pulando por cima (tolerância generosa anti-arrasto)
          if (obs.canJumpOver && (py >= 0.70 || (player.isJumping && py >= 0.45))) continue;
          // Se estiver agachado / deslizando
          if (obs.canSlideUnder && (player.isSliding || py <= 0.45)) continue;

          onCrash(obs);
          return;
        }
      }
    }

    player.groundY = targetGroundY;

    // 2. Coleta de Moedas e Picanhas com Sweep Tolerante à Velocidade
    const sweepZ = Math.max(2.2, speed * dt * 1.8);

    for (const item of this.coins) {
      if (item.collected) continue;

      const dz = Math.abs(item.z - pz);
      const dx = Math.abs(item.x - px);
      const dy = Math.abs((item.y || 1.0) - (py + 1.0));

      // Tolerância ampla para garantir coleta suave mesmo em velocidade máxima
      if (dz < sweepZ && dx < 1.55 && dy < 2.5) {
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

    // 3. Coleta de Power-ups
    for (const p of this.powerups) {
      if (p.collected) continue;
      const dz = Math.abs(p.z - pz);
      const dx = Math.abs(p.x - px);

      if (dz < sweepZ && dx < 1.55) {
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
