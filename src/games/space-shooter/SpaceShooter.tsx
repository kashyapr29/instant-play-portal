import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Rocket, Trophy, Play, RotateCcw, Pause, Settings, ChevronRight, Shield, Zap, Heart, Star, Lock, Zap as PowerIcon } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import { GameState, Player, Enemy, Bullet, PowerUp, Particle, Screen, GameProgress } from './types';
import { loadProgress, saveProgress, updateHighScore, unlockLevel } from './storage';
import { LEVELS, LevelConfig } from './levels';
import { Renderer } from './renderer';
import { useGameAudio } from '@/hooks/useGameAudio';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

const SpaceShooterPro = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playSound } = useGameAudio();
  const [screen, setScreen] = useState<Screen>('menu');
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [powerfulMode, setPowerfulMode] = useState<boolean>(false);
  const powerfulModeTimer = useRef<NodeJS.Timeout | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    screen: 'menu',
    score: 0,
    level: 1,
    levelProgress: 0,
    enemiesDestroyed: 0,
    powerUpsCollected: 0,
    combo: 0,
  });

  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - 20,
    y: CANVAS_HEIGHT - 80,
    width: 40,
    height: 40,
    lives: 3,
    maxLives: 3,
    shield: 0,
    maxShield: 100,
    weapon: 'basic',
    fireRate: 300,
    lastFired: 0,
    speed: 5,
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rendererRef = useRef<Renderer | null>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const progress = useRef<GameProgress>(loadProgress());

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      rendererRef.current = new Renderer(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, []);

  const spawnEnemy = useCallback(() => {
    const config = LEVELS[gameState.level - 1];
    if (config.bossId && enemiesRef.current.some(e => e.type === 'boss')) return;

    if (config.bossId && gameState.levelProgress >= 0.8 && !enemiesRef.current.some(e => e.type === 'boss')) {
      enemiesRef.current.push({
        id: 'boss-' + Date.now(),
        x: CANVAS_WIDTH / 2 - 100,
        y: -150,
        width: 200,
        height: 100,
        type: 'boss',
        health: 200 + (gameState.level * 50),
        maxHealth: 200 + (gameState.level * 50),
        speed: 1,
        pattern: 'boss',
        points: 2000,
        damage: 2,
        lastFired: 0
      });
      return;
    }

    const isAsteroid = Math.random() < config.asteroidChance;
    const type = isAsteroid ? 'asteroid' : config.enemyTypes[Math.floor(Math.random() * config.enemyTypes.length)];
    const levelMul = 1 + (gameState.level - 1) * 0.12;
    let width = type === 'asteroid' ? 30 + Math.random() * 40 : 42 + Math.random() * 18;
    let health = Math.round(2 * levelMul);
    let speed = 1.5 + Math.random() * 0.8 + (gameState.level * 0.05);
    let points = Math.round(25 * levelMul);
    let damage = 1;
    let pattern: Enemy['pattern'] = 'straight';
    let color = undefined as string | undefined;

    switch (type) {
      case 'asteroid':
        width = 30 + Math.random() * 50;
        health = Math.round(3 * levelMul);
        speed = 0.8 + Math.random() * 0.6 + (gameState.level * 0.02);
        points = Math.round(8 * levelMul);
        color = '#6b7280';
        break;
      case 'scout':
        health = Math.max(1, Math.round(1 * levelMul));
        speed = 3 + Math.random() * 2 + (gameState.level * 0.08);
        points = Math.round(40 * levelMul);
        color = '#34d399';
        break;
      case 'interceptor':
        health = Math.round(2 * levelMul);
        speed = 2.5 + Math.random() * 1.5 + (gameState.level * 0.06);
        points = Math.round(80 * levelMul);
        damage = 1 + Math.floor(gameState.level / 4);
        pattern = Math.random() < 0.5 ? 'sine' : 'straight';
        color = '#7c3aed';
        break;
      case 'heavy':
        health = Math.round(6 * levelMul);
        speed = 1 + Math.random() * 0.5 + (gameState.level * 0.03);
        points = Math.round(150 * levelMul);
        damage = 2;
        color = '#ef4444';
        break;
      case 'bomber':
        health = Math.round(4 * levelMul);
        speed = 1.2 + Math.random() * 0.8 + (gameState.level * 0.03);
        points = Math.round(120 * levelMul);
        damage = 2;
        color = '#f59e0b';
        break;
      case 'basic':
      default:
        health = Math.round(2 * levelMul);
        speed = 1.6 + Math.random() * 0.6 + (gameState.level * 0.04);
        points = Math.round(50 * levelMul);
        color = '#60a5fa';
        break;
    }

    // small chance to spawn an elite variant with higher points
    if (Math.random() < Math.min(0.12, 0.02 + gameState.level * 0.01)) {
      health = Math.round(health * 1.8);
      points = Math.round(points * 3);
      color = '#ffd166'; // gold-ish elite
      width *= 1.15;
    }

    enemiesRef.current.push({
      id: Math.random().toString(),
      x: Math.random() * (CANVAS_WIDTH - width),
      y: -width,
      width,
      height: width,
      type,
      health,
      maxHealth: health,
      speed,
      pattern,
      points,
      damage,
      lastFired: 0,
      color
    });
  }, [gameState.level, gameState.levelProgress]);

  const gameLoop = useCallback((time: number) => {
    if (screen !== 'playing') return;
    const deltaTime = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.update(deltaTime);
    renderer.clear();

    if (time - lastSpawnTime.current > LEVELS[gameState.level - 1].spawnRate) {
      spawnEnemy();
      lastSpawnTime.current = time;
    }

    renderer.drawPlayer(playerRef.current);

    bulletsRef.current = bulletsRef.current.filter(b => b.y > -20 && b.y < CANVAS_HEIGHT + 20);
    bulletsRef.current.forEach(b => {
      b.y += b.dy;
      b.x += b.dx;
      renderer.drawBullet(b);
    });

    enemiesRef.current = enemiesRef.current.filter(e => e.y < CANVAS_HEIGHT + 200 && e.health > 0);
    enemiesRef.current.forEach(e => {
      if (e.type === 'boss') {
        e.x += Math.sin(time / 500) * 3;
        if (e.y < 100) e.y += 0.5;
        if (time - (e.lastFired || 0) > 1000) {
          bulletsRef.current.push({ id: 'eb-'+Date.now(), x: e.x + e.width/2, y: e.y + e.height, dx: 0, dy: 6, width: 8, height: 20, damage: 1, owner: 'enemy', color: '#ff0000' });
          e.lastFired = time;
          playSound('shoot');
        }
      } else {
        e.y += e.speed;
        if (e.type === 'interceptor' && time - (e.lastFired || 0) > 2000) {
          bulletsRef.current.push({ id: 'eb-'+Date.now(), x: e.x + e.width/2, y: e.y + e.height, dx: 0, dy: 5, width: 4, height: 10, damage: 1, owner: 'enemy', color: '#ff0000' });
          e.lastFired = time;
        }
      }
      renderer.drawEnemy(e);

      if (Math.hypot(e.x + e.width/2 - (playerRef.current.x + 20), e.y + e.height/2 - (playerRef.current.y + 20)) < 40) {
        if (playerRef.current.shield > 0) {
          playerRef.current.shield -= 20;
        } else {
          playerRef.current.lives--;
          if (playerRef.current.lives <= 0) setScreen('gameOver');
        }
        if (e.type !== 'boss') e.health = 0;
        playSound('explosion');
      }

      bulletsRef.current.forEach(b => {
        if (b.owner === 'player' && Math.hypot(b.x - (e.x + e.width/2), b.y - (e.y + e.height/2)) < e.width/2) {
          e.health -= b.damage;
          b.y = -100;
          if (e.health <= 0) {
            setGameState(prev => ({ 
              ...prev, 
              score: prev.score + e.points,
              enemiesDestroyed: prev.enemiesDestroyed + 1,
              levelProgress: Math.min(1, (prev.score + e.points) / LEVELS[prev.level-1].targetScore)
            }));
            playSound('explosion');
            for(let i=0; i<10; i++) {
              particlesRef.current.push({ x: e.x + e.width/2, y: e.y + e.height/2, width: 4, height: 4, dx: (Math.random()-0.5)*8, dy: (Math.random()-0.5)*8, life: 0.8, maxLife: 0.8, color: '#ff6600' });
            }
            // Higher spawn chance with weapon powerups
            const spawnChance = 0.3;
            if (Math.random() < spawnChance) {
              const types: PowerUp['type'][] = ['weapon-dual', 'weapon-triple', 'weapon-rocket', 'weapon-laser', 'weapon-spread', 'weapon-pierce', 'shield', 'health', 'health'];
              powerUpsRef.current.push({ id: Math.random().toString(), x: e.x, y: e.y, width: 30, height: 30, type: types[Math.floor(Math.random() * types.length)], duration: 5000 });
            }
          }
        }
        if (b.owner === 'enemy' && Math.hypot(b.x - (playerRef.current.x + 20), b.y - (playerRef.current.y + 20)) < 20) {
          if (playerRef.current.shield > 0) playerRef.current.shield -= 10;
          else playerRef.current.lives--;
          b.y = CANVAS_HEIGHT + 100;
          playSound('explosion');
          if (playerRef.current.lives <= 0) setScreen('gameOver');
        }
      });
    });

    if (gameState.levelProgress >= 1) {
      const isBossLevel = LEVELS[gameState.level-1].bossId;
      const bossDead = !enemiesRef.current.some(e => e.type === 'boss');
      if (!isBossLevel || (isBossLevel && bossDead)) {
        if (gameState.level < LEVELS.length) {
          setScreen('levelComplete');
          unlockLevel(gameState.level + 1);
          updateHighScore(gameState.score);
        } else {
          setScreen('menu');
          updateHighScore(gameState.score);
        }
      }
    }

    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => { p.x += p.dx; p.y += p.dy; p.life -= deltaTime; renderer.drawParticle(p); });

    powerUpsRef.current = powerUpsRef.current.filter(p => p.y < CANVAS_HEIGHT + 20);
    powerUpsRef.current.forEach(p => {
      p.y += 2;
      renderer.drawPowerUp(p);
      if (Math.hypot(p.x + 15 - (playerRef.current.x + 20), p.y + 15 - (playerRef.current.y + 20)) < 40) {
        if (p.type === 'shield') playerRef.current.shield = 100;
        else if (p.type === 'health') playerRef.current.lives = Math.min(playerRef.current.maxLives, playerRef.current.lives + 1);
        else if (p.type === 'weapon-dual') playerRef.current.weapon = 'dual';
        else if (p.type === 'weapon-triple') playerRef.current.weapon = 'triple';
        else if (p.type === 'weapon-rocket') playerRef.current.weapon = 'rocket';
        else if (p.type === 'weapon-laser') playerRef.current.weapon = 'laser';
        else if (p.type === 'weapon-spread') playerRef.current.weapon = 'spread';
        else if (p.type === 'weapon-pierce') playerRef.current.weapon = 'pierce';
        p.y = CANVAS_HEIGHT + 100;
        playSound('powerup');
      }
    });

    renderer.drawHUD(gameState.score, playerRef.current.lives, playerRef.current.shield, playerRef.current.weapon, gameState.level, gameState.levelProgress);
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [screen, gameState, spawnEnemy, playSound]);

  useEffect(() => {
    if (screen === 'playing') animationRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [screen, gameLoop]);

  const startLevel = (lvl: number) => {
    setGameState({ screen: 'playing', score: 0, level: lvl, levelProgress: 0, enemiesDestroyed: 0, powerUpsCollected: 0, combo: 0 });
    playerRef.current = { ...playerRef.current, x: CANVAS_WIDTH / 2 - 20, y: CANVAS_HEIGHT - 80, lives: 3, shield: 0, weapon: 'basic', fireRate: 300 };
    enemiesRef.current = []; bulletsRef.current = []; particlesRef.current = []; powerUpsRef.current = [];
    setScreen('playing'); playSound('click');
  };

  const fire = () => {
    if (Date.now() - playerRef.current.lastFired < playerRef.current.fireRate) return;
    const weapon = playerRef.current.weapon;
    const x = playerRef.current.x + 18, y = playerRef.current.y;
    const baseDamage = debugMode ? 50 : (powerfulMode ? 5 : 1);
    const bulletColor = debugMode ? '#ffff00' : (powerfulMode ? '#ffff00' : '#00ffff');
    
    // Basic weapon - single bullet
    if (weapon === 'basic') {
      bulletsRef.current.push({ id: 'b-'+Date.now(), x, y, dx: 0, dy: -12, width: 4, height: 15, damage: baseDamage, owner: 'player', color: bulletColor });
    }
    // Dual bullets
    else if (weapon === 'dual') {
      bulletsRef.current.push({ id: 'b1-'+Date.now(), x: x - 10, y, dx: 0, dy: -12, width: 4, height: 15, damage: baseDamage, owner: 'player', color: bulletColor });
      bulletsRef.current.push({ id: 'b2-'+Date.now(), x: x + 10, y, dx: 0, dy: -12, width: 4, height: 15, damage: baseDamage, owner: 'player', color: bulletColor });
    }
    // Triple bullets
    else if (weapon === 'triple') {
      bulletsRef.current.push({ id: 'b1-'+Date.now(), x, y, dx: 0, dy: -12, width: 4, height: 15, damage: baseDamage, owner: 'player', color: bulletColor });
      bulletsRef.current.push({ id: 'b2-'+Date.now(), x: x - 15, y, dx: -2, dy: -12, width: 4, height: 15, damage: baseDamage, owner: 'player', color: bulletColor });
      bulletsRef.current.push({ id: 'b3-'+Date.now(), x: x + 15, y, dx: 2, dy: -12, width: 4, height: 15, damage: baseDamage, owner: 'player', color: bulletColor });
    }
    // Rocket weapon - large, slow, high damage
    else if (weapon === 'rocket') {
      const rocketDamage = debugMode ? 100 : (powerfulMode ? 50 : 20);
      bulletsRef.current.push({ id: 'b-rocket-'+Date.now(), x: x - 10, y: y - 20, dx: 0, dy: -15, width: 20, height: 40, damage: rocketDamage, owner: 'player', color: '#ff6600' });
    }
    // Laser weapon - instant, multiple hits in line
    else if (weapon === 'laser') {
      const laserDamage = debugMode ? 75 : (powerfulMode ? 8 : 2);
      bulletsRef.current.push({ id: 'b-laser-'+Date.now(), x: x - 5, y: y - 20, dx: 0, dy: -20, width: 10, height: 60, damage: laserDamage, owner: 'player', color: '#ff00ff' });
    }
    // Spread weapon - bullets spread outward
    else if (weapon === 'spread') {
      for (let i = -2; i <= 2; i++) {
        const angle = i * 0.3;
        bulletsRef.current.push({ id: 'b-spread-'+i+'-'+Date.now(), x: x + Math.sin(angle) * 10, y, dx: Math.sin(angle) * 4, dy: -12, width: 4, height: 15, damage: baseDamage, owner: 'player', color: '#00ff00' });
      }
    }
    // Pierce weapon - bullets that go through enemies
    else if (weapon === 'pierce') {
      const pierceDamage = debugMode ? 40 : (powerfulMode ? 3 : 0.5);
      bulletsRef.current.push({ id: 'b-pierce-'+Date.now(), x, y, dx: 0, dy: -15, width: 3, height: 20, damage: pierceDamage, owner: 'player', color: '#00ffff' });
    }
    
    playerRef.current.lastFired = Date.now(); 
    playSound('shoot');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (screen !== 'playing') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      playerRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - 40, e.clientX - rect.left - 20));
      playerRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - 40, e.clientY - rect.top - 20));
    }
  };

  return (
    <GameLayout gameId="space-shooter" title="Space Defender Pro" score={gameState.score} highScore={progress.current.highScore}>
      <Helmet><title>Space Defender Pro - Arcade Shooter</title></Helmet>
      <div className="flex flex-col items-center justify-center p-4 min-h-[850px]">
        <div className="relative border-4 border-cyan-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.3)] bg-black" onMouseMove={handleMouseMove} onMouseDown={() => screen === 'playing' && fire()}>
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full h-auto cursor-none" />
          {screen === 'menu' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center animate-fade-in">
              <div className="mb-12 relative"><Rocket className="w-24 h-24 text-cyan-400 animate-bounce" /><div className="absolute -inset-4 bg-cyan-500/20 blur-2xl rounded-full -z-10" /></div>
              <h1 className="text-6xl font-black text-white mb-8 tracking-tighter italic">SPACE <span className="text-cyan-400">DEFENDER</span></h1>
              <div className="flex flex-col gap-4 w-64">
                <button onClick={() => startLevel(1)} className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)]">START MISSION</button>
                <button onClick={() => setScreen('levelSelect')} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">SELECT LEVEL</button>
              </div>
              <div className="mt-8 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg flex items-center gap-3 w-64">
                <input 
                  type="checkbox" 
                  id="debugMode" 
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="debugMode" className="text-yellow-400 font-bold cursor-pointer text-sm">
                  🔧 DEBUG: Unlimited Bullets
                </label>
              </div>
            </div>
          )}
          {screen === 'levelSelect' && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center p-12 overflow-y-auto">
              <h2 className="text-4xl font-bold text-white mb-8">SELECT MISSION</h2>
              <div className="grid grid-cols-1 gap-4 w-full">
                {LEVELS.map(lvl => (
                  <button key={lvl.id} disabled={lvl.id > progress.current.unlockedLevels} onClick={() => startLevel(lvl.id)} className={`p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${lvl.id <= progress.current.unlockedLevels ? 'border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20' : 'border-slate-800 bg-slate-900/50 opacity-50 grayscale'}`}>
                    <div className="text-left"><div className="text-xs text-cyan-400 font-bold mb-1 uppercase">Level {lvl.id}</div><div className="text-2xl font-bold text-white">{lvl.name}</div></div>
                    {lvl.id > progress.current.unlockedLevels ? <Lock className="text-slate-600" /> : <ChevronRight className="text-cyan-400" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setScreen('menu')} className="mt-8 text-slate-400 hover:text-white font-bold tracking-widest text-sm uppercase">Back to Base</button>
            </div>
          )}
          {screen === 'levelComplete' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-green-500"><Star className="w-10 h-10 text-green-500 fill-green-500" /></div>
              <h2 className="text-5xl font-black text-white mb-2 uppercase">Level Cleared</h2>
              <p className="text-slate-400 mb-12">Warp drive engaged. Proceeding to next sector.</p>
              <button onClick={() => startLevel(gameState.level + 1)} className="px-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)]">NEXT LEVEL</button>
            </div>
          )}
          {screen === 'gameOver' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8">
              <h2 className="text-6xl font-black text-red-500 mb-2 tracking-tighter">GAME OVER</h2>
              <div className="text-4xl font-bold text-white mb-12">FINAL SCORE: {gameState.score}</div>
              <div className="flex gap-4">
                <button onClick={() => startLevel(gameState.level)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">RETRY</button>
                <button onClick={() => setScreen('menu')} className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all">MENU</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
};

export default SpaceShooterPro;
