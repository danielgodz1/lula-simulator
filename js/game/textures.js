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
}

export const textureAtlas = new TextureAtlasManager();
