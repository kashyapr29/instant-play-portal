// Badminton Smash Audio Manager

class BadmintonAudioManager {
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

  // Shuttlecock hit sound (lighter, higher pitch than tennis)
  hit() {
    this.playTone(1000, 0.06, 'square', 0.2);
    this.playNoise(0.03, 0.1);
  }

  // Power smash
  smash() {
    this.playTone(500, 0.1, 'sawtooth', 0.35);
    this.playTone(800, 0.12, 'square', 0.3);
    this.playNoise(0.08, 0.25);
  }

  // Shuttlecock bounce/drop
  drop() {
    this.playTone(400, 0.04, 'sine', 0.12);
  }

  // Perfect timing
  perfectHit() {
    this.playTone(1400, 0.08, 'sine', 0.25);
    setTimeout(() => this.playTone(1800, 0.08, 'sine', 0.2), 40);
  }

  // Miss
  miss() {
    this.playTone(180, 0.18, 'sawtooth', 0.15);
  }

  // Point scored
  point() {
    this.playTone(600, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(750, 0.1, 'sine', 0.3), 90);
    setTimeout(() => this.playTone(900, 0.15, 'sine', 0.3), 180);
  }

  // Game won
  gameWon() {
    const notes = [600, 750, 900, 1200];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.2, 'sine', 0.3), i * 140);
    });
  }

  // Match won
  matchWon() {
    const fanfare = [600, 750, 900, 1050, 1200, 1500, 1800];
    fanfare.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.25, 'sine', 0.35), i * 110);
    });
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => this.playNoise(0.25, 0.1), i * 90);
      }
    }, 800);
  }

  // Match lost
  matchLost() {
    this.playTone(450, 0.3, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(350, 0.3, 'sawtooth', 0.2), 180);
    setTimeout(() => this.playTone(250, 0.4, 'sawtooth', 0.15), 360);
  }

  // Power-up collected
  powerUp() {
    this.playTone(700, 0.1, 'sine', 0.25);
    setTimeout(() => this.playTone(1000, 0.1, 'sine', 0.25), 70);
    setTimeout(() => this.playTone(1400, 0.15, 'sine', 0.25), 140);
  }

  // Button click
  click() {
    this.playTone(1100, 0.04, 'sine', 0.15);
  }

  // Serve
  serve() {
    this.playTone(600, 0.12, 'square', 0.2);
    this.playNoise(0.08, 0.15);
  }

  // Crowd
  crowd() {
    this.playNoise(0.4, 0.08);
  }
}

export const badmintonAudio = new BadmintonAudioManager();
