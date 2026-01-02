// Table Tennis Audio Manager

class TableTennisAudioManager {
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

  // Ball hit paddle (distinctive ping pong sound)
  hit() { this.playTone(1200, 0.04, 'square', 0.25); this.playTone(800, 0.02, 'sine', 0.15); }
  playHit() { this.hit(); }

  // Ball hit table
  bounce() { this.playTone(600, 0.03, 'sine', 0.2); }
  playBounce() { this.bounce(); }

  // Net hit
  net() { this.playTone(400, 0.1, 'triangle', 0.15); }
  playNet() { this.net(); }

  // Power shot / smash
  powerShot() { this.playTone(400, 0.08, 'sawtooth', 0.3); this.playTone(700, 0.1, 'square', 0.25); }
  smash() { this.powerShot(); }
  playSmash() { this.smash(); }

  // Perfect timing
  perfectHit() { this.playTone(1500, 0.06, 'sine', 0.25); setTimeout(() => this.playTone(1900, 0.06, 'sine', 0.2), 35); }

  // Miss
  miss() { this.playTone(200, 0.15, 'sawtooth', 0.15); }
  playMiss() { this.miss(); }

  // Point scored
  point() { this.playTone(700, 0.1, 'sine', 0.3); setTimeout(() => this.playTone(880, 0.1, 'sine', 0.3), 80); setTimeout(() => this.playTone(1050, 0.15, 'sine', 0.3), 160); }
  playPoint() { this.point(); }

  // Game won
  gameWon() { const notes = [700, 880, 1050, 1400]; notes.forEach((note, i) => { setTimeout(() => this.playTone(note, 0.18, 'sine', 0.3), i * 130); }); }
  playWin() { this.gameWon(); }

  // Match won
  matchWon() { const fanfare = [700, 880, 1050, 1200, 1400, 1750, 2100]; fanfare.forEach((note, i) => { setTimeout(() => this.playTone(note, 0.22, 'sine', 0.35), i * 100); }); setTimeout(() => { for (let i = 0; i < 5; i++) { setTimeout(() => this.playNoise(0.22, 0.1), i * 80); } }, 750); }

  // Match lost
  matchLost() { this.playTone(500, 0.25, 'sawtooth', 0.2); setTimeout(() => this.playTone(400, 0.25, 'sawtooth', 0.2), 160); setTimeout(() => this.playTone(300, 0.35, 'sawtooth', 0.15), 320); }

  // Power-up collected
  powerUp() { this.playTone(800, 0.08, 'sine', 0.25); setTimeout(() => this.playTone(1100, 0.08, 'sine', 0.25), 60); setTimeout(() => this.playTone(1500, 0.12, 'sine', 0.25), 120); }

  // Button click
  click() { this.playTone(1200, 0.04, 'sine', 0.15); }

  // Serve
  serve() { this.playTone(500, 0.1, 'square', 0.2); setTimeout(() => this.playTone(800, 0.05, 'sine', 0.15), 80); }

  // Crowd
  crowd() { this.playNoise(0.35, 0.08); }
}

export const tableTennisAudio = new TableTennisAudioManager();
