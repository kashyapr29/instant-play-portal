import { useCallback, useRef, useEffect, useState } from 'react';

// Web Audio API based sound generator
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

type SoundType = 
  | 'click' | 'success' | 'fail' | 'move' | 'merge' 
  | 'bounce' | 'break' | 'lose' | 'win' | 'match' 
  | 'flip' | 'powerup' | 'gameOver';

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const playChord = (frequencies: number[], duration: number, type: OscillatorType = 'sine', volume = 0.15) => {
  frequencies.forEach(freq => playTone(freq, duration, type, volume));
};

const soundEffects: Record<SoundType, () => void> = {
  click: () => playTone(800, 0.1, 'square', 0.2),
  success: () => {
    playTone(523, 0.15, 'sine', 0.3);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 100);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 200);
  },
  fail: () => {
    playTone(311, 0.3, 'sawtooth', 0.2);
    setTimeout(() => playTone(233, 0.4, 'sawtooth', 0.2), 150);
  },
  move: () => playTone(440, 0.05, 'sine', 0.15),
  merge: () => {
    playTone(523, 0.1, 'triangle', 0.25);
    setTimeout(() => playTone(659, 0.15, 'triangle', 0.25), 50);
  },
  bounce: () => playTone(600, 0.08, 'square', 0.2),
  break: () => {
    playTone(800, 0.1, 'square', 0.15);
    setTimeout(() => playTone(1000, 0.08, 'square', 0.15), 50);
  },
  lose: () => {
    playTone(400, 0.2, 'sawtooth', 0.3);
    setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.25), 150);
    setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.2), 300);
  },
  win: () => {
    playChord([523, 659, 784], 0.3);
    setTimeout(() => playChord([587, 740, 880], 0.3), 250);
    setTimeout(() => playChord([659, 831, 988], 0.5), 500);
  },
  match: () => {
    playTone(880, 0.1, 'sine', 0.25);
    setTimeout(() => playTone(1108, 0.15, 'sine', 0.25), 80);
  },
  flip: () => playTone(1200, 0.05, 'sine', 0.15),
  powerup: () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(400 + i * 100, 0.08, 'square', 0.2), i * 40);
    }
  },
  gameOver: () => {
    playTone(392, 0.3, 'triangle', 0.3);
    setTimeout(() => playTone(349, 0.3, 'triangle', 0.25), 200);
    setTimeout(() => playTone(330, 0.3, 'triangle', 0.2), 400);
    setTimeout(() => playTone(294, 0.5, 'triangle', 0.2), 600);
  },
};

export const useGameAudio = () => {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('game_audio_muted') === 'true';
    }
    return false;
  });
  
  const mutedRef = useRef(isMuted);
  
  useEffect(() => {
    mutedRef.current = isMuted;
    localStorage.setItem('game_audio_muted', String(isMuted));
  }, [isMuted]);

  const playSound = useCallback((sound: SoundType) => {
    if (mutedRef.current || !audioContext) return;
    
    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    soundEffects[sound]?.();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { playSound, isMuted, toggleMute };
};
