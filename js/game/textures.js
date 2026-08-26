// js/game/textures.js — Atlas de Texturas Urbanas, Documentos Brasileiros Realistas e Panorama Parallax da Favela
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

class TextureAtlasManager {
  constructor() {
    this.atlasTexture = null;
    this.waterTankTexture = null;
    this.cltTexture = null;
    this.bolsaFamiliaTexture = null;
    this.auxilioTexture = null;
    this.morroParallaxTexture = null;
    this.goldCoinTexture = null;
    this.softShadowTexture = null;

    // Texturas de Alta Definição dos Trens de Metrô
    this.trainSideRio = null;
    this.trainSideSP = null;
    this.trainSideBR = null;
    this.trainFrontRio = null;
    this.trainFrontSP = null;
    this.trainFrontBR = null;
    this.trainRoof = null;
    this.trainRamp = null;

    // Texturas Realistas da Favela Brasileira e Infraestrutura
    this.brickRedTexture = null;
    this.concreteSlabTexture = null;
    this.rebarTexture = null;
    this.facadeWindowTexture = null;
    this.transformerTexture = null;
    this.cableTexture = null;
    this.doorTexture = null;
    this.rollerDoorTexture = null;
    this.corrugatedRoofTexture = null;
    this.stopSignTexture = null;

    // Cenário 2.0 (Fase A) — Comércio Brasileiro, Toldos, Azulejos e Lajes Vivas
    this.commercialSigns = [];
    this.storefrontDisplays = [];
    this.awningTextures = [];
    this.tileFacadeTexture = null;
    this.windowGrilleTexture = null;
    this.modernWindowTexture = null;
    this.dishAntennaTexture = null;

    // Cenário 2.0 (Fase B) — Vegetação Tropical e Veículos Estáticos
    this.palmLeafTexture = null;
    this.bananaLeafTexture = null;
    this.bushFoliageTexture = null;
    this.kombiSideTexture = null;
    this.carDetailsTexture = null;
    this.motoBoxTexture = null;
    this.ivyTexture = null;

    // Cenário 2.0 (Fase C) — Pipas, Churrasqueiras e Vida Urbana
    this.kiteTextures = [];
    this.grillTexture = null;
    this.smokeTexture = null;

    // Cenário 2.0 (Fase D) — Panorama e Horizonte Carioca
    this.morroParallaxTexture = null;

    // Cenário 2.0 (Fase Boss & Satírico) — CTPS Boss, Moeda Estrela e Trens Satíricos
    this.ctpsBossCoverTexture = null;
    this.goldStarCoinTexture = null;
    this.trainLiveryTextures = [];
    this.satiricalNeonSigns = [];

    this.init();
  }

  init() {
    this.createUnifiedAtlas();
    this.createSpecialTextures();
    this.createBrazilianFavelaTextures();
    this.createStopSignTexture();
    this.createMorroParallaxTexture();
    this.createGoldCoinTexture();
    this.createSoftShadowTexture();
    this.createSubwayTrainTextures();
    this.createCity2Textures();
    this.createVegetationAndVehicleTextures();
    this.createNpcAndAtmosphereTextures();
    this.createCtpsBossTextures();
    this.createGoldStarCoinTexture();
    this.createTrainLiveryTextures();
    this.createSatiricalNeonSigns();
    this.createFlyingTaxTextures();
    this.createSubwaySurfersTextures();
  }

  createSoftShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.90)');
    grad.addColorStop(0.25, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    this.softShadowTexture = new THREE.CanvasTexture(canvas);
    this.softShadowTexture.needsUpdate = true;
  }

  /**
   * Gera o Texture Atlas unificado (1024x1024)
   */
  createUnifiedAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1024, 1024);

    this.drawBrickPattern(ctx, 0, 0, 512, 512);
    this.drawWindowsAndDoors(ctx, 512, 0, 512, 512);
    this.drawGraffitiAndWalls(ctx, 0, 512, 512, 512);
    this.drawUrbanPavement(ctx, 512, 512, 512, 512);

    this.atlasTexture = new THREE.CanvasTexture(canvas);
    this.atlasTexture.wrapS = THREE.RepeatWrapping;
    this.atlasTexture.wrapT = THREE.RepeatWrapping;
    this.atlasTexture.needsUpdate = true;
  }

  drawBrickPattern(ctx, ox, oy, w, h) {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(ox, oy, w, h);

    ctx.fillStyle = '#78350f';
    const rows = 32;
    const rowH = h / rows;
    const brickW = 32;

    for (let r = 0; r < rows; r++) {
      const y = oy + r * rowH;
      ctx.fillRect(ox, y, w, 2);

      const offset = (r % 2) * (brickW / 2);
      for (let x = ox + offset; x < ox + w; x += brickW) {
        ctx.fillRect(x, y, 2, rowH);
      }
    }

    ctx.fillStyle = 'rgba(234, 88, 12, 0.35)';
    for (let i = 0; i < 40; i++) {
      const rx = ox + Math.floor(Math.random() * (w - 30));
      const ry = oy + Math.floor(Math.random() * (h - rowH));
      ctx.fillRect(rx, ry, 28, rowH - 2);
    }
  }

  drawWindowsAndDoors(ctx, ox, oy, w, h) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(ox, oy, w, h);

    // Janela 1
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 40, oy + 40, 180, 180);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 12;
    ctx.strokeRect(ox + 40, oy + 40, 180, 180);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(ox + 50, oy + 50, 75, 160);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(ox + 135, oy + 50, 75, 160);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(ox + 50, oy + 50, 40, 70);

    // Janela 2
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ox + 290, oy + 40, 180, 180);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 8;
    ctx.strokeRect(ox + 290, oy + 40, 180, 180);
    ctx.lineWidth = 4;
    for (let gx = ox + 320; gx < ox + 460; gx += 30) {
      ctx.beginPath();
      ctx.moveTo(gx, oy + 40);
      ctx.lineTo(gx, oy + 220);
      ctx.stroke();
    }

    // Porta 1
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(ox + 50, oy + 270, 160, 220);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 6;
    ctx.strokeRect(ox + 50, oy + 270, 160, 220);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(ox + 190, oy + 380, 8, 0, Math.PI * 2);
    ctx.fill();

    // Porta 2
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(ox + 290, oy + 270, 160, 220);
    ctx.fillStyle = '#115e59';
    for (let py = oy + 280; py < oy + 480; py += 16) {
      ctx.fillRect(ox + 295, py, 150, 4);
    }
  }

  drawGraffitiAndWalls(ctx, ox, oy, w, h) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(ox, oy, w, h);

    ctx.font = '900 64px Bangers, sans-serif';
    ctx.fillStyle = '#ec4899';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText('⚡ CRIAS ⚡', ox + 80, oy + 120);
    ctx.fillText('⚡ CRIAS ⚡', ox + 80, oy + 120);

    ctx.font = '900 56px Bangers, sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.strokeText('🕊️ PAZ & AMOR', ox + 50, oy + 240);
    ctx.fillText('🕊️ PAZ & AMOR', ox + 50, oy + 240);

    ctx.font = '900 58px Bangers, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.strokeText('🇧🇷 BRASIL 100%', ox + 60, oy + 360);
    ctx.fillText('🇧🇷 BRASIL 100%', ox + 60, oy + 360);

    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('RUA É NÓIS ★ 2026', ox + 70, oy + 460);
  }

  drawUrbanPavement(ctx, ox, oy, w, h) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox, oy, w / 2, h);

    ctx.fillStyle = '#334155';
    for (let i = 0; i < 400; i++) {
      const px = ox + Math.random() * (w / 2);
      const py = oy + Math.random() * h;
      ctx.fillRect(px, py, 2, 2);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(ox + w / 2, oy, w / 2, h);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    for (let cy = oy; cy < oy + h; cy += 64) {
      ctx.beginPath();
      ctx.moveTo(ox + w / 2, cy);
      ctx.lineTo(ox + w, cy);
      ctx.stroke();
    }
  }

  /**
   * Textura da Moeda de Ouro com Alto Brilho (Garante que nunca renderize preta)
   */
  createGoldCoinTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0.0, '#ffffff');
    grad.addColorStop(0.2, '#fef08a');
    grad.addColorStop(0.5, '#facc15');
    grad.addColorStop(0.85, '#eab308');
    grad.addColorStop(1.0, '#a16207');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.fillStyle = '#713f12';
    ctx.font = '900 110px Bangers, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R$', 128, 130);

    this.goldCoinTexture = new THREE.CanvasTexture(canvas);
  }

  /**
   * Texturas Realistas para Documentos e Cartões Brasileiros (Plano com UV mapping)
   */
  createSpecialTextures() {
    // 1. Caixa d'água Fortlev
    const tankCanvas = document.createElement('canvas');
    tankCanvas.width = 256; tankCanvas.height = 256;
    const tCtx = tankCanvas.getContext('2d');
    tCtx.fillStyle = '#0284c7';
    tCtx.fillRect(0, 0, 256, 256);
    tCtx.fillStyle = '#0369a1';
    tCtx.fillRect(0, 40, 256, 14);
    tCtx.fillRect(0, 120, 256, 14);
    tCtx.fillRect(0, 200, 256, 14);
    tCtx.fillStyle = '#ffffff';
    tCtx.font = '900 32px sans-serif';
    tCtx.textAlign = 'center';
    tCtx.fillText('FORTLEV 500L', 128, 90);
    this.waterTankTexture = new THREE.CanvasTexture(tankCanvas);

    // 2. Carteira de Trabalho CLT (Card Realista)
    const cltCanvas = document.createElement('canvas');
    cltCanvas.width = 512; cltCanvas.height = 360;
    const cltCtx = cltCanvas.getContext('2d');

    cltCtx.fillStyle = '#0a2540'; // Azul Marinho Oficial
    cltCtx.fillRect(0, 0, 512, 360);

    cltCtx.strokeStyle = '#d4af37';
    cltCtx.lineWidth = 14;
    cltCtx.strokeRect(14, 14, 484, 332);

    // Brasão
    cltCtx.fillStyle = '#ffd700';
    cltCtx.beginPath();
    cltCtx.arc(256, 85, 36, 0, Math.PI * 2);
    cltCtx.fill();
    cltCtx.fillStyle = '#0a2540';
    cltCtx.font = 'bold 24px sans-serif';
    cltCtx.textAlign = 'center';
    cltCtx.fillText('★', 256, 94);

    cltCtx.fillStyle = '#ffffff';
    cltCtx.font = 'bold 22px sans-serif';
    cltCtx.fillText('REPÚBLICA FEDERATIVA DO BRASIL', 256, 145);

    cltCtx.font = '900 34px Bangers, sans-serif';
    cltCtx.fillStyle = '#ffd700';
    cltCtx.fillText('CARTEIRA DE TRABALHO', 256, 195);
    cltCtx.fillText('E PREVIDÊNCIA SOCIAL', 256, 235);

    cltCtx.fillStyle = '#ef4444';
    cltCtx.font = '900 36px Bangers, sans-serif';
    cltCtx.fillText('⚠️ ESCALA 6x1 / 44H ⚠️', 256, 305);
    this.cltTexture = new THREE.CanvasTexture(cltCanvas);

    // 3. Cartão Bolsa Família (Card Realista)
    const bfCanvas = document.createElement('canvas');
    bfCanvas.width = 512; bfCanvas.height = 320;
    const bfCtx = bfCanvas.getContext('2d');

    const gradBf = bfCtx.createLinearGradient(0, 0, 512, 320);
    gradBf.addColorStop(0.0, '#facc15');
    gradBf.addColorStop(0.5, '#eab308');
    gradBf.addColorStop(1.0, '#16a34a');
    bfCtx.fillStyle = gradBf;
    bfCtx.fillRect(0, 0, 512, 320);

    // Chip EMV Dourado
    bfCtx.fillStyle = '#d4af37';
    bfCtx.fillRect(45, 95, 80, 60);
    bfCtx.strokeStyle = '#78350f'; bfCtx.lineWidth = 3;
    bfCtx.strokeRect(45, 95, 80, 60);
    bfCtx.beginPath();
    bfCtx.moveTo(45, 125); bfCtx.lineTo(125, 125);
    bfCtx.moveTo(85, 95); bfCtx.lineTo(85, 155);
    bfCtx.stroke();

    bfCtx.fillStyle = '#ffffff';
    bfCtx.font = '900 52px Bangers, sans-serif';
    bfCtx.textAlign = 'left';
    bfCtx.fillText('BOLSA FAMÍLIA', 150, 115);

    bfCtx.fillStyle = '#0f172a';
    bfCtx.font = 'bold 24px sans-serif';
    bfCtx.fillText('CAIXA ECONÔMICA FEDERAL', 150, 155);

    bfCtx.fillStyle = '#dc2626';
    bfCtx.font = '900 38px Bangers, sans-serif';
    bfCtx.fillText('SAQUE R$ 600,00 🥩', 45, 250);

    bfCtx.fillStyle = '#1e3a8a';
    bfCtx.font = 'bold 22px monospace';
    bfCtx.fillText('•••• •••• •••• 2026', 45, 290);
    this.bolsaFamiliaTexture = new THREE.CanvasTexture(bfCanvas);

    // 4. Cartão Auxílio Brasil
    const auxCanvas = document.createElement('canvas');
    auxCanvas.width = 512; auxCanvas.height = 320;
    const auxCtx = auxCanvas.getContext('2d');

    const gradAux = auxCtx.createLinearGradient(0, 0, 512, 320);
    gradAux.addColorStop(0.0, '#0284c7');
    gradAux.addColorStop(0.6, '#0369a1');
    gradAux.addColorStop(1.0, '#f59e0b');
    auxCtx.fillStyle = gradAux;
    auxCtx.fillRect(0, 0, 512, 320);

    // Chip
    auxCtx.fillStyle = '#d4af37';
    auxCtx.fillRect(45, 95, 80, 60);
    auxCtx.strokeStyle = '#78350f'; auxCtx.lineWidth = 3;
    auxCtx.strokeRect(45, 95, 80, 60);

    auxCtx.fillStyle = '#ffffff';
    auxCtx.font = '900 54px Bangers, sans-serif';
    auxCtx.textAlign = 'left';
    auxCtx.fillText('AUXÍLIO BRASIL', 150, 115);

    auxCtx.fillStyle = '#fef08a';
    auxCtx.font = 'bold 24px sans-serif';
    auxCtx.fillText('GOVERNO FEDERAL 🇧🇷', 150, 155);

    auxCtx.fillStyle = '#1e1b4b';
    auxCtx.font = '900 38px Bangers, sans-serif';
    auxCtx.fillText('BENEFÍCIO APROVADO!', 45, 250);
    this.auxilioTexture = new THREE.CanvasTexture(auxCanvas);
  }

  /**
   * Texturas Realistas Brasileiras: Tijolo Baiano, Concreto de Laje, Vergalhões de Espera e Transformadores
   */
  createBrazilianFavelaTextures() {
    // 1. Tijolo Baiano Cerâmico Furado com Ranhuras (512x512)
    const brickCanvas = document.createElement('canvas');
    brickCanvas.width = 512;
    brickCanvas.height = 512;
    const bCtx = brickCanvas.getContext('2d');

    // Fundo de argamassa cinza
    bCtx.fillStyle = '#64748b';
    bCtx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const rowH = 512 / rows;
    const brickW = 64;

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const offset = (r % 2) * (brickW / 2);

      for (let x = -brickW; x < 512 + brickW; x += brickW) {
        const bx = x + offset;
        const by = y + 2;
        const bw = brickW - 4;
        const bh = rowH - 4;

        // Variação de tons cerâmicos brasileiros (terracota / laranja queimado)
        const toneVar = ((r * 7 + x * 13) % 5);
        const brickColors = ['#c2410c', '#ea580c', '#9a3412', '#b45309', '#d97706'];
        bCtx.fillStyle = brickColors[toneVar];
        bCtx.fillRect(bx, by, bw, bh);

        // Ranhuras horizontais do tijolo baiano
        bCtx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        bCtx.fillRect(bx, by + bh * 0.33, bw, 2);
        bCtx.fillRect(bx, by + bh * 0.66, bw, 2);

        // Furos decorativos visíveis na textura
        bCtx.fillStyle = 'rgba(67, 20, 7, 0.45)';
        bCtx.fillRect(bx + 4, by + 4, bw - 8, 3);
        bCtx.fillRect(bx + 4, by + bh - 7, bw - 8, 3);
      }
    }

    this.brickRedTexture = new THREE.CanvasTexture(brickCanvas);
    this.brickRedTexture.wrapS = THREE.RepeatWrapping;
    this.brickRedTexture.wrapT = THREE.RepeatWrapping;
    this.brickRedTexture.repeat.set(2, 2);
    this.brickRedTexture.needsUpdate = true;

    // 2. Concreto de Laje com Marcas de Fôrma de Madeira (256x256)
    const slabCanvas = document.createElement('canvas');
    slabCanvas.width = 256;
    slabCanvas.height = 256;
    const sCtx = slabCanvas.getContext('2d');

    sCtx.fillStyle = '#94a3b8';
    sCtx.fillRect(0, 0, 256, 256);

    // Linhas de tábua de fôrma
    sCtx.fillStyle = '#64748b';
    for (let y = 0; y < 256; y += 32) {
      sCtx.fillRect(0, y, 256, 2);
    }
    // Grãos de brita e areia
    for (let i = 0; i < 120; i++) {
      const gx = (i * 37) % 256;
      const gy = (i * 59) % 256;
      sCtx.fillStyle = (i % 2 === 0) ? 'rgba(51, 65, 85, 0.35)' : 'rgba(241, 245, 249, 0.4)';
      sCtx.fillRect(gx, gy, 3, 3);
    }

    this.concreteSlabTexture = new THREE.CanvasTexture(slabCanvas);
    this.concreteSlabTexture.wrapS = THREE.RepeatWrapping;
    this.concreteSlabTexture.wrapT = THREE.RepeatWrapping;
    this.concreteSlabTexture.needsUpdate = true;

    // 3. Vergalhão de Aço Nervurado / Ferro de Construção (128x128)
    const rebarCanvas = document.createElement('canvas');
    rebarCanvas.width = 128;
    rebarCanvas.height = 128;
    const rCtx = rebarCanvas.getContext('2d');

    rCtx.fillStyle = '#9a3412';
    rCtx.fillRect(0, 0, 128, 128);
    rCtx.strokeStyle = '#451a03';
    rCtx.lineWidth = 4;

    for (let y = -20; y < 150; y += 12) {
      rCtx.beginPath();
      rCtx.moveTo(0, y);
      rCtx.lineTo(128, y + 16);
      rCtx.stroke();
    }

    this.rebarTexture = new THREE.CanvasTexture(rebarCanvas);
    this.rebarTexture.wrapS = THREE.RepeatWrapping;
    this.rebarTexture.wrapT = THREE.RepeatWrapping;
    this.rebarTexture.needsUpdate = true;

    // 4. Janela Residencial com Venezianas e Reflexo (256x256)
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 256;
    winCanvas.height = 256;
    const wCtx = winCanvas.getContext('2d');

    // Moldura de alumínio
    wCtx.fillStyle = '#334155';
    wCtx.fillRect(0, 0, 256, 256);
    wCtx.fillStyle = '#0f172a';
    wCtx.fillRect(8, 8, 240, 240);

    // Folha esquerda: Vidro com reflexo
    const vGrad = wCtx.createLinearGradient(12, 12, 120, 244);
    vGrad.addColorStop(0.0, '#38bdf8');
    vGrad.addColorStop(0.4, '#0284c7');
    vGrad.addColorStop(1.0, '#0369a1');
    wCtx.fillStyle = vGrad;
    wCtx.fillRect(12, 12, 110, 232);

    // Reflexo de luz na diagonal
    wCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    wCtx.beginPath();
    wCtx.moveTo(12, 12);
    wCtx.lineTo(65, 12);
    wCtx.lineTo(12, 65);
    wCtx.fill();

    // Folha direita: Venezianas de alumínio / ventilação
    wCtx.fillStyle = '#475569';
    wCtx.fillRect(130, 12, 114, 232);
    wCtx.fillStyle = '#1e293b';
    for (let vy = 20; vy < 240; vy += 14) {
      wCtx.fillRect(134, vy, 106, 6);
    }

    this.facadeWindowTexture = new THREE.CanvasTexture(winCanvas);
    this.facadeWindowTexture.needsUpdate = true;

    // 5. Transformador Elétrico de Poste (256x256)
    const transCanvas = document.createElement('canvas');
    transCanvas.width = 256;
    transCanvas.height = 256;
    const trCtx = transCanvas.getContext('2d');

    trCtx.fillStyle = '#64748b';
    trCtx.fillRect(0, 0, 256, 256);

    // Aletas de resfriamento verticais
    trCtx.fillStyle = '#334155';
    for (let x = 16; x < 240; x += 18) {
      trCtx.fillRect(x, 20, 8, 216);
    }

    // Placa de advertência amarela
    trCtx.fillStyle = '#facc15';
    trCtx.fillRect(78, 90, 100, 65);
    trCtx.strokeStyle = '#000000';
    trCtx.lineWidth = 4;
    trCtx.strokeRect(78, 90, 100, 65);

    trCtx.fillStyle = '#000000';
    trCtx.font = 'bold 16px sans-serif';
    trCtx.textAlign = 'center';
    trCtx.fillText('PERIGO', 128, 115);
    trCtx.font = '900 13px sans-serif';
    trCtx.fillText('ALTA TENSÃO', 128, 138);

    this.transformerTexture = new THREE.CanvasTexture(transCanvas);
    this.transformerTexture.needsUpdate = true;

    // 6. Porta Residencial Brasileira de Madeira com Almofadas (256x256)
    const doorCanvas = document.createElement('canvas');
    doorCanvas.width = 256;
    doorCanvas.height = 256;
    const dCtx = doorCanvas.getContext('2d');

    dCtx.fillStyle = '#7c2d12'; // Madeira Nobre
    dCtx.fillRect(0, 0, 256, 256);
    dCtx.strokeStyle = '#451a03';
    dCtx.lineWidth = 10;
    dCtx.strokeRect(0, 0, 256, 256);

    // Almofadas em relevo
    const panels = [[24, 20, 208, 96], [24, 136, 208, 100]];
    panels.forEach(([px, py, pw, ph]) => {
      dCtx.fillStyle = '#9a3412';
      dCtx.fillRect(px, py, pw, ph);
      dCtx.strokeStyle = '#451a03';
      dCtx.lineWidth = 4;
      dCtx.strokeRect(px, py, pw, ph);
    });

    // Maçaneta dourada
    dCtx.fillStyle = '#facc15';
    dCtx.beginPath();
    dCtx.arc(42, 132, 10, 0, Math.PI * 2);
    dCtx.fill();
    dCtx.fillStyle = '#713f12';
    dCtx.fillRect(38, 138, 8, 16);

    this.doorTexture = new THREE.CanvasTexture(doorCanvas);
    this.doorTexture.needsUpdate = true;

    // 7. Porta Comercial de Enrolar de Aço Ondulado (Boteco / Barbearia) (256x256)
    const rollerCanvas = document.createElement('canvas');
    rollerCanvas.width = 256;
    rollerCanvas.height = 256;
    const rlCtx = rollerCanvas.getContext('2d');

    rlCtx.fillStyle = '#475569';
    rlCtx.fillRect(0, 0, 256, 256);

    // Lâminas horizontais de aço galvanizado
    for (let y = 0; y < 256; y += 14) {
      rlCtx.fillStyle = (Math.floor(y / 14) % 2 === 0) ? '#64748b' : '#334155';
      rlCtx.fillRect(0, y, 256, 12);
      rlCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      rlCtx.fillRect(0, y, 256, 2);
    }
    // Cadeado central na base
    rlCtx.fillStyle = '#eab308';
    rlCtx.fillRect(118, 224, 20, 24);

    this.rollerDoorTexture = new THREE.CanvasTexture(rollerCanvas);
    this.rollerDoorTexture.needsUpdate = true;

    // 8. Telhado Ondulado de Telha Cerâmica / Fibrocimento (256x256)
    const roofCanvas = document.createElement('canvas');
    roofCanvas.width = 256;
    roofCanvas.height = 256;
    const rfCtx = roofCanvas.getContext('2d');

    rfCtx.fillStyle = '#9a3412';
    rfCtx.fillRect(0, 0, 256, 256);

    for (let x = 0; x < 256; x += 16) {
      const grad = rfCtx.createLinearGradient(x, 0, x + 16, 0);
      grad.addColorStop(0.0, '#7c2d12');
      grad.addColorStop(0.5, '#ea580c');
      grad.addColorStop(1.0, '#451a03');
      rfCtx.fillStyle = grad;
      rfCtx.fillRect(x, 0, 16, 256);
    }

    this.corrugatedRoofTexture = new THREE.CanvasTexture(roofCanvas);
    this.corrugatedRoofTexture.wrapS = THREE.RepeatWrapping;
    this.corrugatedRoofTexture.wrapT = THREE.RepeatWrapping;
    this.corrugatedRoofTexture.repeat.set(3, 3);
    this.corrugatedRoofTexture.needsUpdate = true;
  }

  /**
   * Textura da Placa "🛑 STOP / PARE" com Faixas Zebradas Reflexivas e LEDs de Alerta
   */
  createStopSignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 1. Fundo com Faixas Zebradas Reflexivas Amarelas e Pretas
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#0f172a';
    const stripeW = 32;
    for (let x = -256; x < 768; x += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeW, 0);
      ctx.lineTo(x + stripeW - 50, 256);
      ctx.lineTo(x - 50, 256);
      ctx.closePath();
      ctx.fill();
    }

    // Moldura preta grossa
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 14;
    ctx.strokeRect(0, 0, 512, 256);

    // 2. Placa Central Octogonal Vermelha de "PARE / STOP"
    const cx = 256;
    const cy = 128;
    const r = 90;

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + Math.PI / 8;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // Borda Branca Grossa do Octógono
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Borda Interna Escura
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // 3. Texto "PARE" em Tipografia Bold Branca
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 8;
    ctx.font = '900 56px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('PARE', cx, cy);
    ctx.fillText('PARE', cx, cy);

    // 4. Lâmpadas LED de Alerta nos 4 Cantos
    const corners = [[36, 36], [476, 36], [36, 220], [476, 220]];
    corners.forEach(([lx, ly]) => {
      const grad = ctx.createRadialGradient(lx, ly, 4, lx, ly, 22);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#eab308');
      grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx, ly, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    this.stopSignTexture = new THREE.CanvasTexture(canvas);
    this.stopSignTexture.needsUpdate = true;
  }

  /**
   * Panorama Parallax Densa da Favela Carioca (Morro densamente povoado com casinhas empilhadas)
   */
  createMorroParallaxTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 1024, 512);

    // Morro Verde Silhueta ao Fundo
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.quadraticCurveTo(256, 120, 512, 220);
    ctx.quadraticCurveTo(768, 80, 1024, 300);
    ctx.lineTo(1024, 512);
    ctx.closePath();
    ctx.fill();

    // Centenas de Casinhas Coloridas Empilhadas na Encosta da Favela
    const houseColors = ['#b45309', '#ea580c', '#facc15', '#0284c7', '#16a34a', '#db2777', '#78716c', '#f97316'];

    for (let x = 10; x < 1010; x += 18) {
      const hillTopY = (x < 512) ? (320 - (x / 512) * 140) : (180 + ((x - 512) / 512) * 120);
      const startY = Math.max(160, hillTopY + Math.random() * 40);

      for (let y = startY; y < 510; y += 24) {
        const w = 16 + Math.random() * 12;
        const h = 20 + Math.random() * 16;
        const col = houseColors[Math.floor(Math.random() * houseColors.length)];

        ctx.fillStyle = col;
        ctx.fillRect(x, y, w, h);

        // Janelinhas iluminadas na favela
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x + 3, y + 4, 4, 5);
        ctx.fillRect(x + w - 7, y + 4, 4, 5);

        // Caixinha d'água azul no topo
        if (Math.random() > 0.6) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(x + w / 4, y - 5, 8, 6);
        }
      }
    }

    this.morroParallaxTexture = new THREE.CanvasTexture(canvas);
    this.morroParallaxTexture.wrapS = THREE.RepeatWrapping;
    this.morroParallaxTexture.wrapT = THREE.ClampToEdgeWrapping;
  }

  /**
   * Gera Texturas Procedurais de Alta Fidelidade para os Trens 3D (Subway Surfers)
   */
  createSubwayTrainTextures() {
    // 1. Texturas Laterais dos Vagões (Aço Escovado, Portas Automáticas, Janelas Iluminadas e Pinturas Oficiais)
    const createSideCanvas = (theme) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Fundo Base: Aço Inoxidável Escovado Metálico
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
      if (theme.id === 'br') {
        bgGrad.addColorStop(0, '#1e293b');
        bgGrad.addColorStop(0.3, '#334155');
        bgGrad.addColorStop(0.7, '#1e293b');
        bgGrad.addColorStop(1, '#0f172a');
      } else {
        bgGrad.addColorStop(0, '#94a3b8');
        bgGrad.addColorStop(0.2, '#cbd5e1');
        bgGrad.addColorStop(0.5, '#e2e8f0');
        bgGrad.addColorStop(0.8, '#cbd5e1');
        bgGrad.addColorStop(1, '#64748b');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 256);

      // Micro-ranhuras de Aço Escovado
      ctx.fillStyle = theme.id === 'br' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
      for (let y = 0; y < 256; y += 4) {
        ctx.fillRect(0, y, 1024, 1);
      }

      // Faixas de Pintura Aerodinâmicas Superiores e Inferiores
      ctx.fillStyle = theme.stripePrimary;
      ctx.fillRect(0, 16, 1024, 28);
      ctx.fillRect(0, 196, 1024, 38);

      ctx.fillStyle = theme.stripeSecondary;
      ctx.fillRect(0, 44, 1024, 10);
      ctx.fillRect(0, 184, 1024, 12);

      ctx.fillStyle = theme.stripeAccent || '#ffffff';
      ctx.fillRect(0, 54, 1024, 4);
      ctx.fillRect(0, 178, 1024, 6);

      // 4 Portas Automáticas Duplas Deslizantes com Avisos de Segurança
      const doorPositions = [80, 320, 580, 820];
      doorPositions.forEach(dx => {
        // Moldura da Porta
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(dx, 36, 110, 180);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.strokeRect(dx, 36, 110, 180);

        // Folhas da Porta Dupla
        ctx.fillStyle = theme.doorColor || '#64748b';
        ctx.fillRect(dx + 4, 40, 48, 172);
        ctx.fillRect(dx + 58, 40, 48, 172);

        // Vidros das Portas (com iluminação interna suave)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(dx + 10, 52, 36, 68);
        ctx.fillRect(dx + 64, 52, 36, 68);

        ctx.fillStyle = theme.windowGlow || '#fef08a';
        ctx.fillRect(dx + 14, 56, 28, 60);
        ctx.fillRect(dx + 68, 56, 28, 60);

        // Maçanetas / Puxadores Cromados
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dx + 46, 130, 4, 30);
        ctx.fillRect(dx + 60, 130, 4, 30);

        // Faixa Zebrada de Alerta no Rodapé da Porta
        ctx.fillStyle = '#eab308';
        ctx.fillRect(dx + 4, 198, 102, 12);
        ctx.fillStyle = '#000000';
        for (let z = dx + 6; z < dx + 104; z += 12) {
          ctx.beginPath();
          ctx.moveTo(z, 210);
          ctx.lineTo(z + 6, 198);
          ctx.lineTo(z + 10, 198);
          ctx.lineTo(z + 4, 210);
          ctx.fill();
        }
      });

      // 6 Grandes Janelas Panorâmicas de Passageiros
      const winPositions = [205, 445, 705, 945];
      winPositions.forEach(wx => {
        // Moldura em Alumínio Escuro
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(wx, 55, 95, 105);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 4;
        ctx.strokeRect(wx, 55, 95, 105);

        // Vidro Fumê com Reflexo e Brilho Interior dos Passageiros
        const winGrad = ctx.createLinearGradient(wx, 55, wx + 95, 160);
        winGrad.addColorStop(0, '#1e293b');
        winGrad.addColorStop(0.4, theme.windowGlow || '#fef08a');
        winGrad.addColorStop(0.7, '#38bdf8');
        winGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = winGrad;
        ctx.fillRect(wx + 4, 59, 87, 97);

        // Divisória Central da Janela Dupla
        ctx.fillStyle = '#334155';
        ctx.fillRect(wx + 46, 55, 4, 105);

        // Cortina / Silhueta Suave
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.fillRect(wx + 6, 61, 83, 20);
      });

      // Letreiro / Inscrições de Linha do Metrô
      ctx.font = 'bold 24px Bangers, sans-serif';
      ctx.fillStyle = theme.textColor || '#ffffff';
      ctx.fillText(theme.name, 450, 36);

      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#facc15';
      ctx.fillText('VAGÃO 04 • AR-CONDICIONADO ❄️', 690, 36);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      return tex;
    };

    // 2. Texturas Frontais das Cabines dos Trens (Letreiro LED Digital, Para-brisa, Faróis e Grelha)
    const createFrontCanvas = (theme) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Fundo Metálico
      ctx.fillStyle = theme.frontBg || '#0f172a';
      ctx.fillRect(0, 0, 512, 512);

      // Moldura Aerodinâmica da Cabine
      ctx.fillStyle = theme.stripePrimary;
      ctx.fillRect(0, 0, 512, 60);
      ctx.fillRect(0, 380, 512, 132);

      ctx.fillStyle = theme.stripeSecondary;
      ctx.fillRect(0, 60, 512, 16);
      ctx.fillRect(0, 360, 512, 20);

      // Letreiro LED de Destino Digital (Matriz Luminosa)
      ctx.fillStyle = '#000000';
      ctx.fillRect(56, 82, 400, 54);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.strokeRect(56, 82, 400, 54);

      ctx.fillStyle = theme.ledColor || '#facc15';
      ctx.font = '900 32px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(theme.destText, 256, 110);

      // Para-brisa Gigante da Cabine com Reflexo Futurista
      const winGrad = ctx.createLinearGradient(60, 145, 452, 340);
      winGrad.addColorStop(0, '#0284c7');
      winGrad.addColorStop(0.4, '#38bdf8');
      winGrad.addColorStop(0.7, '#0f172a');
      winGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = winGrad;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(50, 145, 412, 195, 20) : ctx.fillRect(50, 145, 412, 195);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Palhetas do Limpador de Para-brisa
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(170, 325); ctx.lineTo(210, 220);
      ctx.moveTo(330, 325); ctx.lineTo(370, 220);
      ctx.stroke();

      // Emblema Central do Metrô
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(256, 400, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', 256, 400);

      // Grelha Inferior e Pára-choque Industrial com Faixas Zebradas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 440, 432, 60);
      ctx.fillStyle = '#facc15';
      for (let x = 40; x < 460; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 500);
        ctx.lineTo(x + 18, 440);
        ctx.lineTo(x + 30, 440);
        ctx.lineTo(x + 12, 500);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      return tex;
    };

    // 3. Textura de Teto Corrugado
    const createRoofCanvas = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, 512, 1024);

      // Nervuras de Alumínio Corrugado
      ctx.fillStyle = '#64748b';
      for (let x = 0; x < 512; x += 16) {
        ctx.fillRect(x, 0, 4, 1024);
      }

      // Passarela Antiderrapante Central (Walkway de Corrida)
      ctx.fillStyle = '#334155';
      ctx.fillRect(160, 0, 192, 1024);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.strokeRect(160, 0, 192, 1024);

      // Textura em Diamante Antiderrapante
      ctx.fillStyle = '#475569';
      for (let y = 10; y < 1024; y += 24) {
        for (let x = 175; x < 340; x += 24) {
          ctx.fillRect(x, y, 10, 10);
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.needsUpdate = true;
      return tex;
    };

    // 4. Textura da Rampa Traseira Antiderrapante com Faixas Zebradas
    const createRampCanvas = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Chapa de Aço Diamantada
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 256, 512);

      // Faixas Diagonais Zebradas de Advertência
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, 0, 256, 512);
      ctx.fillStyle = '#000000';
      for (let y = -256; y < 768; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y + 256);
        ctx.lineTo(256, y + 285);
        ctx.lineTo(0, y + 29);
        ctx.fill();
      }

      // Bordas Metálicas
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, 256, 512);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      return tex;
    };

    // Instanciação das texturas com as três grandes pinturas de trem
    this.trainSideRio = createSideCanvas({
      id: 'rio',
      name: '🚆 METRÔ RIO • LINHA 1',
      stripePrimary: '#0284c7',
      stripeSecondary: '#06b6d4',
      stripeAccent: '#ffdf00',
      doorColor: '#64748b',
      windowGlow: '#fef08a',
      textColor: '#ffffff'
    });

    this.trainSideSP = createSideCanvas({
      id: 'sp',
      name: '🚆 METRÔ SÃO PAULO',
      stripePrimary: '#dc2626',
      stripeSecondary: '#eab308',
      stripeAccent: '#ffffff',
      doorColor: '#475569',
      windowGlow: '#38bdf8',
      textColor: '#ffffff'
    });

    this.trainSideBR = createSideCanvas({
      id: 'br',
      name: '⚡ EXPRESSO BRASIL 3D',
      stripePrimary: '#16a34a',
      stripeSecondary: '#facc15',
      stripeAccent: '#06b6d4',
      doorColor: '#334155',
      windowGlow: '#86efac',
      textColor: '#facc15'
    });

    this.trainFrontRio = createFrontCanvas({
      stripePrimary: '#0284c7',
      stripeSecondary: '#06b6d4',
      destText: '01 CENTRAL DO BRASIL',
      ledColor: '#facc15',
      frontBg: '#0f172a'
    });

    this.trainFrontSP = createFrontCanvas({
      stripePrimary: '#dc2626',
      stripeSecondary: '#eab308',
      destText: '04 ESTAÇÃO DA LUZ',
      ledColor: '#facc15',
      frontBg: '#1e293b'
    });

    this.trainFrontBR = createFrontCanvas({
      stripePrimary: '#16a34a',
      stripeSecondary: '#facc15',
      destText: '99 EXPRESSO FAVELA',
      ledColor: '#38bdf8',
      frontBg: '#0f172a'
    });

    this.trainRoof = createRoofCanvas();
    this.trainRamp = createRampCanvas();
    this.stopSignTexture = this.createStopSignTexture();
  }

  // 5. Textura da Placa de Trânsito Aérea "STOP / PARE" com Faixas Zebradas Reflexivas
  createStopSignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 1. Fundo de Aço Industrial com Faixas Zebradas de Trânsito
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 256);

    // Faixas Zebradas de Perigo (Vermelho Bem Forte Escarlate e Branco)
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#ffffff';
    for (let x = -256; x < 768; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 256, 256);
      ctx.lineTo(x + 280, 256);
      ctx.lineTo(x + 24, 0);
      ctx.fill();
    }

    // Moldura Escura Central para Destaque da Placa
    ctx.fillStyle = '#020617';
    ctx.fillRect(106, 18, 300, 220);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.strokeRect(106, 18, 300, 220);

    // 2. Placa Octogonal em Vermelho Bem Forte / Escarlate Intenso
    const cx = 256;
    const cy = 128;
    const r = 88;

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI / 4) + (Math.PI / 8);
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Sombra 3D da placa
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 18;

    const signGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, r);
    signGrad.addColorStop(0, '#dc2626'); // Vermelho vivo no centro
    signGrad.addColorStop(0.65, '#991b1b'); // Vermelho escuro profundo
    signGrad.addColorStop(1.0, '#7f1d1d'); // Vermelho sangue intenso na borda
    ctx.fillStyle = signGrad;
    ctx.fill();

    // Borda Branca Grossa do Octógono
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 7;
    ctx.stroke();

    // Borda Interna Fina Vermelha Escura
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // 3. Texto "STOP" em Tipografia Bold 3D
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 7;
    ctx.font = '900 52px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('STOP', cx, cy);
    ctx.fillText('STOP', cx, cy);

    // 4. Lâmpadas LED de Alerta nos 4 Cantos
    const corners = [[36, 36], [476, 36], [36, 220], [476, 220]];
    corners.forEach(([lx, ly]) => {
      const grad = ctx.createRadialGradient(lx, ly, 4, lx, ly, 22);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#eab308');
      grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx, ly, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  /**
   * Cenário 2.0 (Fase A) — Comércio Brasileiro, Toldos, Vitrines, Azulejos e Lajes Vivas
   */
  createCity2Textures() {
    this.createCommercialSignTextures();
    this.createAwningTextures();
    this.createStorefrontDisplays();
    this.createTileFacadeTexture();
    this.createWindowGrilleTexture();
    this.createModernWindowTexture();
    this.createDishAntennaTexture();
  }

  createCommercialSignTextures() {
    const signDefs = [
      {
        title: 'MERCADINHO CENTRAL',
        sub: 'HORTIFRUTI • BEBIDAS • MERCEARIA',
        bgCol: '#15803d',
        accentCol: '#fde047',
        textColor: '#ffffff',
        borderCol: '#166534',
        icon: 'fruit'
      },
      {
        title: 'PADARIA & CONFEITARIA',
        sub: 'PÃO QUENTE TODA HORA • CAFÉ & DOCES',
        bgCol: '#78350f',
        accentCol: '#fbbf24',
        textColor: '#fef08a',
        borderCol: '#451a03',
        icon: 'bread'
      },
      {
        title: 'BAR DO ZÉ',
        sub: 'CERVEJA ESTUPIDAMENTE GELADA • PETISCOS',
        bgCol: '#b91c1c',
        accentCol: '#fde047',
        textColor: '#ffffff',
        borderCol: '#7f1d1d',
        icon: 'beer'
      },
      {
        title: 'BARBEARIA NAVALHA DE OURO',
        sub: 'CORTE CLÁSSICO • BARBOTERAPIA • SOCIAL',
        bgCol: '#1e3a8a',
        accentCol: '#38bdf8',
        textColor: '#facc15',
        borderCol: '#172554',
        icon: 'barber'
      },
      {
        title: 'DROGARIA & FARMÁCIA POPULAR',
        sub: 'MEDICAMENTOS • PERFUMARIA • CONVÊNIOS',
        bgCol: '#047857',
        accentCol: '#f8fafc',
        textColor: '#ffffff',
        borderCol: '#064e3b',
        icon: 'cross'
      },
      {
        title: 'LANCHONETE & PASTELARIA',
        sub: 'PASTEL CROCANTE • COXINHA • SUCOS NATURAIS',
        bgCol: '#c2410c',
        accentCol: '#fde047',
        textColor: '#ffffff',
        borderCol: '#7c2d12',
        icon: 'snack'
      },
      {
        title: 'AUTO PEÇAS & OFICINA DO BETO',
        sub: 'MECÂNICA • AUTO ELÉTRICA • PNEUS',
        bgCol: '#0f172a',
        accentCol: '#eab308',
        textColor: '#f8fafc',
        borderCol: '#334155',
        icon: 'gear'
      },
      {
        title: 'BAZAR & PRESENTES DO MORRO',
        sub: 'UTILIDADES • BRINQUEDOS • PAPELARIA',
        bgCol: '#7e22ce',
        accentCol: '#f472b6',
        textColor: '#ffffff',
        borderCol: '#581c87',
        icon: 'star'
      }
    ];

    this.commercialSigns = signDefs.map(def => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      // Fundo com leve gradiente estilizado
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0.0, def.bgCol);
      grad.addColorStop(1.0, def.borderCol);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 128);

      // Moldura externa em relevo
      ctx.strokeStyle = def.accentCol;
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 504, 120);

      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, 492, 108);

      // Friso decorativo nos cantos
      const cornerSize = 14;
      ctx.fillStyle = def.accentCol;
      [[10, 10], [502 - cornerSize, 10], [10, 118 - cornerSize], [502 - cornerSize, 118 - cornerSize]].forEach(([cx, cy]) => {
        ctx.fillRect(cx, cy, cornerSize, cornerSize);
      });

      // Ícone estilizado à esquerda
      ctx.save();
      const ix = 52;
      const iy = 64;

      if (def.icon === 'beer') {
        // Caneco de Chopp com espuma
        ctx.fillStyle = '#facc15';
        ctx.fillRect(ix - 16, iy - 16, 26, 36);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ix - 16, iy - 16, 9, 0, Math.PI * 2);
        ctx.arc(ix - 3, iy - 19, 11, 0, Math.PI * 2);
        ctx.arc(ix + 10, iy - 16, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(ix + 10, iy - 8, 10, 20);
      } else if (def.icon === 'cross') {
        // Cruz médica vermelha sobre círculo branco
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ix, iy, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(ix - 6, iy - 18, 12, 36);
        ctx.fillRect(ix - 18, iy - 6, 36, 12);
      } else if (def.icon === 'bread') {
        // Pão francês estilizado
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(ix, iy, 24, 14, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ix - 12, iy - 8);
        ctx.lineTo(ix - 4, iy + 6);
        ctx.moveTo(ix + 2, iy - 8);
        ctx.lineTo(ix + 10, iy + 6);
        ctx.stroke();
      } else if (def.icon === 'barber') {
        // Barber Pole listrado
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(ix - 12, iy - 24, 24, 48);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(ix - 12, iy - 20);
        ctx.lineTo(ix + 12, iy - 8);
        ctx.lineTo(ix + 12, iy);
        ctx.lineTo(ix - 12, iy - 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.moveTo(ix - 12, iy + 4);
        ctx.lineTo(ix + 12, iy + 16);
        ctx.lineTo(ix + 12, iy + 24);
        ctx.lineTo(ix - 12, iy + 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.strokeRect(ix - 12, iy - 24, 24, 48);
      } else if (def.icon === 'fruit') {
        // Cesto com maçã e laranja
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(ix - 8, iy - 2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(ix + 10, iy + 2, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(ix - 9, iy - 19, 4, 7);
      } else if (def.icon === 'snack') {
        // Pastel dourado
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(ix - 18, iy - 12);
        ctx.lineTo(ix + 18, iy - 12);
        ctx.lineTo(ix + 24, iy + 14);
        ctx.lineTo(ix - 24, iy + 14);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (def.icon === 'gear') {
        // Engrenagem e chave
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(ix, iy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(ix, iy, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Estrela
        ctx.fillStyle = '#facc15';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', ix, iy);
      }
      ctx.restore();

      // Texto do Título em Tipografia Bold com Contorno Sombra
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Sombra projetada preta
      ctx.font = '900 28px "Arial Black", "Impact", sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(def.title, 290 + 2, 50 + 2);

      // Texto Principal
      ctx.fillStyle = def.textColor;
      ctx.fillText(def.title, 290, 50);

      // Subtítulo
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = def.accentCol;
      ctx.fillText(def.sub, 290, 88);

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    });
  }

  createAwningTextures() {
    const awningPalettes = [
      ['#dc2626', '#f8fafc'], // Vermelho e Branco
      ['#0284c7', '#f8fafc'], // Azul e Branco
      ['#16a34a', '#fde047'], // Verde e Amarelo
      ['#ea580c', '#f8fafc']  // Laranja e Branco
    ];

    this.awningTextures = awningPalettes.map(([c1, c2]) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      const stripeW = 32;
      for (let x = 0; x < 256; x += stripeW) {
        ctx.fillStyle = (Math.floor(x / stripeW) % 2 === 0) ? c1 : c2;
        ctx.fillRect(x, 0, stripeW, 256);

        // Gradiente de sombra cilíndrica do tecido
        const g = ctx.createLinearGradient(x, 0, x + stripeW, 0);
        g.addColorStop(0.0, 'rgba(0,0,0,0.18)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.22)');
        g.addColorStop(1.0, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, stripeW, 256);
      }

      // Beiral recortado com ondas decorativas no rodapé
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 240, 256, 16);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.needsUpdate = true;
      return tex;
    });
  }

  createStorefrontDisplays() {
    const displays = [
      // 0: Bar do Zé (Prateleiras com garrafas e engradados)
      (ctx) => {
        ctx.fillStyle = '#451a03'; // Madeira do fundo
        ctx.fillRect(0, 0, 256, 256);

        // 3 Prateleiras
        [70, 140, 210].forEach(py => {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(10, py, 236, 12);
          ctx.fillStyle = '#291102';
          ctx.fillRect(10, py + 12, 236, 4);

          // Garrafas coloridas
          const botColors = ['#15803d', '#b91c1c', '#ca8a04', '#0284c7', '#d97706', '#166534'];
          for (let bx = 20; bx < 230; bx += 18) {
            const h = 32 + (bx % 3) * 8;
            ctx.fillStyle = botColors[(bx * 7) % botColors.length];
            ctx.fillRect(bx, py - h, 10, h);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(bx + 2, py - h - 5, 6, 5); // Rolha/tampa
          }
        });
      },
      // 1: Mercadinho (Frutas e produtos empilhados)
      (ctx) => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 256, 256);

        // Prateleiras de mercearia
        [75, 145, 215].forEach((py, sIdx) => {
          ctx.fillStyle = '#475569';
          ctx.fillRect(8, py, 240, 10);

          if (sIdx === 0) {
            // Caixas de cereais/leite
            for (let x = 15; x < 235; x += 22) {
              ctx.fillStyle = ['#dc2626', '#2563eb', '#16a34a', '#eab308'][(x * 3) % 4];
              ctx.fillRect(x, py - 38, 16, 38);
            }
          } else if (sIdx === 1) {
            // Caixas de frutas
            for (let x = 16; x < 230; x += 48) {
              ctx.fillStyle = '#78350f';
              ctx.fillRect(x, py - 28, 42, 28);
              ctx.fillStyle = ['#ef4444', '#f97316', '#facc15', '#22c55e'][(x * 5) % 4];
              for (let f = 0; f < 3; f++) {
                ctx.beginPath();
                ctx.arc(x + 10 + f * 11, py - 20, 6, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          } else {
            // Garrafas de refrigerante e óleo
            for (let x = 18; x < 235; x += 18) {
              ctx.fillStyle = (x % 36 === 0) ? '#dc2626' : '#16a34a';
              ctx.fillRect(x, py - 32, 12, 32);
            }
          }
        });
      },
      // 2: Padaria (Estufa de salgados, bolos e pães)
      (ctx) => {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, 0, 256, 256);

        // Estufa aquecida iluminada
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(20, 40, 216, 170);
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 6;
        ctx.strokeRect(20, 40, 216, 170);

        // Bandejas com salgados dourados (coxinha, pastel, pão de queijo)
        [90, 140, 190].forEach(by => {
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(30, by, 196, 6);
          for (let sx = 40; sx < 210; sx += 24) {
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.arc(sx + 8, by - 12, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(sx + 8, by - 14, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      },
      // 3: Barbearia (Espelho iluminado, navalha e poltrona)
      (ctx) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 256, 256);

        // Espelho central com moldura prateada
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(38, 25, 180, 160);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 8;
        ctx.strokeRect(38, 25, 180, 160);

        // Reflexo no espelho
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(38, 25);
        ctx.lineTo(100, 25);
        ctx.lineTo(38, 87);
        ctx.fill();

        // Bancada com frascos
        ctx.fillStyle = '#334155';
        ctx.fillRect(20, 185, 216, 55);
        for (let fx = 40; fx < 210; fx += 26) {
          ctx.fillStyle = ['#38bdf8', '#fb7185', '#a855f7'][(fx * 2) % 3];
          ctx.fillRect(fx, 155, 12, 30);
        }
      }
    ];

    this.storefrontDisplays = displays.map(drawFn => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      drawFn(ctx);

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    });
  }

  createTileFacadeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fundo branco porcelana
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64;
    for (let y = 0; y < 512; y += tileSize) {
      for (let x = 0; x < 512; x += tileSize) {
        // Rejunte cinza suave
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, tileSize, tileSize);

        const cx = x + tileSize / 2;
        const cy = y + tileSize / 2;
        const half = tileSize / 2 - 6;

        // Padrão de azulejo português colonial azul cobalto
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.moveTo(cx, cy - half);
        ctx.lineTo(cx + half, cy);
        ctx.lineTo(cx, cy + half);
        ctx.lineTo(cx - half, cy);
        ctx.closePath();
        ctx.fill();

        // Miolo floral em amarelo dourado
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();

        // 4 Petalas brancas
        ctx.fillStyle = '#ffffff';
        [[-10, 0], [10, 0], [0, -10], [0, 10]].forEach(([px, py]) => {
          ctx.beginPath();
          ctx.arc(cx + px, cy + py, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    this.tileFacadeTexture = new THREE.CanvasTexture(canvas);
    this.tileFacadeTexture.wrapS = THREE.RepeatWrapping;
    this.tileFacadeTexture.wrapT = THREE.RepeatWrapping;
    this.tileFacadeTexture.repeat.set(2, 2);
    this.tileFacadeTexture.needsUpdate = true;
  }

  createWindowGrilleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Vidro azul reflexivo
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0.0, '#38bdf8');
    grad.addColorStop(0.5, '#0284c7');
    grad.addColorStop(1.0, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Reflexo de luz na diagonal
    ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(90, 0);
    ctx.lineTo(0, 90);
    ctx.fill();

    // Grade de ferro fundido ornamental preta
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 248);

    // Barras verticais e transversais
    ctx.lineWidth = 5;
    for (let x = 32; x < 256; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 32; y < 256; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    // Losangos decorativos de ferro
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    for (let x = 32; x < 240; x += 64) {
      for (let y = 48; y < 240; y += 96) {
        ctx.strokeRect(x - 12, y - 12, 24, 24);
      }
    }

    this.windowGrilleTexture = new THREE.CanvasTexture(canvas);
    this.windowGrilleTexture.needsUpdate = true;
  }

  createModernWindowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Moldura preta fosca
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 256);

    // Vidro fumê com iluminação interior suave acolhedora
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0.0, '#1e293b');
    grad.addColorStop(0.6, '#334155');
    grad.addColorStop(1.0, '#fef08a');
    ctx.fillStyle = grad;
    ctx.fillRect(10, 10, 236, 236);

    // Divisão de caixilho basculante
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 120, 236, 12);
    ctx.fillRect(120, 10, 12, 236);

    this.modernWindowTexture = new THREE.CanvasTexture(canvas);
    this.modernWindowTexture.needsUpdate = true;
  }

  createDishAntennaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Superfície de chapa de aço cinza metálica
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 124);
    grad.addColorStop(0.0, '#f1f5f9');
    grad.addColorStop(0.7, '#cbd5e1');
    grad.addColorStop(1.0, '#64748b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    // Trama de chapa furadinha perfurada
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 20; y < 236; y += 10) {
      for (let x = 20; x < 236; x += 10) {
        const d = Math.hypot(x - 128, y - 128);
        if (d < 110) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Logo "BRASILSAT" no prato
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BRASILSAT', 128, 128);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(128, 146, 5, 0, Math.PI * 2);
    ctx.fill();

    this.dishAntennaTexture = new THREE.CanvasTexture(canvas);
    this.dishAntennaTexture.needsUpdate = true;
  }

  // ==========================================
  // CENÁRIO 2.0 (FASE B) — VEGETAÇÃO E VEÍCULOS
  // ==========================================

  createVegetationAndVehicleTextures() {
    this.createPalmLeafTexture();
    this.createBananaLeafTexture();
    this.createBushFoliageTexture();
    this.createIvyTexture();
    this.createKombiSideTexture();
    this.createCarDetailsTexture();
    this.createMotoBoxTexture();
  }

  createPalmLeafTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);

    // Folha de Palmeira / Coqueiro Estilizada Tropical
    const grad = ctx.createLinearGradient(0, 256, 256, 0);
    grad.addColorStop(0.0, '#14532d');
    grad.addColorStop(0.5, '#16a34a');
    grad.addColorStop(1.0, '#4ade80');
    ctx.fillStyle = grad;

    // Haste central
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(16, 240);
    ctx.quadraticCurveTo(100, 160, 240, 20);
    ctx.stroke();

    // Folíolos / Folhas em leque
    ctx.fillStyle = grad;
    for (let i = 0.15; i <= 0.95; i += 0.05) {
      const px = 16 + i * (240 - 16);
      const py = 240 - Math.pow(i, 0.85) * 220;

      // Lado esquerdo do folíolo
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 35 - i * 30, py + 15 + i * 20);
      ctx.lineTo(px, py - 6);
      ctx.fill();

      // Lado direito do folíolo
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 15 + i * 20, py - 35 - i * 25);
      ctx.lineTo(px + 4, py);
      ctx.fill();
    }

    this.palmLeafTexture = new THREE.CanvasTexture(canvas);
    this.palmLeafTexture.needsUpdate = true;
  }

  createBananaLeafTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);

    // Folha Larga de Bananeira
    ctx.save();
    ctx.translate(128, 128);
    ctx.rotate(0.1);

    const grad = ctx.createLinearGradient(0, 120, 0, -120);
    grad.addColorStop(0.0, '#15803d');
    grad.addColorStop(0.6, '#22c55e');
    grad.addColorStop(1.0, '#86efac');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 115, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nervura central
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 115);
    ctx.lineTo(0, -115);
    ctx.stroke();

    // Nervuras laterais
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.lineWidth = 2;
    for (let y = -80; y <= 80; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(38, y - 12);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(-38, y - 12);
      ctx.stroke();
    }

    ctx.restore();

    this.bananaLeafTexture = new THREE.CanvasTexture(canvas);
    this.bananaLeafTexture.needsUpdate = true;
  }

  createBushFoliageTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#166534';
    ctx.fillRect(0, 0, 256, 256);

    // Textura orgânica de folhas de arbusto estilizadas
    const colors = ['#15803d', '#22c55e', '#4ade80', '#14532d'];
    for (let i = 0; i < 90; i++) {
      const cx = (Math.sin(i * 99) * 0.5 + 0.5) * 256;
      const cy = (Math.cos(i * 77) * 0.5 + 0.5) * 256;
      const r = 12 + (i % 16);

      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    this.bushFoliageTexture = new THREE.CanvasTexture(canvas);
    this.bushFoliageTexture.wrapS = THREE.RepeatWrapping;
    this.bushFoliageTexture.wrapT = THREE.RepeatWrapping;
    this.bushFoliageTexture.needsUpdate = true;
  }

  createIvyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 256);

    // Trepadeiras caindo sobre mureta de concreto
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 3;

    for (let branch = 0; branch < 8; branch++) {
      const startX = 30 + branch * 60;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      let currX = startX;
      let currY = 0;
      const maxLen = 120 + (branch % 4) * 30;

      while (currY < maxLen) {
        currY += 15;
        currX += (Math.sin(currY * 0.1) * 8);
        ctx.lineTo(currX, currY);

        // Folhinhas verdes ao longo do ramo
        ctx.fillStyle = (branch % 2 === 0) ? '#22c55e' : '#4ade80';
        ctx.beginPath();
        ctx.arc(currX + 8, currY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(currX - 8, currY + 4, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.stroke();
    }

    this.ivyTexture = new THREE.CanvasTexture(canvas);
    this.ivyTexture.needsUpdate = true;
  }

  createKombiSideTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Parte superior branca / off-white clássica
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 110);

    // Faixa cromada divisória
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 106, 512, 8);

    // Parte inferior (fundo neutro para mat tint)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 114, 512, 142);

    // Janelas da Kombi (3 janelas laterais + porta)
    const windowPositions = [40, 140, 240, 360];
    windowPositions.forEach(wx => {
      // Moldura
      ctx.fillStyle = '#334155';
      ctx.fillRect(wx - 2, 20, 84, 64);
      // Vidro fumê
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(wx, 22, 80, 60);
      // Reflexo estilizado
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(wx + 10, 82);
      ctx.lineTo(wx + 40, 22);
      ctx.lineTo(wx + 55, 22);
      ctx.lineTo(wx + 25, 82);
      ctx.fill();
    });

    // Maçanetas cromadas
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(110, 125, 20, 6);
    ctx.fillRect(230, 125, 20, 6);

    // Aberturas de ventilação traseira do motor
    ctx.fillStyle = '#475569';
    for (let vy = 135; vy <= 185; vy += 10) {
      ctx.fillRect(440, vy, 45, 4);
    }

    this.kombiSideTexture = new THREE.CanvasTexture(canvas);
    this.kombiSideTexture.needsUpdate = true;
  }

  createCarDetailsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);

    // Faróis dianteiros redondos cromados
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(45, 60, 28, 0, Math.PI * 2);
    ctx.arc(211, 60, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(45, 60, 22, 0, Math.PI * 2);
    ctx.arc(211, 60, 22, 0, Math.PI * 2);
    ctx.fill();

    // Grade dianteira
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(80, 45, 96, 30);
    ctx.fillStyle = '#94a3b8';
    for (let gy = 50; gy < 75; gy += 6) {
      ctx.fillRect(84, gy, 88, 2);
    }

    // Lanternas traseiras bicolores
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(25, 140, 40, 30);
    ctx.fillRect(191, 140, 40, 30);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(25, 140, 14, 30);
    ctx.fillRect(217, 140, 14, 30);

    // Placa Mercosul Brasileira
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(78, 145, 100, 35);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(78, 145, 100, 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BRASIL', 128, 153);

    ctx.fillStyle = '#000000';
    ctx.font = '900 13px monospace';
    ctx.fillText('LULA-2026', 128, 172);

    this.carDetailsTexture = new THREE.CanvasTexture(canvas);
    this.carDetailsTexture.needsUpdate = true;
  }

  createMotoBoxTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Baú vermelho de entregador
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 256, 256);

    // Faixas refletivas amarelas nas bordas
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 256, 16);
    ctx.fillRect(0, 240, 256, 16);

    // Logo e texto estilizado
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(128, 100, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.font = '900 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IFOOD', 128, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('ENTREGA RÁPIDA', 128, 170);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('★ DISK PIZZA ★', 128, 195);

    this.motoBoxTexture = new THREE.CanvasTexture(canvas);
    this.motoBoxTexture.needsUpdate = true;
  }

  // ========================================================
  // CENÁRIO 2.0 (FASE C) — PIPAS, CHURRASQUEIRAS E VIDA URBANA
  // ========================================================

  createNpcAndAtmosphereTextures() {
    this.createKiteTextures();
    this.createGrillTexture();
    this.createSmokeTexture();
  }

  createKiteTextures() {
    const patterns = [
      // 1. Pipa Brasil (Verde e Amarela com Losango)
      (ctx) => {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(128, 20);
        ctx.lineTo(236, 128);
        ctx.lineTo(128, 236);
        ctx.lineTo(20, 128);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.arc(128, 128, 48, 0, Math.PI * 2);
        ctx.fill();
      },
      // 2. Pipa Bicolor Azul e Branca (Estilo Carioca)
      (ctx) => {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(256, 256);
        ctx.lineTo(0, 256);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(256, 256);
        ctx.stroke();
      },
      // 3. Pipa Rubro-Negra / Vermelha e Preta
      (ctx) => {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#0f172a';
        for (let y = 0; y < 256; y += 64) {
          ctx.fillRect(0, y, 256, 32);
        }
      },
      // 4. Pipa Raia Roxa com Estrela Neon
      (ctx) => {
        const grad = ctx.createLinearGradient(0, 0, 256, 256);
        grad.addColorStop(0.0, '#7c3aed');
        grad.addColorStop(1.0, '#ec4899');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(128, 128, 45, 0, Math.PI * 2);
        ctx.fill();
      }
    ];

    this.kiteTextures = patterns.map(drawFn => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Fundo losango transparente
      ctx.clearRect(0, 0, 256, 256);

      // Traçado do losango da pipa
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(128, 10);
      ctx.lineTo(246, 128);
      ctx.lineTo(128, 246);
      ctx.lineTo(10, 128);
      ctx.closePath();
      ctx.clip();

      drawFn(ctx);

      // Cruzeta / Varetas de bambu da pipa
      ctx.restore();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(128, 10);
      ctx.lineTo(128, 246);
      ctx.moveTo(10, 128);
      ctx.lineTo(246, 128);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    });
  }

  createGrillTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fundo de carvão e brasa incandescente
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 40; i++) {
      const bx = Math.random() * 256;
      const by = Math.random() * 256;
      const r = 8 + Math.random() * 14;
      ctx.fillStyle = Math.random() > 0.4 ? '#ef4444' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grelha de arame
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    for (let x = 16; x < 240; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, 246);
      ctx.stroke();
    }

    // Picanhas e linguiças grelhando
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(80, 80, 45, 25, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(70, 58, 20, 4);

    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.ellipse(170, 160, 50, 28, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Linguiças toscanas
    ctx.fillStyle = '#7f1d1d';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(170, 70 + i * 22, 35, 8, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    this.grillTexture = new THREE.CanvasTexture(canvas);
    this.grillTexture.needsUpdate = true;
  }

  createSmokeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.75)');
    grad.addColorStop(0.4, 'rgba(226, 232, 240, 0.40)');
    grad.addColorStop(0.8, 'rgba(203, 213, 225, 0.12)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    this.smokeTexture = new THREE.CanvasTexture(canvas);
    this.smokeTexture.needsUpdate = true;
  }

  // ========================================================
  // CENÁRIO 2.0 (FASE D) — PANORAMA E HORIZONTE CARIOCA
  // ========================================================

  createMorroParallaxTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fundo transparente no topo
    ctx.clearRect(0, 0, 1024, 512);

    // 1. Silhueta das Montanhas Distantes (Dois Irmãos / Pão de Açúcar em Verde Tropical e Névoa Azul)
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.moveTo(0, 320);
    ctx.quadraticCurveTo(160, 120, 320, 240);
    ctx.quadraticCurveTo(460, 80, 600, 220);
    ctx.quadraticCurveTo(780, 100, 920, 260);
    ctx.quadraticCurveTo(980, 200, 1024, 280);
    ctx.lineTo(1024, 512);
    ctx.lineTo(0, 512);
    ctx.closePath();
    ctx.fill();

    // 2. Segunda Camada de Morro Mais Próximo
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.quadraticCurveTo(220, 180, 440, 310);
    ctx.quadraticCurveTo(680, 160, 880, 320);
    ctx.lineTo(1024, 380);
    ctx.lineTo(1024, 512);
    ctx.lineTo(0, 512);
    ctx.closePath();
    ctx.fill();

    // 3. Casinhas da Favela Empilhadas na Encosta (Cores Vivas Brasileiras)
    const favelaColors = [
      '#f59e0b', '#ea580c', '#0284c7', '#10b981', '#ec4899',
      '#8b5cf6', '#f43f5e', '#b45309', '#ca8a04', '#94a3b8'
    ];

    for (let x = 20; x < 1000; x += 18) {
      const hillY = 240 + Math.sin(x * 0.012) * 90 + Math.cos(x * 0.025) * 40;
      const stackCount = Math.floor(Math.random() * 4) + 2;

      for (let s = 0; s < stackCount; s++) {
        const hy = hillY + s * 22;
        if (hy > 480) continue;

        const hw = 22 + (Math.sin(x + s) * 8);
        const hh = 18 + (Math.cos(x * s) * 6);
        const color = favelaColors[(x + s * 3) % favelaColors.length];

        // Corpo da casa
        ctx.fillStyle = color;
        ctx.fillRect(x, hy, hw, hh);

        // Laje / Telhado
        ctx.fillStyle = '#475569';
        ctx.fillRect(x - 2, hy, hw + 4, 3);

        // Caixa d'água azul no topo da laje
        if (s === 0 && Math.sin(x) > 0.2) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(x + hw * 0.3, hy - 7, 7, 7);
        }

        // Janelinhas acesas
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x + 4, hy + 5, 4, 4);
        if (hw > 20) {
          ctx.fillRect(x + hw - 8, hy + 5, 4, 4);
        }
      }
    }

    // 4. Coqueiros no Topo das Cristas dos Morros
    ctx.fillStyle = '#064e3b';
    for (let px = 60; px < 980; px += 85) {
      const py = 200 + Math.sin(px * 0.012) * 85;
      // Tronco fino
      ctx.fillRect(px, py, 2, 16);
      // Copa em estrela
      ctx.beginPath();
      ctx.arc(px + 1, py, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    this.morroParallaxTexture = new THREE.CanvasTexture(canvas);
    this.morroParallaxTexture.wrapS = THREE.RepeatWrapping;
    this.morroParallaxTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.morroParallaxTexture.needsUpdate = true;
  }

  // ========================================================
  // CENÁRIO 2.0 (BOSS & SATÍRICO) — CTPS VIVA, MOEDA ESTRELA E TRENS
  // ========================================================

  createCtpsBossTextures() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Capa Couro Sintético Azul Marinho Escuro
    ctx.fillStyle = '#0c1829';
    ctx.fillRect(0, 0, 512, 512);

    // Textura sutil de granulação de couro
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 2400; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Borda fina dourada com cantos arredondados
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, 476, 476);

    // 2. Textos Oficiais em Ouro Metálico
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'center';
    ctx.font = '900 15px sans-serif';
    ctx.fillText('REPÚBLICA FEDERATIVA DO BRASIL', 256, 44);
    ctx.font = '700 13px sans-serif';
    ctx.fillText('MINISTÉRIO DO TRABALHO', 256, 62);

    // 3. Brasão da República Dourado
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(256, 175, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    // Estrela de 5 pontas central
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = 256 + Math.cos(angle) * 38;
      const y = 175 + Math.sin(angle) * 38;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // 4. Rosto Cartoon Expressivo (Olhos de Raiva & Sobrancelhas Marcantes)
    // Olho Esquerdo
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(190, 260, 38, 48, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Pupila Esquerda
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(198, 265, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(192, 258, 6, 0, Math.PI * 2);
    ctx.fill();

    // Olho Direito
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(322, 260, 38, 48, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Pupila Direita
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(314, 265, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(320, 258, 6, 0, Math.PI * 2);
    ctx.fill();

    // Sobrancelhas Furiosas Anguladas
    ctx.fillStyle = '#020617';
    // Esquerda
    ctx.beginPath();
    ctx.moveTo(130, 215);
    ctx.lineTo(240, 245);
    ctx.lineTo(235, 262);
    ctx.lineTo(135, 230);
    ctx.closePath();
    ctx.fill();

    // Direita
    ctx.beginPath();
    ctx.moveTo(382, 215);
    ctx.lineTo(272, 245);
    ctx.lineTo(277, 262);
    ctx.lineTo(377, 230);
    ctx.closePath();
    ctx.fill();

    // Boca com Dentes Cerrados Furiosos
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(190, 340, 132, 42, 10);
    ctx.fill();
    ctx.stroke();
    // Grade de dentes
    ctx.beginPath();
    ctx.moveTo(190, 361);
    ctx.lineTo(322, 361);
    for (let d = 215; d < 315; d += 25) {
      ctx.moveTo(d, 340);
      ctx.lineTo(d, 382);
    }
    ctx.stroke();

    // 5. Texto Inferior "CARTEIRA DE TRABALHO E PREVIDÊNCIA SOCIAL"
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 18px sans-serif';
    ctx.fillText('CARTEIRA DE TRABALHO', 256, 442);
    ctx.font = '900 14px sans-serif';
    ctx.fillText('E PREVIDÊNCIA SOCIAL', 256, 464);

    this.ctpsBossCoverTexture = new THREE.CanvasTexture(canvas);
    this.ctpsBossCoverTexture.needsUpdate = true;
  }

  createGoldStarCoinTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fundo Gradiente Radial Dourado Quente
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.35, '#facc15');
    grad.addColorStop(0.75, '#ca8a04');
    grad.addColorStop(1, '#78350f');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.fill();

    // Anel de Borda Relevo
    ctx.strokeStyle = '#fffbeb';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.stroke();

    // Estrela de 5 Pontas Dourada em Relevo Central
    ctx.fillStyle = '#fef9c3';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const ox = 128 + Math.cos(outerAngle) * 62;
      const oy = 128 + Math.sin(outerAngle) * 62;
      const ix = 128 + Math.cos(innerAngle) * 28;
      const iy = 128 + Math.sin(innerAngle) * 28;

      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brilho Estelar Reflexivo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(95, 95, 14, 0, Math.PI * 2);
    ctx.fill();

    this.goldStarCoinTexture = new THREE.CanvasTexture(canvas);
    this.goldStarCoinTexture.needsUpdate = true;
  }

  createTrainLiveryTextures() {
    const liveries = [
      { text: 'EXPRESSO IMPOSTO', bg: '#4c1d95', border: '#ec4899', glow: '#f43f5e' },
      { text: 'TREM DO IRPF', bg: '#064e3b', border: '#facc15', glow: '#22c55e' },
      { text: 'METRÔ DA RECEITA', bg: '#1e293b', border: '#f97316', glow: '#fbbf24' },
      { text: 'LINHA CLT 44H', bg: '#0369a1', border: '#38bdf8', glow: '#0ea5e9' }
    ];

    this.trainLiveryTextures = liveries.map(liv => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = liv.bg;
      ctx.fillRect(0, 0, 512, 128);

      ctx.strokeStyle = liv.border;
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, 500, 116);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px "Bangers", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = liv.glow;
      ctx.shadowBlur = 18;
      ctx.fillText(liv.text, 256, 64);

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    });
  }

  createSatiricalNeonSigns() {
    const signs = [
      { text: 'TRABALHE LEGAL ✔', bg: '#022c22', neon: '#22c55e' },
      { text: 'BRASIL É TRABALHO! 🇧🇷', bg: '#1e1b4b', neon: '#facc15' },
      { text: 'SÃO PAULO - TRIBUTOS', bg: '#4a044e', neon: '#ec4899' },
      { text: 'MULTA GRAVÍSSIMA ⚠️', bg: '#450a0a', neon: '#ef4444' }
    ];

    this.satiricalNeonSigns = signs.map(s => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = s.bg;
      ctx.fillRect(0, 0, 256, 128);

      ctx.strokeStyle = s.neon;
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 244, 116);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 20px "Bangers", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = s.neon;
      ctx.shadowBlur = 16;
      ctx.fillText(s.text, 128, 64);

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    });
  }

  createFlyingTaxTextures() {
    // 1. Nota de R$ 100 Realista Cartoon
    const canvas100 = document.createElement('canvas');
    canvas100.width = 256;
    canvas100.height = 128;
    const ctx100 = canvas100.getContext('2d');

    ctx100.fillStyle = '#0284c7'; // Azul Turquesa da Nota de 100
    ctx100.fillRect(0, 0, 256, 128);

    ctx100.strokeStyle = '#38bdf8';
    ctx100.lineWidth = 4;
    ctx100.strokeRect(6, 6, 244, 116);

    ctx100.fillStyle = '#ffffff';
    ctx100.font = '900 32px "Bangers", sans-serif';
    ctx100.fillText('100', 30, 45);
    ctx100.fillText('100', 180, 110);

    ctx100.font = '700 12px sans-serif';
    ctx100.fillText('BANCO CENTRAL DO BRASIL', 40, 70);
    ctx100.fillText('CEM REAIS', 40, 88);

    // Faixa Holográfica
    ctx100.fillStyle = '#facc15';
    ctx100.fillRect(150, 6, 18, 116);

    this.real100NoteTexture = new THREE.CanvasTexture(canvas100);
    this.real100NoteTexture.needsUpdate = true;

    // 2. Guia DARF / Carnê do Leão
    const canvasDarf = document.createElement('canvas');
    canvasDarf.width = 256;
    canvasDarf.height = 340;
    const ctxDarf = canvasDarf.getContext('2d');

    ctxDarf.fillStyle = '#ffffff';
    ctxDarf.fillRect(0, 0, 256, 340);

    ctxDarf.strokeStyle = '#dc2626';
    ctxDarf.lineWidth = 6;
    ctxDarf.strokeRect(6, 6, 244, 328);

    ctxDarf.fillStyle = '#dc2626';
    ctxDarf.font = '900 18px sans-serif';
    ctxDarf.textAlign = 'center';
    ctxDarf.fillText('RECEITA FEDERAL', 128, 36);

    ctxDarf.fillStyle = '#0f172a';
    ctxDarf.font = '900 24px "Bangers", sans-serif';
    ctxDarf.fillText('GUIA DARF / IRPF', 128, 68);

    ctxDarf.fillStyle = '#ef4444';
    ctxDarf.font = '700 14px sans-serif';
    ctxDarf.fillText('AUTUAÇÃO FISCAL', 128, 92);

    // Linhas de código de barras
    ctxDarf.fillStyle = '#000000';
    for (let x = 20; x < 236; x += 6) {
      const w = Math.random() > 0.4 ? 3 : 1.5;
      ctxDarf.fillRect(x, 260, w, 55);
    }

    this.darfFormTexture = new THREE.CanvasTexture(canvasDarf);
    this.darfFormTexture.needsUpdate = true;

    // 3. Moeda Rara Dourada com Bandeira do Brasil
    const canvasBR = document.createElement('canvas');
    canvasBR.width = 256;
    canvasBR.height = 256;
    const ctxBR = canvasBR.getContext('2d');

    // Fundo Ouro Brilhante
    const gradBR = ctxBR.createRadialGradient(128, 128, 20, 128, 128, 120);
    gradBR.addColorStop(0, '#fef08a');
    gradBR.addColorStop(0.3, '#facc15');
    gradBR.addColorStop(0.8, '#b45309');
    gradBR.addColorStop(1, '#451a03');

    ctxBR.fillStyle = gradBR;
    ctxBR.beginPath();
    ctxBR.arc(128, 128, 118, 0, Math.PI * 2);
    ctxBR.fill();

    ctxBR.strokeStyle = '#fffbeb';
    ctxBR.lineWidth = 8;
    ctxBR.stroke();

    // Bandeira do Brasil Central (Losango Amarelo e Círculo Azul)
    ctxBR.fillStyle = '#16a34a';
    ctxBR.fillRect(48, 64, 160, 128);

    ctxBR.fillStyle = '#facc15';
    ctxBR.beginPath();
    ctxBR.moveTo(128, 70);
    ctxBR.lineTo(200, 128);
    ctxBR.lineTo(128, 186);
    ctxBR.lineTo(56, 128);
    ctxBR.closePath();
    ctxBR.fill();

    ctxBR.fillStyle = '#0284c7';
    ctxBR.beginPath();
    ctxBR.arc(128, 128, 34, 0, Math.PI * 2);
    ctxBR.fill();

    // Faixa Branca
    ctxBR.fillStyle = '#ffffff';
    ctxBR.beginPath();
    ctxBR.arc(128, 128, 34, -0.2, 0.6);
    ctxBR.lineWidth = 6;
    ctxBR.strokeStyle = '#ffffff';
    ctxBR.stroke();

    this.rareBrazilCoinTexture = new THREE.CanvasTexture(canvasBR);
    this.rareBrazilCoinTexture.needsUpdate = true;
  }

  createSubwaySurfersTextures() {
    // 1. Placa de Barreira Chevron Clássica do Subway Surfers
    const canvasChevron = document.createElement('canvas');
    canvasChevron.width = 512;
    canvasChevron.height = 512;
    const ctxC = canvasChevron.getContext('2d');

    // Fundo Branco/Creme
    ctxC.fillStyle = '#f8fafc';
    ctxC.fillRect(0, 0, 512, 512);

    // Listras Diagonais em V (Chevron) Vermelhas Vivas
    ctxC.fillStyle = '#dc2626';

    const numStripes = 6;
    const stripeH = 512 / numStripes;

    for (let i = -2; i < numStripes + 2; i++) {
      const y = i * stripeH;
      ctxC.beginPath();
      // Asa esquerda (descendo até o centro)
      ctxC.moveTo(0, y);
      ctxC.lineTo(256, y + stripeH * 0.9);
      ctxC.lineTo(256, y + stripeH * 1.55);
      ctxC.lineTo(0, y + stripeH * 0.65);
      ctxC.closePath();
      ctxC.fill();

      // Asa direita (subindo do centro até a borda)
      ctxC.beginPath();
      ctxC.moveTo(512, y);
      ctxC.lineTo(256, y + stripeH * 0.9);
      ctxC.lineTo(256, y + stripeH * 1.55);
      ctxC.lineTo(512, y + stripeH * 0.65);
      ctxC.closePath();
      ctxC.fill();
    }

    // Bordas Superiores e Inferiores Vermelhas com Listras Verticais de Alerta
    ctxC.fillStyle = '#991b1b';
    ctxC.fillRect(0, 0, 512, 45);
    ctxC.fillRect(0, 467, 512, 45);

    // Listras verticais amarelas nas bordas superior/inferior
    ctxC.fillStyle = '#fde047';
    for (let x = 15; x < 512; x += 55) {
      ctxC.fillRect(x, 0, 22, 45);
      ctxC.fillRect(x, 467, 22, 45);
    }

    // Contorno Geral Preto Robusto
    ctxC.strokeStyle = '#0f172a';
    ctxC.lineWidth = 12;
    ctxC.strokeRect(6, 6, 500, 500);

    this.subwayChevronBarrierTexture = new THREE.CanvasTexture(canvasChevron);
    this.subwayChevronBarrierTexture.needsUpdate = true;

    // 2. Chão de Terra / Balastro Quente Cartoon
    const canvasDirt = document.createElement('canvas');
    canvasDirt.width = 512;
    canvasDirt.height = 512;
    const ctxD = canvasDirt.getContext('2d');

    // Gradiente Terra Quente / Areia Alaranjada
    const dirtGrad = ctxD.createLinearGradient(0, 0, 512, 0);
    dirtGrad.addColorStop(0, '#78350f');
    dirtGrad.addColorStop(0.2, '#9a3412');
    dirtGrad.addColorStop(0.5, '#c2410c');
    dirtGrad.addColorStop(0.8, '#9a3412');
    dirtGrad.addColorStop(1, '#78350f');
    ctxD.fillStyle = dirtGrad;
    ctxD.fillRect(0, 0, 512, 512);

    // Partículas de Cascalho e Textura Quente
    for (let i = 0; i < 1800; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const size = Math.random() * 3 + 1;
      ctxD.fillStyle = Math.random() > 0.5 ? 'rgba(254, 215, 170, 0.25)' : 'rgba(69, 26, 3, 0.35)';
      ctxD.fillRect(rx, ry, size, size);
    }

    this.warmTracksGroundTexture = new THREE.CanvasTexture(canvasDirt);
    this.warmTracksGroundTexture.wrapS = THREE.RepeatWrapping;
    this.warmTracksGroundTexture.wrapT = THREE.RepeatWrapping;
    this.warmTracksGroundTexture.repeat.set(3, 12);
    this.warmTracksGroundTexture.needsUpdate = true;

    // 3. Dormentes de Madeira Escura Estilizada (Ties)
    const canvasTie = document.createElement('canvas');
    canvasTie.width = 256;
    canvasTie.height = 64;
    const ctxT = canvasTie.getContext('2d');

    ctxT.fillStyle = '#451a03';
    ctxT.fillRect(0, 0, 256, 64);

    // Veios de Madeira
    ctxT.fillStyle = '#291002';
    for (let y = 8; y < 64; y += 12) {
      ctxT.fillRect(0, y, 256, 3);
    }

    // Placas de Fixação de Aço com Parafusos nas Pontas
    ctxT.fillStyle = '#64748b';
    ctxT.fillRect(35, 10, 32, 44);
    ctxT.fillRect(189, 10, 32, 44);
    ctxT.fillStyle = '#f8fafc';
    ctxT.fillRect(48, 28, 6, 8);
    ctxT.fillRect(202, 28, 6, 8);

    this.woodTieTexture = new THREE.CanvasTexture(canvasTie);
    this.woodTieTexture.needsUpdate = true;
  }
}


export const textureAtlas = new TextureAtlasManager();
