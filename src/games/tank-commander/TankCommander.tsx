import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, Trophy, Play, RotateCcw, ChevronRight, Lock, Target, Star } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import { UpgradeShop, Upgrade } from '@/components/UpgradeShop';
import { Achievements } from '@/components/Achievements';
import { AchievementToast } from '@/components/AchievementToast';
import { MobileControls } from '@/components/MobileControls';
import { GameState, Tank, EnemyTank, Projectile, Obstacle, PowerUp, Particle, Screen, GameProgress, UPGRADE_CONFIG } from './types';
import { loadProgress, saveProgress, updateHighScore, unlockMission, addDestroyed, addCredits, purchaseUpgrade } from './storage';
import { MISSIONS, getEnemyStats } from './missions';
import { TankRenderer } from './renderer';
import { useGameAudio } from '@/hooks/useGameAudio';
import { Achievement, updateStats } from '@/lib/achievements';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 700;

const TankCommander = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playSound } = useGameAudio();
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameState, setGameState] = useState<GameState>({
    screen: 'menu',
    score: 0,
    mission: 1,
    missionProgress: 0,
    tanksDestroyed: 0,
    powerUpsCollected: 0,
    enemiesRemaining: 0,
  });

  const playerRef = useRef<Tank>({
    x: CANVAS_WIDTH / 2 - 25,
    y: CANVAS_HEIGHT - 100,
    width: 50,
    height: 50,
    health: 100,
    maxHealth: 100,
    ammo: 50,
    maxAmmo: 50,
    shells: 10,
    maxShells: 10,
    weapon: 'cannon',
    fireRate: 500,
    lastFired: 0,
    speed: 3,
    armor: 0,
    angle: -Math.PI / 2,
    turretAngle: -Math.PI / 2,
    isPlayer: true,
  });

  const enemiesRef = useRef<EnemyTank[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rendererRef = useRef<TankRenderer | null>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: CANVAS_WIDTH / 2, y: 0 });
  const progress = useRef<GameProgress>(loadProgress());
  const enemiesSpawned = useRef<number>(0);
  const isFiring = useRef<boolean>(false);
  const mobileMovement = useRef({ dx: 0, dy: 0 });
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      rendererRef.current = new TankRenderer(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, []);

  const spawnEnemy = useCallback(() => {
    const config = MISSIONS[gameState.mission - 1];
    if (!config || enemiesSpawned.current >= config.enemyCount) return;

    const type = config.enemyTypes[Math.floor(Math.random() * config.enemyTypes.length)];
    const stats = getEnemyStats(type, gameState.mission);
    
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    switch (edge) {
      case 0: x = Math.random() * (CANVAS_WIDTH - 60) + 30; y = -60; break;
      case 1: x = CANVAS_WIDTH + 60; y = Math.random() * (CANVAS_HEIGHT - 60) + 30; break;
      case 2: x = Math.random() * (CANVAS_WIDTH - 60) + 30; y = CANVAS_HEIGHT + 60; break;
      case 3: x = -60; y = Math.random() * (CANVAS_HEIGHT - 60) + 30; break;
    }

    enemiesRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      width: stats.width,
      height: stats.height,
      type,
      health: stats.health,
      maxHealth: stats.health,
      ammo: 100,
      maxAmmo: 100,
      shells: 20,
      maxShells: 20,
      weapon: 'cannon',
      fireRate: stats.fireRate,
      lastFired: 0,
      speed: stats.speed,
      armor: 0,
      angle: 0,
      turretAngle: 0,
      isPlayer: false,
      points: stats.points,
      ai: stats.ai,
      damage: stats.damage,
    });
    
    enemiesSpawned.current++;
    setGameState(prev => ({ ...prev, enemiesRemaining: config.enemyCount - enemiesSpawned.current + enemiesRef.current.length }));
  }, [gameState.mission]);

  const fire = useCallback(() => {
    const player = playerRef.current;
    if (Date.now() - player.lastFired < player.fireRate) return;
    
    const angle = player.turretAngle;
    const speed = 10;
    
    let damage = 25;
    let color = '#ffcc00';
    let type: Projectile['type'] = 'shell';

    switch (player.weapon) {
      case 'cannon':
        if (player.shells <= 0) return;
        player.shells--;
        damage = 40;
        color = '#ffcc00';
        type = 'shell';
        break;
      case 'machinegun':
        if (player.ammo <= 0) return;
        player.ammo--;
        damage = 8;
        color = '#ff8800';
        type = 'bullet';
        player.fireRate = 100;
        break;
      case 'missile':
        if (player.shells <= 0) return;
        player.shells--;
        damage = 80;
        color = '#ff0000';
        type = 'missile';
        player.fireRate = 1000;
        break;
      case 'flamethrower':
        if (player.ammo <= 0) return;
        player.ammo -= 2;
        damage = 15;
        color = '#ff6600';
        type = 'flame';
        player.fireRate = 50;
        break;
    }

    const startX = player.x + player.width / 2 + Math.cos(angle) * player.width * 0.6;
    const startY = player.y + player.height / 2 + Math.sin(angle) * player.height * 0.6;

    projectilesRef.current.push({
      id: `p-${Date.now()}`,
      x: startX,
      y: startY,
      width: type === 'shell' ? 12 : type === 'missile' ? 15 : type === 'flame' ? 20 : 6,
      height: type === 'shell' ? 6 : type === 'missile' ? 8 : type === 'flame' ? 20 : 3,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      damage,
      owner: 'player',
      type,
      color,
      life: 1,
    });

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

    const config = MISSIONS[gameState.mission - 1];
    
    // Spawn enemies
    if (time - lastSpawnTime.current > config.spawnRate && enemiesSpawned.current < config.enemyCount) {
      spawnEnemy();
      lastSpawnTime.current = time;
    }

    // Player movement (keyboard + mobile)
    const player = playerRef.current;
    let moving = false;
    
    // Mobile joystick for forward/back movement
    if (mobileMovement.current.dy < -0.3) {
      player.x += Math.cos(player.angle) * player.speed;
      player.y += Math.sin(player.angle) * player.speed;
      moving = true;
    }
    if (mobileMovement.current.dy > 0.3) {
      player.x -= Math.cos(player.angle) * player.speed;
      player.y -= Math.sin(player.angle) * player.speed;
      moving = true;
    }
    if (mobileMovement.current.dx < -0.3) {
      player.angle -= 0.04;
    }
    if (mobileMovement.current.dx > 0.3) {
      player.angle += 0.04;
    }
    
    if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
      player.x += Math.cos(player.angle) * player.speed;
      player.y += Math.sin(player.angle) * player.speed;
      moving = true;
    }
    if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
      player.x -= Math.cos(player.angle) * player.speed;
      player.y -= Math.sin(player.angle) * player.speed;
      moving = true;
    }
    if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
      player.angle -= 0.04;
    }
    if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
      player.angle += 0.04;
    }

    // Clamp player position
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.y));

    // Turret aim at mouse
    player.turretAngle = Math.atan2(
      mouseRef.current.y - (player.y + player.height / 2),
      mouseRef.current.x - (player.x + player.width / 2)
    );

    if (isFiring.current) fire();

    // Draw obstacles
    obstaclesRef.current.forEach(obs => renderer.drawObstacle(obs));

    renderer.drawTank(player, true);

    // Update projectiles
    projectilesRef.current = projectilesRef.current.filter(p => 
      p.x > -20 && p.x < CANVAS_WIDTH + 20 && p.y > -20 && p.y < CANVAS_HEIGHT + 20 && p.life > 0
    );
    projectilesRef.current.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.type === 'flame') p.life -= deltaTime * 2;
      renderer.drawProjectile(p);
    });

    // Update enemies
    enemiesRef.current = enemiesRef.current.filter(e => e.health > 0);
    enemiesRef.current.forEach(e => {
      // AI movement
      const dx = (player.x + player.width / 2) - (e.x + e.width / 2);
      const dy = (player.y + player.height / 2) - (e.y + e.height / 2);
      const dist = Math.hypot(dx, dy);
      
      e.turretAngle = Math.atan2(dy, dx);
      
      if (e.ai === 'chase' || e.ai === 'aggressive') {
        if (dist > 150) {
          e.angle = Math.atan2(dy, dx);
          e.x += Math.cos(e.angle) * e.speed;
          e.y += Math.sin(e.angle) * e.speed;
        }
      }

      // Enemy shooting
      const fireRange = e.ai === 'snipe' ? 400 : 300;
      if (dist < fireRange && time - e.lastFired > e.fireRate) {
        projectilesRef.current.push({
          id: `ep-${Date.now()}-${e.id}`,
          x: e.x + e.width / 2,
          y: e.y + e.height / 2,
          width: 10,
          height: 5,
          dx: (dx / dist) * 8,
          dy: (dy / dist) * 8,
          damage: e.damage,
          owner: 'enemy',
          type: 'shell',
          color: '#ff4444',
          life: 1,
        });
        e.lastFired = time;
      }

      renderer.drawEnemyTank(e);

      // Bullet hits
      projectilesRef.current.forEach(p => {
        if (p.owner === 'player' && p.life > 0) {
          const pDist = Math.hypot(p.x - (e.x + e.width / 2), p.y - (e.y + e.height / 2));
          if (pDist < e.width / 2) {
            e.health -= p.damage;
            p.life = 0;
            
            // Explosion particles
            for (let i = 0; i < 8; i++) {
              particlesRef.current.push({
                x: p.x, y: p.y, width: 6, height: 6,
                dx: (Math.random() - 0.5) * 10, dy: (Math.random() - 0.5) * 10,
                life: 0.6, maxLife: 0.6, color: '#ff6600', type: 'explosion',
                rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 5
              });
            }

            if (e.health <= 0) {
              setGameState(prev => ({
                ...prev,
                score: prev.score + e.points,
                tanksDestroyed: prev.tanksDestroyed + 1,
                enemiesRemaining: prev.enemiesRemaining - 1,
              }));
              playSound('explosion');

              // Big explosion
              for (let i = 0; i < 15; i++) {
                particlesRef.current.push({
                  x: e.x + e.width / 2, y: e.y + e.height / 2,
                  width: 10 + Math.random() * 10, height: 10,
                  dx: (Math.random() - 0.5) * 15, dy: (Math.random() - 0.5) * 15,
                  life: 1, maxLife: 1, color: i % 2 === 0 ? '#ff6600' : '#ffcc00', type: 'explosion',
                  rotation: 0, rotationSpeed: 0
                });
              }

              // Power-up drop
              if (Math.random() < 0.2) {
                const types: PowerUp['type'][] = ['health', 'ammo', 'armor', 'weapon-missile', 'shield'];
                powerUpsRef.current.push({
                  id: Math.random().toString(),
                  x: e.x, y: e.y, width: 28, height: 28,
                  type: types[Math.floor(Math.random() * types.length)],
                  duration: 8000
                });
              }
            }
          }
        }
        
        // Enemy projectile hits player
        if (p.owner === 'enemy' && p.life > 0) {
          const pDist = Math.hypot(p.x - (player.x + player.width / 2), p.y - (player.y + player.height / 2));
          if (pDist < player.width / 2) {
            if (player.armor > 0) {
              player.armor = Math.max(0, player.armor - p.damage);
            } else {
              player.health -= p.damage;
            }
            p.life = 0;
            playSound('hit');
            
            if (player.health <= 0) {
              setScreen('gameOver');
              updateHighScore(gameState.score);
              addDestroyed(gameState.tanksDestroyed);
              const newAchievements = updateStats({
                totalKills: gameState.tanksDestroyed,
                totalScore: gameState.score,
                highestMission: gameState.mission,
                gamesPlayed: 1,
                powerUpsCollected: gameState.powerUpsCollected,
              });
              if (newAchievements.length > 0) {
                setUnlockedAchievement(newAchievements[0]);
              }
              playSound('gameover');
            }
          }
        }
      });
    });

    // Check mission complete
    if (enemiesSpawned.current >= config.enemyCount && enemiesRef.current.length === 0) {
      if (gameState.mission < MISSIONS.length) {
        setScreen('levelComplete');
        unlockMission(gameState.mission + 1);
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
      p.rotation += p.rotationSpeed * deltaTime;
      p.life -= deltaTime;
      renderer.drawParticle(p);
    });

    // Update power-ups
    powerUpsRef.current = powerUpsRef.current.filter(p => p.duration > 0);
    powerUpsRef.current.forEach(p => {
      p.duration -= deltaTime * 1000;
      renderer.drawPowerUp(p);

      const pDist = Math.hypot(p.x + 14 - (player.x + player.width / 2), p.y + 14 - (player.y + player.height / 2));
      if (pDist < 45) {
        switch (p.type) {
          case 'health': player.health = Math.min(player.maxHealth, player.health + 40); break;
          case 'ammo': player.ammo = player.maxAmmo; player.shells = player.maxShells; break;
          case 'armor': player.armor = Math.min(100, player.armor + 50); break;
          case 'weapon-missile': player.weapon = 'missile'; player.fireRate = 1000; break;
          case 'weapon-flamethrower': player.weapon = 'flamethrower'; player.fireRate = 50; break;
          case 'shield': player.armor = 100; break;
        }
        p.duration = 0;
        playSound('powerup');
        setGameState(prev => ({ ...prev, powerUpsCollected: prev.powerUpsCollected + 1 }));
      }
    });

    renderer.drawHUD(gameState.score, player.health, player.maxHealth, player.ammo, player.shells, player.weapon, gameState.mission, gameState.enemiesRemaining);
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [screen, gameState, spawnEnemy, fire, playSound]);

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
        playerRef.current.shells = playerRef.current.maxShells;
        playSound('click');
      }
      if (e.key === '1') playerRef.current.weapon = 'cannon';
      if (e.key === '2') playerRef.current.weapon = 'machinegun';
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
      icon: key === 'damage' ? 'damage' : key === 'armor' ? 'armor' : key === 'speed' ? 'speed' : 'ammo',
      level: prog.upgrades[key as keyof typeof prog.upgrades],
      maxLevel: config.maxLevel,
      basePrice: config.basePrice,
      priceMultiplier: config.multiplier,
    }));
  };

  const handlePurchaseUpgrade = (upgradeId: string) => {
    if (purchaseUpgrade(upgradeId as keyof GameProgress['upgrades'])) {
      progress.current = loadProgress();
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

  const startMission = (mission: number) => {
    const prog = loadProgress();
    const baseHealth = 100 + (prog.upgrades.armor - 1) * 25;
    const baseAmmo = 50 + (prog.upgrades.ammo - 1) * 15;
    const baseShells = 10 + (prog.upgrades.ammo - 1) * 3;
    const baseSpeed = 3 + (prog.upgrades.speed - 1) * 0.4;
    
    setGameState({ screen: 'playing', score: 0, mission, missionProgress: 0, tanksDestroyed: 0, powerUpsCollected: 0, enemiesRemaining: MISSIONS[mission - 1].enemyCount });
    playerRef.current = { ...playerRef.current, x: CANVAS_WIDTH / 2 - 25, y: CANVAS_HEIGHT - 100, health: baseHealth, maxHealth: baseHealth, ammo: baseAmmo, maxAmmo: baseAmmo, shells: baseShells, maxShells: baseShells, speed: baseSpeed, weapon: 'cannon', fireRate: 500, armor: 0, angle: -Math.PI / 2, turretAngle: -Math.PI / 2 };
    enemiesRef.current = []; projectilesRef.current = []; particlesRef.current = []; powerUpsRef.current = []; obstaclesRef.current = [];
    enemiesSpawned.current = 0;
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
    <GameLayout gameId="tank-commander" title="Tank Commander" score={gameState.score} highScore={progress.current.highScore}>
      <Helmet><title>Tank Commander - Armored Warfare</title></Helmet>
      <div className="flex flex-col items-center justify-center p-4">
        <div 
          className="relative border-4 border-tank-military/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(100,120,80,0.4)] bg-black"
          onMouseMove={handleMouseMove}
          onMouseDown={() => { if (screen === 'playing') isFiring.current = true; }}
          onMouseUp={() => isFiring.current = false}
          onMouseLeave={() => isFiring.current = false}
        >
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full h-auto cursor-crosshair" />
          
          {screen === 'menu' && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center animate-fade-in">
              <div className="mb-8 relative">
                <Target className="w-24 h-24 text-tank-military animate-pulse" />
                <div className="absolute -inset-4 bg-green-900/20 blur-2xl rounded-full -z-10" />
              </div>
              <h1 className="text-5xl font-black text-white mb-2 tracking-tighter font-game-title">TANK</h1>
              <h2 className="text-3xl font-bold text-tank-military mb-4 font-game-title">COMMANDER</h2>
              <div className="flex items-center gap-2 mb-6 text-game-gold">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold">{progress.current.credits.toLocaleString()} Credits</span>
              </div>
              <div className="flex flex-col gap-4 w-64">
                <button onClick={() => startMission(1)} className="px-8 py-4 bg-tank-military hover:bg-green-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(100,120,80,0.5)]">
                  <Play className="inline mr-2 w-5 h-5" /> DEPLOY
                </button>
                <button onClick={() => setScreen('levelSelect')} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">SELECT MISSION</button>
                <UpgradeShop 
                  credits={progress.current.credits} 
                  upgrades={getUpgrades()} 
                  onPurchase={handlePurchaseUpgrade}
                  theme="tank"
                />
                <Achievements onClaimReward={handleClaimReward} theme="tank" />
              </div>
              <div className="mt-8 text-slate-500 text-sm">
                <p>WASD to move • Mouse to aim • Click to fire • R to reload</p>
                <p className="mt-1">1/2 to switch weapons</p>
              </div>
            </div>
          )}

          {screen === 'levelSelect' && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center p-8 overflow-y-auto">
              <h2 className="text-4xl font-bold text-white mb-6 font-game-title">SELECT MISSION</h2>
              <div className="grid grid-cols-1 gap-3 w-full max-h-[500px] overflow-y-auto pr-2">
                {MISSIONS.map(mission => (
                  <button
                    key={mission.id}
                    disabled={mission.id > progress.current.unlockedMissions}
                    onClick={() => startMission(mission.id)}
                    className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                      mission.id <= progress.current.unlockedMissions 
                        ? 'border-tank-military/50 bg-green-900/20 hover:bg-green-900/40' 
                        : 'border-slate-800 bg-slate-900/50 opacity-50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-xs text-tank-military font-bold">Mission {mission.id}</div>
                      <div className="text-lg font-bold text-white">{mission.name}</div>
                      <div className="text-xs text-slate-400">{mission.enemyCount} hostiles</div>
                    </div>
                    {mission.id > progress.current.unlockedMissions ? <Lock className="text-slate-600" /> : <ChevronRight className="text-tank-military" />}
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
              <h2 className="text-4xl font-black text-white mb-2 font-game-title">MISSION COMPLETE</h2>
              <p className="text-slate-400 mb-2">Tanks destroyed: {gameState.tanksDestroyed}</p>
              <p className="text-2xl font-bold text-game-gold mb-2">Score: {gameState.score}</p>
              <p className="text-lg font-bold text-green-400 mb-6">+{Math.floor(gameState.score * 0.1)} Credits earned!</p>
              <button onClick={() => {
                addCredits(Math.floor(gameState.score * 0.1));
                progress.current = loadProgress();
                startMission(gameState.mission + 1);
              }} className="px-12 py-4 bg-tank-military hover:bg-green-700 text-white rounded-xl font-bold transition-all">NEXT MISSION</button>
            </div>
          )}

          {screen === 'gameOver' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8">
              <Shield className="w-20 h-20 text-red-500 mb-4" />
              <h2 className="text-5xl font-black text-red-500 mb-2 font-game-title">DESTROYED</h2>
              <p className="text-slate-400 mb-2">Mission {gameState.mission} • {gameState.tanksDestroyed} kills</p>
              <p className="text-3xl font-bold text-white mb-8">Score: {gameState.score}</p>
              <div className="flex gap-4">
                <button onClick={() => startMission(gameState.mission)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" /> RETRY
                </button>
                <button onClick={() => setScreen('menu')} className="px-8 py-4 bg-tank-military hover:bg-green-700 text-white rounded-xl font-bold transition-all">MENU</button>
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

export default TankCommander;
