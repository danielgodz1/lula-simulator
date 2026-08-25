// js/game/environment.js — Favela Realista 3D: Casas com Portas, Janelas, Escadarias, Lajes com Vergalhões, Varais de Roupa e Fios Suspensos
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LANES } from './character.js';
import { textureAtlas } from './textures.js';

export const SEGMENT_LENGTH = 85;
export const TOTAL_SEGMENTS = 4;

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];

    // Geometrias Unitárias Reutilizáveis (Zero Memory Leak / Zero GC)
    this.unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.unitTankGeo = new THREE.CylinderGeometry(1.15, 1.05, 1.4, 10);
    this.unitWindowGeo = new THREE.PlaneGeometry(1.4, 1.2);
    this.unitDoorGeo = new THREE.PlaneGeometry(1.6, 2.4);
    this.unitRebarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5);
    this.unitACGeo = new THREE.BoxGeometry(0.9, 0.65, 0.45);
    this.unitStairStepGeo = new THREE.BoxGeometry(1.8, 0.28, 0.48);
    this.unitRailingGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 4);
    this.unitMeterBoxGeo = new THREE.BoxGeometry(0.35, 0.50, 0.18);
    this.unitClothGeo = new THREE.PlaneGeometry(0.48, 0.65);

    // Geometrias de Cabos Pré-calculadas
    this.prebuiltCableGeos = this.createPrebuiltCableGeometries();

    // Materiais Compartilhados Globais
    this.sharedMaterials = {
      asphalt: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      gravel: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      curb: new THREE.MeshLambertMaterial({ color: 0xcbd5e1 }),
      yellowStripe: new THREE.MeshBasicMaterial({ color: 0xfde047 }),
      railTie: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      steelRail: new THREE.MeshPhongMaterial({ color: 0xf8fafc, specular: 0xffffff, shininess: 80 }),
      concreteWall: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      graffitiWall: new THREE.MeshLambertMaterial({ map: textureAtlas.atlasTexture }),
      waterTank: new THREE.MeshLambertMaterial({ map: textureAtlas.waterTankTexture, color: 0x0284c7 }),
      concretePole: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      dumpster: new THREE.MeshLambertMaterial({ color: 0x16a34a }),
      rebar: new THREE.MeshLambertMaterial({ map: textureAtlas.rebarTexture, color: 0x9a3412 }),
      concreteSlab: new THREE.MeshLambertMaterial({ map: textureAtlas.concreteSlabTexture, color: 0x94a3b8 }),
      brickHouse: new THREE.MeshLambertMaterial({ map: textureAtlas.brickRedTexture, color: 0xffffff }),
      houseBase: new THREE.MeshLambertMaterial(),
      windowMat: new THREE.MeshBasicMaterial({ map: textureAtlas.facadeWindowTexture }),
      doorMat: new THREE.MeshLambertMaterial({ map: textureAtlas.doorTexture }),
      rollerDoorMat: new THREE.MeshLambertMaterial({ map: textureAtlas.rollerDoorTexture }),
      corrugatedRoofMat: new THREE.MeshLambertMaterial({ map: textureAtlas.corrugatedRoofTexture }),
      transformerMat: new THREE.MeshLambertMaterial({ map: textureAtlas.transformerTexture }),
      streetLampMat: new THREE.MeshBasicMaterial({ color: 0xffedd5 }),
      cableBlack: new THREE.MeshBasicMaterial({ color: 0x090d16 }),
      insulatorBrown: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      acUnit: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
      stairConcrete: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      darkRailing: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      meterBox: new THREE.MeshLambertMaterial({ color: 0x475569 }),
      clothes: [
        new THREE.MeshLambertMaterial({ color: 0xef4444, side: THREE.DoubleSide }),
        new THREE.MeshLambertMaterial({ color: 0x3b82f6, side: THREE.DoubleSide }),
        new THREE.MeshLambertMaterial({ color: 0xfacc15, side: THREE.DoubleSide }),
        new THREE.MeshLambertMaterial({ color: 0x22c55e, side: THREE.DoubleSide }),
        new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })
      ]
    };

    this.houseColors = [
      0xf59e0b, // Amarelo Solar Dourado
      0xea580c, // Laranja Queimado
      0x0284c7, // Azul Royal Carioca
      0x10b981, // Verde Esmeralda Tropical
      0xec4899, // Rosa Pink Carioca
      0x8b5cf6, // Roxo Açaí
      0xf43f5e, // Vermelho Coral
      0x06b6d4, // Ciano Turquesa
      0xca8a04  // Ocre Solar
    ];

    this.init();
  }

  createPrebuiltCableGeometries() {
    const geos = [];
    const cableOffsets = [
      { y: 9.8, sag: 0.45 },
      { y: 9.8, sag: 0.45 },
      { y: 9.8, sag: 0.45 },
      { y: 8.2, sag: 0.60 },
      { y: 7.9, sag: 0.65 }
    ];

    cableOffsets.forEach(co => {
      const points = [];
      const steps = 18;
      for (let i = 0; i <= steps; i++) {
        const z = -SEGMENT_LENGTH / 2 + (i / steps) * SEGMENT_LENGTH;
        const wave = Math.sin((i / steps) * Math.PI * 3);
        const y = co.y - Math.abs(wave) * co.sag;
        points.push(new THREE.Vector3(0, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      geos.push(new THREE.TubeGeometry(curve, 20, 0.032, 4, false));
    });

    return geos;
  }

  init() {
    this.buildInitialTrack();
  }

  buildInitialTrack() {
    for (const seg of this.segments) this.scene.remove(seg);
    this.segments = [];

    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      const segZ = -i * SEGMENT_LENGTH;
      const seg = this.createFavelaSegment(segZ);
      this.segments.push(seg);
      this.scene.add(seg);
    }
  }

  createFavelaSegment(zPos) {
    const segment = new THREE.Group();
    segment.position.z = zPos;

    // 1. Asfalto
    const groundGeo = new THREE.PlaneGeometry(150, SEGMENT_LENGTH);
    const ground = new THREE.Mesh(groundGeo, this.sharedMaterials.asphalt);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    segment.add(ground);

    // 2. Brita
    const trackWidth = 10.2;
    const gravelGeo = new THREE.PlaneGeometry(trackWidth, SEGMENT_LENGTH);
    const gravel = new THREE.Mesh(gravelGeo, this.sharedMaterials.gravel);
    gravel.rotation.x = -Math.PI / 2;
    gravel.position.y = 0.01;
    gravel.receiveShadow = true;
    segment.add(gravel);

    // 3. Calçadas
    [-6.4, 6.4].forEach(cx => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, SEGMENT_LENGTH), this.sharedMaterials.curb);
      curb.position.set(cx, 0.11, 0);
      curb.receiveShadow = true;
      segment.add(curb);
    });

    // 4. Faixas Amarelas
    [-9.6, 9.6].forEach(sx => {
      for (let dz = -SEGMENT_LENGTH / 2 + 3; dz < SEGMENT_LENGTH / 2; dz += 8) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 4.0), this.sharedMaterials.yellowStripe);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(sx, 0.02, dz);
        segment.add(stripe);
      }
    });

    // 5. Trilhos Instanciados
    this.createInstancedTracks(segment);

    // 6. Muretas com Grafites
    [-5.4, 5.4].forEach((wx, sideIdx) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, SEGMENT_LENGTH), this.sharedMaterials.concreteWall);
      wall.position.set(wx, 0.55, 0);
      wall.receiveShadow = true;
      segment.add(wall);

      for (let gz = -SEGMENT_LENGTH / 2 + 10; gz < SEGMENT_LENGTH / 2; gz += 20) {
        const grafGeo = new THREE.PlaneGeometry(3.6, 0.9);
        const grafMesh = new THREE.Mesh(grafGeo, this.sharedMaterials.graffitiWall);
        grafMesh.position.set(wx + (sideIdx === 0 ? 0.22 : -0.22), 0.55, gz);
        grafMesh.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
        segment.add(grafMesh);
      }
    });

    // 7. Favela 3D Realista com Escadarias, Portas, Janelas, Varandas e Varais
    this.buildFavelaHouses(segment);

    // 8. Postes com Transformadores, Lâmpadas e Fios Suspensos
    this.buildStreetPropsAndPowerLines(segment);

    return segment;
  }

  createInstancedTracks(segment) {
    const tieGeometry = new THREE.BoxGeometry(2.3, 0.12, 0.38);
    const tiesPerLane = Math.floor(SEGMENT_LENGTH / 2.5);
    const totalTies = tiesPerLane * LANES.length;

    const instancedTies = new THREE.InstancedMesh(tieGeometry, this.sharedMaterials.railTie, totalTies);
    instancedTies.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    LANES.forEach(laneX => {
      for (let z = -SEGMENT_LENGTH / 2 + 1.25; z < SEGMENT_LENGTH / 2; z += 2.5) {
        dummy.position.set(laneX, 0.06, z);
        dummy.updateMatrix();
        instancedTies.setMatrixAt(idx++, dummy.matrix);
      }
    });
    segment.add(instancedTies);

    LANES.forEach(laneX => {
      [-0.75, 0.75].forEach(railOffset => {
        const railGeo = new THREE.BoxGeometry(0.12, 0.18, SEGMENT_LENGTH);
        const rail = new THREE.Mesh(railGeo, this.sharedMaterials.steelRail);
        rail.position.set(laneX + railOffset, 0.15, 0);
        rail.receiveShadow = true;
        segment.add(rail);
      });
    });
  }

  buildFavelaHouses(segment) {
    const paintedHouseConfigs = [];
    const brickHouseConfigs = [];
    const slabConfigs = [];
    const tankConfigs = [];
    const windowConfigs = [];
    const doorConfigs = [];
    const rollerDoorConfigs = [];
    const rebarConfigs = [];
    const acConfigs = [];
    const meterBoxConfigs = [];
    const stairStepConfigs = [];
    const railingConfigs = [];
    const roofConfigs = [];

    [-11.5, 11.5, -19.5, 19.5, -29.5, 29.5, -41.0, 41.0].forEach((baseX) => {
      const isLeft = baseX < 0;
      const distLayer = Math.abs(baseX);
      const elevationBase = (distLayer - 10) * 0.48;
      const stepZ = distLayer > 16 ? 16 : 18;

      let prevHouseY = elevationBase;
      let prevHouseZ = -SEGMENT_LENGTH / 2;

      for (let bz = -SEGMENT_LENGTH / 2 + 8; bz < SEGMENT_LENGTH / 2; bz += stepZ) {
        const floors = Math.floor(Math.random() * 3) + 2;
        let currentY = elevationBase;
        const isBrickHouse = Math.random() > 0.40;

        for (let f = 0; f < floors; f++) {
          const w = 7.2 + (Math.random() * 1.6 - 0.8);
          const h = 3.4;
          const d = 10.2 + (Math.random() * 1.6 - 0.8);
          // Efeito de balanço / recuo 3D em cada andar
          const ox = (f > 0 ? (Math.random() * 0.8 - 0.4) : 0);
          const color = this.houseColors[Math.floor(Math.random() * this.houseColors.length)];

          const config = {
            x: baseX + ox,
            y: currentY + h / 2,
            z: bz,
            scaleX: w,
            scaleY: h,
            scaleZ: d,
            color: color
          };

          if (isBrickHouse && f >= 1) {
            brickHouseConfigs.push(config);
          } else {
            paintedHouseConfigs.push(config);
          }

          // Laje de concreto com beiral
          slabConfigs.push({
            x: baseX + ox,
            y: currentY + h,
            z: bz,
            scaleX: w + 0.45,
            scaleY: 0.24,
            scaleZ: d + 0.45
          });

          // Térreo: Portas e Relógio de Luz
          if (f === 0) {
            const isStore = Math.random() > 0.5;
            if (isStore) {
              rollerDoorConfigs.push({
                x: baseX + ox + (isLeft ? w / 2 + 0.08 : -w / 2 - 0.08),
                y: currentY + 1.25,
                z: bz,
                rotY: isLeft ? Math.PI / 2 : -Math.PI / 2
              });
            } else {
              doorConfigs.push({
                x: baseX + ox + (isLeft ? w / 2 + 0.08 : -w / 2 - 0.08),
                y: currentY + 1.25,
                z: bz - 1.8,
                rotY: isLeft ? Math.PI / 2 : -Math.PI / 2
              });
              // Janela ao lado da porta
              windowConfigs.push({
                x: baseX + ox + (isLeft ? w / 2 + 0.08 : -w / 2 - 0.08),
                y: currentY + 1.7,
                z: bz + 1.8,
                rotY: isLeft ? Math.PI / 2 : -Math.PI / 2
              });
            }

            // Caixa de relógio de luz
            meterBoxConfigs.push({
              x: baseX + ox + (isLeft ? w / 2 + 0.12 : -w / 2 - 0.12),
              y: currentY + 1.3,
              z: bz + (isStore ? 2.4 : -3.0),
              rotY: isLeft ? Math.PI / 2 : -Math.PI / 2
            });
          } else {
            // Andares superiores: Janelas e Sacadas
            [-2.4, 2.4].forEach(wz => {
              windowConfigs.push({
                x: baseX + ox + (isLeft ? w / 2 + 0.08 : -w / 2 - 0.08),
                y: currentY + 1.7,
                z: bz + wz,
                rotY: isLeft ? Math.PI / 2 : -Math.PI / 2
              });
            });

            // Ar Condicionado
            if (f === 1 && Math.random() > 0.4) {
              acConfigs.push({
                x: baseX + ox + (isLeft ? w / 2 + 0.28 : -w / 2 - 0.28),
                y: currentY + 1.0,
                z: bz - 1.2
              });
            }
          }

          currentY += h + 0.24;
        }

        // ESCADARIA DE CONCRETO EXTERIOR (Subindo entre as casas na encosta)
        if (bz > -SEGMENT_LENGTH / 2 + 10) {
          const stairX = baseX + (isLeft ? -3.8 : 3.8);
          const stairZ = (bz + prevHouseZ) / 2;
          const numSteps = 7;
          for (let s = 0; s < numSteps; s++) {
            const stepRatio = s / numSteps;
            const sy = prevHouseY + stepRatio * (currentY - prevHouseY) * 0.7;
            const sz = stairZ - 1.8 + s * 0.52;
            stairStepConfigs.push({ x: stairX, y: sy, z: sz });

            if (s % 3 === 0) {
              railingConfigs.push({ x: stairX + (isLeft ? 0.9 : -0.9), y: sy + 0.55, z: sz });
            }
          }
        }

        // Cobertura: Vergalhões de ferro ou Telhado ondulado
        if (Math.random() > 0.35) {
          const topW = 6.8;
          const topD = 9.8;
          [[-topW / 2 + 0.4, -topD / 2 + 0.4], [topW / 2 - 0.4, -topD / 2 + 0.4], [-topW / 2 + 0.4, topD / 2 - 0.4], [topW / 2 - 0.4, topD / 2 - 0.4]].forEach(([rx, rz]) => {
            rebarConfigs.push({
              x: baseX + rx,
              y: currentY + 0.6,
              z: bz + rz
            });
          });
        } else {
          roofConfigs.push({
            x: baseX,
            y: currentY + 0.45,
            z: bz,
            scaleX: 7.6,
            scaleY: 0.5,
            scaleZ: 10.6
          });
        }

        // Caixa d'água Fortlev
        if (Math.random() > 0.2) {
          tankConfigs.push({
            x: baseX + (Math.random() * 1.4 - 0.7),
            y: currentY + 0.7,
            z: bz + (Math.random() * 1.4 - 0.7)
          });
        }

        prevHouseY = currentY;
        prevHouseZ = bz;
      }
    });

    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    // 1. Casas Pintadas Coloridas
    if (paintedHouseConfigs.length > 0) {
      const houseInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.houseBase, paintedHouseConfigs.length);
      for (let i = 0; i < paintedHouseConfigs.length; i++) {
        const c = paintedHouseConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        houseInst.setMatrixAt(i, dummy.matrix);
        col.set(c.color);
        houseInst.setColorAt(i, col);
      }
      houseInst.instanceMatrix.needsUpdate = true;
      if (houseInst.instanceColor) houseInst.instanceColor.needsUpdate = true;
      segment.add(houseInst);
    }

    // 2. Casas de Tijolo Baiano Vermelho Cerâmico
    if (brickHouseConfigs.length > 0) {
      const brickInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.brickHouse, brickHouseConfigs.length);
      for (let i = 0; i < brickHouseConfigs.length; i++) {
        const c = brickHouseConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        brickInst.setMatrixAt(i, dummy.matrix);
      }
      brickInst.instanceMatrix.needsUpdate = true;
      segment.add(brickInst);
    }

    // 3. Lajes de Concreto
    if (slabConfigs.length > 0) {
      const slabInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.concreteSlab, slabConfigs.length);
      for (let i = 0; i < slabConfigs.length; i++) {
        const c = slabConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        slabInst.setMatrixAt(i, dummy.matrix);
      }
      slabInst.instanceMatrix.needsUpdate = true;
      segment.add(slabInst);
    }

    // 4. Portas Residenciais de Madeira
    if (doorConfigs.length > 0) {
      const doorInst = new THREE.InstancedMesh(this.unitDoorGeo, this.sharedMaterials.doorMat, doorConfigs.length);
      for (let i = 0; i < doorConfigs.length; i++) {
        const c = doorConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        doorInst.setMatrixAt(i, dummy.matrix);
      }
      doorInst.instanceMatrix.needsUpdate = true;
      segment.add(doorInst);
    }

    // 5. Portas de Enrolar Comerciais
    if (rollerDoorConfigs.length > 0) {
      const rollerInst = new THREE.InstancedMesh(this.unitDoorGeo, this.sharedMaterials.rollerDoorMat, rollerDoorConfigs.length);
      for (let i = 0; i < rollerDoorConfigs.length; i++) {
        const c = rollerDoorConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1.4, 1, 1);
        dummy.updateMatrix();
        rollerInst.setMatrixAt(i, dummy.matrix);
      }
      rollerInst.instanceMatrix.needsUpdate = true;
      segment.add(rollerInst);
    }

    // 6. Janelas com Veneziana
    if (windowConfigs.length > 0) {
      const winInst = new THREE.InstancedMesh(this.unitWindowGeo, this.sharedMaterials.windowMat, windowConfigs.length);
      for (let i = 0; i < windowConfigs.length; i++) {
        const c = windowConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        winInst.setMatrixAt(i, dummy.matrix);
      }
      winInst.instanceMatrix.needsUpdate = true;
      segment.add(winInst);
    }

    // 7. Escadarias de Concreto
    if (stairStepConfigs.length > 0) {
      const stairInst = new THREE.InstancedMesh(this.unitStairStepGeo, this.sharedMaterials.stairConcrete, stairStepConfigs.length);
      for (let i = 0; i < stairStepConfigs.length; i++) {
        const c = stairStepConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        stairInst.setMatrixAt(i, dummy.matrix);
      }
      stairInst.instanceMatrix.needsUpdate = true;
      segment.add(stairInst);
    }

    // 8. Corrimão das Escadas
    if (railingConfigs.length > 0) {
      const railInst = new THREE.InstancedMesh(this.unitRailingGeo, this.sharedMaterials.darkRailing, railingConfigs.length);
      for (let i = 0; i < railingConfigs.length; i++) {
        const c = railingConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        railInst.setMatrixAt(i, dummy.matrix);
      }
      railInst.instanceMatrix.needsUpdate = true;
      segment.add(railInst);
    }

    // 9. Relógios de Luz
    if (meterBoxConfigs.length > 0) {
      const meterInst = new THREE.InstancedMesh(this.unitMeterBoxGeo, this.sharedMaterials.meterBox, meterBoxConfigs.length);
      for (let i = 0; i < meterBoxConfigs.length; i++) {
        const c = meterBoxConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meterInst.setMatrixAt(i, dummy.matrix);
      }
      meterInst.instanceMatrix.needsUpdate = true;
      segment.add(meterInst);
    }

    // 10. Vergalhões de Ferro
    if (rebarConfigs.length > 0) {
      const rebarInst = new THREE.InstancedMesh(this.unitRebarGeo, this.sharedMaterials.rebar, rebarConfigs.length);
      for (let i = 0; i < rebarConfigs.length; i++) {
        const c = rebarConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        rebarInst.setMatrixAt(i, dummy.matrix);
      }
      rebarInst.instanceMatrix.needsUpdate = true;
      segment.add(rebarInst);
    }

    // 11. Caixas d'Água Fortlev
    if (tankConfigs.length > 0) {
      const tankInst = new THREE.InstancedMesh(this.unitTankGeo, this.sharedMaterials.waterTank, tankConfigs.length);
      for (let i = 0; i < tankConfigs.length; i++) {
        const c = tankConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        tankInst.setMatrixAt(i, dummy.matrix);
      }
      tankInst.instanceMatrix.needsUpdate = true;
      segment.add(tankInst);
    }

    // 12. Aparelhos de Ar Condicionado
    if (acConfigs.length > 0) {
      const acInst = new THREE.InstancedMesh(this.unitACGeo, this.sharedMaterials.acUnit, acConfigs.length);
      for (let i = 0; i < acConfigs.length; i++) {
        const c = acConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        acInst.setMatrixAt(i, dummy.matrix);
      }
      acInst.instanceMatrix.needsUpdate = true;
      segment.add(acInst);
    }

    // 13. Telhados Ondulados
    if (roofConfigs.length > 0) {
      const roofInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.corrugatedRoofMat, roofConfigs.length);
      for (let i = 0; i < roofConfigs.length; i++) {
        const c = roofConfigs[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        roofInst.setMatrixAt(i, dummy.matrix);
      }
      roofInst.instanceMatrix.needsUpdate = true;
      segment.add(roofInst);
    }
  }

  buildStreetPropsAndPowerLines(segment) {
    [-7.8, 7.8].forEach((px, sideIdx) => {
      const isLeft = sideIdx === 0;

      for (let pz = -SEGMENT_LENGTH / 2 + 14; pz < SEGMENT_LENGTH / 2; pz += 28) {
        // 1. Poste de Concreto Cilíndrico
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 10.5, 8), this.sharedMaterials.concretePole);
        pole.position.set(px, 5.25, pz);
        segment.add(pole);

        // 2. Cruzeta Superior com 3 Isoladores
        const cross = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.16), this.sharedMaterials.railTie);
        cross.position.set(px + (isLeft ? 0.7 : -0.7), 9.6, pz);
        segment.add(cross);

        [-0.9, 0.0, 0.9].forEach(ix => {
          const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.25, 6), this.sharedMaterials.insulatorBrown);
          ins.position.set(px + (isLeft ? 0.7 : -0.7) + ix, 9.8, pz);
          segment.add(ins);
        });

        // 3. Luminária Pública
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), this.sharedMaterials.concretePole);
        arm.position.set(px + (isLeft ? 1.0 : -1.0), 9.0, pz);
        arm.rotation.z = isLeft ? -0.15 : 0.15;
        segment.add(arm);

        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 6), this.sharedMaterials.streetLampMat);
        lamp.position.set(px + (isLeft ? 1.7 : -1.7), 8.8, pz);
        segment.add(lamp);

        // 4. Transformador
        if (pz > -10 && pz < 20) {
          const transf = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.50, 1.4, 10), this.sharedMaterials.transformerMat);
          transf.position.set(px + (isLeft ? -0.55 : 0.55), 7.8, pz);
          segment.add(transf);
        }

        // 5. Caçamba
        if (Math.random() > 0.55) {
          const dumpster = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 2.8), this.sharedMaterials.dumpster);
          dumpster.position.set(px + (isLeft ? -1.5 : 1.5), 0.55, pz + 6);
          segment.add(dumpster);
        }
      }

      // 6. Fios Elétricos Suspensos (Reutiliza Geometrias Pré-compiladas sem Memory Leak)
      const xOffsets = isLeft ? [0.2, 0.7, 1.2, -0.2, 0.0] : [-0.2, -0.7, -1.2, 0.2, 0.0];
      for (let i = 0; i < this.prebuiltCableGeos.length; i++) {
        const cable = new THREE.Mesh(this.prebuiltCableGeos[i], this.sharedMaterials.cableBlack);
        cable.position.set(px + xOffsets[i], 0, 0);
        segment.add(cable);
      }
    });
  }

  update(speed, dt, onRecycleSegment) {
    const moveZ = speed * dt;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      seg.position.z += moveZ;

      if (seg.position.z > SEGMENT_LENGTH) {
        let minZ = 0;
        for (let j = 0; j < this.segments.length; j++) {
          if (this.segments[j].position.z < minZ) {
            minZ = this.segments[j].position.z;
          }
        }

        const newZ = minZ - SEGMENT_LENGTH;
        seg.position.z = newZ;

        if (typeof onRecycleSegment === 'function') {
          onRecycleSegment(seg, newZ);
        }
      }
    }
  }

  updateNightLights(isNight, timeOfDay) {
    const intensity = isNight ? 0.95 : 0.0;
    if (this.sharedMaterials.streetLampMat) {
      this.sharedMaterials.streetLampMat.color.setHex(isNight ? 0xffedd5 : 0x94a3b8);
    }
  }

  reset() {
    this.buildInitialTrack();
  }
}
