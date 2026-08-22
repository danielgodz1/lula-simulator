// js/game/scene.js — Configuração de Cena, Iluminação Tropical, Fog Atmosférico e Detecção Dinâmica de Hardware
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class GameScene {
  constructor(containerId = 'canvasContainer') {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.sunGroup = null;
    this.targetCameraX = 0;

    // Monitor de Performance e Escalação Dinâmica de Resolução
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    this.currentPixelRatio = 1.0;
    this.isHighEndDevice = this.detectDeviceTier();
    this.autoScaleAdjusted = false;

    this.init();
  }

  /**
   * Detecta a capacidade de processamento gráfico do dispositivo
   */
  detectDeviceTier() {
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = window.innerWidth <= 900;
    const memory = navigator.deviceMemory || 4;

    // Celulares potentes ou PCs com 6+ núcleos
    if (cores >= 6 && memory >= 4 && !isMobile) return true;
    if (cores >= 8 && memory >= 6) return true;
    return false;
  }

  // Gera textura procedural de sol tropical suave
  createSunTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.12, 'rgba(255, 250, 200, 0.95)');
    grad.addColorStop(0.28, 'rgba(255, 215, 0, 0.75)');
    grad.addColorStop(0.50, 'rgba(251, 146, 60, 0.40)');
    grad.addColorStop(0.75, 'rgba(249, 115, 22, 0.15)');
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

    const rayCount = 12;
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

    // 1. Cena com Céu Tropical e Fog Atmosférico Suave
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Azul Céu do Rio
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0035); // Suaviza o horizonte e esconde spawn

    // 2. Câmera em 3ª Pessoa (Posicionamento Dinâmico Estilo Subway Surfers)
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 800);
    this.camera.position.set(0, 4.4, 7.2);
    this.camera.lookAt(0, 1.6, -14);

    // 3. Renderizador WebGL com Resolução Calibrada
    const isMobile = window.innerWidth <= 900;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'high-performance',
      precision: isMobile ? 'mediump' : 'highp'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    
    // Pixel Ratio Dinâmico
    this.currentPixelRatio = isMobile 
      ? Math.min(window.devicePixelRatio || 1, 1.25)
      : Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(this.currentPixelRatio);

    this.renderer.shadowMap.enabled = !isMobile || window.innerWidth > 550;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Luz Hemisférica Tropical Suave
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x475569, 1.05);
    hemiLight.position.set(0, 80, 0);
    this.scene.add(hemiLight);

    // 5. Luz Solar Direcional com Sombras Otimizadas
    this.sunLight = new THREE.DirectionalLight(0xfff7d6, 1.45);
    this.sunLight.position.set(40, 85, 30);
    this.sunLight.castShadow = this.renderer.shadowMap.enabled;
    const shadowRes = isMobile ? 512 : 1024;
    this.sunLight.shadow.mapSize.width = shadowRes;
    this.sunLight.shadow.mapSize.height = shadowRes;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 220;
    this.sunLight.shadow.camera.left = -26;
    this.sunLight.shadow.camera.right = 26;
    this.sunLight.shadow.camera.top = 26;
    this.sunLight.shadow.camera.bottom = -26;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // 6. Sol 3D Realista Volumétrico
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(12, 54, -300);

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
    sunCoreSprite.scale.set(65, 65, 1);
    this.sunGroup.add(sunCoreSprite);

    const sunHaloMat = new THREE.SpriteMaterial({
      map: sunTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xfb923c,
      opacity: 0.55
    });
    const sunHaloSprite = new THREE.Sprite(sunHaloMat);
    sunHaloSprite.scale.set(150, 150, 1);
    this.sunGroup.add(sunHaloSprite);

    const sunRaysMat = new THREE.SpriteMaterial({
      map: sunRaysTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xffdf00,
      opacity: 0.65
    });
    this.sunRays = new THREE.Sprite(sunRaysMat);
    this.sunRays.scale.set(160, 160, 1);
    this.sunGroup.add(this.sunRays);

    this.scene.add(this.sunGroup);

    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Monitor de Performance Dinâmico em Tempo Real
   * Reduz pixel ratio suavemente se o aparelho apresentar engasgos
   */
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
        console.log('⚡ Resolução adaptada para 60 FPS estáveis em dispositivo de entrada.');
      }
    }
  }

  updateCamera(targetX, targetY, isDead = false, dt = 0.016) {
    if (isDead) {
      this.camera.position.x += (targetX - this.camera.position.x) * (2.5 * dt);
      this.camera.position.y += (3.2 - this.camera.position.y) * (2.5 * dt);
      this.camera.position.z += (6.0 - this.camera.position.z) * (2.0 * dt);
      this.camera.lookAt(targetX, 1.2, -6);
      return;
    }

    // Interpolação Linear suave da câmera nas 3 faixas
    this.camera.position.x += (targetX * 0.75 - this.camera.position.x) * (9.5 * dt);
    
    // Acompanha sutilmente o salto
    const targetCamY = 4.4 + Math.max(0, targetY * 0.35);
    this.camera.position.y += (targetCamY - this.camera.position.y) * (8.0 * dt);

    this.camera.lookAt(this.camera.position.x * 0.6, 1.6 + Math.max(0, targetY * 0.2), -16);

    // Rotação sutil dos raios do sol
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
  }

  render() {
    this.monitorPerformance();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
