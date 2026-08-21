// js/game/scene.js — Configuração de Cena, Câmera em 3ª Pessoa, Sol Radiante e Iluminação Tropical
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class GameScene {
  constructor(containerId = 'canvasContainer') {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.targetCameraX = 0;
    this.init();
  }

  init() {
    if (!this.container) return;

    // 1. Cena com Céu Ensolarado Carioca e Neblina Suave Dourada
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Céu Azul Vibrante
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0035);

    // 2. Câmera em 3ª Pessoa com Profundidade
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 600);
    this.camera.position.set(0, 4.4, 7.2);
    this.camera.lookAt(0, 1.6, -14);

    // 3. Renderizador WebGL de Alta Performance
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Luz Hemisférica Tropical Ensolarada
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x475569, 0.95);
    hemiLight.position.set(0, 80, 0);
    this.scene.add(hemiLight);

    // 5. Sol Dourado com Sombras Suaves
    this.sunLight = new THREE.DirectionalLight(0xfff4cc, 1.35);
    this.sunLight.position.set(35, 75, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 180;
    this.sunLight.shadow.camera.left = -22;
    this.sunLight.shadow.camera.right = 22;
    this.sunLight.shadow.camera.top = 22;
    this.sunLight.shadow.camera.bottom = -22;
    this.scene.add(this.sunLight);

    // 6. Sol 3D Brilhante Visível no Horizonte com Halo Dourado
    const sunGroup = new THREE.Group();
    sunGroup.position.set(10, 42, -320);

    // Núcleo Branco/Dourado do Sol
    const sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sunCore = new THREE.Mesh(new THREE.SphereGeometry(7.5, 32, 32), sunCoreMat);
    sunGroup.add(sunCore);

    // Corona de Brilho Solar Radiante
    const sunCoronaMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.85
    });
    const sunCorona = new THREE.Mesh(new THREE.SphereGeometry(14.0, 32, 32), sunCoronaMat);
    sunGroup.add(sunCorona);

    // Halo Externo Translúcido
    const sunHaloMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.40,
      side: THREE.DoubleSide
    });
    const sunHalo = new THREE.Mesh(new THREE.RingGeometry(15.0, 32.0, 32), sunHaloMat);
    sunGroup.add(sunHalo);

    this.scene.add(sunGroup);

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

  // Atualização da Câmera com Suavização (Lag/Smoothing dinâmico)
  updateCamera(characterX, speed, baseSpeed, dt) {
    if (!this.camera) return;

    // Suavização horizontal da câmera (Lag sutil que dá sensação de velocidade)
    this.targetCameraX = characterX * 0.35;
    this.camera.position.x += (this.targetCameraX - this.camera.position.x) * (12 * dt);

    // Abertura de Campo de Visão (FOV) progressivo conforme acelera
    this.camera.fov = 65 + (speed - baseSpeed) * 0.16;
    this.camera.updateProjectionMatrix();
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
