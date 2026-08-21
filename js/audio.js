// js/audio.js — Sistema de Áudio Centralizado com Web Audio API Pura
// Projetado para alta performance, zero latência e sem sobreposição acumulada

class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambienceNode = null;
    this.ambienceGain = null;
    this.lastJumpTime = 0;
    this.initialized = false;
  }

  // Inicializa o contexto de áudio na primeira interação do usuário
  init() {
    if (this.initialized && this.ctx && this.ctx.state === 'running') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.ctx) {
          this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API não suportada ou bloqueada:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ambienceGain) {
      this.ambienceGain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, this.ctx ? this.ctx.currentTime : 0);
    }
    return this.isMuted;
  }

  // 1. EFEITO DE PULO FLAPPY BIRD / EMPRESÁRIO ("Flap / Bip Curto")
  // Sem loop, com debounce e reset instantâneo para não travar em pulos rápidos seguidos
  playJump() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Debounce de 40ms para evitar cliques mecânicos múltiplos
    if (now - this.lastJumpTime < 0.04) return;
    this.lastJumpTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle'; // Som arredondado estilo arcade
      // Variação de frequência rápida de 380Hz para 780Hz em 0.07 segundos (estilo Flappy clássico)
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);

      // Envelope rápido para não deixar cauda ou sobreposição
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.085);
    } catch (e) {
      // Ignora silenciosamente se o contexto estiver ocupado
    }
  }

  // 2. EFEITO DE DESLIZE / SLIDE / AGACHAMENTO
  playSlide() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Ruído filtrado simulando o atrito rápido do sapato/chão
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.14);
      filter.Q.setValueAtTime(3, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.15);
    } catch (e) {}
  }

  // 3. EFEITO DE COLETAR MOEDA (Dois tons brilhantes)
  playCoin() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // Nota B5
      osc.frequency.setValueAtTime(1318.51, now + 0.05); // Nota E6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  // 4. EFEITO DE COLETAR MALETA DE DINHEIRO (Acorde de Sucesso)
  playBriefcase() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // Dó maior arpegiado (C5, E5, G5, C6)
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.15, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.19);
      });
    } catch (e) {}
  }

  // 5. EFEITO DE PONTO / PICANHA (Flappy Bird Point Ding)
  playPoint() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  // Compatibilidade com código legado
  playPicanhaMemeSound() {
    this.playPoint();
  }

  // 6. EFEITO DE IMPACTO / COLISÃO / GAME OVER (Curto e não intrusivo)
  playCollision() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Baixo com queda de frequência rápida
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  playGameOver() {
    this.playCollision();
  }

  // Substituição para o som legado de morte sem repetição
  playLulaNeymarDeath() {
    this.playCollision();
  }

  // 7. SOM AMBIENTE URBANO CONTÍNUO (Vento / Tráfego suave em volume baixo)
  startAmbienceCity() {
    if (this.ambienceNode) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Gera 2 segundos de ruído rosa suave em loop
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.15;
      }

      this.ambienceNode = this.ctx.createBufferSource();
      this.ambienceNode.buffer = buffer;
      this.ambienceNode.loop = true;

      // Filtro passa-baixa para dar sensação de rua e trânsito distante
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, now);

      this.ambienceNode.connect(filter);
      filter.connect(this.ambienceGain);
      this.ambienceGain.connect(this.ctx.destination);

      this.ambienceNode.start(0);
    } catch (e) {
      console.warn('Erro ao iniciar áudio ambiente:', e);
    }
  }

  stopAmbienceCity() {
    if (this.ambienceNode) {
      try {
        this.ambienceNode.stop();
        this.ambienceNode.disconnect();
      } catch (e) {}
      this.ambienceNode = null;
      this.ambienceGain = null;
    }
  }

  // 8. EFEITO DE BUZINA DE TREM (Dois tons metálicos de trem de metrô)
  playTrainHorn() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [311.13, 370.0, 466.16].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.68);
      });
    } catch (e) {}
  }

  // 9. EFEITO DE POWER-UP (Ativação de Super Tênis / Ímã)
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
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.29);
    } catch (e) {}
  }

  // 10. ÁUDIOS CUSTOMIZADOS DO JOGO (MP3 / MPEG)
  playBrasilIntro() {
    if (this.isMuted) return;
    try {
      const audio = new Audio('audios/brasilbrasil.mp3');
      audio.volume = 0.20;
      audio.play().catch(() => {
        const alt = new Audio('audios/brasilbrasi.mp3');
        alt.volume = 0.20;
        alt.play().catch(() => {});
      });
    } catch (e) {}
  }

  playBestaEnjaulada() {
    if (this.isMuted) return;
    try {
      if (this.currentBestaAudio) {
        this.currentBestaAudio.pause();
      }
      this.currentBestaAudio = new Audio('audios/o-homem-uma-maquina-uma-besta-enjaulada.mp3');
      this.currentBestaAudio.volume = 0.70;
      this.currentBestaAudio.play().catch(() => {});
    } catch (e) {}
  }

  playLulaDeathAudio() {
    if (this.isMuted) return;
    try {
      const audio = new Audio('audios/ehsoissoacabou.mpeg');
      audio.volume = 0.75;
      audio.play().catch(() => {
        const alt = new Audio('audios/ehsoissoacabou.mp3');
        alt.volume = 0.75;
        alt.play().catch(() => {
          this.playLulaNeymarDeath();
        });
      });
    } catch (e) {
      this.playLulaNeymarDeath();
    }
  }

  playNoAuraDeathAudio() {
    if (this.isMuted) return;
    try {
      const audio = new Audio('audios/voce-nao-tem-aura.mp3');
      audio.volume = 0.75;
      audio.play().catch(() => {
        this.playLulaNeymarDeath();
      });
    } catch (e) {
      this.playLulaNeymarDeath();
    }
  }

  // Síntese de fala opcional (SpeechSynthesis API)
  speak(text, rate = 1.0, pitch = 1.0) {
    if (this.isMuted || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 0.7;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }
}

export const sounds = new AudioManager();
