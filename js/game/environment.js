// js/game/environment.js — Favela com Modelos 3D GLB (Casinhas Realistas), Iluminação Noturna Dinâmica e Esteira de Movimento
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LANES } from './character.js';
import { textureAtlas } from './textures.js';
import { modelLoader } from './model-loader.js';

export const SEGMENT_LENGTH = 85;
export const TOTAL_SEGMENTS = 6;

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];

    // Materiais Compartilhados Globais PBR com Suporte a Emissão Noturna
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
      wire: new THREE.LineBasicMaterial({ color: 0x0f172a, linewidth: 1.5 }),
      dumpster: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45, metalness: 0.35 }),
      rebar: new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.60, metalness: 0.45 }),
      antenna: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.30, metalness: 0.85 }),
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

    this.houseMaterials = this.houseColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.05 }));

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

    // 7. Casas da Favela 3D GLB + Casas Empilhadas
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
    // 1. PRIMEIRA CAMADA (Margem da Pista: Casas Quadradas Coloridas com Portas, Janelas e Lajes)
    [-11.5, 11.5].forEach((baseX, sideIdx) => {
      for (let bz = -SEGMENT_LENGTH / 2 + 10; bz < SEGMENT_LENGTH / 2; bz += 19) {
        this.createStackedProceduralHouse(segment, baseX + (sideIdx === 0 ? -1.5 : 1.5), bz, sideIdx, 2, 3, 0);
      }
    });

    // 2. SEGUNDA, TERCEIRA E QUARTA CAMADAS (Fundo e Encosta do Morro da Favela Densa com Caixas d'Água)
    [-19, -29, -40, 19, 29, 40].forEach(baseX => {
      const isLeft = baseX < 0;
      const distLayer = Math.abs(baseX);
      const elevationBase = (distLayer - 12) * 0.48; // Sobe o relevo em declive no morro

      for (let bz = -SEGMENT_LENGTH / 2 + 6; bz < SEGMENT_LENGTH / 2; bz += 14) {
        const floors = Math.floor(Math.random() * 3) + 2;
        this.createStackedProceduralHouse(segment, baseX + (Math.random() * 2 - 1), bz, isLeft ? 0 : 1, floors, floors + 2, elevationBase);
      }
    });
  }

  createStackedProceduralHouse(segment, baseX, bz, sideIdx, minFloors = 2, maxFloors = 3, elevationBase = 0) {
    const floors = Math.floor(Math.random() * (maxFloors - minFloors + 1)) + minFloors;
    let currentY = elevationBase;

    for (let f = 0; f < floors; f++) {
      const w = 7.0 + (Math.random() * 2.0 - 1.0);
      const h = 3.4;
      const d = 10.0 + (Math.random() * 2.0 - 1.0);
      const offsetX = (Math.random() * 1.2 - 0.6);

      const matIndex = Math.floor(Math.random() * this.houseMaterials.length);
      const houseMat = this.houseMaterials[matIndex];

      const house = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), houseMat);
      house.position.set(baseX + offsetX, currentY + h / 2, bz);
      house.castShadow = true;
      house.receiveShadow = true;
      segment.add(house);

      // Porta no térreo
      if (f === 0) {
        const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.1), new THREE.MeshLambertMaterial({ color: 0x451a03 }));
        door.position.set(baseX + offsetX + (sideIdx === 0 ? w / 2 + 0.02 : -w / 2 - 0.02), currentY + 1.05, bz - 1.2);
        door.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
        segment.add(door);
      }

      // Janelas Iluminadas Noturnas
      const winGeo = new THREE.PlaneGeometry(1.3, 1.1);
      [-2.2, 2.2].forEach(wz => {
        const win = new THREE.Mesh(winGeo, this.sharedMaterials.windowMat);
        win.position.set(baseX + offsetX + (sideIdx === 0 ? w / 2 + 0.02 : -w / 2 - 0.02), currentY + 1.7, bz + wz);
        win.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
        segment.add(win);
      });

      // Laje de Concreto
      const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.22, d + 0.5), this.sharedMaterials.concreteWall);
      slab.position.set(baseX + offsetX, currentY + h, bz);
      slab.receiveShadow = true;
      segment.add(slab);

      currentY += h + 0.22;
    }

    const topY = currentY;

    // Vergalhões de Obra na Laje
    [-2.2, 2.2].forEach(vx => {
      [-3.0, 3.0].forEach(vz => {
        const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 4), this.sharedMaterials.rebar);
        rebar.position.set(baseX + vx, topY + 0.55, bz + vz);
        segment.add(rebar);
      });
    });

    // Caixa d'água Azul Fortlev ou Antena de TV
    if (Math.random() > 0.25) {
      const tankGeo = new THREE.CylinderGeometry(1.15, 1.05, 1.5, 16);
      const tank = new THREE.Mesh(tankGeo, this.sharedMaterials.waterTank);
      tank.position.set(baseX + (Math.random() * 1.8 - 0.9), topY + 0.75, bz + (Math.random() * 1.8 - 0.9));
      tank.castShadow = true;
      tank.receiveShadow = true;
      segment.add(tank);
    } else {
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.0, 4), this.sharedMaterials.antenna);
      antenna.position.set(baseX, topY + 1.5, bz);
      segment.add(antenna);
    }
  }

  buildStreetProps(segment) {
    const polePositions = [];

    [-7.8, 7.8].forEach((px, sideIdx) => {
      for (let pz = -SEGMENT_LENGTH / 2 + 15; pz < SEGMENT_LENGTH / 2; pz += 30) {
        // Poste
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 9.5, 8), this.sharedMaterials.concretePole);
        pole.position.set(px, 4.75, pz);
        pole.castShadow = true;
        segment.add(pole);

        // Cruzeta
        const cross = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.16), this.sharedMaterials.railTie);
        cross.position.set(px + (sideIdx === 0 ? 0.6 : -0.6), 8.8, pz);
        segment.add(cross);

        // Lanterna de Luz no Poste
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), this.sharedMaterials.streetLampMat);
        lamp.position.set(px + (sideIdx === 0 ? 1.2 : -1.2), 8.6, pz);
        segment.add(lamp);

        polePositions.push({ x: px, y: 8.8, z: pz });

        // Caçamba
        if (Math.random() > 0.4) {
          const dumpster = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 2.8), this.sharedMaterials.dumpster);
          dumpster.position.set(px + (sideIdx === 0 ? -1.4 : 1.4), 0.55, pz + 7);
          dumpster.castShadow = true;
          dumpster.receiveShadow = true;
          segment.add(dumpster);
        }
      }
    });

    // Fiação Elétrica Suspensa
    for (let i = 0; i < polePositions.length - 1; i += 2) {
      const p1 = polePositions[i];
      const p2 = polePositions[i + 1];

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

  /**
   * Atualiza a emissão de luz nas janelas e postes com base no horário
   */
  updateNightLights(isNight, timeOfDay) {
    // Janelas e postes acendem na madrugada (t < 0.15) e à noite (t > 0.78)
    const isDark = timeOfDay < 0.15 || timeOfDay > 0.78;
    const intensity = isDark ? 0.95 : 0.05;

    this.sharedMaterials.windowMat.emissiveIntensity = intensity;
    this.sharedMaterials.streetLampMat.emissiveIntensity = intensity;

    if (isDark) {
      this.sharedMaterials.windowMat.emissive.setHex(0xfef08a);
      this.sharedMaterials.streetLampMat.emissive.setHex(0xfef08a);
    } else {
      this.sharedMaterials.windowMat.emissive.setHex(0x000000);
      this.sharedMaterials.streetLampMat.emissive.setHex(0x000000);
    }
  }

  update(speed, dt, onRecycleSegment) {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      seg.position.z += speed * dt;

      if (seg.position.z > SEGMENT_LENGTH) {
        let minZ = 0;
        for (const s of this.segments) {
          if (s.position.z < minZ) minZ = s.position.z;
        }

        const newZ = minZ - SEGMENT_LENGTH + 0.1;
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
