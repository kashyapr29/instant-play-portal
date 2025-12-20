// Professional Audio System for Breakout

class AudioManager {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private masterVolume: number = 0.5;

  private ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      filter.frequency.value = 1000;

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

  paddleHit() {
    this.playTone(400, 0.1, 'sine', 0.4);
    this.playTone(600, 0.05, 'sine', 0.2);
  }

  wallHit() {
    this.playTone(300, 0.08, 'triangle', 0.2);
  }

  brickBreak(combo: number = 1) {
    const baseFreq = 500 + (combo * 50);
    this.playTone(baseFreq, 0.1, 'square', 0.3);
    this.playTone(baseFreq * 1.5, 0.15, 'sine', 0.2);
    this.playNoise(0.05, 0.1);
  }

  brickDamage() {
    this.playTone(200, 0.05, 'sawtooth', 0.2);
  }

  explosion() {
    this.playNoise(0.3, 0.4);
    this.playTone(100, 0.2, 'sawtooth', 0.3);
    this.playTone(50, 0.3, 'sine', 0.4);
  }

  powerUp() {
    this.playTone(600, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(800, 0.1, 'sine', 0.3), 50);
    setTimeout(() => this.playTone(1000, 0.15, 'sine', 0.4), 100);
  }

  lifeLost() {
    this.playTone(300, 0.15, 'sawtooth', 0.4);
    setTimeout(() => this.playTone(200, 0.2, 'sawtooth', 0.3), 100);
    setTimeout(() => this.playTone(100, 0.3, 'sawtooth', 0.2), 200);
  }

  gameOver() {
    const notes = [400, 350, 300, 250, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sawtooth', 0.3), i * 150);
    });
  }

  levelComplete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.4), i * 100);
    });
    setTimeout(() => {
      this.playTone(1047, 0.4, 'sine', 0.5);
      this.playTone(784, 0.4, 'sine', 0.3);
    }, 400);
  }

  menuClick() {
    this.playTone(800, 0.05, 'sine', 0.2);
  }

  menuHover() {
    this.playTone(600, 0.03, 'sine', 0.1);
  }

  countdownTick() {
    this.playTone(440, 0.1, 'sine', 0.3);
  }

  countdownGo() {
    this.playTone(880, 0.2, 'sine', 0.5);
    this.playTone(1100, 0.15, 'sine', 0.3);
  }
}

export const audioManager = new AudioManager();
