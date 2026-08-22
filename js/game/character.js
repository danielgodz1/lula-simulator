// js/game/character.js — Modelo 3D com Sapatos Dourados Alados Equipáveis, Ímã na Mão Esquerda e Slide 90º
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { gameAudio } from './audio.js';

export const LANES = [-2.8, 0, 2.8];

export class Character {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    this.currentLane = 1;
    this.targetX = 0;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.groundY = 0;

    // Física
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.gravity = -38;
    this.jumpForce = 17.5;
    this.fallMultiplier = 1.15;
    this.jumpBufferTimer = 0;

    // Slide
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.58;

    this.isDead = false;
    this.deathAnimTime = 0;

    // Power-ups
    this.superJump = false;
    this.magnetActive = false;

    // Partes do Corpo
    this.torso = null;
    this.head = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftArmGroup = null;
    this.rightArmGroup = null;
    this.briefcase = null;
    this.shadow = null;

    // Itens Equipáveis de Power-up
    this.lShoeNormal = null;
    this.rShoeNormal = null;
    this.lShoeGolden = null;
    this.rShoeGolden = null;
    this.lWing = null;
    this.rWing = null;
    this.handMagnet = null;

    this.animTime = 0;
    this.build();
    this.setupControls();
  }

  build() {
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.1 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const glassesFrameMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });
    const glassesLensMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0xb45309,
      emissiveIntensity: 0.35
    });

    // 1. Tronco com Paletó
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.96, 0.44), suitMat);
    this.torso.position.y = 1.38;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    const lapelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.60, 0.06), suitMat);
    lapelLeft.position.set(-0.20, 1.46, 0.22);
    lapelLeft.rotation.z = -0.15;
    this.mesh.add(lapelLeft);

    const lapelRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.60, 0.06), suitMat);
    lapelRight.position.set(0.20, 1.46, 0.22);
    lapelRight.rotation.z = 0.15;
    this.mesh.add(lapelRight);

    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.52, 0.05), shirtMat);
    shirt.position.set(0, 1.50, 0.21);
    this.mesh.add(shirt);

    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.44, 0.06), tieMat);
    tie.position.set(0, 1.45, 0.23);
    this.mesh.add(tie);

    const tieClip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.07), goldMat);
    tieClip.position.set(0, 1.46, 0.24);
    this.mesh.add(tieClip);

    // 2. Cabeça
    this.head = new THREE.Group();
    this.head.position.set(0, 2.12, 0);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.54, 0.52), skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.56), hairMat);
    hairTop.position.set(0, 0.26, 0);
    this.head.add(hairTop);

    const glasses = new THREE.Group();
    glasses.position.set(0, 0.04, 0.28);
    const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.04), glassesLensMat);
    lensL.position.x = -0.12;
    const lensR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.04), glassesLensMat);
    lensR.position.x = 0.12;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.03, 0.04), glassesFrameMat);
    glasses.add(lensL, lensR, bridge);
    this.head.add(glasses);
    this.mesh.add(this.head);

    // 3. Pernas e Sapatos Equipáveis
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.22, 0.90, 0);
    const lPants = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.90, 0.36), suitMat);
    lPants.position.y = -0.45;
    lPants.castShadow = true;

    // Sapato Normal Esquerdo
    this.lShoeNormal = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.50), shoeMat);
    this.lShoeNormal.position.set(0, -0.90, 0.08);
    this.lShoeNormal.castShadow = true;

    // Sapato Dourado Alado Esquerdo (Super Pulo)
    this.lShoeGolden = new THREE.Group();
    this.lShoeGolden.position.set(0, -0.90, 0.08);
    const lGoldBoot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.54), goldMat);
    lGoldBoot.castShadow = true;
    this.lWing = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 4), goldMat);
    this.lWing.rotation.set(0, 0, Math.PI / 2);
    this.lWing.position.set(-0.22, 0.08, -0.05);
    this.lShoeGolden.add(lGoldBoot, this.lWing);
    this.lShoeGolden.visible = false;

    this.leftLeg.add(lPants, this.lShoeNormal, this.lShoeGolden);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.22, 0.90, 0);
    const rPants = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.90, 0.36), suitMat);
    rPants.position.y = -0.45;
    rPants.castShadow = true;

    // Sapato Normal Direito
    this.rShoeNormal = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.50), shoeMat);
    this.rShoeNormal.position.set(0, -0.90, 0.08);
    this.rShoeNormal.castShadow = true;

    // Sapato Dourado Alado Direito (Super Pulo)
    this.rShoeGolden = new THREE.Group();
    this.rShoeGolden.position.set(0, -0.90, 0.08);
    const rGoldBoot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.54), goldMat);
    rGoldBoot.castShadow = true;
    this.rWing = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 4), goldMat);
    this.rWing.rotation.set(0, 0, -Math.PI / 2);
    this.rWing.position.set(0.22, 0.08, -0.05);
    this.rShoeGolden.add(rGoldBoot, this.rWing);
    this.rShoeGolden.visible = false;

    this.rightLeg.add(rPants, this.rShoeNormal, this.rShoeGolden);
    this.mesh.add(this.rightLeg);

    // 4. Braço Esquerdo com Ímã Equipável na Mão
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.52, 1.76, 0);
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.86, 0.28), suitMat);
    lArm.position.y = -0.43;
    lArm.castShadow = true;
    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.20, 0.22), skinMat);
    lHand.position.y = -0.92;

    // ÍMÃ 3D EM FERRADURA NA MÃO ESQUERDA
    this.handMagnet = this.createHandMagnet3D();
    this.handMagnet.position.set(0, -1.02, 0.20);
    this.handMagnet.rotation.set(Math.PI / 6, 0, 0);
    this.handMagnet.scale.set(0.75, 0.75, 0.75);
    this.handMagnet.visible = false;

    this.leftArmGroup.add(lArm, lHand, this.handMagnet);
    this.mesh.add(this.leftArmGroup);

    // 5. Braço Direito com Maleta e Rolex
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.52, 1.76, 0);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.86, 0.28), suitMat);
    rArm.position.y = -0.43;
    rArm.castShadow = true;
    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.20, 0.22), skinMat);
    rHand.position.y = -0.92;

    const rolex = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12), goldMat);
    rolex.position.set(0, -0.80, 0);
    this.rightArmGroup.add(rArm, rHand, rolex);

    this.briefcase = new THREE.Group();
    this.briefcase.position.set(0, -0.96, 0.05);
    const caseBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.70), leatherMat);
    caseBody.castShadow = true;
    const lock1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), goldMat);
    lock1.position.set(0, 0.12, 0.22);
    const lock2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), goldMat);
    lock2.position.set(0, 0.12, -0.22);
    this.briefcase.add(caseBody, lock1, lock2);
    this.rightArmGroup.add(this.briefcase);
    this.mesh.add(this.rightArmGroup);

    // 6. Sombra
    const shadowGeo = new THREE.PlaneGeometry(1.4, 2.2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.03;
    this.mesh.add(this.shadow);

    this.scene.add(this.mesh);
  }

  // Cria o Ímã 3D em Ferradura Vermelho e Prata
  createHandMagnet3D() {
    const magnetGroup = new THREE.Group();

    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.3 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });

    // Arco Curvo Superior do Ímã
    const baseArc = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.16, 0.16), redMat);
    baseArc.position.y = 0.28;
    magnetGroup.add(baseArc);

    // Hastes Vermelhas Laterais
    [-0.20, 0.20].forEach(hx => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.16), redMat);
      arm.position.set(hx, 0.10, 0);
      magnetGroup.add(arm);

      // Pontas de Aço Prateadas (Polos N/S)
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.17), silverMat);
      tip.position.set(hx, -0.15, 0);
      magnetGroup.add(tip);
    });

    return magnetGroup;
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveLeft();
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveRight();
      else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        e.preventDefault();
        this.jump();
      }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        this.slide();
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const elapsed = performance.now() - touchStartTime;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      const minSwipeDistance = 25;

      if (elapsed < 500 && (absX > minSwipeDistance || absY > minSwipeDistance)) {
        if (absX > absY) {
          if (deltaX > 0) this.moveRight();
          else this.moveLeft();
        } else {
          if (deltaY < 0) this.jump();
          else this.slide();
        }
      }
    }, { passive: true });

    document.getElementById('btnLeft')?.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.moveLeft(); });
    document.getElementById('btnRight')?.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.moveRight(); });
    document.getElementById('btnJump')?.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.jump(); });
    document.getElementById('btnSlide')?.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.slide(); });
  }

  moveLeft() {
    if (this.isDead) return;
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetX = LANES[this.currentLane];
      gameAudio.playSwipe();
    }
  }

  moveRight() {
    if (this.isDead) return;
    if (this.currentLane < LANES.length - 1) {
      this.currentLane++;
      this.targetX = LANES[this.currentLane];
      gameAudio.playSwipe();
    }
  }

  jump() {
    if (this.isDead) return;
    if (!this.isJumping) {
      this.isJumping = true;
      this.jumpVelocity = this.superJump ? this.jumpForce * 1.35 : this.jumpForce;
      this.isSliding = false;
      this.slideTimer = 0;
      gameAudio.playJump(this.superJump);
    } else {
      this.jumpBufferTimer = 0.15;
    }
  }

  slide() {
    if (this.isDead) return;
    if (this.isJumping) {
      this.jumpVelocity = -22;
    }
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    gameAudio.playSlide();
  }

  getAABB() {
    const halfWidth = 0.38;
    const halfDepth = 0.38;

    const boxHeight = this.isSliding ? 0.80 : 2.10;
    const minY = this.y;
    const maxY = this.y + boxHeight;

    return {
      minX: this.x - halfWidth,
      maxX: this.x + halfWidth,
      minY: minY,
      maxY: maxY,
      minZ: -halfDepth,
      maxZ: halfDepth
    };
  }

  update(dt, speed) {
    if (this.isDead) {
      this.deathAnimTime += dt;
      this.mesh.rotation.x = Math.min(Math.PI / 2, this.deathAnimTime * 4);
      this.mesh.position.y = Math.max(0.2, this.y - this.deathAnimTime * 2);
      return;
    }

    // 1. Interpolação Linear nas 3 Faixas
    this.x += (this.targetX - this.x) * Math.min(1.0, 18.0 * dt);
    this.mesh.position.x = this.x;

    const laneDiff = (this.targetX - this.x);
    this.mesh.rotation.z = -laneDiff * 0.08;

    // 2. Atualização Visual dos Power-ups Equipados
    const isSuper = this.superJump;
    if (this.lShoeGolden) this.lShoeGolden.visible = isSuper;
    if (this.rShoeGolden) this.rShoeGolden.visible = isSuper;
    if (this.lShoeNormal) this.lShoeNormal.visible = !isSuper;
    if (this.rShoeNormal) this.rShoeNormal.visible = !isSuper;

    if (this.handMagnet) {
      this.handMagnet.visible = this.magnetActive;
    }

    // 3. Física do Pulo
    if (this.isJumping) {
      this.y += this.jumpVelocity * dt;
      const currentGrav = this.jumpVelocity < 0 ? this.gravity * this.fallMultiplier : this.gravity;
      this.jumpVelocity += currentGrav * dt;

      if (this.y <= this.groundY) {
        this.y = this.groundY;
        this.isJumping = false;
        this.jumpVelocity = 0;

        if (this.jumpBufferTimer > 0) {
          this.jumpBufferTimer = 0;
          this.jump();
        }
      }
    }

    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;

    // 4. Slide 90 Graus
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.mesh.rotation.x = 0;
        this.mesh.position.y = this.y;
      }
    }

    this.animate(dt, speed);
  }

  animate(dt, speed) {
    this.animTime += dt * (speed / 16);

    if (this.isSliding) {
      this.mesh.rotation.x = -Math.PI / 2.2;
      this.mesh.position.y = 0.32;

      this.torso.rotation.x = 0;
      this.leftLeg.rotation.x = 0.1;
      this.rightLeg.rotation.x = 0.1;
      this.leftArmGroup.rotation.x = -0.5;
      this.rightArmGroup.rotation.x = -0.5;

      this.shadow.scale.set(1.5, 0.8, 1);
    } else if (this.isJumping) {
      this.mesh.rotation.x = 0;
      this.mesh.position.y = this.y;

      this.torso.rotation.x = -0.15;
      this.torso.position.y = 1.38;
      this.head.position.set(0, 2.12, 0);
      this.leftLeg.rotation.x = 0.55;
      this.rightLeg.rotation.x = -0.35;
      this.leftArmGroup.rotation.x = -1.2;
      this.rightArmGroup.rotation.x = -0.6;

      // Asas dos sapatos batem no ar ao pular
      if (this.superJump && this.lWing && this.rWing) {
        const wingFlap = Math.sin(this.animTime * 14) * 0.35;
        this.lWing.rotation.x = wingFlap;
        this.rWing.rotation.x = -wingFlap;
      }

      this.shadow.scale.set(0.65, 0.65, 1);
      this.shadow.material.opacity = Math.max(0.15, 0.45 - this.y * 0.08);
    } else {
      this.mesh.rotation.x = 0;
      this.mesh.position.y = this.y;

      this.torso.rotation.x = 0.12;
      this.torso.position.y = 1.38 + Math.sin(this.animTime * 2) * 0.04;
      this.head.position.set(0, 2.12, 0);

      const legSwing = Math.sin(this.animTime) * 0.75;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      // Se estiver segurando o ímã, o braço esquerdo fica levemente projetado à frente atraindo moedas
      if (this.magnetActive) {
        this.leftArmGroup.rotation.x = 0.4 + Math.sin(this.animTime * 1.5) * 0.15;
      } else {
        this.leftArmGroup.rotation.x = -legSwing * 0.85;
      }

      this.rightArmGroup.rotation.x = legSwing * 0.85;
      this.briefcase.rotation.x = Math.sin(this.animTime * 1.2) * 0.35;

      this.shadow.scale.set(1.0, 1.0, 1);
      this.shadow.material.opacity = 0.45;
    }
  }

  die() {
    this.isDead = true;
    this.deathAnimTime = 0;
  }

  reset() {
    this.currentLane = 1;
    this.targetX = 0;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isDead = false;
    this.deathAnimTime = 0;
    this.superJump = false;
    this.magnetActive = false;

    if (this.lShoeGolden) this.lShoeGolden.visible = false;
    if (this.rShoeGolden) this.rShoeGolden.visible = false;
    if (this.lShoeNormal) this.lShoeNormal.visible = true;
    if (this.rShoeNormal) this.rShoeNormal.visible = true;
    if (this.handMagnet) this.handMagnet.visible = false;

    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
  }
}
