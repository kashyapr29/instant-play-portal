import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Fighter, FighterState, GameState, GameScreen, Particle, HitEffect, 
  GameProgress, PowerAbility, Enemy, Level, Challenge,
  STAT_UPGRADE_CONFIG, BASE_PLAYER_STATS
} from './types';
import { LEVELS, ENEMIES, POWER_ABILITIES, getEnemyById, getLevelById, getAbilityById } from './levels';
import { 
  loadProgress, saveProgress, clearProgress, addCoins, spendCoins, addXP,
  unlockAbility, upgradeAbility, selectAbility, upgradeStat, completeLevel,
  recordFight, completeChallenge, toggleSound, toggleMusic, setDifficulty
} from './storage';
import { audio } from './audio';
import * as renderer from './renderer';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const GROUND_Y = 0.85;
const ROUND_TIME = 99;

const ShadowNinjaFight: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  
  const [progress, setProgress] = useState<GameProgress>(loadProgress());
  const [gameState, setGameState] = useState<GameState>({
    screen: 'menu',
    currentLevel: 1,
    currentRound: 1,
    totalRounds: 3,
    playerWins: 0,
    enemyWins: 0,
    roundTimer: ROUND_TIME,
    isPaused: false,
    slowMotion: false,
    slowMotionTimer: 0,
    comboTimer: 0,
    lastHitTime: 0,
  });

  const playerRef = useRef<Fighter>({
    x: 0.2,
    y: GROUND_Y,
    width: 60,
    height: 120,
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    facing: 'right',
    state: 'idle',
    stateTimer: 0,
    comboCount: 0,
    isBlocking: false,
    isStunned: false,
    stunTimer: 0,
    velocity: { x: 0, y: 0 },
    stats: { ...BASE_PLAYER_STATS },
  });

  const enemyRef = useRef<Fighter>({
    x: 0.7,
    y: GROUND_Y,
    width: 60,
    height: 120,
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    facing: 'left',
    state: 'idle',
    stateTimer: 0,
    comboCount: 0,
    isBlocking: false,
    isStunned: false,
    stunTimer: 0,
    velocity: { x: 0, y: 0 },
    stats: { ...BASE_PLAYER_STATS },
  });

  const particlesRef = useRef<Particle[]>([]);
  const hitEffectsRef = useRef<HitEffect[]>([]);
  const countdownRef = useRef<{ count: number; progress: number } | null>(null);
  const abilityCooldownsRef = useRef<{ [id: string]: number }>({});
  const roundResultRef = useRef<{ winner: 'player' | 'enemy' } | null>(null);
  const matchStatsRef = useRef({ damageDealt: 0, comboMax: 0, specialsUsed: 0, perfectRounds: 0 });

  const currentLevel = getLevelById(gameState.currentLevel);
  const currentEnemy = currentLevel ? getEnemyById(currentLevel.enemyId) : null;

  // Apply player stats from progress
  useEffect(() => {
    const p = loadProgress();
    playerRef.current.stats = { ...p.playerStats };
    playerRef.current.maxHealth = 100 + p.statUpgrades.defense * 5;
    setProgress(p);
  }, []);

  // Audio settings
  useEffect(() => {
    audio.setEnabled(progress.soundEnabled);
    audio.setMusicEnabled(progress.musicEnabled);
  }, [progress.soundEnabled, progress.musicEnabled]);

  const spawnParticles = useCallback((
    x: number, y: number, count: number, color: string, type: Particle['type']
  ) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.02,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 3 + Math.random() * 5,
        type,
      });
    }
  }, []);

  const dealDamage = useCallback((
    attacker: React.MutableRefObject<Fighter>,
    defender: React.MutableRefObject<Fighter>,
    baseDamage: number,
    isSpecial: boolean = false
  ) => {
    if (defender.current.isBlocking) {
      audio.playBlock();
      spawnParticles(defender.current.x, 0.5, 5, '#ffffff', 'spark');
      return 0;
    }

    const attackStat = attacker.current.stats.attack;
    const defenseStat = defender.current.stats.defense;
    const isCritical = Math.random() * 100 < attacker.current.stats.critChance;
    
    let damage = baseDamage * (1 + attackStat / 20) * (1 - defenseStat / 50);
    if (isCritical) damage *= 1.5;
    damage = Math.round(damage);

    defender.current.health = Math.max(0, defender.current.health - damage);
    defender.current.state = 'hit';
    defender.current.stateTimer = 15;

    // Hit effect
    hitEffectsRef.current.push({
      x: defender.current.x,
      y: 0.4,
      type: isCritical ? 'critical' : isSpecial ? 'special' : 'punch',
      damage,
      timer: 30,
    });

    // Particles
    spawnParticles(
      defender.current.x,
      0.5,
      isCritical ? 15 : 8,
      isCritical ? '#f39c12' : '#ff6b6b',
      'hit'
    );

    if (isCritical) {
      audio.playCriticalHit();
    } else if (isSpecial) {
      audio.playSpecialAttack();
    } else {
      audio.playPunch();
    }

    // Combo tracking
    if (attacker === playerRef) {
      attacker.current.comboCount++;
      matchStatsRef.current.damageDealt += damage;
      if (attacker.current.comboCount > matchStatsRef.current.comboMax) {
        matchStatsRef.current.comboMax = attacker.current.comboCount;
      }
      if (attacker.current.comboCount >= 3) {
        audio.playCombo();
      }
    }

    return damage;
  }, [spawnParticles]);

  const useAbility = useCallback((abilityId: string) => {
    const ability = getAbilityById(abilityId);
    if (!ability) return;
    
    const cooldown = abilityCooldownsRef.current[abilityId] || 0;
    if (cooldown > 0) return;
    
    const abilityLevel = progress.abilityLevels[abilityId] || 1;
    const energyCost = ability.energyCost * (1 - (abilityLevel - 1) * 0.05);
    
    if (playerRef.current.energy < energyCost) return;
    
    playerRef.current.energy -= energyCost;
    abilityCooldownsRef.current[abilityId] = ability.cooldown * 60;
    matchStatsRef.current.specialsUsed++;
    
    playerRef.current.state = 'special';
    playerRef.current.stateTimer = 30;

    const damage = (ability.damage || 0) * (1 + (abilityLevel - 1) * 0.2);
    
    switch (abilityId) {
      case 'shadow_strike':
        audio.playShadowStrike();
        dealDamage(playerRef, enemyRef, damage, true);
        spawnParticles(enemyRef.current.x, 0.5, 20, '#4a4a6a', 'energy');
        break;
      case 'dragon_fist':
        audio.playDragonFist();
        dealDamage(playerRef, enemyRef, damage, true);
        spawnParticles(enemyRef.current.x, 0.5, 25, '#27ae60', 'energy');
        break;
      case 'thunder_kick':
        audio.playThunderKick();
        dealDamage(playerRef, enemyRef, damage, true);
        enemyRef.current.isStunned = true;
        enemyRef.current.stunTimer = 60;
        spawnParticles(enemyRef.current.x, 0.5, 20, '#f39c12', 'spark');
        break;
      case 'healing_aura':
        audio.playHealingAura();
        const healAmount = 20 + abilityLevel * 5;
        playerRef.current.health = Math.min(
          playerRef.current.maxHealth,
          playerRef.current.health + healAmount
        );
        spawnParticles(playerRef.current.x, 0.5, 15, '#2ecc71', 'energy');
        break;
      case 'iron_body':
        audio.playIronBody();
        // Temporary defense boost handled elsewhere
        spawnParticles(playerRef.current.x, 0.5, 10, '#95a5a6', 'smoke');
        break;
      case 'wind_dash':
        audio.playDash();
        playerRef.current.x += playerRef.current.facing === 'right' ? 0.15 : -0.15;
        playerRef.current.x = Math.max(0.05, Math.min(0.95, playerRef.current.x));
        spawnParticles(playerRef.current.x, 0.7, 10, '#ecf0f1', 'smoke');
        break;
      case 'phoenix_flame':
        audio.playSpecialAttack();
        dealDamage(playerRef, enemyRef, damage, true);
        spawnParticles(enemyRef.current.x, 0.5, 30, '#e74c3c', 'energy');
        break;
      case 'shadow_clone':
        audio.playShadowStrike();
        spawnParticles(playerRef.current.x, 0.5, 20, '#2c3e50', 'smoke');
        break;
    }
  }, [progress.abilityLevels, dealDamage, spawnParticles]);

  const handlePlayerInput = useCallback(() => {
    const player = playerRef.current;
    const keys = keysRef.current;
    
    if (player.state !== 'idle' && player.state !== 'walking') return;
    if (player.isStunned) return;

    // Movement
    const speed = 0.008 * (1 + player.stats.speed / 20);
    
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
      player.x = Math.max(0.05, player.x - speed);
      player.state = 'walking';
      player.facing = 'left';
    }
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
      player.x = Math.min(0.95, player.x + speed);
      player.state = 'walking';
      player.facing = 'right';
    }

    // Always face enemy during combat
    player.facing = player.x < enemyRef.current.x ? 'right' : 'left';

    // Attacks
    if (keys.has('z') || keys.has('Z')) {
      player.state = 'punching';
      player.stateTimer = 20;
      keys.delete('z');
      keys.delete('Z');
      
      if (Math.abs(player.x - enemyRef.current.x) < 0.15) {
        dealDamage(playerRef, enemyRef, 8 + player.stats.attack);
      } else {
        audio.playMiss();
      }
    }
    
    if (keys.has('x') || keys.has('X')) {
      player.state = 'kicking';
      player.stateTimer = 25;
      keys.delete('x');
      keys.delete('X');
      
      if (Math.abs(player.x - enemyRef.current.x) < 0.18) {
        dealDamage(playerRef, enemyRef, 12 + player.stats.attack);
      } else {
        audio.playMiss();
      }
    }

    // Block
    player.isBlocking = keys.has('c') || keys.has('C');
    if (player.isBlocking) {
      player.state = 'blocking';
    }

    // Special abilities (1, 2, 3 keys)
    const selectedAbilities = progress.selectedAbilities;
    if (keys.has('1') && selectedAbilities[0]) {
      useAbility(selectedAbilities[0]);
      keys.delete('1');
    }
    if (keys.has('2') && selectedAbilities[1]) {
      useAbility(selectedAbilities[1]);
      keys.delete('2');
    }
    if (keys.has('3') && selectedAbilities[2]) {
      useAbility(selectedAbilities[2]);
      keys.delete('3');
    }
  }, [progress.selectedAbilities, dealDamage, useAbility]);

  const updateAI = useCallback((deltaTime: number) => {
    const enemy = enemyRef.current;
    const player = playerRef.current;
    
    if (enemy.isStunned) {
      enemy.stunTimer -= deltaTime;
      if (enemy.stunTimer <= 0) {
        enemy.isStunned = false;
      }
      return;
    }

    if (enemy.state !== 'idle' && enemy.state !== 'walking') return;

    const currentEnemyData = currentEnemy;
    if (!currentEnemyData) return;

    const difficulty = currentEnemyData.difficulty;
    const difficultyMod = progress.difficulty === 'easy' ? 0.7 : progress.difficulty === 'hard' ? 1.3 : 1;
    const reactionChance = (0.02 + difficulty * 0.005) * difficultyMod;
    const distance = Math.abs(player.x - enemy.x);

    // Face player
    enemy.facing = enemy.x > player.x ? 'left' : 'right';

    // AI decision making
    if (Math.random() < reactionChance) {
      if (distance > 0.2) {
        // Move towards player
        const speed = 0.005 * (1 + enemy.stats.speed / 20);
        enemy.x += enemy.facing === 'left' ? -speed : speed;
        enemy.state = 'walking';
      } else if (distance < 0.15) {
        // Attack
        if (Math.random() < 0.6) {
          enemy.state = 'punching';
          enemy.stateTimer = 20;
          if (distance < 0.15 && !player.isBlocking) {
            dealDamage(enemyRef, playerRef, 6 + enemy.stats.attack * 0.5);
          }
        } else {
          enemy.state = 'kicking';
          enemy.stateTimer = 25;
          if (distance < 0.18 && !player.isBlocking) {
            dealDamage(enemyRef, playerRef, 10 + enemy.stats.attack * 0.5);
          }
        }
      }
      
      // Occasional blocking
      if (player.state === 'punching' || player.state === 'kicking') {
        if (Math.random() < 0.3 + difficulty * 0.03) {
          enemy.isBlocking = true;
          enemy.state = 'blocking';
        }
      }
    }

    // Stop blocking randomly
    if (enemy.isBlocking && Math.random() < 0.1) {
      enemy.isBlocking = false;
    }
  }, [currentEnemy, progress.difficulty, dealDamage]);

  const startRound = useCallback(() => {
    playerRef.current.health = playerRef.current.maxHealth;
    playerRef.current.energy = playerRef.current.maxEnergy;
    playerRef.current.x = 0.2;
    playerRef.current.state = 'idle';
    playerRef.current.comboCount = 0;
    playerRef.current.isBlocking = false;
    playerRef.current.isStunned = false;

    if (currentEnemy) {
      const enemyStats = currentEnemy.stats;
      enemyRef.current = {
        ...enemyRef.current,
        x: 0.8,
        health: 100 + currentEnemy.difficulty * 10,
        maxHealth: 100 + currentEnemy.difficulty * 10,
        energy: 100,
        maxEnergy: 100,
        state: 'idle',
        comboCount: 0,
        isBlocking: false,
        isStunned: false,
        stats: { ...enemyStats },
      };
    }

    particlesRef.current = [];
    hitEffectsRef.current = [];
    abilityCooldownsRef.current = {};
    
    // Countdown
    countdownRef.current = { count: 3, progress: 1 };
    audio.playCountdown();
    
    setGameState(prev => ({
      ...prev,
      roundTimer: ROUND_TIME,
    }));
  }, [currentEnemy]);

  const endRound = useCallback((winner: 'player' | 'enemy') => {
    roundResultRef.current = { winner };
    
    if (winner === 'player') {
      audio.playVictory();
      if (playerRef.current.health === playerRef.current.maxHealth) {
        matchStatsRef.current.perfectRounds++;
      }
    } else {
      audio.playDefeat();
    }

    playerRef.current.state = winner === 'player' ? 'victory' : 'defeat';
    enemyRef.current.state = winner === 'player' ? 'defeat' : 'victory';

    setTimeout(() => {
      setGameState(prev => {
        const newPlayerWins = winner === 'player' ? prev.playerWins + 1 : prev.playerWins;
        const newEnemyWins = winner === 'enemy' ? prev.enemyWins + 1 : prev.enemyWins;
        const winsNeeded = Math.ceil(prev.totalRounds / 2);

        if (newPlayerWins >= winsNeeded) {
          // Player wins match
          const level = getLevelById(prev.currentLevel);
          if (level) {
            const coinsEarned = level.rewards.coins;
            const xpEarned = level.rewards.xp;
            completeLevel(prev.currentLevel, coinsEarned, xpEarned);
            recordFight(true, enemyRef.current.health <= 0, matchStatsRef.current.comboMax);
            setProgress(loadProgress());
          }
          return { ...prev, screen: 'levelComplete', playerWins: newPlayerWins };
        } else if (newEnemyWins >= winsNeeded) {
          // Enemy wins match
          recordFight(false, false, matchStatsRef.current.comboMax);
          setProgress(loadProgress());
          return { ...prev, screen: 'gameOver', enemyWins: newEnemyWins };
        } else {
          // Continue to next round
          return {
            ...prev,
            currentRound: prev.currentRound + 1,
            playerWins: newPlayerWins,
            enemyWins: newEnemyWins,
            screen: 'roundEnd',
          };
        }
      });
      roundResultRef.current = null;
    }, 2000);
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 16.67 : 1;
    lastTimeRef.current = timestamp;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const level = getLevelById(gameState.currentLevel);
    const enemy = currentEnemy;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render background
    renderer.renderBackground(ctx, canvas.width, canvas.height, level?.background || 'dojo', timestamp);

    if (gameState.screen === 'fighting' && !gameState.isPaused) {
      // Handle countdown
      if (countdownRef.current) {
        countdownRef.current.progress -= 0.02 * deltaTime;
        if (countdownRef.current.progress <= 0) {
          countdownRef.current.count--;
          countdownRef.current.progress = 1;
          if (countdownRef.current.count >= 0) {
            audio.playCountdown();
          }
          if (countdownRef.current.count < 0) {
            audio.playFight();
            countdownRef.current = null;
          }
        }
      }

      // Update game logic only when not in countdown
      if (!countdownRef.current) {
        // Update timer
        setGameState(prev => {
          const newTimer = prev.roundTimer - deltaTime / 60;
          if (newTimer <= 0) {
            // Time up - winner is whoever has more health
            const winner = playerRef.current.health >= enemyRef.current.health ? 'player' : 'enemy';
            endRound(winner);
            return prev;
          }
          return { ...prev, roundTimer: newTimer };
        });

        // Player input
        handlePlayerInput();

        // AI
        updateAI(deltaTime);

        // Update fighter states
        [playerRef, enemyRef].forEach(fighterRef => {
          const fighter = fighterRef.current;
          
          if (fighter.stateTimer > 0) {
            fighter.stateTimer -= deltaTime;
            if (fighter.stateTimer <= 0) {
              fighter.state = 'idle';
              fighter.stateTimer = 0;
            }
          }

          // Energy regeneration
          fighter.energy = Math.min(
            fighter.maxEnergy,
            fighter.energy + fighter.stats.energyRegen * 0.05 * deltaTime
          );

          // Combo reset
          if (fighterRef === playerRef && fighter.comboCount > 0) {
            if (timestamp - gameState.lastHitTime > 2000) {
              fighter.comboCount = 0;
            }
          }
        });

        // Update ability cooldowns
        Object.keys(abilityCooldownsRef.current).forEach(id => {
          abilityCooldownsRef.current[id] = Math.max(0, abilityCooldownsRef.current[id] - deltaTime);
        });

        // Check for round end
        if (playerRef.current.health <= 0) {
          audio.playKO();
          endRound('enemy');
        } else if (enemyRef.current.health <= 0) {
          audio.playKO();
          endRound('player');
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.vy += 0.001 * deltaTime;
        p.life -= deltaTime;
        return p.life > 0;
      });

      // Update hit effects
      hitEffectsRef.current = hitEffectsRef.current.filter(e => {
        e.timer -= deltaTime;
        return e.timer > 0;
      });

      // Render fighters
      const playerColors = { primary: '#4ecdc4', secondary: '#26a69a', glow: '#80deea' };
      const enemyColors = enemy?.colors || { primary: '#ff6b6b', secondary: '#d32f2f', glow: '#ff8a80' };

      renderer.renderFighter(ctx, playerRef.current, canvas.width, canvas.height, true, playerColors, timestamp);
      renderer.renderFighter(ctx, enemyRef.current, canvas.width, canvas.height, false, enemyColors, timestamp);

      // Render particles and effects
      renderer.renderParticles(ctx, particlesRef.current, canvas.width, canvas.height);
      renderer.renderHitEffects(ctx, hitEffectsRef.current, canvas.width, canvas.height);

      // Render UI
      renderer.renderHealthBar(ctx, 30, 30, 250, playerRef.current.health, playerRef.current.maxHealth, true, 'YOU');
      renderer.renderEnergyBar(ctx, 30, 60, 250, playerRef.current.energy, playerRef.current.maxEnergy);
      
      renderer.renderHealthBar(ctx, canvas.width - 280, 30, 250, enemyRef.current.health, enemyRef.current.maxHealth, false, enemy?.name || 'ENEMY');
      renderer.renderEnergyBar(ctx, canvas.width - 280, 60, 250, enemyRef.current.energy, enemyRef.current.maxEnergy);

      renderer.renderRoundInfo(ctx, canvas.width, canvas.height, gameState.currentRound, gameState.totalRounds, gameState.playerWins, gameState.enemyWins, gameState.roundTimer);

      // Combo display
      if (playerRef.current.comboCount >= 2) {
        renderer.renderCombo(ctx, canvas.width / 2, canvas.height - 50, playerRef.current.comboCount, timestamp);
      }

      // Countdown overlay
      if (countdownRef.current) {
        renderer.renderCountdown(ctx, canvas.width, canvas.height, countdownRef.current.count, countdownRef.current.progress);
      }

      // Round result overlay
      if (roundResultRef.current) {
        renderer.renderVictoryScreen(ctx, canvas.width, canvas.height, roundResultRef.current.winner, timestamp);
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, currentEnemy, handlePlayerInput, updateAI, endRound]);

  // Start game loop
  useEffect(() => {
    if (gameState.screen === 'fighting') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.screen, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      
      if (e.key === 'Escape' && gameState.screen === 'fighting') {
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.screen]);

  const startLevel = (levelId: number) => {
    const level = getLevelById(levelId);
    if (!level) return;
    
    matchStatsRef.current = { damageDealt: 0, comboMax: 0, specialsUsed: 0, perfectRounds: 0 };
    
    setGameState(prev => ({
      ...prev,
      screen: 'fighting',
      currentLevel: levelId,
      currentRound: 1,
      totalRounds: level.rounds,
      playerWins: 0,
      enemyWins: 0,
    }));

    audio.resume();
    startRound();
  };

  const handleUpgradeStat = (statKey: keyof typeof STAT_UPGRADE_CONFIG) => {
    if (upgradeStat(statKey)) {
      audio.playUpgrade();
      setProgress(loadProgress());
    }
  };

  const handleUnlockAbility = (ability: PowerAbility) => {
    if (unlockAbility(ability.id, ability.unlockCost)) {
      audio.playUnlock();
      setProgress(loadProgress());
    }
  };

  const handleSelectAbility = (abilityId: string) => {
    selectAbility(abilityId);
    audio.playSelect();
    setProgress(loadProgress());
  };

  // Render different screens
  const renderMenu = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-2 tracking-tight">
          SHADOW NINJA
        </h1>
        <h2 className="text-3xl font-bold text-white/80">FIGHT</h2>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-2xl">💰</span>
          <span className="text-2xl font-bold text-yellow-400">{progress.coins}</span>
          <span className="text-lg text-white/60 ml-4">Level {progress.playerLevel}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-64">
        <Button 
          onClick={() => setGameState(prev => ({ ...prev, screen: 'levelSelect' }))}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 text-lg"
        >
          ⚔️ FIGHT
        </Button>
        <Button 
          onClick={() => setGameState(prev => ({ ...prev, screen: 'abilities' }))}
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold py-3"
        >
          ✨ Abilities
        </Button>
        <Button 
          onClick={() => setGameState(prev => ({ ...prev, screen: 'stats' }))}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3"
        >
          📊 Upgrade Stats
        </Button>
        <Button 
          onClick={() => setGameState(prev => ({ ...prev, screen: 'settings' }))}
          className="bg-white/10 hover:bg-white/20 text-white py-3"
        >
          ⚙️ Settings
        </Button>
      </div>

      <div className="mt-8 text-white/50 text-sm">
        <p>Wins: {progress.totalWins} | KOs: {progress.totalKOs} | Best Combo: {progress.bestCombo}</p>
      </div>
    </div>
  );

  const renderLevelSelect = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Button 
          onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))}
          variant="ghost"
          className="text-white"
        >
          ← Back
        </Button>
        <h2 className="text-2xl font-bold text-white">SELECT STAGE</h2>
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="text-xl font-bold text-yellow-400">{progress.coins}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
        {LEVELS.map((level, index) => {
          const enemy = getEnemyById(level.enemyId);
          const isUnlocked = index + 1 <= progress.highestUnlockedLevel;
          const isCompleted = progress.completedLevels.includes(level.id);

          return (
            <button
              key={level.id}
              onClick={() => isUnlocked && startLevel(level.id)}
              disabled={!isUnlocked}
              className={`relative p-4 rounded-xl text-left transition-all transform hover:scale-105 ${
                isUnlocked 
                  ? isCompleted 
                    ? 'bg-gradient-to-br from-green-600/30 to-emerald-700/30 border-2 border-green-500'
                    : 'bg-gradient-to-br from-indigo-600/30 to-purple-700/30 border-2 border-indigo-500 hover:border-cyan-400'
                  : 'bg-slate-800/50 border-2 border-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              {isCompleted && (
                <div className="absolute top-2 right-2 text-green-400 text-xl">✓</div>
              )}
              <div className="text-3xl mb-2">{enemy?.avatar || '👤'}</div>
              <div className="text-white font-bold">{enemy?.name}</div>
              <div className="text-white/60 text-sm">{enemy?.title}</div>
              <div className="text-xs text-white/40 mt-2">
                {isUnlocked ? `${level.rounds} Rounds • ${level.rewards.coins} 💰` : '🔒 Locked'}
              </div>
              {!isUnlocked && (
                <div className="text-xs text-yellow-400 mt-1">
                  Complete Stage {index} to unlock
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderAbilities = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Button 
          onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))}
          variant="ghost"
          className="text-white"
        >
          ← Back
        </Button>
        <h2 className="text-2xl font-bold text-white">ABILITIES</h2>
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="text-xl font-bold text-yellow-400">{progress.coins}</span>
        </div>
      </div>

      <div className="text-center mb-4 text-white/70">
        Selected: {progress.selectedAbilities.length}/3 (Press 1, 2, 3 in battle)
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
        {POWER_ABILITIES.map(ability => {
          const isUnlocked = progress.unlockedAbilities.includes(ability.id);
          const isSelected = progress.selectedAbilities.includes(ability.id);
          const level = progress.abilityLevels[ability.id] || 1;

          return (
            <div
              key={ability.id}
              className={`p-4 rounded-xl ${
                isUnlocked 
                  ? isSelected
                    ? 'bg-gradient-to-br from-cyan-600/40 to-blue-700/40 border-2 border-cyan-400'
                    : 'bg-gradient-to-br from-purple-600/30 to-indigo-700/30 border-2 border-purple-500'
                  : 'bg-slate-800/50 border-2 border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{ability.icon}</span>
                  <div>
                    <div className="text-white font-bold">{ability.name}</div>
                    {isUnlocked && (
                      <div className="text-xs text-cyan-400">Level {level}/{ability.maxLevel}</div>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  ability.type === 'offensive' ? 'bg-red-500/30 text-red-300' :
                  ability.type === 'defensive' ? 'bg-blue-500/30 text-blue-300' :
                  'bg-green-500/30 text-green-300'
                }`}>
                  {ability.type}
                </span>
              </div>
              
              <p className="text-white/60 text-sm mb-3">{ability.description}</p>
              
              <div className="text-xs text-white/40 mb-3">
                Energy: {ability.energyCost} | Cooldown: {ability.cooldown}s
                {ability.damage && ` | Damage: ${ability.damage}`}
              </div>

              {isUnlocked ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSelectAbility(ability.id)}
                    size="sm"
                    className={isSelected ? 'bg-cyan-600' : 'bg-purple-600'}
                  >
                    {isSelected ? '✓ Selected' : 'Select'}
                  </Button>
                  {level < ability.maxLevel && (
                    <Button
                      onClick={() => {
                        const cost = Math.floor(ability.upgradeCost * Math.pow(1.5, level - 1));
                        if (upgradeAbility(ability.id, cost)) {
                          audio.playUpgrade();
                          setProgress(loadProgress());
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="border-yellow-500 text-yellow-400"
                    >
                      Upgrade ({Math.floor(ability.upgradeCost * Math.pow(1.5, level - 1))} 💰)
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => handleUnlockAbility(ability)}
                  size="sm"
                  disabled={progress.coins < ability.unlockCost}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black"
                >
                  Unlock ({ability.unlockCost} 💰)
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Button 
          onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))}
          variant="ghost"
          className="text-white"
        >
          ← Back
        </Button>
        <h2 className="text-2xl font-bold text-white">UPGRADE STATS</h2>
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="text-xl font-bold text-yellow-400">{progress.coins}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {(Object.keys(STAT_UPGRADE_CONFIG) as Array<keyof typeof STAT_UPGRADE_CONFIG>).map(statKey => {
          const config = STAT_UPGRADE_CONFIG[statKey];
          const currentLevel = progress.statUpgrades[statKey] || 0;
          const cost = Math.floor(config.basePrice * Math.pow(config.multiplier, currentLevel));
          const currentValue = BASE_PLAYER_STATS[statKey] + currentLevel * config.perLevel;
          const maxed = currentLevel >= config.maxLevel;

          return (
            <div key={statKey} className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white font-bold">{config.name}</div>
                  <div className="text-white/50 text-sm">Level {currentLevel}/{config.maxLevel}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-400">{currentValue.toFixed(1)}</div>
                  {!maxed && (
                    <div className="text-xs text-green-400">+{config.perLevel}</div>
                  )}
                </div>
              </div>
              
              <Progress value={(currentLevel / config.maxLevel) * 100} className="h-2 mb-3" />
              
              <Button
                onClick={() => handleUpgradeStat(statKey)}
                disabled={maxed || progress.coins < cost}
                className={`w-full ${maxed ? 'bg-slate-600' : 'bg-green-600 hover:bg-green-500'}`}
              >
                {maxed ? 'MAXED' : `Upgrade (${cost} 💰)`}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold text-white mb-8">SETTINGS</h2>
      
      <div className="space-y-4 w-64">
        <Button
          onClick={() => { toggleSound(); setProgress(loadProgress()); audio.playSelect(); }}
          className="w-full bg-slate-700 hover:bg-slate-600"
        >
          Sound: {progress.soundEnabled ? '🔊 ON' : '🔇 OFF'}
        </Button>
        <Button
          onClick={() => { toggleMusic(); setProgress(loadProgress()); }}
          className="w-full bg-slate-700 hover:bg-slate-600"
        >
          Music: {progress.musicEnabled ? '🎵 ON' : '🔇 OFF'}
        </Button>
        
        <div className="text-white text-center mt-4">Difficulty</div>
        <div className="flex gap-2">
          {(['easy', 'normal', 'hard'] as const).map(diff => (
            <Button
              key={diff}
              onClick={() => { setDifficulty(diff); setProgress(loadProgress()); audio.playSelect(); }}
              className={`flex-1 ${progress.difficulty === diff ? 'bg-cyan-600' : 'bg-slate-700'}`}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </Button>
          ))}
        </div>

        <Button
          onClick={() => {
            if (confirm('Reset all progress? This cannot be undone!')) {
              clearProgress();
              setProgress(loadProgress());
            }
          }}
          className="w-full bg-red-600 hover:bg-red-500 mt-8"
        >
          Reset Progress
        </Button>
      </div>

      <Button 
        onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))}
        className="mt-8 bg-white/10"
      >
        ← Back to Menu
      </Button>
    </div>
  );

  const renderFighting = () => (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Ability bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {progress.selectedAbilities.map((abilityId, index) => {
          const ability = getAbilityById(abilityId);
          const cooldown = abilityCooldownsRef.current[abilityId] || 0;
          const isReady = cooldown <= 0;
          
          return ability ? (
            <div
              key={abilityId}
              className={`relative w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center ${
                isReady ? 'border-cyan-400 bg-cyan-900/50' : 'border-slate-600 bg-slate-900/50'
              }`}
            >
              <span className="text-2xl">{ability.icon}</span>
              <span className="text-xs text-white/70">{index + 1}</span>
              {!isReady && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                  <span className="text-white font-bold">{Math.ceil(cooldown / 60)}</span>
                </div>
              )}
            </div>
          ) : null;
        })}
      </div>

      {/* Pause overlay */}
      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-bold text-white mb-8">PAUSED</h2>
          <Button onClick={() => setGameState(prev => ({ ...prev, isPaused: false }))} className="mb-4">
            Resume
          </Button>
          <Button onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))} variant="outline" className="text-white border-white">
            Quit Match
          </Button>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-white/50 text-xs">
        ←→: Move | Z: Punch | X: Kick | C: Block | 1-3: Abilities | ESC: Pause
      </div>
    </div>
  );

  const renderRoundEnd = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center">
      <h2 className="text-3xl font-bold text-white mb-4">Round {gameState.currentRound - 1} Complete!</h2>
      <div className="flex items-center gap-8 mb-8">
        <div className="text-center">
          <div className="text-6xl text-cyan-400 font-black">{gameState.playerWins}</div>
          <div className="text-white/60">YOU</div>
        </div>
        <div className="text-2xl text-white/40">VS</div>
        <div className="text-center">
          <div className="text-6xl text-red-400 font-black">{gameState.enemyWins}</div>
          <div className="text-white/60">ENEMY</div>
        </div>
      </div>
      <Button onClick={() => { setGameState(prev => ({ ...prev, screen: 'fighting' })); startRound(); }} className="bg-cyan-600">
        Next Round →
      </Button>
    </div>
  );

  const renderLevelComplete = () => {
    const level = getLevelById(gameState.currentLevel);
    const enemy = level ? getEnemyById(level.enemyId) : null;
    
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex flex-col items-center justify-center">
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-4">
          VICTORY!
        </h2>
        <div className="text-xl text-white/70 mb-6">You defeated {enemy?.name}!</div>
        
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
          <div className="text-center text-white mb-4">Rewards</div>
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{level?.rewards.coins}</div>
              <div className="text-white/60">Coins</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{level?.rewards.xp}</div>
              <div className="text-white/60">XP</div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {gameState.currentLevel < LEVELS.length && (
            <Button onClick={() => startLevel(gameState.currentLevel + 1)} className="bg-cyan-600">
              Next Stage →
            </Button>
          )}
          <Button onClick={() => setGameState(prev => ({ ...prev, screen: 'levelSelect' }))} variant="outline" className="text-white border-white">
            Level Select
          </Button>
          <Button onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))} variant="ghost" className="text-white">
            Menu
          </Button>
        </div>
      </div>
    );
  };

  const renderGameOver = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex flex-col items-center justify-center">
      <h2 className="text-5xl font-black text-red-500 mb-4">DEFEAT</h2>
      <p className="text-white/70 mb-8">You lost the match...</p>
      
      <div className="flex gap-4">
        <Button onClick={() => startLevel(gameState.currentLevel)} className="bg-red-600">
          Retry
        </Button>
        <Button onClick={() => setGameState(prev => ({ ...prev, screen: 'levelSelect' }))} variant="outline" className="text-white border-white">
          Level Select
        </Button>
        <Button onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))} variant="ghost" className="text-white">
          Menu
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full min-h-[500px] bg-black overflow-hidden">
      {gameState.screen === 'menu' && renderMenu()}
      {gameState.screen === 'levelSelect' && renderLevelSelect()}
      {gameState.screen === 'abilities' && renderAbilities()}
      {gameState.screen === 'stats' && renderStats()}
      {gameState.screen === 'settings' && renderSettings()}
      {gameState.screen === 'fighting' && renderFighting()}
      {gameState.screen === 'roundEnd' && renderRoundEnd()}
      {gameState.screen === 'levelComplete' && renderLevelComplete()}
      {gameState.screen === 'gameOver' && renderGameOver()}
    </div>
  );
};

export default ShadowNinjaFight;
