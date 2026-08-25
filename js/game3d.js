// js/game3d.js — Jogo do Empresário 3D (Subway Surfers Favela Edition)
// Desenvolvido com Three.js (WebGL) com Favela Ensolarada do Rio e Obstáculos Brasileiros:
// Carteira de Trabalho (CLT), Cartão Bolsa Família, Auxílio Brasil, Picanhas e Trens em Movimento!

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { sounds } from './audio.js';
import { savePlayerScore } from './firebase-config.js';
import { auth } from './auth.js';

let scene, camera, renderer;
let character, characterGroup;
let isGameRunning = false;
let isGameOver = false;

// 3 Faixas de Corrida (Subway Surfers)
const LANES = [-2.8, 0, 2.8];
let currentLaneIndex = 1;
let targetX = 0;
let characterX = 0;

// Física do Personagem
let isJumping = false;
let jumpVelocity = 0;
const GRAVITY = -0.62;
let JUMP_FORCE = 9.8;
let characterY = 0;

let isSliding = false;
let slideTimer = 0;
const SLIDE_DURATION = 0.55;

// Power-ups
let magnetActive = false;
let magnetTimer = 0;
let superJumpActive = false;
let superJumpTimer = 0;

// Velocidade e Pontuação
let speed = 36;
const BASE_SPEED = 36;
const MAX_SPEED = 82;
let distanceTraveled = 0;
let coinsCollected = 0;
let picanhasCollected = 0;
let bestDistance = parseInt(localStorage.getItem('run_best') || '0', 10);

// Segmentos e Entidades da Favela
const SEGMENT_LENGTH = 85;
const TOTAL_SEGMENTS = 6;
let roadSegments = [];
let obstacles = [];
let coins = [];
let powerups = [];
let movingTrains = [];
let particles = [];

// Relógio e Animação
let clock = new THREE.Clock();
let animTime = 0;
let touchStartX = 0, touchStartY = 0;

// Partes do Empresário
let leftLeg, rightLeg, leftArm, rightArm, briefcaseMesh, headMesh;

// Texturas Compartilhadas
const textureLoader = new THREE.TextureLoader();
let picanhaTexture = textureLoader.load('/img/picanha.png');
let favelaBackdropTexture = textureLoader.load('/img/favela.png');

// Texturas Procedurais Criadas no Canvas (Nítidas e Realistas)
let cltTexture = createCLTTexture();
let bolsaFamiliaTexture = createBolsaFamiliaTexture();
let auxilioTexture = createAuxilioTexture();

// INICIALIZADOR DO JOGO 3D
export function init3DGame() {
  const container = document.getElementById('canvasContainer');
  if (!container) return;

  // 1. Cena com Céu Ensolarado Carioca
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x60a5fa); // Azul Céu do Rio
  scene.fog = new THREE.FogExp2(0x93c5fd, 0.0055);

  // 2. Câmera em 3ª Pessoa (Dinâmica e com Profundidade)
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 500);
  camera.position.set(0, 4.4, 7.2);
  camera.lookAt(0, 1.6, -14);

  // 3. Renderizador WebGL
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // 4. Luz Solar Tropical e Sombras
  const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x334155, 0.85);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff6cf, 1.25);
  sunLight.position.set(30, 60, 25);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 160;
  sunLight.shadow.camera.left = -20;
  sunLight.shadow.camera.right = 20;
  sunLight.shadow.camera.top = 20;
  sunLight.shadow.camera.bottom = -20;
  scene.add(sunLight);

  // 5. Fundo Panorâmico das Montanhas e Favela do Rio
  createFavelaBackdrop();

  // 6. Personagem 3D (Empresário de Terno)
  buildCharacter();

  // 7. Pista de Ferrovia e Casas da Favela
  buildInitialTrack();

  // 8. Controles e Redimensionamento
  setupControls();
  window.addEventListener('resize', onWindowResize);

  updateHUD();
  animate();
}

// 1. FUNDO PANORÂMICO DA FAVELA DO RIO DE JANEIRO
function createFavelaBackdrop() {
  const bgGeo = new THREE.CylinderGeometry(280, 280, 140, 32, 1, true, -Math.PI / 2, Math.PI);
  const bgMat = new THREE.MeshBasicMaterial({
    map: favelaBackdropTexture,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.88
  });
  const backdrop = new THREE.Mesh(bgGeo, bgMat);
  backdrop.position.set(0, 45, -80);
  backdrop.rotation.y = Math.PI;
  scene.add(backdrop);
}

// 2. MODELO 3D DO PERSONAGEM (EMPRESÁRIO)
function buildCharacter() {
  characterGroup = new THREE.Group();

  const suitMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Terno Azul Marinho
  const shirtMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Camisa Branca
  const tieMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });   // Gravata Vermelha
  const skinMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });  // Tom de Pele
  const hairMat = new THREE.MeshLambertMaterial({ color: 0x1c1917 });  // Cabelo
  const glassesMat = new THREE.MeshLambertMaterial({ color: 0x09090b });// Óculos
  const shoeMat = new THREE.MeshLambertMaterial({ color: 0x111827 });  // Sapato
  const leatherMat = new THREE.MeshLambertMaterial({ color: 0x78350f });// Maleta

  // Tronco
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.95, 0.44), suitMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  characterGroup.add(torso);

  // Camisa e Gravata
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.5, 0.04), shirtMat);
  shirt.position.set(0, 1.5, 0.22);
  characterGroup.add(shirt);

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.42, 0.05), tieMat);
  tie.position.set(0, 1.45, 0.23);
  characterGroup.add(tie);

  // Cabeça e Óculos
  headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.44), skinMat);
  headMesh.position.y = 2.05;
  headMesh.castShadow = true;
  characterGroup.add(headMesh);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.46), hairMat);
  hair.position.set(0, 0.22, -0.02);
  headMesh.add(hair);

  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.08), glassesMat);
  glasses.position.set(0, 0.04, 0.22);
  headMesh.add(glasses);

  // Braços e Maleta de Dinheiro
  leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.2), suitMat);
  leftArm.position.set(-0.48, 1.35, 0);
  leftArm.castShadow = true;
  characterGroup.add(leftArm);

  rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.2), suitMat);
  rightArm.position.set(0.48, 1.35, 0);
  rightArm.castShadow = true;
  characterGroup.add(rightArm);

  briefcaseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.48), leatherMat);
  briefcaseMesh.position.set(0.12, -0.28, 0.1);
  briefcaseMesh.castShadow = true;
  rightArm.add(briefcaseMesh);

  // Pernas
  leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.85, 0.26), suitMat);
  leftLeg.position.set(-0.2, 0.45, 0);
  leftLeg.castShadow = true;

  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.15, 0.38), shoeMat);
  leftShoe.position.set(0, -0.4, 0.06);
  leftLeg.add(leftShoe);
  characterGroup.add(leftLeg);

  rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.85, 0.26), suitMat);
  rightLeg.position.set(0.2, 0.45, 0);
  rightLeg.castShadow = true;

  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.15, 0.38), shoeMat);
  rightShoe.position.set(0, -0.4, 0.06);
  rightLeg.add(rightShoe);
  characterGroup.add(rightLeg);

  // Sombra Dinâmica
  const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
  const charShadow = new THREE.Mesh(shadowGeo, shadowMat);
  charShadow.rotation.x = -Math.PI / 2;
  charShadow.position.y = 0.03;
  characterGroup.add(charShadow);

  character = characterGroup;
  scene.add(character);
}

// 3. CONSTRUÇÃO DA PISTA DA FAVELA & TRILHOS DE METRÔ (SUBWAY SURFERS)
function buildInitialTrack() {
  roadSegments = [];
  obstacles = [];
  coins = [];
  powerups = [];
  movingTrains = [];

  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    const segZ = -i * SEGMENT_LENGTH;
    const seg = createFavelaSegment(segZ, i > 1);
    roadSegments.push(seg);
    scene.add(seg);
  }
}

function createFavelaSegment(zPos, withEntities = true) {
  const segment = new THREE.Group();
  segment.position.z = zPos;

  // 1. Leito de Brita e Cascalho da Ferrovia (Subway Tracks)
  const trackWidth = 9.8;
  const gravelGeo = new THREE.PlaneGeometry(trackWidth, SEGMENT_LENGTH);
  const gravelMat = new THREE.MeshLambertMaterial({ color: 0x3f3f46 }); // Cascalho escuro
  const gravel = new THREE.Mesh(gravelGeo, gravelMat);
  gravel.rotation.x = -Math.PI / 2;
  gravel.receiveShadow = true;
  segment.add(gravel);

  // 2. Trilhos de Aço e Dormentes de Madeira nas 3 Faixas
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 }); // Dormentes
  const railMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 }); // Trilhos metálicos

  LANES.forEach(laneX => {
    // Dormentes de Madeira a cada 2.5m
    for (let dz = -SEGMENT_LENGTH / 2 + 2; dz < SEGMENT_LENGTH / 2; dz += 2.6) {
      const tieMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.4), woodMat);
      tieMesh.position.set(laneX, 0.06, dz);
      tieMesh.receiveShadow = true;
      segment.add(tieMesh);
    }

    // 2 Trilhos de Aço por Faixa
    [-0.8, 0.8].forEach(rx => {
      const railMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, SEGMENT_LENGTH), railMat);
      railMesh.position.set(laneX + rx, 0.15, 0);
      railMesh.receiveShadow = true;
      segment.add(railMesh);
    });
  });

  // 3. Muretas Laterais de Concreto com Grafites
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x71717a });
  [-5.4, 5.4].forEach(wx => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, SEGMENT_LENGTH), wallMat);
    wall.position.set(wx, 0.6, 0);
    wall.receiveShadow = true;
    segment.add(wall);
  });

  // 4. Arquitetura 3D da Favela do Rio (Casas sobrepostas, tijolo baiano e lajes)
  buildFavelaHouses(segment);

  // 5. Postes de Eletricidade com Emaranhado de Fios ("Gatos de Luz")
  for (let pz = -SEGMENT_LENGTH / 2 + 15; pz < SEGMENT_LENGTH / 2; pz += 30) {
    createFavelaPolesAndWires(segment, pz);
  }

  // 6. Spawn de Obstáculos Brasileiros e Coletáveis
  if (withEntities) {
    spawnFavelaObstacles(segment, zPos);
  }

  return segment;
}

// ARQUITETURA DE CASAS DA FAVELA
function buildFavelaHouses(segment) {
  const houseColors = [
    0xc2410c, // Tijolo Baiano Terracota
    0xea580c, // Tijolo Laranja
    0xfacc15, // Amarelo Solar
    0x0284c7, // Azul Piscina
    0x16a34a, // Verde Bandeira
    0xdb2777, // Rosa Choque
    0x78716c  // Concreto Aparente
  ];

  const waterTankMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 }); // Caixa d'água Fortlev
  const brickMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });

  [-13, 13].forEach((baseX, sideIdx) => {
    for (let bz = -SEGMENT_LENGTH / 2 + 8; bz < SEGMENT_LENGTH / 2; bz += 16) {
      const floors = 2 + Math.floor(Math.random() * 3); // 2 a 4 andares empilhados

      let curY = 0;
      for (let f = 0; f < floors; f++) {
        const width = 6 + Math.random() * 4;
        const height = 3.5 + Math.random() * 1.5;
        const depth = 8 + Math.random() * 5;
        const shiftX = (Math.random() - 0.5) * 1.5;

        const color = houseColors[Math.floor(Math.random() * houseColors.length)];
        const houseMat = (f === 0 && Math.random() > 0.4) ? brickMat : new THREE.MeshLambertMaterial({ color });

        const house = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), houseMat);
        house.position.set(baseX + shiftX + (sideIdx === 0 ? -width / 4 : width / 4), curY + height / 2, bz);
        house.castShadow = true;
        house.receiveShadow = true;
        segment.add(house);

        // Janelas e Portas com Molduras
        const winMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), winMat);
        const winX = sideIdx === 0 ? baseX + shiftX + width / 2 + 0.05 : baseX + shiftX - width / 2 - 0.05;
        win.position.set(winX, curY + height / 2, bz);
        win.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
        segment.add(win);

        // Caixa d'água azul no topo da laje
        if (f === floors - 1) {
          const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.7, 1.1, 12), waterTankMat);
          tank.position.set(house.position.x, curY + height + 0.55, bz + (Math.random() - 0.5) * 2);
          tank.castShadow = true;
          segment.add(tank);

          // Antena de TV
          const antennaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), new THREE.MeshLambertMaterial({ color: 0xd4d4d8 }));
          antennaPole.position.set(house.position.x + 1.2, curY + height + 1.1, bz - 1.5);
          segment.add(antennaPole);
        }

        curY += height;
      }
    }
  });
}

// POSTES E FIAÇÃO DE LUZ NA FAVELA
function createFavelaPolesAndWires(segment, pz) {
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

  [-5.8, 5.8].forEach(px => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 7.5, 8), poleMat);
    pole.position.set(px, 3.75, pz);
    pole.castShadow = true;
    segment.add(pole);

    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.15), poleMat);
    crossArm.position.set(0, 3.2, 0);
    pole.add(crossArm);
  });

  // Fios Elétricos Cruzando no Alto
  [-0.6, 0, 0.6].forEach(offsetY => {
    const wireGeo = new THREE.CylinderGeometry(0.02, 0.02, 11.6, 6);
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.rotation.z = Math.PI / 2;
    wire.position.set(0, 6.8 + offsetY, pz);
    segment.add(wire);
  });
}

// 4. CRIAÇÃO DOS OBSTÁCULOS BRASILEIROS (SUBWAY SURFERS)
function spawnFavelaObstacles(segment, segZ) {
  const spawnPoints = [-SEGMENT_LENGTH / 2 + 16, -SEGMENT_LENGTH / 2 + 42, -SEGMENT_LENGTH / 2 + 66];

  spawnPoints.forEach(localZ => {
    const worldZ = segZ + localZ;
    const lane = Math.floor(Math.random() * 3);
    const rand = Math.random();

    // 1. CARTEIRA DE TRABALHO (CLT 44H)
    if (rand < 0.28) {
      createCLTObstacle(segment, LANES[lane], localZ, worldZ);
    }
    // 2. CARTÃO BOLSA FAMÍLIA OU AUXÍLIO BRASIL
    else if (rand < 0.52) {
      if (Math.random() > 0.5) {
        createBolsaFamiliaObstacle(segment, LANES[lane], localZ, worldZ);
      } else {
        createAuxilioObstacle(segment, LANES[lane], localZ, worldZ);
      }
    }
    // 3. TREM DE METRÔ EM MOVIMENTO (OU PARADO COM RAMPA)
    else if (rand < 0.78) {
      createMetroTrainObstacle(segment, LANES[lane], localZ, worldZ);
    }
    // 4. VARAL DE FAVELA / BUROCRACIA SUSPENSA (EXIGE SLIDE / AGACHAR)
    else {
      createClotheslineObstacle(segment, LANES[lane], localZ, worldZ);
    }

    // Spawn de Picanhas Coletáveis ou Moedas nas outras faixas
    const freeLane1 = (lane + 1) % 3;
    const freeLane2 = (lane + 2) % 3;

    if (Math.random() < 0.45) {
      spawnPicanhaCollectible(segment, LANES[freeLane1], localZ, worldZ);
    } else {
      spawnCoinTrack(segment, LANES[freeLane1], localZ - 6, worldZ - 6);
    }

    // Spawn de Power-up Raro (Ímã ou Super Tênis)
    if (Math.random() < 0.18) {
      spawnPowerupItem(segment, LANES[freeLane2], localZ + 8, worldZ + 8);
    }
  });
}

// 1. OBSTÁCULO: CARTEIRA DE TRABALHO (CLT 44H)
function createCLTObstacle(parent, x, localZ, worldZ) {
  const group = new THREE.Group();
  group.position.set(x, 0, localZ);

  // Livro 3D Azul da Carteira de Trabalho
  const bookGeo = new THREE.BoxGeometry(2.1, 1.4, 0.35);
  const bookMat = new THREE.MeshLambertMaterial({ map: cltTexture });
  const book = new THREE.Mesh(bookGeo, bookMat);
  book.position.y = 0.95;
  book.castShadow = true;
  group.add(book);

  parent.add(group);

  obstacles.push({
    name: 'Carteira Assinada (CLT 44h)',
    x: x,
    z: worldZ,
    width: 2.1,
    height: 1.4,
    depth: 0.6,
    canJumpOver: true,
    canSlideUnder: false,
    mesh: group
  });
}

// 2. OBSTÁCULO: CARTÃO BOLSA FAMÍLIA
function createBolsaFamiliaObstacle(parent, x, localZ, worldZ) {
  const group = new THREE.Group();
  group.position.set(x, 0, localZ);

  const cardGeo = new THREE.BoxGeometry(2.3, 1.45, 0.25);
  const cardMat = new THREE.MeshLambertMaterial({ map: bolsaFamiliaTexture });
  const card = new THREE.Mesh(cardGeo, cardMat);
  card.position.y = 0.95;
  card.castShadow = true;
  group.add(card);

  parent.add(group);

  obstacles.push({
    name: 'Cartão Bolsa Família',
    x: x,
    z: worldZ,
    width: 2.3,
    height: 1.45,
    depth: 0.5,
    canJumpOver: true,
    canSlideUnder: false,
    mesh: group
  });
}

// 3. OBSTÁCULO: CARTÃO AUXÍLIO BRASIL
function createAuxilioObstacle(parent, x, localZ, worldZ) {
  const group = new THREE.Group();
  group.position.set(x, 0, localZ);

  const cardGeo = new THREE.BoxGeometry(2.3, 1.45, 0.25);
  const cardMat = new THREE.MeshLambertMaterial({ map: auxilioTexture });
  const card = new THREE.Mesh(cardGeo, cardMat);
  card.position.y = 0.95;
  card.castShadow = true;
  group.add(card);

  parent.add(group);

  obstacles.push({
    name: 'Cartão Auxílio Brasil',
    x: x,
    z: worldZ,
    width: 2.3,
    height: 1.45,
    depth: 0.5,
    canJumpOver: true,
    canSlideUnder: false,
    mesh: group
  });
}

// 4. OBSTÁCULO: TREM DE METRÔ EM MOVIMENTO COM RAMPA E FARÓIS (SUBWAY SURFERS)
function createMetroTrainObstacle(parent, x, localZ, worldZ) {
  const trainGroup = new THREE.Group();
  trainGroup.position.set(x, 0, localZ);

  const trainLength = 14;
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.75, roughness: 0.25 }); // Azul Metrô Rio
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.25 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffdf00, metalness: 0.6, roughness: 0.3 });

  // Corpo do Vagão
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.38, 2.9, trainLength), bodyMat);
  body.position.y = 1.5;
  body.castShadow = true;
  body.receiveShadow = true;
  trainGroup.add(body);

  // Faixas Metálicas Laterais
  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, trainLength), stripeMat);
  stripeL.position.set(-1.20, 1.3, 0);
  const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, trainLength), stripeMat);
  stripeR.position.set(1.20, 1.3, 0);
  trainGroup.add(stripeL, stripeR);

  // Teto Prateado Corrugado com Módulos HVAC
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.25, trainLength), metalMat);
  roof.position.y = 2.98;
  trainGroup.add(roof);

  [-3.5, 3.5].forEach(hz => {
    const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 2.2), darkMetalMat);
    hvac.position.set(0, 3.15, hz);
    trainGroup.add(hvac);
  });

  // Cabine Frontal com Letreiro LED e Faróis Fortes
  const frontNose = new THREE.Mesh(new THREE.BoxGeometry(2.42, 2.95, 1.0), new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.8, roughness: 0.2 }));
  frontNose.position.set(0, 1.5, trainLength / 2 + 0.45);
  trainGroup.add(frontNose);

  const frontWin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 0.1), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 }));
  frontWin.position.set(0, 2.0, trainLength / 2 + 0.98);
  trainGroup.add(frontWin);

  const ledSign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.1), new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 1.2 }));
  ledSign.position.set(0, 2.65, trainLength / 2 + 0.98);
  trainGroup.add(ledSign);

  // Faróis Xenon Fortes
  [-0.75, 0.75].forEach(fx => {
    const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16), new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 1.4
    }));
    headlight.rotation.x = Math.PI / 2;
    headlight.position.set(fx, 1.1, trainLength / 2 + 0.98);
    trainGroup.add(headlight);
  });

  // Feixe de Luz Volumétrico dos Faróis
  const beamGeo = new THREE.ConeGeometry(2.4, 14.0, 8, 1, true);
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  }));
  beam.rotation.x = -Math.PI / 2;
  beam.position.set(0, 1.1, trainLength / 2 + 8.0);
  trainGroup.add(beam);

  // Bogies Inferiores (Rodas de Aço)
  [-3.8, 3.8].forEach(bz => {
    const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 2.4), darkMetalMat);
    bogie.position.set(0, 0.2, bz);
    trainGroup.add(bogie);
  });

  // Rampa de Acesso Traseira (Permite subir no teto do trem como no Subway Surfers!)
  const rampMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5, roughness: 0.4 });
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 3.8), rampMat);
  ramp.position.set(0, 1.35, -trainLength / 2 - 1.4);
  ramp.rotation.x = Math.PI / 7.2;
  ramp.castShadow = true;
  trainGroup.add(ramp);

  // Moedas de Ouro no Teto do Trem
  for (let rz = -4.0; rz <= 4.0; rz += 2.5) {
    const roofCoin = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16), new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0x713f12 }));
    roofCoin.rotation.x = Math.PI / 2;
    roofCoin.position.set(0, 3.35, rz);
    trainGroup.add(roofCoin);

    coins.push({
      type: 'coin',
      value: 10,
      x: x,
      z: worldZ + rz,
      y: 3.35,
      mesh: roofCoin,
      collected: false
    });
  }

  parent.add(trainGroup);

  // Trem em Movimento que Vem de Frente!
  const isMoving = Math.random() > 0.4;
  if (isMoving) {
    try { sounds.playTrainHorn(); } catch(e){}
  }

  const obsObj = {
    name: 'Trem do Metrô Rio',
    x: x,
    z: worldZ,
    width: 2.4,
    height: 3.0,
    depth: trainLength + 3.0,
    canJumpOver: false,
    canSlideUnder: false,
    isMoving: isMoving,
    trainSpeed: isMoving ? 16 : 0,
    mesh: trainGroup
  };

  obstacles.push(obsObj);
  if (isMoving) movingTrains.push(obsObj);
}

// 5. OBSTÁCULO: VARAL DE ROUPAS / FIOS BAIXOS DE FAVELA (EXIGE SLIDE / AGACHAR)
function createClotheslineObstacle(parent, x, localZ, worldZ) {
  const group = new THREE.Group();
  group.position.set(x, 0, localZ);

  // Placa / Viga Suspensa com Roupas
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 0.15), new THREE.MeshLambertMaterial({ color: 0x78350f }));
  beam.position.y = 2.0;
  beam.castShadow = true;
  group.add(beam);

  // Postes Laterais
  [-1.15, 1.15].forEach(px => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.3, 8), new THREE.MeshLambertMaterial({ color: 0x334155 }));
    post.position.set(px, 1.15, 0);
    group.add(post);
  });

  // Roupas Penduradas no Varal
  const clothesColors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981];
  for (let i = 0; i < 3; i++) {
    const shirt = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.7), new THREE.MeshLambertMaterial({ color: clothesColors[i], side: THREE.DoubleSide }));
    shirt.position.set(-0.6 + i * 0.6, 1.55, 0);
    group.add(shirt);
  }

  parent.add(group);

  obstacles.push({
    name: 'Varal de Roupas da Favela',
    x: x,
    z: worldZ,
    width: 2.4,
    height: 1.2,
    minY: 1.35, // Parte sólida começa a 1.35m (requer slide!)
    depth: 0.4,
    canSlideUnder: true,
    canJumpOver: false,
    mesh: group
  });
}

// PICANHA COLETÁVEL (+50 PONTOS DE LUCRO)
function spawnPicanhaCollectible(parent, x, localZ, worldZ) {
  const picanhaGeo = new THREE.PlaneGeometry(0.9, 0.7);
  const picanhaMat = new THREE.MeshBasicMaterial({ map: picanhaTexture, transparent: true, side: THREE.DoubleSide });
  const picanhaMesh = new THREE.Mesh(picanhaGeo, picanhaMat);
  picanhaMesh.position.set(x, 1.1, localZ);
  parent.add(picanhaMesh);

  // Halo Dourado Giratório
  const haloGeo = new THREE.RingGeometry(0.5, 0.65, 16);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.set(0, 0, -0.05);
  picanhaMesh.add(halo);

  coins.push({
    type: 'picanha',
    value: 50,
    x: x,
    z: worldZ,
    y: 1.1,
    mesh: picanhaMesh,
    collected: false
  });
}

// MOEDAS EM TRILHA (R$ DE OURO)
function spawnCoinTrack(parent, x, localZ, worldZ) {
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

// POWER-UP (ÍMÃ OU SUPER TÊNIS)
function spawnPowerupItem(parent, x, localZ, worldZ) {
  const isMagnet = Math.random() > 0.5;
  const color = isMagnet ? 0xef4444 : 0x10b981;

  const itemGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const itemMat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4 });
  const itemMesh = new THREE.Mesh(itemGeo, itemMat);
  itemMesh.position.set(x, 1.2, localZ);
  parent.add(itemMesh);

  powerups.push({
    type: isMagnet ? 'magnet' : 'superjump',
    x: x,
    z: worldZ,
    y: 1.2,
    mesh: itemMesh,
    collected: false
  });
}

// 5. GERAÇÃO PROCEDURAL DE TEXTURAS NÍTIDAS (CANVAS TEXTURES)
function createCLTTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 340;
  const ctx = canvas.getContext('2d');

  // Capa Azul da CTPS
  ctx.fillStyle = '#0f3a68';
  ctx.fillRect(0, 0, 512, 340);

  // Moldura Dourada
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 12;
  ctx.strokeRect(16, 16, 480, 308);

  // Brasão e Letreiros
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('REPÚBLICA FEDERATIVA DO BRASIL', 256, 60);

  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('CARTEIRA DE TRABALHO', 256, 130);
  ctx.fillText('E PREVIDÊNCIA SOCIAL', 256, 175);

  ctx.fillStyle = '#ff4d4d';
  ctx.font = '900 48px Bangers, sans-serif';
  ctx.fillText('⚠️ CLT 44H SEMANAIS!', 256, 260);

  return new THREE.CanvasTexture(canvas);
}

function createBolsaFamiliaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 320;
  const ctx = canvas.getContext('2d');

  // Gradiente Amarelo e Verde
  const grad = ctx.createLinearGradient(0, 0, 512, 320);
  grad.addColorStop(0, '#facc15');
  grad.addColorStop(1, '#16a34a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 320);

  // Chip Dourado
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(40, 100, 70, 55);
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 3;
  ctx.strokeRect(40, 100, 70, 55);

  // Logo Bolsa Família
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px Bangers, sans-serif';
  ctx.fillText('BOLSA FAMÍLIA', 140, 140);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('CAIXA ECONÔMICA FEDERAL', 140, 180);

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 32px Bangers, sans-serif';
  ctx.fillText('SAQUE R$ 600,00', 40, 260);

  return new THREE.CanvasTexture(canvas);
}

function createAuxilioTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 320;
  const ctx = canvas.getContext('2d');

  // Gradiente Azul e Amarelo
  const grad = ctx.createLinearGradient(0, 0, 512, 320);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 320);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 50px Bangers, sans-serif';
  ctx.fillText('AUXÍLIO BRASIL', 50, 120);

  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('GOVERNO FEDERAL 🇧🇷', 50, 180);

  ctx.fillStyle = '#1e1b4b';
  ctx.font = 'bold 36px Bangers, sans-serif';
  ctx.fillText('BENEFÍCIO APROVADO!', 50, 260);

  return new THREE.CanvasTexture(canvas);
}

// CONTROLES
function setupControls() {
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    if (!isGameRunning || isGameOver) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); moveLeft(); }
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); moveRight(); }
    else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') { e.preventDefault(); jump(); }
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); slide(); }
  });

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

  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnJump = document.getElementById('btnJump');
  const btnSlide = document.getElementById('btnSlide');

  if (btnLeft) btnLeft.addEventListener('click', () => moveLeft());
  if (btnRight) btnRight.addEventListener('click', () => moveRight());
  if (btnJump) btnJump.addEventListener('click', () => jump());
  if (btnSlide) btnSlide.addEventListener('click', () => slide());
}

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
    jumpVelocity = superJumpActive ? JUMP_FORCE * 1.35 : JUMP_FORCE;
    isSliding = false;
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

// ATUALIZAÇÃO DO PERSONAGEM E FÍSICA
function updateCharacter(dt) {
  if (!character) return;

  // Transição Lateral Rápida e Elástica
  characterX += (targetX - characterX) * (20 * dt);
  character.position.x = characterX;

  const laneDelta = targetX - characterX;
  character.rotation.z = -laneDelta * 0.14;

  // Pulo
  if (isJumping) {
    characterY += jumpVelocity * dt * 3.8;
    jumpVelocity += GRAVITY * dt * 60;

    if (characterY <= 0) {
      characterY = 0;
      isJumping = false;
      jumpVelocity = 0;
    }
  }

  // Slide
  if (isSliding) {
    slideTimer -= dt;
    if (slideTimer <= 0) isSliding = false;
  }

  if (isSliding) {
    character.scale.set(1.0, 0.42, 1.35);
    character.position.y = 0.22;
  } else {
    character.scale.set(1.0, 1.0, 1.0);
    character.position.y = characterY;
  }

  // Animação de Passadas e Balanço de Braços
  animTime += dt * (speed * 0.4);
  const legSwing = Math.sin(animTime) * 0.85;
  const armSwing = Math.sin(animTime) * 0.75;

  if (!isJumping && !isSliding) {
    leftLeg.rotation.x = legSwing;
    rightLeg.rotation.x = -legSwing;
    leftArm.rotation.x = -armSwing;
    rightArm.rotation.x = armSwing;
    headMesh.rotation.y = Math.sin(animTime * 0.5) * 0.06;
  } else if (isJumping) {
    leftLeg.rotation.x = -0.5;
    rightLeg.rotation.x = -0.6;
    leftArm.rotation.x = 0.8;
    rightArm.rotation.x = 0.8;
  } else if (isSliding) {
    leftLeg.rotation.x = 0.95;
    rightLeg.rotation.x = 0.95;
    leftArm.rotation.x = -0.8;
    rightArm.rotation.x = -0.8;
  }

  // Atualização dos Timers de Power-up
  if (magnetActive) {
    magnetTimer -= dt;
    if (magnetTimer <= 0) magnetActive = false;
  }
  if (superJumpActive) {
    superJumpTimer -= dt;
    if (superJumpTimer <= 0) superJumpActive = false;
  }
}

// COLISÕES PRECISAS
function checkCollisions() {
  const playerX = characterX;
  const playerY = isSliding ? 0.35 : characterY + 1.0;
  const playerZ = 0;

  // 1. Obstáculos
  for (const obs of obstacles) {
    const dz = Math.abs(obs.z - playerZ);
    if (dz < (obs.depth / 2 + 0.35)) {
      const dx = Math.abs(obs.x - playerX);
      if (dx < (obs.width / 2 + 0.45)) {
        
        if (obs.canJumpOver && characterY > obs.height) continue;
        if (obs.canSlideUnder && isSliding) continue;

        triggerGameOver(obs);
        return;
      }
    }
  }

  // 2. Moedas e Picanhas
  for (const item of coins) {
    if (item.collected) continue;

    // Efeito de Ímã de Moedas
    if (magnetActive) {
      item.x += (playerX - item.x) * 0.25;
      item.y += (playerY - item.y) * 0.25;
    }

    const dz = Math.abs(item.z - playerZ);
    if (dz < 1.3) {
      const dx = Math.abs(item.x - playerX);
      if (dx < 1.2) {
        item.collected = true;
        item.mesh.visible = false;

        if (item.type === 'picanha') {
          picanhasCollected++;
          coinsCollected += item.value;
          try { sounds.playBriefcase(); } catch(e){}
        } else {
          coinsCollected += item.value;
          try { sounds.playCoin(); } catch(e){}
        }
        updateHUD();
      }
    }
  }

  // 3. Power-ups
  for (const p of powerups) {
    if (p.collected) continue;
    const dz = Math.abs(p.z - playerZ);
    if (dz < 1.3 && Math.abs(p.x - playerX) < 1.2) {
      p.collected = true;
      p.mesh.visible = false;
      try { sounds.playPowerup(); } catch(e){}

      if (p.type === 'magnet') {
        magnetActive = true;
        magnetTimer = 8.0;
      } else if (p.type === 'superjump') {
        superJumpActive = true;
        superJumpTimer = 10.0;
      }
    }
  }
}

// GAME OVER
function triggerGameOver(obstacle) {
  isGameOver = true;
  isGameRunning = false;
  try { sounds.playGameOver(); } catch(e){}
  try { sounds.stopAmbienceCity(); } catch(e){}

  const finalDistanceKm = Math.floor(distanceTraveled / 10);
  if (finalDistanceKm > bestDistance) {
    bestDistance = finalDistanceKm;
    localStorage.setItem('run_best', bestDistance.toString());
  }

  try { auth.updateUserScore('runner', finalDistanceKm); } catch(e){}
  savePlayerScore('runner', finalDistanceKm, finalDistanceKm);

  const modal = document.getElementById('gameOverModal');
  const goTitle = document.getElementById('goTitle');
  const goMessage = document.getElementById('goMessage');
  const goDistance = document.getElementById('goDistance');

  if (modal) {
    if (goTitle) goTitle.textContent = obstacle.name || 'OBSTÁCULO';
    if (goMessage) goMessage.textContent = `Você foi pego por: ${obstacle.name}!\nFuja da CLT, Bolsa Família e pegue todas as picanhas!`;
    if (goDistance) goDistance.textContent = `${finalDistanceKm} KM · R$ ${coinsCollected} LUCRO · 🥩 ${picanhasCollected} PICANHAS`;
    modal.style.display = 'flex';
  }
}

export function restart3DGame() {
  isGameOver = false;
  isGameRunning = true;
  distanceTraveled = 0;
  coinsCollected = 0;
  picanhasCollected = 0;
  speed = BASE_SPEED;
  currentLaneIndex = 1;
  targetX = 0;
  characterX = 0;
  characterY = 0;
  isJumping = false;
  isSliding = false;
  magnetActive = false;
  superJumpActive = false;

  const modal = document.getElementById('gameOverModal');
  if (modal) modal.style.display = 'none';

  const startOverlay = document.getElementById('startOverlay');
  if (startOverlay) startOverlay.style.display = 'none';

  for (const seg of roadSegments) scene.remove(seg);
  roadSegments = [];
  obstacles = [];
  coins = [];
  powerups = [];
  movingTrains = [];
  buildInitialTrack();

  try { sounds.startAmbienceCity(); } catch(e){}
  updateHUD();
}

function updateHUD() {
  const distEl = document.getElementById('distDisplay');
  const bestEl = document.getElementById('bestDisplay');
  const speedEl = document.getElementById('speedDisplay');

  const distKm = Math.floor(distanceTraveled / 10);
  if (distEl) distEl.textContent = `${distKm} km`;
  if (bestEl) bestEl.textContent = `${bestDistance} km`;
  if (speedEl) speedEl.textContent = `${(speed / BASE_SPEED).toFixed(1)}x`;
}

function onWindowResize() {
  const container = document.getElementById('canvasContainer');
  if (!container || !renderer || !camera) return;

  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// LOOP PRINCIPAL DE RENDERIZAÇÃO
function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);

  if (isGameRunning && !isGameOver) {
    distanceTraveled += speed * dt;
    if (speed < MAX_SPEED) speed += 0.5 * dt;

    const moveZ = speed * dt;

    // Movimentação dos Segmentos
    for (const seg of roadSegments) seg.position.z += moveZ;
    for (const obs of obstacles) {
      obs.z += moveZ;
      // Trens em Movimento vindo na direção oposta!
      if (obs.isMoving) {
        obs.z += obs.trainSpeed * dt;
        if (obs.mesh) obs.mesh.position.z += obs.trainSpeed * dt;
      }
    }

    for (const coin of coins) {
      coin.z += moveZ;
      if (coin.mesh) coin.mesh.rotation.z += 4.0 * dt;
    }

    for (const p of powerups) {
      p.z += moveZ;
      if (p.mesh) {
        p.mesh.rotation.y += 3.0 * dt;
        p.mesh.rotation.x += 2.0 * dt;
      }
    }

    // Reciclagem de Segmentos
    const firstSeg = roadSegments[0];
    if (firstSeg && firstSeg.position.z > SEGMENT_LENGTH) {
      scene.remove(firstSeg);
      roadSegments.shift();

      obstacles = obstacles.filter(o => o.z < 30);
      coins = coins.filter(c => c.z < 30);
      powerups = powerups.filter(p => p.z < 30);

      const lastSeg = roadSegments[roadSegments.length - 1];
      const newZ = lastSeg.position.z - SEGMENT_LENGTH;
      const newSeg = createFavelaSegment(newZ, true);
      roadSegments.push(newSeg);
      scene.add(newSeg);
    }

    updateCharacter(dt);
    checkCollisions();
    updateHUD();

    camera.fov = 65 + (speed - BASE_SPEED) * 0.16;
    camera.position.x = characterX * 0.35;
    camera.updateProjectionMatrix();
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
