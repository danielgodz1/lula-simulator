// js/game/boss.js — Boss Carteira de Trabalho Viva (CTPS) 3D com Perseguição Subway Surfers
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { textureAtlas } from './textures.js';
import { gameAudio } from './audio.js';

export class CtpsBoss {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    this.x = 0;
    this.y = 0;
    this.z = 18; // Inicia fora da visão
    this.targetZ = 3.2; // Distância colada atrás do jogador

    // Estados: 'START_CHASE', 'RETREATING', 'OFFSCREEN', 'STUMBLE_CHASE', 'STAMP_KILL'
    this.state = 'START_CHASE';
    this.stateTimer = 0;
    this.runAnimTime = 0;
    this.isAggressive = false;

    // Componentes Anatômicos
    this.bookletBody = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftArm = null;
    this.rightArm = null;
    this.dustParticles = [];

    this.build();
    this.scene.add(this.mesh);
  }

  build() {
    // 1. Corpo da Carteira de Trabalho (Livreto 3D)
    // Materiais: [Direita, Esquerda, Cima, Baixo, Frente (Capa CTPS), Trás]
    const coverMat = new THREE.MeshStandardMaterial({
      map: textureAtlas.ctpsBossCoverTexture,
      roughness: 0.35,
      metalness: 0.25
    });

    const navyLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x0c1829,
      roughness: 0.45,
      metalness: 0.15
    });

    const paperEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.9
    });

    const bodyMaterials = [
      paperEdgeMat,   // +X (Lado das páginas)
      navyLeatherMat, // -X (Lombada de couro)
      paperEdgeMat,   // +Y (Topo das páginas)
      paperEdgeMat,   // -Y (Base das páginas)
      coverMat,       // +Z (Frente com Rosto e Brasão)
      navyLeatherMat  // -Z (Verso de couro)
    ];

    const bodyGeo = new THREE.BoxGeometry(1.35, 1.95, 0.22);
    this.bookletBody = new THREE.Mesh(bodyGeo, bodyMaterials);
    this.bookletBody.position.y = 1.35;
    this.mesh.add(this.bookletBody);

    // 2. Pernas e Sapatos Cartoon
    const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.65, 8);
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x0c1829, roughness: 0.5 });
    const shoeGeo = new THREE.BoxGeometry(0.24, 0.16, 0.42);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.3 });

    // Perna Esquerda
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.36, 0.65, 0);
    const lLegMesh = new THREE.Mesh(legGeo, limbMat);
    lLegMesh.position.y = -0.32;
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(0, -0.62, 0.08);
    this.leftLeg.add(lLegMesh, lShoe);
    this.mesh.add(this.leftLeg);

    // Perna Direita
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.36, 0.65, 0);
    const rLegMesh = new THREE.Mesh(legGeo, limbMat);
    rLegMesh.position.y = -0.32;
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0, -0.62, 0.08);
    this.rightLeg.add(rLegMesh, rShoe);
    this.mesh.add(this.rightLeg);

    // 3. Braços e Luvas Cartoon
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.60, 8);
    const gloveGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    // Braço Esquerdo
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.76, 1.45, 0);
    const lArmMesh = new THREE.Mesh(armGeo, limbMat);
    lArmMesh.position.y = -0.28;
    const lGlove = new THREE.Mesh(gloveGeo, gloveMat);
    lGlove.position.y = -0.56;
    this.leftArm.add(lArmMesh, lGlove);
    this.mesh.add(this.leftArm);

    // Braço Direito
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.76, 1.45, 0);
    const rArmMesh = new THREE.Mesh(armGeo, limbMat);
    rArmMesh.position.y = -0.28;
    const rGlove = new THREE.Mesh(gloveGeo, gloveMat);
    rGlove.position.y = -0.56;
    this.rightArm.add(rArmMesh, rGlove);
    this.mesh.add(this.rightArm);

    // 4. Partículas de Poeira/Fumaça nos Pés
    const dustGeo = new THREE.DodecahedronGeometry(0.12, 0);
    const dustMat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.65
    });

    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(dustGeo, dustMat);
      p.visible = false;
      this.mesh.add(p);
      this.dustParticles.push({
        mesh: p,
        life: 0,
        maxLife: 0.4,
        vx: 0,
        vy: 0,
        vz: 0
      });
    }

    this.mesh.position.set(0, 0, this.z);
  }

  startRun() {
    this.state = 'START_CHASE';
    this.stateTimer = 0;
    this.z = 4.2;
    this.targetZ = 2.8;
    this.isAggressive = false;
    this.mesh.visible = true;
  }

  triggerStumbleChase() {
    this.state = 'STUMBLE_CHASE';
    this.stateTimer = 0;
    this.targetZ = 2.0; // Cola bem atrás
    this.isAggressive = true;
    this.mesh.visible = true;
  }

  triggerKillStamp(playerX, playerY) {
    this.state = 'STAMP_KILL';
    this.stateTimer = 0;
    this.targetX = playerX;
    this.targetY = playerY;
  }

  reset() {
    this.state = 'OFFSCREEN';
    this.z = 18;
    this.targetZ = 18;
    this.mesh.position.set(0, 0, 18);
    this.mesh.visible = false;
    this.isAggressive = false;
  }

  update(dt, playerX, playerY, speed) {
    if (this.state === 'OFFSCREEN') {
      this.mesh.visible = false;
      return;
    }

    this.stateTimer += dt;
    this.runAnimTime += dt * (speed / 18);

    // 1. Lógica da Máquina de Estados
    if (this.state === 'START_CHASE') {
      this.targetZ = 2.8;
      if (this.stateTimer > 8.0) {
        this.state = 'RETREATING';
        this.stateTimer = 0;
      }
    } else if (this.state === 'RETREATING') {
      this.targetZ = 16.0;
      if (this.z > 14.5) {
        this.state = 'OFFSCREEN';
        this.mesh.visible = false;
      }
    } else if (this.state === 'STUMBLE_CHASE') {
      this.targetZ = 2.0;
      if (this.stateTimer > 5.5) {
        this.state = 'RETREATING';
        this.stateTimer = 0;
        this.isAggressive = false;
      }
    } else if (this.state === 'STAMP_KILL') {
      // Pulo do Carimbo Fatal
      this.targetZ = 0.4;
      this.bookletBody.rotation.x = Math.min(Math.PI / 2, this.stateTimer * 4.0);
    }

    // 2. Interpolação Suave de Posição
    this.x += (playerX - this.x) * (8.5 * dt);
    this.z += (this.targetZ - this.z) * (3.5 * dt);
    this.y = Math.max(0, playerY * 0.6);

    this.mesh.position.set(this.x, this.y, this.z);

    // 3. Animação de Corrida Cartoon das Pernas e Braços
    const animFreq = this.runAnimTime * 14.0;
    const legSwing = Math.sin(animFreq) * 0.75;
    const armSwing = Math.sin(animFreq + Math.PI) * 0.75;
    const bodyBob = Math.abs(Math.sin(animFreq)) * 0.12;

    this.leftLeg.rotation.x = legSwing;
    this.rightLeg.rotation.x = -legSwing;
    this.leftArm.rotation.x = armSwing;
    this.rightArm.rotation.x = -armSwing;

    if (this.state !== 'STAMP_KILL') {
      this.bookletBody.position.y = 1.35 + bodyBob;
      this.bookletBody.rotation.z = Math.sin(animFreq * 0.5) * 0.08;
      this.bookletBody.rotation.x = 0.12; // Leve inclinação para a frente de corrida
    }

    // 4. Emissão de Poeira nos Pés
    if (Math.random() < 0.35 && this.z < 6.0) {
      for (const p of this.dustParticles) {
        if (!p.mesh.visible) {
          p.mesh.visible = true;
          p.life = 0;
          p.mesh.position.set(
            (Math.random() - 0.5) * 0.6,
            0.1,
            -0.2
          );
          p.vx = (Math.random() - 0.5) * 0.8;
          p.vy = 0.4 + Math.random() * 0.6;
          p.vz = 1.5 + Math.random() * 2.0;
          break;
        }
      }
    }

    // Atualiza partículas de poeira ativas
    this.dustParticles.forEach(p => {
      if (p.mesh.visible) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.mesh.visible = false;
        } else {
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          const progress = p.life / p.maxLife;
          p.mesh.scale.setScalar(1.0 + progress * 2.0);
        }
      }
    });
  }
}
