// js/game/character.js — Modelo 3D com Suporte a Modelos GLB, Shader de Animação das Pernas e Física Fluida
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { gameAudio } from './audio.js';
import { RunnerInventory } from './characters.js';
import { modelLoader } from './model-loader.js';
import { textureAtlas } from './textures.js';

export const LANES = [-2.8, 0, 2.8];

export class Character {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    this.characterId = RunnerInventory.getSelectedCharacter().id;
    this.isGLB = false;
    this.bodyPivot = null;

    this.currentLane = 1;
    this.targetX = 0;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.groundY = 0;

    // Física e Agilidade Escalável
    this.baseSpeed = 32;
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.gravity = -38;
    this.jumpForce = 17.5;
    this.fallMultiplier = 1.15;
    this.jumpBufferTimer = 0;
    this.wasAirborne = false;
    this.landingImpact = 0.0;

    // Slide
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.58;

    // Morte Física 3D
    this.isDead = false;
    this.deathAnimTime = 0;
    this.deathVy = 0;
    this.deathY = 0;

    // Power-ups
    this.superJump = false;
    this.magnetActive = false;

    // Uniforms do Shader para Animação Realista das Pernas
    this.uniforms = {
      uRunTime: { value: 0.0 },
      uLegSwing: { value: 0.72 },
      uJumpProgress: { value: 0.0 }
    };

    // Itens Equipáveis de Power-up
    this.lShoeGolden = null;
    this.rShoeGolden = null;
    this.lWing = null;
    this.rWing = null;
    this.handMagnet = null;
    this.shadow = null;

    this.animTime = 0;
    this.build();
    this.setupControls();
  }

  setCharacter(charId) {
    if (this.characterId === charId && this.bodyPivot) return;
    this.characterId = charId;
    this.build();
  }

  clearMesh() {
    while (this.mesh.children.length > 0) {
      const obj = this.mesh.children[0];
      this.mesh.remove(obj);
    }
    this.bodyPivot = null;
    this.isGLB = false;
  }

  build() {
    this.clearMesh();

    const charId = this.characterId || 'empresario';
    const glbModel = modelLoader.getModel(charId);

    if (glbModel) {
      this.isGLB = true;
      this.bodyPivot = new THREE.Group();

      // Calcula Bounding Box Exata e Escala para Altura Padrão de 2.10m
      const box = new THREE.Box3().setFromObject(glbModel);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const targetHeight = 2.10;
      const scale = targetHeight / Math.max(0.001, size.y);
      glbModel.scale.set(scale, scale, scale);

      // Centraliza horizontalmente e apoia a base dos pés exatamente em Y = 0
      glbModel.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

      // Gira 180° para ficar de costas para o jogador (correndo para a frente / horizonte)
      glbModel.rotation.y = Math.PI;

      // Injeta o shader de animação fisiológica de pernas em todas as malhas do modelo
      glbModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.castShadow = true;
          child.receiveShadow = true;

          child.material = child.material.clone();
          child.material.onBeforeCompile = (shader) => {
            shader.uniforms.uRunTime = this.uniforms.uRunTime;
            shader.uniforms.uLegSwing = this.uniforms.uLegSwing;
            shader.uniforms.uJumpProgress = this.uniforms.uJumpProgress;

            shader.vertexShader = `
              uniform float uRunTime;
              uniform float uLegSwing;
              uniform float uJumpProgress;
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>
              // Animação Fisiológica das Pernas (Vértices abaixo do quadril)
              if (position.y < 0.04) {
                float legWeight = clamp((-position.y + 0.04) / 0.92, 0.0, 1.0);
                float legSide = position.x < 0.0 ? -1.0 : 1.0;

                // 1. Balanço das Pernas na Corrida (Passadas Alternadas Esquerda/Direita)
                float swing = sin(uRunTime + (legSide > 0.0 ? 3.14159 : 0.0)) * uLegSwing * legWeight;

                // 2. Modificação no Pulo: Esticar no ar ou amortecer no pouso
                if (uJumpProgress > 0.1) {
                  // Subindo no ar: estica as pernas para baixo/trás com postura atlética
                  swing = -0.28 * legWeight;
                } else if (uJumpProgress < -0.1) {
                  // Descendo no ar: projeta as pernas para a frente preparando o pouso
                  swing = 0.24 * legWeight;
                }

                float cosA = cos(swing);
                float sinA = sin(swing);

                float py = transformed.y;
                float pz = transformed.z;
                transformed.y = py * cosA - pz * sinA;
                transformed.z = py * sinA + pz * cosA;

                // Dobra e flexão do joelho quando a perna é puxada para trás
                if (swing < -0.04) {
                  transformed.y += (-swing) * 0.18 * legWeight;
                }
              }
              `
            );
          };
        }
      });

      this.bodyPivot.add(glbModel);
      this.mesh.add(this.bodyPivot);

      // Itens de Power-up em 3D
      this.buildPowerupAccessories();

      // Sombra Suave Realista com Gradiente Radial Difuso
      const shadowGeo = new THREE.PlaneGeometry(1.6, 2.0);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: textureAtlas.softShadowTexture,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      });
      this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
      this.shadow.rotation.x = -Math.PI / 2;
      this.shadow.position.y = 0.03;
      this.mesh.add(this.shadow);

      if (!this.scene.children.includes(this.mesh)) {
        this.scene.add(this.mesh);
      }
    }
  }

  buildPowerupAccessories() {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0xb45309,
      emissiveIntensity: 0.35
    });

    // Sapato Dourado Alado Esquerdo
    this.lShoeGolden = new THREE.Group();
    this.lShoeGolden.position.set(-0.24, 0.12, 0.08);
    const lGoldBoot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.54), goldMat);
    lGoldBoot.castShadow = true;
    this.lWing = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 4), goldMat);
    this.lWing.rotation.set(0, 0, Math.PI / 2);
    this.lWing.position.set(-0.22, 0.08, -0.05);
    this.lShoeGolden.add(lGoldBoot, this.lWing);
    this.lShoeGolden.visible = false;

    // Sapato Dourado Alado Direito
    this.rShoeGolden = new THREE.Group();
    this.rShoeGolden.position.set(0.24, 0.12, 0.08);
    const rGoldBoot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.54), goldMat);
    rGoldBoot.castShadow = true;
    this.rWing = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 4), goldMat);
    this.rWing.rotation.set(0, 0, -Math.PI / 2);
    this.rWing.position.set(0.22, 0.08, -0.05);
    this.rShoeGolden.add(rGoldBoot, this.rWing);
    this.rShoeGolden.visible = false;

    this.mesh.add(this.lShoeGolden, this.rShoeGolden);

    // Ímã 3D na mão
    this.handMagnet = this.createHandMagnet3D();
    this.handMagnet.position.set(-0.48, 1.05, 0.22);
    this.handMagnet.rotation.set(Math.PI / 6, 0, 0);
    this.handMagnet.scale.set(0.75, 0.75, 0.75);
    this.handMagnet.visible = false;
    this.mesh.add(this.handMagnet);
  }

  createHandMagnet3D() {
    const group = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6, roughness: 0.25 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });

    const arcGeo = new THREE.TorusGeometry(0.32, 0.09, 12, 24, Math.PI);
    const arc = new THREE.Mesh(arcGeo, redMat);
    arc.rotation.z = Math.PI;
    group.add(arc);

    [-0.32, 0.32].forEach(px => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.32, 12), redMat);
      arm.position.set(px, -0.16, 0);
      group.add(arm);

      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.14, 12), silverMat);
      tip.position.set(px, -0.38, 0);
      group.add(tip);
    });

    return group;
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (this.isDead) return;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.moveLeft();
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.moveRight();
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) this.jump();
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.slide();
    });

    // Touch Swipes Mobile
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.isDead) return;
      if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        const dt = Date.now() - startTime;

        if (dt < 450) {
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
            if (dx > 0) this.moveRight();
            else this.moveLeft();
          } else if (Math.abs(dy) > 30) {
            if (dy < 0) this.jump();
            else this.slide();
          }
        }
      }
    }, { passive: true });

    // Botões HUD Touch na Tela
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
    if (!this.isJumping && Math.abs(this.y - this.groundY) < 0.15) {
      this.isJumping = true;
      this.wasAirborne = true;
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
      this.deathVy -= 26.0 * dt;
      this.deathY = Math.max(0.12, this.deathY + this.deathVy * dt);

      // Rotação física dramática de tombo e capotamento em 3D
      this.mesh.rotation.x += 7.0 * dt;
      this.mesh.rotation.y += 4.5 * dt;
      this.mesh.rotation.z += 5.5 * dt;
      this.mesh.position.y = this.deathY;
      this.mesh.position.z += 3.5 * dt;

      if (this.shadow) {
        this.shadow.scale.set(0.5, 0.5, 1);
        this.shadow.material.opacity = Math.max(0, 0.60 - this.deathAnimTime * 0.5);
      }
      return;
    }

    // 1. Interpolação Linear nas 3 Faixas com Rolagem e Direcionamento Realista
    const speedFactor = Math.max(1.0, speed / this.baseSpeed);
    const lerpRate = 18.0 + (speedFactor - 1.0) * 3.8;
    this.x += (this.targetX - this.x) * Math.min(1.0, lerpRate * dt);
    this.mesh.position.x = this.x;

    const laneDiff = (this.targetX - this.x);
    // Inclinação ágil do corpo nas curvas (banking roll) e direcionamento da cabeça/ombros
    this.mesh.rotation.z = -laneDiff * 0.16;
    this.mesh.rotation.y = -laneDiff * 0.20;

    // 2. Atualização Visual dos Power-ups Equipados
    const isSuper = this.superJump;
    if (this.lShoeGolden) this.lShoeGolden.visible = isSuper;
    if (this.rShoeGolden) this.rShoeGolden.visible = isSuper;

    if (this.handMagnet) {
      this.handMagnet.visible = this.magnetActive;
    }

    // 3. Física do Pulo, Gravidade e Amortecimento de Pouso
    const isAirborne = this.isJumping || this.y > this.groundY;
    if (isAirborne) {
      this.wasAirborne = true;
      this.y += this.jumpVelocity * dt;
      const currentGrav = this.jumpVelocity < 0 ? this.gravity * this.fallMultiplier : this.gravity;
      this.jumpVelocity += currentGrav * dt;

      if (this.y <= this.groundY) {
        this.y = this.groundY;
        this.isJumping = false;
        this.jumpVelocity = 0;

        // Amortecimento elástico da queda com as pernas ao tocar o piso
        if (this.wasAirborne) {
          this.landingImpact = 0.28;
          this.wasAirborne = false;
        }

        if (this.jumpBufferTimer > 0) {
          this.jumpBufferTimer = 0;
          this.jump();
        }
      }
    } else {
      if (this.y < this.groundY) this.y = this.groundY;
      this.wasAirborne = false;
    }

    // Escala dinâmica e desvanecimento realista da sombra conforme a altura do pulo
    if (this.shadow) {
      const jumpHeight = Math.max(0, this.y - this.groundY);
      const heightRatio = Math.min(1.0, jumpHeight / 4.5);
      const shadowScale = Math.max(0.40, 1.0 - heightRatio * 0.50);
      this.shadow.scale.set(shadowScale, shadowScale * 1.1, 1);
      this.shadow.material.opacity = Math.max(0.08, 0.75 * (1.0 - heightRatio * 0.75));
    }

    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;

    // 4. Slide
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

    if (this.isGLB && this.bodyPivot) {
      if (this.isSliding) {
        // Deslize com perfil baixo e postura ágil
        this.uniforms.uLegSwing.value = 0.0;
        this.uniforms.uJumpProgress.value = 0.0;
        this.mesh.rotation.x = -Math.PI / 2.15;
        this.mesh.position.y = this.y + 0.26;
        this.bodyPivot.position.set(0, 0, 0);
        this.bodyPivot.rotation.set(0, 0, 0);
        this.bodyPivot.scale.set(1.0, 1.0, 1.0);
        if (this.shadow) this.shadow.scale.set(1.6, 0.9, 1);
      } else if (this.isJumping || this.y > this.groundY + 0.05) {
        // Dinâmica de Pulo no Ar: Estica no salto e flexiona na queda
        this.mesh.rotation.x = 0;
        this.mesh.position.y = this.y;

        const isAscending = this.jumpVelocity > 0;
        if (isAscending) {
          // Subindo: estica as pernas para trás com postura atlética
          this.uniforms.uJumpProgress.value = 1.0;
          this.uniforms.uLegSwing.value = 0.0;
          this.bodyPivot.rotation.x = -0.22;
          this.bodyPivot.position.set(0, 0.05, 0);
          this.bodyPivot.scale.set(0.94, 1.10, 0.94);
        } else {
          // Descendo: pernas alcançam o solo e antecipam o pouso
          this.uniforms.uJumpProgress.value = -1.0;
          this.uniforms.uLegSwing.value = 0.0;
          this.bodyPivot.rotation.x = 0.16;
          this.bodyPivot.position.set(0, 0, 0);
          this.bodyPivot.scale.set(1.04, 0.96, 1.04);
        }
        this.bodyPivot.rotation.y = 0;
        this.bodyPivot.rotation.z = 0;

        if (this.superJump && this.lWing && this.rWing) {
          const wingFlap = Math.sin(this.animTime * 16) * 0.40;
          this.lWing.rotation.x = wingFlap;
          this.rWing.rotation.x = -wingFlap;
        }
      } else {
        // Corrida com Passadas Fisiológicas nas Pernas, Bobbing e Amortecimento
        this.mesh.rotation.x = 0;
        this.mesh.position.y = this.y;

        this.uniforms.uJumpProgress.value = 0.0;
        this.uniforms.uLegSwing.value = 0.72;
        this.uniforms.uRunTime.value = this.animTime * 2.2;

        const runBounce = Math.sin(this.animTime * 2.2);
        const runTwist = Math.sin(this.animTime * 1.1);

        // Sprint e torção do tronco
        this.bodyPivot.rotation.x = 0.15;
        this.bodyPivot.rotation.y = runTwist * 0.12;
        this.bodyPivot.rotation.z = runTwist * 0.04;

        // Amortecimento dinâmico de pouso (mola amortecedora com pernas flexionando)
        let squashY = 0;
        if (this.landingImpact > 0) {
          squashY = this.landingImpact * 0.45;
          this.landingImpact = Math.max(0, this.landingImpact - dt * 3.2);
        }

        this.bodyPivot.position.y = Math.max(0, runBounce * 0.07) - squashY;
        const stretch = (1.0 + runBounce * 0.03) - squashY * 0.8;
        const squash = (1.0 - runBounce * 0.02) + squashY * 0.4;
        this.bodyPivot.scale.set(squash, stretch, squash);
      }
    }
  }

  die() {
    this.isDead = true;
    this.deathAnimTime = 0;
    this.deathVy = 9.0;
    this.deathY = this.y;
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
    this.deathVy = 0;
    this.deathY = 0;
    this.wasAirborne = false;
    this.landingImpact = 0.0;
    this.superJump = false;
    this.magnetActive = false;

    if (this.bodyPivot) {
      this.bodyPivot.position.set(0, 0, 0);
      this.bodyPivot.rotation.set(0, 0, 0);
      this.bodyPivot.scale.set(1, 1, 1);
    }

    if (this.lShoeGolden) this.lShoeGolden.visible = false;
    if (this.rShoeGolden) this.rShoeGolden.visible = false;
    if (this.handMagnet) this.handMagnet.visible = false;

    if (this.shadow) {
      this.shadow.scale.set(1.0, 1.0, 1);
      this.shadow.material.opacity = 0.75;
    }

    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
  }
}
