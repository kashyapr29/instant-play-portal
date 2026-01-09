import { useEffect, useRef, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Play, Star } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import { UpgradeShop, Upgrade } from '@/components/UpgradeShop';
import { Achievements } from '@/components/Achievements';
import { AchievementToast } from '@/components/AchievementToast';
import { MobileControls } from '@/components/MobileControls';
import {
  Player, Enemy, Projectile, Particle, PowerUp, GameState, EnemyType, GameProgress, UPGRADE_CONFIG
} from './types';
import { loadProgress, saveProgress, updateHighScore, updateHighestWave, addKills, addCredits, purchaseUpgrade } from './storage';
import { WEAPONS, ABILITIES, getWave, getWeapon } from './waves';
import {
  renderGame, renderMenu, renderPause, renderGameOver, renderWaveComplete
} from './renderer';
import { Achievement, updateStats } from '@/lib/achievements';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;

const createPlayer = (upgrades?: GameProgress['upgrades']): Player => {
  const healthBonus = upgrades ? (upgrades.health - 1) * 20 : 0;
  const shieldBonus = upgrades ? (upgrades.shield - 1) * 10 : 0;
  const energyBonus = upgrades ? (upgrades.energy - 1) * 15 : 0;
  const speedBonus = upgrades ? (upgrades.speed - 1) * 0.5 : 0;
  
  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    angle: 0,
    health: 100 + healthBonus,
    maxHealth: 100 + healthBonus,
    shield: 50 + shieldBonus,
    maxShield: 50 + shieldBonus,
    speed: 5 + speedBonus,
    weapon: WEAPONS[0],
    abilities: ABILITIES.slice(0, 4).map(a => ({ ...a })),
    energy: 100 + energyBonus,
    maxEnergy: 100 + energyBonus,
  };
};

const createEnemy = (type: EnemyType, x: number, y: number, waveMultiplier: number): Enemy => {
  const configs: Record<EnemyType, Partial<Enemy>> = {
    drone: {
      health: 30 * waveMultiplier,
      maxHealth: 30 * waveMultiplier,
      speed: 3,
      damage: 10,
      color: '#ff0066',
      glowColor: 'rgba(255, 0, 102, 0.4)',
      size: 12,
      points: 100,
      behavior: 'chase',
      attackCooldown: 1000,
    },
    sentinel: {
      health: 80 * waveMultiplier,
      maxHealth: 80 * waveMultiplier,
      speed: 2,
      damage: 20,
      color: '#ff8800',
      glowColor: 'rgba(255, 136, 0, 0.4)',
      size: 18,
      points: 250,
      behavior: 'circle',
      attackCooldown: 1500,
    },
    phantom: {
      health: 50 * waveMultiplier,
      maxHealth: 50 * waveMultiplier,
      speed: 4,
      damage: 15,
      color: '#8800ff',
      glowColor: 'rgba(136, 0, 255, 0.4)',
      size: 14,
      points: 300,
      behavior: 'teleport',
      attackCooldown: 800,
      teleportCooldown: 3000,
      lastTeleport: 0,
    },
    juggernaut: {
      health: 200 * waveMultiplier,
      maxHealth: 200 * waveMultiplier,
      speed: 1.2,
      damage: 40,
      color: '#ffaa00',
      glowColor: 'rgba(255, 170, 0, 0.4)',
      size: 25,
      points: 500,
      behavior: 'chase',
      attackCooldown: 2000,
    },
    sniper: {
      health: 40 * waveMultiplier,
      maxHealth: 40 * waveMultiplier,
      speed: 1.5,
      damage: 30,
      color: '#00ff88',
      glowColor: 'rgba(0, 255, 136, 0.4)',
      size: 16,
      points: 400,
      behavior: 'ranged',
      attackCooldown: 2500,
    },
    boss: {
      health: 1000 * waveMultiplier,
      maxHealth: 1000 * waveMultiplier,
      speed: 1,
      damage: 50,
      color: '#ff0044',
      glowColor: 'rgba(255, 0, 68, 0.5)',
      size: 50,
      points: 5000,
      behavior: 'boss',
      attackCooldown: 500,
    },
  };

  const config = configs[type];
  return {
    id: Math.random().toString(36).substr(2, 9),
    x,
    y,
    angle: 0,
    type,
    lastAttack: 0,
    ...config,
  } as Enemy;
};

const CyberCombat = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    status: 'menu',
    score: 0,
    wave: 1,
    enemiesKilled: 0,
    timeElapsed: 0,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
  });

  const playerRef = useRef<Player>(createPlayer());
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const lastShotRef = useRef<number>(0);
  const spawnQueueRef = useRef<{ type: EnemyType; delay: number }[]>([]);
  const waveStartTimeRef = useRef<number>(0);
  const isNewHighScoreRef = useRef<boolean>(false);
  const progressRef = useRef(loadProgress());
  const mobileMovement = useRef({ dx: 0, dy: 0 });
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  const getUpgrades = (): Upgrade[] => {
    const prog = loadProgress();
    return Object.entries(UPGRADE_CONFIG).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.description,
      icon: key as Upgrade['icon'],
      level: prog.upgrades[key as keyof typeof prog.upgrades],
      maxLevel: config.maxLevel,
      basePrice: config.basePrice,
      priceMultiplier: config.multiplier,
    }));
  };

  const handlePurchaseUpgrade = (upgradeId: string) => {
    if (purchaseUpgrade(upgradeId as keyof GameProgress['upgrades'])) {
      progressRef.current = loadProgress();
      const newAchievements = updateStats({ upgradesPurchased: 1 });
      if (newAchievements.length > 0) {
        setUnlockedAchievement(newAchievements[0]);
      }
    }
  };

  const handleClaimReward = (amount: number) => {
    addCredits(amount);
    progressRef.current = loadProgress();
  };

  const handleMobileMove = useCallback((dx: number, dy: number) => {
    mobileMovement.current = { dx, dy };
  }, []);

  const handleMobileFire = useCallback((firing: boolean) => {
    mouseRef.current.down = firing;
  }, []);

  const progress = loadProgress();

  const spawnEnemy = useCallback((type: EnemyType) => {
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;

    switch (side) {
      case 0: x = Math.random() * CANVAS_WIDTH; y = -30; break;
      case 1: x = CANVAS_WIDTH + 30; y = Math.random() * CANVAS_HEIGHT; break;
      case 2: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + 30; break;
      default: x = -30; y = Math.random() * CANVAS_HEIGHT;
    }

    const waveMultiplier = 1 + (gameState.wave - 1) * 0.15;
    enemiesRef.current.push(createEnemy(type, x, y, waveMultiplier));
  }, [gameState.wave]);

  const startWave = useCallback((waveNum: number) => {
    const wave = getWave(waveNum);
    spawnQueueRef.current = [];
    let totalDelay = 0;

    wave.enemies.forEach(enemyGroup => {
      for (let i = 0; i < enemyGroup.count; i++) {
        totalDelay += enemyGroup.spawnDelay;
        spawnQueueRef.current.push({ type: enemyGroup.type, delay: totalDelay });
      }
    });

    waveStartTimeRef.current = performance.now();
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, count: number, type: Particle['type']) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 3 + Math.random() * 4,
        type,
      });
    }
  }, []);

  const spawnPowerUp = useCallback((x: number, y: number) => {
    if (Math.random() > 0.15) return;

    const types: PowerUp['type'][] = ['health', 'shield', 'energy', 'damage', 'speed'];
    const colors: Record<PowerUp['type'], { color: string; glow: string }> = {
      health: { color: '#00ff00', glow: 'rgba(0, 255, 0, 0.4)' },
      shield: { color: '#00aaff', glow: 'rgba(0, 170, 255, 0.4)' },
      energy: { color: '#ffaa00', glow: 'rgba(255, 170, 0, 0.4)' },
      damage: { color: '#ff0066', glow: 'rgba(255, 0, 102, 0.4)' },
      speed: { color: '#00ffff', glow: 'rgba(0, 255, 255, 0.4)' },
    };

    const type = types[Math.floor(Math.random() * types.length)];
    powerUpsRef.current.push({
      x,
      y,
      type,
      duration: 10000,
      color: colors[type].color,
      glowColor: colors[type].glow,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }, []);

  const shoot = useCallback(() => {
    const player = playerRef.current;
    const now = performance.now();

    if (now - lastShotRef.current < player.weapon.fireRate) return;
    if (player.energy < player.weapon.energyCost) return;

    lastShotRef.current = now;
    player.energy -= player.weapon.energyCost;

    for (let i = 0; i < player.weapon.projectilesPerShot; i++) {
      const spread = (Math.random() - 0.5) * player.weapon.spread;
      const angle = player.angle + spread;

      projectilesRef.current.push({
        x: player.x + Math.cos(player.angle) * 25,
        y: player.y + Math.sin(player.angle) * 25,
        vx: Math.cos(angle) * player.weapon.projectileSpeed,
        vy: Math.sin(angle) * player.weapon.projectileSpeed,
        damage: player.weapon.damage,
        color: player.weapon.projectileColor,
        size: 6,
        isEnemy: false,
        trail: [],
      });
    }
  }, []);

  const activateAbility = useCallback((index: number) => {
    const player = playerRef.current;
    const ability = player.abilities[index];

    if (!ability || ability.currentCooldown > 0 || player.energy < ability.energyCost) return;

    player.energy -= ability.energyCost;
    ability.currentCooldown = ability.cooldown;
    ability.active = true;

    switch (ability.id) {
      case 'dash':
        const dashSpeed = 30;
        player.x += Math.cos(player.angle) * dashSpeed * 5;
        player.y += Math.sin(player.angle) * dashSpeed * 5;
        player.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, player.x));
        player.y = Math.max(20, Math.min(CANVAS_HEIGHT - 20, player.y));
        createParticles(player.x, player.y, '#00ffff', 15, 'trail');
        break;

      case 'shield':
        player.shield = player.maxShield;
        createParticles(player.x, player.y, '#00aaff', 20, 'shield');
        break;

      case 'overcharge':
        player.weapon = { ...player.weapon, damage: player.weapon.damage * 2, fireRate: player.weapon.fireRate * 0.5 };
        setTimeout(() => {
          player.weapon = getWeapon(player.weapon.id);
        }, ability.duration);
        break;

      case 'emp':
        enemiesRef.current.forEach(enemy => {
          const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
          if (dist < 200) {
            enemy.health -= 50;
            createParticles(enemy.x, enemy.y, '#ffff00', 10, 'spark');
          }
        });
        createParticles(player.x, player.y, '#ffff00', 30, 'energy');
        break;
    }

    setTimeout(() => {
      ability.active = false;
    }, ability.duration);
  }, [createParticles]);

  const gameLoop = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (gameState.status === 'menu') {
      renderMenu(ctx, canvas, progress.highScore, progress.highestWave, time);
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (gameState.status === 'paused') {
      renderPause(ctx, canvas);
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (gameState.status === 'gameover') {
      renderGameOver(ctx, canvas, gameState.score, gameState.wave, gameState.enemiesKilled, isNewHighScoreRef.current, time);
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (gameState.status === 'waveComplete') {
      const wave = getWave(gameState.wave);
      renderWaveComplete(ctx, canvas, gameState.wave, wave.name, time);
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const player = playerRef.current;

    // Player movement (keyboard + mobile)
    let dx = 0, dy = 0;
    if (keysRef.current.has('w') || keysRef.current.has('arrowup')) dy -= 1;
    if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) dy += 1;
    if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) dx -= 1;
    if (keysRef.current.has('d') || keysRef.current.has('arrowright')) dx += 1;
    
    // Add mobile joystick input
    dx += mobileMovement.current.dx;
    dy += mobileMovement.current.dy;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      player.x += (dx / len) * player.speed;
      player.y += (dy / len) * player.speed;
      player.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, player.x));
      player.y = Math.max(20, Math.min(CANVAS_HEIGHT - 20, player.y));
    }

    // Player angle
    const rect = canvas.getBoundingClientRect();
    const mx = (mouseRef.current.x - rect.left) * (canvas.width / rect.width);
    const my = (mouseRef.current.y - rect.top) * (canvas.height / rect.height);
    player.angle = Math.atan2(my - player.y, mx - player.x);

    // Shooting
    if (mouseRef.current.down) {
      shoot();
    }

    // Energy regeneration
    player.energy = Math.min(player.maxEnergy, player.energy + 0.15);

    // Ability cooldowns
    player.abilities.forEach(ability => {
      if (ability.currentCooldown > 0) {
        ability.currentCooldown -= deltaTime;
      }
    });

    // Spawn enemies from queue
    const elapsedSinceWaveStart = time - waveStartTimeRef.current;
    while (spawnQueueRef.current.length > 0 && spawnQueueRef.current[0].delay <= elapsedSinceWaveStart) {
      const spawn = spawnQueueRef.current.shift()!;
      spawnEnemy(spawn.type);
    }

    // Update enemies
    enemiesRef.current.forEach(enemy => {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      enemy.angle = Math.atan2(dy, dx);

      switch (enemy.behavior) {
        case 'chase':
        case 'boss':
          if (dist > 30) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
          }
          break;

        case 'circle':
          const circleAngle = Math.atan2(dy, dx) + 0.02;
          const targetDist = 150;
          enemy.x += Math.cos(circleAngle) * enemy.speed + (targetDist - dist) * 0.01 * (dx / dist);
          enemy.y += Math.sin(circleAngle) * enemy.speed + (targetDist - dist) * 0.01 * (dy / dist);
          break;

        case 'teleport':
          if (time - (enemy.lastTeleport || 0) > (enemy.teleportCooldown || 3000)) {
            enemy.lastTeleport = time;
            const teleportDist = 100 + Math.random() * 100;
            const teleportAngle = Math.random() * Math.PI * 2;
            enemy.x = player.x + Math.cos(teleportAngle) * teleportDist;
            enemy.y = player.y + Math.sin(teleportAngle) * teleportDist;
            enemy.x = Math.max(30, Math.min(CANVAS_WIDTH - 30, enemy.x));
            enemy.y = Math.max(30, Math.min(CANVAS_HEIGHT - 30, enemy.y));
            createParticles(enemy.x, enemy.y, enemy.color, 10, 'energy');
          } else if (dist > 50) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
          }
          break;

        case 'ranged':
          if (dist < 250) {
            enemy.x -= (dx / dist) * enemy.speed * 0.5;
            enemy.y -= (dy / dist) * enemy.speed * 0.5;
          } else if (dist > 350) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
          }

          if (time - enemy.lastAttack > enemy.attackCooldown) {
            enemy.lastAttack = time;
            projectilesRef.current.push({
              x: enemy.x,
              y: enemy.y,
              vx: (dx / dist) * 8,
              vy: (dy / dist) * 8,
              damage: enemy.damage,
              color: enemy.color,
              size: 5,
              isEnemy: true,
              trail: [],
            });
          }
          break;
      }

      // Melee attack
      if (dist < enemy.size + 20 && time - enemy.lastAttack > enemy.attackCooldown) {
        enemy.lastAttack = time;
        if (player.shield > 0) {
          player.shield = Math.max(0, player.shield - enemy.damage);
        } else {
          player.health -= enemy.damage;
        }
        createParticles(player.x, player.y, '#ff0000', 8, 'spark');
      }
    });

    // Update projectiles
    projectilesRef.current = projectilesRef.current.filter(proj => {
      proj.trail.push({ x: proj.x, y: proj.y });
      if (proj.trail.length > 8) proj.trail.shift();

      proj.x += proj.vx;
      proj.y += proj.vy;

      if (proj.x < -50 || proj.x > CANVAS_WIDTH + 50 || proj.y < -50 || proj.y > CANVAS_HEIGHT + 50) {
        return false;
      }

      if (!proj.isEnemy) {
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const enemy = enemiesRef.current[i];
          const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
          if (dist < enemy.size + proj.size) {
            enemy.health -= proj.damage;
            createParticles(proj.x, proj.y, enemy.color, 5, 'spark');

            if (enemy.health <= 0) {
              createParticles(enemy.x, enemy.y, enemy.color, 20, 'explosion');
              spawnPowerUp(enemy.x, enemy.y);

              setGameState(prev => {
                const newCombo = prev.combo + 1;
                return {
                  ...prev,
                  score: prev.score + enemy.points * (1 + newCombo * 0.1),
                  enemiesKilled: prev.enemiesKilled + 1,
                  combo: newCombo,
                  maxCombo: Math.max(prev.maxCombo, newCombo),
                  comboTimer: 2000,
                };
              });

              enemiesRef.current.splice(i, 1);
            }
            return false;
          }
        }
      } else {
        const dist = Math.hypot(proj.x - player.x, proj.y - player.y);
        if (dist < 20) {
          if (player.shield > 0) {
            player.shield = Math.max(0, player.shield - proj.damage);
          } else {
            player.health -= proj.damage;
          }
          createParticles(proj.x, proj.y, '#ff0000', 5, 'spark');
          return false;
        }
      }

      return true;
    });

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= 1;
      return p.life > 0;
    });

    // Update power-ups
    powerUpsRef.current = powerUpsRef.current.filter(powerUp => {
      powerUp.duration -= deltaTime;
      if (powerUp.duration <= 0) return false;

      const dist = Math.hypot(powerUp.x - player.x, powerUp.y - player.y);
      if (dist < 30) {
        switch (powerUp.type) {
          case 'health':
            player.health = Math.min(player.maxHealth, player.health + 30);
            break;
          case 'shield':
            player.shield = Math.min(player.maxShield, player.shield + 25);
            break;
          case 'energy':
            player.energy = player.maxEnergy;
            break;
          case 'damage':
            // Temporary damage boost handled elsewhere
            break;
          case 'speed':
            // Temporary speed boost handled elsewhere
            break;
        }
        createParticles(powerUp.x, powerUp.y, powerUp.color, 10, 'energy');
        return false;
      }

      return true;
    });

    // Combo timer
    setGameState(prev => {
      if (prev.comboTimer > 0) {
        const newTimer = prev.comboTimer - deltaTime;
        if (newTimer <= 0) {
          return { ...prev, combo: 0, comboTimer: 0 };
        }
        return { ...prev, comboTimer: newTimer };
      }
      return prev;
    });

    // Check player death
    if (player.health <= 0) {
      isNewHighScoreRef.current = updateHighScore(gameState.score);
      updateHighestWave(gameState.wave);
      addKills(gameState.enemiesKilled);
      const newAchievements = updateStats({
        totalKills: gameState.enemiesKilled,
        totalScore: gameState.score,
        highestWave: gameState.wave,
        gamesPlayed: 1,
      });
      if (newAchievements.length > 0) {
        setUnlockedAchievement(newAchievements[0]);
      }
      setGameState(prev => ({ ...prev, status: 'gameover' }));
    }

    // Check wave complete
    if (spawnQueueRef.current.length === 0 && enemiesRef.current.length === 0 && gameState.status === 'playing') {
      setGameState(prev => ({ ...prev, status: 'waveComplete' }));
      setTimeout(() => {
        setGameState(prev => ({ ...prev, wave: prev.wave + 1, status: 'playing' }));
        startWave(gameState.wave + 1);
      }, 2000);
    }

    // Render
    renderGame(ctx, canvas, player, enemiesRef.current, projectilesRef.current, particlesRef.current, powerUpsRef.current, gameState, time);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, createParticles, spawnPowerUp, spawnEnemy, shoot, startWave, progress]);

  const startGame = useCallback(() => {
    const prog = loadProgress();
    playerRef.current = createPlayer(prog.upgrades);
    enemiesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    spawnQueueRef.current = [];
    isNewHighScoreRef.current = false;

    setGameState({
      status: 'playing',
      score: 0,
      wave: 1,
      enemiesKilled: 0,
      timeElapsed: 0,
      combo: 0,
      maxCombo: 0,
      comboTimer: 0,
    });

    startWave(1);
  }, [startWave]);

  const handleWaveComplete = useCallback(() => {
    addCredits(Math.floor(gameState.score * 0.1));
    progressRef.current = loadProgress();
    setGameState(prev => ({ ...prev, status: 'playing', wave: prev.wave + 1 }));
    startWave(gameState.wave + 1);
  }, [gameState, startWave]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      if (key === 'escape' && gameState.status === 'playing') {
        setGameState(prev => ({ ...prev, status: 'paused' }));
      } else if (key === 'escape' && gameState.status === 'paused') {
        setGameState(prev => ({ ...prev, status: 'playing' }));
      }

      if (key >= '1' && key <= '4' && gameState.status === 'playing') {
        activateAbility(parseInt(key) - 1);
      }

      if (key === 'r' && gameState.status === 'playing') {
        playerRef.current.energy = Math.min(playerRef.current.maxEnergy, playerRef.current.energy + 30);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseRef.current.down = true;

        if (gameState.status === 'menu' || gameState.status === 'gameover') {
          startGame();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseRef.current.down = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState.status, startGame, activateAbility]);

  return (
    <>
      <Helmet>
        <title>Cyber Combat - Neon Arena Shooter</title>
        <meta name="description" content="Battle through waves of cyber enemies in this futuristic neon arena shooter with special abilities." />
      </Helmet>
      <GameLayout gameId="cyber-combat" title="Cyber Combat">
        <div className="flex flex-col items-center gap-4 relative">
          <canvas
            ref={canvasRef}
            className="rounded-lg border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.3)]"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          
          {/* Menu overlay with upgrade shop */}
          {gameState.status === 'menu' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
              <h1 className="text-6xl font-black text-cyan-400 mb-2 font-game-title tracking-wider">CYBER COMBAT</h1>
              <p className="text-cyan-200/60 mb-4">Futuristic Neon Arena Shooter</p>
              <div className="flex items-center gap-2 mb-6 text-game-gold">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold">{progressRef.current.credits.toLocaleString()} Credits</span>
              </div>
              <div className="flex flex-col gap-4 w-64">
                <button 
                  onClick={startGame}
                  className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,255,255,0.5)] flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" /> START GAME
                </button>
                <UpgradeShop 
                  credits={progressRef.current.credits} 
                  upgrades={getUpgrades()} 
                  onPurchase={handlePurchaseUpgrade}
                  theme="cyber"
                />
                <Achievements onClaimReward={handleClaimReward} theme="cyber" />
              </div>
              <div className="mt-6 text-cyan-300/40 text-sm">
                High Score: {progressRef.current.highScore.toLocaleString()} | Best Wave: {progressRef.current.highestWave}
              </div>
            </div>
          )}
          
          {/* Wave complete overlay */}
          {gameState.status === 'waveComplete' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
              <h2 className="text-4xl font-black text-cyan-400 mb-4 font-game-title">WAVE {gameState.wave} COMPLETE</h2>
              <p className="text-2xl font-bold text-game-gold mb-2">Score: {gameState.score.toLocaleString()}</p>
              <p className="text-lg font-bold text-green-400 mb-6">+{Math.floor(gameState.score * 0.1)} Credits earned!</p>
              <button 
                onClick={handleWaveComplete}
                className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-all hover:scale-105"
              >
                NEXT WAVE
              </button>
            </div>
          )}
          
          <div className="text-muted-foreground text-sm font-game">
            WASD - Move | Mouse - Aim | Click - Shoot | 1-4 - Abilities | R - Reload Energy | ESC - Pause
          </div>
          
          {/* Mobile controls */}
          {gameState.status === 'playing' && (
            <MobileControls onMove={handleMobileMove} onFire={handleMobileFire} />
          )}
          
          {/* Achievement toast */}
          <AchievementToast achievement={unlockedAchievement} onClose={() => setUnlockedAchievement(null)} />
        </div>
      </GameLayout>
    </>
  );
};

export default CyberCombat;
