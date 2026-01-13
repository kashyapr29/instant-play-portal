import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Volume2, VolumeX, Pause, Play, Home, RotateCcw, Trash2 } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import {
  Fruit,
  SliceTrail,
  Particle,
  SlicedFruitHalf,
  JuiceSplash,
  GameScreen,
  GameState,
  FruitType,
  FRUIT_COLORS,
  GRAVITY,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './types';
import { loadProgress, saveProgress, updateHighScore, updateBestCombo, incrementStats, resetProgress } from './storage';
import { audioManager } from './audio';
import { Renderer } from './renderer';

const FRUIT_TYPES: FruitType[] = ['apple', 'banana', 'peach', 'strawberry', 'watermelon'];

const FruitNinjaGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const rendererRef = useRef<Renderer | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    screen: 'menu',
    score: 0,
    lives: 3,
    combo: 0,
    comboTimer: 0,
    difficulty: 1,
  });

  // Game objects
  const fruitsRef = useRef<Fruit[]>([]);
  const sliceTrailRef = useRef<SliceTrail[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const slicedHalvesRef = useRef<SlicedFruitHalf[]>([]);
  const juiceSplashesRef = useRef<JuiceSplash[]>([]);
  const gameStateRef = useRef(gameState);
  const fruitIdRef = useRef(0);
  const fruitsSlicedThisGameRef = useRef(0);
  const comboPositionRef = useRef({ x: 0, y: 0 });
  const frameCountRef = useRef(0);
  const isSlicingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Progress
  const [progress, setProgress] = useState(loadProgress());
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    audioManager.setEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    rendererRef.current = new Renderer(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Create random fruit
  const createFruit = useCallback((): Fruit => {
    const isBomb = Math.random() < 0.15 + gameStateRef.current.difficulty * 0.02;
    const type: FruitType = isBomb ? 'bomb' : FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    const x = Math.random() * (CANVAS_WIDTH - 100) + 50;
    const y = CANVAS_HEIGHT + 50;
    const xSpeed = (Math.random() - 0.5) * 4;
    const ySpeed = -(8 + Math.random() * 4 + gameStateRef.current.difficulty * 0.5);

    return {
      id: fruitIdRef.current++,
      x,
      y,
      xSpeed,
      ySpeed,
      size: 50 + Math.random() * 20,
      type,
      sliced: false,
      visible: true,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    };
  }, []);

  // Create particles on slice
  const createSliceParticles = useCallback((x: number, y: number, color: string) => {
    const count = 10 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color,
        life: 1,
        maxLife: 1,
      });
    }

    // Add juice splashes
    for (let i = 0; i < 5; i++) {
      juiceSplashesRef.current.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        color,
        size: 10 + Math.random() * 20,
        life: 1,
      });
    }
  }, []);

  // Slice fruit
  const sliceFruit = useCallback((fruit: Fruit) => {
    if (fruit.sliced) return;

    fruit.sliced = true;
    fruit.visible = false;

    if (fruit.type === 'bomb') {
      // Game over on bomb
      audioManager.bombExplode();
      rendererRef.current?.shake(20);
      createSliceParticles(fruit.x, fruit.y, '#ff4444');

      setGameState(prev => ({ ...prev, lives: 0 }));
      return;
    }

    // Slice successful
    audioManager.fruitSliced(gameStateRef.current.combo);
    rendererRef.current?.shake(3);
    fruitsSlicedThisGameRef.current++;

    const color = FRUIT_COLORS[fruit.type];
    createSliceParticles(fruit.x, fruit.y, color);

    // Create sliced halves
    slicedHalvesRef.current.push(
      {
        x: fruit.x - 15,
        y: fruit.y,
        xSpeed: -2 - Math.random() * 2,
        ySpeed: -2,
        rotation: fruit.rotation,
        rotationSpeed: -0.15,
        type: fruit.type,
        isLeft: true,
        life: 1,
      },
      {
        x: fruit.x + 15,
        y: fruit.y,
        xSpeed: 2 + Math.random() * 2,
        ySpeed: -2,
        rotation: fruit.rotation,
        rotationSpeed: 0.15,
        type: fruit.type,
        isLeft: false,
        life: 1,
      }
    );

    // Update score and combo
    const newCombo = gameStateRef.current.combo + 1;
    const comboBonus = Math.floor(newCombo * 10);
    const basePoints = 10;

    if (newCombo >= 3) {
      audioManager.combo(newCombo);
      comboPositionRef.current = { x: fruit.x, y: fruit.y };
    }

    setGameState(prev => ({
      ...prev,
      score: prev.score + basePoints + comboBonus,
      combo: newCombo,
      comboTimer: 60,
    }));

    updateBestCombo(newCombo);
  }, [createSliceParticles]);

  // Check if slice trail intersects with fruit
  const checkSliceCollision = useCallback((mouseX: number, mouseY: number, prevX: number, prevY: number) => {
    const trail = sliceTrailRef.current;
    if (trail.length < 2) return;

    fruitsRef.current.forEach(fruit => {
      if (fruit.sliced || !fruit.visible) return;

      // Check distance from slice line to fruit center
      const dx = mouseX - prevX;
      const dy = mouseY - prevY;
      const fx = fruit.x - prevX;
      const fy = fruit.y - prevY;

      const lineLength = Math.sqrt(dx * dx + dy * dy);
      if (lineLength === 0) return;

      const t = Math.max(0, Math.min(1, (fx * dx + fy * dy) / (lineLength * lineLength)));
      const closestX = prevX + t * dx;
      const closestY = prevY + t * dy;

      const distToFruit = Math.sqrt(
        (fruit.x - closestX) ** 2 + (fruit.y - closestY) ** 2
      );

      if (distToFruit < fruit.size / 2 + 10) {
        sliceFruit(fruit);
      }
    });
  }, [sliceFruit]);

  // Start game
  const startGame = useCallback(() => {
    fruitsRef.current = [];
    sliceTrailRef.current = [];
    particlesRef.current = [];
    slicedHalvesRef.current = [];
    juiceSplashesRef.current = [];
    fruitsSlicedThisGameRef.current = 0;
    frameCountRef.current = 0;
    setIsNewHighScore(false);

    setGameState({
      screen: 'playing',
      score: 0,
      lives: 3,
      combo: 0,
      comboTimer: 0,
      difficulty: 1,
    });

    audioManager.gameStart();
  }, []);

  // End game
  const endGame = useCallback(() => {
    const finalScore = gameStateRef.current.score;
    const isNew = updateHighScore(finalScore);
    setIsNewHighScore(isNew);

    if (isNew) {
      audioManager.newHighScore();
    } else {
      audioManager.gameOver();
    }

    incrementStats(fruitsSlicedThisGameRef.current);
    setProgress(loadProgress());
    setGameState(prev => ({ ...prev, screen: 'gameOver' }));
  }, []);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.update();
    renderer.clear();

    const state = gameStateRef.current;

    if (state.screen === 'menu') {
      renderer.drawMenu(progress.highScore, {
        totalFruitsSliced: progress.totalFruitsSliced,
        totalGamesPlayed: progress.totalGamesPlayed,
        bestCombo: progress.bestCombo,
      });
    } else if (state.screen === 'playing') {
      frameCountRef.current++;

      // Spawn fruits
      const spawnRate = Math.max(30, 80 - state.difficulty * 5);
      if (frameCountRef.current % spawnRate === 0) {
        const count = 1 + Math.floor(Math.random() * (1 + state.difficulty / 5));
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            fruitsRef.current.push(createFruit());
          }, i * 150);
        }
      }

      // Increase difficulty over time
      if (frameCountRef.current % 600 === 0) {
        setGameState(prev => ({ ...prev, difficulty: Math.min(10, prev.difficulty + 0.5) }));
      }

      // Update fruits
      fruitsRef.current.forEach(fruit => {
        fruit.x += fruit.xSpeed;
        fruit.y += fruit.ySpeed;
        fruit.ySpeed += GRAVITY;
        fruit.rotation += fruit.rotationSpeed;

        // Check if missed (fell below screen without being sliced)
        if (fruit.y > CANVAS_HEIGHT + 100 && !fruit.sliced && fruit.type !== 'bomb') {
          fruit.visible = false;
          audioManager.fruitMissed();
          setGameState(prev => ({ ...prev, lives: prev.lives - 1, combo: 0 }));
        }
      });

      // Remove off-screen fruits
      fruitsRef.current = fruitsRef.current.filter(f => f.visible && f.y < CANVAS_HEIGHT + 150);

      // Update sliced halves
      slicedHalvesRef.current.forEach(half => {
        half.x += half.xSpeed;
        half.y += half.ySpeed;
        half.ySpeed += GRAVITY;
        half.rotation += half.rotationSpeed;
        half.life -= 0.015;
      });
      slicedHalvesRef.current = slicedHalvesRef.current.filter(h => h.life > 0 && h.y < CANVAS_HEIGHT + 100);

      // Update particles
      particlesRef.current.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        p.dy += GRAVITY * 0.5;
        p.life -= 0.03;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Update juice splashes
      juiceSplashesRef.current.forEach(s => {
        s.life -= 0.02;
      });
      juiceSplashesRef.current = juiceSplashesRef.current.filter(s => s.life > 0);

      // Update slice trail
      sliceTrailRef.current.forEach(t => {
        t.age++;
      });
      sliceTrailRef.current = sliceTrailRef.current.filter(t => t.age < 20);

      // Update combo timer
      if (state.comboTimer > 0) {
        setGameState(prev => ({
          ...prev,
          comboTimer: prev.comboTimer - 1,
          combo: prev.comboTimer <= 1 ? 0 : prev.combo,
        }));
      }

      // Draw juice splashes (behind everything)
      juiceSplashesRef.current.forEach(s => renderer.drawJuiceSplash(s));

      // Draw fruits
      fruitsRef.current.forEach(fruit => {
        if (fruit.visible) renderer.drawFruit(fruit);
      });

      // Draw sliced halves
      slicedHalvesRef.current.forEach(half => renderer.drawSlicedHalf(half));

      // Draw particles
      particlesRef.current.forEach(p => renderer.drawParticle(p));

      // Draw slice trail
      renderer.drawSliceTrail(sliceTrailRef.current);

      // Draw UI
      renderer.drawScore(state.score, progress.highScore);
      renderer.drawLives(state.lives);

      // Draw combo
      if (state.combo >= 3 && state.comboTimer > 0) {
        renderer.drawCombo(state.combo, comboPositionRef.current.x, comboPositionRef.current.y, state.comboTimer);
      }

      // Check game over
      if (state.lives <= 0) {
        endGame();
      }
    } else if (state.screen === 'paused') {
      // Draw game state in background
      fruitsRef.current.forEach(fruit => {
        if (fruit.visible) renderer.drawFruit(fruit);
      });
      renderer.drawScore(state.score, progress.highScore);
      renderer.drawLives(state.lives);
      renderer.drawPaused();
    } else if (state.screen === 'gameOver') {
      renderer.drawGameOver(state.score, progress.highScore, isNewHighScore);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [progress, isNewHighScore, createFruit, endGame]);

  // Start game loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  // Mouse/touch handlers
  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);

    if (gameState.screen === 'menu') {
      // Check play button
      if (coords.x > CANVAS_WIDTH / 2 - 100 && coords.x < CANVAS_WIDTH / 2 + 100 &&
          coords.y > 280 && coords.y < 340) {
        audioManager.menuClick();
        startGame();
        return;
      }
    } else if (gameState.screen === 'gameOver') {
      // Check play again button
      if (coords.x > CANVAS_WIDTH / 2 - 100 && coords.x < CANVAS_WIDTH / 2 + 100 &&
          coords.y > 430 && coords.y < 485) {
        audioManager.menuClick();
        startGame();
        return;
      }
      // Check menu button
      if (coords.x > CANVAS_WIDTH / 2 - 80 && coords.x < CANVAS_WIDTH / 2 + 80 &&
          coords.y > 510 && coords.y < 555) {
        audioManager.menuClick();
        setGameState(prev => ({ ...prev, screen: 'menu' }));
        return;
      }
    } else if (gameState.screen === 'paused') {
      // Check resume button
      if (coords.x > CANVAS_WIDTH / 2 - 80 && coords.x < CANVAS_WIDTH / 2 + 80 &&
          coords.y > CANVAS_HEIGHT / 2 && coords.y < CANVAS_HEIGHT / 2 + 50) {
        audioManager.menuClick();
        setGameState(prev => ({ ...prev, screen: 'playing' }));
        return;
      }
      // Check quit button
      if (coords.x > CANVAS_WIDTH / 2 - 80 && coords.x < CANVAS_WIDTH / 2 + 80 &&
          coords.y > CANVAS_HEIGHT / 2 + 70 && coords.y < CANVAS_HEIGHT / 2 + 120) {
        audioManager.menuClick();
        setGameState(prev => ({ ...prev, screen: 'menu' }));
        return;
      }
    }

    if (gameState.screen === 'playing') {
      isSlicingRef.current = true;
      lastMousePosRef.current = coords;
      sliceTrailRef.current = [{ x: coords.x, y: coords.y, age: 0 }];
      audioManager.slice();
    }
  }, [gameState.screen, getCanvasCoords, startGame]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isSlicingRef.current || gameState.screen !== 'playing') return;
    e.preventDefault();

    const coords = getCanvasCoords(e);
    const prevCoords = lastMousePosRef.current;

    sliceTrailRef.current.push({ x: coords.x, y: coords.y, age: 0 });
    if (sliceTrailRef.current.length > 20) {
      sliceTrailRef.current.shift();
    }

    checkSliceCollision(coords.x, coords.y, prevCoords.x, prevCoords.y);
    lastMousePosRef.current = coords;
  }, [gameState.screen, getCanvasCoords, checkSliceCollision]);

  const handlePointerUp = useCallback(() => {
    isSlicingRef.current = false;
  }, []);

  // Toggle sound
  const toggleSound = useCallback(() => {
    const newEnabled = !progress.soundEnabled;
    saveProgress({ soundEnabled: newEnabled });
    setProgress(prev => ({ ...prev, soundEnabled: newEnabled }));
    audioManager.setEnabled(newEnabled);
  }, [progress.soundEnabled]);

  // Handle pause
  const handlePause = useCallback(() => {
    if (gameState.screen === 'playing') {
      setGameState(prev => ({ ...prev, screen: 'paused' }));
    } else if (gameState.screen === 'paused') {
      setGameState(prev => ({ ...prev, screen: 'playing' }));
    }
  }, [gameState.screen]);

  // Handle reset progress
  const handleResetProgress = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      resetProgress();
      setProgress(loadProgress());
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handlePause();
      } else if (e.key === ' ' && gameState.screen === 'menu') {
        startGame();
      } else if (e.key === ' ' && gameState.screen === 'gameOver') {
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePause, startGame, gameState.screen]);

  return (
    <GameLayout title="Fruit Ninja" gameId="fruit-ninja">
      <Helmet>
        <title>Fruit Ninja - Slice & Dice!</title>
        <meta name="description" content="Slice fruits, avoid bombs, and become the ultimate Fruit Ninja!" />
      </Helmet>

      <div className="flex flex-col items-center gap-4">
        {/* Controls */}
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2">
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title={progress.soundEnabled ? 'Mute' : 'Unmute'}
          >
            {progress.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-white" />
            ) : (
              <VolumeX className="w-5 h-5 text-white/50" />
            )}
          </button>

          {gameState.screen === 'playing' && (
            <button
              onClick={handlePause}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Pause"
            >
              <Pause className="w-5 h-5 text-white" />
            </button>
          )}

          {gameState.screen === 'paused' && (
            <button
              onClick={handlePause}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Resume"
            >
              <Play className="w-5 h-5 text-white" />
            </button>
          )}

          {(gameState.screen === 'playing' || gameState.screen === 'paused') && (
            <button
              onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Menu"
            >
              <Home className="w-5 h-5 text-white" />
            </button>
          )}

          {gameState.screen === 'menu' && (
            <button
              onClick={handleResetProgress}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
              title="Reset Progress"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
          )}
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-2xl shadow-2xl cursor-crosshair max-w-full"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
              touchAction: 'none',
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        </div>

        {/* Instructions */}
        <div className="text-center text-white/60 text-sm">
          <p>🎮 Swipe/drag to slice fruits • Avoid bombs! 💣</p>
          <p className="mt-1">Press <kbd className="px-2 py-0.5 bg-white/10 rounded">ESC</kbd> to pause</p>
        </div>
      </div>
    </GameLayout>
  );
};

export default FruitNinjaGame;
