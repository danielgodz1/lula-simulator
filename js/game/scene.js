// js/game/scene.js — Ciclo Dia/Noite Dinâmico (5h Madrugada -> Manhã -> Meio-Dia -> Pôr do Sol -> Noite Estrelada)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class GameScene {
  constructor(containerId = 'canvasContainer') {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.hemiLight = null;
    this.playerSpotLight = null; // Luz de pista para visibilidade à noite
    this.sunGroup = null;
    this.sunRays = null;
    this.moonMesh = null;
    this.skyMesh = null;
    this.skyCanvas = null;
    this.skyCtx = null;
    this.skyTexture = null;
    this.hillsGroup = null;
    this.kites = [];

    // Ciclo de Tempo (Começa às 5h da manhã / Madrugada = 0.04)
    this.timeOfDay = 0.04; // 0.0 = 04:00, 0.25 = 09:00, 0.50 = 13:00, 0.75 = 18:00, 0.90 = 22:00
    this.cycleSpeed = 0.007; // ~140 segundos para um ciclo completo de 24 horas

    // Monitor de Performance e Escalação Dinâmica
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    this.currentPixelRatio = 1.0;
    this.autoScaleAdjusted = false;

    this.init();
  }

  /**
   * Canvas dinâmico para renderizar o gradiente do céu que muda em tempo real
   */
  createDynamicSkyTexture() {
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = 256;
    this.skyCanvas.height = 256;
    this.skyCtx = this.skyCanvas.getContext('2d');
    this.skyTexture = new THREE.CanvasTexture(this.skyCanvas);
    this.skyTexture.wrapS = THREE.RepeatWrapping;
    this.skyTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.updateSkyGradient(this.timeOfDay);
    return this.skyTexture;
  }

  updateSkyGradient(t) {
    if (!this.skyCtx) return;
    const ctx = this.skyCtx;
    const size = 256;
    const grad = ctx.createLinearGradient(0, 0, 0, size);

    if (t < 0.15) {
      // 1. Madrugada / Alvorecer (5h - 7h)
      grad.addColorStop(0.0, '#090d16');
      grad.addColorStop(0.4, '#1e1b4b');
      grad.addColorStop(0.7, '#4338ca');
      grad.addColorStop(0.9, '#f43f5e');
      grad.addColorStop(1.0, '#fed7aa');
    } else if (t < 0.45) {
      // 2. Manhã Radiante (8h - 11h)
      grad.addColorStop(0.0, '#1d4ed8');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(0.8, '#7dd3fc');
      grad.addColorStop(1.0, '#bae6fd');
    } else if (t < 0.65) {
      // 3. Meio-Dia Tropical (12h - 15h)
      grad.addColorStop(0.0, '#0284c7');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(0.8, '#bae6fd');
      grad.addColorStop(1.0, '#e0f2fe');
    } else if (t < 0.85) {
      // 4. Pôr do Sol / Golden Hour (16h - 19h)
      grad.addColorStop(0.0, '#1e1b4b');
      grad.addColorStop(0.3, '#7c2d12');
      grad.addColorStop(0.6, '#ea580c');
      grad.addColorStop(0.85, '#f59e0b');
      grad.addColorStop(1.0, '#fef08a');
    } else {
      // 5. Noite Estrelada (20h - 4h)
      grad.addColorStop(0.0, '#020617');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(0.85, '#1e293b');
      grad.addColorStop(1.0, '#090d16');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Adiciona estrelas cintilantes à noite ou na madrugada
    if (t > 0.85 || t < 0.12) {
      ctx.fillStyle = '#ffffff';
      const starCount = 35;
      for (let i = 0; i < starCount; i++) {
        const sx = ((i * 37) % size);
        const sy = ((i * 53) % (size * 0.6));
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    }

    this.skyTexture.needsUpdate = true;
  }

  createSunTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.15, 'rgba(255, 250, 200, 0.95)');
    grad.addColorStop(0.32, 'rgba(255, 215, 0, 0.80)');
    grad.addColorStop(0.55, 'rgba(251, 146, 60, 0.45)');
    grad.addColorStop(0.80, 'rgba(249, 115, 22, 0.15)');
    grad.addColorStop(1.0, 'rgba(234, 88, 12, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  createSunRaysTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    const rayCount = 14;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i * Math.PI) / (rayCount / 2);
      const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.6)');
      grad.addColorStop(0.3, 'rgba(255, 223, 0, 0.35)');
      grad.addColorStop(0.7, 'rgba(249, 115, 22, 0.1)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(0, -center);
      ctx.lineTo(12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  init() {
    if (!this.container) return;

    // 1. Cena com Fog Atmosférico Dinâmico
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1b4b); // Começa em tom alvorecer
    this.scene.fog = new THREE.Fog(0x1e1b4b, 65, 250);

    // 2. Câmera em 3ª Pessoa
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 800);
    this.camera.position.set(0, 4.4, 7.2);
    this.camera.lookAt(0, 1.6, -14);

    // 3. Renderizador WebGL
    const isMobile = window.innerWidth <= 900;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: false,
      powerPreference: 'high-performance',
      precision: isMobile ? 'mediump' : 'highp'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.currentPixelRatio = isMobile 
      ? Math.min(window.devicePixelRatio || 1, 1.25)
      : Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(this.currentPixelRatio);

    this.renderer.shadowMap.enabled = !isMobile || window.innerWidth > 550;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Domo de Céu Dinâmico
    const skyGeo = new THREE.CylinderGeometry(340, 340, 200, 32, 1, true);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.createDynamicSkyTexture(),
      side: THREE.BackSide,
      fog: false
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyMesh.position.set(0, 50, -100);
    this.scene.add(this.skyMesh);

    // 5. Morros do Rio de Janeiro em Low-Poly
    this.createDistantHills();

    // 6. Luz Hemisférica e Luz Solar Direcional
    this.hemiLight = new THREE.HemisphereLight(0xffedd5, 0x475569, 0.85);
    this.hemiLight.position.set(0, 80, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff3d6, 1.1);
    this.sunLight.position.set(35, 75, 40);
    this.sunLight.castShadow = this.renderer.shadowMap.enabled;
    const shadowRes = isMobile ? 512 : 1024;
    this.sunLight.shadow.mapSize.width = shadowRes;
    this.sunLight.shadow.mapSize.height = shadowRes;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 240;
    this.sunLight.shadow.camera.left = -28;
    this.sunLight.shadow.camera.right = 28;
    this.sunLight.shadow.camera.top = 28;
    this.sunLight.shadow.camera.bottom = -28;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // 7. Luz de Iluminação Noturna na Pista do Jogador
    this.playerSpotLight = new THREE.PointLight(0xffedd5, 0.0, 35, 1.5);
    this.playerSpotLight.position.set(0, 5.2, 2.0);
    this.scene.add(this.playerSpotLight);

    // 8. Sol Dourado e Lua Prateada
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(15, 30, -280);

    const sunTexture = this.createSunTexture(512);
    const sunRaysTexture = this.createSunRaysTexture(512);

    const sunCoreMat = new THREE.SpriteMaterial({
      map: sunTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xffffff
    });
    const sunCoreSprite = new THREE.Sprite(sunCoreMat);
    sunCoreSprite.scale.set(70, 70, 1);
    this.sunGroup.add(sunCoreSprite);

    const sunHaloMat = new THREE.SpriteMaterial({
      map: sunTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xfb923c,
      opacity: 0.65
    });
    const sunHaloSprite = new THREE.Sprite(sunHaloMat);
    sunHaloSprite.scale.set(160, 160, 1);
    this.sunGroup.add(sunHaloSprite);

    const sunRaysMat = new THREE.SpriteMaterial({
      map: sunRaysTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xffdf00,
      opacity: 0.70
    });
    this.sunRays = new THREE.Sprite(sunRaysMat);
    this.sunRays.scale.set(180, 180, 1);
    this.sunGroup.add(this.sunRays);

    this.scene.add(this.sunGroup);

    // Lua 3D para a noite
    const moonGeo = new THREE.SphereGeometry(14, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(-35, 75, -280);
    this.moonMesh.visible = false;
    this.scene.add(this.moonMesh);

    // 9. Pipas
    this.createFloatingKites();

    window.addEventListener('resize', () => this.onResize());
  }

  createDistantHills() {
    this.hillsGroup = new THREE.Group();
    this.hillsGroup.position.set(0, 0, -220);

    const hillColors = [0x15803d, 0x166534, 0x14532d, 0x047857];

    for (let i = 0; i < 8; i++) {
      const radius = 25 + Math.random() * 20;
      const height = 45 + Math.random() * 35;
      const hillGeo = new THREE.ConeGeometry(radius, height, 7);
      const hillMat = new THREE.MeshLambertMaterial({
        color: hillColors[i % hillColors.length],
        flatShading: true
      });
      const hill = new THREE.Mesh(hillGeo, hillMat);
      const x = -130 + i * 38 + (Math.random() * 15 - 7.5);
      const z = -20 + (Math.random() * 30 - 15);
      hill.position.set(x, height / 2 - 8, z);
      this.hillsGroup.add(hill);
    }

    this.scene.add(this.hillsGroup);
  }

  createFloatingKites() {
    const kiteColors = [0xef4444, 0xfacc15, 0x3b82f6, 0x10b981, 0xec4899];
    const kiteGeo = new THREE.PlaneGeometry(1.6, 2.2);

    for (let i = 0; i < 5; i++) {
      const kiteMat = new THREE.MeshBasicMaterial({
        color: kiteColors[i % kiteColors.length],
        side: THREE.DoubleSide
      });
      const kite = new THREE.Mesh(kiteGeo, kiteMat);
      kite.rotation.z = Math.PI / 4;
      
      const x = (i % 2 === 0 ? -1 : 1) * (14 + Math.random() * 18);
      const y = 14 + Math.random() * 12;
      const z = -35 - i * 35;
      kite.position.set(x, y, z);

      this.scene.add(kite);
      this.kites.push({
        mesh: kite,
        baseX: x,
        baseY: y,
        baseZ: z,
        phase: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 1.5
      });
    }
  }

  /**
   * Atualiza o ciclo de iluminação e transições suaves de cor do dia/noite
   */
  updateDayNightCycle(dt) {
    this.timeOfDay = (this.timeOfDay + this.cycleSpeed * dt) % 1.0;
    const t = this.timeOfDay;

    this.updateSkyGradient(t);

    // Posição do Sol e Lua
    const sunAngle = t * Math.PI * 2;
    const sunY = Math.sin(sunAngle) * 75 + 10;
    const sunX = Math.cos(sunAngle) * 50;

    this.sunGroup.position.set(sunX, Math.max(-40, sunY), -280);
    this.sunLight.position.set(sunX * 0.8, Math.max(10, sunY), 40);

    const isNight = t > 0.82 || t < 0.14;
    this.moonMesh.visible = isNight;
    this.sunGroup.visible = !isNight || sunY > -10;

    // Transição de Cores de Iluminação e Fog
    if (t < 0.15) {
      // 5h - Alvorecer
      this.scene.fog.color.setHex(0x312e81);
      this.hemiLight.color.setHex(0xc7d2fe);
      this.hemiLight.groundColor.setHex(0x1e1b4b);
      this.hemiLight.intensity = 0.75;
      this.sunLight.color.setHex(0xfecdd3);
      this.sunLight.intensity = 0.95;
      this.playerSpotLight.intensity = 0.85; // Luz suave na pista
    } else if (t < 0.45) {
      // Manhã
      this.scene.fog.color.setHex(0xbae6fd);
      this.hemiLight.color.setHex(0xffedd5);
      this.hemiLight.groundColor.setHex(0x475569);
      this.hemiLight.intensity = 1.05;
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 1.45;
      this.playerSpotLight.intensity = 0.0;
    } else if (t < 0.65) {
      // Meio-Dia
      this.scene.fog.color.setHex(0xe0f2fe);
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.intensity = 1.15;
      this.sunLight.color.setHex(0xffffff);
      this.sunLight.intensity = 1.55;
      this.playerSpotLight.intensity = 0.0;
    } else if (t < 0.85) {
      // Pôr do Sol / Golden Hour
      this.scene.fog.color.setHex(0xfcd34d);
      this.hemiLight.color.setHex(0xfb923c);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.95;
      this.sunLight.color.setHex(0xf97316);
      this.sunLight.intensity = 1.30;
      this.playerSpotLight.intensity = 0.35;
    } else {
      // Noite
      this.scene.fog.color.setHex(0x0f172a);
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.55;
      this.sunLight.color.setHex(0x60a5fa);
      this.sunLight.intensity = 0.40;
      this.playerSpotLight.intensity = 1.45; // Iluminação total da pista para o jogador
    }

    return isNight;
  }

  /**
   * Retorna o horário formatado para exibição no HUD
   */
  getFormattedTime() {
    // 0.0 = 04:00, 1.0 = 04:00 do dia seguinte
    const totalMinutes = Math.floor((this.timeOfDay * 24 * 60 + 4 * 60) % (24 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const icon = (hours >= 5 && hours < 8) ? '🌅' : (hours >= 8 && hours < 17) ? '☀️' : (hours >= 17 && hours < 20) ? '🌇' : '🌙';
    return `${icon} ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  monitorPerformance() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const fps = 1000 / Math.max(delta, 1);
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 60) this.fpsHistory.shift();

    if (!this.autoScaleAdjusted && this.fpsHistory.length >= 60) {
      const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      if (avgFps < 45 && this.currentPixelRatio > 1.0) {
        this.currentPixelRatio = 1.0;
        this.renderer.setPixelRatio(1.0);
        this.renderer.shadowMap.enabled = false;
        this.sunLight.castShadow = false;
        this.autoScaleAdjusted = true;
      }
    }
  }

  updateCamera(targetX, targetY, isDead = false, dt = 0.016, elapsedTime = 0) {
    if (isDead) {
      this.camera.position.x += (targetX - this.camera.position.x) * (2.5 * dt);
      this.camera.position.y += (3.2 - this.camera.position.y) * (2.5 * dt);
      this.camera.position.z += (6.0 - this.camera.position.z) * (2.0 * dt);
      this.camera.lookAt(targetX, 1.2, -6);
      return;
    }

    this.camera.position.x += (targetX * 0.75 - this.camera.position.x) * (9.5 * dt);
    
    const targetCamY = 4.4 + Math.max(0, targetY * 0.35);
    this.camera.position.y += (targetCamY - this.camera.position.y) * (8.0 * dt);

    this.camera.lookAt(this.camera.position.x * 0.6, 1.6 + Math.max(0, targetY * 0.2), -16);

    // Luz do jogador acompanha sua posição
    if (this.playerSpotLight) {
      this.playerSpotLight.position.x = this.camera.position.x * 0.7;
    }

    if (this.sunRays) {
      this.sunRays.material.rotation += 0.05 * dt;
    }

    for (const k of this.kites) {
      k.mesh.position.x = k.baseX + Math.sin(elapsedTime * k.speed + k.phase) * 1.8;
      k.mesh.position.y = k.baseY + Math.cos(elapsedTime * (k.speed * 0.8) + k.phase) * 1.2;
      k.mesh.rotation.z = Math.PI / 4 + Math.sin(elapsedTime * k.speed) * 0.15;
    }
  }

  onResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  render() {
    this.monitorPerformance();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
