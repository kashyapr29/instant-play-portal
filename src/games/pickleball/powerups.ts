import { PowerUp, PowerUpType } from './types';
export interface PowerUpConfig { type: PowerUpType; name: string; icon: string; color: string; duration: number; description: string; rarity: number; }
export const POWER_UP_CONFIGS: { [key in PowerUpType]: PowerUpConfig } = {
  slow_motion: { type: 'slow_motion', name: 'Slow Motion', icon: '⏱️', color: '#3498db', duration: 5, description: 'Time slows down', rarity: 0.2 },
  power_shot: { type: 'power_shot', name: 'Power Shot', icon: '💥', color: '#e74c3c', duration: 8, description: 'Powerful drives', rarity: 0.25 },
  auto_aim: { type: 'auto_aim', name: 'Auto Aim', icon: '🎯', color: '#2ecc71', duration: 6, description: 'Ball targets gaps', rarity: 0.15 },
  speed_boost: { type: 'speed_boost', name: 'Speed Boost', icon: '⚡', color: '#f1c40f', duration: 7, description: 'Move faster', rarity: 0.3 },
  perfect_dink: { type: 'perfect_dink', name: 'Perfect Dink', icon: '✨', color: '#9b59b6', duration: 8, description: 'Unreturable dinks', rarity: 0.1 },
};
export const getRandomPowerUpType = (): PowerUpType => { const types = Object.keys(POWER_UP_CONFIGS) as PowerUpType[]; const weights = types.map(t => POWER_UP_CONFIGS[t].rarity); const totalWeight = weights.reduce((a, b) => a + b, 0); let random = Math.random() * totalWeight; for (let i = 0; i < types.length; i++) { random -= weights[i]; if (random <= 0) return types[i]; } return types[0]; };
export const createPowerUp = (courtWidth: number, courtHeight: number): PowerUp => { const type = getRandomPowerUpType(); return { id: `powerup_${Date.now()}`, type, x: courtWidth * 0.2 + Math.random() * courtWidth * 0.6, y: courtHeight * 0.3 + Math.random() * courtHeight * 0.4, active: true, duration: POWER_UP_CONFIGS[type].duration * 1000, collected: false }; };
export const getPowerUpConfig = (type: PowerUpType): PowerUpConfig => POWER_UP_CONFIGS[type];
