// js/game/audio.js — Gerenciador Central de Áudio (Web Audio API Pura com Sons de Trem e Metrô)
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambienceNode = null;
    this.ambienceGain = null;
    this.lastJumpTime = 0;
    this.lastSwitchTime = 0;
    this.lastTrainPassTime = 0;
    this.lastTrainHornTime = 0;
    this.initialized = false;
    this.activeAudios = [];
  }

  init() {
    if (this.initialized && this.ctx && this.ctx.state === 'running') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.ctx) this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API não suportada:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    else if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ambienceGain) {
      this.ambienceGain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, this.ctx ? this.ctx.currentTime : 0);
    }
    return this.isMuted;
  }

  // 1. PULO ("Flap / Spring Curto")
  playJump(isSuper = false) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastJumpTime < 0.04) return;
    this.lastJumpTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isSuper ? 'sawtooth' : 'triangle';
      const startFreq = isSuper ? 480 : 380;
      const endFreq = isSuper ? 960 : 780;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.07);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.095);
    } catch (e) {}
  }

  // 2. TROCA DE FAIXA (Swoosh Sutil)
  playSwipe() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastSwitchTime < 0.06) return;
    this.lastSwitchTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch (e) {}
  }

  // 3. DESLIZAR / SLIDE
  playSlide() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.14);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.15);
    } catch (e) {}
  }

  // 4. COLETAR MOEDA DE OURO
  playCoin() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.05); // E6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  // 5. COLETAR PICANHA (+5 BÔNUS)
  playPicanhaCollect() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);

        gain.gain.setValueAtTime(0.16, now + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.17);
      });
    } catch (e) {}
  }

  // 6. SOM DO METRÔ PASSANDO AO LADO (Suave e Realista)
  playTrainPass(volume = 0.12) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastTrainPassTime < 1.8) return;
    this.lastTrainPassTime = now;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 1.2);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.linearRampToValueAtTime(450, now + 0.4);
      filter.frequency.linearRampToValueAtTime(200, now + 1.2);
      filter.Q.setValueAtTime(2.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 1.25);
    } catch (e) {}
  }

  // 7. BUZINA SUAVE DE TREM DE METRÔ (Ao se aproximar na mesma faixa)
  playTrainHorn() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastTrainHornTime < 3.5) return;
    this.lastTrainHornTime = now;

    try {
      [277.18, 329.63, 415.30].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.58);
      });
    } catch (e) {}
  }

  // 8. POWER-UP ATIVADO
  playPowerup() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.24);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.27);
    } catch (e) {}
  }

  // 9. VINHETA DO INÍCIO DA CORRIDA ("FAZ O L" BAIXINHO)
  playStartVinheta() {
    if (this.isMuted) return;
    try {
      this.stopAllVoiceAudios();
      const audio = new Audio('audios/faz-o-l-vinheta.mp3');
      audio.volume = 0.25; // Volume bem baixo no início
      this.activeAudios.push(audio);
      audio.play().catch(() => {});
    } catch (e) {}
  }

  // 10. IMPACTO / MORTE (TOCA "PENSE NO LULA" DO SEGUNDO 6 AO 10)
  playCrash() {
    if (this.isMuted) return;
    try {
      this.stopAllVoiceAudios();
      const deathAudio = new Audio('audios/pense-no-lula.mp3');
      deathAudio.volume = 0.90;

      const onCanPlay = () => {
        deathAudio.currentTime = 6.0;
        deathAudio.play().catch(() => {});
      };

      if (deathAudio.readyState >= 2) {
        onCanPlay();
      } else {
        deathAudio.addEventListener('canplay', onCanPlay, { once: true });
        deathAudio.currentTime = 6.0;
        deathAudio.play().catch(() => {});
      }

      // Interrompe com precisão no segundo 10
      const stopListener = () => {
        if (deathAudio.currentTime >= 10.0) {
          deathAudio.pause();
          deathAudio.removeEventListener('timeupdate', stopListener);
        }
      };
      deathAudio.addEventListener('timeupdate', stopListener);

      setTimeout(() => {
        try {
          deathAudio.pause();
          deathAudio.removeEventListener('timeupdate', stopListener);
        } catch (e) {}
      }, 4200);

      this.activeAudios.push(deathAudio);
    } catch (e) {}

    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  // 11. ENCERRA TODOS OS ÁUDIOS DE VOZ / VINHETAS ATIVOS (Ao reiniciar, sair ou abrir menus)
  stopAllVoiceAudios() {
    if (Array.isArray(this.activeAudios)) {
      this.activeAudios.forEach(audio => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {}
      });
      this.activeAudios = [];
    }
  }

  // 12. SOM AMBIENTE DA FAVELA / CIDADE
  startAmbience() {
    if (this.ambienceNode) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.14;
      }

      this.ambienceNode = this.ctx.createBufferSource();
      this.ambienceNode.buffer = buffer;
      this.ambienceNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, now);

      this.ambienceNode.connect(filter);
      filter.connect(this.ambienceGain);
      this.ambienceGain.connect(this.ctx.destination);

      this.ambienceNode.start(0);
    } catch (e) {}
  }

  stopAmbience() {
    if (this.ambienceNode) {
      try {
        this.ambienceNode.stop();
        this.ambienceNode.disconnect();
      } catch (e) {}
      this.ambienceNode = null;
      this.ambienceGain = null;
    }
  }
}

export const gameAudio = new GameAudio();
