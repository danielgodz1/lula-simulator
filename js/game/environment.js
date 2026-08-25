// js/game/environment.js — Favela Realista com Tijolo Baiano, Lajes com Vergalhões, Postes e Rede de Fios Elétricos ("Gatos")
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LANES } from './character.js';
import { textureAtlas } from './textures.js';

export const SEGMENT_LENGTH = 85;
export const TOTAL_SEGMENTS = 4; // 4 segmentos cobrem todo o campo visual de forma contínua

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];

    // Geometrias Unitárias Reutilizáveis
    this.unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.unitTankGeo = new THREE.CylinderGeometry(1.15, 1.05, 1.4, 10);
    this.unitWindowGeo = new THREE.PlaneGeometry(1.4, 1.2);
    this.unitRebarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5);
    this.unitACGeo = new THREE.BoxGeometry(0.9, 0.65, 0.45);

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
      houseBase: new THREE.MeshLambertMaterial(), // Para casas com reboco pintado
      windowMat: new THREE.MeshBasicMaterial({ map: textureAtlas.facadeWindowTexture }),
      transformerMat: new THREE.MeshLambertMaterial({ map: textureAtlas.transformerTexture }),
      streetLampMat: new THREE.MeshBasicMaterial({ color: 0xffedd5 }),
      cableBlack: new THREE.MeshBasicMaterial({ color: 0x090d16 }),
      insulatorBrown: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      acUnit: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 })
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

    // 7. Favela Realista (Tijolos Baianos, Lajes com Esperas de Aço, Caixas d'Água e Janelas com Veneziana)
    this.buildFavelaHouses(segment);

    // 8. Postes de Energia com Transformadores, Lâmpadas e Fios Suspensos ("Gatos")
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
    const rebarConfigs = [];
    const acConfigs = [];

    [-11.5, 11.5, -19.0, 19.0, -29.0, 29.0, -40.0, 40.0].forEach((baseX) => {
      const isLeft = baseX < 0;
      const distLayer = Math.abs(baseX);
      const elevationBase = (distLayer - 10) * 0.45;
      const stepZ = distLayer > 16 ? 15 : 18;

      for (let bz = -SEGMENT_LENGTH / 2 + 8; bz < SEGMENT_LENGTH / 2; bz += stepZ) {
        const floors = Math.floor(Math.random() * 3) + 2;
        let currentY = elevationBase;
        const isBrickHouse = Math.random() > 0.45; // ~50% casas com tijolo baiano aparente

        for (let f = 0; f < floors; f++) {
          const w = 7.0 + (Math.random() * 1.8 - 0.9);
          const h = 3.4;
          const d = 10.0 + (Math.random() * 1.8 - 0.9);
          const ox = (Math.random() * 1.0 - 0.5);
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

          if (isBrickHouse && f === floors - 1) {
            // Último andar frequentemente em tijolo baiano inacabado (muito comum em favelas)
            brickHouseConfigs.push(config);
          } else if (isBrickHouse) {
            brickHouseConfigs.push(config);
          } else {
            paintedHouseConfigs.push(config);
          }

          // Laje de concreto armado
          slabConfigs.push({
            x: baseX + ox,
            y: currentY + h,
            z: bz,
            scaleX: w + 0.4,
            scaleY: 0.24,
            scaleZ: d + 0.4
          });

          // Janelas residenciais com venezianas
          [-2.2, 2.2].forEach(wz => {
            windowConfigs.push({
              x: baseX + ox + (isLeft ? w / 2 + 0.06 : -w / 2 - 0.06),
              y: currentY + 1.7,
              z: bz + wz,
              rotY: isLeft ? Math.PI / 2 : -Math.PI / 2
            });
          });

          // Ar condicionado em algumas fachadas
          if (f === 1 && Math.random() > 0.4) {
            acConfigs.push({
              x: baseX + ox + (isLeft ? w / 2 + 0.25 : -w / 2 - 0.25),
              y: currentY + 1.1,
              z: bz - 1.0
            });
          }

          currentY += h + 0.24;
        }

        // Vergalhões de aço expostos (esperas de coluna para próximo andar) no topo da laje
        const topW = 6.8;
        const topD = 9.8;
        [[-topW / 2 + 0.4, -topD / 2 + 0.4], [topW / 2 - 0.4, -topD / 2 + 0.4], [-topW / 2 + 0.4, topD / 2 - 0.4], [topW / 2 - 0.4, topD / 2 - 0.4]].forEach(([rx, rz]) => {
          rebarConfigs.push({
            x: baseX + rx,
            y: currentY + 0.6,
            z: bz + rz
          });
        });

        // Caixa d'água azul Fortlev no topo da laje
        if (Math.random() > 0.2) {
          tankConfigs.push({
            x: baseX + (Math.random() * 1.4 - 0.7),
            y: currentY + 0.7,
            z: bz + (Math.random() * 1.4 - 0.7)
          });
        }
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

    // 3. Lajes de Concreto Armado
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

    // 4. Vergalhões de Ferro / Esperas de Laje
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

    // 5. Caixas d'Água Fortlev
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

    // 7. Aparelhos de Ar Condicionado
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
  }

  buildStreetPropsAndPowerLines(segment) {
    const polePositionsLeft = [];
    const polePositionsRight = [];

    [-7.8, 7.8].forEach((px, sideIdx) => {
      const isLeft = sideIdx === 0;
      const targetArray = isLeft ? polePositionsLeft : polePositionsRight;

      for (let pz = -SEGMENT_LENGTH / 2 + 14; pz < SEGMENT_LENGTH / 2; pz += 28) {
        targetArray.push({ x: px, y: 9.2, z: pz });

        // 1. Poste de Concreto Cilíndrico Robusto
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 10.5, 8), this.sharedMaterials.concretePole);
        pole.position.set(px, 5.25, pz);
        segment.add(pole);

        // 2. Cruzeta Superior de Alta Tensão com 3 Isoladores
        const cross = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.16), this.sharedMaterials.railTie);
        cross.position.set(px + (isLeft ? 0.7 : -0.7), 9.6, pz);
        segment.add(cross);

        // 3 Isoladores de Porcelana Marrom na Cruzeta
        [-0.9, 0.0, 0.9].forEach(ix => {
          const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.25, 6), this.sharedMaterials.insulatorBrown);
          ins.position.set(px + (isLeft ? 0.7 : -0.7) + ix, 9.8, pz);
          segment.add(ins);
        });

        // 3. Braço Curvo com Luminária Pública de Vapor de Sódio
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), this.sharedMaterials.concretePole);
        arm.position.set(px + (isLeft ? 1.0 : -1.0), 9.0, pz);
        arm.rotation.z = isLeft ? -0.15 : 0.15;
        segment.add(arm);

        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 6), this.sharedMaterials.streetLampMat);
        lamp.position.set(px + (isLeft ? 1.7 : -1.7), 8.8, pz);
        segment.add(lamp);

        // 4. Transformador de Distribuição (Presente em alguns postes estratégicos)
        if (pz > -10 && pz < 20) {
          const transf = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.50, 1.4, 10), this.sharedMaterials.transformerMat);
          transf.position.set(px + (isLeft ? -0.55 : 0.55), 7.8, pz);
          segment.add(transf);
        }

        // 5. Caçamba de Entulho / Lixo
        if (Math.random() > 0.55) {
          const dumpster = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 2.8), this.sharedMaterials.dumpster);
          dumpster.position.set(px + (isLeft ? -1.5 : 1.5), 0.55, pz + 6);
          segment.add(dumpster);
        }
      }
    });

    // 6. REDE DE FIOS ELÉTRICOS SUSPENSOS AO LONGO DOS POSTES (Cabos Contínuos em Catenária)
    [polePositionsLeft, polePositionsRight].forEach((poleList, sideIdx) => {
      const isLeft = sideIdx === 0;
      const basePx = isLeft ? -7.8 : 7.8;

      // Fios longitudinais ao longo do segmento (3 níveis de cabos: Alta tensão + Baixa tensão + Fibra)
      const cableOffsets = [
        { xOff: isLeft ? 0.2 : -0.2, y: 9.8, sag: 0.45 },
        { xOff: isLeft ? 0.7 : -0.7, y: 9.8, sag: 0.45 },
        { xOff: isLeft ? 1.2 : -1.2, y: 9.8, sag: 0.45 },
        { xOff: isLeft ? -0.2 : 0.2, y: 8.2, sag: 0.60 }, // Feixe grosso de baixa tensão
        { xOff: isLeft ? 0.0 : 0.0, y: 7.9, sag: 0.65 }   // Cabo de fibra óptica/telefonia
      ];

      cableOffsets.forEach(co => {
        const points = [];
        const segZStart = -SEGMENT_LENGTH / 2;
        const segZEnd = SEGMENT_LENGTH / 2;
        const steps = 18;

        for (let i = 0; i <= steps; i++) {
          const z = segZStart + (i / steps) * SEGMENT_LENGTH;
          // Curva de catenária natural
          const wave = Math.sin((i / steps) * Math.PI * 3);
          const y = co.y - Math.abs(wave) * co.sag;
          points.push(new THREE.Vector3(basePx + co.xOff, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const cableGeo = new THREE.TubeGeometry(curve, 24, 0.032, 4, false);
        const cableMesh = new THREE.Mesh(cableGeo, this.sharedMaterials.cableBlack);
        segment.add(cableMesh);
      });

      // 7. "GATOS" E FIOS DE LIGAÇÃO CRUZADOS (Conectando dos postes para as casas da favela)
      poleList.forEach(pole => {
        const targetHouseX = isLeft ? pole.x - 3.8 : pole.x + 3.8;
        const targetHouseY = pole.y - 1.8;
        const targetHouseZ = pole.z + (Math.random() * 4 - 2);

        const dropPoints = [
          new THREE.Vector3(pole.x + (isLeft ? -0.2 : 0.2), pole.y - 1.2, pole.z),
          new THREE.Vector3(
            (pole.x + targetHouseX) / 2,
            (pole.y + targetHouseY) / 2 - 0.45,
            (pole.z + targetHouseZ) / 2
          ),
          new THREE.Vector3(targetHouseX, targetHouseY, targetHouseZ)
        ];

        const dropCurve = new THREE.CatmullRomCurve3(dropPoints);
        const dropGeo = new THREE.TubeGeometry(dropCurve, 10, 0.024, 4, false);
        const dropMesh = new THREE.Mesh(dropGeo, this.sharedMaterials.cableBlack);
        segment.add(dropMesh);
      });
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
    if (this.sharedMaterials.windowMat) {
      this.sharedMaterials.windowMat.color.setHex(isNight ? 0xfef08a : 0xffffff);
    }
    if (this.sharedMaterials.streetLampMat) {
      this.sharedMaterials.streetLampMat.color.setHex(isNight ? 0xffedd5 : 0x94a3b8);
    }
  }

  reset() {
    this.buildInitialTrack();
  }
}
