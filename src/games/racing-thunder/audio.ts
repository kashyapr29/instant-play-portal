// Racing Thunder - Audio Module

type SoundType = 
  | 'engine_idle' | 'engine_rev' | 'engine_high'
  | 'nitro' | 'nitro_end'
  | 'collision' | 'crash'
  | 'powerup' | 'coin'
  | 'countdown' | 'race_start' | 'race_finish'
  | 'lap_complete' | 'position_up' | 'position_down'
  | 'drift' | 'brake'
  | 'menu_select' | 'menu_back' | 'purchase' | 'upgrade'
  | 'win' | 'lose';

class RacingAudio {
  private audioContext: AudioContext | null = null;
  private enabled = true;
  private musicEnabled = true;
  private engineOscillator: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private currentEngineSpeed = 0;

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopEngine();
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
  }

  private createOscillator(
    frequency: number,
    type: OscillatorType = 'sine',
    duration: number = 0.1,
    volume: number = 0.3
  ) {
    if (!this.enabled) return;
    const ctx = this.init();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  private createNoise(duration: number, volume: number = 0.2) {
    if (!this.enabled) return;
    const ctx = this.init();
    
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    source.start();
  }

  startEngine() {
    if (!this.enabled || this.engineOscillator) return;
    const ctx = this.init();
    
    this.engineOscillator = ctx.createOscillator();
    this.engineGain = ctx.createGain();
    
    this.engineOscillator.type = 'sawtooth';
    this.engineOscillator.frequency.setValueAtTime(60, ctx.currentTime);
    
    this.engineOscillator.connect(this.engineGain);
    this.engineGain.connect(ctx.destination);
    
    this.engineGain.gain.setValueAtTime(0.05, ctx.currentTime);
    this.engineOscillator.start();
  }

  updateEngine(speedPercent: number) {
    if (!this.enabled || !this.engineOscillator || !this.engineGain) return;
    const ctx = this.init();
    
    this.currentEngineSpeed = speedPercent;
    const frequency = 60 + speedPercent * 200;
    const volume = 0.03 + speedPercent * 0.07;
    
    this.engineOscillator.frequency.setTargetAtTime(frequency, ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
  }

  stopEngine() {
    if (this.engineOscillator) {
      try {
        this.engineOscillator.stop();
      } catch (e) {}
      this.engineOscillator = null;
    }
    if (this.engineGain) {
      this.engineGain = null;
    }
  }

  play(sound: SoundType) {
    if (!this.enabled) return;
    
    switch (sound) {
      case 'engine_idle':
        this.createOscillator(60, 'sawtooth', 0.5, 0.05);
        break;
      case 'engine_rev':
        this.createOscillator(120, 'sawtooth', 0.3, 0.1);
        break;
      case 'nitro':
        this.createOscillator(200, 'sawtooth', 0.8, 0.15);
        this.createNoise(0.8, 0.2);
        break;
      case 'nitro_end':
        this.createOscillator(150, 'sawtooth', 0.3, 0.1);
        break;
      case 'collision':
        this.createNoise(0.2, 0.4);
        this.createOscillator(100, 'square', 0.1, 0.3);
        break;
      case 'crash':
        this.createNoise(0.5, 0.6);
        this.createOscillator(80, 'square', 0.3, 0.4);
        break;
      case 'powerup':
        this.createOscillator(600, 'sine', 0.1, 0.2);
        setTimeout(() => this.createOscillator(800, 'sine', 0.1, 0.2), 100);
        setTimeout(() => this.createOscillator(1000, 'sine', 0.15, 0.2), 200);
        break;
      case 'coin':
        this.createOscillator(800, 'sine', 0.1, 0.15);
        setTimeout(() => this.createOscillator(1200, 'sine', 0.1, 0.15), 80);
        break;
      case 'countdown':
        this.createOscillator(440, 'sine', 0.2, 0.3);
        break;
      case 'race_start':
        this.createOscillator(880, 'sine', 0.5, 0.4);
        break;
      case 'race_finish':
        for (let i = 0; i < 5; i++) {
          setTimeout(() => this.createOscillator(440 + i * 110, 'sine', 0.2, 0.3), i * 100);
        }
        break;
      case 'lap_complete':
        this.createOscillator(660, 'sine', 0.15, 0.2);
        setTimeout(() => this.createOscillator(880, 'sine', 0.2, 0.2), 150);
        break;
      case 'position_up':
        this.createOscillator(500, 'sine', 0.1, 0.15);
        setTimeout(() => this.createOscillator(700, 'sine', 0.15, 0.15), 100);
        break;
      case 'position_down':
        this.createOscillator(400, 'sine', 0.1, 0.15);
        setTimeout(() => this.createOscillator(300, 'sine', 0.15, 0.15), 100);
        break;
      case 'drift':
        this.createNoise(0.3, 0.15);
        break;
      case 'brake':
        this.createNoise(0.2, 0.1);
        this.createOscillator(300, 'square', 0.2, 0.1);
        break;
      case 'menu_select':
        this.createOscillator(600, 'sine', 0.1, 0.15);
        break;
      case 'menu_back':
        this.createOscillator(400, 'sine', 0.1, 0.15);
        break;
      case 'purchase':
        for (let i = 0; i < 3; i++) {
          setTimeout(() => this.createOscillator(800 + i * 200, 'sine', 0.15, 0.2), i * 100);
        }
        break;
      case 'upgrade':
        this.createOscillator(440, 'sine', 0.1, 0.2);
        setTimeout(() => this.createOscillator(660, 'sine', 0.1, 0.2), 100);
        setTimeout(() => this.createOscillator(880, 'sine', 0.2, 0.25), 200);
        break;
      case 'win':
        const winNotes = [523, 659, 784, 1047];
        winNotes.forEach((freq, i) => {
          setTimeout(() => this.createOscillator(freq, 'sine', 0.3, 0.25), i * 150);
        });
        break;
      case 'lose':
        this.createOscillator(200, 'sawtooth', 0.4, 0.2);
        setTimeout(() => this.createOscillator(150, 'sawtooth', 0.5, 0.2), 200);
        break;
    }
  }
}

export const racingAudio = new RacingAudio();
