// Galaxy Rider Audio Manager

class GalaxyRiderAudio {
  private audioContext: AudioContext | null = null;
  private enabled = true;
  private musicEnabled = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  private playNoise(duration: number, volume = 0.1) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn('Noise play failed:', e);
    }
  }

  playJump() {
    this.playTone(300, 0.15, 'square', 0.2);
    setTimeout(() => this.playTone(400, 0.1, 'square', 0.15), 50);
  }

  playLand() {
    this.playNoise(0.1, 0.15);
    this.playTone(150, 0.1, 'triangle', 0.2);
  }

  playBounce() {
    this.playTone(500, 0.1, 'sine', 0.2);
    this.playTone(600, 0.08, 'sine', 0.15);
  }

  playBoost() {
    this.playTone(200, 0.3, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(400, 0.2, 'sawtooth', 0.1), 100);
  }

  playDeath() {
    this.playTone(400, 0.2, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(300, 0.2, 'sawtooth', 0.25), 100);
    setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.2), 200);
    this.playNoise(0.5, 0.1);
  }

  playFinish() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.2), i * 100);
    });
  }

  playCheckpoint() {
    this.playTone(440, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(660, 0.2, 'sine', 0.25), 100);
  }

  playCountdown() {
    this.playTone(440, 0.2, 'square', 0.15);
  }

  playGo() {
    this.playTone(880, 0.4, 'square', 0.2);
  }

  playBlackhole() {
    this.playTone(100, 0.5, 'sine', 0.2);
    this.playNoise(0.3, 0.05);
  }

  playGravityFlip() {
    this.playTone(300, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(500, 0.15, 'sine', 0.2), 75);
    setTimeout(() => this.playTone(700, 0.2, 'sine', 0.15), 150);
  }

  playMenuClick() {
    this.playTone(600, 0.08, 'sine', 0.15);
  }

  playMenuHover() {
    this.playTone(400, 0.05, 'sine', 0.1);
  }

  playNewBest() {
    const notes = [523, 659, 784, 880, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.2), i * 120);
    });
  }

  playEngineLoop() {
    if (!this.musicEnabled) return;
    this.playTone(80, 0.1, 'sawtooth', 0.05);
  }
}

export const galaxyAudio = new GalaxyRiderAudio();
