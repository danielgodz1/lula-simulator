// js/game/obstacles.js — Moedas Douradas, Cards Realistas, Trens, Caminhões 3D e Ícones de Power-ups
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LANES } from './character.js';
import { gameAudio } from './audio.js';
import { textureAtlas } from './textures.js';
import { modelLoader } from './model-loader.js';

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.movingTrains = [];
    this.particles = [];

    // Object Pooling para Moedas e Partículas (Zero GC / Alta Performance Mobile)
    this.coinPool = [];
    this.particlePool = [];

    this.textureLoader = new THREE.TextureLoader();
    this.picanhaTexture = this.textureLoader.load('/img/picanha.png');

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
      coinCore: new THREE.CylinderGeometry(0.46, 0.46, 0.08, 20),
      coinRim: new THREE.TorusGeometry(0.46, 0.045, 6, 20),
      particle: new THREE.BoxGeometry(0.09, 0.09, 0.09),
      train: new THREE.BoxGeometry(2.4, 3.4, 18.0)
    };

    // Marca geometrias e materiais compartilhados para não serem destruídos
    Object.values(this.materials).forEach(m => {
      if (Array.isArray(m)) m.forEach(x => { if (x) x._isShared = true; });
      else if (m) m._isShared = true;
    });
    Object.values(this.geometries).forEach(g => { if (g) g._isShared = true; });
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
        if (!c.isPicanha && this.coinPool.length < 50) {
          c.mesh.visible = false;
          this.coinPool.push(c.mesh);
        }
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
        if (this.particlePool.length < 60) {
          p.mesh.visible = false;
          this.particlePool.push(p.mesh);
        }
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
          // Trens do Metrô (Metrô Rio, Metrô SP, Expresso Brasil com pintura procedual HD, bogies e rampa)
          const isMoving = Math.random() > 0.45;
          this.createSubwayTrain(parent, LANES[chosenLane], localZ, isMoving);
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

  // 1. OBSTÁCULO PESADO: CAMINHÃO 3D OU TREM TEXTURIZADO
  createTruckObstacle(parent, laneX, localZ, isMoving = false) {
    const truckModel = modelLoader.getModel('caminhao');

    if (truckModel) {
      const truck = new THREE.Group();
      truck.position.set(laneX, 0, localZ);

      const truckPivot = new THREE.Group();
      truckModel.rotation.y = Math.PI / 2;
      truckPivot.add(truckModel);

      const box = new THREE.Box3().setFromObject(truckPivot);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Calibra a escala real do caminhão na pista (largura 2.35m, altura 3.20m, comprimento 10.5m)
      const scaleX = 2.35 / Math.max(0.001, size.x);
      const scaleY = 3.20 / Math.max(0.001, size.y);
      const scaleZ = 10.5 / Math.max(0.001, size.z);
      truckPivot.scale.set(scaleX, scaleY, scaleZ);
      truckPivot.position.set(-center.x * scaleX, -box.min.y * scaleY, -center.z * scaleZ);

      truck.add(truckPivot);

      // Faróis Frontais Acessos na Cabine do Caminhão (Z = +5.25)
      [-0.75, 0.75].forEach(hx => {
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), this.materials.headlight);
        lamp.rotation.x = Math.PI / 2;
        lamp.position.set(hx, 1.0, 5.25);
        truck.add(lamp);
      });

      const beam = new THREE.Mesh(new THREE.ConeGeometry(2.0, 10.0, 8, 1, true), this.materials.headlightBeam);
      beam.rotation.x = -Math.PI / 2;
      beam.position.set(0, 1.0, 10.25);
      truck.add(beam);

      parent.add(truck);

      const obstacleObj = {
        name: 'Caminhão da Favela',
        type: 'truck',
        mesh: truck,
        parent: parent,
        laneX: laneX,
        localZ: localZ,
        isMoving: isMoving,
        moveSpeed: isMoving ? 13 : 0,
        hornPlayed: false,
        passSoundPlayed: false,
        getAABB() {
          const pz = parent.position.z + truck.position.z;
          return {
            minX: laneX - 1.15,
            maxX: laneX + 1.15,
            minY: 0,
            maxY: 3.2,
            minZ: pz - 5.25,
            maxZ: pz + 5.25
          };
        }
      };

      this.obstacles.push(obstacleObj);
      if (isMoving) {
        this.movingTrains.push(obstacleObj);
      }
    } else {
      // Se o modelo GLB ainda não terminou de baixar, usa imediatamente o trem 3D procedual texturizado
      this.createSubwayTrain(parent, laneX, localZ, isMoving);
    }
  }

  createSubwayTrain(parent, laneX, localZ, isMoving = false) {
    const train = new THREE.Group();
    train.position.set(laneX, 1.7, localZ);

    // Seleção Dinâmica entre 3 Pinturas Realistas (Metrô Rio, Metrô SP, Expresso Brasil)
    const trainThemes = [
      {
        id: 'rio',
        name: 'Trem do Metrô Rio',
        sideTex: textureAtlas.trainSideRio,
        frontTex: textureAtlas.trainFrontRio,
        accentColor: 0x0284c7,
        roofColor: 0x94a3b8
      },
      {
        id: 'sp',
        name: 'Trem do Metrô SP',
        sideTex: textureAtlas.trainSideSP,
        frontTex: textureAtlas.trainFrontSP,
        accentColor: 0xdc2626,
        roofColor: 0x94a3b8
      },
      {
        id: 'br',
        name: 'Expresso Brasil 3D',
        sideTex: textureAtlas.trainSideBR,
        frontTex: textureAtlas.trainFrontBR,
        accentColor: 0x16a34a,
        roofColor: 0x334155
      }
    ];

    const theme = trainThemes[Math.floor(Math.random() * trainThemes.length)];

    // Materiais PBR do Vagão
    const sideMat = new THREE.MeshStandardMaterial({
      map: theme.sideTex,
      metalness: 0.75,
      roughness: 0.25,
      bumpScale: 0.05
    });

    const roofMat = new THREE.MeshStandardMaterial({
      map: textureAtlas.trainRoof,
      metalness: 0.7,
      roughness: 0.3
    });

    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.4
    });

    const rearMat = new THREE.MeshStandardMaterial({
      color: theme.accentColor,
      metalness: 0.6,
      roughness: 0.35
    });

    // 1. CORPO PRINCIPAL DO VAGÃO (Multi-Material Box)
    // Faces: 0: +X (Direita), 1: -X (Esquerda), 2: +Y (Teto), 3: -Y (Chassi), 4: +Z (Frente), 5: -Z (Traseira)
    const bodyMaterials = [
      sideMat,
      sideMat,
      roofMat,
      chassisMat,
      chassisMat,
      rearMat
    ];

    const bodyGeo = new THREE.BoxGeometry(2.38, 3.15, 17.2);
    const body = new THREE.Mesh(bodyGeo, bodyMaterials);
    body.castShadow = true;
    body.receiveShadow = true;
    train.add(body);

    // 1.1 DETALHAMENTO 3D REAL DAS LATERAIS (JANELAS EM RELEVO, PORTAS E VIGAS CANELADAS)
    const windowFrameMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const windowGlassMat = new THREE.MeshLambertMaterial({
      color: 0x1e293b,
      emissive: theme.id === 'rio' ? 0x0284c7 : (theme.id === 'sp' ? 0x38bdf8 : 0x10b981),
      emissiveIntensity: 0.25
    });
    const doorFrameMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const corrugatedMat = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });

    [-1.20, 1.20].forEach(sideX => {
      const isRight = sideX > 0;
      const sideGroup = new THREE.Group();
      sideGroup.position.x = sideX;

      // Vigas de Aço Inoxidável Caneladas (Frisos Longitudinais em Relevo 3D)
      [-0.45, 0.45].forEach(ribY => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 17.0), corrugatedMat);
        rib.position.set(0, ribY, 0);
        sideGroup.add(rib);
      });

      // Saias de Chassi Inferiores de Proteção entre os Bogies
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 6.4), chassisMat);
      skirt.position.set(0, -1.38, 0);
      sideGroup.add(skirt);

      // Janelas 3D dos Passageiros em Relevo com Moldura Prateada e Vidro Iluminado
      [-5.8, -3.8, 0.0, 3.8, 5.8].forEach(wz => {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.96, 1.48), windowFrameMat);
        frame.position.set(0, 0.48, wz);

        const glass = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.84, 1.36), windowGlassMat);
        glass.position.set(0, 0.48, wz);

        sideGroup.add(frame, glass);
      });

      // Portas Automáticas Duplas Corrediças em Relevo 3D
      [-1.9, 1.9].forEach(dz => {
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.15, 1.42), doorFrameMat);
        doorFrame.position.set(0, -0.05, dz);

        const doorDivider = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.10, 0.06), windowFrameMat);
        doorDivider.position.set(0, -0.05, dz);

        // Janelinhas das portas
        [-0.32, 0.32].forEach(pwx => {
          const doorWin = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.72, 0.38), windowGlassMat);
          doorWin.position.set(0, 0.42, dz + pwx);
          sideGroup.add(doorWin);
        });

        // Degrau de Entrada com Alerta Amarelo
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.40), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
        step.position.set(isRight ? 0.04 : -0.04, -1.14, dz);

        sideGroup.add(doorFrame, doorDivider, step);
      });

      train.add(sideGroup);
    });

    // 2. CABINE FRONTAL AERODINÂMICA 3D ROBUSTA (PARA-BRISA, PARA-CHOQUE E ENGATE)
    const frontCab = new THREE.Group();
    frontCab.position.set(0, 0, 8.6);

    // Nariz Principal Inclinado da Cabine
    const frontNose = new THREE.Mesh(
      new THREE.BoxGeometry(2.40, 3.20, 1.2),
      new THREE.MeshStandardMaterial({
        color: theme.accentColor,
        metalness: 0.7,
        roughness: 0.3
      })
    );
    frontNose.castShadow = true;
    frontCab.add(frontNose);

    // Para-brisa Panorâmico Inclinado 3D em Relevo com Vidro Fumê
    const windshieldFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.18, 1.15, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x0f172a })
    );
    windshieldFrame.position.set(0, 0.58, 0.62);

    const windshieldGlass = new THREE.Mesh(
      new THREE.BoxGeometry(2.08, 1.05, 0.14),
      new THREE.MeshPhongMaterial({
        color: 0x0f172a,
        specular: 0x93c5fd,
        shininess: 90,
        emissive: 0x0284c7,
        emissiveIntensity: 0.15
      })
    );
    windshieldGlass.position.set(0, 0.58, 0.63);

    // Limpador de Para-brisa 3D Duplo
    [-0.50, 0.45].forEach(wx => {
      const wiperArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.03), doorFrameMat);
      wiperArm.rotation.z = Math.PI / 8;
      wiperArm.position.set(wx, 0.45, 0.71);
      frontCab.add(wiperArm);
    });

    frontCab.add(windshieldFrame, windshieldGlass);

    // Caixa de Letreiro LED Digital Rebaixada no Topo da Cabine
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.36, 0.15), doorFrameMat);
    signBox.position.set(0, 1.30, 0.62);

    const ledSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.28, 0.08),
      new THREE.MeshStandardMaterial({
        map: theme.frontTex,
        roughness: 0.2,
        metalness: 0.5
      })
    );
    ledSign.position.set(0, 1.30, 0.68);
    frontCab.add(signBox, ledSign);

    // Para-choque / Piloto Dianteiro de Aço Robusto em Cunha (Cowcatcher 3D)
    const bumperMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.55, 0.55), bumperMat);
    bumper.position.set(0, -1.05, 0.72);

    // Frisos Horizontais do Para-choque
    [-0.15, 0.15].forEach(by => {
      const bFriso = new THREE.Mesh(new THREE.BoxGeometry(2.20, 0.06, 0.08), corrugatedMat);
      bFriso.position.set(0, by, 0.28);
      bumper.add(bFriso);
    });

    // Pino / Engate de Tração Central 3D (Coupler)
    const coupler = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.55), windowFrameMat);
    coupler.position.set(0, -1.15, 1.05);

    frontCab.add(bumper, coupler);

    // Viseira Aerodinâmica Superior
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(2.44, 0.25, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
    );
    visor.position.set(0, 1.55, 0.35);
    frontCab.add(visor);

    // Espelhos Retrovisores / Câmeras de Bordo nas Extremidades
    [-1.24, 1.24].forEach(mx => {
      const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8), doorFrameMat);
      mirrorStem.rotation.z = mx > 0 ? -Math.PI / 3 : Math.PI / 3;
      mirrorStem.position.set(mx, 0.65, 0.35);

      const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.15), doorFrameMat);
      mirrorHead.position.set(mx > 0 ? mx + 0.12 : mx - 0.12, 0.72, 0.35);

      frontCab.add(mirrorStem, mirrorHead);
    });

    // Faróis Duplos Xenon Projetores com Moldura Cromada Robusta
    const headlightBezelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    [-0.75, 0.75].forEach(hx => {
      const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16), headlightBezelMat);
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(hx, -0.45, 0.66);

      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.14, 16), this.materials.headlight);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(hx, -0.45, 0.70);

      frontCab.add(bezel, lamp);
    });

    // Luz de Alerta Central Superior
    const topBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.1), new THREE.MeshBasicMaterial({
      color: 0xfef08a
    }));
    topBeacon.position.set(0, 1.48, 0.65);
    frontCab.add(topBeacon);

    // Feixe Volumétrico de Luz dos Faróis (Projeção Consecutiva para Frente)
    const beamGeo = new THREE.ConeGeometry(2.4, 14.0, 10, 1, true);
    const beam = new THREE.Mesh(beamGeo, this.materials.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, -0.45, 7.6);
    frontCab.add(beam);

    train.add(frontCab);

    // 3. LUZES TRASEIRAS VERMELHAS (LEDs de Cauda)
    [-0.75, 0.75].forEach(rx => {
      const tailLamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.4 })
      );
      tailLamp.rotation.x = Math.PI / 2;
      tailLamp.position.set(rx, -0.45, -8.63);
      train.add(tailLamp);
    });

    // 4. MÓDULOS DE AR-CONDICIONADO DUPLOS (HVAC) & PANTÓGRAFO NO TETO
    const hvacMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const hvacGrilleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });

    [-4.2, 4.2].forEach(hz => {
      const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 2.6), hvacMat);
      hvac.position.set(0, 1.68, hz);
      hvac.castShadow = true;

      const grille = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 2.0), hvacGrilleMat);
      grille.position.set(0, 1.83, hz);

      train.add(hvac, grille);
    });

    // Tubulação / Conector Elétrico Central no Teto
    const roofPipe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 14.0), hvacMat);
    roofPipe.position.set(0.65, 1.62, 0);
    train.add(roofPipe);

    // 5. TRUQUES MECÂNICOS INFERIORES (BOGIES COM RODAS DE AÇO E RESERVATÓRIOS)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const bogieFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.4 });

    [-5.0, 5.0].forEach(bz => {
      const bogie = new THREE.Group();
      bogie.position.set(0, -1.35, bz);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.25, 2.8), bogieFrameMat);
      bogie.add(frame);

      // 4 Rodas de Trem de Aço por Bogie
      [-0.95, 0.95].forEach(wx => {
        [-0.9, 0.9].forEach(wz => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 16), wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0, wz);
          bogie.add(wheel);
        });
      });

      // Cilindro do Freio de Ar
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.6, 12), hvacMat);
      tank.rotation.x = Math.PI / 2;
      tank.position.set(0, -0.05, 0);
      bogie.add(tank);

      train.add(bogie);
    });

    // 6. RAMPA DE ACESSO TRASEIRA COM FAIXAS ZEBRADAS (Permite Subir e Correr no Teto!)
    const rampGroup = new THREE.Group();
    rampGroup.position.set(0, -0.15, -9.8);

    const rampMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.18, 3.8),
      new THREE.MeshStandardMaterial({
        map: textureAtlas.trainRamp,
        metalness: 0.6,
        roughness: 0.35,
        side: THREE.DoubleSide
      })
    );
    rampMesh.position.set(0, 0.85, 0);
    rampMesh.rotation.x = Math.PI / 7.2;
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    rampGroup.add(rampMesh);

    train.add(rampGroup);

    // 7. MOEDAS DE OURO NO TETO DO VAGÃO (Recompensa por surfar no teto!)
    for (let rz = -4.5; rz <= 4.5; rz += 3.0) {
      if (Math.random() > 0.25) {
        this.createRoofCoin(parent, laneX, localZ + rz);
      }
    }

    parent.add(train);

    const obstacleObj = {
      name: theme.name,
      type: 'train',
      mesh: train,
      parent: parent,
      laneX: laneX,
      localZ: localZ,
      isMoving: isMoving,
      moveSpeed: isMoving ? 15 : 0,
      hornPlayed: false,
      passSoundPlayed: false,
      getAABB() {
        const pz = parent.position.z + train.position.z;
        return {
          minX: laneX - (2.35 * 0.85) / 2,
          maxX: laneX + (2.35 * 0.85) / 2,
          minY: 0,
          maxY: 3.40,
          minZ: pz - 9.2,
          maxZ: pz + 9.8
        };
      }
    };

    this.obstacles.push(obstacleObj);
    if (isMoving) {
      this.movingTrains.push(obstacleObj);
    }
  }

  // 1.1 MOEDAS DE OURO SOBRE O TETO DO TREM
  createRoofCoin(parent, laneX, localZ) {
    const coin = new THREE.Mesh(this.geometries.coinCore, this.materials.goldCoin);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(laneX, 3.65, localZ);
    coin.castShadow = true;

    const rim = new THREE.Mesh(this.geometries.coinRim, this.materials.goldCoinRim);
    coin.add(rim);

    parent.add(coin);

    this.coins.push({
      type: 'coin',
      value: 1,
      mesh: coin,
      parent: parent,
      laneX: laneX,
      localZ: localZ,
      isPicanha: false,
      collected: false,
      getAABB() {
        const pz = parent.position.z + coin.position.z;
        return {
          minX: laneX - 0.45,
          maxX: laneX + 0.45,
          minY: 3.2,
          maxY: 4.2,
          minZ: pz - 0.45,
          maxZ: pz + 0.45
        };
      }
    });
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

  // 4. OBSTÁCULO AÉREO: PLACA DE TRÂNSITO "🛑 STOP / PARE" (Passa por baixo com slide ou pula por cima)
  createClotheslineObstacle(parent, laneX, localZ) {
    const barrierGroup = new THREE.Group();
    barrierGroup.position.set(laneX, 1.70, localZ);

    // 1. Postes Laterais Metálicos de Sustentação
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    [-1.25, 1.25].forEach(px => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 10), poleMat);
      pole.position.set(px, -0.60, 0);
      barrierGroup.add(pole);

      // Base pesada de borracha/concreto
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.12, 12), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
      base.position.set(px, -1.64, 0);
      barrierGroup.add(base);
    });

    // Barra Transversal Superior
    const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 10), poleMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.set(0, 0.48, 0);
    barrierGroup.add(topBar);

    // 2. Placa Central Vermelha com Logo "🛑 STOP" e Faixas Zebradas Reflexivas
    const signGeo = new THREE.BoxGeometry(2.35, 0.85, 0.08);
    const signFrontMat = new THREE.MeshLambertMaterial({
      map: textureAtlas.stopSignTexture
    });
    const signBackMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const signSideMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });

    const signMesh = new THREE.Mesh(signGeo, [
      signSideMat,
      signSideMat,
      signSideMat,
      signSideMat,
      signFrontMat, // Frente voltada para o jogador (+Z)
      signBackMat
    ]);
    signMesh.position.set(0, 0.0, 0);
    signMesh.castShadow = true;
    barrierGroup.add(signMesh);

    // 3. Lâmpadas de Alerta Superiores Amarelas
    [-0.95, 0.95].forEach(lx => {
      const lampBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.06, 12), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
      lampBezel.rotation.x = Math.PI / 2;
      lampBezel.position.set(lx, 0.50, 0.06);

      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      lamp.position.set(lx, 0.50, 0.08);

      barrierGroup.add(lampBezel, lamp);
    });

    parent.add(barrierGroup);

    this.obstacles.push({
      name: 'Barreira STOP',
      type: 'clothesline',
      mesh: barrierGroup,
      parent: parent,
      laneX: laneX,
      localZ: localZ,
      isOverhead: true,
      getAABB() {
        const pz = parent.position.z + barrierGroup.position.z;
        return {
          minX: laneX - 1.15,
          maxX: laneX + 1.15,
          minY: 1.10,
          maxY: 2.30,
          minZ: pz - 0.35,
          maxZ: pz + 0.35
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
    let coinGroup;
    if (this.coinPool.length > 0) {
      coinGroup = this.coinPool.pop();
      coinGroup.visible = true;
    } else {
      coinGroup = new THREE.Group();
      const core = new THREE.Mesh(this.geometries.coinCore, this.materials.goldCoin);
      core.rotation.x = Math.PI / 2;
      core.castShadow = true;
      core.receiveShadow = true;

      const rim = new THREE.Mesh(this.geometries.coinRim, this.materials.goldCoinRim);
      rim.castShadow = true;
      rim.receiveShadow = true;

      coinGroup.add(core, rim);
    }

    coinGroup.position.set(laneX, y, localZ);
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
        const px = coinGroup.position.x;
        const py = coinGroup.position.y;
        return {
          minX: px - 0.8, maxX: px + 0.8,
          minY: py - 0.8, maxY: py + 0.8,
          minZ: pz - 0.8, maxZ: pz + 0.8
        };
      }
    });
  }

  spawnCoinParticles(x, y, z, parent) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      let pMesh;
      if (this.particlePool.length > 0) {
        pMesh = this.particlePool.pop();
        pMesh.visible = true;
        pMesh.scale.set(1, 1, 1);
      } else {
        pMesh = new THREE.Mesh(this.geometries.particle, this.materials.goldParticle);
      }

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
        life: 0.40,
        maxLife: 0.40
      });
    }
  }

  createPicanhaCollectible(parent, laneX, localZ) {
    const picanhaGroup = new THREE.Group();
    picanhaGroup.position.set(laneX, 1.05, localZ);

    // 1. Corpo da Carne da Picanha 3D Realista (Formato clássico chanfrado)
    const meatShape = new THREE.Shape();
    meatShape.moveTo(-0.55, -0.28);
    meatShape.quadraticCurveTo(-0.65, 0.12, -0.45, 0.38);
    meatShape.quadraticCurveTo(0.0, 0.50, 0.55, 0.36);
    meatShape.quadraticCurveTo(0.68, 0.10, 0.50, -0.28);
    meatShape.quadraticCurveTo(0.0, -0.40, -0.55, -0.28);

    const meatGeo = new THREE.ExtrudeGeometry(meatShape, {
      steps: 1,
      depth: 0.36,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 3
    });
    meatGeo.center();

    const picanhaMeatMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.32,
      metalness: 0.12,
      emissive: 0x450a0a,
      emissiveIntensity: 0.25
    });
    const meatMesh = new THREE.Mesh(meatGeo, picanhaMeatMat);
    meatMesh.castShadow = true;
    picanhaGroup.add(meatMesh);

    // 2. Capa de Gordura Dourada/Branca Tradicional no Topo
    const fatShape = new THREE.Shape();
    fatShape.moveTo(-0.48, 0.30);
    fatShape.quadraticCurveTo(0.0, 0.56, 0.56, 0.30);
    fatShape.quadraticCurveTo(0.52, 0.44, 0.0, 0.62);
    fatShape.quadraticCurveTo(-0.44, 0.44, -0.48, 0.30);

    const fatGeo = new THREE.ExtrudeGeometry(fatShape, {
      steps: 1,
      depth: 0.40,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2
    });
    fatGeo.center();

    const picanhaFatMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.38,
      metalness: 0.08,
      emissive: 0xca8a04,
      emissiveIntensity: 0.30
    });
    const fatMesh = new THREE.Mesh(fatGeo, picanhaFatMat);
    fatMesh.position.set(0, 0.22, 0);
    picanhaGroup.add(fatMesh);

    // 3. Anel de Brilho Dourado do Churrasco
    const ringGeo = new THREE.TorusGeometry(0.70, 0.02, 6, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.60 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    picanhaGroup.add(ring);

    picanhaGroup.rotation.set(0.25, 0, 0.15);
    parent.add(picanhaGroup);

    this.coins.push({
      mesh: picanhaGroup,
      parent: parent,
      laneX: laneX,
      baseY: 1.05,
      y: 1.05,
      value: 5,
      collected: false,
      isPicanha: true,
      getAABB() {
        const pz = parent.position.z + picanhaGroup.position.z;
        const px = picanhaGroup.position.x;
        const py = picanhaGroup.position.y;
        return {
          minX: px - 0.9, maxX: px + 0.9,
          minY: py - 0.6, maxY: py + 0.8,
          minZ: pz - 0.9, maxZ: pz + 0.9
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

    // C. Verificação de Pouso/Andar em Cima dos Vagões de Trem ou Caminhões (Mecânica Subway Surfers)
    let onTrainTop = false;
    let trainRoofY = 0;

    for (const obs of this.obstacles) {
      if (obs.type === 'train' || obs.type === 'truck') {
        const obsAABB = obs.getAABB();
        const overTrainX = (player.x + 0.40) > obsAABB.minX && (player.x - 0.40) < obsAABB.maxX;
        const overTrainZ = (player.z + 0.40) > obsAABB.minZ && (player.z - 0.40) < obsAABB.maxZ;

        if (overTrainX && overTrainZ) {
          // O jogador está sobre a projeção do veículo pesado
          if (player.y >= obsAABB.maxY - 0.45) {
            onTrainTop = true;
            trainRoofY = Math.max(trainRoofY, obsAABB.maxY);
          }
        }
      }
    }

    if (onTrainTop) {
      player.groundY = trainRoofY;
      if (player.y <= trainRoofY) {
        player.y = trainRoofY;
        player.isJumping = false;
        player.jumpVelocity = 0;
      }
    } else {
      player.groundY = 0;
    }

    // D. Verificação AABB Precisa de Colisão (Ignora se estiver no teto do veículo)
    if (!player.isDead) {
      for (const obs of this.obstacles) {
        const obsAABB = obs.getAABB();

        const collisionX = playerAABB.maxX > obsAABB.minX && playerAABB.minX < obsAABB.maxX;
        const collisionZ = playerAABB.maxZ > obsAABB.minZ && playerAABB.minZ < obsAABB.maxZ;

        if (obs.type === 'train' || obs.type === 'truck') {
          // Se o jogador estiver acima do teto do trem ou caminhão, está correndo por cima!
          if (player.y >= obsAABB.maxY - 0.35) {
            continue;
          }
          const collisionY = playerAABB.maxY > obsAABB.minY && playerAABB.minY < obsAABB.maxY;
          if (collisionX && collisionY && collisionZ) {
            onCrash(obs);
            break;
          }
        } else {
          const collisionY = playerAABB.maxY > obsAABB.minY && playerAABB.minY < obsAABB.maxY;
          if (collisionX && collisionY && collisionZ) {
            onCrash(obs);
            break;
          }
        }
      }
    }

    // E. Coleta de Moedas e Picanhas com Atração Ímã Agressiva 3D e Partículas
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin.collected) continue;

      const coinWorldZ = coin.parent.position.z + coin.mesh.position.z;

      coin.mesh.rotation.y += 3.6 * dt;
      if (coin.baseY !== undefined && !player.magnetActive) {
        coin.mesh.position.y = coin.baseY + Math.sin(elapsedTime * 4.2 + coin.laneX) * 0.08;
      }

      // ATRAÇÃO MAGNÉTICA EM 3D (X, Y, Z) COM PULL FORTE
      if (player.magnetActive && !player.isDead) {
        const distZ = Math.abs(player.z - coinWorldZ);
        if (distZ < 32) {
          const attractRate = 22.0 * dt;
          coin.mesh.position.x += (player.x - coin.mesh.position.x) * Math.min(1.0, attractRate);
          coin.mesh.position.y += ((player.y + 0.9) - coin.mesh.position.y) * Math.min(1.0, attractRate);
          coin.mesh.position.z += ((player.z - coin.parent.position.z) - coin.mesh.position.z) * Math.min(1.0, 16.0 * dt);
        }
      }

      const curCoinWorldZ = coin.parent.position.z + coin.mesh.position.z;
      const distToPlayer = Math.hypot(
        player.x - coin.mesh.position.x,
        (player.y + 0.9) - coin.mesh.position.y,
        player.z - curCoinWorldZ
      );

      const coinAABB = coin.getAABB();
      const overlapX = playerAABB.maxX > coinAABB.minX && playerAABB.minX < coinAABB.maxX;
      const overlapY = playerAABB.maxY > coinAABB.minY && playerAABB.minY < coinAABB.maxY;
      const overlapZ = playerAABB.maxZ > coinAABB.minZ && playerAABB.minZ < coinAABB.maxZ;

      if ((overlapX && overlapY && overlapZ) || distToPlayer < 1.7) {
        coin.collected = true;
        this.spawnCoinParticles(coin.mesh.position.x, coin.mesh.position.y, coin.mesh.position.z, coin.parent);
        coin.parent.remove(coin.mesh);
        if (!coin.isPicanha && this.coinPool.length < 50) {
          coin.mesh.visible = false;
          this.coinPool.push(coin.mesh);
        }
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
        if (this.particlePool.length < 60) {
          p.mesh.visible = false;
          this.particlePool.push(p.mesh);
        }
        this.particles.splice(i, 1);
      }
    }
  }

  reset() {
    this.obstacles.forEach(o => o.parent?.remove(o.mesh));
    this.coins.forEach(c => {
      c.parent?.remove(c.mesh);
      if (!c.isPicanha && this.coinPool.length < 50) {
        c.mesh.visible = false;
        this.coinPool.push(c.mesh);
      }
    });
    this.powerups.forEach(p => p.parent?.remove(p.mesh));
    this.particles.forEach(p => {
      p.parent?.remove(p.mesh);
      if (this.particlePool.length < 60) {
        p.mesh.visible = false;
        this.particlePool.push(p.mesh);
      }
    });
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.particles = [];
    this.movingTrains = [];
  }

  dispose() {
    this.reset();
    this.coinPool.forEach(mesh => {
      mesh.traverse(child => {
        if (child.isMesh) {
          child.geometry?.dispose();
        }
      });
    });
    this.particlePool.forEach(mesh => {
      mesh.geometry?.dispose();
    });
    this.coinPool = [];
    this.particlePool = [];

    for (const key in this.geometries) {
      this.geometries[key]?.dispose();
    }
    for (const key in this.materials) {
      const mat = this.materials[key];
      if (Array.isArray(mat)) mat.forEach(m => m?.dispose());
      else mat?.dispose();
    }
    this.picanhaTexture?.dispose();
  }
}
