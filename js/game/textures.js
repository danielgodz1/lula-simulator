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
    this.init();
  }

  init() {
    this.createUnifiedAtlas();
    this.createSpecialTextures();
    this.createMorroParallaxTexture();
    this.createGoldCoinTexture();
    this.createSoftShadowTexture();
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
}

export const textureAtlas = new TextureAtlasManager();
