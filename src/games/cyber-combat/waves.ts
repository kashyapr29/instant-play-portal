import { Wave, Weapon, Ability } from './types';

export const WEAPONS: Weapon[] = [
  {
    id: 'pulse_rifle',
    name: 'Pulse Rifle',
    damage: 15,
    fireRate: 150,
    projectileSpeed: 18,
    projectileColor: '#00ffff',
    spread: 0.05,
    projectilesPerShot: 1,
    energyCost: 5,
  },
  {
    id: 'scatter_gun',
    name: 'Scatter Gun',
    damage: 8,
    fireRate: 400,
    projectileSpeed: 15,
    projectileColor: '#ff00ff',
    spread: 0.3,
    projectilesPerShot: 5,
    energyCost: 15,
  },
  {
    id: 'plasma_cannon',
    name: 'Plasma Cannon',
    damage: 50,
    fireRate: 800,
    projectileSpeed: 12,
    projectileColor: '#00ff00',
    spread: 0,
    projectilesPerShot: 1,
    energyCost: 25,
  },
  {
    id: 'laser_beam',
    name: 'Laser Beam',
    damage: 5,
    fireRate: 50,
    projectileSpeed: 30,
    projectileColor: '#ff0000',
    spread: 0,
    projectilesPerShot: 1,
    energyCost: 3,
  },
  {
    id: 'void_launcher',
    name: 'Void Launcher',
    damage: 100,
    fireRate: 1500,
    projectileSpeed: 8,
    projectileColor: '#8000ff',
    spread: 0,
    projectilesPerShot: 1,
    energyCost: 40,
  },
];

export const ABILITIES: Ability[] = [
  {
    id: 'dash',
    name: 'Cyber Dash',
    cooldown: 3000,
    currentCooldown: 0,
    energyCost: 20,
    duration: 200,
    active: false,
    icon: '⚡',
  },
  {
    id: 'shield',
    name: 'Energy Shield',
    cooldown: 8000,
    currentCooldown: 0,
    energyCost: 40,
    duration: 3000,
    active: false,
    icon: '🛡️',
  },
  {
    id: 'overcharge',
    name: 'Overcharge',
    cooldown: 12000,
    currentCooldown: 0,
    energyCost: 50,
    duration: 5000,
    active: false,
    icon: '🔥',
  },
  {
    id: 'emp',
    name: 'EMP Blast',
    cooldown: 15000,
    currentCooldown: 0,
    energyCost: 60,
    duration: 100,
    active: false,
    icon: '💥',
  },
];

export const WAVES: Wave[] = [
  {
    id: 1,
    name: 'INITIALIZATION',
    enemies: [{ type: 'drone', count: 5, spawnDelay: 1000 }],
    spawnDelay: 500,
  },
  {
    id: 2,
    name: 'FIRST CONTACT',
    enemies: [
      { type: 'drone', count: 8, spawnDelay: 800 },
      { type: 'sentinel', count: 2, spawnDelay: 2000 },
    ],
    spawnDelay: 400,
  },
  {
    id: 3,
    name: 'PHANTOM MENACE',
    enemies: [
      { type: 'drone', count: 6, spawnDelay: 600 },
      { type: 'phantom', count: 3, spawnDelay: 1500 },
    ],
    spawnDelay: 300,
  },
  {
    id: 4,
    name: 'ARMORED ASSAULT',
    enemies: [
      { type: 'sentinel', count: 5, spawnDelay: 1000 },
      { type: 'juggernaut', count: 1, spawnDelay: 3000 },
    ],
    spawnDelay: 400,
  },
  {
    id: 5,
    name: 'SNIPER ALLEY',
    enemies: [
      { type: 'drone', count: 10, spawnDelay: 500 },
      { type: 'sniper', count: 3, spawnDelay: 2000 },
    ],
    spawnDelay: 300,
    bonusObjective: 'Kill all snipers first',
  },
  {
    id: 6,
    name: 'CHAOS PROTOCOL',
    enemies: [
      { type: 'phantom', count: 5, spawnDelay: 1000 },
      { type: 'sentinel', count: 4, spawnDelay: 1200 },
      { type: 'drone', count: 8, spawnDelay: 400 },
    ],
    spawnDelay: 200,
  },
  {
    id: 7,
    name: 'HEAVY METAL',
    enemies: [
      { type: 'juggernaut', count: 3, spawnDelay: 2000 },
      { type: 'sentinel', count: 6, spawnDelay: 1000 },
    ],
    spawnDelay: 400,
  },
  {
    id: 8,
    name: 'GHOST DIVISION',
    enemies: [
      { type: 'phantom', count: 8, spawnDelay: 800 },
      { type: 'sniper', count: 4, spawnDelay: 1500 },
    ],
    spawnDelay: 300,
  },
  {
    id: 9,
    name: 'TOTAL WAR',
    enemies: [
      { type: 'drone', count: 15, spawnDelay: 300 },
      { type: 'sentinel', count: 8, spawnDelay: 800 },
      { type: 'phantom', count: 5, spawnDelay: 1000 },
      { type: 'juggernaut', count: 2, spawnDelay: 2500 },
    ],
    spawnDelay: 200,
  },
  {
    id: 10,
    name: 'SYSTEM OVERRIDE',
    enemies: [
      { type: 'boss', count: 1, spawnDelay: 0 },
      { type: 'drone', count: 20, spawnDelay: 500 },
    ],
    spawnDelay: 100,
    bonusObjective: 'Defeat the Cyber Overlord',
  },
  {
    id: 11,
    name: 'NIGHTMARE MODE',
    enemies: [
      { type: 'juggernaut', count: 5, spawnDelay: 1500 },
      { type: 'phantom', count: 10, spawnDelay: 600 },
      { type: 'sniper', count: 6, spawnDelay: 1000 },
    ],
    spawnDelay: 150,
  },
  {
    id: 12,
    name: 'ENDLESS VOID',
    enemies: [
      { type: 'drone', count: 30, spawnDelay: 200 },
      { type: 'sentinel', count: 15, spawnDelay: 500 },
      { type: 'phantom', count: 10, spawnDelay: 700 },
      { type: 'juggernaut', count: 5, spawnDelay: 1500 },
      { type: 'sniper', count: 8, spawnDelay: 800 },
    ],
    spawnDelay: 100,
  },
];

export const getWeapon = (id: string): Weapon => {
  return WEAPONS.find(w => w.id === id) || WEAPONS[0];
};

export const getAbility = (id: string): Ability => {
  return ABILITIES.find(a => a.id === id) || ABILITIES[0];
};

export const getWave = (waveNumber: number): Wave => {
  const index = Math.min(waveNumber - 1, WAVES.length - 1);
  const baseWave = WAVES[index];
  
  // Scale difficulty for waves beyond defined ones
  if (waveNumber > WAVES.length) {
    const scaleFactor = 1 + (waveNumber - WAVES.length) * 0.2;
    return {
      ...baseWave,
      id: waveNumber,
      name: `WAVE ${waveNumber}`,
      enemies: baseWave.enemies.map(e => ({
        ...e,
        count: Math.floor(e.count * scaleFactor),
      })),
    };
  }
  
  return baseWave;
};
