// js/game/obstacles.js — Obstáculos, Trens de Metrô, Colecionáveis, AABB Hitboxes e Object Pooling
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LANES } from './character.js';
import { gameAudio } from './audio.js';
import { textureAtlas } from './textures.js';

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.movingTrains = [];

    this.textureLoader = new THREE.TextureLoader();
    this.picanhaTexture = this.textureLoader.load('img/picanha.png');

    // Materiais Reutilizáveis Compartilhados (Zero Alocação em Runtime)
    this.materials = {
      trainBody: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.6, roughness: 0.3 }),
      trainFront: new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.5, roughness: 0.4 }),
      trainWindow: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9 }),
      trainRoof: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      headlight: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      barrierWood: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      clotheslineWire: new THREE.LineBasicMaterial({ color: 0x475569 }),
      clothes: [
        new THREE.MeshLambertMaterial({ color: 0xef4444 }),
        new THREE.MeshLambertMaterial({ color: 0x3b82f6 }),
        new THREE.MeshLambertMaterial({ color: 0x22c55e }),
        new THREE.MeshLambertMaterial({ color: 0xfacc15 })
      ],
      goldCoin: new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.15 }),
      magnetPowerup: new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.3 }),
      superJumpPowerup: new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.7, roughness: 0.3 })
    };

    // Geometrias Reutilizáveis
    this.geometries = {
      coin: new THREE.CylinderGeometry(0.48, 0.48, 0.12, 16),
      powerup: new THREE.BoxGeometry(0.85, 0.85, 0.85),
      train: new THREE.BoxGeometry(2.4, 3.4, 18.0),
      cltHurdle: new THREE.BoxGeometry(2.4, 1.45, 0.4),
      tallBarrier: new THREE.BoxGeometry(2.4, 2.6, 0.4)
    };

    // Pools de Objetos
    this.obstaclePool = [];
    this.coinPool = [];
    this.powerupPool = [];

    this.lastSpawnedPattern = -1;
  }

  // 1. SPAWN INTELIGENTE DE OBSTÁCULOS E COLECIONÁVEIS EM CADA SEGMENTO
  spawnSegmentEntities(parent, segZ, segmentLength = 85) {
    const spawnPoints = [-segmentLength / 2 + 20, -segmentLength / 2 + 60];

    spawnPoints.forEach((localZ) => {
      const worldZ = segZ + localZ;

      // Padrões de spawn que NUNCA bloqueiam as 3 faixas simultaneamente
      const pattern = Math.floor(Math.random() * 5);
      const chosenLane = Math.floor(Math.random() * 3);

      switch (pattern) {
        case 0:
          // Trem de Metrô Parado ou em Movimento na Faixa Escolhida
          this.createSubwayTrain(parent, LANES[chosenLane], localZ, worldZ, Math.random() > 0.5);
          // Moedas na faixa livre adjacente
          const safeLane0 = (chosenLane + 1) % 3;
          this.createCoinLine(parent, LANES[safeLane0], localZ - 10, worldZ - 10, 5);
          break;

        case 1:
          // Barreira CLT 44H (Pular ou Desviar)
          this.createCLTHurdle(parent, LANES[chosenLane], localZ, worldZ);
          // Arco de moedas por cima da CLT
          this.createCoinArc(parent, LANES[chosenLane], localZ, worldZ);
          break;

        case 2:
          // Placa Bolsa Família ou Auxílio Brasil
          const isBolsa = Math.random() > 0.5;
          this.createSocialBenefitBarrier(parent, LANES[chosenLane], localZ, worldZ, isBolsa);
          break;

        case 3:
          // Varal de Roupas Suspenso (Exige Slide / Agachamento ou Mudar de Faixa)
          this.createClotheslineObstacle(parent, LANES[chosenLane], localZ, worldZ);
          // Picanha bônus no chão sob o varal
          if (Math.random() > 0.3) {
            this.createPicanhaCollectible(parent, LANES[chosenLane], localZ, worldZ);
          }
          break;

        case 4:
          // Power-up Especial (Ímã ou Super Pulo) + Linha de Moedas
          const pType = Math.random() > 0.5 ? 'magnet' : 'superjump';
          this.createPowerupItem(parent, LANES[chosenLane], localZ, worldZ, pType);
          break;
      }
    });
  }

  // 2. CRIAÇÃO DE OBSTÁCULOS COM HITBOXES AABB
  createSubwayTrain(parent, laneX, localZ, worldZ, isMoving = false) {
    const train = new THREE.Group();
    train.position.set(laneX, 1.7, localZ);

    // Corpo Principal do Metrô
    const body = new THREE.Mesh(this.geometries.train, this.materials.trainBody);
    body.castShadow = true;
    body.receiveShadow = true;
    train.add(body);

    // Frente Vermelha
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.42, 3.42, 1.2), this.materials.trainFront);
    front.position.set(0, 0, 8.5);
    front.castShadow = true;
    train.add(front);

    // Faróis de Luz
    [-0.75, 0.75].forEach(hx => {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 12), this.materials.headlight);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(hx, -0.4, 9.15);
      train.add(lamp);
    });

    // Janela Dianteira da Cabine
    const cabinWin = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), this.materials.trainWindow);
    cabinWin.position.set(0, 0.6, 9.12);
    train.add(cabinWin);

    parent.add(train);

    const obstacleObj = {
      type: 'train',
      mesh: train,
      parent: parent,
      laneX: laneX,
      localZ: localZ,
      worldZ: worldZ,
      width: 2.3 * 0.85, // Tolerância de 15%
      height: 3.4,
      depth: 17.5 * 0.85,
      isMoving: isMoving,
      moveSpeed: isMoving ? 14 : 0,
      getAABB() {
        const pz = parent.position.z + train.position.z;
        return {
          minX: laneX - (2.3 * 0.85) / 2,
          maxX: laneX + (2.3 * 0.85) / 2,
          minY: 0,
          maxY: 3.4,
          minZ: pz - (17.5 * 0.85) / 2,
          maxZ: pz + (17.5 * 0.85) / 2
        };
      }
    };

    this.obstacles.push(obstacleObj);
    if (isMoving) this.movingTrains.push(obstacleObj);
  }

  createCLTHurdle(parent, laneX, localZ, worldZ) {
    const hurdle = new THREE.Group();
    hurdle.position.set(laneX, 0.75, localZ);

    // Cavalete de Madeira
    [-1.0, 1.0].forEach(px => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 0.16), this.materials.barrierWood);
      post.castShadow = true;
      hurdle.add(post);
    });

    // Placa da Carteira de Trabalho (CLT 44h)
    const boardMat = new THREE.MeshLambertMaterial({ map: textureAtlas.cltTexture });
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.25, 0.12), boardMat);
    board.position.y = 0.25;
    board.castShadow = true;
    hurdle.add(board);

    parent.add(hurdle);

    this.obstacles.push({
      type: 'clt',
      mesh: hurdle,
      parent: parent,
      laneX: laneX,
      localZ: localZ,
      worldZ: worldZ,
      getAABB() {
        const pz = parent.position.z + hurdle.position.z;
        return {
          minX: laneX - (2.2 * 0.85) / 2,
          maxX: laneX + (2.2 * 0.85) / 2,
          minY: 0,
          maxY: 1.45,
          minZ: pz - 0.45,
          maxZ: pz + 0.45
        };
      }
    });
  }

  createSocialBenefitBarrier(parent, laneX, localZ, worldZ, isBolsa = true) {
    const barrier = new THREE.Group();
    barrier.position.set(laneX, 1.2, localZ);

    const texture = isBolsa ? textureAtlas.bolsaFamiliaTexture : textureAtlas.auxilioTexture;
    const boardMat = new THREE.MeshLambertMaterial({ map: texture });

    const board = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.2, 0.15), boardMat);
    board.castShadow = true;
    barrier.add(board);

    // Suportes de Aço
    [-0.9, 0.9].forEach(sx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), this.materials.barrierWood);
      leg.position.set(sx, -0.1, 0);
      leg.castShadow = true;
      barrier.add(leg);
    });

    parent.add(barrier);

    this.obstacles.push({
      type: isBolsa ? 'bolsafamilia' : 'auxilio',
      mesh: barrier,
      parent: parent,
      laneX: laneX,
      localZ: localZ,
      worldZ: worldZ,
      getAABB() {
        const pz = parent.position.z + barrier.position.z;
        return {
          minX: laneX - (2.2 * 0.85) / 2,
          maxX: laneX + (2.2 * 0.85) / 2,
          minY: 0,
          maxY: 2.4,
          minZ: pz - 0.45,
          maxZ: pz + 0.45
        };
      }
    });
  }

  createClotheslineObstacle(parent, laneX, localZ, worldZ) {
    const clothesline = new THREE.Group();
    clothesline.position.set(laneX, 1.85, localZ);

    // Corda do varal
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.3, 0, 0),
      new THREE.Vector3(1.3, 0, 0)
    ]);
    const line = new THREE.Line(lineGeo, this.materials.clotheslineWire);
    clothesline.add(line);

    // Roupas penduradas no varal
    [-0.7, 0, 0.7].forEach((rx, idx) => {
      const clothMat = this.materials.clothes[idx % this.materials.clothes.length];
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.75), clothMat);
      cloth.position.set(rx, -0.4, 0);
      cloth.castShadow = true;
      clothesline.add(cloth);
    });

    parent.add(clothesline);

    this.obstacles.push({
      type: 'clothesline',
      mesh: clothesline,
      parent: parent,
      laneX: laneX,
      localZ: localZ,
      worldZ: worldZ,
      isOverhead: true,
      getAABB() {
        const pz = parent.position.z + clothesline.position.z;
        return {
          minX: laneX - (2.2 * 0.85) / 2,
          maxX: laneX + (2.2 * 0.85) / 2,
          minY: 1.15, // Permite passar por baixo fazendo slide (Y < 1.15)
          maxY: 2.35,
          minZ: pz - 0.4,
          maxZ: pz + 0.4
        };
      }
    });
  }

  // 3. COLECIONÁVEIS (MOEDAS, PICANHAS E POWER-UPS)
  createCoinLine(parent, laneX, startLocalZ, startWorldZ, count = 5) {
    for (let i = 0; i < count; i++) {
      const lz = startLocalZ + i * 2.8;
      const wz = startWorldZ + i * 2.8;
      this.createSingleCoin(parent, laneX, 0.9, lz, wz);
    }
  }

  createCoinArc(parent, laneX, localZ, worldZ) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const lz = localZ - 4 + i * 2.0;
      const wz = worldZ - 4 + i * 2.0;
      const y = 0.9 + Math.sin(t * Math.PI) * 2.4; // Arco suave por cima da barreira
      this.createSingleCoin(parent, laneX, y, lz, wz);
    }
  }

  createSingleCoin(parent, laneX, y, localZ, worldZ) {
    const coin = new THREE.Mesh(this.geometries.coin, this.materials.goldCoin);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(laneX, y, localZ);
    coin.castShadow = true;
    parent.add(coin);

    this.coins.push({
      mesh: coin,
      parent: parent,
      laneX: laneX,
      y: y,
      value: 1,
      collected: false,
      isPicanha: false,
      getAABB() {
        const pz = parent.position.z + coin.position.z;
        return {
          minX: laneX - 0.5, maxX: laneX + 0.5,
          minY: y - 0.5, maxY: y + 0.5,
          minZ: pz - 0.5, maxZ: pz + 0.5
        };
      }
    });
  }

  createPicanhaCollectible(parent, laneX, localZ, worldZ) {
    const picanhaGroup = new THREE.Group();
    picanhaGroup.position.set(laneX, 0.9, localZ);

    const meatMat = new THREE.MeshLambertMaterial({ color: 0xb91c1c });
    const fatMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });

    const meat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.35), meatMat);
    const fatCap = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.18, 0.38), fatMat);
    fatCap.position.y = 0.28;

    picanhaGroup.add(meat, fatCap);
    picanhaGroup.castShadow = true;
    parent.add(picanhaGroup);

    this.coins.push({
      mesh: picanhaGroup,
      parent: parent,
      laneX: laneX,
      y: 0.9,
      value: 5, // 5 picanhas bônus
      collected: false,
      isPicanha: true,
      getAABB() {
        const pz = parent.position.z + picanhaGroup.position.z;
        return {
          minX: laneX - 0.6, maxX: laneX + 0.6,
          minY: 0.3, maxY: 1.5,
          minZ: pz - 0.6, maxZ: pz + 0.6
        };
      }
    });
  }

  createPowerupItem(parent, laneX, localZ, worldZ, type = 'magnet') {
    const pMesh = new THREE.Mesh(
      this.geometries.powerup,
      type === 'magnet' ? this.materials.magnetPowerup : this.materials.superJumpPowerup
    );
    pMesh.position.set(laneX, 1.1, localZ);
    pMesh.castShadow = true;
    parent.add(pMesh);

    this.powerups.push({
      type: type,
      mesh: pMesh,
      parent: parent,
      laneX: laneX,
      y: 1.1,
      collected: false,
      getAABB() {
        const pz = parent.position.z + pMesh.position.z;
        return {
          minX: laneX - 0.65, maxX: laneX + 0.65,
          minY: 0.4, maxY: 1.8,
          minZ: pz - 0.65, maxZ: pz + 0.65
        };
      }
    });
  }

  // 4. ATUALIZAÇÃO CONTÍNUA DE FÍSICA, ANIMAÇÃO E DETECÇÃO AABB DE COLISÕES
  update(dt, player, onCrash, onCollectCoin, onCollectPicanha, onCollectPowerup) {
    const playerAABB = player.getAABB();

    // A. Animação e Movimentação dos Trens de Metrô
    for (const train of this.movingTrains) {
      if (player.z - (train.parent.position.z + train.mesh.position.z) < 90) {
        train.mesh.position.z += train.moveSpeed * dt;
      }
    }

    // B. Verificação AABB de Colisão com Obstáculos
    if (!player.isDead) {
      for (const obs of this.obstacles) {
        const obsAABB = obs.getAABB();

        const collisionX = playerAABB.maxX > obsAABB.minX && playerAABB.minX < obsAABB.maxX;
        const collisionY = playerAABB.maxY > obsAABB.minY && playerAABB.minY < obsAABB.maxY;
        const collisionZ = playerAABB.maxZ > obsAABB.minZ && playerAABB.minZ < obsAABB.maxZ;

        if (collisionX && collisionY && collisionZ) {
          onCrash(obs);
          break;
        }
      }
    }

    // C. Coleta de Moedas e Picanhas (com Atração Magnética se Ímã estiver ativo)
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin.collected) continue;

      const coinWorldZ = coin.parent.position.z + coin.mesh.position.z;

      // Rotação contínua da moeda
      coin.mesh.rotation.z += 3.5 * dt;

      // Efeito do Ímã (Atrai moedas a até 16 metros)
      if (player.magnetActive && !player.isDead) {
        const distZ = Math.abs(player.z - coinWorldZ);
        if (distZ < 16) {
          coin.mesh.position.x += (player.x - (coin.mesh.position.x)) * (10.0 * dt);
          coin.mesh.position.y += (player.y + 1.0 - coin.mesh.position.y) * (10.0 * dt);
        }
      }

      // Detecção de Coleta
      const coinAABB = coin.getAABB();
      const overlapX = playerAABB.maxX > coinAABB.minX && playerAABB.minX < coinAABB.maxX;
      const overlapY = playerAABB.maxY > coinAABB.minY && playerAABB.minY < coinAABB.maxY;
      const overlapZ = playerAABB.maxZ > coinAABB.minZ && playerAABB.minZ < coinAABB.maxZ;

      if (overlapX && overlapY && overlapZ) {
        coin.collected = true;
        coin.parent.remove(coin.mesh);
        this.coins.splice(i, 1);

        if (coin.isPicanha) {
          gameAudio.playPicanhaCollect();
          if (typeof onCollectPicanha === 'function') onCollectPicanha(coin.value);
        } else {
          gameAudio.playCoin();
          if (typeof onCollectCoin === 'function') onCollectCoin(coin.value);
        }
      }
    }

    // D. Coleta de Power-ups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pup = this.powerups[i];
      if (pup.collected) continue;

      pup.mesh.rotation.y += 2.5 * dt;

      const pupAABB = pup.getAABB();
      const overlapX = playerAABB.maxX > pupAABB.minX && playerAABB.minX < pupAABB.maxX;
      const overlapY = playerAABB.maxY > pupAABB.minY && playerAABB.minY < pupAABB.maxY;
      const overlapZ = playerAABB.maxZ > pupAABB.minZ && playerAABB.minZ < pupAABB.maxZ;

      if (overlapX && overlapY && overlapZ) {
        pup.collected = true;
        pup.parent.remove(pup.mesh);
        this.powerups.splice(i, 1);
        gameAudio.playPowerup();
        if (typeof onCollectPowerup === 'function') onCollectPowerup(pup.type);
      }
    }

    // E. Limpeza de Entidades que Ficaram Atrás da Câmera
    this.obstacles = this.obstacles.filter(o => o.parent.position.z + o.mesh.position.z < player.z + 20);
    this.movingTrains = this.movingTrains.filter(t => t.parent.position.z + t.mesh.position.z < player.z + 20);
    this.coins = this.coins.filter(c => c.parent.position.z + c.mesh.position.z < player.z + 20);
    this.powerups = this.powerups.filter(p => p.parent.position.z + p.mesh.position.z < player.z + 20);
  }

  reset() {
    this.obstacles.forEach(o => o.parent.remove(o.mesh));
    this.coins.forEach(c => c.parent.remove(c.mesh));
    this.powerups.forEach(p => p.parent.remove(p.mesh));
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.movingTrains = [];
  }
}
