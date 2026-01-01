// Tennis Hero Audio Manager

class TennisAudioManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported
    }
  }

  private playNoise(duration: number, volume: number = 0.1) {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getContext();
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
      
      source.start(ctx.currentTime);
    } catch (e) {
      // Audio not supported
    }
  }

  // Ball hit sound
  hit() {
    this.playTone(800, 0.08, 'square', 0.2);
    this.playNoise(0.05, 0.15);
  }

  // Power hit
  powerHit() {
    this.playTone(400, 0.1, 'sawtooth', 0.3);
    this.playTone(600, 0.15, 'square', 0.25);
    this.playNoise(0.08, 0.2);
  }

  // Ball bounce
  bounce() {
    this.playTone(300, 0.05, 'sine', 0.15);
  }

  // Perfect timing
  perfectHit() {
    this.playTone(1200, 0.1, 'sine', 0.25);
    setTimeout(() => this.playTone(1500, 0.1, 'sine', 0.2), 50);
  }

  // Miss
  miss() {
    this.playTone(150, 0.2, 'sawtooth', 0.15);
  }

  // Point scored
  point() {
    this.playTone(523, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.3), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.3), 200);
  }

  // Game won
  gameWon() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.2, 'sine', 0.3), i * 150);
    });
  }

  // Match won
  matchWon() {
    const fanfare = [523, 659, 784, 880, 1047, 1319, 1568];
    fanfare.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.25, 'sine', 0.35), i * 120);
    });
    // Crowd cheer simulation
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => this.playNoise(0.3, 0.1), i * 100);
      }
    }, 900);
  }

  // Match lost
  matchLost() {
    this.playTone(400, 0.3, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(300, 0.3, 'sawtooth', 0.2), 200);
    setTimeout(() => this.playTone(200, 0.4, 'sawtooth', 0.15), 400);
  }

  // Power-up collected
  powerUp() {
    this.playTone(600, 0.1, 'sine', 0.25);
    setTimeout(() => this.playTone(900, 0.1, 'sine', 0.25), 80);
    setTimeout(() => this.playTone(1200, 0.15, 'sine', 0.25), 160);
  }

  // Button click
  click() {
    this.playTone(1000, 0.05, 'sine', 0.15);
  }

  // Serve
  serve() {
    this.playTone(500, 0.15, 'square', 0.25);
    this.playNoise(0.1, 0.2);
  }

  // Ace
  ace() {
    this.playTone(1000, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(1200, 0.1, 'sine', 0.3), 80);
    setTimeout(() => this.playTone(1500, 0.2, 'sine', 0.35), 160);
    // Quick crowd burst
    setTimeout(() => this.playNoise(0.2, 0.15), 300);
  }

  // Crowd ambient (short burst)
  crowd() {
    this.playNoise(0.5, 0.08);
  }
}

export const tennisAudio = new TennisAudioManager();
