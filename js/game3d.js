// js/game3d.js — Jogo do Empresário 3D (Subway Surfers Style)
// Desenvolvido com Three.js (WebGL) para alta performance em navegadores desktop e mobile

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { sounds } from './audio.js';
import { savePlayerScore } from './firebase-config.js';

let scene, camera, renderer;
let character, characterGroup;
let isGameRunning = false;
let isGameOver = false;

// Configurações de Faixas e Posição
const LANES = [-2.8, 0, 2.8]; // Esquerda, Centro, Direita
let currentLaneIndex = 1;      // Inicia no Centro
let targetX = 0;
let characterX = 0;

// Estado de Movimentação e Física
let isJumping = false;
let jumpVelocity = 0;
const GRAVITY = -0.55;
const JUMP_FORCE = 8.5;
let characterY = 0;

let isSliding = false;
let slideTimer = 0;
const SLIDE_DURATION = 0.55; // segundos

// Velocidade e Distância
let speed = 28; // unidades por segundo
const BASE_SPEED = 28;
const MAX_SPEED = 65;
let distanceTraveled = 0; // em metros / unidades
let coinsCollected = 0;
let bestDistance = parseInt(localStorage.getItem('run_best') || '0', 10);

// Segmentos e Objetos de Cenário
const SEGMENT_LENGTH = 80;
const TOTAL_SEGMENTS = 6;
let roadSegments = [];
let obstacles = [];
let coins = [];
let particles = [];

// Relógio do Three.js
let clock = new THREE.Clock();
let animTime = 0;
let touchStartX = 0, touchStartY = 0;

// Partes do Corpo do Empresário para Animação
let leftLeg, rightLeg, leftArm, rightArm, briefcaseMesh, headMesh;

// INICIALIZADOR DO MOTOR THREE.JS
export function init3DGame() {
  const container = document.getElementById('canvasContainer');
  if (!container) return;

  // 1. Criação da Cena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Céu azul claro
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.009);

  // 2. Criação da Câmera em 3ª Pessoa
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 400);
  camera.position.set(0, 4.8, 7.5);
  camera.lookAt(0, 1.8, -12);

  // 3. Renderizador WebGL Otimizado
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // 4. Iluminação Dinâmica
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfffaed, 0.9);
  dirLight.position.set(20, 40, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 120;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  scene.add(dirLight);

  // 5. Construção do Personagem 3D (Empresário de Terno)
  buildCharacter();

  // 6. Construção da Pista Inicial e Segmentos Procedurais
  buildInitialTrack();

  // 7. Eventos de Janela e Controles
  setupControls();
  window.addEventListener('resize', onWindowResize);

  // 8. Atualização do Recorde no HUD
  updateHUD();

  // Inicia o Loop de Renderização
  animate();
}

// CONSTRUÇÃO DO MODELO 3D PROCEDURAL DO EMPRESÁRIO
function buildCharacter() {
  characterGroup = new THREE.Group();

  // Materiais do Empresário
  const suitMaterial = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Terno Azul Marinho Escuro
  const shirtMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Camisa Social Branca
  const tieMaterial = new THREE.MeshLambertMaterial({ color: 0xdc2626 });   // Gravata Vermelha
  const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });  // Tom de Pele
  const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x27272a });  // Cabelo Penteado
  const glassesMaterial = new THREE.MeshLambertMaterial({ color: 0x09090b });// Óculos Escuros
  const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x18181b });  // Sapato Social
  const leatherMaterial = new THREE.MeshLambertMaterial({ color: 0x78350f });// Maleta de Couro
  const goldMaterial = new THREE.MeshLambertMaterial({ color: 0xfacc15 });  // Fivelas Douradas

  // Tronco (Terno com Camisa e Gravata)
  const torsoGeo = new THREE.BoxGeometry(0.75, 0.95, 0.45);
  const torso = new THREE.Mesh(torsoGeo, suitMaterial);
  torso.position.y = 1.35;
  torso.castShadow = true;
  characterGroup.add(torso);

  // Detalhe da Camisa Branca no Peito
  const shirtGeo = new THREE.BoxGeometry(0.24, 0.5, 0.05);
  const shirt = new THREE.Mesh(shirtGeo, shirtMaterial);
  shirt.position.set(0, 1.5, 0.22);
  characterGroup.add(shirt);

  // Gravata
  const tieGeo = new THREE.BoxGeometry(0.1, 0.42, 0.06);
  const tie = new THREE.Mesh(tieGeo, tieMaterial);
  tie.position.set(0, 1.45, 0.23);
  characterGroup.add(tie);

  // Cabeça
  const headGeo = new THREE.BoxGeometry(0.48, 0.48, 0.44);
  headMesh = new THREE.Mesh(headGeo, skinMaterial);
  headMesh.position.y = 2.05;
  headMesh.castShadow = true;
  characterGroup.add(headMesh);

  // Cabelo Estilizado
  const hairGeo = new THREE.BoxGeometry(0.5, 0.18, 0.46);
  const hair = new THREE.Mesh(hairGeo, hairMaterial);
  hair.position.set(0, 0.22, -0.02);
  headMesh.add(hair);

  // Óculos Escuros de Executivo
  const glassesGeo = new THREE.BoxGeometry(0.44, 0.12, 0.1);
  const glasses = new THREE.Mesh(glassesGeo, glassesMaterial);
  glasses.position.set(0, 0.04, 0.22);
  headMesh.add(glasses);

  // Braço Esquerdo
  const armGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
  leftArm = new THREE.Mesh(armGeo, suitMaterial);
  leftArm.position.set(-0.48, 1.35, 0);
  leftArm.castShadow = true;
  characterGroup.add(leftArm);

  // Braço Direito (Segurando a Maleta)
  rightArm = new THREE.Mesh(armGeo, suitMaterial);
  rightArm.position.set(0.48, 1.35, 0);
  rightArm.castShadow = true;
  characterGroup.add(rightArm);

  // Maleta de Executivo (Briefcase)
  const briefcaseGeo = new THREE.BoxGeometry(0.18, 0.4, 0.5);
  briefcaseMesh = new THREE.Mesh(briefcaseGeo, leatherMaterial);
  briefcaseMesh.position.set(0.12, -0.28, 0.1);
  briefcaseMesh.castShadow = true;

  // Alça e Fivelas da Maleta
  const handleGeo = new THREE.BoxGeometry(0.06, 0.1, 0.2);
  const handle = new THREE.Mesh(handleGeo, goldMaterial);
  handle.position.set(0, 0.23, 0);
  briefcaseMesh.add(handle);
  rightArm.add(briefcaseMesh);

  // Perna Esquerda
  const legGeo = new THREE.BoxGeometry(0.26, 0.85, 0.26);
  leftLeg = new THREE.Mesh(legGeo, suitMaterial);
  leftLeg.position.set(-0.2, 0.45, 0);
  leftLeg.castShadow = true;

  // Sapato Esquerdo
  const shoeGeo = new THREE.BoxGeometry(0.26, 0.15, 0.38);
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMaterial);
  leftShoe.position.set(0, -0.4, 0.06);
  leftLeg.add(leftShoe);
  characterGroup.add(leftLeg);

  // Perna Direita
  rightLeg = new THREE.Mesh(legGeo, suitMaterial);
  rightLeg.position.set(0.2, 0.45, 0);
  rightLeg.castShadow = true;

  // Sapato Direito
  const rightShoe = new THREE.Mesh(shoeGeo, shoeMaterial);
  rightShoe.position.set(0, -0.4, 0.06);
  rightLeg.add(rightShoe);
  characterGroup.add(rightLeg);

  // Sombra no Chão Abaixo do Personagem
  const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
  const charShadow = new THREE.Mesh(shadowGeo, shadowMat);
  charShadow.rotation.x = -Math.PI / 2;
  charShadow.position.y = 0.02;
  characterGroup.add(charShadow);

  character = characterGroup;
  scene.add(character);
}

// CONSTRUÇÃO E CICLO DE SEGMENTOS DE PISTA INFINITA
function buildInitialTrack() {
  roadSegments = [];
  obstacles = [];
  coins = [];

  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    const segZ = -i * SEGMENT_LENGTH;
    const seg = createRoadSegment(segZ, i > 1);
    roadSegments.push(seg);
    scene.add(seg);
  }
}

function createRoadSegment(zPos, withObstacles = true) {
  const segment = new THREE.Group();
  segment.position.z = zPos;

  // 1. Asfalto Principal (3 Faixas)
  const roadWidth = 9.6;
  const roadGeo = new THREE.PlaneGeometry(roadWidth, SEGMENT_LENGTH);
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x22262d });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  segment.add(road);

  // 2. Linhas Divisórias das Faixas
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  [-1.4, 1.4].forEach(x => {
    for (let lz = -SEGMENT_LENGTH / 2 + 3; lz < SEGMENT_LENGTH / 2; lz += 8) {
      const lineGeo = new THREE.PlaneGeometry(0.18, 4);
      const dash = new THREE.Mesh(lineGeo, lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.01, lz);
      segment.add(dash);
    }
  });

  // Linhas Laterais Contínuas Amarelas
  [-4.6, 4.6].forEach(x => {
    const borderGeo = new THREE.PlaneGeometry(0.25, SEGMENT_LENGTH);
    const borderLine = new THREE.Mesh(borderGeo, yellowLineMat);
    borderLine.rotation.x = -Math.PI / 2;
    borderLine.position.set(x, 0.01, 0);
    segment.add(borderLine);
  });

  // 3. Calçadas Laterais
  const curbGeo = new THREE.BoxGeometry(2.5, 0.4, SEGMENT_LENGTH);
  const curbMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
  [-5.8, 5.8].forEach(cx => {
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(cx, 0.2, 0);
    curb.receiveShadow = true;
    segment.add(curb);
  });

  // 4. Edifícios Urbanos de Fundo (Parallax e Profundidade 3D)
  const theme = getThemeForDistance(distanceTraveled);
  buildBuildingsForSegment(segment, theme);

  // 5. Postes de Luz e Árvores
  for (let pz = -SEGMENT_LENGTH / 2 + 10; pz < SEGMENT_LENGTH / 2; pz += 25) {
    createStreetLamp(segment, -5.2, pz);
    createStreetLamp(segment, 5.2, pz);
  }

  // 6. Spawn de Obstáculos e Moedas
  if (withObstacles) {
    spawnSegmentEntities(segment, zPos);
  }

  return segment;
}

// TEMA URBANO DINÂMICO CONFORME A DISTÂNCIA
function getThemeForDistance(dist) {
  if (dist < 400) return 'corporate'; // Centro Empresarial Ensolarado
  if (dist < 900) return 'railway';   // Zona de Metrô & Trilhos
  return 'neon';                       // Avenida Noturna com Néon
}

function buildBuildingsForSegment(segment, theme) {
  const buildingColors = theme === 'neon' 
    ? [0x0f172a, 0x1e1b4b, 0x172554, 0x022c22] 
    : [0x334155, 0x475569, 0x64748b, 0x1e293b, 0x0f172a];

  [-16, 16].forEach((bx, sideIdx) => {
    for (let bz = -SEGMENT_LENGTH / 2 + 10; bz < SEGMENT_LENGTH / 2; bz += 24) {
      const height = 24 + Math.random() * 45;
      const width = 12 + Math.random() * 8;
      const depth = 16 + Math.random() * 8;

      const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
      const bGeo = new THREE.BoxGeometry(width, height, depth);
      const bMat = new THREE.MeshLambertMaterial({ color });
      const building = new THREE.Mesh(bGeo, bMat);
      building.position.set(bx + (sideIdx === 0 ? -width / 4 : width / 4), height / 2, bz);
      segment.add(building);

      // Janelas Iluminadas
      const winCount = 8;
      for (let w = 0; w < winCount; w++) {
        const winGeo = new THREE.PlaneGeometry(0.8, 1.2);
        const winColor = (theme === 'neon' || Math.random() > 0.4) ? 0xfef08a : 0x38bdf8;
        const winMat = new THREE.MeshBasicMaterial({ color: winColor });
        const windowMesh = new THREE.Mesh(winGeo, winMat);
        const wy = 4 + Math.random() * (height - 8);
        const wz = bz - depth / 3 + Math.random() * (depth * 0.6);
        windowMesh.position.set(sideIdx === 0 ? bx + width / 2 + 0.05 : bx - width / 2 - 0.05, wy, wz);
        windowMesh.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
        segment.add(windowMesh);
      }
    }
  });
}

function createStreetLamp(segment, x, z) {
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 5.5, 8);
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(x, 2.75, z);
  segment.add(pole);

  const headGeo = new THREE.BoxGeometry(0.3, 0.15, 0.7);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const lampHead = new THREE.Mesh(headGeo, headMat);
  lampHead.position.set(x > 0 ? -0.3 : 0.3, 2.6, 0);
  pole.add(lampHead);
}

// CRIAÇÃO DE OBSTÁCULOS E COLETÁVEIS (SUBWAY SURFERS)
function spawnSegmentEntities(segment, segZ) {
  const spawnPoints = [-SEGMENT_LENGTH / 2 + 15, -SEGMENT_LENGTH / 2 + 38, -SEGMENT_LENGTH / 2 + 60];

  spawnPoints.forEach(localZ => {
    const worldZ = segZ + localZ;
    const lane = Math.floor(Math.random() * 3); // 0, 1 ou 2
    const obstacleType = Math.random();

    // 1. OBSTÁCULO: BARREIRA CORPORATIVA BAIXA (Pode Pular ou Desviar)
    if (obstacleType < 0.38) {
      createRoadBarrier(segment, LANES[lane], localZ, worldZ);
    }
    // 2. OBSTÁCULO: TREM DE METRÔ / BLOCÃO (Exige Desviar Lateralmente)
    else if (obstacleType < 0.68) {
      createTrainObstacle(segment, LANES[lane], localZ, worldZ);
    }
    // 3. OBSTÁCULO: PLACA SUSPENSA / BUROCRACIA (Exige Deslizar/Slide por Baixo ou Desviar)
    else {
      createOverheadObstacle(segment, LANES[lane], localZ, worldZ);
    }

    // Geração de Moedas nas Outras Faixas
    const coinLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
    spawnCoinArc(segment, LANES[coinLane], localZ - 6, worldZ - 6);

    // Chance de Maleta Bônus
    if (Math.random() < 0.25) {
      const freeLane = (lane + 2) % 3;
      spawnBriefcaseItem(segment, LANES[freeLane], localZ + 8, worldZ + 8);
    }
  });
}

// 1. Barreira Baixa
function createRoadBarrier(parent, x, localZ, worldZ) {
  const barrierGroup = new THREE.Group();
  barrierGroup.position.set(x, 0, localZ);

  // Placa Listrada Vermelho e Branco
  const boardGeo = new THREE.BoxGeometry(2.3, 0.7, 0.15);
  const boardMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.y = 0.85;
  board.castShadow = true;
  barrierGroup.add(board);

  // Texto/Letreiro
  const textStripGeo = new THREE.BoxGeometry(2.1, 0.22, 0.18);
  const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const textStrip = new THREE.Mesh(textStripGeo, textMat);
  textStrip.position.set(0, 0.85, 0);
  barrierGroup.add(textStrip);

  // Suportes Laterais
  [-0.9, 0.9].forEach(sx => {
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8);
    const postMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(sx, 0.45, 0);
    post.castShadow = true;
    barrierGroup.add(post);
  });

  parent.add(barrierGroup);

  obstacles.push({
    type: 'barrier_low',
    name: 'Barreira Burocrática',
    x: x,
    z: worldZ,
    width: 2.2,
    height: 1.1,
    depth: 0.4,
    canSlideUnder: false,
    canJumpOver: true,
    mesh: barrierGroup
  });
}

// 2. Trem de Metrô / Vagão 3D
function createTrainObstacle(parent, x, localZ, worldZ) {
  const trainGroup = new THREE.Group();
  trainGroup.position.set(x, 0, localZ);

  // Corpo do Trem (Metrô Rio)
  const bodyGeo = new THREE.BoxGeometry(2.4, 2.8, 8.5);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 }); // Azul Metrô
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.45;
  body.castShadow = true;
  trainGroup.add(body);

  // Faixa Prateada
  const stripeGeo = new THREE.BoxGeometry(2.42, 0.4, 8.52);
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = 1.5;
  trainGroup.add(stripe);

  // Faróis Frontais
  [-0.7, 0.7].forEach(fx => {
    const lightGeo = new THREE.BoxGeometry(0.3, 0.25, 0.1);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(fx, 0.8, 4.3);
    trainGroup.add(light);
  });

  // Janelas Laterais
  for (let jz = -3; jz <= 3; jz += 2) {
    const winGeo = new THREE.BoxGeometry(2.44, 0.7, 1.2);
    const winMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(0, 1.9, jz);
    trainGroup.add(win);
  }

  parent.add(trainGroup);

  obstacles.push({
    type: 'train',
    name: 'Trem Metrô Rio',
    x: x,
    z: worldZ,
    width: 2.3,
    height: 2.8,
    depth: 8.5,
    canSlideUnder: false,
    canJumpOver: false, // Muito alto, deve desviar lateralmente!
    mesh: trainGroup
  });
}

// 3. Placa Suspensa (Exige Slide / Agachar)
function createOverheadObstacle(parent, x, localZ, worldZ) {
  const overGroup = new THREE.Group();
  overGroup.position.set(x, 0, localZ);

  // Placa Superior Alta ("CLT / IMPOSTOS")
  const signGeo = new THREE.BoxGeometry(2.4, 1.1, 0.2);
  const signMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.y = 2.0;
  sign.castShadow = true;
  overGroup.add(sign);

  // Faixas Laterais de Sustentação
  [-1.05, 1.05].forEach(px => {
    const beamGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8);
    const beamMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(px, 1.25, 0);
    overGroup.add(beam);
  });

  parent.add(overGroup);

  obstacles.push({
    type: 'overhead_sign',
    name: 'Burocracia Suspensa (CLT)',
    x: x,
    z: worldZ,
    width: 2.2,
    height: 1.1,
    minY: 1.4, // Parte sólida começa a partir de 1.4m de altura!
    depth: 0.3,
    canSlideUnder: true,
    canJumpOver: false,
    mesh: overGroup
  });
}

// Moedas em Arco (Gold Coins)
function spawnCoinArc(parent, x, localZ, worldZ) {
  const coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16);
  const coinMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0x713f12 });

  for (let i = 0; i < 4; i++) {
    const offsetZ = i * 2.2;
    const coinMesh = new THREE.Mesh(coinGeo, coinMat);
    coinMesh.rotation.x = Math.PI / 2;
    coinMesh.position.set(x, 0.9, localZ + offsetZ);
    coinMesh.castShadow = true;
    parent.add(coinMesh);

    coins.push({
      type: 'coin',
      value: 10,
      x: x,
      z: worldZ + offsetZ,
      y: 0.9,
      mesh: coinMesh,
      collected: false
    });
  }
}

// Maleta de Dinheiro Coletável
function spawnBriefcaseItem(parent, x, localZ, worldZ) {
  const caseGeo = new THREE.BoxGeometry(0.55, 0.4, 0.2);
  const caseMat = new THREE.MeshLambertMaterial({ color: 0x16a34a, emissive: 0x052e16 });
  const caseMesh = new THREE.Mesh(caseGeo, caseMat);
  caseMesh.position.set(x, 1.1, localZ);
  parent.add(caseMesh);

  coins.push({
    type: 'briefcase',
    value: 50,
    x: x,
    z: worldZ,
    y: 1.1,
    mesh: caseMesh,
    collected: false
  });
}

// CONTROLES: TECLADO, TOUCH E BOTÕES DE TELA
function setupControls() {
  // Teclado
  window.addEventListener('keydown', (e) => {
    if (!isGameRunning || isGameOver) return;

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      moveLeft();
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      moveRight();
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
      e.preventDefault();
      jump();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      slide();
    }
  });

  // Touch / Gestos Swipe em Dispositivos Móveis
  const container = document.getElementById('canvasContainer');
  if (container) {
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!isGameRunning || isGameOver) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 35) moveRight();
        else if (dx < -35) moveLeft();
      } else {
        if (dy < -35) jump();
        else if (dy > 35) slide();
      }
    }, { passive: true });
  }

  // Botões Virtuais Móveis
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  if (btnLeft) btnLeft.addEventListener('click', () => moveLeft());
  if (btnRight) btnRight.addEventListener('click', () => moveRight());

  const btnJump = document.getElementById('btnJump');
  const btnSlide = document.getElementById('btnSlide');
  if (btnJump) btnJump.addEventListener('click', () => jump());
  if (btnSlide) btnSlide.addEventListener('click', () => slide());
}

// AÇÕES DO PERSONAGEM
export function moveLeft() {
  if (currentLaneIndex > 0) {
    currentLaneIndex--;
    targetX = LANES[currentLaneIndex];
  }
}

export function moveRight() {
  if (currentLaneIndex < 2) {
    currentLaneIndex++;
    targetX = LANES[currentLaneIndex];
  }
}

export function jump() {
  if (!isJumping) {
    isJumping = true;
    jumpVelocity = JUMP_FORCE;
    isSliding = false; // Cancela slide ao pular
    try { sounds.playJump(); } catch(e){}
  }
}

export function slide() {
  if (!isSliding) {
    isSliding = true;
    slideTimer = SLIDE_DURATION;
    try { sounds.playSlide(); } catch(e){}
  }
}

// SISTEMA DE FÍSICA E ANIMAÇÃO DO PERSONAGEM
function updateCharacter(dt) {
  if (!character) return;

  // 1. Transição Lateral Suave entre as Faixas (Lerp)
  characterX += (targetX - characterX) * (18 * dt);
  character.position.x = characterX;

  // Leve Inclinação Corporal ao Mudar de Faixa
  const laneDelta = targetX - characterX;
  character.rotation.z = -laneDelta * 0.12;

  // 2. Física do Pulo (Parábola com Gravidade)
  if (isJumping) {
    characterY += jumpVelocity * dt * 3.6;
    jumpVelocity += GRAVITY * dt * 60;

    if (characterY <= 0) {
      characterY = 0;
      isJumping = false;
      jumpVelocity = 0;
    }
  }

  // 3. Duração e Estado do Slide (Agachamento)
  if (isSliding) {
    slideTimer -= dt;
    if (slideTimer <= 0) {
      isSliding = false;
    }
  }

  // 4. Transformação Visual de Pulo / Slide
  if (isSliding) {
    character.scale.set(1.0, 0.45, 1.3);
    character.position.y = 0.25;
  } else {
    character.scale.set(1.0, 1.0, 1.0);
    character.position.y = characterY;
  }

  // 5. Animação Esquelética Procedural (Passadas e Braços)
  animTime += dt * (speed * 0.35);
  const legSwing = Math.sin(animTime) * 0.75;
  const armSwing = Math.sin(animTime) * 0.65;

  if (!isJumping && !isSliding) {
    leftLeg.rotation.x = legSwing;
    rightLeg.rotation.x = -legSwing;
    leftArm.rotation.x = -armSwing;
    rightArm.rotation.x = armSwing;
    headMesh.rotation.y = Math.sin(animTime * 0.5) * 0.05;
  } else if (isJumping) {
    leftLeg.rotation.x = -0.4;
    rightLeg.rotation.x = -0.5;
    leftArm.rotation.x = 0.8;
    rightArm.rotation.x = 0.8;
  } else if (isSliding) {
    leftLeg.rotation.x = 0.9;
    rightLeg.rotation.x = 0.9;
    leftArm.rotation.x = -0.7;
    rightArm.rotation.x = -0.7;
  }
}

// DETECÇÃO DE COLISÕES PRECISA COM AABB (HITBOX)
function checkCollisions() {
  const playerX = characterX;
  const playerY = isSliding ? 0.4 : characterY + 1.0;
  const playerZ = 0; // O personagem corre fixo em Z = 0 enquanto a pista se move

  const playerRadiusX = 0.45;
  const playerHeight = isSliding ? 0.6 : 1.8;

  // 1. Colisão com Obstáculos
  for (const obs of obstacles) {
    const dz = Math.abs(obs.z - playerZ);
    if (dz < (obs.depth / 2 + 0.35)) {
      const dx = Math.abs(obs.x - playerX);
      if (dx < (obs.width / 2 + playerRadiusX)) {
        
        // Verifica se o obstáculo pode ser pulado
        if (obs.canJumpOver && characterY > obs.height) {
          continue; // Pulou por cima com sucesso!
        }

        // Verifica se o obstáculo suspenso pode ser passado com slide
        if (obs.canSlideUnder && isSliding) {
          continue; // Deslizou por baixo com sucesso!
        }

        // Colisão Fatal!
        triggerGameOver(obs);
        return;
      }
    }
  }

  // 2. Coleta de Moedas e Maletas
  for (const item of coins) {
    if (item.collected) continue;

    const dz = Math.abs(item.z - playerZ);
    if (dz < 1.2) {
      const dx = Math.abs(item.x - playerX);
      if (dx < 1.1) {
        item.collected = true;
        item.mesh.visible = false;

        if (item.type === 'coin') {
          coinsCollected += item.value;
          try { sounds.playCoin(); } catch(e){}
        } else if (item.type === 'briefcase') {
          coinsCollected += item.value;
          try { sounds.playBriefcase(); } catch(e){}
        }
        updateHUD();
      }
    }
  }
}

// GAME OVER E REINICIALIZAÇÃO
function triggerGameOver(obstacle) {
  isGameOver = true;
  isGameRunning = false;
  try { sounds.playGameOver(); } catch(e){}
  try { sounds.stopAmbienceCity(); } catch(e){}

  // Salva Recorde de Distância
  const finalDistanceKm = Math.floor(distanceTraveled / 10);
  if (finalDistanceKm > bestDistance) {
    bestDistance = finalDistanceKm;
    localStorage.setItem('run_best', bestDistance.toString());
  }

  savePlayerScore('runner', finalDistanceKm);

  // Exibe Modal de Game Over
  const modal = document.getElementById('gameOverModal');
  const goTitle = document.getElementById('goTitle');
  const goMessage = document.getElementById('goMessage');
  const goDistance = document.getElementById('goDistance');

  if (modal) {
    if (goTitle) goTitle.textContent = obstacle.name || 'OBSTÁCULO';
    if (goMessage) goMessage.textContent = `Você colidiu com ${obstacle.name || 'o obstáculo'}!\nColete moedas e desvie dos impostos e trens de metrô!`;
    if (goDistance) goDistance.textContent = `${finalDistanceKm} KM PERCORRIDOS · ${coinsCollected} LUCRO`;
    modal.style.display = 'flex';
  }
}

export function restart3DGame() {
  isGameOver = false;
  isGameRunning = true;
  distanceTraveled = 0;
  coinsCollected = 0;
  speed = BASE_SPEED;
  currentLaneIndex = 1;
  targetX = 0;
  characterX = 0;
  characterY = 0;
  isJumping = false;
  isSliding = false;

  // Esconde Modais
  const modal = document.getElementById('gameOverModal');
  if (modal) modal.style.display = 'none';

  const startOverlay = document.getElementById('startOverlay');
  if (startOverlay) startOverlay.style.display = 'none';

  // Reconstrói a Pista
  for (const seg of roadSegments) scene.remove(seg);
  roadSegments = [];
  obstacles = [];
  coins = [];
  buildInitialTrack();

  // Inicia Som Ambiente
  try { sounds.startAmbienceCity(); } catch(e){}

  updateHUD();
}

// ATUALIZAÇÃO DO HUD EM TELA
function updateHUD() {
  const distEl = document.getElementById('distDisplay');
  const bestEl = document.getElementById('bestDisplay');
  const speedEl = document.getElementById('speedDisplay');

  const distKm = Math.floor(distanceTraveled / 10);
  if (distEl) distEl.textContent = `${distKm} km`;
  if (bestEl) bestEl.textContent = `${bestDistance} km`;
  if (speedEl) speedEl.textContent = `${(speed / BASE_SPEED).toFixed(1)}x`;
}

// REDIMENSIONAMENTO DE TELA
function onWindowResize() {
  const container = document.getElementById('canvasContainer');
  if (!container || !renderer || !camera) return;

  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// LOOP PRINCIPAL DE ANIMAÇÃO E RENDERIZAÇÃO
function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);

  if (isGameRunning && !isGameOver) {
    // 1. Incremento de Distância e Aceleração Gradual
    distanceTraveled += speed * dt;
    if (speed < MAX_SPEED) {
      speed += 0.45 * dt;
    }

    // 2. Movimento dos Segmentos da Pista em Direção ao Jogador
    const moveZ = speed * dt;
    for (const seg of roadSegments) {
      seg.position.z += moveZ;
    }

    for (const obs of obstacles) {
      obs.z += moveZ;
    }

    for (const coin of coins) {
      coin.z += moveZ;
      if (coin.mesh) {
        coin.mesh.rotation.z += 3.5 * dt; // Rotação da moeda
      }
    }

    // 3. Reciclagem de Segmentos que Ficaram Para Trás
    const firstSeg = roadSegments[0];
    if (firstSeg && firstSeg.position.z > SEGMENT_LENGTH) {
      scene.remove(firstSeg);
      roadSegments.shift();

      // Limpa obstáculos antigos fora da visão
      obstacles = obstacles.filter(o => o.z < 25);
      coins = coins.filter(c => c.z < 25);

      // Adiciona novo segmento no final
      const lastSeg = roadSegments[roadSegments.length - 1];
      const newZ = lastSeg.position.z - SEGMENT_LENGTH;
      const newSeg = createRoadSegment(newZ, true);
      roadSegments.push(newSeg);
      scene.add(newSeg);
    }

    // 4. Atualização do Personagem e Colisões
    updateCharacter(dt);
    checkCollisions();
    updateHUD();

    // 5. Câmera Dinâmica (Leve Vibração e Abertura de Campo por Velocidade)
    camera.fov = 62 + (speed - BASE_SPEED) * 0.18;
    camera.position.x = characterX * 0.4;
    camera.updateProjectionMatrix();
  }

  // Renderiza a Cena
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
