// js/game/obstacles.js — Moedas Douradas, Cards Realistas, Ícones 3D de Sapatos Dourados & Ímã em Ferradura
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
    this.particles = [];

    this.textureLoader = new THREE.TextureLoader();
    this.picanhaTexture = this.textureLoader.load('img/picanha.png');

    // Materiais PBR Reutilizáveis
    this.materials = {
      trainBody: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.75, roughness: 0.25 }),
      trainFront: new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6, roughness: 0.35 }),
      trainWindow: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9 }),
      headlight: new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfef08a,
        emissiveIntensity: 1.3
      }),
      headlightBeam: new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      }),
      clotheslineWire: new THREE.LineBasicMaterial({ color: 0x475569 }),
      clothes: [
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 }),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.6 }),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 }),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 })
      ],
      goldCoin: new THREE.MeshStandardMaterial({
        map: textureAtlas.goldCoinTexture,
        color: 0xffd700,
        metalness: 0.95,
        roughness: 0.15,
        emissive: 0xb45309,
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide
      }),
      goldCoinRim: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.95,
        roughness: 0.15,
        emissive: 0xb45309,
        emissiveIntensity: 0.35
      }),
      goldParticle: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xfacc15,
        emissiveIntensity: 0.85,
        roughness: 0.1,
        metalness: 0.9
      }),
      meatMat: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 }),
      fatMat: new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 }),
      // Materiais dos Power-ups 3D
      goldShoeMat: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.15,
        emissive: 0xb45309,
        emissiveIntensity: 0.4
      }),
      magnetRedMat: new THREE.MeshStandardMaterial({
        color: 0xef4444,
        metalness: 0.6,
        roughness: 0.3,
        emissive: 0x991b1b,
        emissiveIntensity: 0.25
      }),
      magnetSilverMat: new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        metalness: 0.9,
        roughness: 0.1
      }),
      // Cards
      cltCardMat: new THREE.MeshStandardMaterial({
        map: textureAtlas.cltTexture,
        roughness: 0.3,
        metalness: 0.15,
        side: THREE.DoubleSide
      }),
      bolsaCardMat: new THREE.MeshStandardMaterial({
        map: textureAtlas.bolsaFamiliaTexture,
        roughness: 0.3,
        metalness: 0.15,
        side: THREE.DoubleSide
      }),
      auxilioCardMat: new THREE.MeshStandardMaterial({
        map: textureAtlas.auxilioTexture,
        roughness: 0.3,
        metalness: 0.15,
        side: THREE.DoubleSide
      })
    };

    this.geometries = {
      coinCore: new THREE.CylinderGeometry(0.46, 0.46, 0.08, 24),
      coinRim: new THREE.TorusGeometry(0.46, 0.045, 8, 24),
      particle: new THREE.BoxGeometry(0.09, 0.09, 0.09),
      train: new THREE.BoxGeometry(2.4, 3.4, 18.0),
      documentCard: new THREE.PlaneGeometry(2.3, 1.45),
      socialCard: new THREE.PlaneGeometry(2.3, 1.45)
    };
  }

  clearSegmentEntities(parent) {
    this.obstacles = this.obstacles.filter(o => {
      if (o.parent === parent) {
        parent.remove(o.mesh);
        return false;
      }
      return true;
    });

    this.movingTrains = this.movingTrains.filter(t => t.parent !== parent);

    this.coins = this.coins.filter(c => {
      if (c.parent === parent) {
        parent.remove(c.mesh);
        return false;
      }
      return true;
    });

    this.powerups = this.powerups.filter(p => {
      if (p.parent === parent) {
        parent.remove(p.mesh);
        return false;
      }
      return true;
    });

    this.particles = this.particles.filter(p => {
      if (p.parent === parent) {
        parent.remove(p.mesh);
        return false;
      }
      return true;
    });
  }

  spawnSegmentEntities(parent, segZ, segmentLength = 85) {
    this.clearSegmentEntities(parent);

    const spawnPoints = [-segmentLength / 2 + 20, -segmentLength / 2 + 60];

    spawnPoints.forEach((localZ) => {
      const pattern = Math.floor(Math.random() * 5);
      const chosenLane = Math.floor(Math.random() * 3);

      switch (pattern) {
        case 0:
          this.createSubwayTrain(parent, LANES[chosenLane], localZ, Math.random() > 0.5);
          const safeLane0 = (chosenLane + 1) % 3;
          this.createCoinLine(parent, LANES[safeLane0], localZ - 10, 5);
          break;

        case 1:
          this.createCLTFloatingCard(parent, LANES[chosenLane], localZ);
          this.createCoinArc(parent, LANES[chosenLane], localZ);
          break;

        case 2:
          const isBolsa = Math.random() > 0.5;
          this.createSocialBenefitCard(parent, LANES[chosenLane], localZ, isBolsa);
          const safeLane2 = (chosenLane + 2) % 3;
          this.createCoinLine(parent, LANES[safeLane2], localZ - 8, 4);
          break;

        case 3:
          this.createClotheslineObstacle(parent, LANES[chosenLane], localZ);
          if (Math.random() > 0.3) {
            this.createPicanhaCollectible(parent, LANES[chosenLane], localZ);
          }
          break;

        case 4:
          const pType = Math.random() > 0.5 ? 'magnet' : 'superjump';
          this.createPowerupItem(parent, LANES[chosenLane], localZ, pType);
          const safeLane4 = (chosenLane + 1) % 3;
          this.createCoinLine(parent, LANES[safeLane4], localZ - 10, 5);
          break;
      }
    });
  }

  createSubwayTrain(parent, laneX, localZ, isMoving = false) {
    const train = new THREE.Group();
    train.position.set(laneX, 1.7, localZ);

    const body = new THREE.Mesh(this.geometries.train, this.materials.trainBody);
    body.castShadow = true;
    body.receiveShadow = true;
    train.add(body);

    const front = new THREE.Mesh(new THREE.BoxGeometry(2.42, 3.42, 1.2), this.materials.trainFront);
    front.position.set(0, 0, 8.5);
    front.castShadow = true;
    train.add(front);

    [-0.75, 0.75].forEach(hx => {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 12), this.materials.headlight);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(hx, -0.4, 9.15);
      train.add(lamp);
    });

    const beamGeo = new THREE.ConeGeometry(2.2, 12.0, 8, 1, true);
    const beam = new THREE.Mesh(beamGeo, this.materials.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, -0.4, 15.0);
    train.add(beam);

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
      isMoving: isMoving,
      moveSpeed: isMoving ? 14 : 0,
      hornPlayed: false,
      passSoundPlayed: false,
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

  createCLTFloatingCard(parent, laneX, localZ) {
    const cardGroup = new THREE.Group();
    cardGroup.position.set(laneX, 1.05, localZ);

    const card = new THREE.Mesh(this.geometries.documentCard, this.materials.cltCardMat);
    card.castShadow = true;
    cardGroup.add(card);

    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.4), new THREE.MeshLambertMaterial({ color: 0x334155 }));
    stand.position.y = -1.0;
    cardGroup.add(stand);

    parent.add(cardGroup);

    this.obstacles.push({
      type: 'clt',
      mesh: cardGroup,
      parent: parent,
      laneX: laneX,
      localZ: localZ,
      baseY: 1.05,
      isFloatingCard: true,
      getAABB() {
        const pz = parent.position.z + cardGroup.position.z;
        return {
          minX: laneX - (2.2 * 0.85) / 2,
          maxX: laneX + (2.2 * 0.85) / 2,
          minY: 0,
          maxY: 1.55,
          minZ: pz - 0.45,
          maxZ: pz + 0.45
        };
      }
    });
  }

  createSocialBenefitCard(parent, laneX, localZ, isBolsa = true) {
    const cardGroup = new THREE.Group();
    cardGroup.position.set(laneX, 1.15, localZ);

    const mat = isBolsa ? this.materials.bolsaCardMat : this.materials.auxilioCardMat;
    const card = new THREE.Mesh(this.geometries.socialCard, mat);
    card.castShadow = true;
    cardGroup.add(card);

    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.4), new THREE.MeshLambertMaterial({ color: 0x334155 }));
    stand.position.y = -1.1;
    cardGroup.add(stand);

    parent.add(cardGroup);

    this.obstacles.push({
      type: isBolsa ? 'bolsafamilia' : 'auxilio',
      mesh: cardGroup,
      parent: parent,
      laneX: laneX,
      localZ: localZ,
      baseY: 1.15,
      isFloatingCard: true,
      getAABB() {
        const pz = parent.position.z + cardGroup.position.z;
        return {
          minX: laneX - (2.2 * 0.85) / 2,
          maxX: laneX + (2.2 * 0.85) / 2,
          minY: 0,
          maxY: 1.65,
          minZ: pz - 0.45,
          maxZ: pz + 0.45
        };
      }
    });
  }

  createClotheslineObstacle(parent, laneX, localZ) {
    const clothesline = new THREE.Group();
    clothesline.position.set(laneX, 1.85, localZ);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.3, 0, 0),
      new THREE.Vector3(1.3, 0, 0)
    ]);
    const line = new THREE.Line(lineGeo, this.materials.clotheslineWire);
    clothesline.add(line);

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
      isOverhead: true,
      getAABB() {
        const pz = parent.position.z + clothesline.position.z;
        return {
          minX: laneX - (2.2 * 0.85) / 2,
          maxX: laneX + (2.2 * 0.85) / 2,
          minY: 1.05,
          maxY: 2.35,
          minZ: pz - 0.4,
          maxZ: pz + 0.4
        };
      }
    });
  }

  createCoinLine(parent, laneX, startLocalZ, count = 5) {
    for (let i = 0; i < count; i++) {
      const lz = startLocalZ + i * 2.8;
      this.createSingleCoin(parent, laneX, 0.9, lz);
    }
  }

  createCoinArc(parent, laneX, localZ) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const lz = localZ - 4 + i * 2.0;
      const y = 0.9 + Math.sin(t * Math.PI) * 2.4;
      this.createSingleCoin(parent, laneX, y, lz);
    }
  }

  createSingleCoin(parent, laneX, y, localZ) {
    const coinGroup = new THREE.Group();
    coinGroup.position.set(laneX, y, localZ);

    const core = new THREE.Mesh(this.geometries.coinCore, this.materials.goldCoin);
    core.rotation.x = Math.PI / 2;
    core.castShadow = true;
    core.receiveShadow = true;

    const rim = new THREE.Mesh(this.geometries.coinRim, this.materials.goldCoinRim);
    rim.castShadow = true;
    rim.receiveShadow = true;

    coinGroup.add(core, rim);
    parent.add(coinGroup);

    this.coins.push({
      mesh: coinGroup,
      parent: parent,
      laneX: laneX,
      baseY: y,
      y: y,
      value: 1,
      collected: false,
      isPicanha: false,
      getAABB() {
        const pz = parent.position.z + coinGroup.position.z;
        return {
          minX: laneX - 0.5, maxX: laneX + 0.5,
          minY: y - 0.5, maxY: y + 0.5,
          minZ: pz - 0.5, maxZ: pz + 0.5
        };
      }
    });
  }

  spawnCoinParticles(x, y, z, parent) {
    const count = 7;
    for (let i = 0; i < count; i++) {
      const pMesh = new THREE.Mesh(this.geometries.particle, this.materials.goldParticle);
      pMesh.position.set(x, y, z);
      parent.add(pMesh);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2.5 + Math.random() * 3.5;
      this.particles.push({
        mesh: pMesh,
        parent: parent,
        vx: Math.cos(angle) * speed,
        vy: 3.5 + Math.random() * 4.0,
        vz: Math.sin(angle) * speed,
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  createPicanhaCollectible(parent, laneX, localZ) {
    const picanhaGroup = new THREE.Group();
    picanhaGroup.position.set(laneX, 0.9, localZ);

    const meat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.35), this.materials.meatMat);
    const fatCap = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.18, 0.38), this.materials.fatMat);
    fatCap.position.y = 0.28;

    picanhaGroup.add(meat, fatCap);
    picanhaGroup.castShadow = true;
    picanhaGroup.receiveShadow = true;
    parent.add(picanhaGroup);

    this.coins.push({
      mesh: picanhaGroup,
      parent: parent,
      laneX: laneX,
      baseY: 0.9,
      y: 0.9,
      value: 5,
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

  // 3. ÍCONES 3D REALISTAS DOS POWER-UPS
  createPowerupItem(parent, laneX, localZ, type = 'magnet') {
    const pGroup = new THREE.Group();
    pGroup.position.set(laneX, 1.15, localZ);

    if (type === 'superjump') {
      // MODELO 3D DE SAPATOS SOCIAIS DOURADOS ALADOS (SUPER PULO)
      const shoeGroup = new THREE.Group();

      [-0.22, 0.22].forEach((sx, idx) => {
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.56), this.materials.goldShoeMat);
        shoe.position.x = sx;
        shoe.castShadow = true;

        // Asinha Dourada Lateral
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.30, 4), this.materials.goldShoeMat);
        wing.rotation.set(0, 0, idx === 0 ? Math.PI / 2 : -Math.PI / 2);
        wing.position.set(idx === 0 ? sx - 0.20 : sx + 0.20, 0.08, -0.05);

        shoeGroup.add(shoe, wing);
      });

      // Mola / Anel de Energia Dourada
      const spring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 16), this.materials.goldShoeMat);
      spring.rotation.x = Math.PI / 2;
      spring.position.y = -0.15;
      shoeGroup.add(spring);

      pGroup.add(shoeGroup);
    } else {
      // MODELO 3D DO ÍMÃ EM FERRADURA VERMELHO E PRATA (ÍMÃ)
      const magnet3D = new THREE.Group();

      // Arco Curvo Superior Vermelho
      const arc = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.22, 0.22), this.materials.magnetRedMat);
      arc.position.y = 0.35;
      arc.castShadow = true;
      magnet3D.add(arc);

      // Hastes Laterais Vermelhas com Pontas Prateadas
      [-0.26, 0.26].forEach(hx => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.22), this.materials.magnetRedMat);
        leg.position.set(hx, 0.12, 0);
        leg.castShadow = true;
        magnet3D.add(leg);

        // Pontas de Aço Prateadas (Polos)
        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.24), this.materials.magnetSilverMat);
        pole.position.set(hx, -0.22, 0);
        pole.castShadow = true;
        magnet3D.add(pole);
      });

      pGroup.add(magnet3D);
    }

    parent.add(pGroup);

    this.powerups.push({
      type: type,
      mesh: pGroup,
      parent: parent,
      laneX: laneX,
      y: 1.15,
      baseY: 1.15,
      collected: false,
      getAABB() {
        const pz = parent.position.z + pGroup.position.z;
        return {
          minX: laneX - 0.65, maxX: laneX + 0.65,
          minY: 0.4, maxY: 1.9,
          minZ: pz - 0.65, maxZ: pz + 0.65
        };
      }
    });
  }

  update(dt, player, elapsedTime, onCrash, onCollectCoin, onCollectPicanha, onCollectPowerup) {
    const playerAABB = player.getAABB();

    // A. Animação de Flutuação e Rotação dos Cards Realistas
    for (const obs of this.obstacles) {
      if (obs.isFloatingCard) {
        obs.mesh.rotation.y = Math.sin(elapsedTime * 2.2 + obs.laneX) * 0.22;
        obs.mesh.position.y = obs.baseY + Math.sin(elapsedTime * 3.0 + obs.laneX) * 0.06;
      }
    }

    // B. Animação, Efeitos Sonoros e Buzina de Metrô
    for (const train of this.movingTrains) {
      const trainWorldZ = train.parent.position.z + train.mesh.position.z;
      if (trainWorldZ < 90 && trainWorldZ > -90) {
        train.mesh.position.z += train.moveSpeed * dt;

        if (Math.abs(trainWorldZ) < 18 && !train.passSoundPlayed) {
          train.passSoundPlayed = true;
          gameAudio.playTrainPass(0.14);
        }

        if (trainWorldZ < -8 && trainWorldZ > -40 && Math.abs(player.x - train.laneX) < 1.2 && !train.hornPlayed) {
          train.hornPlayed = true;
          gameAudio.playTrainHorn();
        }
      }
    }

    // C. Verificação AABB Precisa de Colisão
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

    // D. Coleta de Moedas e Picanhas com Rotação Y Contínua e Partículas
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin.collected) continue;

      const coinWorldZ = coin.parent.position.z + coin.mesh.position.z;

      coin.mesh.rotation.y += 3.6 * dt;
      if (coin.baseY !== undefined) {
        coin.mesh.position.y = coin.baseY + Math.sin(elapsedTime * 4.2 + coin.laneX) * 0.08;
      }

      if (player.magnetActive && !player.isDead) {
        const distZ = Math.abs(player.z - coinWorldZ);
        if (distZ < 16) {
          coin.mesh.position.x += (player.x - (coin.mesh.position.x)) * (10.0 * dt);
          coin.mesh.position.y += (player.y + 1.0 - coin.mesh.position.y) * (10.0 * dt);
        }
      }

      const coinAABB = coin.getAABB();
      const overlapX = playerAABB.maxX > coinAABB.minX && playerAABB.minX < coinAABB.maxX;
      const overlapY = playerAABB.maxY > coinAABB.minY && playerAABB.minY < coinAABB.maxY;
      const overlapZ = playerAABB.maxZ > coinAABB.minZ && playerAABB.minZ < coinAABB.maxZ;

      if (overlapX && overlapY && overlapZ) {
        coin.collected = true;
        this.spawnCoinParticles(coin.mesh.position.x, coin.mesh.position.y, coin.mesh.position.z, coin.parent);
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

    // E. Rotação e Coleta de Power-ups 3D (Sapatos Dourados e Ímã em Ferradura)
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pup = this.powerups[i];
      if (pup.collected) continue;

      pup.mesh.rotation.y += 2.6 * dt;
      pup.mesh.position.y = pup.baseY + Math.sin(elapsedTime * 3.5 + pup.laneX) * 0.10;

      const pupAABB = pup.getAABB();
      const overlapX = playerAABB.maxX > pupAABB.minX && playerAABB.minX < pupAABB.maxX;
      const overlapY = playerAABB.maxY > pupAABB.minY && playerAABB.minY < pupAABB.maxY;
      const overlapZ = playerAABB.maxZ > pupAABB.minZ && playerAABB.minZ < pupAABB.maxZ;

      if (overlapX && overlapY && overlapZ) {
        pup.collected = true;
        this.spawnCoinParticles(pup.mesh.position.x, pup.mesh.position.y, pup.mesh.position.z, pup.parent);
        pup.parent.remove(pup.mesh);
        this.powerups.splice(i, 1);
        gameAudio.playPowerup();
        if (typeof onCollectPowerup === 'function') onCollectPowerup(pup.type);
      }
    }

    // F. Atualização de Partículas Douradas PBR
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 18.0 * dt;
      const scale = Math.max(0.01, p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);
      p.mesh.rotation.x += 4.0 * dt;
      p.mesh.rotation.y += 5.0 * dt;

      if (p.life <= 0) {
        p.parent.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  reset() {
    this.obstacles.forEach(o => o.parent.remove(o.mesh));
    this.coins.forEach(c => c.parent.remove(c.mesh));
    this.powerups.forEach(p => p.parent.remove(p.mesh));
    this.particles.forEach(p => p.parent.remove(p.mesh));
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.particles = [];
    this.movingTrains = [];
  }
}
