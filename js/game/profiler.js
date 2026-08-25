// js/game/profiler.js — Engine Telemetry & Profiler (?debug=1) para Medição Exata de Performance Before/After
export class EngineProfiler {
  constructor() {
    this.enabled = typeof window !== 'undefined' && (
      window.location.search.includes('debug=1') ||
      localStorage.getItem('runner_debug') === '1'
    );

    this.renderer = null;
    this.scene = null;
    this.domElement = null;

    // Métricas de Tempo e FPS
    this.tFrameStart = 0;
    this.tUpdateEnd = 0;
    this.tRenderEnd = 0;

    this.frameCount = 0;
    this.fps = 60;
    this.minFps = 999;
    this.maxFps = 0;
    this.avgFps = 60;
    this.fpsHistory = [];

    this.frameTime = 16.6;
    this.avgFrameTime = 16.6;
    this.maxSpikeMs = 0;
    this.stutterCount33ms = 0; // Frames que perderam 30fps
    this.stutterCount20ms = 0; // Frames que perderam 60fps

    this.jsUpdateTime = 0;
    this.gpuRenderTime = 0;
    this.avgJsTime = 0;
    this.avgGpuTime = 0;

    // Contadores de Hardware e Three.js
    this.drawCalls = 0;
    this.triangles = 0;
    this.geometries = 0;
    this.textures = 0;
    this.activeObjects = 0;
    this.pixelRatio = 1.0;
    this.heapUsedMb = 0;

    this.lastUiUpdate = 0;
    this.sampleHistory = [];

    if (this.enabled) {
      this.initOverlay();
      window.__RUNNER_PROFILER__ = this;
      console.log('🚀 [Engine Profiler] Ativado via ?debug=1. Use window.__RUNNER_PROFILER__.getReport() para ver os dados detalhados.');
    }
  }

  attach(renderer, scene) {
    if (!this.enabled) return;
    this.renderer = renderer;
    this.scene = scene;
  }

  initOverlay() {
    if (document.getElementById('runnerProfilerOverlay')) return;

    this.domElement = document.createElement('div');
    this.domElement.id = 'runnerProfilerOverlay';
    this.domElement.style.cssText = `
      position: fixed;
      top: 60px;
      left: 12px;
      z-index: 999999;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1.5px solid #38bdf8;
      border-radius: 12px;
      padding: 10px 14px;
      color: #f8fafc;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 11.5px;
      line-height: 1.45;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
      pointer-events: auto;
      user-select: none;
      min-width: 260px;
      max-width: 320px;
    `;

    this.domElement.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:4px; margin-bottom:6px;">
        <span style="font-weight:900; color:#38bdf8; letter-spacing:0.5px;">⚡ ENGINE PROFILER</span>
        <span id="profBottleneckBadge" style="font-size:10px; font-weight:bold; padding:2px 6px; border-radius:6px; background:#0284c7; color:#fff;">MEDINDO...</span>
      </div>
      <div id="profMetricsBody">
        <div style="display:flex; justify-content:space-between;"><span>FPS:</span><b id="profFps" style="color:#4ade80;">--</b></div>
        <div style="display:flex; justify-content:space-between;"><span>FPS Min / Avg:</span><span id="profFpsStats">-- / --</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Frame Time:</span><b id="profFrameTime">-- ms</b></div>
        <div style="display:flex; justify-content:space-between;"><span>Maior Pico (Spike):</span><b id="profMaxSpike" style="color:#f87171;">-- ms</b></div>
        <div style="display:flex; justify-content:space-between;"><span>Stutters (>20ms / >33ms):</span><span id="profStutters">0 / 0</span></div>
        <div style="border-top:1px dashed #334155; margin:5px 0;"></div>
        <div style="display:flex; justify-content:space-between;"><span>CPU (JS Logic):</span><span id="profCpuTime" style="color:#fde047;">-- ms</span></div>
        <div style="display:flex; justify-content:space-between;"><span>GPU (Render):</span><span id="profGpuTime" style="color:#60a5fa;">-- ms</span></div>
        <div style="border-top:1px dashed #334155; margin:5px 0;"></div>
        <div style="display:flex; justify-content:space-between;"><span>Draw Calls:</span><b id="profDrawCalls" style="color:#f59e0b;">--</b></div>
        <div style="display:flex; justify-content:space-between;"><span>Triângulos:</span><span id="profTriangles">--</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Geometrias / Texturas:</span><span id="profMemoryStats">-- / --</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Objetos na Cena:</span><span id="profSceneObjects">--</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Pixel Ratio:</span><span id="profPixelRatio">--</span></div>
        <div style="display:flex; justify-content:space-between;"><span>JS Heap:</span><span id="profJsHeap">-- MB</span></div>
      </div>
    `;

    document.body.appendChild(this.domElement);
  }

  beginFrame() {
    if (!this.enabled) return;
    this.tFrameStart = performance.now();
  }

  markUpdateEnd() {
    if (!this.enabled) return;
    this.tUpdateEnd = performance.now();
    this.jsUpdateTime = this.tUpdateEnd - this.tFrameStart;
  }

  markRenderEnd() {
    if (!this.enabled) return;
    this.tRenderEnd = performance.now();
    this.gpuRenderTime = this.tRenderEnd - this.tUpdateEnd;
  }

  endFrame() {
    if (!this.enabled) return;

    const now = performance.now();
    this.frameTime = now - this.tFrameStart;
    this.frameCount++;

    // Despreza os 3 primeiros frames de aquecimento do WebGL para não poluir o Min FPS
    if (this.frameCount > 3) {
      if (this.frameTime > this.maxSpikeMs) {
        this.maxSpikeMs = this.frameTime;
      }
      if (this.frameTime > 33.33) {
        this.stutterCount33ms++;
      } else if (this.frameTime > 20.0) {
        this.stutterCount20ms++;
      }
    }

    const instantFps = this.frameTime > 0 ? (1000 / this.frameTime) : 60;
    this.fpsHistory.push(instantFps);
    if (this.fpsHistory.length > 180) this.fpsHistory.shift();

    if (this.frameCount > 10) {
      if (instantFps < this.minFps) this.minFps = instantFps;
      if (instantFps > this.maxFps) this.maxFps = instantFps;
    }

    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    this.avgFps = sum / this.fpsHistory.length;
    this.avgFrameTime = 1000 / Math.max(1, this.avgFps);

    // Amortecimento suave para leitura de CPU / GPU
    this.avgJsTime = this.avgJsTime * 0.9 + this.jsUpdateTime * 0.1;
    this.avgGpuTime = this.avgGpuTime * 0.9 + this.gpuRenderTime * 0.1;

    // Atualiza leituras de hardware e Three.js a cada 150ms para evitar reflow
    if (now - this.lastUiUpdate > 150) {
      this.lastUiUpdate = now;
      this.collectThreeStats();
      this.updateUI();
    }
  }

  collectThreeStats() {
    if (this.renderer && this.renderer.info) {
      this.drawCalls = this.renderer.info.render.calls || 0;
      this.triangles = this.renderer.info.render.triangles || 0;
      this.geometries = this.renderer.info.memory.geometries || 0;
      this.textures = this.renderer.info.memory.textures || 0;
      this.pixelRatio = this.renderer.getPixelRatio ? this.renderer.getPixelRatio() : 1.0;
    }

    if (this.scene) {
      let count = 0;
      this.scene.traverse(() => { count++; });
      this.activeObjects = count;
    }

    if (typeof performance !== 'undefined' && performance.memory) {
      this.heapUsedMb = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
    } else {
      this.heapUsedMb = 'N/A';
    }

    // Registra amostra periódica no histórico para diagnóstico global
    if (this.sampleHistory.length < 500) {
      this.sampleHistory.push({
        time: (this.frameCount / 60).toFixed(1),
        fps: this.avgFps.toFixed(1),
        frameTime: this.avgFrameTime.toFixed(2),
        jsTime: this.avgJsTime.toFixed(2),
        gpuTime: this.avgGpuTime.toFixed(2),
        drawCalls: this.drawCalls,
        triangles: this.triangles,
        objects: this.activeObjects,
        heap: this.heapUsedMb
      });
    }
  }

  updateUI() {
    if (!this.domElement) return;

    const elFps = document.getElementById('profFps');
    const elFpsStats = document.getElementById('profFpsStats');
    const elFrameTime = document.getElementById('profFrameTime');
    const elMaxSpike = document.getElementById('profMaxSpike');
    const elStutters = document.getElementById('profStutters');
    const elCpuTime = document.getElementById('profCpuTime');
    const elGpuTime = document.getElementById('profGpuTime');
    const elDrawCalls = document.getElementById('profDrawCalls');
    const elTriangles = document.getElementById('profTriangles');
    const elMemoryStats = document.getElementById('profMemoryStats');
    const elSceneObjects = document.getElementById('profSceneObjects');
    const elPixelRatio = document.getElementById('profPixelRatio');
    const elJsHeap = document.getElementById('profJsHeap');
    const elBadge = document.getElementById('profBottleneckBadge');

    const currentFps = (1000 / Math.max(1, this.frameTime)).toFixed(0);
    if (elFps) {
      elFps.textContent = `${currentFps} FPS`;
      elFps.style.color = currentFps < 45 ? '#f87171' : currentFps < 55 ? '#facc15' : '#4ade80';
    }
    if (elFpsStats) elFpsStats.textContent = `${this.minFps === 999 ? '--' : this.minFps.toFixed(0)} min / ${this.avgFps.toFixed(0)} avg`;
    if (elFrameTime) elFrameTime.textContent = `${this.frameTime.toFixed(1)} ms`;
    if (elMaxSpike) elMaxSpike.textContent = `${this.maxSpikeMs.toFixed(1)} ms`;
    if (elStutters) elStutters.textContent = `${this.stutterCount20ms} / ${this.stutterCount33ms}`;
    if (elCpuTime) elCpuTime.textContent = `${this.avgJsTime.toFixed(1)} ms`;
    if (elGpuTime) elGpuTime.textContent = `${this.avgGpuTime.toFixed(1)} ms`;
    if (elDrawCalls) elDrawCalls.textContent = `${this.drawCalls}`;
    if (elTriangles) elTriangles.textContent = `${this.triangles.toLocaleString()}`;
    if (elMemoryStats) elMemoryStats.textContent = `${this.geometries} geo / ${this.textures} tex`;
    if (elSceneObjects) elSceneObjects.textContent = `${this.activeObjects}`;
    if (elPixelRatio) elPixelRatio.textContent = `${this.pixelRatio.toFixed(2)}x`;
    if (elJsHeap) elJsHeap.textContent = `${this.heapUsedMb} MB`;

    // Diagnóstico de Gargalo em Tempo Real
    if (elBadge) {
      if (this.avgJsTime > 12.0) {
        elBadge.textContent = '⚠️ CPU BOUND (JS)';
        elBadge.style.background = '#eab308';
        elBadge.style.color = '#000';
      } else if (this.avgGpuTime > 12.0 || this.drawCalls > 180) {
        elBadge.textContent = '⚠️ GPU / DRAW CALLS';
        elBadge.style.background = '#ef4444';
        elBadge.style.color = '#fff';
      } else if (this.stutterCount33ms > 5) {
        elBadge.textContent = '⚠️ GC STUTTER';
        elBadge.style.background = '#f97316';
        elBadge.style.color = '#fff';
      } else {
        elBadge.textContent = '✓ 60 FPS FLUID';
        elBadge.style.background = '#16a34a';
        elBadge.style.color = '#fff';
      }
    }
  }

  getReport() {
    return {
      status: 'BEFORE_OPTIMIZATION_BASELINE',
      fps: {
        avg: parseFloat(this.avgFps.toFixed(1)),
        min: parseFloat(this.minFps.toFixed(1)),
        max: parseFloat(this.maxFps.toFixed(1))
      },
      frameTimeMs: {
        avg: parseFloat(this.avgFrameTime.toFixed(2)),
        maxSpike: parseFloat(this.maxSpikeMs.toFixed(2)),
        stuttersOver20ms: this.stutterCount20ms,
        stuttersOver33ms: this.stutterCount33ms
      },
      timingBreakdownMs: {
        cpuJsLogic: parseFloat(this.avgJsTime.toFixed(2)),
        gpuRender: parseFloat(this.avgGpuTime.toFixed(2))
      },
      threeStats: {
        drawCalls: this.drawCalls,
        triangles: this.triangles,
        geometries: this.geometries,
        textures: this.textures,
        activeObjects: this.activeObjects,
        pixelRatio: this.pixelRatio
      },
      memory: {
        heapMb: this.heapUsedMb
      },
      bottleneckEvidence: (this.avgGpuTime > this.avgJsTime || this.drawCalls > 120)
        ? 'Gargalo Principal: DRAW CALLS & GPU FILLRATE (Postes e objetos individuais elevam draw calls acima de 150)'
        : 'Gargalo Principal: CPU/JS GARBAGE COLLECTION (Instanciação contínua de objetos no loop)'
    };
  }
}

export const profiler = new EngineProfiler();
