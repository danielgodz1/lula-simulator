// js/ghost-recorder.js — Gravador e Reprodutor da Trajetória do Ghost Pessoal (100% Local Replay)

const GHOST_STORAGE_KEY = 'flappy_ghost_best_trajectory_v1';

export class GhostRecorder {
  constructor() {
    this.isRecording = false;
    this.currentPoints = [];
    this.startTime = 0;
    this.lastSampleTime = 0;
    this.bestTrajectory = this.loadBestTrajectory();
  }

  loadBestTrajectory() {
    try {
      const raw = localStorage.getItem(GHOST_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch(e) {}
    return null;
  }

  startSession() {
    this.isRecording = true;
    this.currentPoints = [];
    this.startTime = performance.now();
    this.lastSampleTime = 0;
    this.bestTrajectory = this.loadBestTrajectory();
  }

  recordFrame(yRatio) {
    if (!this.isRecording) return;
    const now = performance.now();
    const elapsedSec = (now - this.startTime) / 1000;

    // Amostra a cada ~40ms (25 samples/segundo) para máxima precisão com pegada minúscula de memória (~2KB)
    if (elapsedSec - this.lastSampleTime >= 0.04) {
      this.currentPoints.push([parseFloat(elapsedSec.toFixed(3)), parseFloat(yRatio.toFixed(4))]);
      this.lastSampleTime = elapsedSec;
    }
  }

  finishSession(finalScore, charId = 'lula') {
    if (!this.isRecording) return;
    this.isRecording = false;

    if (finalScore >= 5 && this.currentPoints.length > 10) {
      const previousBestScore = this.bestTrajectory?.score || 0;
      if (finalScore >= previousBestScore) {
        const payload = {
          score: finalScore,
          charId,
          points: this.currentPoints,
          recordedAt: new Date().toISOString()
        };
        try {
          localStorage.setItem(GHOST_STORAGE_KEY, JSON.stringify(payload));
          this.bestTrajectory = payload;
        } catch(e) {}
      }
    }
  }

  getGhostYRatio(elapsedSec) {
    if (!this.bestTrajectory || !Array.isArray(this.bestTrajectory.points) || this.bestTrajectory.points.length === 0) {
      return null;
    }

    const pts = this.bestTrajectory.points;
    if (elapsedSec <= pts[0][0]) return pts[0][1];
    if (elapsedSec >= pts[pts.length - 1][0]) {
      // Se a partida atual ultrapassou a melhor pontuação histórica, o Ghost já cruzou o fim!
      return null;
    }

    // Busca binária rápida para interpolação linear suave
    let low = 0, high = pts.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (pts[mid][0] < elapsedSec) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx = Math.max(1, low);
    if (idx >= pts.length) return null;

    const pPrev = pts[idx - 1];
    const pNext = pts[idx];
    const tSpan = pNext[0] - pPrev[0];
    if (tSpan <= 0) return pPrev[1];

    const alpha = (elapsedSec - pPrev[0]) / tSpan;
    return pPrev[1] + (pNext[1] - pPrev[1]) * alpha;
  }

  drawGhost(ctx, W, H, elapsedSec, ghostSpriteImg) {
    const yRatio = this.getGhostYRatio(elapsedSec);
    if (yRatio === null) return;

    const ghostX = W * 0.28; // Mesma posição horizontal X do personagem
    const ghostY = yRatio * H;
    const ghostW = Math.round(W * 0.088);
    const ghostH = Math.round(H * 0.052);

    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;

    if (ghostSpriteImg && ghostSpriteImg.complete) {
      ctx.drawImage(ghostSpriteImg, ghostX - ghostW / 2, ghostY - ghostH / 2, ghostW, ghostH);
    } else {
      // Fallback em cápsula neon translúcida
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(ghostX, ghostY, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Badge sutil de Ghost
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('👻 RECORDE', ghostX, ghostY - ghostH / 2 - 6);

    ctx.restore();
  }
}

export const ghostRecorder = new GhostRecorder();
