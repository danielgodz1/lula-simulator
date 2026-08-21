// js/game/environment.js — Favela 3D do Rio de Janeiro com Rua Contínua, Calçadas e Casas
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LANES } from './character.js';

export const SEGMENT_LENGTH = 85;
export const TOTAL_SEGMENTS = 6;

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.textureLoader = new THREE.TextureLoader();
    this.favelaBackdropTexture = this.textureLoader.load('img/favela.png');
    this.init();
  }

  init() {
    this.createFavelaBackdrop();
    this.buildInitialTrack();
  }

  // 1. CAMADA DE PROFUNDIDADE 1: FUNDO PANORÂMICO DO MORRO CARIOCA
  createFavelaBackdrop() {
    const bgGeo = new THREE.CylinderGeometry(300, 300, 160, 32, 1, true, -Math.PI / 2, Math.PI);
    const bgMat = new THREE.MeshBasicMaterial({
      map: this.favelaBackdropTexture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.95
    });
    const backdrop = new THREE.Mesh(bgGeo, bgMat);
    backdrop.position.set(0, 50, -100);
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

  // 2. CAMADA DE PROFUNDIDADE 2 & 3: RUA DE ASFALTO, CALÇADAS E TRILHOS
  createFavelaSegment(zPos) {
    const segment = new THREE.Group();
    segment.position.z = zPos;

    // Solo de Asfalto Amplo que Cobre Todo o Horizonte (Sem Buracos no Chão)
    const groundGeo = new THREE.PlaneGeometry(140, SEGMENT_LENGTH);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Asfalto Escuro
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    segment.add(ground);

    // Leito Central de Cascalho e Brita
    const trackWidth = 9.8;
    const gravelGeo = new THREE.PlaneGeometry(trackWidth, SEGMENT_LENGTH);
    const gravelMat = new THREE.MeshLambertMaterial({ color: 0x3f3f46 });
    const gravel = new THREE.Mesh(gravelGeo, gravelMat);
    gravel.rotation.x = -Math.PI / 2;
    gravel.position.y = 0.01;
    gravel.receiveShadow = true;
    segment.add(gravel);

    // Calçadas de Concreto ao Lado da Rua
    const curbMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    [-6.2, 6.2].forEach(cx => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, SEGMENT_LENGTH), curbMat);
      curb.position.set(cx, 0.11, 0);
      curb.receiveShadow = true;
      segment.add(curb);
    });

    // Faixas Amarelas da Rua Pintadas no Asfalto
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    [-9.2, 9.2].forEach(sx => {
      for (let dz = -SEGMENT_LENGTH / 2 + 3; dz < SEGMENT_LENGTH / 2; dz += 8) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 4.0), stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(sx, 0.02, dz);
        segment.add(stripe);
      }
    });

    // 3 Trilhos de Metrô com Dormentes de Madeira e Aço Brilhante
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });

    LANES.forEach(laneX => {
      for (let dz = -SEGMENT_LENGTH / 2 + 2; dz < SEGMENT_LENGTH / 2; dz += 2.6) {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.4), woodMat);
        tie.position.set(laneX, 0.06, dz);
        tie.receiveShadow = true;
        segment.add(tie);
      }

      [-0.8, 0.8].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, SEGMENT_LENGTH), railMat);
        rail.position.set(laneX + rx, 0.15, 0);
        rail.receiveShadow = true;
        segment.add(rail);
      });
    });

    // Muretas de Proteção com Grafites
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x71717a });
    [-5.2, 5.2].forEach(wx => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, SEGMENT_LENGTH), wallMat);
      wall.position.set(wx, 0.55, 0);
      wall.receiveShadow = true;
      segment.add(wall);
    });

    // Casas Empilhadas da Favela
    this.buildFavelaHouses(segment);

    // Postes e Fiação Elétrica
    for (let pz = -SEGMENT_LENGTH / 2 + 15; pz < SEGMENT_LENGTH / 2; pz += 30) {
      this.createPolesAndWires(segment, pz);
    }

    return segment;
  }

  buildFavelaHouses(segment) {
    const houseColors = [
      0xc2410c, // Tijolo Baiano
      0xea580c, // Laranja Queimado
      0xfacc15, // Amarelo Solar
      0x0284c7, // Azul Piscina
      0x16a34a, // Verde Bandeira
      0xdb2777, // Rosa Choque
      0x78716c  // Concreto
    ];

    const waterTankMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 }); // Caixa Fortlev
    const brickMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });

    [-14, 14].forEach((baseX, sideIdx) => {
      for (let bz = -SEGMENT_LENGTH / 2 + 8; bz < SEGMENT_LENGTH / 2; bz += 16) {
        const floors = 2 + Math.floor(Math.random() * 3);

        let curY = 0;
        for (let f = 0; f < floors; f++) {
          const width = 6 + Math.random() * 4;
          const height = 3.5 + Math.random() * 1.5;
          const depth = 8 + Math.random() * 5;
          const shiftX = (Math.random() - 0.5) * 1.5;

          const color = houseColors[Math.floor(Math.random() * houseColors.length)];
          const houseMat = (f === 0 && Math.random() > 0.4) ? brickMat : new THREE.MeshLambertMaterial({ color });

          const house = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), houseMat);
          house.position.set(baseX + shiftX + (sideIdx === 0 ? -width / 4 : width / 4), curY + height / 2, bz);
          house.castShadow = true;
          house.receiveShadow = true;
          segment.add(house);

          // Janelas
          const winMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
          const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), winMat);
          const winX = sideIdx === 0 ? baseX + shiftX + width / 2 + 0.05 : baseX + shiftX - width / 2 - 0.05;
          win.position.set(winX, curY + height / 2, bz);
          win.rotation.y = sideIdx === 0 ? -Math.PI / 2 : Math.PI / 2;
          segment.add(win);

          // Caixa d'Água Fortlev Azul no topo
          if (f === floors - 1) {
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.85, 1.2, 16), waterTankMat);
            tank.position.set(baseX + shiftX, curY + height + 0.6, bz + 1.2);
            tank.castShadow = true;
            segment.add(tank);

            // Antena Parabólica / TV
            const antMat = new THREE.MeshLambertMaterial({ color: 0xd4d4d8 });
            const antPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8), antMat);
            antPole.position.set(baseX + shiftX - 1.5, curY + height + 0.9, bz - 1.5);
            segment.add(antPole);
          }

          curY += height;
        }
      }
    });
  }

  createPolesAndWires(segment, pz) {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x44403c });
    const wireMat = new THREE.LineBasicMaterial({ color: 0x09090b });

    const poleLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 9.5), poleMat);
    poleLeft.position.set(-6.8, 4.75, pz);
    poleLeft.castShadow = true;
    segment.add(poleLeft);

    const poleRight = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 9.5), poleMat);
    poleRight.position.set(6.8, 4.75, pz);
    poleRight.castShadow = true;
    segment.add(poleRight);

    // Travessas de Madeira
    [-6.8, 6.8].forEach(px => {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.16), poleMat);
      cross.position.set(px, 8.8, pz);
      segment.add(cross);
    });

    // Fiação Emaranhada Carioca (Gatos de Luz)
    for (let i = 0; i < 4; i++) {
      const yOffset = 7.6 + i * 0.45;
      const wirePoints = [
        new THREE.Vector3(-6.8, yOffset, pz),
        new THREE.Vector3(0, yOffset - 0.7 - Math.random() * 0.4, pz + (Math.random() - 0.5) * 2),
        new THREE.Vector3(6.8, yOffset, pz)
      ];
      const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
      const wire = new THREE.Line(wireGeo, wireMat);
      segment.add(wire);
    }
  }

  reset() {
    this.buildInitialTrack();
  }

  update(moveZ, onRecycle) {
    if (typeof moveZ !== 'number' || isNaN(moveZ)) return;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      seg.position.z += moveZ;

      if (seg.position.z > SEGMENT_LENGTH * 1.5) {
        let minZ = 0;
        for (const s of this.segments) {
          if (s.position.z < minZ) minZ = s.position.z;
        }
        seg.position.z = minZ - SEGMENT_LENGTH;
        if (typeof onRecycle === 'function') {
          onRecycle(seg, seg.position.z);
        }
      }
    }
  }
}
