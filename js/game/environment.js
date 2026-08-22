// js/game/environment.js — Cenário Modular e Estilizado de Favela Carioca com Instanced Rendering e Object Pooling
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LANES } from './character.js';
import { textureAtlas } from './textures.js';

export const SEGMENT_LENGTH = 85;
export const TOTAL_SEGMENTS = 6;

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.textureLoader = new THREE.TextureLoader();
    this.favelaBackdropTexture = this.textureLoader.load('img/favela.png');

    // Materiais Compartilhados Globais (Zero Garbage Collection)
    this.sharedMaterials = {
      asphalt: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      gravel: new THREE.MeshLambertMaterial({ color: 0x3f3f46 }),
      curb: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      yellowStripe: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
      railTie: new THREE.MeshLambertMaterial({ color: 0x5c3a21 }),
      steelRail: new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 }),
      concreteWall: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      graffitiWall: new THREE.MeshLambertMaterial({ map: textureAtlas.atlasTexture }),
      waterTank: new THREE.MeshLambertMaterial({ map: textureAtlas.waterTankTexture, color: 0x0284c7 }),
      concretePole: new THREE.MeshLambertMaterial({ color: 0x475569 }),
      wire: new THREE.LineBasicMaterial({ color: 0x0f172a, linewidth: 1.5 }),
      dumpster: new THREE.MeshLambertMaterial({ color: 0x16a34a }),
      rebar: new THREE.MeshLambertMaterial({ color: 0x9a3412 }) // Vergalhões enferrujados da laje
    };

    // Cores das casas de comunidade
    this.houseColors = [
      0xb45309, // Tijolo Baiano
      0xea580c, // Laranja Queimado
      0xfacc15, // Amarelo
      0x0284c7, // Azul
      0x16a34a, // Verde
      0xdb2777, // Rosa
      0x78716c  // Reboco Concreto
    ];

    this.houseMaterials = this.houseColors.map(c => new THREE.MeshLambertMaterial({ color: c }));

    this.init();
  }

  init() {
    this.createFavelaBackdrop();
    this.buildInitialTrack();
  }

  // 1. CAMADA DE PROFUNDIDADE 1: PANORAMA DO MORRO CARIOCA
  createFavelaBackdrop() {
    const bgGeo = new THREE.CylinderGeometry(320, 320, 180, 32, 1, true, -Math.PI / 2, Math.PI);
    const bgMat = new THREE.MeshBasicMaterial({
      map: this.favelaBackdropTexture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.95
    });
    const backdrop = new THREE.Mesh(bgGeo, bgMat);
    backdrop.position.set(0, 50, -120);
    backdrop.rotation.y = Math.PI;
    this.scene.add(backdrop);
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

  // 2. SEGMENTO PROCEDURAL COM INSTANCED RENDERING E PROPS URBANOS
  createFavelaSegment(zPos) {
    const segment = new THREE.Group();
    segment.position.z = zPos;

    // A. Solo de Asfalto Amplo
    const groundGeo = new THREE.PlaneGeometry(150, SEGMENT_LENGTH);
    const ground = new THREE.Mesh(groundGeo, this.sharedMaterials.asphalt);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    segment.add(ground);

    // B. Leito Central de Brita
    const trackWidth = 10.2;
    const gravelGeo = new THREE.PlaneGeometry(trackWidth, SEGMENT_LENGTH);
    const gravel = new THREE.Mesh(gravelGeo, this.sharedMaterials.gravel);
    gravel.rotation.x = -Math.PI / 2;
    gravel.position.y = 0.01;
    gravel.receiveShadow = true;
    segment.add(gravel);

    // C. Calçadas de Concreto com Guias (Meio-Fio)
    [-6.4, 6.4].forEach(cx => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, SEGMENT_LENGTH), this.sharedMaterials.curb);
      curb.position.set(cx, 0.11, 0);
      curb.receiveShadow = true;
      segment.add(curb);
    });

    // D. Faixas Amarelas da Rua
    [-9.6, 9.6].forEach(sx => {
      for (let dz = -SEGMENT_LENGTH / 2 + 3; dz < SEGMENT_LENGTH / 2; dz += 8) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 4.0), this.sharedMaterials.yellowStripe);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(sx, 0.02, dz);
        segment.add(stripe);
      }
    });

    // E. Trilhos com InstancedMesh de Dormentes (Otimização Máxima de Draw Calls)
    this.createInstancedTracks(segment);

    // F. Muretas com Grafites Urbanos
    [-5.4, 5.4].forEach((wx, sideIdx) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, SEGMENT_LENGTH), this.sharedMaterials.concreteWall);
      wall.position.set(wx, 0.55, 0);
      wall.receiveShadow = true;
      segment.add(wall);

      // Cartazes e Grafites nas Muretas
      for (let gz = -SEGMENT_LENGTH / 2 + 10; gz < SEGMENT_LENGTH / 2; gz += 20) {
        const grafGeo = new THREE.PlaneGeometry(3.6, 0.9);
        const grafMesh = new THREE.Mesh(grafGeo, this.sharedMaterials.graffitiWall);
        grafMesh.position.set(wx + (sideIdx === 0 ? 0.22 : -0.22), 0.55, gz);
        grafMesh.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
        segment.add(grafMesh);
      }
    });

    // G. Casas e Barracos Modulares da Favela nas Laterais
    this.buildFavelaHouses(segment);

    // H. Postes de Concreto, Fiação Elétrica Suspensa e Caçambas
    this.buildStreetProps(segment);

    return segment;
  }

  // Trilhos e Dormentes Instanciados
  createInstancedTracks(segment) {
    const tieGeometry = new THREE.BoxGeometry(2.3, 0.12, 0.38);
    const tiesPerLane = Math.floor(SEGMENT_LENGTH / 2.5);
    const totalTies = tiesPerLane * LANES.length;

    const instancedTies = new THREE.InstancedMesh(tieGeometry, this.sharedMaterials.railTie, totalTies);
    instancedTies.receiveShadow = true;

    const matrix = new THREE.Matrix4();
    let instanceIndex = 0;

    LANES.forEach(laneX => {
      for (let i = 0; i < tiesPerLane; i++) {
        const dz = -SEGMENT_LENGTH / 2 + 1.25 + i * 2.5;
        matrix.setPosition(laneX, 0.06, dz);
        instancedTies.setMatrixAt(instanceIndex++, matrix);
      }

      // Trilhos de Aço
      [-0.85, 0.85].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, SEGMENT_LENGTH), this.sharedMaterials.steelRail);
        rail.position.set(laneX + rx, 0.15, 0);
        rail.receiveShadow = true;
        segment.add(rail);
      });
    });

    instancedTies.instanceMatrix.needsUpdate = true;
    segment.add(instancedTies);
  }

  // Casas e Barracos com Lajes, Caixas D'Água e Portas/Janelas
  buildFavelaHouses(segment) {
    [-15, 15].forEach((baseX, sideIdx) => {
      for (let bz = -SEGMENT_LENGTH / 2 + 8; bz < SEGMENT_LENGTH / 2; bz += 16) {
        const floors = 2 + Math.floor(Math.random() * 3); // 2 a 4 andares empilhados
        let currentY = 0;

        for (let f = 0; f < floors; f++) {
          const w = 7.5 + (Math.random() * 2 - 1);
          const h = 3.6;
          const d = 11 + (Math.random() * 2 - 1);
          const offsetX = (Math.random() * 1.5 - 0.75);

          const matIndex = Math.floor(Math.random() * this.houseMaterials.length);
          const houseMat = this.houseMaterials[matIndex];

          const house = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), houseMat);
          house.position.set(baseX + offsetX, currentY + h / 2, bz);
          house.castShadow = true;
          house.receiveShadow = true;
          segment.add(house);

          // Porta simples no térreo
          if (f === 0) {
            const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), new THREE.MeshLambertMaterial({ color: 0x451a03 }));
            door.position.set(baseX + offsetX + (sideIdx === 0 ? w / 2 + 0.02 : -w / 2 - 0.02), 1.1, bz - 1.5);
            door.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
            segment.add(door);
          }

          // Janelas com esquadrias
          const winGeo = new THREE.PlaneGeometry(1.4, 1.2);
          const winMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
          [-2, 2].forEach(wz => {
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(baseX + offsetX + (sideIdx === 0 ? w / 2 + 0.02 : -w / 2 - 0.02), currentY + 2.0, bz + wz);
            win.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
            segment.add(win);
          });

          // Laje de Concreto entre andares
          const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.25, d + 0.6), this.sharedMaterials.concreteWall);
          slab.position.set(baseX + offsetX, currentY + h, bz);
          slab.receiveShadow = true;
          segment.add(slab);

          currentY += h + 0.25;
        }

        // Topo da Casa: Vergalhões aparentes da laje e Caixa d'água Fortlev
        const topY = currentY;

        // Vergalhões de ferro na laje
        [-3, 3].forEach(vx => {
          [-4, 4].forEach(vz => {
            const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4), this.sharedMaterials.rebar);
            rebar.position.set(baseX + vx, topY + 0.6, bz + vz);
            segment.add(rebar);
          });
        });

        // Caixa d'Água Cilíndrica Fortlev
        const tankGeo = new THREE.CylinderGeometry(1.2, 1.1, 1.6, 16);
        const tank = new THREE.Mesh(tankGeo, this.sharedMaterials.waterTank);
        tank.position.set(baseX + (Math.random() * 2 - 1), topY + 0.8, bz + (Math.random() * 2 - 1));
        tank.castShadow = true;
        tank.receiveShadow = true;
        segment.add(tank);
      }
    });
  }

  // Postes, Fiação Elétrica Suspensa, Caçambas e Lixeiras
  buildStreetProps(segment) {
    const polePositions = [];

    [-7.8, 7.8].forEach((px, sideIdx) => {
      for (let pz = -SEGMENT_LENGTH / 2 + 15; pz < SEGMENT_LENGTH / 2; pz += 30) {
        // Poste de Concreto
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 9.5, 8), this.sharedMaterials.concretePole);
        pole.position.set(px, 4.75, pz);
        pole.castShadow = true;
        segment.add(pole);

        // Cruzeta de Madeira do Topo
        const cross = new THREE.Mesh(new THREE.BoxGeometry(sideIdx === 0 ? 1.8 : 1.8, 0.16, 0.16), this.sharedMaterials.railTie);
        cross.position.set(px + (sideIdx === 0 ? 0.6 : -0.6), 8.8, pz);
        segment.add(cross);

        polePositions.push({ x: px, y: 8.8, z: pz });

        // Caçamba de Entulho Verde
        if (Math.random() > 0.4) {
          const dumpster = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 2.8), this.sharedMaterials.dumpster);
          dumpster.position.set(px + (sideIdx === 0 ? -1.4 : 1.4), 0.55, pz + 7);
          dumpster.castShadow = true;
          dumpster.receiveShadow = true;
          segment.add(dumpster);
        }
      }
    });

    // Fiação Elétrica Suspensa Conectando os Postes
    for (let i = 0; i < polePositions.length - 1; i += 2) {
      const p1 = polePositions[i];
      const p2 = polePositions[i + 1];

      // Fio atravessando a rua com leve caimento (catena)
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(p1.x, p1.y, p1.z),
        new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 0.7, (p1.z + p2.z) / 2),
        new THREE.Vector3(p2.x, p2.y, p2.z)
      ]);

      const points = curve.getPoints(12);
      const wireGeo = new THREE.BufferGeometry().setFromPoints(points);
      const wireLine = new THREE.Line(wireGeo, this.sharedMaterials.wire);
      segment.add(wireLine);
    }
  }

  // Object Pooling: Atualização e Reciclagem Contínua dos Segmentos
  update(playerZ, onRecycleSegment) {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];

      // Quando o segmento passa completamente atrás do jogador
      if (seg.position.z > playerZ + SEGMENT_LENGTH) {
        // Encontra o segmento mais distante à frente
        let minZ = 0;
        for (const s of this.segments) {
          if (s.position.z < minZ) minZ = s.position.z;
        }

        // Reposiciona o segmento reciclado no horizonte
        const newZ = minZ - SEGMENT_LENGTH;
        seg.position.z = newZ;

        // Callback para respawnar entidades no segmento reciclado
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
