// js/game/scene.js — Configuração de Cena, Câmera em 3ª Pessoa, Sol Tropical Realista e Iluminação Volumétrica
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
    this.targetCameraX = 0;
    this.init();
  }

  // Gera textura procedural de brilho solar suave com gradiente radial de alta fidelidade
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

  // Gera textura de raios solares estelares
  createSunRaysTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Raios principais em estrela
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

    // 1. Cena com Céu Tropical Carioca e Neblina Suave
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0032);

    // 2. Câmera em 3ª Pessoa
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 800);
    this.camera.position.set(0, 4.4, 7.2);
    this.camera.lookAt(0, 1.6, -14);

    // 3. Renderizador WebGL Ultra Otimizado
    const isMobile = window.innerWidth <= 900;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'high-performance',
      precision: isMobile ? 'mediump' : 'highp'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio || 1, 1.0) : Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = !isMobile || window.innerWidth > 600;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Luz Hemisférica Tropical
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x475569, 1.0);
    hemiLight.position.set(0, 80, 0);
    this.scene.add(hemiLight);

    // 5. Luz Solar Direcional com Sombras Otimizadas
    this.sunLight = new THREE.DirectionalLight(0xfff7d6, 1.4);
    this.sunLight.position.set(40, 85, 30);
    this.sunLight.castShadow = this.renderer.shadowMap.enabled;
    const shadowRes = isMobile ? 512 : 1024;
    this.sunLight.shadow.mapSize.width = shadowRes;
    this.sunLight.shadow.mapSize.height = shadowRes;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.camera.left = -25;
    this.sunLight.shadow.camera.right = 25;
    this.sunLight.shadow.camera.top = 25;
    this.sunLight.shadow.camera.bottom = -25;
    this.scene.add(this.sunLight);

    // 6. Sol 3D Realista Volumétrico com Sprites e Halo Dourado
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(12, 54, -300);

    const sunTexture = this.createSunTexture(512);
    const sunRaysTexture = this.createSunRaysTexture(512);

    // Núcleo Solar de Brilho Intenso
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

    // Halo Volumétrico Atmosférico Grande
    const sunHaloMat = new THREE.SpriteMaterial({
      map: sunTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xffa500,
      opacity: 0.75
    });
    const sunHaloSprite = new THREE.Sprite(sunHaloMat);
    sunHaloSprite.scale.set(130, 130, 1);
    this.sunGroup.add(sunHaloSprite);

    // Raios Solares Radiantes
    const sunRaysMat = new THREE.SpriteMaterial({
      map: sunRaysTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xffdf00,
      opacity: 0.60
    });
    this.sunRays = new THREE.Sprite(sunRaysMat);
    this.sunRays.scale.set(160, 160, 1);
    this.sunGroup.add(this.sunRays);

    this.scene.add(this.sunGroup);

    // 7. Redimensionamento Responsivo
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  updateCamera(characterX, speed, baseSpeed, dt) {
    if (!this.camera) return;

    this.targetCameraX = characterX * 0.35;
    this.camera.position.x += (this.targetCameraX - this.camera.position.x) * (12 * dt);

    this.camera.fov = 65 + (speed - baseSpeed) * 0.16;
    this.camera.updateProjectionMatrix();

    // Rotação sutil dos raios solares
    if (this.sunRays && this.sunRays.material) {
      this.sunRays.material.rotation += 0.08 * dt;
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
