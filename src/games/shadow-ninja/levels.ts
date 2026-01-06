// Shadow Ninja Fight Levels and Enemies

import { Level, Enemy, PowerAbility, Challenge } from './types';

export const ENEMIES: Enemy[] = [
  {
    id: 'apprentice',
    name: 'Kai',
    title: 'The Apprentice',
    avatar: '👤',
    difficulty: 1,
    stats: { attack: 8, defense: 4, speed: 4, critChance: 3, energyRegen: 2 },
    specialMove: 'Swift Jab',
    dialogue: {
      intro: "I may be new, but don't underestimate me!",
      win: "Ha! Told you I'm stronger than I look!",
      lose: "You're... too strong..."
    },
    colors: { primary: '#4a90a4', secondary: '#2d5a6b', glow: '#6bb8d6' }
  },
  {
    id: 'street_fighter',
    name: 'Ryu',
    title: 'Street Brawler',
    avatar: '🥊',
    difficulty: 2,
    stats: { attack: 12, defense: 6, speed: 5, critChance: 5, energyRegen: 2 },
    specialMove: 'Haymaker',
    dialogue: {
      intro: "The streets taught me to fight dirty!",
      win: "Another one bites the dust!",
      lose: "Impossible... my technique..."
    },
    colors: { primary: '#c75b39', secondary: '#8a3d27', glow: '#e87a5a' }
  },
  {
    id: 'acrobat',
    name: 'Lin',
    title: 'The Acrobat',
    avatar: '🤸',
    difficulty: 3,
    stats: { attack: 10, defense: 5, speed: 8, critChance: 8, energyRegen: 3 },
    specialMove: 'Spinning Kick',
    dialogue: {
      intro: "Catch me if you can!",
      win: "Too slow, too predictable!",
      lose: "How did you... read my movements?"
    },
    colors: { primary: '#9b59b6', secondary: '#6c3483', glow: '#bb8fce' }
  },
  {
    id: 'tank',
    name: 'Gorin',
    title: 'The Mountain',
    avatar: '🏔️',
    difficulty: 4,
    stats: { attack: 14, defense: 12, speed: 3, critChance: 4, energyRegen: 1 },
    specialMove: 'Ground Pound',
    dialogue: {
      intro: "I am unmovable. I am unstoppable.",
      win: "Like punching a mountain, isn't it?",
      lose: "Even mountains... can crumble..."
    },
    colors: { primary: '#5d6d7e', secondary: '#34495e', glow: '#85929e' }
  },
  {
    id: 'assassin',
    name: 'Shade',
    title: 'Silent Assassin',
    avatar: '🗡️',
    difficulty: 5,
    stats: { attack: 16, defense: 6, speed: 9, critChance: 15, energyRegen: 3 },
    specialMove: 'Shadow Strike',
    dialogue: {
      intro: "You won't see me coming...",
      win: "From the shadows, I strike.",
      lose: "Impossible... you saw through my technique?"
    },
    colors: { primary: '#2c3e50', secondary: '#1a252f', glow: '#4a6785' }
  },
  {
    id: 'monk',
    name: 'Master Chen',
    title: 'Temple Guardian',
    avatar: '🧘',
    difficulty: 6,
    stats: { attack: 15, defense: 10, speed: 6, critChance: 8, energyRegen: 5 },
    specialMove: 'Chi Blast',
    dialogue: {
      intro: "Balance in all things, including combat.",
      win: "You lack discipline, young one.",
      lose: "Your spirit burns bright..."
    },
    colors: { primary: '#d4a574', secondary: '#a67c52', glow: '#e8c9a8' }
  },
  {
    id: 'fire_dancer',
    name: 'Ember',
    title: 'Fire Dancer',
    avatar: '🔥',
    difficulty: 7,
    stats: { attack: 18, defense: 7, speed: 8, critChance: 10, energyRegen: 4 },
    specialMove: 'Inferno Spin',
    dialogue: {
      intro: "Feel the heat of my passion!",
      win: "Burned to a crisp!",
      lose: "The flame... extinguished..."
    },
    colors: { primary: '#e74c3c', secondary: '#c0392b', glow: '#f1948a' }
  },
  {
    id: 'ice_warrior',
    name: 'Frost',
    title: 'Winter\'s Edge',
    avatar: '❄️',
    difficulty: 8,
    stats: { attack: 16, defense: 11, speed: 6, critChance: 12, energyRegen: 3 },
    specialMove: 'Frozen Fist',
    dialogue: {
      intro: "My heart is as cold as my strikes.",
      win: "Frozen in defeat.",
      lose: "The ice... melts..."
    },
    colors: { primary: '#3498db', secondary: '#2980b9', glow: '#85c1e9' }
  },
  {
    id: 'storm_lord',
    name: 'Raijin',
    title: 'Storm Lord',
    avatar: '⚡',
    difficulty: 9,
    stats: { attack: 20, defense: 8, speed: 10, critChance: 14, energyRegen: 4 },
    specialMove: 'Thunder Strike',
    dialogue: {
      intro: "The storm answers my call!",
      win: "Struck down by lightning!",
      lose: "The storm... subsides..."
    },
    colors: { primary: '#f39c12', secondary: '#d68910', glow: '#f9e79f' }
  },
  {
    id: 'ghost',
    name: 'Phantom',
    title: 'The Ghost',
    avatar: '👻',
    difficulty: 10,
    stats: { attack: 18, defense: 14, speed: 11, critChance: 18, energyRegen: 5 },
    specialMove: 'Phase Strike',
    dialogue: {
      intro: "Can you hit what you cannot touch?",
      win: "You never stood a chance.",
      lose: "How... can you see me?"
    },
    colors: { primary: '#9b59b6', secondary: '#7d3c98', glow: '#d7bde2' }
  },
  {
    id: 'samurai',
    name: 'Kenshi',
    title: 'The Ronin',
    avatar: '⚔️',
    difficulty: 11,
    stats: { attack: 22, defense: 12, speed: 8, critChance: 16, energyRegen: 4 },
    specialMove: 'Blade Dance',
    dialogue: {
      intro: "My blade has never known defeat.",
      win: "Another worthy opponent falls.",
      lose: "You have... true warrior spirit..."
    },
    colors: { primary: '#8e44ad', secondary: '#6c3483', glow: '#af7ac5' }
  },
  {
    id: 'dragon',
    name: 'Long',
    title: 'Dragon Fist',
    avatar: '🐉',
    difficulty: 12,
    stats: { attack: 24, defense: 13, speed: 9, critChance: 15, energyRegen: 5 },
    specialMove: 'Dragon Rage',
    dialogue: {
      intro: "The dragon awakens!",
      win: "The dragon is supreme!",
      lose: "A warrior greater than... the dragon?"
    },
    colors: { primary: '#27ae60', secondary: '#1e8449', glow: '#58d68d' }
  },
  {
    id: 'demon',
    name: 'Oni',
    title: 'Demon King',
    avatar: '👹',
    difficulty: 13,
    stats: { attack: 26, defense: 15, speed: 10, critChance: 18, energyRegen: 4 },
    specialMove: 'Demon Rush',
    dialogue: {
      intro: "Bow before the demon king!",
      win: "Your soul belongs to me now!",
      lose: "A mortal... defeated a demon?"
    },
    colors: { primary: '#e74c3c', secondary: '#922b21', glow: '#f5b7b1' }
  },
  {
    id: 'grand_master',
    name: 'Sensei Hiro',
    title: 'Grand Master',
    avatar: '🥋',
    difficulty: 14,
    stats: { attack: 25, defense: 18, speed: 11, critChance: 20, energyRegen: 6 },
    specialMove: 'Perfect Form',
    dialogue: {
      intro: "Let me see if you've learned anything.",
      win: "You still have much to learn.",
      lose: "The student... surpasses the master..."
    },
    colors: { primary: '#f4d03f', secondary: '#d4ac0d', glow: '#fcf3cf' }
  },
  {
    id: 'shadow_lord',
    name: 'Kage',
    title: 'Shadow Lord',
    avatar: '🌑',
    difficulty: 15,
    stats: { attack: 30, defense: 20, speed: 12, critChance: 25, energyRegen: 5 },
    specialMove: 'Eternal Darkness',
    dialogue: {
      intro: "Welcome to the final shadow...",
      win: "The darkness consumes all!",
      lose: "Light... pierces the darkness..."
    },
    colors: { primary: '#1a1a2e', secondary: '#16213e', glow: '#4a4a6a' }
  }
];

export const POWER_ABILITIES: PowerAbility[] = [
  {
    id: 'shadow_strike',
    name: 'Shadow Strike',
    description: 'A quick dash attack that deals moderate damage',
    icon: '💨',
    type: 'offensive',
    energyCost: 20,
    cooldown: 3,
    damage: 15,
    unlocked: true,
    unlockCost: 0,
    level: 1,
    maxLevel: 5,
    upgradeCost: 200
  },
  {
    id: 'dragon_fist',
    name: 'Dragon Fist',
    description: 'Unleash a devastating punch with dragon spirit',
    icon: '🐉',
    type: 'offensive',
    energyCost: 35,
    cooldown: 5,
    damage: 30,
    unlocked: false,
    unlockCost: 500,
    level: 1,
    maxLevel: 5,
    upgradeCost: 350
  },
  {
    id: 'thunder_kick',
    name: 'Thunder Kick',
    description: 'A lightning-fast kick that stuns enemies',
    icon: '⚡',
    type: 'offensive',
    energyCost: 30,
    cooldown: 4,
    damage: 22,
    effect: 'stun',
    unlocked: false,
    unlockCost: 600,
    level: 1,
    maxLevel: 5,
    upgradeCost: 300
  },
  {
    id: 'healing_aura',
    name: 'Healing Aura',
    description: 'Recover health over time',
    icon: '💚',
    type: 'utility',
    energyCost: 40,
    cooldown: 8,
    effect: 'heal',
    unlocked: false,
    unlockCost: 800,
    level: 1,
    maxLevel: 5,
    upgradeCost: 400
  },
  {
    id: 'iron_body',
    name: 'Iron Body',
    description: 'Temporarily increase defense significantly',
    icon: '🛡️',
    type: 'defensive',
    energyCost: 25,
    cooldown: 6,
    effect: 'defense_boost',
    unlocked: false,
    unlockCost: 550,
    level: 1,
    maxLevel: 5,
    upgradeCost: 280
  },
  {
    id: 'wind_dash',
    name: 'Wind Dash',
    description: 'Quickly dodge and reposition',
    icon: '🌀',
    type: 'utility',
    energyCost: 15,
    cooldown: 2,
    effect: 'dodge',
    unlocked: false,
    unlockCost: 400,
    level: 1,
    maxLevel: 5,
    upgradeCost: 200
  },
  {
    id: 'phoenix_flame',
    name: 'Phoenix Flame',
    description: 'Burn enemies with ancient fire',
    icon: '🔥',
    type: 'offensive',
    energyCost: 45,
    cooldown: 6,
    damage: 35,
    effect: 'burn',
    unlocked: false,
    unlockCost: 1000,
    level: 1,
    maxLevel: 5,
    upgradeCost: 500
  },
  {
    id: 'shadow_clone',
    name: 'Shadow Clone',
    description: 'Create a clone that confuses enemies',
    icon: '👥',
    type: 'defensive',
    energyCost: 50,
    cooldown: 10,
    effect: 'clone',
    unlocked: false,
    unlockCost: 1200,
    level: 1,
    maxLevel: 5,
    upgradeCost: 600
  }
];

export const LEVELS: Level[] = ENEMIES.map((enemy, index) => ({
  id: index + 1,
  name: `Stage ${index + 1}: ${enemy.title}`,
  description: `Face ${enemy.name}, ${enemy.title}`,
  enemyId: enemy.id,
  rounds: 3,
  background: getBackgroundForLevel(index + 1),
  unlockRequirement: index === 0 ? 0 : index,
  rewards: {
    coins: 100 + index * 50,
    xp: 50 + index * 25
  },
  challenges: getChallengesForLevel(index + 1, enemy)
}));

function getBackgroundForLevel(levelId: number): string {
  const backgrounds = [
    'dojo', 'street', 'temple', 'mountain', 'forest',
    'monastery', 'volcano', 'glacier', 'storm', 'ruins',
    'palace', 'cavern', 'inferno', 'throne', 'void'
  ];
  return backgrounds[(levelId - 1) % backgrounds.length];
}

function getChallengesForLevel(levelId: number, enemy: Enemy): Challenge[] {
  const baseChallenges: Challenge[] = [
    {
      id: `${levelId}_no_damage`,
      name: 'Perfect Round',
      description: 'Win a round without taking damage',
      type: 'no_damage',
      target: 1,
      reward: 100 + levelId * 20,
      completed: false
    },
    {
      id: `${levelId}_time_limit`,
      name: 'Speed Demon',
      description: 'Win the match in under 60 seconds',
      type: 'time_limit',
      target: 60,
      reward: 80 + levelId * 15,
      completed: false
    },
    {
      id: `${levelId}_combo`,
      name: 'Combo Master',
      description: `Land a ${3 + Math.floor(levelId / 3)} hit combo`,
      type: 'combo',
      target: 3 + Math.floor(levelId / 3),
      reward: 60 + levelId * 10,
      completed: false
    }
  ];

  if (levelId > 5) {
    baseChallenges.push({
      id: `${levelId}_special_only`,
      name: 'Special Forces',
      description: 'Win using only special abilities',
      type: 'special_only',
      target: 1,
      reward: 150 + levelId * 25,
      completed: false
    });
  }

  return baseChallenges;
}

export const getEnemyById = (id: string): Enemy | undefined => {
  return ENEMIES.find(e => e.id === id);
};

export const getLevelById = (id: number): Level | undefined => {
  return LEVELS.find(l => l.id === id);
};

export const getAbilityById = (id: string): PowerAbility | undefined => {
  return POWER_ABILITIES.find(a => a.id === id);
};

export const getTotalLevels = (): number => LEVELS.length;
