// js/game/scene.js — Céu Contínuo Sem Artefatos, Panorama Parallax Densa da Favela e Ciclo Dia/Noite Otimizado
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { textureAtlas } from './textures.js';

export class GameScene {
  constructor(containerId = 'canvasContainer') {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.fillLight = null;
    this.hemiLight = null;
    this.playerSpotLight = null;
    this.sunGroup = null;
    this.sunRays = null;
    this.moonMesh = null;
    this.skyDome = null;
    this.skyCanvas = null;
    this.skyCtx = null;
    this.skyTexture = null;
    this.parallaxFavela = null;
    this.clouds = [];
    this.birds = [];

    this.timeOfDay = 0.38; // Começa de dia com sol radiante e alta visibilidade (10h da manhã)
    this.cycleDuration = 180; // 180 segundos para um ciclo suave

    // Monitor de Performance
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    this.currentPixelRatio = Math.min(window.devicePixelRatio || 1, 2.0);
    this.autoScaleAdjusted = false;

    this.init();
  }

  /**
   * Textura do Céu com Gradiente Suave Contínuo Sem Seams
   */
  createDynamicSkyTexture() {
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = 512;
    this.skyCanvas.height = 512;
    this.skyCtx = this.skyCanvas.getContext('2d');
    this.skyTexture = new THREE.CanvasTexture(this.skyCanvas);
    this.skyTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.skyTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.updateSkyGradient(this.timeOfDay);
    return this.skyTexture;
  }

  updateSkyGradient(t) {
    if (!this.skyCtx) return;
    const ctx = this.skyCtx;
    const size = 512;
    const grad = ctx.createLinearGradient(0, 0, 0, size);

    if (t < 0.15) {
      // 1. Madrugada / Alvorecer (5h - 7h)
      grad.addColorStop(0.0, '#1e1b4b');
      grad.addColorStop(0.35, '#4338ca');
      grad.addColorStop(0.70, '#f43f5e');
      grad.addColorStop(1.0, '#fed7aa');
    } else if (t < 0.70) {
      // 2. Candy Favela Golden Noon / Late Morning (8h - 15h) — Zenith Azul Celeste e Horizonte Pêssego Dourado
      grad.addColorStop(0.0, '#3ba7ff');
      grad.addColorStop(0.35, '#64b5f6');
      grad.addColorStop(0.75, '#93c5fd');
      grad.addColorStop(1.0, '#ffd9a8');
    } else if (t < 0.85) {
      // 3. Pôr do Sol Dourado (16h - 19h)
      grad.addColorStop(0.0, '#1e1b4b');
      grad.addColorStop(0.30, '#7c2d12');
      grad.addColorStop(0.55, '#ea580c');
      grad.addColorStop(0.80, '#f59e0b');
      grad.addColorStop(1.0, '#fef08a');
    } else {
      // 4. Noite Estrelada (20h - 4h)
      grad.addColorStop(0.0, '#020617');
      grad.addColorStop(0.45, '#0f172a');
      grad.addColorStop(0.80, '#1e293b');
      grad.addColorStop(1.0, '#090d16');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Estrelas cintilantes à noite e na madrugada
    if (t > 0.85 || t < 0.12) {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 45; i++) {
        const sx = (i * 47) % size;
        const sy = (i * 71) % (size * 0.6);
        ctx.fillRect(sx, sy, 1.8, 1.8);
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
    grad.addColorStop(0.0, '#ffe566');
    grad.addColorStop(0.20, '#ffb020');
    grad.addColorStop(0.48, '#ff7a18');
    grad.addColorStop(0.78, 'rgba(255, 122, 24, 0.25)');
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

    // 1. Cena com Fog Atmosférico Suave de Alta Visibilidade (Longe da Pista)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.Fog(0xbae6fd, 130, 380);

    // 2. Câmera em 3ª Pessoa Elevada (Visão Ampla e Clara das 3 Pistas)
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 800);
    this.camera.position.set(0, 4.7, 7.2);
    this.camera.lookAt(0, 1.4, -18);

    // 3. Renderizador WebGL em Alta Resolução Retina / HD com Anti-Aliasing (Adequado para S23 Ultra e Todos os Celulares)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true, // Garante bordas 100% lisas e sem serrilhamento
      alpha: false,
      powerPreference: 'high-performance',
      precision: 'highp', // Garante precisão máxima sem artefatos ou pixelização
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    // Resolução Inteligente Calibrada (1.50x no mobile e 1.75x no desktop para nitidez sem aquecer GPU)
    const isMobile = typeof window !== 'undefined' && (
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
    );
    const dpr = window.devicePixelRatio || 1;
    this.maxPixelRatio = isMobile ? Math.min(dpr, 1.50) : Math.min(dpr, 1.75);
    this.minPixelRatio = 1.0;
    this.currentPixelRatio = this.maxPixelRatio;
    this.renderer.setPixelRatio(this.currentPixelRatio);

    this.perfCheckTimer = 0;

    // Mapeamento de Tons ACES Filmic Calibrado Cartoon (Zero washed-out, alto contraste de cores)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    if ('outputColorSpace' in this.renderer && THREE.SRGBColorSpace) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    // Sombras Desativadas no renderizador para 60-120 FPS cravados em qualquer aparelho (usa sombras projetadas estéticas)
    this.renderer.shadowMap.enabled = false;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Sistema de Camera Shake (Tropeço e Impactos)
    this.cameraShakeTimer = 0;
    this.cameraShakeIntensity = 0;

    // 4. Domo de Céu Contínuo Sem Círculos ou Seams (Hemisfério Completo)
    const skyGeo = new THREE.SphereGeometry(420, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.createDynamicSkyTexture(),
      side: THREE.BackSide,
      fog: false,
      depthWrite: false
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.skyDome.position.set(0, -10, -50);
    this.scene.add(this.skyDome);

    // 5. Morro de Favela Densa em Parallax
    this.createFavelaParallaxBackdrop();

    // 6. Iluminação Pixar / Subway Surfers Candy Favela
    // A. Luz Hemisférica (Céu Azul Celeste 0x7ec8ff / Solo Terroso 0x5b4a3a)
    this.hemiLight = new THREE.HemisphereLight(0x7ec8ff, 0x5b4a3a, 0.55);
    this.hemiLight.position.set(0, 80, 0);
    this.scene.add(this.hemiLight);

    // B. Luz Solar Direcional Principal (Sol Dourado Quente 0xffd089, Intensidade 1.15)
    this.sunLight = new THREE.DirectionalLight(0xffd089, 1.15);
    this.sunLight.position.set(40, 48, 30);
    this.scene.add(this.sunLight);

    // C. Luz Secundária de Preenchimento Oposta (Cool Blue Rim 0x5aa9ff, Intensidade 0.22)
    this.fillLight = new THREE.DirectionalLight(0x5aa9ff, 0.22);
    this.fillLight.position.set(-40, 25, -15);
    this.scene.add(this.fillLight);

    // D. Luz de Preenchimento Sutil do Player
    this.playerSpotLight = new THREE.PointLight(0xffedd5, 0.25, 30, 1.5);
    this.playerSpotLight.position.set(0, 4.8, 2.0);
    this.scene.add(this.playerSpotLight);

    // 7. Sol Dourado Cartoon (Zero Branco no Centro)
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(38, 32, -260);

    const sunTexture = this.createSunTexture(512);
    const sunRaysTexture = this.createSunRaysTexture(512);

    const sunCoreMat = new THREE.SpriteMaterial({
      map: sunTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xffe566
    });
    const sunCoreSprite = new THREE.Sprite(sunCoreMat);
    sunCoreSprite.scale.set(95, 95, 1);
    this.sunGroup.add(sunCoreSprite);

    const sunHaloMat = new THREE.SpriteMaterial({
      map: sunTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xea580c,
      opacity: 0.75
    });
    const sunHaloSprite = new THREE.Sprite(sunHaloMat);
    sunHaloSprite.scale.set(220, 220, 1);
    this.sunGroup.add(sunHaloSprite);

    const sunRaysMat = new THREE.SpriteMaterial({
      map: sunRaysTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xf59e0b,
      opacity: 0.85
    });
    this.sunRays = new THREE.Sprite(sunRaysMat);
    this.sunRays.scale.set(240, 240, 1);
    this.sunGroup.add(this.sunRays);

    this.scene.add(this.sunGroup);

    this.scene.add(this.sunGroup);

    // Lua 3D
    const moonGeo = new THREE.SphereGeometry(14, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(-35, 75, -280);
    this.moonMesh.visible = false;
    this.scene.add(this.moonMesh);

    // 8. Nuvens Cartoon Volumétricas e Pássaros Tropicais
    this.createStylizedClouds();
    this.createBirdFlock();

    // 9. Painel de Debug de Performance em Tempo Real (Apenas com ?debug=1 na URL)
    this.isDebugVisible = new URLSearchParams(window.location.search).get('debug') === '1';
    this.debugOverlay = null;
    this.minFpsSeen = 60;
    if (this.isDebugVisible) {
      this.createDebugOverlay();
    }

    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Painel Parallax Curvo com a Silhueta Densa da Favela Carioca
   */
  createFavelaParallaxBackdrop() {
    const bgGeo = new THREE.CylinderGeometry(280, 280, 140, 32, 1, true, -Math.PI / 2, Math.PI);
    const bgMat = new THREE.MeshBasicMaterial({
      map: textureAtlas.morroParallaxTexture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.96
    });
    this.parallaxFavela = new THREE.Mesh(bgGeo, bgMat);
    this.parallaxFavela.position.set(0, 48, -110);
    this.parallaxFavela.rotation.y = Math.PI;
    this.scene.add(this.parallaxFavela);
  }

  createStylizedClouds() {
    // 6 Nuvens Volumétricas Cartoon Estilizadas (Puffy Low-Poly Clouds)
    const cloudGeo = new THREE.DodecahedronGeometry(1, 1);
    this.cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      flatShading: true
    });

    const cloudCoords = [
      { x: -65, y: 38, z: -80, s: 14 },
      { x: 55, y: 44, z: -120, s: 18 },
      { x: -35, y: 52, z: -170, s: 22 },
      { x: 70, y: 40, z: -210, s: 16 },
      { x: -80, y: 48, z: -250, s: 20 },
      { x: 25, y: 56, z: -150, s: 15 }
    ];

    cloudCoords.forEach((cc, idx) => {
      const cloudGroup = new THREE.Group();
      const puffs = [
        { ox: 0, oy: 0, oz: 0, r: 1.0 },
        { ox: -0.8, oy: -0.2, oz: 0.1, r: 0.75 },
        { ox: 0.8, oy: -0.2, oz: -0.1, r: 0.75 },
        { ox: -0.3, oy: 0.4, oz: 0, r: 0.65 },
        { ox: 0.3, oy: 0.3, oz: 0.2, r: 0.60 }
      ];

      puffs.forEach(p => {
        const puff = new THREE.Mesh(cloudGeo, this.cloudMat);
        puff.position.set(p.ox * cc.s, p.oy * cc.s, p.oz * cc.s);
        puff.scale.set(p.r * cc.s, p.r * cc.s * 0.75, p.r * cc.s);
        cloudGroup.add(puff);
      });

      cloudGroup.position.set(cc.x, cc.y, cc.z);
      this.scene.add(cloudGroup);

      this.clouds.push({
        group: cloudGroup,
        baseX: cc.x,
        baseY: cc.y,
        baseZ: cc.z,
        speed: 1.5 + idx * 0.4
      });
    });
  }

  createBirdFlock() {
    // Bando de Pássaros Tropicais (Gaivotas / Andorinhas Cariocas)
    const wingGeo = new THREE.PlaneGeometry(1.4, 0.45);
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });

    const flockGroup = new THREE.Group();
    const birdOffsets = [
      { ox: 0, oy: 0, oz: 0 },
      { ox: -3.5, oy: -0.8, oz: 3.0 },
      { ox: 3.5, oy: -0.6, oz: 3.2 },
      { ox: -7.0, oy: -1.6, oz: 6.2 },
      { ox: 7.0, oy: -1.4, oz: 6.0 }
    ];

    birdOffsets.forEach((bo, bIdx) => {
      const bird = new THREE.Group();
      const leftWing = new THREE.Mesh(wingGeo, birdMat);
      leftWing.position.set(-0.7, 0, 0);
      leftWing.rotation.y = 0.2;

      const rightWing = new THREE.Mesh(wingGeo, birdMat);
      rightWing.position.set(0.7, 0, 0);
      rightWing.rotation.y = -0.2;

      bird.add(leftWing, rightWing);
      bird.position.set(bo.ox, bo.oy, bo.oz);
      flockGroup.add(bird);

      this.birds.push({
        leftWing,
        rightWing,
        phase: bIdx * 0.6
      });
    });

    flockGroup.position.set(-45, 32, -160);
    flockGroup.rotation.y = 0.4;
    this.scene.add(flockGroup);
    this.birdFlock = flockGroup;
  }

  /**
   * Ciclo Dia/Noite 24 Horas Calculado Suavemente via Tempo Decorrido
   */
  updateDayNightCycle(elapsedTime) {
    this.timeOfDay = ((elapsedTime / this.cycleDuration) + 0.04) % 1.0;
    const t = this.timeOfDay;

    this.updateSkyGradient(t);

    const sunAngle = t * Math.PI * 2;
    const sunY = Math.sin(sunAngle) * 75 + 10;
    const sunX = Math.cos(sunAngle) * 50;

    this.sunGroup.position.set(sunX, Math.max(-40, sunY), -280);
    this.sunLight.position.set(sunX * 0.8, Math.max(10, sunY), 40);

    const isNight = t > 0.82 || t < 0.14;
    this.moonMesh.visible = isNight;
    this.sunGroup.visible = !isNight || sunY > -10;

    // Animação Suave das Nuvens no Céu
    this.clouds.forEach(c => {
      c.group.position.x = c.baseX + (elapsedTime * c.speed) % 240 - 120;
    });

    // Animação do Bando de Pássaros
    if (this.birdFlock) {
      this.birdFlock.position.x = -60 + ((elapsedTime * 8.0) % 220);
      this.birdFlock.position.y = 32 + Math.sin(elapsedTime * 0.8) * 3;
      this.birds.forEach(b => {
        const wingAngle = Math.sin(elapsedTime * 7.0 + b.phase) * 0.55;
        b.leftWing.rotation.z = wingAngle;
        b.rightWing.rotation.z = -wingAngle;
      });
    }

    if (t < 0.15) {
      // 5h - Alvorecer
      this.scene.fog.color.setHex(0x312e81);
      this.hemiLight.color.setHex(0xc7d2fe);
      this.hemiLight.groundColor.setHex(0x1e1b4b);
      this.hemiLight.intensity = 0.70;
      this.sunLight.color.setHex(0xfecdd3);
      this.sunLight.intensity = 1.05;
      if (this.cloudMat) this.cloudMat.color.setHex(0xfecdd3);
      if (this.fillLight) {
        this.fillLight.color.setHex(0xa5b4fc);
        this.fillLight.intensity = 0.30;
      }
      this.playerSpotLight.intensity = 0.85;
    } else if (t < 0.45) {
      // Manhã
      this.scene.fog.color.setHex(0xbae6fd);
      this.hemiLight.color.setHex(0xffedd5);
      this.hemiLight.groundColor.setHex(0x475569);
      this.hemiLight.intensity = 0.85;
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 1.35;
      if (this.cloudMat) this.cloudMat.color.setHex(0xffffff);
      if (this.fillLight) {
        this.fillLight.color.setHex(0x93c5fd);
        this.fillLight.intensity = 0.40;
      }
      this.playerSpotLight.intensity = 0.0;
    } else if (t < 0.65) {
      // Meio-Dia
      this.scene.fog.color.setHex(0xe0f2fe);
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.intensity = 0.95;
      this.sunLight.color.setHex(0xffffff);
      this.sunLight.intensity = 1.45;
      if (this.cloudMat) this.cloudMat.color.setHex(0xffffff);
      if (this.fillLight) {
        this.fillLight.color.setHex(0xbfdbfe);
        this.fillLight.intensity = 0.35;
      }
      this.playerSpotLight.intensity = 0.0;
    } else if (t < 0.85) {
      // Pôr do Sol
      this.scene.fog.color.setHex(0xfcd34d);
      this.hemiLight.color.setHex(0xfb923c);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.80;
      this.sunLight.color.setHex(0xf97316);
      this.sunLight.intensity = 1.25;
      if (this.cloudMat) this.cloudMat.color.setHex(0xfdba74);
      if (this.fillLight) {
        this.fillLight.color.setHex(0xfdba74);
        this.fillLight.intensity = 0.35;
      }
      this.playerSpotLight.intensity = 0.35;
    } else {
      // Noite
      this.scene.fog.color.setHex(0x0f172a);
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.45;
      this.sunLight.color.setHex(0x60a5fa);
      this.sunLight.intensity = 0.35;
      if (this.cloudMat) this.cloudMat.color.setHex(0x334155);
      if (this.fillLight) {
        this.fillLight.color.setHex(0x1e3a8a);
        this.fillLight.intensity = 0.20;
      }
      this.playerSpotLight.intensity = 1.45;
    }

    return isNight;
  }

  getFormattedTime() {
    const totalMinutes = Math.floor((this.timeOfDay * 24 * 60 + 4 * 60) % (24 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const icon = (hours >= 5 && hours < 8) ? '🌅' : (hours >= 8 && hours < 17) ? '☀️' : (hours >= 17 && hours < 20) ? '🌇' : '🌙';
    return `${icon} ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  createDebugOverlay() {
    this.debugOverlay = document.createElement('div');
    this.debugOverlay.id = 'perfDebugOverlay';
    this.debugOverlay.style.cssText = `
      position: fixed;
      bottom: 12px;
      left: 12px;
      background: rgba(8, 12, 22, 0.92);
      border: 1.5px solid #00e676;
      border-radius: 10px;
      padding: 8px 12px;
      color: #00e676;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.4;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.85);
      pointer-events: auto;
      display: ${this.isDebugVisible ? 'block' : 'none'};
      backdrop-filter: blur(8px);
      user-select: none;
    `;
    document.body.appendChild(this.debugOverlay);
  }

  toggleDebugOverlay() {
    this.isDebugVisible = !this.isDebugVisible;
    if (this.debugOverlay) {
      this.debugOverlay.style.display = this.isDebugVisible ? 'block' : 'none';
    }
  }

  monitorPerformance() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const fps = 1000 / Math.max(delta, 1);
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 60) this.fpsHistory.shift();

    if (fps < this.minFpsSeen && this.fpsHistory.length > 10) {
      this.minFpsSeen = Math.round(fps);
    }

    this.perfCheckTimer++;
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    // A cada ~90 frames (1.5s), avalia a taxa de quadros e escala a resolução
    if (this.perfCheckTimer > 90 && this.fpsHistory.length >= 45) {
      this.perfCheckTimer = 0;

      // Se estiver acima de 57.5 FPS, aumenta suavemente a resolução
      if (avgFps >= 57.5 && this.currentPixelRatio < this.maxPixelRatio) {
        this.currentPixelRatio = Math.min(this.maxPixelRatio, Number((this.currentPixelRatio + 0.10).toFixed(2)));
        this.renderer.setPixelRatio(this.currentPixelRatio);
      }
      // Se houver queda de frames (< 48 FPS), reduz a resolução dinamicamente para preservar 60 FPS
      else if (avgFps < 48.0 && this.currentPixelRatio > this.minPixelRatio) {
        this.currentPixelRatio = Math.max(this.minPixelRatio, Number((this.currentPixelRatio - 0.15).toFixed(2)));
        this.renderer.setPixelRatio(this.currentPixelRatio);
      }
    }

    // Atualiza o painel visual de métricas de debug
    if (this.isDebugVisible && this.debugOverlay && this.renderer) {
      const info = this.renderer.info;
      const mem = info.memory || {};
      const rnd = info.render || {};
      const curFps = Math.round(fps);
      const roundedAvg = Math.round(avgFps);
      const fpsColor = curFps >= 55 ? '#00e676' : curFps >= 40 ? '#facc15' : '#ef4444';

      let heapMb = '';
      if (window.performance && window.performance.memory) {
        heapMb = ` | JS Heap: ${(window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)}MB`;
      }

      this.debugOverlay.innerHTML = `
        <div style="font-weight:bold; color:${fpsColor}; font-size:12px; margin-bottom:2px;">
          ⚡ ${curFps} FPS (Méd: ${roundedAvg} | Mín: ${this.minFpsSeen}) [${delta.toFixed(1)}ms]
        </div>
        <div>🎯 Draw Calls: <b>${rnd.calls || 0}</b> | Triângulos: <b>${(rnd.triangles || 0).toLocaleString()}</b></div>
        <div>💾 Geometrias: <b>${mem.geometries || 0}</b> | Texturas: <b>${mem.textures || 0}</b></div>
        <div>🖥️ DPR: <b>${this.currentPixelRatio.toFixed(2)}x</b> | Sombras: <b>${this.renderer.shadowMap.enabled ? 'ON' : 'OFF'}</b>${heapMb}</div>
        <div style="font-size:9px; color:#94a3b8; margin-top:2px;">Pressione [D] para ocultar</div>
      `;
    }
  }

  triggerCameraShake(intensity = 0.40, duration = 0.38) {
    this.cameraShakeIntensity = intensity;
    this.cameraShakeTimer = duration;
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

    // Efeito de Camera Shake (Tropeço e Impactos)
    if (this.cameraShakeTimer > 0) {
      this.cameraShakeTimer -= dt;
      const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
    }

    this.camera.lookAt(this.camera.position.x * 0.6, 1.6 + Math.max(0, targetY * 0.2), -16);

    if (this.playerSpotLight) {
      this.playerSpotLight.position.x = this.camera.position.x * 0.7;
    }

    if (this.sunRays) {
      this.sunRays.material.rotation += 0.05 * dt;
    }
  }

  onResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    const isMobile = window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    const dpr = window.devicePixelRatio || 1;
    this.maxPixelRatio = isMobile ? Math.min(dpr, 1.50) : Math.min(dpr, 1.75);
    this.currentPixelRatio = this.maxPixelRatio;
    this.renderer.setPixelRatio(this.currentPixelRatio);
  }

  render() {
    this.monitorPerformance();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
