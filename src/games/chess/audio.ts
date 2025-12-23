// Chess Audio Manager

class ChessAudioManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

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
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2) {
    if (!this.enabled) return;

    try {
      const ctx = this.ensureContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silently fail
    }
  }

  move() {
    this.playTone(400, 0.08, 'triangle', 0.15);
  }

  capture() {
    this.playTone(300, 0.1, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(200, 0.08, 'sine', 0.15), 50);
  }

  check() {
    this.playTone(600, 0.15, 'sine', 0.25);
    setTimeout(() => this.playTone(800, 0.1, 'sine', 0.2), 100);
  }

  checkmate() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.3), i * 120);
    });
  }

  castle() {
    this.playTone(350, 0.1, 'triangle', 0.2);
    setTimeout(() => this.playTone(450, 0.1, 'triangle', 0.2), 80);
  }

  select() {
    this.playTone(500, 0.05, 'sine', 0.1);
  }

  invalid() {
    this.playTone(200, 0.15, 'sawtooth', 0.15);
  }

  gameStart() {
    this.playTone(440, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(550, 0.15, 'sine', 0.2), 150);
  }
}

export const chessAudio = new ChessAudioManager();
