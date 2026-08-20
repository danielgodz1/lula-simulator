// js/game/environment.js — Favela 3D do Rio de Janeiro em 3 Camadas de Profundidade
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
    const bgGeo = new THREE.CylinderGeometry(280, 280, 140, 32, 1, true, -Math.PI / 2, Math.PI);
    const bgMat = new THREE.MeshBasicMaterial({
      map: this.favelaBackdropTexture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.90
    });
    const backdrop = new THREE.Mesh(bgGeo, bgMat);
    backdrop.position.set(0, 45, -80);
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

  // 2. CAMADA DE PROFUNDIDADE 2 & 3: ARQUITETURA DA FAVELA & TRILHOS DE METRÔ
  createFavelaSegment(zPos) {
    const segment = new THREE.Group();
    segment.position.z = zPos;

    // Leito de Cascalho e Brita
    const trackWidth = 9.8;
    const gravelGeo = new THREE.PlaneGeometry(trackWidth, SEGMENT_LENGTH);
    const gravelMat = new THREE.MeshLambertMaterial({ color: 0x3f3f46 });
    const gravel = new THREE.Mesh(gravelGeo, gravelMat);
    gravel.rotation.x = -Math.PI / 2;
    gravel.receiveShadow = true;
    segment.add(gravel);

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

    // Muretas de Concreto com Grafites
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x71717a });
    [-5.4, 5.4].forEach(wx => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, SEGMENT_LENGTH), wallMat);
      wall.position.set(wx, 0.6, 0);
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

    [-13, 13].forEach((baseX, sideIdx) => {
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
          win.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
          segment.add(win);

          // Caixa d'água azul Fortlev na laje superior
          if (f === floors - 1) {
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.7, 1.1, 12), waterTankMat);
            tank.position.set(house.position.x, curY + height + 0.55, bz + (Math.random() - 0.5) * 2);
            tank.castShadow = true;
            segment.add(tank);

            // Antena de TV
            const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), new THREE.MeshLambertMaterial({ color: 0xd4d4d8 }));
            antenna.position.set(house.position.x + 1.2, curY + height + 1.1, bz - 1.5);
            segment.add(antenna);
          }

          curY += height;
        }
      }
    });
  }

  createPolesAndWires(segment, pz) {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    [-5.8, 5.8].forEach(px => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 7.5, 8), poleMat);
      pole.position.set(px, 3.75, pz);
      pole.castShadow = true;
      segment.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.15), poleMat);
      arm.position.set(0, 3.2, 0);
      pole.add(arm);
    });

    [-0.6, 0, 0.6].forEach(offsetY => {
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 11.6, 6), wireMat);
      wire.rotation.z = Math.PI / 2;
      wire.position.set(0, 6.8 + offsetY, pz);
      segment.add(wire);
    });
  }

  update(moveZ, onRecycleSegment) {
    for (const seg of this.segments) {
      seg.position.z += moveZ;
    }

    const firstSeg = this.segments[0];
    if (firstSeg && firstSeg.position.z > SEGMENT_LENGTH) {
      this.scene.remove(firstSeg);
      this.segments.shift();

      const lastSeg = this.segments[this.segments.length - 1];
      const newZ = lastSeg.position.z - SEGMENT_LENGTH;
      const newSeg = this.createFavelaSegment(newZ);
      this.segments.push(newSeg);
      this.scene.add(newSeg);

      if (onRecycleSegment) {
        onRecycleSegment(newSeg, newZ);
      }
    }
  }

  reset() {
    this.buildInitialTrack();
  }
}
