// Professional Audio System for Ninja Jump

class NinjaAudioManager {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private masterVolume: number = 0.6;

  private ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  isEnabled() {
    return this.soundEnabled;
  }

  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.ensureContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      const vol = volume * this.masterVolume;
      gainNode.gain.setValueAtTime(vol, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silently fail if audio is not available
    }
  }

  private playNoise(duration: number, volume: number = 0.2) {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.ensureContext();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      source.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      const vol = volume * this.masterVolume;
      gainNode.gain.setValueAtTime(vol, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      source.start();
      source.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silently fail
    }
  }

  // Ninja movement sounds
  jump() {
    this.playTone(400, 0.08, 'sine', 0.3);
    this.playTone(600, 0.06, 'sine', 0.2);
  }

  wallJump() {
    this.playTone(500, 0.1, 'sine', 0.4);
    this.playTone(700, 0.08, 'triangle', 0.3);
    this.playNoise(0.03, 0.1);
  }

  land() {
    this.playNoise(0.05, 0.2);
    this.playTone(150, 0.08, 'sine', 0.2);
  }

  dash() {
    this.playTone(800, 0.1, 'sawtooth', 0.2);
    this.playTone(1200, 0.05, 'sine', 0.3);
  }

  wallSlide() {
    this.playNoise(0.02, 0.05);
  }

  // Collectible sounds
  collectCoin() {
    this.playTone(880, 0.1, 'sine', 0.3);
    this.playTone(1100, 0.08, 'sine', 0.25);
  }

  collectGem() {
    this.playTone(1000, 0.15, 'sine', 0.4);
    setTimeout(() => this.playTone(1200, 0.1, 'sine', 0.3), 50);
    setTimeout(() => this.playTone(1400, 0.12, 'sine', 0.35), 100);
  }

  collectScroll() {
    this.playTone(600, 0.2, 'triangle', 0.3);
    this.playTone(800, 0.15, 'sine', 0.25);
  }

  powerUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.12, 'sine', 0.35), i * 60);
    });
  }

  // Danger sounds
  hit() {
    this.playTone(200, 0.2, 'sawtooth', 0.4);
    this.playNoise(0.1, 0.3);
  }

  death() {
    const notes = [400, 350, 300, 250, 200, 150];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sawtooth', 0.35), i * 120);
    });
  }

  enemyDefeat() {
    this.playTone(600, 0.08, 'square', 0.3);
    this.playTone(800, 0.1, 'sine', 0.25);
    this.playNoise(0.08, 0.15);
  }

  // Level sounds
  checkpoint() {
    this.playTone(523, 0.15, 'sine', 0.4);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.4), 100);
    setTimeout(() => this.playTone(1047, 0.2, 'sine', 0.45), 200);
  }

  levelComplete() {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319];
    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.4), i * 100);
    });
  }

  gameOver() {
    const notes = [400, 350, 300, 250, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sawtooth', 0.3), i * 150);
    });
  }

  newHighScore() {
    const melody = [523, 659, 784, 880, 1047, 1319, 1568];
    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.45), i * 80);
    });
  }

  // UI sounds
  menuClick() {
    this.playTone(700, 0.05, 'sine', 0.25);
  }

  menuHover() {
    this.playTone(500, 0.03, 'sine', 0.1);
  }

  starEarned() {
    this.playTone(1000, 0.15, 'sine', 0.4);
    this.playTone(1200, 0.1, 'sine', 0.3);
  }

  comboSound(combo: number) {
    const baseFreq = 400 + (combo * 80);
    this.playTone(Math.min(baseFreq, 1200), 0.08, 'sine', 0.3);
  }
}

export const ninjaAudioManager = new NinjaAudioManager();
