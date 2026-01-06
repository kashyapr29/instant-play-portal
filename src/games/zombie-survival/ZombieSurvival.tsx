import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Skull, Trophy, Play, RotateCcw, ChevronRight, Shield, Heart, Lock, Crosshair, Star } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import { UpgradeShop, Upgrade } from '@/components/UpgradeShop.tsx';
import { Achievements } from '@/components/Achievements.tsx';
import { AchievementToast } from '@/components/AchievementToast.tsx';
import { MobileControls } from '@/components/MobileControls.tsx';
import { GameState, Player, Zombie, Bullet, PowerUp, Particle, Screen, GameProgress, UPGRADE_CONFIG } from './types';
import { loadProgress, saveProgress, updateHighScore, unlockWave, addKills, addCredits, purchaseUpgrade } from './storage';
import { WAVES, getZombieStats } from './waves';
import { ZombieRenderer } from './renderer';
import { useGameAudio } from '@/hooks/useGameAudio';
import { Achievement, checkAchievements, updateStats } from '@/lib/achievements.ts';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 700;

const ZombieSurvival = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playSound } = useGameAudio();
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameState, setGameState] = useState<GameState>({
    screen: 'menu',
    score: 0,
    wave: 1,
    waveProgress: 0,
    zombiesKilled: 0,
    powerUpsCollected: 0,
    combo: 0,
    zombiesRemaining: 0,
  });

  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - 20,
    y: CANVAS_HEIGHT / 2 - 20,
    width: 40,
    height: 40,
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 30,
    weapon: 'pistol',
    fireRate: 250,
    lastFired: 0,
    speed: 4,
    armor: 0,
    angle: 0,
  });

  const zombiesRef = useRef<Zombie[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rendererRef = useRef<ZombieRenderer | null>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: CANVAS_WIDTH / 2, y: 0 });
  const progress = useRef<GameProgress>(loadProgress());
  const zombiesSpawned = useRef<number>(0);
  const isFiring = useRef<boolean>(false);
  const mobileMovement = useRef({ dx: 0, dy: 0 });
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      rendererRef.current = new ZombieRenderer(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, []);

  const spawnZombie = useCallback(() => {
    const config = WAVES[gameState.wave - 1];
    if (!config || zombiesSpawned.current >= config.zombieCount) return;

    const type = config.zombieTypes[Math.floor(Math.random() * config.zombieTypes.length)];
    const stats = getZombieStats(type, gameState.wave);
    
    // Spawn from edges
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    switch (edge) {
      case 0: x = Math.random() * CANVAS_WIDTH; y = -50; break;
      case 1: x = CANVAS_WIDTH + 50; y = Math.random() * CANVAS_HEIGHT; break;
      case 2: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + 50; break;
      case 3: x = -50; y = Math.random() * CANVAS_HEIGHT; break;
    }

    zombiesRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      width: stats.width,
      height: stats.height,
      type,
      health: stats.health,
      maxHealth: stats.health,
      speed: stats.speed,
      damage: stats.damage,
      points: stats.points,
      angle: 0,
      attackCooldown: 1000,
      lastAttack: 0,
    });
    
    zombiesSpawned.current++;
    setGameState(prev => ({ ...prev, zombiesRemaining: config.zombieCount - zombiesSpawned.current + zombiesRef.current.length }));
  }, [gameState.wave]);

  const fire = useCallback(() => {
    const player = playerRef.current;
    if (Date.now() - player.lastFired < player.fireRate || player.ammo <= 0) return;
    
    const angle = player.angle;
    const speed = 15;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    
    let damage = 10;
    let bulletColor = '#ffcc00';
    let bulletsToFire = 1;
    let spread = 0;
    let ammoUsed = 1;

    switch (player.weapon) {
      case 'pistol':
        damage = 15;
        bulletColor = '#ffcc00';
        break;
      case 'shotgun':
        damage = 25;
        bulletColor = '#ff6600';
        bulletsToFire = 5;
        spread = 0.3;
        ammoUsed = 2;
        break;
      case 'smg':
        damage = 8;
        bulletColor = '#00ff88';
        player.fireRate = 100;
        break;
      case 'rifle':
        damage = 40;
        bulletColor = '#00ccff';
        player.fireRate = 400;
        break;
      case 'minigun':
        damage = 12;
        bulletColor = '#ff00ff';
        player.fireRate = 50;
        break;
    }

    if (player.ammo < ammoUsed) return;
    player.ammo -= ammoUsed;

    for (let i = 0; i < bulletsToFire; i++) {
      const bulletAngle = angle + (Math.random() - 0.5) * spread;
      bulletsRef.current.push({
        id: `b-${Date.now()}-${i}`,
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        width: 8,
        height: 4,
        dx: Math.cos(bulletAngle) * speed,
        dy: Math.sin(bulletAngle) * speed,
        damage,
        owner: 'player',
        color: bulletColor,
        pierce: player.weapon === 'rifle' ? 2 : 1,
      });
    }

    player.lastFired = Date.now();
    playSound('shoot');
  }, [playSound]);

  const gameLoop = useCallback((time: number) => {
    if (screen !== 'playing') return;
    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = time;
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.update(deltaTime);
    renderer.clear();

    const config = WAVES[gameState.wave - 1];
    
    // Spawn zombies
    if (time - lastSpawnTime.current > config.spawnRate && zombiesSpawned.current < config.zombieCount) {
      spawnZombie();
      lastSpawnTime.current = time;
    }

    // Player movement (keyboard + mobile)
    const player = playerRef.current;
    const moveSpeed = player.speed;
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
      player.x += (dx / len) * moveSpeed;
      player.y += (dy / len) * moveSpeed;
      player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
      player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.y));
    }

    // Player aim
    player.angle = Math.atan2(
      mouseRef.current.y - (player.y + player.height / 2),
      mouseRef.current.x - (player.x + player.width / 2)
    );

    // Auto-fire when holding mouse
    if (isFiring.current) fire();

    renderer.drawPlayer(player);

    // Update bullets
    bulletsRef.current = bulletsRef.current.filter(b => 
      b.x > -20 && b.x < CANVAS_WIDTH + 20 && b.y > -20 && b.y < CANVAS_HEIGHT + 20 && b.pierce > 0
    );
    bulletsRef.current.forEach(b => {
      b.x += b.dx;
      b.y += b.dy;
      renderer.drawBullet(b);
    });

    // Update zombies
    zombiesRef.current = zombiesRef.current.filter(z => z.health > 0);
    zombiesRef.current.forEach(z => {
      // Move towards player
      const dx = (player.x + player.width / 2) - (z.x + z.width / 2);
      const dy = (player.y + player.height / 2) - (z.y + z.height / 2);
      const dist = Math.hypot(dx, dy);
      z.angle = Math.atan2(dy, dx);
      
      if (dist > z.width / 2) {
        z.x += (dx / dist) * z.speed;
        z.y += (dy / dist) * z.speed;
      }

      // Attack player
      if (dist < z.width / 2 + player.width / 2 && time - z.lastAttack > z.attackCooldown) {
        if (player.armor > 0) {
          player.armor = Math.max(0, player.armor - z.damage);
        } else {
          player.health -= z.damage;
        }
        z.lastAttack = time;
        playSound('hit');
        
        if (player.health <= 0) {
          setScreen('gameOver');
          updateHighScore(gameState.score);
          addKills(gameState.zombiesKilled);
          // Track achievement stats
          const newAchievements = updateStats({
            totalKills: gameState.zombiesKilled,
            totalScore: gameState.score,
            highestWave: gameState.wave,
            gamesPlayed: 1,
            powerUpsCollected: gameState.powerUpsCollected,
          });
          if (newAchievements.length > 0) {
            setUnlockedAchievement(newAchievements[0]);
          }
          playSound('gameover');
        }
      }

      // Spitter attacks
      if (z.type === 'spitter' && dist < 300 && time - z.lastAttack > 2000) {
        bulletsRef.current.push({
          id: `zb-${Date.now()}`,
          x: z.x + z.width / 2,
          y: z.y + z.height / 2,
          width: 10,
          height: 10,
          dx: (dx / dist) * 5,
          dy: (dy / dist) * 5,
          damage: z.damage,
          owner: 'zombie',
          color: '#7aff7a',
          pierce: 1,
        });
        z.lastAttack = time;
      }

      renderer.drawZombie(z);

      // Check bullet collisions
      bulletsRef.current.forEach(b => {
        if (b.owner === 'player' && b.pierce > 0) {
          const bDist = Math.hypot(b.x - (z.x + z.width / 2), b.y - (z.y + z.height / 2));
          if (bDist < z.width / 2) {
            z.health -= b.damage;
            b.pierce--;
            
            // Blood particles
            for (let i = 0; i < 5; i++) {
              particlesRef.current.push({
                x: b.x, y: b.y, width: 4, height: 4,
                dx: (Math.random() - 0.5) * 6, dy: (Math.random() - 0.5) * 6,
                life: 0.5, maxLife: 0.5, color: '#8b0000', type: 'blood'
              });
            }

            if (z.health <= 0) {
              // Exploder special effect
              if (z.type === 'exploder') {
                const explosionRadius = 80;
                zombiesRef.current.forEach(oz => {
                  const eDist = Math.hypot(z.x - oz.x, z.y - oz.y);
                  if (eDist < explosionRadius && oz.id !== z.id) {
                    oz.health -= 50;
                  }
                });
                for (let i = 0; i < 20; i++) {
                  particlesRef.current.push({
                    x: z.x + z.width / 2, y: z.y + z.height / 2, width: 8, height: 8,
                    dx: (Math.random() - 0.5) * 15, dy: (Math.random() - 0.5) * 15,
                    life: 1, maxLife: 1, color: '#ff6600', type: 'spark'
                  });
                }
              }

              setGameState(prev => ({
                ...prev,
                score: prev.score + z.points,
                zombiesKilled: prev.zombiesKilled + 1,
                zombiesRemaining: prev.zombiesRemaining - 1,
              }));
              playSound('explosion');

              // Power-up drop
              if (Math.random() < 0.15) {
                const types: PowerUp['type'][] = ['health', 'ammo', 'armor', 'weapon-shotgun', 'weapon-smg', 'weapon-rifle', 'speed'];
                powerUpsRef.current.push({
                  id: Math.random().toString(),
                  x: z.x, y: z.y, width: 30, height: 30,
                  type: types[Math.floor(Math.random() * types.length)],
                  duration: 5000
                });
              }
            }
          }
        }
        
        // Zombie projectile hits player
        if (b.owner === 'zombie') {
          const pDist = Math.hypot(b.x - (player.x + player.width / 2), b.y - (player.y + player.height / 2));
          if (pDist < player.width / 2) {
            if (player.armor > 0) player.armor -= b.damage;
            else player.health -= b.damage;
            b.pierce = 0;
            playSound('hit');
            if (player.health <= 0) {
              setScreen('gameOver');
              updateHighScore(gameState.score);
              playSound('gameover');
            }
          }
        }
      });
    });

    // Check wave complete
    if (zombiesSpawned.current >= config.zombieCount && zombiesRef.current.length === 0) {
      if (gameState.wave < WAVES.length) {
        setScreen('levelComplete');
        unlockWave(gameState.wave + 1);
        updateHighScore(gameState.score);
        playSound('levelup');
      } else {
        setScreen('menu');
        updateHighScore(gameState.score);
      }
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.dx *= 0.95;
      p.dy *= 0.95;
      p.life -= deltaTime;
      renderer.drawParticle(p);
    });

    // Update power-ups
    powerUpsRef.current = powerUpsRef.current.filter(p => p.duration > 0);
    powerUpsRef.current.forEach(p => {
      p.duration -= deltaTime * 1000;
      renderer.drawPowerUp(p);

      const pDist = Math.hypot(p.x + 15 - (player.x + player.width / 2), p.y + 15 - (player.y + player.height / 2));
      if (pDist < 40) {
        switch (p.type) {
          case 'health': player.health = Math.min(player.maxHealth, player.health + 30); break;
          case 'ammo': player.ammo = player.maxAmmo; break;
          case 'armor': player.armor = Math.min(100, player.armor + 50); break;
          case 'weapon-shotgun': player.weapon = 'shotgun'; player.fireRate = 600; player.ammo = 20; player.maxAmmo = 20; break;
          case 'weapon-smg': player.weapon = 'smg'; player.fireRate = 100; player.ammo = 100; player.maxAmmo = 100; break;
          case 'weapon-rifle': player.weapon = 'rifle'; player.fireRate = 400; player.ammo = 15; player.maxAmmo = 15; break;
          case 'weapon-minigun': player.weapon = 'minigun'; player.fireRate = 50; player.ammo = 200; player.maxAmmo = 200; break;
          case 'speed': player.speed = 6; setTimeout(() => player.speed = 4, 5000); break;
        }
        p.duration = 0;
        playSound('powerup');
        setGameState(prev => ({ ...prev, powerUpsCollected: prev.powerUpsCollected + 1 }));
      }
    });

    renderer.drawHUD(gameState.score, player.health, player.maxHealth, player.ammo, player.maxAmmo, player.weapon, gameState.wave, gameState.zombiesRemaining);
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [screen, gameState, spawnZombie, fire, playSound]);

  useEffect(() => {
    if (screen === 'playing') {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current!);
  }, [screen, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'r' && screen === 'playing') {
        playerRef.current.ammo = playerRef.current.maxAmmo;
        playSound('click');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, playSound]);

  const getUpgrades = (): Upgrade[] => {
    const prog = loadProgress();
    return Object.entries(UPGRADE_CONFIG).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.description,
      icon: key === 'damage' ? 'damage' : key === 'health' ? 'health' : key === 'speed' ? 'speed' : 'ammo',
      level: prog.upgrades[key as keyof typeof prog.upgrades],
      maxLevel: config.maxLevel,
      basePrice: config.basePrice,
      priceMultiplier: config.multiplier,
    }));
  };

  const handlePurchaseUpgrade = (upgradeId: string) => {
    if (purchaseUpgrade(upgradeId as keyof GameProgress['upgrades'])) {
      progress.current = loadProgress();
      // Track upgrade achievement
      const newAchievements = updateStats({ upgradesPurchased: 1 });
      if (newAchievements.length > 0) {
        setUnlockedAchievement(newAchievements[0]);
      }
    }
  };

  const handleClaimReward = (amount: number) => {
    addCredits(amount);
    progress.current = loadProgress();
  };

  const handleMobileMove = useCallback((dx: number, dy: number) => {
    mobileMovement.current = { dx, dy };
  }, []);

  const handleMobileFire = useCallback((firing: boolean) => {
    isFiring.current = firing;
  }, []);

  const startWave = (wave: number) => {
    const prog = loadProgress();
    const baseHealth = 100 + (prog.upgrades.health - 1) * 20;
    const baseAmmo = 30 + (prog.upgrades.ammoCapacity - 1) * 10;
    const baseSpeed = 4 + (prog.upgrades.speed - 1) * 0.5;
    
    setGameState({ screen: 'playing', score: 0, wave, waveProgress: 0, zombiesKilled: 0, powerUpsCollected: 0, combo: 0, zombiesRemaining: WAVES[wave - 1].zombieCount });
    playerRef.current = { ...playerRef.current, x: CANVAS_WIDTH / 2 - 20, y: CANVAS_HEIGHT / 2 - 20, health: baseHealth, maxHealth: baseHealth, ammo: baseAmmo, maxAmmo: baseAmmo, speed: baseSpeed, weapon: 'pistol', fireRate: 250, armor: 0 };
    zombiesRef.current = []; bulletsRef.current = []; particlesRef.current = []; powerUpsRef.current = [];
    zombiesSpawned.current = 0;
    setScreen('playing');
    playSound('click');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }
  };

  return (
    <GameLayout gameId="zombie-survival" title="Zombie Apocalypse" score={gameState.score} highScore={progress.current.highScore}>
      <Helmet><title>Zombie Apocalypse - Survival Shooter</title></Helmet>
      <div className="flex flex-col items-center justify-center p-4">
        <div 
          className="relative border-4 border-zombie-blood/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(139,0,0,0.4)] bg-black"
          onMouseMove={handleMouseMove}
          onMouseDown={() => { if (screen === 'playing') isFiring.current = true; }}
          onMouseUp={() => isFiring.current = false}
          onMouseLeave={() => isFiring.current = false}
        >
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full h-auto cursor-crosshair" />
          
          {screen === 'menu' && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center animate-fade-in">
              <div className="mb-8 relative">
                <Skull className="w-24 h-24 text-zombie-blood animate-pulse" />
                <div className="absolute -inset-4 bg-red-900/20 blur-2xl rounded-full -z-10" />
              </div>
              <h1 className="text-5xl font-black text-white mb-2 tracking-tighter font-game-title">ZOMBIE</h1>
              <h2 className="text-3xl font-bold text-zombie-blood mb-4 font-game-title">APOCALYPSE</h2>
              <div className="flex items-center gap-2 mb-6 text-game-gold">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold">{progress.current.credits.toLocaleString()} Credits</span>
              </div>
              <div className="flex flex-col gap-4 w-64">
                <button onClick={() => startWave(1)} className="px-8 py-4 bg-zombie-blood hover:bg-red-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(139,0,0,0.5)]">
                  <Play className="inline mr-2 w-5 h-5" /> SURVIVE
                </button>
                <button onClick={() => setScreen('levelSelect')} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">SELECT WAVE</button>
                <UpgradeShop 
                  credits={progress.current.credits} 
                  upgrades={getUpgrades()} 
                  onPurchase={handlePurchaseUpgrade}
                  theme="zombie"
                />
                <Achievements onClaimReward={handleClaimReward} theme="zombie" />
              </div>
              <div className="mt-8 text-slate-500 text-sm">
                <p>WASD to move • Mouse to aim • Click to shoot • R to reload</p>
              </div>
            </div>
          )}

          {screen === 'levelSelect' && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center p-8 overflow-y-auto">
              <h2 className="text-4xl font-bold text-white mb-6 font-game-title">SELECT WAVE</h2>
              <div className="grid grid-cols-1 gap-3 w-full max-h-[500px] overflow-y-auto pr-2">
                {WAVES.map(wave => (
                  <button
                    key={wave.id}
                    disabled={wave.id > progress.current.unlockedWaves}
                    onClick={() => startWave(wave.id)}
                    className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                      wave.id <= progress.current.unlockedWaves 
                        ? 'border-zombie-blood/50 bg-red-900/20 hover:bg-red-900/40' 
                        : 'border-slate-800 bg-slate-900/50 opacity-50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-xs text-zombie-blood font-bold">Wave {wave.id}</div>
                      <div className="text-lg font-bold text-white">{wave.name}</div>
                      <div className="text-xs text-slate-400">{wave.zombieCount} zombies</div>
                    </div>
                    {wave.id > progress.current.unlockedWaves ? <Lock className="text-slate-600" /> : <ChevronRight className="text-zombie-blood" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setScreen('menu')} className="mt-6 text-slate-400 hover:text-white font-bold">BACK</button>
            </div>
          )}

          {screen === 'levelComplete' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-green-500">
                <Trophy className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-4xl font-black text-white mb-2 font-game-title">WAVE CLEARED</h2>
              <p className="text-slate-400 mb-2">Zombies killed: {gameState.zombiesKilled}</p>
              <p className="text-2xl font-bold text-game-gold mb-2">Score: {gameState.score}</p>
              <p className="text-lg font-bold text-green-400 mb-6">+{Math.floor(gameState.score * 0.1)} Credits earned!</p>
              <button onClick={() => {
                addCredits(Math.floor(gameState.score * 0.1));
                progress.current = loadProgress();
                startWave(gameState.wave + 1);
              }} className="px-12 py-4 bg-zombie-blood hover:bg-red-700 text-white rounded-xl font-bold transition-all">NEXT WAVE</button>
            </div>
          )}

          {screen === 'gameOver' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8">
              <Skull className="w-20 h-20 text-zombie-blood mb-4" />
              <h2 className="text-5xl font-black text-zombie-blood mb-2 font-game-title">YOU DIED</h2>
              <p className="text-slate-400 mb-2">Wave {gameState.wave} • {gameState.zombiesKilled} kills</p>
              <p className="text-3xl font-bold text-white mb-8">Score: {gameState.score}</p>
              <div className="flex gap-4">
                <button onClick={() => startWave(gameState.wave)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" /> RETRY
                </button>
                <button onClick={() => setScreen('menu')} className="px-8 py-4 bg-zombie-blood hover:bg-red-700 text-white rounded-xl font-bold transition-all">MENU</button>
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile controls */}
        {screen === 'playing' && (
          <MobileControls onMove={handleMobileMove} onFire={handleMobileFire} />
        )}
        
        {/* Achievement toast */}
        <AchievementToast achievement={unlockedAchievement} onClose={() => setUnlockedAchievement(null)} />
      </div>
    </GameLayout>
  );
};

export default ZombieSurvival;
