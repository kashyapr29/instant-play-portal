import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Volume2, VolumeX, Pause, Play, Home, Trash2 } from 'lucide-react';
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
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './types';
import { loadProgress, saveProgress, updateHighScore, updateBestCombo, incrementStats, resetProgress } from './storage';
import { audioManager } from './audio';
import { Renderer } from './renderer';

const FRUIT_TYPES: FruitType[] = ['apple', 'banana', 'peach', 'strawberry', 'watermelon'];

// Original game constants
const GRAVITY = 0.1;

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

  // Create random fruit - following original game logic
  const createFruit = useCallback((): Fruit => {
    const isBomb = Math.random() < 0.15;
    const type: FruitType = isBomb ? 'bomb' : FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    const x = Math.random() * CANVAS_WIDTH;
    const y = CANVAS_HEIGHT;
    
    // Original game xSpeed logic: if on right side, go left; if on left side, go right
    const xSpeed = x > CANVAS_WIDTH / 2 
      ? -(Math.random() * 2.3 + 0.5) 
      : (Math.random() * 2.3 + 0.5);
    
    // Original game ySpeed
    const ySpeed = -(Math.random() * 3 + 7.4);
    
    // Size with noise variation like original
    const size = Math.random() * 20 + 40;

    return {
      id: fruitIdRef.current++,
      x,
      y,
      xSpeed,
      ySpeed,
      size,
      type,
      sliced: false,
      visible: true,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
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

  // Check slice collision - following original Sword.checkSlice logic
  const checkSliceCollision = useCallback((stroke1X: number, stroke1Y: number, stroke2X: number, stroke2Y: number) => {
    fruitsRef.current.forEach(fruit => {
      if (fruit.sliced || !fruit.visible) return;

      // Original game slice detection logic
      const d1 = Math.sqrt((stroke1X - fruit.x) ** 2 + (stroke1Y - fruit.y) ** 2);
      const d2 = Math.sqrt((stroke2X - fruit.x) ** 2 + (stroke2Y - fruit.y) ** 2);
      const d3 = Math.sqrt((stroke1X - stroke2X) ** 2 + (stroke1Y - stroke2Y) ** 2);
      
      const sliced = (d1 < fruit.size) || ((d1 < d3 && d2 < d3) && (d3 < CANVAS_WIDTH / 4));
      
      if (sliced) {
        sliceFruit(fruit);
      }
    });
  }, []);

  // Slice fruit
  const sliceFruit = useCallback((fruit: Fruit) => {
    if (fruit.sliced) return;

    fruit.sliced = true;

    if (fruit.type === 'bomb') {
      // Game over on bomb - like original
      audioManager.bombExplode();
      rendererRef.current?.shake(20);
      createSliceParticles(fruit.x, fruit.y, '#ff4444');
      fruit.visible = false;

      setGameState(prev => ({ ...prev, lives: 0 }));
      return;
    }

    // Slice successful
    audioManager.fruitSliced(gameStateRef.current.combo);
    rendererRef.current?.shake(3);
    fruitsSlicedThisGameRef.current++;

    const color = FRUIT_COLORS[fruit.type];
    createSliceParticles(fruit.x, fruit.y, color);

    // Create sliced halves - like original Fruit.draw when sliced
    slicedHalvesRef.current.push(
      {
        x: fruit.x - 25,
        y: fruit.y,
        xSpeed: -fruit.xSpeed,
        ySpeed: fruit.ySpeed,
        rotation: fruit.rotation,
        rotationSpeed: -0.15,
        type: fruit.type,
        isLeft: true,
        life: 1,
      },
      {
        x: fruit.x + 25,
        y: fruit.y,
        xSpeed: fruit.xSpeed,
        ySpeed: fruit.ySpeed,
        rotation: fruit.rotation,
        rotationSpeed: 0.15,
        type: fruit.type,
        isLeft: false,
        life: 1,
      }
    );

    // Hide original fruit
    fruit.visible = false;

    // Update score and combo
    const newCombo = gameStateRef.current.combo + 1;
    const comboBonus = Math.floor(newCombo * 10);
    const basePoints = 1; // Original gives 1 point per fruit

    if (newCombo >= 3) {
      audioManager.combo(newCombo);
      comboPositionRef.current = { x: fruit.x, y: fruit.y };
    }

    setGameState(prev => ({
      ...prev,
      score: prev.score + basePoints + (newCombo >= 3 ? comboBonus : 0),
      combo: newCombo,
      comboTimer: 60,
    }));

    updateBestCombo(newCombo);
  }, [createSliceParticles]);

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

  // Game loop - following original draw() and game() functions
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

      // Spawn fruits - similar to original: frameCount % 5 === 0 && noise() > 0.69
      if (frameCountRef.current % 5 === 0) {
        if (Math.random() > 0.69) {
          fruitsRef.current.push(createFruit());
        }
      }

      // Update fruits - like original Fruit.update()
      fruitsRef.current.forEach(fruit => {
        if (fruit.sliced && fruit.type !== 'bomb') {
          // Sliced fruit movement - faster gravity like original
          fruit.x -= fruit.xSpeed;
          fruit.y += fruit.ySpeed;
          fruit.ySpeed += GRAVITY * 5;
        } else {
          // Normal fruit movement
          fruit.x += fruit.xSpeed;
          fruit.y += fruit.ySpeed;
          fruit.ySpeed += GRAVITY;
        }
        fruit.rotation += fruit.rotationSpeed;

        // Check if missed (fell below screen without being sliced)
        if (fruit.y > CANVAS_HEIGHT && !fruit.sliced && fruit.type !== 'bomb') {
          fruit.visible = false;
          audioManager.fruitMissed();
          setGameState(prev => ({ ...prev, lives: prev.lives - 1, combo: 0 }));
        }
      });

      // Remove off-screen fruits
      fruitsRef.current = fruitsRef.current.filter(f => f.visible && f.y < CANVAS_HEIGHT + 100);

      // Update sliced halves - like original sliced fruit physics
      slicedHalvesRef.current.forEach(half => {
        half.x += half.xSpeed;
        half.y += half.ySpeed;
        half.ySpeed += GRAVITY * 5;
        half.rotation += half.rotationSpeed;
        half.life -= 0.012;
      });
      slicedHalvesRef.current = slicedHalvesRef.current.filter(h => h.life > 0 && h.y < CANVAS_HEIGHT + 100);

      // Update particles
      particlesRef.current.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        p.dy += GRAVITY * 2;
        p.life -= 0.03;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Update juice splashes
      juiceSplashesRef.current.forEach(s => {
        s.life -= 0.02;
      });
      juiceSplashesRef.current = juiceSplashesRef.current.filter(s => s.life > 0);

      // Update slice trail - like original Sword.update()
      if (sliceTrailRef.current.length > 20) {
        sliceTrailRef.current.splice(0, 2);
      }
      if (sliceTrailRef.current.length > 0) {
        sliceTrailRef.current.forEach(t => t.age++);
        sliceTrailRef.current = sliceTrailRef.current.filter(t => t.age < 20);
      }

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
      // Check play button area (new-game button position)
      if (coords.x > CANVAS_WIDTH / 2 - 100 && coords.x < CANVAS_WIDTH / 2 + 100 &&
          coords.y > 320 && coords.y < 520) {
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

    // Add to swipe trail - like original Sword.swipe()
    sliceTrailRef.current.push({ x: coords.x, y: coords.y, age: 0 });

    // Check slice collision with latest two strokes - like original Sword.checkSlice()
    if (sliceTrailRef.current.length >= 2) {
      const len = sliceTrailRef.current.length;
      const stroke1 = sliceTrailRef.current[len - 1];
      const stroke2 = sliceTrailRef.current[len - 2];
      checkSliceCollision(stroke1.x, stroke1.y, stroke2.x, stroke2.y);
    }

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
