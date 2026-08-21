// js/game/character.js — Modelo 3D do Empresário Realista, Física de Salto Calibrada e Controles Snappy
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { gameAudio } from './audio.js';

export const LANES = [-2.8, 0, 2.8]; // Esquerda, Centro, Direita

export class Character {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Posição e Faixas
    this.currentLane = 1; // Centro
    this.targetX = 0;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.groundY = 0;

    // Física e Salto Refinado (Snappy & Ágil como Subway Surfers)
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.gravity = -42; // Gravidade ágil
    this.fallMultiplier = 1.35; // Queda mais rápida para evitar sensação de "flutuar"
    this.jumpForce = 15.2; // Altura ideal para pular sobre CLT/Bolsa e alcançar moedas no ar (~2.7m a 3.1m)

    // Assistentes de Salto (Coyote Time & Buffer)
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

    // Partes do Corpo
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
    // Materiais Refinados para o Empresário de Luxo
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.1 }); // Terno Azul Marinho
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }); // Camisa Branca
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });   // Gravata Vermelha
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });  // Tom de Pele
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });  // Cabelo Penteado
    const glassesFrameMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 }); // Armação Dourada
    const glassesLensMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.8 }); // Lente Escura Ray-Ban
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });  // Sapato Social Preto
    const soleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });  // Sola Marrom
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });// Maleta Couro Nobre
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.15 }); // Detalhes Dourados / Relógio Rolex

    // 1. Tronco com Paletó e Lapelas Modeladas
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.98, 0.46), suitMat);
    this.torso.position.y = 1.38;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Lapelas do Paletó
    const lapelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.06), suitMat);
    lapelLeft.position.set(-0.20, 1.46, 0.23);
    lapelLeft.rotation.z = -0.15;
    this.mesh.add(lapelLeft);

    const lapelRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.06), suitMat);
    lapelRight.position.set(0.20, 1.46, 0.23);
    lapelRight.rotation.z = 0.15;
    this.mesh.add(lapelRight);

    // Camisa Social Branca e Colarinho
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.54, 0.05), shirtMat);
    shirt.position.set(0, 1.50, 0.22);
    this.mesh.add(shirt);

    // Gravata Vermelha 3D com Prendedor de Ouro
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.44, 0.06), tieMat);
    tie.position.set(0, 1.45, 0.24);
    this.mesh.add(tie);

    const tieClip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.07), goldMat);
    tieClip.position.set(0, 1.46, 0.25);
    this.mesh.add(tieClip);

    // Lenço de Bolso Branco (Pocket Square)
    const pocketSquare = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.03), shirtMat);
    pocketSquare.position.set(-0.25, 1.62, 0.24);
    this.mesh.add(pocketSquare);

    // 2. Cabeça com Feições, Cabelo Modelado e Óculos Ray-Ban de Ouro
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.44), skinMat);
    this.head.position.y = 2.10;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Cabelo Penteado para Trás com Volume
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.20, 0.48), hairMat);
    hairTop.position.set(0, 0.24, -0.02);
    this.head.add(hairTop);

    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.32, 0.12), hairMat);
    hairBack.position.set(0, 0.06, -0.22);
    this.head.add(hairBack);

    // Nariz 3D
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.08), skinMat);
    nose.position.set(0, -0.04, 0.24);
    this.head.add(nose);

    // Óculos Escuros Aviador com Armação Dourada e Lentes Espelhadas
    const glassesFrame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.08), glassesFrameMat);
    glassesFrame.position.set(0, 0.06, 0.22);
    this.head.add(glassesFrame);

    const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.09), glassesLensMat);
    lensL.position.set(-0.11, 0.06, 0.23);
    this.head.add(lensL);

    const lensR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.09), glassesLensMat);
    lensR.position.set(0.11, 0.06, 0.23);
    this.head.add(lensR);

    // 3. Braços com Articulações e Relógio Rolex de Ouro
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.50, 1.74, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.72, 0.20), suitMat);
    leftArmMesh.position.y = -0.36;
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);

    // Mão Esquerda
    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), skinMat);
    leftHand.position.set(0, -0.76, 0);
    this.leftArmGroup.add(leftHand);

    // Relógio Rolex de Ouro no Pulso Esquerdo
    const rolex = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16), goldMat);
    rolex.position.set(0, -0.68, 0);
    this.leftArmGroup.add(rolex);
    this.mesh.add(this.leftArmGroup);

    // Braço Direito com a Maleta Fixa Firme
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.50, 1.74, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.72, 0.20), suitMat);
    rightArmMesh.position.y = -0.36;
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);

    // Mão Direita Segurando a Maleta
    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), skinMat);
    rightHand.position.set(0, -0.76, 0);
    this.rightArmGroup.add(rightHand);

    // Maleta Executiva de Couro Nobre com Travas Douradas
    this.briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.40, 0.52), leatherMat);
    this.briefcase.position.set(0.06, -0.84, 0.06);
    this.briefcase.castShadow = true;

    // Alça da Maleta
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.22), goldMat);
    handle.position.set(0, 0.23, 0);
    this.briefcase.add(handle);

    // Fechos Metálicos Dourados
    [-0.14, 0.14].forEach(fz => {
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.06, 0.06), goldMat);
      lock.position.set(0, 0.08, fz);
      this.briefcase.add(lock);
    });

    this.rightArmGroup.add(this.briefcase);
    this.mesh.add(this.rightArmGroup);

    // 4. Pernas com Calça de Alfaiataria e Sapatos Sociais Bicolores
    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.88, 0.28), suitMat);
    this.leftLeg.position.set(-0.21, 0.46, 0);
    this.leftLeg.castShadow = true;

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.42), shoeMat);
    leftShoe.position.set(0, -0.42, 0.07);
    this.leftLeg.add(leftShoe);

    const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.04, 0.44), soleMat);
    leftSole.position.set(0, -0.50, 0.07);
    this.leftLeg.add(leftSole);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.88, 0.28), suitMat);
    this.rightLeg.position.set(0.21, 0.46, 0);
    this.rightLeg.castShadow = true;

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.42), shoeMat);
    rightShoe.position.set(0, -0.42, 0.07);
    this.rightLeg.add(rightShoe);

    const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.04, 0.44), soleMat);
    rightSole.position.set(0, -0.50, 0.07);
    this.rightLeg.add(rightSole);
    this.mesh.add(this.rightLeg);

    // 5. Sombra no Chão
    const shadowGeo = new THREE.PlaneGeometry(1.3, 1.3);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.40 });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.03;
    this.mesh.add(this.shadow);

    this.scene.add(this.mesh);
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (this.isDead) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); this.moveLeft(); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); this.moveRight(); }
      else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') { e.preventDefault(); this.jump(); }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); this.slide(); }
    });

    let touchX = 0, touchY = 0;
    const container = document.getElementById('canvasContainer');
    if (container) {
      container.addEventListener('touchstart', (e) => {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        if (this.isDead) return;
        const dx = e.changedTouches[0].clientX - touchX;
        const dy = e.changedTouches[0].clientY - touchY;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 25) this.moveRight();
          else if (dx < -25) this.moveLeft();
        } else {
          if (dy < -25) this.jump();
          else if (dy > 25) this.slide();
        }
      }, { passive: true });
    }

    const btnL = document.getElementById('btnLeft');
    const btnR = document.getElementById('btnRight');
    const btnJ = document.getElementById('btnJump');
    const btnS = document.getElementById('btnSlide');

    if (btnL) btnL.onclick = () => this.moveLeft();
    if (btnR) btnR.onclick = () => this.moveRight();
    if (btnJ) btnJ.onclick = () => this.jump();
    if (btnS) btnS.onclick = () => this.slide();
  }

  moveLeft() {
    if (this.currentLane > 0 && !this.isDead) {
      this.currentLane--;
      this.targetX = LANES[this.currentLane];
      gameAudio.playLaneSwitch();
    }
  }

  moveRight() {
    if (this.currentLane < 2 && !this.isDead) {
      this.currentLane++;
      this.targetX = LANES[this.currentLane];
      gameAudio.playLaneSwitch();
    }
  }

  jump() {
    if (this.isDead) return;

    // Se estiver no chão ou dentro da janela de Coyote Time
    const canJumpNow = !this.isJumping || Math.abs(this.y - this.groundY) < 0.25 || this.coyoteTimer > 0;

    if (canJumpNow) {
      this.isJumping = true;
      this.jumpVelocity = this.superJump ? this.jumpForce * 1.3 : this.jumpForce;
      this.isSliding = false;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      gameAudio.playJump(this.superJump);
    } else {
      // Buffer para acionar salto se pressionado 0.15s antes de tocar o chão
      this.jumpBufferTimer = 0.18;
    }
  }

  slide() {
    if (this.isDead) return;

    // Se estiver no ar, faz um Fast-Fall (mergulho rápido para o chão)
    if (this.isJumping && this.jumpVelocity > -10) {
      this.jumpVelocity = -28;
    }

    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    gameAudio.playSlide();
  }

  die() {
    this.isDead = true;
    this.deathAnimTime = 0;
  }

  reset() {
    this.isDead = false;
    this.deathAnimTime = 0;
    this.currentLane = 1;
    this.targetX = 0;
    this.x = 0;
    this.y = 0;
    this.groundY = 0;
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.isSliding = false;
    this.superJump = false;
    this.magnetActive = false;

    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.scale.set(1, 1, 1);
    if (this.briefcase) {
      this.briefcase.position.set(0.06, -0.84, 0.06);
      this.briefcase.rotation.set(0, 0, 0);
    }
  }

  update(dt, speed) {
    if (this.isDead) {
      // Animação de Tombo / Queda no Game Over
      this.deathAnimTime += dt;
      if (this.deathAnimTime < 0.6) {
        this.mesh.rotation.x = -Math.min(Math.PI / 2, this.deathAnimTime * 3.5);
        this.mesh.position.y = Math.max(0.2, 1.0 - this.deathAnimTime * 1.5);
        if (this.briefcase) {
          this.briefcase.position.x += 1.8 * dt;
          this.briefcase.position.y += 1.2 * dt;
          this.briefcase.rotation.z += 6 * dt;
        }
      }
      return;
    }

    // 1. Transição Lateral Rápida e Responsiva (Lerp)
    this.x += (this.targetX - this.x) * (26 * dt);
    this.mesh.position.x = this.x;

    const laneDelta = this.targetX - this.x;
    this.mesh.rotation.z = -laneDelta * 0.16;

    // 2. Timers de Pulo (Coyote & Buffer)
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
    if (this.coyoteTimer > 0) this.coyoteTimer -= dt;

    const isOnGround = Math.abs(this.y - this.groundY) < 0.05 && !this.isJumping;
    if (isOnGround) {
      this.coyoteTimer = 0.12;
    }

    // 3. Física Vertical Calibrada (Pulo Snappy com Gravidade Dinâmica)
    if (this.isJumping) {
      const currentGravity = this.jumpVelocity < 0 ? (this.gravity * this.fallMultiplier) : this.gravity;
      this.y += this.jumpVelocity * dt;
      this.jumpVelocity += currentGravity * dt;

      // Aterrissagem no chão ou no teto do trem
      if (this.jumpVelocity <= 0 && this.y <= this.groundY) {
        this.y = this.groundY;
        this.isJumping = false;
        this.jumpVelocity = 0;

        // Se havia salto no buffer, executa imediatamente
        if (this.jumpBufferTimer > 0) {
          this.jump();
        }
      }
    } else {
      // Ajuste suave quando sai ou sobe no teto do trem
      if (this.y > this.groundY) {
        this.y = Math.max(this.groundY, this.y - 26 * dt);
      } else if (this.y < this.groundY) {
        this.y = Math.min(this.groundY, this.y + 30 * dt);
      }
    }

    // 4. Slide / Agachamento
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.isSliding = false;
    }

    if (this.isSliding) {
      this.mesh.scale.set(1.0, 0.40, 1.35);
      this.mesh.position.y = this.groundY + 0.22;
    } else {
      this.mesh.scale.set(1.0, 1.0, 1.0);
      this.mesh.position.y = this.y;
    }

    // 5. Animação de Membros
    this.animTime += dt * (speed * 0.42);
    const legSwing = Math.sin(this.animTime) * 0.85;
    const armSwing = Math.sin(this.animTime) * 0.75;

    if (!this.isJumping && !this.isSliding) {
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      this.leftArmGroup.rotation.x = -armSwing;
      this.rightArmGroup.rotation.x = armSwing;
      this.head.rotation.y = Math.sin(this.animTime * 0.5) * 0.06;
    } else if (this.isJumping) {
      this.leftLeg.rotation.x = -0.4;
      this.rightLeg.rotation.x = -0.5;
      this.leftArmGroup.rotation.x = 0.6;
      this.rightArmGroup.rotation.x = 0.6;
    } else if (this.isSliding) {
      this.leftLeg.rotation.x = 0.95;
      this.rightLeg.rotation.x = 0.95;
      this.leftArmGroup.rotation.x = -0.8;
      this.rightArmGroup.rotation.x = -0.8;
    }
  }
}
