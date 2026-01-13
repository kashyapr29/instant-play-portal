// Fruit Ninja Audio Manager - Uses original game sounds

class FruitNinjaAudio {
  private enabled = true;
  private musicEnabled = true;
  private audioElements: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    this.preloadSounds();
  }

  private preloadSounds() {
    const sounds = {
      boom: '/src/games/fruit-ninja/sounds/boom.mp3',
      splatter: '/src/games/fruit-ninja/sounds/splatter.mp3',
      missed: '/src/games/fruit-ninja/sounds/missed.mp3',
      start: '/src/games/fruit-ninja/sounds/start.mp3',
      over: '/src/games/fruit-ninja/sounds/over.mp3',
    };

    Object.entries(sounds).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.audioElements.set(name, audio);
    });
  }

  private playSound(name: string, volume: number = 0.5) {
    if (!this.enabled) return;

    const audio = this.audioElements.get(name);
    if (audio) {
      // Clone to allow overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = volume;
      clone.play().catch(() => {});
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
  }

  // Original game sound effects
  slice() {
    // Quick swoosh sound using Web Audio for responsiveness
    if (!this.enabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  fruitSliced(comboCount: number = 1) {
    // Use original splatter sound
    this.playSound('splatter', Math.min(0.8, 0.4 + comboCount * 0.1));
  }

  bombExplode() {
    // Use original boom sound
    this.playSound('boom', 0.8);
  }

  fruitMissed() {
    // Use original missed sound
    this.playSound('missed', 0.6);
  }

  combo(count: number) {
    // Ascending chime for combos
    if (!this.enabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const baseFreq = 400 + count * 50;
      [0, 0.05, 0.1].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = baseFreq * (1 + i * 0.25);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.1);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.15);
      });
    } catch (e) {}
  }

  gameStart() {
    // Use original start sound
    this.playSound('start', 0.7);
  }

  gameOver() {
    // Use original over sound
    this.playSound('over', 0.7);
  }

  newHighScore() {
    // Victory fanfare using Web Audio
    if (!this.enabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523, 659, 784, 1047, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    } catch (e) {}
  }

  menuClick() {
    if (!this.enabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  // Aliased methods for game module standards
  playHit() { this.fruitSliced(1); }
  playMiss() { this.fruitMissed(); }
  playWin() { this.newHighScore(); }
}

export const audioManager = new FruitNinjaAudio();
