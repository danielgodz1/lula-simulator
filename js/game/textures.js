// js/game/textures.js — Atlas de Texturas Urbanas e Procedurais Otimizadas (Favela / Comunidade Carioca)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

class TextureAtlasManager {
  constructor() {
    this.atlasTexture = null;
    this.materials = new Map();
    this.init();
  }

  init() {
    this.createUnifiedAtlas();
    this.createSpecialTextures();
  }

  /**
   * Gera um Texture Atlas unificado (1024x1024) para reduzir consumo de VRAM e Draw Calls
   */
  createUnifiedAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Fundo neutro
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1024, 1024);

    // 1. Quadrante Superior Esquerdo (0,0 -> 512,512): Tijolo Baiano / Reboco de Favela
    this.drawBrickPattern(ctx, 0, 0, 512, 512);

    // 2. Quadrante Superior Direito (512,0 -> 1024,512): Janelas com Esquadrias e Portas
    this.drawWindowsAndDoors(ctx, 512, 0, 512, 512);

    // 3. Quadrante Inferior Esquerdo (0,512 -> 512,1024): Grafites Urbanos e Muretas
    this.drawGraffitiAndWalls(ctx, 0, 512, 512, 512);

    // 4. Quadrante Inferior Direito (512,512 -> 1024,1024): Asfalto, Meio-Fio e Textura de Concreto
    this.drawUrbanPavement(ctx, 512, 512, 512, 512);

    this.atlasTexture = new THREE.CanvasTexture(canvas);
    this.atlasTexture.wrapS = THREE.RepeatWrapping;
    this.atlasTexture.wrapT = THREE.RepeatWrapping;
    this.atlasTexture.needsUpdate = true;
  }

  // Padrão de Tijolo Baiano com frisos e reboco
  drawBrickPattern(ctx, ox, oy, w, h) {
    ctx.fillStyle = '#b45309'; // Tom terracota/tijolo
    ctx.fillRect(ox, oy, w, h);

    ctx.fillStyle = '#78350f'; // Linhas de argamassa escura
    const rows = 32;
    const rowH = h / rows;
    const brickW = 32;

    for (let r = 0; r < rows; r++) {
      const y = oy + r * rowH;
      ctx.fillRect(ox, y, w, 2); // Linha horizontal

      const offset = (r % 2) * (brickW / 2);
      for (let x = ox + offset; x < ox + w; x += brickW) {
        ctx.fillRect(x, y, 2, rowH); // Linha vertical
      }
    }

    // Variações de tonalidade em alguns tijolos para realismo
    ctx.fillStyle = 'rgba(234, 88, 12, 0.35)';
    for (let i = 0; i < 40; i++) {
      const rx = ox + Math.floor(Math.random() * (w - 30));
      const ry = oy + Math.floor(Math.random() * (h - rowH));
      ctx.fillRect(rx, ry, 28, rowH - 2);
    }
  }

  // Janelas com esquadrias e portas simples
  drawWindowsAndDoors(ctx, ox, oy, w, h) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(ox, oy, w, h);

    // Janela 1: Alumínio com veneziana aberta
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 40, oy + 40, 180, 180);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 12;
    ctx.strokeRect(ox + 40, oy + 40, 180, 180);
    // Vidro azulado com reflexo
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(ox + 50, oy + 50, 75, 160);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(ox + 135, oy + 50, 75, 160);
    // Cortina amarela
    ctx.fillStyle = '#facc15';
    ctx.fillRect(ox + 50, oy + 50, 40, 70);

    // Janela 2: Grade de ferro com tijolo
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

    // Porta 1: Madeira simples com trinco
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(ox + 50, oy + 270, 160, 220);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 6;
    ctx.strokeRect(ox + 50, oy + 270, 160, 220);
    // Maçaneta
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(ox + 190, oy + 380, 8, 0, Math.PI * 2);
    ctx.fill();

    // Porta 2: Ferro ondulado azul/verde
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(ox + 290, oy + 270, 160, 220);
    ctx.fillStyle = '#115e59';
    for (let py = oy + 280; py < oy + 480; py += 16) {
      ctx.fillRect(ox + 295, py, 150, 4);
    }
  }

  // Grafites artísticos e muretas urbanas
  drawGraffitiAndWalls(ctx, ox, oy, w, h) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(ox, oy, w, h);

    // Grafite "CRIAS"
    ctx.font = '900 64px Bangers, sans-serif';
    ctx.fillStyle = '#ec4899';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText('⚡ CRIAS ⚡', ox + 80, oy + 120);
    ctx.fillText('⚡ CRIAS ⚡', ox + 80, oy + 120);

    // Grafite "PAZ NA FAVELA"
    ctx.font = '900 56px Bangers, sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.strokeText('🕊️ PAZ & AMOR', ox + 50, oy + 240);
    ctx.fillText('🕊️ PAZ & AMOR', ox + 50, oy + 240);

    // Grafite "BRASIL 100%"
    ctx.font = '900 58px Bangers, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.strokeText('🇧🇷 BRASIL 100%', ox + 60, oy + 360);
    ctx.fillText('🇧🇷 BRASIL 100%', ox + 60, oy + 360);

    // Pichação estilizada
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('RUA É NÓIS ★ 2026', ox + 70, oy + 460);
  }

  // Asfalto, guia de meio-fio e calçadas
  drawUrbanPavement(ctx, ox, oy, w, h) {
    // Asfalto escuro rugoso
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox, oy, w / 2, h);

    // Pontos de cascalho no asfalto
    ctx.fillStyle = '#334155';
    for (let i = 0; i < 400; i++) {
      const px = ox + Math.random() * (w / 2);
      const py = oy + Math.random() * h;
      ctx.fillRect(px, py, 2, 2);
    }

    // Calçada de concreto com placas
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

  // Cria texturas adicionais (Caixa d'água Fortlev, Placas CLT, Bolsa Família)
  createSpecialTextures() {
    // 1. Textura Caixa d'água Fortlev (Azul com logo)
    const tankCanvas = document.createElement('canvas');
    tankCanvas.width = 256; tankCanvas.height = 256;
    const tCtx = tankCanvas.getContext('2d');
    tCtx.fillStyle = '#0284c7';
    tCtx.fillRect(0, 0, 256, 256);
    // Frisos da caixa d'água
    tCtx.fillStyle = '#0369a1';
    tCtx.fillRect(0, 40, 256, 12);
    tCtx.fillRect(0, 120, 256, 12);
    tCtx.fillRect(0, 200, 256, 12);
    // Logo
    tCtx.fillStyle = '#ffffff';
    tCtx.font = 'bold 28px sans-serif';
    tCtx.textAlign = 'center';
    tCtx.fillText('FORTLEV 500L', 128, 90);
    this.waterTankTexture = new THREE.CanvasTexture(tankCanvas);

    // 2. CLT 44h
    const cltCanvas = document.createElement('canvas');
    cltCanvas.width = 512; cltCanvas.height = 340;
    const cltCtx = cltCanvas.getContext('2d');
    cltCtx.fillStyle = '#0f3a68';
    cltCtx.fillRect(0, 0, 512, 340);
    cltCtx.strokeStyle = '#d4af37';
    cltCtx.lineWidth = 12;
    cltCtx.strokeRect(16, 16, 480, 308);
    cltCtx.fillStyle = '#ffffff';
    cltCtx.font = 'bold 22px sans-serif';
    cltCtx.textAlign = 'center';
    cltCtx.fillText('REPÚBLICA FEDERATIVA DO BRASIL', 256, 60);
    cltCtx.font = 'bold 36px sans-serif';
    cltCtx.fillStyle = '#ffd700';
    cltCtx.fillText('CARTEIRA DE TRABALHO', 256, 130);
    cltCtx.fillText('E PREVIDÊNCIA SOCIAL', 256, 175);
    cltCtx.fillStyle = '#ff4d4d';
    cltCtx.font = '900 44px Bangers, sans-serif';
    cltCtx.fillText('⚠️ CLT 44H SEMANAIS!', 256, 260);
    this.cltTexture = new THREE.CanvasTexture(cltCanvas);

    // 3. Bolsa Família
    const bfCanvas = document.createElement('canvas');
    bfCanvas.width = 512; bfCanvas.height = 320;
    const bfCtx = bfCanvas.getContext('2d');
    const grad = bfCtx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#facc15');
    grad.addColorStop(1, '#16a34a');
    bfCtx.fillStyle = grad;
    bfCtx.fillRect(0, 0, 512, 320);
    bfCtx.fillStyle = '#ffffff';
    bfCtx.font = '900 46px Bangers, sans-serif';
    bfCtx.textAlign = 'center';
    bfCtx.fillText('BOLSA FAMÍLIA', 256, 110);
    bfCtx.fillStyle = '#000000';
    bfCtx.font = 'bold 24px sans-serif';
    bfCtx.fillText('CAIXA ECONÔMICA FEDERAL', 256, 160);
    bfCtx.fillStyle = '#dc2626';
    bfCtx.font = 'bold 32px Bangers, sans-serif';
    bfCtx.fillText('SAQUE R$ 600,00 🥩', 256, 240);
    this.bolsaFamiliaTexture = new THREE.CanvasTexture(bfCanvas);

    // 4. Auxílio Brasil
    const auxCanvas = document.createElement('canvas');
    auxCanvas.width = 512; auxCanvas.height = 320;
    const auxCtx = auxCanvas.getContext('2d');
    const auxGrad = auxCtx.createLinearGradient(0, 0, 512, 320);
    auxGrad.addColorStop(0, '#0284c7');
    auxGrad.addColorStop(1, '#f59e0b');
    auxCtx.fillStyle = auxGrad;
    auxCtx.fillRect(0, 0, 512, 320);
    auxCtx.fillStyle = '#ffffff';
    auxCtx.font = '900 48px Bangers, sans-serif';
    auxCtx.textAlign = 'center';
    auxCtx.fillText('AUXÍLIO BRASIL', 256, 110);
    auxCtx.font = 'bold 24px sans-serif';
    auxCtx.fillText('GOVERNO FEDERAL 🇧🇷', 256, 160);
    auxCtx.fillStyle = '#1e1b4b';
    auxCtx.font = 'bold 32px Bangers, sans-serif';
    auxCtx.fillText('BENEFÍCIO APROVADO!', 256, 240);
    this.auxilioTexture = new THREE.CanvasTexture(auxCanvas);
  }
}

export const textureAtlas = new TextureAtlasManager();
