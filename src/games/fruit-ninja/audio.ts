// Fruit Ninja Audio Manager

class FruitNinjaAudio {
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

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    delay: number = 0
  ) {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.value = frequency;

      const startTime = ctx.currentTime + delay;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  private playNoise(duration: number, volume: number = 0.2) {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      source.start();
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  slice() {
    // Satisfying slice sound - quick swoosh
    this.playTone(800, 0.08, 'sawtooth', 0.15);
    this.playTone(600, 0.1, 'triangle', 0.1, 0.02);
  }

  fruitSliced(comboCount: number = 1) {
    // Juicy splat sound with pitch based on combo
    const baseFreq = 200 + comboCount * 30;
    this.playTone(baseFreq, 0.15, 'sine', 0.25);
    this.playNoise(0.1, 0.15);
    
    // Higher pitched "pop" for satisfaction
    this.playTone(baseFreq * 2, 0.08, 'square', 0.1, 0.05);
  }

  bombExplode() {
    // Deep explosion
    this.playTone(80, 0.4, 'sawtooth', 0.4);
    this.playTone(60, 0.5, 'square', 0.3, 0.05);
    this.playNoise(0.6, 0.4);
    
    // Rumble
    for (let i = 0; i < 5; i++) {
      this.playTone(40 + Math.random() * 40, 0.1, 'sine', 0.2, i * 0.08);
    }
  }

  fruitMissed() {
    // Sad descending tone
    this.playTone(400, 0.1, 'sine', 0.2);
    this.playTone(300, 0.15, 'sine', 0.15, 0.08);
    this.playTone(200, 0.2, 'sine', 0.1, 0.18);
  }

  combo(count: number) {
    // Ascending chime based on combo count
    const baseFreq = 400 + count * 50;
    this.playTone(baseFreq, 0.1, 'sine', 0.2);
    this.playTone(baseFreq * 1.25, 0.1, 'sine', 0.2, 0.05);
    this.playTone(baseFreq * 1.5, 0.15, 'sine', 0.25, 0.1);
  }

  gameStart() {
    // Exciting start sound
    this.playTone(523, 0.1, 'sine', 0.3);
    this.playTone(659, 0.1, 'sine', 0.3, 0.1);
    this.playTone(784, 0.15, 'sine', 0.35, 0.2);
    this.playTone(1047, 0.2, 'sine', 0.4, 0.3);
  }

  gameOver() {
    // Dramatic game over
    this.playTone(400, 0.2, 'sawtooth', 0.3);
    this.playTone(350, 0.25, 'sawtooth', 0.25, 0.15);
    this.playTone(300, 0.3, 'sawtooth', 0.2, 0.35);
    this.playTone(200, 0.5, 'sawtooth', 0.3, 0.55);
  }

  newHighScore() {
    // Victory fanfare
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.15, 'sine', 0.3, i * 0.12);
    });
  }

  menuClick() {
    this.playTone(600, 0.05, 'sine', 0.2);
  }

  criticalSlice() {
    // Perfect timing slice
    this.playTone(800, 0.1, 'sine', 0.3);
    this.playTone(1000, 0.1, 'sine', 0.3, 0.05);
    this.playTone(1200, 0.15, 'sine', 0.35, 0.1);
    this.playNoise(0.1, 0.2);
  }
}

export const audioManager = new FruitNinjaAudio();
