import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Volume2, VolumeX, Pause, Play, Home, RotateCcw, Lock, Trophy, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import { Ninja, Platform, Collectible, Particle, Enemy, Obstacle, BackgroundElement, GameScreen, GameState, PlatformType, CollectibleType } from './types';
import { LEVELS, getTotalLevels, calculateStars, getThemeColors } from './levels';
import { loadProgress, saveProgress, updateBestScore, updateBestHeight, updateLevelStars, unlockLevel, addCoins, incrementStats, toggleSound, resetProgress } from './storage';
import { ninjaAudioManager } from './audio';
import { NinjaRenderer } from './renderer';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const NINJA_WIDTH = 24;
const NINJA_HEIGHT = 36;
const GRAVITY = 0.5;
const JUMP_FORCE = -14;
const WALL_JUMP_FORCE = -12;
const MOVE_SPEED = 6;
const WALL_SLIDE_SPEED = 2;
const DASH_SPEED = 20;
const DASH_DURATION = 150;

const NinjaJumpGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const rendererRef = useRef<NinjaRenderer | null>(null);
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState<GameState>({
    screen: 'menu',
    score: 0,
    coins: 0,
    height: 0,
    maxHeight: 0,
    level: 1,
    lives: 3,
    timeRemaining: 90,
    activePowerUps: [],
    stars: 0,
  });

  const ninjaRef = useRef<Ninja>({
    x: CANVAS_WIDTH / 2,
    y: 100,
    vx: 0,
    vy: 0,
    width: NINJA_WIDTH,
    height: NINJA_HEIGHT,
    facingRight: true,
    isJumping: false,
    isWallSliding: false,
    wallSide: null,
    isDashing: false,
    dashCooldown: 0,
    invincible: false,
    invincibleTimer: 0,
    combo: 0,
    maxCombo: 0,
  });

  const platformsRef = useRef<Platform[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const bgElementsRef = useRef<BackgroundElement[]>([]);
  const cameraYRef = useRef<number>(0);
  const gameStateRef = useRef(gameState);
  const lastPlatformYRef = useRef<number>(0);

  const [progress, setProgress] = useState(loadProgress());

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    ninjaAudioManager.setEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    rendererRef.current = new NinjaRenderer(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  const generatePlatform = useCallback((y: number, levelNum: number): Platform => {
    const level = LEVELS[levelNum - 1];
    const types: PlatformType[] = ['normal', 'bamboo', 'stone', 'wood'];
    if (levelNum >= 3) types.push('crumbling');
    if (levelNum >= 4) types.push('ice');
    if (levelNum >= 5) types.push('bouncy');
    if (levelNum >= 6) types.push('moving');

    const type = types[Math.floor(Math.random() * types.length)];
    const width = 60 + Math.random() * 60;

    return {
      x: 50 + Math.random() * (CANVAS_WIDTH - 100 - width),
      y,
      width,
      height: 15,
      type,
      moving: type === 'moving',
      moveSpeed: type === 'moving' ? 1 + Math.random() * 2 : 0,
      moveRange: type === 'moving' ? 50 + Math.random() * 50 : 0,
      startX: 0,
    };
  }, []);

  const generateCollectible = useCallback((y: number): Collectible | null => {
    if (Math.random() > 0.4) return null;
    
    const types: CollectibleType[] = ['coin', 'coin', 'coin', 'gem', 'scroll'];
    if (Math.random() > 0.9) types.push('powerup_speed', 'powerup_jump', 'powerup_shield');
    if (Math.random() > 0.95) types.push('health');

    const type = types[Math.floor(Math.random() * types.length)];
    const values: Record<CollectibleType, number> = {
      coin: 10, gem: 50, scroll: 100, health: 0,
      powerup_speed: 25, powerup_jump: 25, powerup_shield: 25, powerup_magnet: 25,
    };

    return {
      x: 50 + Math.random() * (CANVAS_WIDTH - 100),
      y: y + 30 + Math.random() * 40,
      type,
      collected: false,
      value: values[type],
      rotation: 0,
    };
  }, []);

  const initLevel = useCallback((levelNum: number) => {
    const level = LEVELS[levelNum - 1];
    if (!level) return;

    const ninja = ninjaRef.current;
    ninja.x = CANVAS_WIDTH / 2;
    ninja.y = 100;
    ninja.vx = 0;
    ninja.vy = 0;
    ninja.isJumping = false;
    ninja.isWallSliding = false;
    ninja.combo = 0;
    ninja.invincible = false;

    platformsRef.current = [];
    collectiblesRef.current = [];
    particlesRef.current = [];
    enemiesRef.current = [];
    obstaclesRef.current = [];
    cameraYRef.current = 0;
    lastPlatformYRef.current = 0;

    // Starting platform
    platformsRef.current.push({
      x: CANVAS_WIDTH / 2 - 60,
      y: 50,
      width: 120,
      height: 15,
      type: 'checkpoint',
    });

    // Generate initial platforms
    for (let i = 1; i <= 20; i++) {
      const y = i * (70 + Math.random() * 30);
      platformsRef.current.push(generatePlatform(y, levelNum));
      const collectible = generateCollectible(y);
      if (collectible) collectiblesRef.current.push(collectible);
      lastPlatformYRef.current = y;
    }

    // Background elements
    bgElementsRef.current = [];
    for (let i = 0; i < 15; i++) {
      bgElementsRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * 2000,
        type: ['cloud', 'bird', 'lantern', 'tree'][Math.floor(Math.random() * 4)] as any,
        speed: 0.2 + Math.random() * 0.3,
        scale: 0.5 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.4,
      });
    }

    if (rendererRef.current) {
      rendererRef.current.setTheme(level.theme);
    }

    setGameState(prev => ({
      ...prev,
      screen: 'playing',
      score: 0,
      coins: 0,
      height: 0,
      maxHeight: 0,
      level: levelNum,
      lives: 3,
      timeRemaining: level.timeLimit,
      activePowerUps: [],
      stars: 0,
    }));
  }, [generatePlatform, generateCollectible]);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number, type: 'dust' | 'spark' | 'star' = 'dust') => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 2 + Math.random() * 4,
        type,
      });
    }
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    if (!rendererRef.current) return;
    
    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 16.67, 2);
    lastTimeRef.current = timestamp;

    const state = gameStateRef.current;
    if (state.screen !== 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const ninja = ninjaRef.current;
    const level = LEVELS[state.level - 1];
    const gravity = level?.gravity || GRAVITY;

    // Handle input
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
      ninja.vx = -MOVE_SPEED;
      ninja.facingRight = false;
    } else if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
      ninja.vx = MOVE_SPEED;
      ninja.facingRight = true;
    } else {
      ninja.vx *= 0.85;
    }

    // Apply gravity
    ninja.vy += gravity * deltaTime;
    if (ninja.isWallSliding && ninja.vy > 0) {
      ninja.vy = Math.min(ninja.vy, WALL_SLIDE_SPEED);
    }

    // Move ninja
    ninja.x += ninja.vx * deltaTime;
    ninja.y += ninja.vy * deltaTime;

    // Wall collision & sliding
    ninja.isWallSliding = false;
    ninja.wallSide = null;
    if (ninja.x < ninja.width / 2) {
      ninja.x = ninja.width / 2;
      if (ninja.vy > 0 && (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA'))) {
        ninja.isWallSliding = true;
        ninja.wallSide = 'left';
      }
    }
    if (ninja.x > CANVAS_WIDTH - ninja.width / 2) {
      ninja.x = CANVAS_WIDTH - ninja.width / 2;
      if (ninja.vy > 0 && (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD'))) {
        ninja.isWallSliding = true;
        ninja.wallSide = 'right';
      }
    }

    // Platform collision
    let onPlatform = false;
    platformsRef.current.forEach(platform => {
      if (platform.moving && platform.startX !== undefined && platform.moveRange && platform.moveSpeed) {
        platform.x = platform.startX + Math.sin(timestamp * 0.002 * platform.moveSpeed) * platform.moveRange;
      }

      if (ninja.vy >= 0 &&
          ninja.x + ninja.width / 2 > platform.x &&
          ninja.x - ninja.width / 2 < platform.x + platform.width &&
          ninja.y > platform.y &&
          ninja.y - ninja.height < platform.y + platform.height &&
          ninja.y + ninja.vy * deltaTime >= platform.y) {
        
        if (platform.type !== 'spike') {
          ninja.y = platform.y;
          ninja.isJumping = false;
          onPlatform = true;

          if (platform.type === 'bouncy') {
            ninja.vy = JUMP_FORCE * 1.5;
            ninja.isJumping = true;
            ninjaAudioManager.jump();
            spawnParticles(ninja.x, ninja.y, '#ff7043', 5, 'spark');
          } else if (platform.type === 'ice') {
            ninja.vx *= 0.99;
          } else if (platform.type === 'crumbling' && !platform.crumbling) {
            platform.crumbling = true;
            platform.crumbleTimer = 60;
          } else {
            ninja.vy = 0;
          }

          if (platform.type === 'checkpoint') {
            ninjaAudioManager.checkpoint();
          }
        } else {
          if (!ninja.invincible) {
            setGameState(prev => ({ ...prev, lives: prev.lives - 1 }));
            ninja.invincible = true;
            ninja.invincibleTimer = 120;
            ninja.vy = JUMP_FORCE;
            ninjaAudioManager.hit();
          }
        }
      }
    });

    // Crumbling platform update
    platformsRef.current = platformsRef.current.filter(p => {
      if (p.crumbling && p.crumbleTimer !== undefined) {
        p.crumbleTimer--;
        if (p.crumbleTimer <= 0) return false;
      }
      return true;
    });

    // Collectible collision
    collectiblesRef.current.forEach(col => {
      if (!col.collected) {
        col.rotation += 0.05;
        const dist = Math.hypot(ninja.x - col.x, ninja.y - ninja.height / 2 - col.y);
        if (dist < 25) {
          col.collected = true;
          ninja.combo++;
          
          if (col.type === 'coin') {
            ninjaAudioManager.collectCoin();
            setGameState(prev => ({ ...prev, coins: prev.coins + 1, score: prev.score + col.value * ninja.combo }));
          } else if (col.type === 'gem') {
            ninjaAudioManager.collectGem();
            setGameState(prev => ({ ...prev, coins: prev.coins + 5, score: prev.score + col.value * ninja.combo }));
          } else if (col.type === 'health') {
            setGameState(prev => ({ ...prev, lives: Math.min(prev.lives + 1, 5) }));
          } else if (col.type.startsWith('powerup')) {
            ninjaAudioManager.powerUp();
            setGameState(prev => ({
              ...prev,
              score: prev.score + col.value,
              activePowerUps: [...prev.activePowerUps, { type: col.type, endTime: Date.now() + 10000 }]
            }));
          }
          
          spawnParticles(col.x, col.y, '#ffd700', 8, 'star');
        }
      }
    });

    // Update invincibility
    if (ninja.invincible) {
      ninja.invincibleTimer--;
      if (ninja.invincibleTimer <= 0) {
        ninja.invincible = false;
      }
    }

    // Camera follow
    const targetCameraY = Math.max(0, ninja.y - CANVAS_HEIGHT / 3);
    cameraYRef.current += (targetCameraY - cameraYRef.current) * 0.1;

    // Update height & score
    const currentHeight = Math.max(0, Math.floor(ninja.y / 10));
    if (currentHeight > state.maxHeight) {
      setGameState(prev => ({
        ...prev,
        height: currentHeight,
        maxHeight: currentHeight,
        score: prev.score + (currentHeight - prev.maxHeight) * 2,
      }));
    }

    // Generate more platforms
    while (lastPlatformYRef.current < cameraYRef.current + CANVAS_HEIGHT * 2) {
      lastPlatformYRef.current += 70 + Math.random() * 40;
      platformsRef.current.push(generatePlatform(lastPlatformYRef.current, state.level));
      const col = generateCollectible(lastPlatformYRef.current);
      if (col) collectiblesRef.current.push(col);
    }

    // Clean up off-screen objects
    const minY = cameraYRef.current - 200;
    platformsRef.current = platformsRef.current.filter(p => p.y > minY);
    collectiblesRef.current = collectiblesRef.current.filter(c => c.y > minY && !c.collected);

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
      return p.life > 0;
    });

    // Check death (fell below camera)
    if (ninja.y < cameraYRef.current - 100) {
      ninjaAudioManager.death();
      incrementStats('deaths');
      setGameState(prev => {
        if (prev.lives <= 1) {
          return { ...prev, screen: 'gameOver', lives: 0 };
        }
        ninja.y = cameraYRef.current + CANVAS_HEIGHT / 2;
        ninja.vy = 0;
        ninja.invincible = true;
        ninja.invincibleTimer = 120;
        return { ...prev, lives: prev.lives - 1 };
      });
    }

    // Time update
    setGameState(prev => {
      const newTime = prev.timeRemaining - deltaTime / 60;
      if (newTime <= 0) {
        const stars = calculateStars(prev.score, level?.targetScore || 1000, prev.coins, prev.maxHeight);
        updateLevelStars(prev.level, stars);
        updateBestScore(prev.level, prev.score);
        updateBestHeight(prev.level, prev.maxHeight);
        addCoins(prev.coins);
        if (stars >= 1 && prev.level < getTotalLevels()) {
          unlockLevel(prev.level + 1);
        }
        return { ...prev, screen: 'levelComplete', timeRemaining: 0, stars };
      }
      return { ...prev, timeRemaining: newTime };
    });

    // Render
    rendererRef.current.setCameraY(cameraYRef.current);
    rendererRef.current.clear();
    rendererRef.current.drawBackground(bgElementsRef.current);
    
    platformsRef.current.forEach(p => rendererRef.current!.drawPlatform(p));
    collectiblesRef.current.forEach(c => rendererRef.current!.drawCollectible(c));
    particlesRef.current.forEach(p => rendererRef.current!.drawParticle(p));
    rendererRef.current.drawNinja(ninja);
    rendererRef.current.drawHUD(state.score, state.coins, state.maxHeight, state.lives, state.level, state.timeRemaining, ninja.combo);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [generatePlatform, generateCollectible, spawnParticles]);

  const handleJump = useCallback(() => {
    const ninja = ninjaRef.current;
    if (ninja.isWallSliding) {
      ninja.vy = WALL_JUMP_FORCE;
      ninja.vx = ninja.wallSide === 'left' ? MOVE_SPEED * 2 : -MOVE_SPEED * 2;
      ninja.isJumping = true;
      ninja.isWallSliding = false;
      ninjaAudioManager.wallJump();
      incrementStats('jumps');
      spawnParticles(ninja.x, ninja.y, '#64ffda', 5, 'dust');
    } else if (!ninja.isJumping) {
      ninja.vy = JUMP_FORCE;
      ninja.isJumping = true;
      ninjaAudioManager.jump();
      incrementStats('jumps');
      spawnParticles(ninja.x, ninja.y, '#888', 3, 'dust');
    }
  }, [spawnParticles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && gameStateRef.current.screen === 'playing') {
        e.preventDefault();
        handleJump();
      }
      if (e.code === 'Escape' && gameStateRef.current.screen === 'playing') {
        setGameState(prev => ({ ...prev, screen: 'paused' }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump]);

  useEffect(() => {
    if (gameState.screen === 'playing') {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState.screen, gameLoop]);

  const handleToggleSound = () => {
    const newProgress = toggleSound();
    setProgress(newProgress);
    ninjaAudioManager.menuClick();
  };

  // Render UI screens
  const renderMenu = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 mb-2">
        忍者ジャンプ
      </h1>
      <h2 className="text-3xl font-bold text-foreground mb-8">NINJA JUMP</h2>
      
      <div className="flex flex-col gap-4 w-64">
        <button onClick={() => initLevel(1)} className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl hover:scale-105 transition-transform">
          <Play className="inline mr-2 h-5 w-5" /> START GAME
        </button>
        <button onClick={() => setGameState(prev => ({ ...prev, screen: 'levelSelect' }))} className="px-8 py-4 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors">
          <Trophy className="inline mr-2 h-5 w-5" /> LEVEL SELECT
        </button>
      </div>

      <div className="absolute bottom-8 text-muted-foreground text-sm">
        Use Arrow Keys / WASD to move • Space to Jump
      </div>
    </div>
  );

  const renderLevelSelect = () => (
    <div className="absolute inset-0 flex flex-col items-center bg-gradient-to-b from-slate-900 to-slate-800 p-6 overflow-auto">
      <button onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))} className="absolute top-4 left-4 p-2 rounded-lg bg-secondary hover:bg-secondary/80">
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <h2 className="text-3xl font-bold text-foreground mb-6">SELECT LEVEL</h2>
      
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {LEVELS.map(level => {
          const isUnlocked = level.id <= progress.highestUnlockedLevel;
          const stars = progress.levelStars[level.id] || 0;
          const colors = getThemeColors(level.theme);
          
          return (
            <button
              key={level.id}
              onClick={() => isUnlocked && initLevel(level.id)}
              disabled={!isUnlocked}
              className={`p-4 rounded-xl border-2 transition-all ${isUnlocked ? 'hover:scale-105 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
              style={{ borderColor: colors.primary, background: `linear-gradient(135deg, ${colors.bg[0]}, ${colors.bg[1]})` }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-white">Level {level.id}</span>
                {!isUnlocked && <Lock className="h-4 w-4 text-white/60" />}
              </div>
              <p className="text-sm text-white/80 mb-2">{level.name}</p>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <Star key={i} className={`h-4 w-4 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderPaused = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
      <h2 className="text-4xl font-bold text-white mb-8">PAUSED</h2>
      <div className="flex flex-col gap-4">
        <button onClick={() => setGameState(prev => ({ ...prev, screen: 'playing' }))} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-105 transition-transform">
          <Play className="inline mr-2 h-5 w-5" /> RESUME
        </button>
        <button onClick={() => initLevel(gameState.level)} className="px-8 py-3 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80">
          <RotateCcw className="inline mr-2 h-5 w-5" /> RESTART
        </button>
        <button onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))} className="px-8 py-3 bg-destructive text-destructive-foreground font-bold rounded-xl hover:bg-destructive/80">
          <Home className="inline mr-2 h-5 w-5" /> QUIT
        </button>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
      <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
      <p className="text-2xl text-white mb-2">Score: {gameState.score}</p>
      <p className="text-xl text-muted-foreground mb-8">Height: {gameState.maxHeight}m</p>
      <div className="flex gap-4">
        <button onClick={() => initLevel(gameState.level)} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-105 transition-transform">
          TRY AGAIN
        </button>
        <button onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))} className="px-8 py-3 bg-secondary text-foreground font-bold rounded-xl">
          MENU
        </button>
      </div>
    </div>
  );

  const renderLevelComplete = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
      <h2 className="text-4xl font-bold text-green-400 mb-4">LEVEL COMPLETE!</h2>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map(i => (
          <Star key={i} className={`h-10 w-10 ${i <= gameState.stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} />
        ))}
      </div>
      <p className="text-2xl text-white mb-2">Score: {gameState.score}</p>
      <p className="text-lg text-muted-foreground mb-8">Coins: {gameState.coins} | Height: {gameState.maxHeight}m</p>
      <div className="flex gap-4">
        {gameState.level < getTotalLevels() && (
          <button onClick={() => initLevel(gameState.level + 1)} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:scale-105 transition-transform">
            NEXT LEVEL
          </button>
        )}
        <button onClick={() => setGameState(prev => ({ ...prev, screen: 'levelSelect' }))} className="px-8 py-3 bg-secondary text-foreground font-bold rounded-xl">
          LEVEL SELECT
        </button>
      </div>
    </div>
  );

  return (
    <GameLayout
      gameId="ninja-jump"
      title="Ninja Jump"
      score={gameState.score}
      highScore={progress.bestScores[gameState.level] || 0}
      isMuted={!progress.soundEnabled}
      onToggleMute={handleToggleSound}
      showAudioControl
    >
      <Helmet>
        <title>Ninja Jump - Action Platform Game</title>
        <meta name="description" content="Jump, wall-climb, and dash through challenging levels as a skilled ninja!" />
      </Helmet>

      <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg"
          style={{ background: '#1a1a2e' }}
        />

        {gameState.screen === 'menu' && renderMenu()}
        {gameState.screen === 'levelSelect' && renderLevelSelect()}
        {gameState.screen === 'paused' && renderPaused()}
        {gameState.screen === 'gameOver' && renderGameOver()}
        {gameState.screen === 'levelComplete' && renderLevelComplete()}

        {gameState.screen === 'playing' && (
          <button
            onClick={() => setGameState(prev => ({ ...prev, screen: 'paused' }))}
            className="absolute top-16 right-4 p-2 bg-black/50 rounded-lg hover:bg-black/70"
          >
            <Pause className="h-5 w-5 text-white" />
          </button>
        )}
      </div>
    </GameLayout>
  );
};

export default NinjaJumpGame;
