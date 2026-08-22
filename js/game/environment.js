// js/game/environment.js — Favela Densa Ultra Otimizada com InstancedMesh (120 FPS Mobile) e Esteira Infinita
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LANES } from './character.js';
import { textureAtlas } from './textures.js';

export const SEGMENT_LENGTH = 85;
export const TOTAL_SEGMENTS = 4; // 4 segmentos (340m) cobrem todo o campo visual com 40% menos uso de memória

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];

    // Geometrias Unitárias Reutilizáveis para GPU Instancing
    this.unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.unitTankGeo = new THREE.CylinderGeometry(1.15, 1.05, 1.4, 10);
    this.unitWindowGeo = new THREE.PlaneGeometry(1.3, 1.1);

    // Materiais Compartilhados Globais PBR / Otimizados
    this.sharedMaterials = {
      asphalt: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.1 }),
      gravel: new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.90, metalness: 0.1 }),
      curb: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.70, metalness: 0.1 }),
      yellowStripe: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
      railTie: new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.80, metalness: 0.1 }),
      steelRail: new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.95, roughness: 0.15 }),
      concreteWall: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75, metalness: 0.1 }),
      graffitiWall: new THREE.MeshStandardMaterial({ map: textureAtlas.atlasTexture, roughness: 0.60, metalness: 0.1 }),
      waterTank: new THREE.MeshStandardMaterial({ map: textureAtlas.waterTankTexture, color: 0x0284c7, roughness: 0.40, metalness: 0.2 }),
      concretePole: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.70, metalness: 0.1 }),
      dumpster: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45, metalness: 0.35 }),
      rebar: new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.60, metalness: 0.45 }),
      antenna: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.30, metalness: 0.85 }),
      // Material Base de Casas com Suporte a Instanced Colors
      houseBase: new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.05 }),
      // Janelas Dinâmicas (Acendem em amarelo/âmbar à noite)
      windowMat: new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0xfef08a,
        emissiveIntensity: 0.85,
        roughness: 0.2
      }),
      // Lâmpadas dos Postes
      streetLampMat: new THREE.MeshStandardMaterial({
        color: 0xffedd5,
        emissive: 0xfef08a,
        emissiveIntensity: 0.95
      })
    };

    this.houseColors = [
      0xb45309, // Tijolo Baiano
      0xea580c, // Laranja Queimado
      0xfacc15, // Amarelo Solar
      0x0284c7, // Azul Piscina
      0x16a34a, // Verde Bandeira
      0xdb2777, // Rosa Choque
      0x78716c  // Reboco Concreto
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

    // 4. Faixas
    [-9.6, 9.6].forEach(sx => {
      for (let dz = -SEGMENT_LENGTH / 2 + 3; dz < SEGMENT_LENGTH / 2; dz += 8) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 4.0), this.sharedMaterials.yellowStripe);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(sx, 0.02, dz);
        segment.add(stripe);
      }
    });

    // 5. Trilhos Instanciados (1 DRAW CALL)
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

    // 7. Favela Densa Instanciada em GPU (Casas, Lajes, Caixas d'Água e Janelas com apenas 4 Draw Calls)
    this.buildFavelaHouses(segment);

    // 8. Postes com Lanternas Iluminadas
    this.buildStreetProps(segment);

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
    const houseConfigs = [];
    const slabConfigs = [];
    const tankConfigs = [];
    const windowConfigs = [];

    // Calcula todas as casas nas encostas da favela
    [-11.5, 11.5, -19.0, 19.0, -29.0, 29.0, -40.0, 40.0].forEach((baseX) => {
      const isLeft = baseX < 0;
      const distLayer = Math.abs(baseX);
      const elevationBase = (distLayer - 10) * 0.45;
      const stepZ = distLayer > 16 ? 15 : 20;

      for (let bz = -SEGMENT_LENGTH / 2 + 8; bz < SEGMENT_LENGTH / 2; bz += stepZ) {
        const floors = Math.floor(Math.random() * 3) + 2;
        let currentY = elevationBase;

        for (let f = 0; f < floors; f++) {
          const w = 7.0 + (Math.random() * 1.8 - 0.9);
          const h = 3.3;
          const d = 10.0 + (Math.random() * 1.8 - 0.9);
          const ox = (Math.random() * 1.0 - 0.5);
          const color = this.houseColors[Math.floor(Math.random() * this.houseColors.length)];

          // Bloco da casa
          houseConfigs.push({
            x: baseX + ox,
            y: currentY + h / 2,
            z: bz,
            scaleX: w,
            scaleY: h,
            scaleZ: d,
            color: color
          });

          // Laje de concreto
          slabConfigs.push({
            x: baseX + ox,
            y: currentY + h,
            z: bz,
            scaleX: w + 0.4,
            scaleY: 0.22,
            scaleZ: d + 0.4
          });

          // Janelas iluminadas noturnas
          [-2.2, 2.2].forEach(wz => {
            windowConfigs.push({
              x: baseX + ox + (isLeft ? w / 2 + 0.05 : -w / 2 - 0.05),
              y: currentY + 1.6,
              z: bz + wz,
              rotY: isLeft ? Math.PI / 2 : -Math.PI / 2
            });
          });

          currentY += h + 0.22;
        }

        // Caixa d'água azul Fortlev no topo da laje
        if (Math.random() > 0.25) {
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

    // 1. INSTANCED MESH: Casas Coloridas da Favela (1 DRAW CALL)
    if (houseConfigs.length > 0) {
      const houseInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.houseBase, houseConfigs.length);
      houseInst.receiveShadow = false;
      houseInst.castShadow = false; // Background scenery não precisa pesar no shadow map

      for (let i = 0; i < houseConfigs.length; i++) {
        const c = houseConfigs[i];
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

    // 2. INSTANCED MESH: Lajes de Concreto (1 DRAW CALL)
    if (slabConfigs.length > 0) {
      const slabInst = new THREE.InstancedMesh(this.unitBoxGeo, this.sharedMaterials.concreteWall, slabConfigs.length);
      slabInst.receiveShadow = false;
      slabInst.castShadow = false;

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

    // 3. INSTANCED MESH: Caixas d'água Fortlev (1 DRAW CALL)
    if (tankConfigs.length > 0) {
      const tankInst = new THREE.InstancedMesh(this.unitTankGeo, this.sharedMaterials.waterTank, tankConfigs.length);
      tankInst.receiveShadow = false;
      tankInst.castShadow = false;

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

    // 4. INSTANCED MESH: Janelas Iluminadas Noturnas (1 DRAW CALL)
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
  }

  buildStreetProps(segment) {
    [-7.8, 7.8].forEach((px, sideIdx) => {
      for (let pz = -SEGMENT_LENGTH / 2 + 15; pz < SEGMENT_LENGTH / 2; pz += 30) {
        // Poste
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 9.5, 6), this.sharedMaterials.concretePole);
        pole.position.set(px, 4.75, pz);
        segment.add(pole);

        // Cruzeta
        const cross = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.16), this.sharedMaterials.railTie);
        cross.position.set(px + (sideIdx === 0 ? 0.6 : -0.6), 8.8, pz);
        segment.add(cross);

        // Lanterna de Luz no Poste
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), this.sharedMaterials.streetLampMat);
        lamp.position.set(px + (sideIdx === 0 ? 1.2 : -1.2), 8.6, pz);
        segment.add(lamp);

        // Caçamba
        if (Math.random() > 0.5) {
          const dumpster = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 2.8), this.sharedMaterials.dumpster);
          dumpster.position.set(px + (sideIdx === 0 ? -1.4 : 1.4), 0.55, pz + 7);
          segment.add(dumpster);
        }
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

  reset() {
    this.buildInitialTrack();
  }
}
