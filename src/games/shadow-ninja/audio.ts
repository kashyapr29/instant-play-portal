// Shadow Ninja Fight Audio System

class ShadowNinjaAudio {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private musicEnabled: boolean = true;
  private masterVolume: number = 0.7;
  private musicVolume: number = 0.4;
  private sfxVolume: number = 0.8;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    attack: number = 0.01,
    decay: number = 0.1
  ): void {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * this.sfxVolume, ctx.currentTime + attack);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Audio error:', e);
    }
  }

  private playNoise(duration: number, volume: number = 0.2): void {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = buffer;
      gainNode.gain.setValueAtTime(volume * this.masterVolume * this.sfxVolume, ctx.currentTime);
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start();
    } catch (e) {
      console.error('Audio error:', e);
    }
  }

  // Combat sounds
  playPunch(): void {
    this.playNoise(0.08, 0.4);
    this.playTone(150, 0.1, 'triangle', 0.3);
    this.playTone(80, 0.15, 'sine', 0.2);
  }

  playKick(): void {
    this.playNoise(0.12, 0.5);
    this.playTone(120, 0.15, 'triangle', 0.4);
    this.playTone(60, 0.2, 'sine', 0.3);
  }

  playHit(): void {
    this.playPunch();
  }

  playSpecialAttack(): void {
    // Dramatic whoosh + impact
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(300 + i * 100, 0.2, 'sawtooth', 0.2);
      }, i * 30);
    }
    setTimeout(() => {
      this.playNoise(0.2, 0.6);
      this.playTone(80, 0.3, 'triangle', 0.5);
    }, 150);
  }

  playCriticalHit(): void {
    this.playNoise(0.15, 0.6);
    this.playTone(400, 0.1, 'square', 0.4);
    this.playTone(200, 0.2, 'triangle', 0.5);
    setTimeout(() => {
      this.playTone(600, 0.15, 'sine', 0.3);
    }, 50);
  }

  playBlock(): void {
    this.playTone(800, 0.05, 'square', 0.3);
    this.playTone(400, 0.1, 'triangle', 0.2);
  }

  playMiss(): void {
    this.playTone(200, 0.1, 'sine', 0.1);
    this.playNoise(0.05, 0.1);
  }

  // Round/Match sounds
  playRoundStart(): void {
    const notes = [262, 330, 392, 523];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'triangle', 0.3);
      }, i * 100);
    });
  }

  playRoundEnd(): void {
    this.playTone(523, 0.3, 'triangle', 0.4);
    setTimeout(() => {
      this.playTone(659, 0.3, 'triangle', 0.4);
    }, 200);
    setTimeout(() => {
      this.playTone(784, 0.5, 'triangle', 0.5);
    }, 400);
  }

  playVictory(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'triangle', 0.4);
        this.playTone(freq * 1.5, 0.4, 'sine', 0.2);
      }, i * 150);
    });
  }

  playWin(): void {
    this.playVictory();
  }

  playDefeat(): void {
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'triangle', 0.3);
      }, i * 150);
    });
  }

  playLose(): void {
    this.playDefeat();
  }

  // KO sound
  playKO(): void {
    this.playNoise(0.3, 0.7);
    this.playTone(100, 0.5, 'triangle', 0.6);
    setTimeout(() => {
      this.playTone(80, 0.4, 'sine', 0.5);
    }, 100);
    setTimeout(() => {
      this.playTone(60, 0.6, 'sine', 0.4);
    }, 250);
  }

  // UI sounds
  playSelect(): void {
    this.playTone(440, 0.1, 'sine', 0.2);
  }

  playConfirm(): void {
    this.playTone(523, 0.1, 'sine', 0.25);
    setTimeout(() => {
      this.playTone(659, 0.15, 'sine', 0.25);
    }, 80);
  }

  playCancel(): void {
    this.playTone(300, 0.1, 'triangle', 0.2);
    setTimeout(() => {
      this.playTone(200, 0.15, 'triangle', 0.2);
    }, 80);
  }

  playUnlock(): void {
    const notes = [392, 494, 587, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.25, 'triangle', 0.3);
      }, i * 100);
    });
  }

  playUpgrade(): void {
    this.playTone(440, 0.1, 'sine', 0.3);
    setTimeout(() => {
      this.playTone(554, 0.1, 'sine', 0.3);
    }, 100);
    setTimeout(() => {
      this.playTone(659, 0.2, 'sine', 0.3);
    }, 200);
  }

  playCoinCollect(): void {
    this.playTone(988, 0.08, 'sine', 0.25);
    setTimeout(() => {
      this.playTone(1319, 0.12, 'sine', 0.25);
    }, 60);
  }

  playCombo(): void {
    const comboNotes = [523, 659, 784];
    comboNotes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.1, 'triangle', 0.25);
      }, i * 50);
    });
  }

  playEnergyCharge(): void {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.playTone(200 + i * 50, 0.1, 'sawtooth', 0.15);
      }, i * 40);
    }
  }

  playCountdown(): void {
    this.playTone(440, 0.15, 'square', 0.3);
  }

  playFight(): void {
    this.playTone(523, 0.3, 'sawtooth', 0.4);
    this.playTone(659, 0.3, 'sawtooth', 0.3);
  }

  // Movement sounds
  playJump(): void {
    this.playTone(300, 0.1, 'sine', 0.15);
    this.playTone(400, 0.15, 'sine', 0.1);
  }

  playLand(): void {
    this.playNoise(0.05, 0.2);
    this.playTone(100, 0.1, 'triangle', 0.15);
  }

  playDash(): void {
    this.playNoise(0.08, 0.2);
    for (let i = 0; i < 3; i++) {
      this.playTone(300 + i * 100, 0.05, 'sine', 0.15);
    }
  }

  // Power ability sounds
  playShadowStrike(): void {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.playTone(150 + i * 30, 0.15, 'sawtooth', 0.25);
        this.playNoise(0.05, 0.2);
      }, i * 25);
    }
  }

  playDragonFist(): void {
    this.playTone(100, 0.4, 'sawtooth', 0.4);
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(200 + i * 100, 0.2, 'triangle', 0.3);
      }, 50 + i * 50);
    }
    setTimeout(() => {
      this.playNoise(0.2, 0.5);
    }, 200);
  }

  playThunderKick(): void {
    this.playNoise(0.3, 0.4);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(800 - i * 100, 0.1, 'square', 0.3);
      }, i * 40);
    }
  }

  playHealingAura(): void {
    const notes = [262, 330, 392, 523, 659];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.2);
      }, i * 100);
    });
  }

  playIronBody(): void {
    this.playTone(150, 0.3, 'triangle', 0.4);
    this.playTone(200, 0.3, 'square', 0.2);
    this.playNoise(0.1, 0.3);
  }

  resume(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audio = new ShadowNinjaAudio();
