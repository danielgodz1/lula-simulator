// js/game/character.js — Modelo 3D do Empresário, AABB Hitboxes Calibradas e Controles Touch Nativos (Swipes)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { gameAudio } from './audio.js';

export const LANES = [-2.8, 0, 2.8]; // Esquerda (-2.8), Centro (0), Direita (2.8)

export class Character {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Posição e Faixas
    this.currentLane = 1; // 0 = Esquerda, 1 = Centro, 2 = Direita
    this.targetX = 0;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.groundY = 0;

    // Física e Salto Refinado (Salto Ágil e Curva de Gravidade Responsiva)
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.gravity = -38;
    this.jumpForce = 17.2;
    this.fallMultiplier = 1.15;

    // Assistentes de Salto (Coyote Time & Buffer para zero input lag)
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;

    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.55;

    this.isDead = false;
    this.deathAnimTime = 0;

    // Power-ups
    this.superJump = false;
    this.magnetActive = false;

    // Partes do Corpo para Animação Procedural
    this.torso = null;
    this.head = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftArmGroup = null;
    this.rightArmGroup = null;
    this.briefcase = null;
    this.shadow = null;

    this.animTime = 0;
    this.build();
    this.setupControls();
  }

  build() {
    // Materiais Refinados para o Empresário
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.1 }); // Terno Azul Marinho
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }); // Camisa Branca
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });   // Gravata Vermelha
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });  // Tom de Pele
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });  // Cabelo Penteado
    const glassesFrameMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 }); // Óculos Dourados
    const glassesLensMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.8 }); // Lentes Escuras
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });  // Sapato Preto
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });// Maleta de Couro
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.15 }); // Relógio Rolex

    // 1. Tronco com Paletó
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.96, 0.44), suitMat);
    this.torso.position.y = 1.38;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Lapelas do Paletó
    const lapelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.60, 0.06), suitMat);
    lapelLeft.position.set(-0.20, 1.46, 0.22);
    lapelLeft.rotation.z = -0.15;
    this.mesh.add(lapelLeft);

    const lapelRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.60, 0.06), suitMat);
    lapelRight.position.set(0.20, 1.46, 0.22);
    lapelRight.rotation.z = 0.15;
    this.mesh.add(lapelRight);

    // Camisa Social Branca e Gravata
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

    // Óculos Ray-Ban Dourado
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

    // 3. Pernas e Sapatos
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.22, 0.90, 0);
    const lPants = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.90, 0.36), suitMat);
    lPants.position.y = -0.45;
    lPants.castShadow = true;
    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.50), shoeMat);
    lShoe.position.set(0, -0.90, 0.08);
    lShoe.castShadow = true;
    this.leftLeg.add(lPants, lShoe);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.22, 0.90, 0);
    const rPants = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.90, 0.36), suitMat);
    rPants.position.y = -0.45;
    rPants.castShadow = true;
    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.50), shoeMat);
    rShoe.position.set(0, -0.90, 0.08);
    rShoe.castShadow = true;
    this.rightLeg.add(rPants, rShoe);
    this.mesh.add(this.rightLeg);

    // 4. Braço Esquerdo
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.52, 1.76, 0);
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.86, 0.28), suitMat);
    lArm.position.y = -0.43;
    lArm.castShadow = true;
    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.20, 0.22), skinMat);
    lHand.position.y = -0.92;
    this.leftArmGroup.add(lArm, lHand);
    this.mesh.add(this.leftArmGroup);

    // 5. Braço Direito com Maleta de Couro e Rolex
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

    // Maleta de Dinheiro e Negócios
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

    // 6. Sombra Projetada no Chão
    const shadowGeo = new THREE.PlaneGeometry(1.4, 2.2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.03;
    this.mesh.add(this.shadow);

    this.scene.add(this.mesh);
  }

  setupControls() {
    // Teclado
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

    // Detecção Nativa e Precisa de Gestos Touch (Swipes Mobile)
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

      const minSwipeDistance = 25; // Sensibilidade calibrada para swipes rápidos

      if (elapsed < 500 && (absX > minSwipeDistance || absY > minSwipeDistance)) {
        if (absX > absY) {
          // Swipe Horizontal
          if (deltaX > 0) this.moveRight();
          else this.moveLeft();
        } else {
          // Swipe Vertical
          if (deltaY < 0) this.jump();
          else this.slide();
        }
      }
    }, { passive: true });

    // Botões HUD Touch
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
      gameAudio.playJump();
    } else {
      this.jumpBufferTimer = 0.15; // Buffer de pulo
    }
  }

  slide() {
    if (this.isDead) return;
    if (this.isJumping) {
      // Fast fall (corta o pulo e desce rapidamente)
      this.jumpVelocity = -22;
    }
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    gameAudio.playSlide();
  }

  /**
   * Retorna a AABB (Axis-Aligned Bounding Box) calibrada com 15% de tolerância
   */
  getAABB() {
    const halfWidth = 0.42 * 0.85; // ~15% menor nas bordas para evitar colisões injustas
    const halfDepth = 0.40 * 0.85;

    let minY = this.y + 0.1;
    let maxY = this.y + (this.isSliding ? 0.95 : 2.10);

    return {
      minX: this.x - halfWidth,
      maxX: this.x + halfWidth,
      minY: minY,
      maxY: maxY,
      minZ: this.z - halfDepth,
      maxZ: this.z + halfDepth
    };
  }

  update(dt, speed) {
    if (this.isDead) {
      this.deathAnimTime += dt;
      this.mesh.rotation.x = Math.min(Math.PI / 2, this.deathAnimTime * 4);
      this.mesh.position.y = Math.max(0.2, this.y - this.deathAnimTime * 2);
      return;
    }

    // 1. Interpolação Linear (Lerp) Snappy e Suave nas 3 Faixas
    this.x += (this.targetX - this.x) * Math.min(1.0, 18.0 * dt);
    this.mesh.position.x = this.x;

    // Inclinação sutil do corpo ao mudar de faixa
    const laneDiff = (this.targetX - this.x);
    this.mesh.rotation.z = -laneDiff * 0.08;

    // 2. Física do Pulo e Gravidade Responsiva
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

    this.mesh.position.y = this.y;

    // 3. Timer do Slide
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 4. Animação Procedural dos Membros e Maleta
    this.animate(dt, speed);
  }

  animate(dt, speed) {
    this.animTime += dt * (speed / 16);

    if (this.isSliding) {
      // Posição de Slide / Rolamento por baixo de obstáculos
      this.torso.rotation.x = 0.85;
      this.torso.position.y = 0.65;
      this.head.position.set(0, 1.15, 0.45);
      this.leftLeg.rotation.x = -1.2;
      this.rightLeg.rotation.x = -1.2;
      this.leftArmGroup.rotation.x = 1.1;
      this.rightArmGroup.rotation.x = 1.1;
      this.shadow.scale.set(1.4, 0.8, 1);
    } else if (this.isJumping) {
      // Posição no Ar
      this.torso.rotation.x = -0.15;
      this.torso.position.y = 1.38;
      this.head.position.set(0, 2.12, 0);
      this.leftLeg.rotation.x = 0.55;
      this.rightLeg.rotation.x = -0.35;
      this.leftArmGroup.rotation.x = -1.2;
      this.rightArmGroup.rotation.x = -0.6;
      this.shadow.scale.set(0.65, 0.65, 1);
      this.shadow.material.opacity = Math.max(0.15, 0.45 - this.y * 0.08);
    } else {
      // Corrida Fluida e Enérgica
      this.torso.rotation.x = 0.12;
      this.torso.position.y = 1.38 + Math.sin(this.animTime * 2) * 0.04;
      this.head.position.set(0, 2.12, 0);

      const legSwing = Math.sin(this.animTime) * 0.75;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      this.leftArmGroup.rotation.x = -legSwing * 0.85;
      this.rightArmGroup.rotation.x = legSwing * 0.85;

      // Balanço elegante da maleta
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

    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
  }
}
