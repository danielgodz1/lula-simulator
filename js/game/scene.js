// js/game/scene.js — Céu Brasileiro Golden Hour, Sol Tropical Dourado, Morros em Parallax e Iluminação Quente
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class GameScene {
  constructor(containerId = 'canvasContainer') {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.sunGroup = null;
    this.sunRays = null;
    this.skyMesh = null;
    this.hillsGroup = null;
    this.kites = [];

    // Monitor de Performance e Escalação Dinâmica
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    this.currentPixelRatio = 1.0;
    this.autoScaleAdjusted = false;

    this.init();
  }

  /**
   * Cria o Skybox com Gradiente Golden Hour Brasileiro (Pôr do Sol Tropical do Rio de Janeiro)
   */
  createGoldenHourSkyTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.0, '#1d4ed8'); // Azul Intenso no Topo do Céu
    grad.addColorStop(0.35, '#38bdf8'); // Azul Celeste
    grad.addColorStop(0.65, '#f59e0b'); // Dourado Âmbar Tropical
    grad.addColorStop(0.85, '#ea580c'); // Laranja Quente do Pôr do Sol
    grad.addColorStop(1.0, '#fef08a'); // Horizonte Dourado Brilhante

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  // Textura do Sol com Brilho Volumétrico
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

    // 1. Cena com Fog Atmosférico Dourado Suave
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfde68a); // Fundo quente combinando com o horizonte
    this.scene.fog = new THREE.Fog(0xfcd34d, 70, 260); // Esconde spawn suavemente sem "pipocar"

    // 2. Câmera em 3ª Pessoa (Posicionamento Imersivo)
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 800);
    this.camera.position.set(0, 4.4, 7.2);
    this.camera.lookAt(0, 1.6, -14);

    // 3. Renderizador WebGL de Alta Performance
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

    // 4. Domo de Céu com Gradiente Tropical Pôr do Sol
    const skyGeo = new THREE.CylinderGeometry(340, 340, 200, 32, 1, true);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.createGoldenHourSkyTexture(512),
      side: THREE.BackSide,
      fog: false
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyMesh.position.set(0, 50, -100);
    this.scene.add(this.skyMesh);

    // 5. Morros Verdes Ondulados em Low-Poly no Horizonte (Cenário do Rio de Janeiro)
    this.createDistantHills();

    // 6. Iluminação Quente & Sombras Douradas
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x475569, 1.1);
    hemiLight.position.set(0, 80, 0);
    this.scene.add(hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff3d6, 1.5);
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

    // 7. Sol Dourado no Horizonte com Halo Volumétrico
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(15, 45, -280);

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

    // 8. Pipas Flutuando no Céu Carioca
    this.createFloatingKites();

    window.addEventListener('resize', () => this.onResize());
  }

  // Morros Verdes em Low-Poly no Fundo
  createDistantHills() {
    this.hillsGroup = new THREE.Group();
    this.hillsGroup.position.set(0, 0, -220);

    const hillColors = [0x15803d, 0x166534, 0x14532d, 0x047857];

    // Colinas em arco no horizonte
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

  // Pipas Coloridas Flutuando no Céu
  createFloatingKites() {
    const kiteColors = [0xef4444, 0xfacc15, 0x3b82f6, 0x10b981, 0xec4899];
    const kiteGeo = new THREE.PlaneGeometry(1.6, 2.2);

    for (let i = 0; i < 5; i++) {
      const kiteMat = new THREE.MeshBasicMaterial({
        color: kiteColors[i % kiteColors.length],
        side: THREE.DoubleSide
      });
      const kite = new THREE.Mesh(kiteGeo, kiteMat);
      kite.rotation.z = Math.PI / 4; // Formato de losango
      
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

    // Interpolação Linear suave da câmera nas 3 faixas
    this.camera.position.x += (targetX * 0.75 - this.camera.position.x) * (9.5 * dt);
    
    // Acompanha sutilmente o pulo do personagem
    const targetCamY = 4.4 + Math.max(0, targetY * 0.35);
    this.camera.position.y += (targetCamY - this.camera.position.y) * (8.0 * dt);

    this.camera.lookAt(this.camera.position.x * 0.6, 1.6 + Math.max(0, targetY * 0.2), -16);

    // Rotação suave dos raios solares
    if (this.sunRays) {
      this.sunRays.material.rotation += 0.05 * dt;
    }

    // Animação senoidal suave das Pipas no céu
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
