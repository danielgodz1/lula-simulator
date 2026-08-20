// js/game/character.js — Modelo 3D do Empresário, Animações Procedurais e Controles
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

    // Física e Ações
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.gravity = -0.62;
    this.jumpForce = 9.8;

    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.55;

    this.isDead = false;
    this.deathAnimTime = 0;

    // Power-ups
    this.superJump = false;

    // Partes do Corpo
    this.torso = null;
    this.head = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftArm = null;
    this.rightArm = null;
    this.briefcase = null;
    this.shadow = null;

    this.animTime = 0;
    this.build();
    this.setupControls();
  }

  build() {
    const suitMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Terno Azul Marinho
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Camisa Branca
    const tieMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });   // Gravata Vermelha
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });  // Tom de Pele
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x1c1917 });  // Cabelo
    const glassesMat = new THREE.MeshLambertMaterial({ color: 0x09090b });// Óculos Escuros
    const shoeMat = new THREE.MeshLambertMaterial({ color: 0x111827 });  // Sapato
    const leatherMat = new THREE.MeshLambertMaterial({ color: 0x78350f });// Maleta Executiva
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });  // Fivela Dourada

    // 1. Tronco
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.95, 0.44), suitMat);
    this.torso.position.y = 1.35;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Camisa e Gravata
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.5, 0.04), shirtMat);
    shirt.position.set(0, 1.5, 0.22);
    this.mesh.add(shirt);

    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.42, 0.05), tieMat);
    tie.position.set(0, 1.45, 0.23);
    this.mesh.add(tie);

    // 2. Cabeça
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.44), skinMat);
    this.head.position.y = 2.05;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.46), hairMat);
    hair.position.set(0, 0.22, -0.02);
    this.head.add(hair);

    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.08), glassesMat);
    glasses.position.set(0, 0.04, 0.22);
    this.head.add(glasses);

    // 3. Braços com Articulação de Ombro (Garante que a maleta fique 100% firme na mão)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.48, 1.70, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.18), suitMat);
    leftArmMesh.position.y = -0.36;
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);
    this.mesh.add(this.leftArmGroup);

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.48, 1.70, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.18), suitMat);
    rightArmMesh.position.y = -0.36;
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);

    // Maleta Executiva Firmemente Presa na Mão Direita
    this.briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.48), leatherMat);
    this.briefcase.position.set(0.08, -0.65, 0.05); // Exatamente na mão
    this.briefcase.castShadow = true;

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.20), goldMat);
    handle.position.set(0, 0.22, 0);
    this.briefcase.add(handle);

    this.rightArmGroup.add(this.briefcase);
    this.mesh.add(this.rightArmGroup);

    // 4. Pernas
    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.85, 0.26), suitMat);
    this.leftLeg.position.set(-0.2, 0.45, 0);
    this.leftLeg.castShadow = true;
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.15, 0.38), shoeMat);
    leftShoe.position.set(0, -0.4, 0.06);
    this.leftLeg.add(leftShoe);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.85, 0.26), suitMat);
    this.rightLeg.position.set(0.2, 0.45, 0);
    this.rightLeg.castShadow = true;
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.15, 0.38), shoeMat);
    rightShoe.position.set(0, -0.4, 0.06);
    this.rightLeg.add(rightShoe);
    this.mesh.add(this.rightLeg);

    // 5. Sombra no Chão
    const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
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
          if (dx > 35) this.moveRight();
          else if (dx < -35) this.moveLeft();
        } else {
          if (dy < -35) this.jump();
          else if (dy > 35) this.slide();
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
    if (!this.isDead && (!this.isJumping || Math.abs(this.y - this.groundY) < 0.15)) {
      this.isJumping = true;
      this.jumpVelocity = this.superJump ? this.jumpForce * 1.35 : this.jumpForce;
      this.isSliding = false;
      gameAudio.playJump(this.superJump);
    }
  }

  slide() {
    if (!this.isSliding && !this.isDead) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      gameAudio.playSlide();
    }
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
    this.isSliding = false;
    this.superJump = false;

    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.scale.set(1, 1, 1);
    if (this.briefcase) {
      this.briefcase.position.set(0.08, -0.65, 0.05);
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

    // 1. Transição Lateral Suave (Lerp)
    this.x += (this.targetX - this.x) * (20 * dt);
    this.mesh.position.x = this.x;

    const laneDelta = this.targetX - this.x;
    this.mesh.rotation.z = -laneDelta * 0.14;

    // 2. Física Vertical (Pulo, Teto do Trem e Gravidade Suave)
    if (this.isJumping) {
      this.y += this.jumpVelocity * dt * 3.8;
      this.jumpVelocity += this.gravity * dt * 60;
      if (this.jumpVelocity < 0 && this.y <= this.groundY) {
        this.y = this.groundY;
        this.isJumping = false;
        this.jumpVelocity = 0;
      }
    } else {
      // Ajuste suave quando sai ou sobe no teto do trem
      if (this.y > this.groundY) {
        this.y = Math.max(this.groundY, this.y - 16 * dt);
      } else if (this.y < this.groundY) {
        this.y = Math.min(this.groundY, this.y + 20 * dt);
      }
    }

    // 3. Slide / Agachamento
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.isSliding = false;
    }

    if (this.isSliding) {
      this.mesh.scale.set(1.0, 0.42, 1.35);
      this.mesh.position.y = 0.22;
    } else {
      this.mesh.scale.set(1.0, 1.0, 1.0);
      this.mesh.position.y = this.y;
    }

    // 4. Animação de Membros com a Maleta Fixa na Mão
    this.animTime += dt * (speed * 0.4);
    const legSwing = Math.sin(this.animTime) * 0.85;
    const armSwing = Math.sin(this.animTime) * 0.75;

    if (!this.isJumping && !this.isSliding) {
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      this.leftArmGroup.rotation.x = -armSwing;
      this.rightArmGroup.rotation.x = armSwing;
      this.head.rotation.y = Math.sin(this.animTime * 0.5) * 0.06;
    } else if (this.isJumping) {
      this.leftLeg.rotation.x = -0.5;
      this.rightLeg.rotation.x = -0.6;
      this.leftArmGroup.rotation.x = 0.8;
      this.rightArmGroup.rotation.x = 0.8;
    } else if (this.isSliding) {
      this.leftLeg.rotation.x = 0.95;
      this.rightLeg.rotation.x = 0.95;
      this.leftArmGroup.rotation.x = -0.8;
      this.rightArmGroup.rotation.x = -0.8;
    }
  }
}
