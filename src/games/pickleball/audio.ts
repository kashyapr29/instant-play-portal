class PickleballAudioManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private getContext(): AudioContext { if (!this.audioContext) this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); return this.audioContext; }
  setEnabled(enabled: boolean) { this.enabled = enabled; }
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.enabled) return;
    try { const ctx = this.getContext(); const oscillator = ctx.createOscillator(); const gainNode = ctx.createGain(); oscillator.connect(gainNode); gainNode.connect(ctx.destination); oscillator.frequency.value = frequency; oscillator.type = type; gainNode.gain.setValueAtTime(volume, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration); oscillator.start(ctx.currentTime); oscillator.stop(ctx.currentTime + duration); } catch (e) {}
  }
  private playNoise(duration: number, volume: number = 0.1) { if (!this.enabled) return; try { const ctx = this.getContext(); const bufferSize = ctx.sampleRate * duration; const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate); const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * volume; const source = ctx.createBufferSource(); const gainNode = ctx.createGain(); source.buffer = buffer; source.connect(gainNode); gainNode.connect(ctx.destination); gainNode.gain.setValueAtTime(volume, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration); source.start(ctx.currentTime); } catch (e) {} }
  hit() { this.playTone(900, 0.05, 'square', 0.22); this.playNoise(0.03, 0.12); }
  dink() { this.playTone(1100, 0.04, 'sine', 0.18); }
  powerShot() { this.playTone(450, 0.1, 'sawtooth', 0.3); this.playTone(700, 0.1, 'square', 0.25); }
  perfectHit() { this.playTone(1300, 0.07, 'sine', 0.25); setTimeout(() => this.playTone(1700, 0.07, 'sine', 0.2), 40); }
  miss() { this.playTone(180, 0.16, 'sawtooth', 0.15); }
  point() { this.playTone(650, 0.1, 'sine', 0.3); setTimeout(() => this.playTone(800, 0.1, 'sine', 0.3), 85); setTimeout(() => this.playTone(1000, 0.15, 'sine', 0.3), 170); }
  gameWon() { [650, 800, 1000, 1300].forEach((note, i) => setTimeout(() => this.playTone(note, 0.18, 'sine', 0.3), i * 125)); }
  matchWon() { [650, 800, 1000, 1150, 1300, 1625, 1950].forEach((note, i) => setTimeout(() => this.playTone(note, 0.22, 'sine', 0.35), i * 105)); setTimeout(() => { for (let i = 0; i < 5; i++) setTimeout(() => this.playNoise(0.22, 0.1), i * 85); }, 770); }
  matchLost() { this.playTone(475, 0.25, 'sawtooth', 0.2); setTimeout(() => this.playTone(375, 0.25, 'sawtooth', 0.2), 170); setTimeout(() => this.playTone(275, 0.35, 'sawtooth', 0.15), 340); }
  powerUp() { this.playTone(750, 0.08, 'sine', 0.25); setTimeout(() => this.playTone(1050, 0.08, 'sine', 0.25), 65); setTimeout(() => this.playTone(1450, 0.12, 'sine', 0.25), 130); }
  click() { this.playTone(1150, 0.04, 'sine', 0.15); }
  serve() { this.playTone(550, 0.1, 'square', 0.2); this.playNoise(0.08, 0.15); }
}
export const pickleballAudio = new PickleballAudioManager();
