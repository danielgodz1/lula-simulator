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
    this.kites = [];

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
    } else if (t < 0.45) {
      // 2. Manhã Radiante Tropical (8h - 11h) — Cores vivas estilo Subway Surfers
      grad.addColorStop(0.0, '#0284c7');
      grad.addColorStop(0.35, '#38bdf8');
      grad.addColorStop(0.75, '#7dd3fc');
      grad.addColorStop(1.0, '#bae6fd');
    } else if (t < 0.70) {
      // 3. Meio-Dia Solar Carioca (12h - 15h)
      grad.addColorStop(0.0, '#0284c7');
      grad.addColorStop(0.40, '#38bdf8');
      grad.addColorStop(0.80, '#bae6fd');
      grad.addColorStop(1.0, '#e0f2fe');
    } else if (t < 0.85) {
      // 4. Pôr do Sol Dourado (16h - 19h)
      grad.addColorStop(0.0, '#1e1b4b');
      grad.addColorStop(0.30, '#7c2d12');
      grad.addColorStop(0.55, '#ea580c');
      grad.addColorStop(0.80, '#f59e0b');
      grad.addColorStop(1.0, '#fef08a');
    } else {
      // 5. Noite Estrelada (20h - 4h)
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

    // Resolução Nativa HD Retina (2.0x max no S23 Ultra e telas de alta densidade)
    this.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2.0);
    this.minPixelRatio = 1.20;
    this.currentPixelRatio = Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(this.currentPixelRatio);

    this.perfCheckTimer = 0;

    // Mapeamento de Tons ACES Filmic e Espaço de Cores sRGB
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.20;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    if ('outputColorSpace' in this.renderer && THREE.SRGBColorSpace) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    // Sombras Desativadas no renderizador para 60-120 FPS cravados em qualquer aparelho (usa sombras projetadas estéticas)
    this.renderer.shadowMap.enabled = false;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

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

    // 6. Iluminação em Camadas Vibrante e Clara
    // A. Luz Hemisférica (Céu Branco / Chão Suave)
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.95);
    this.hemiLight.position.set(0, 80, 0);
    this.scene.add(this.hemiLight);

    // B. Luz Direcional Principal (Sol Radiante Tropical com Alto Contraste)
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.40);
    this.sunLight.position.set(28, 60, 35);
    this.scene.add(this.sunLight);

    // C. Luz Secundária de Preenchimento (Fill Light suave)
    this.fillLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
    this.fillLight.position.set(-30, 45, -20);
    this.scene.add(this.fillLight);

    // D. Luz Noturna na Pista
    this.playerSpotLight = new THREE.PointLight(0xffedd5, 0.0, 35, 1.5);
    this.playerSpotLight.position.set(0, 5.2, 2.0);
    this.scene.add(this.playerSpotLight);

    // 7. Sol e Lua
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

    // Lua 3D
    const moonGeo = new THREE.SphereGeometry(14, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(-35, 75, -280);
    this.moonMesh.visible = false;
    this.scene.add(this.moonMesh);

    // 8. Pipas
    this.createFloatingKites();

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

    if (t < 0.15) {
      // 5h - Alvorecer
      this.scene.fog.color.setHex(0x312e81);
      this.hemiLight.color.setHex(0xc7d2fe);
      this.hemiLight.groundColor.setHex(0x1e1b4b);
      this.hemiLight.intensity = 0.70;
      this.sunLight.color.setHex(0xfecdd3);
      this.sunLight.intensity = 1.05;
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
