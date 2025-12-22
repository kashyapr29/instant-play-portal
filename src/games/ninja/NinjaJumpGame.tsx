import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Volume2, VolumeX, Pause, Play, Home, RotateCcw } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import { ninjaAudioManager } from './audio';
import { loadProgress, toggleSound } from './storage';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;
const NINJA_SIZE = 30;
const WALL_WIDTH = 25;
const GAP_HEIGHT = 120;
const WALL_SPEED_INITIAL = 2;

interface Wall {
  y: number;
  gapStart: number;
  side: 'left' | 'right';
  passed: boolean;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

interface Ninja {
  x: number;
  y: number;
  vx: number;
  vy: number;
  movingRight: boolean;
}

type GameScreen = 'menu' | 'playing' | 'paused' | 'gameOver';

const NinjaJumpGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const [screen, setScreen] = useState<GameScreen>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [progress, setProgress] = useState(loadProgress());

  const ninjaRef = useRef<Ninja>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 150,
    vx: 5,
    vy: 0,
    movingRight: true,
  });

  const wallsRef = useRef<Wall[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const scoreRef = useRef(0);
  const wallSpeedRef = useRef(WALL_SPEED_INITIAL);
  const screenRef = useRef<GameScreen>('menu');

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    ninjaAudioManager.setEnabled(progress.soundEnabled);
    const stored = localStorage.getItem('ninja_jump_high');
    if (stored) setHighScore(parseInt(stored));
  }, [progress.soundEnabled]);

  const initGame = useCallback(() => {
    const ninja = ninjaRef.current;
    ninja.x = CANVAS_WIDTH / 2;
    ninja.y = CANVAS_HEIGHT - 150;
    ninja.vx = 5;
    ninja.vy = 0;
    ninja.movingRight = true;

    wallsRef.current = [];
    coinsRef.current = [];
    scoreRef.current = 0;
    wallSpeedRef.current = WALL_SPEED_INITIAL;

    // Generate initial walls
    for (let i = 0; i < 8; i++) {
      const y = CANVAS_HEIGHT - 300 - i * 150;
      const side = i % 2 === 0 ? 'left' : 'right';
      const gapStart = 100 + Math.random() * (CANVAS_HEIGHT - GAP_HEIGHT - 200);
      wallsRef.current.push({ y, gapStart, side, passed: false });

      // Add coins in gaps
      if (Math.random() > 0.3) {
        coinsRef.current.push({
          x: side === 'left' ? WALL_WIDTH + 50 : CANVAS_WIDTH - WALL_WIDTH - 50,
          y: y + gapStart + GAP_HEIGHT / 2,
          collected: false,
        });
      }
    }

    setScore(0);
    setScreen('playing');
  }, []);

  const handleTap = useCallback(() => {
    if (screenRef.current === 'playing') {
      const ninja = ninjaRef.current;
      ninja.movingRight = !ninja.movingRight;
      ninja.vx = ninja.movingRight ? 5 : -5;
      ninja.vy = -8; // Jump up
      ninjaAudioManager.jump();
    }
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 16.67, 2);
    lastTimeRef.current = timestamp;

    if (screenRef.current !== 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const ninja = ninjaRef.current;
    const walls = wallsRef.current;
    const coins = coinsRef.current;

    // Apply gravity
    ninja.vy += 0.4 * deltaTime;
    ninja.x += ninja.vx * deltaTime;
    ninja.y += ninja.vy * deltaTime;

    // Move walls down (ninja appears to go up)
    walls.forEach(wall => {
      wall.y += wallSpeedRef.current * deltaTime;
    });
    coins.forEach(coin => {
      coin.y += wallSpeedRef.current * deltaTime;
    });

    // Wall collision - bounce off walls
    const leftWallX = WALL_WIDTH;
    const rightWallX = CANVAS_WIDTH - WALL_WIDTH;

    // Check if ninja hits a wall
    if (ninja.x - NINJA_SIZE / 2 < leftWallX) {
      // Check if in gap
      const wallAtPos = walls.find(w => w.side === 'left' && 
        ninja.y > w.y + w.gapStart - NINJA_SIZE / 2 && 
        ninja.y < w.y + w.gapStart + GAP_HEIGHT + NINJA_SIZE / 2);
      
      if (!wallAtPos) {
        ninja.x = leftWallX + NINJA_SIZE / 2;
        ninja.vx = 5;
        ninja.movingRight = true;
        ninja.vy = -10;
        ninjaAudioManager.wallJump();
      }
    }

    if (ninja.x + NINJA_SIZE / 2 > rightWallX) {
      const wallAtPos = walls.find(w => w.side === 'right' && 
        ninja.y > w.y + w.gapStart - NINJA_SIZE / 2 && 
        ninja.y < w.y + w.gapStart + GAP_HEIGHT + NINJA_SIZE / 2);
      
      if (!wallAtPos) {
        ninja.x = rightWallX - NINJA_SIZE / 2;
        ninja.vx = -5;
        ninja.movingRight = false;
        ninja.vy = -10;
        ninjaAudioManager.wallJump();
      }
    }

    // Check wall segment collision (game over)
    let gameOver = false;
    walls.forEach(wall => {
      const wallX = wall.side === 'left' ? 0 : CANVAS_WIDTH - WALL_WIDTH;
      const wallEndX = wall.side === 'left' ? WALL_WIDTH : CANVAS_WIDTH;
      
      // Top section of wall (above gap)
      if (ninja.x - NINJA_SIZE / 2 < wallEndX && 
          ninja.x + NINJA_SIZE / 2 > wallX &&
          ninja.y + NINJA_SIZE / 2 > wall.y &&
          ninja.y - NINJA_SIZE / 2 < wall.y + wall.gapStart) {
        gameOver = true;
      }
      
      // Bottom section of wall (below gap)
      if (ninja.x - NINJA_SIZE / 2 < wallEndX && 
          ninja.x + NINJA_SIZE / 2 > wallX &&
          ninja.y + NINJA_SIZE / 2 > wall.y + wall.gapStart + GAP_HEIGHT &&
          ninja.y - NINJA_SIZE / 2 < wall.y + CANVAS_HEIGHT) {
        gameOver = true;
      }

      // Score when passing wall
      if (!wall.passed && wall.y > ninja.y) {
        wall.passed = true;
        scoreRef.current++;
        setScore(scoreRef.current);
        
        // Increase speed every 5 points
        if (scoreRef.current % 5 === 0) {
          wallSpeedRef.current = Math.min(wallSpeedRef.current + 0.3, 6);
        }
      }
    });

    if (gameOver) {
      ninjaAudioManager.death();
      setScreen('gameOver');
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
        localStorage.setItem('ninja_jump_high', scoreRef.current.toString());
      }
    }

    // Collect coins
    coins.forEach(coin => {
      if (!coin.collected) {
        const dist = Math.hypot(ninja.x - coin.x, ninja.y - coin.y);
        if (dist < NINJA_SIZE) {
          coin.collected = true;
          scoreRef.current += 5;
          setScore(scoreRef.current);
          ninjaAudioManager.collectCoin();
        }
      }
    });

    // Remove passed walls and generate new ones
    if (walls.length > 0 && walls[0].y > CANVAS_HEIGHT + 100) {
      walls.shift();
      const lastWall = walls[walls.length - 1];
      const newY = lastWall.y - 150;
      const newSide = lastWall.side === 'left' ? 'right' : 'left';
      const gapStart = 80 + Math.random() * (CANVAS_HEIGHT - GAP_HEIGHT - 160);
      walls.push({ y: newY, gapStart, side: newSide, passed: false });

      if (Math.random() > 0.4) {
        coins.push({
          x: newSide === 'left' ? WALL_WIDTH + 60 : CANVAS_WIDTH - WALL_WIDTH - 60,
          y: newY + gapStart + GAP_HEIGHT / 2,
          collected: false,
        });
      }
    }

    // Remove collected coins off screen
    coinsRef.current = coins.filter(c => !c.collected && c.y < CANVAS_HEIGHT + 50);

    // Death by falling
    if (ninja.y > CANVAS_HEIGHT + 50 || ninja.y < -100) {
      ninjaAudioManager.death();
      setScreen('gameOver');
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
        localStorage.setItem('ninja_jump_high', scoreRef.current.toString());
      }
    }

    // RENDER
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw beautiful gradient background (sky)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.4, '#98D8E8');
    skyGradient.addColorStop(0.7, '#FFE4B5');
    skyGradient.addColorStop(1, '#FFA07A');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw mountains in background
    ctx.fillStyle = '#6B8E9F';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 200);
    ctx.lineTo(80, CANVAS_HEIGHT - 350);
    ctx.lineTo(160, CANVAS_HEIGHT - 200);
    ctx.fill();

    ctx.fillStyle = '#7BA3B5';
    ctx.beginPath();
    ctx.moveTo(100, CANVAS_HEIGHT - 180);
    ctx.lineTo(200, CANVAS_HEIGHT - 380);
    ctx.lineTo(300, CANVAS_HEIGHT - 180);
    ctx.fill();

    // Draw pagoda
    const pagodaX = CANVAS_WIDTH / 2;
    const pagodaY = CANVAS_HEIGHT - 280;
    
    // Pagoda base
    ctx.fillStyle = '#F4D03F';
    ctx.fillRect(pagodaX - 40, pagodaY + 60, 80, 40);
    
    // Pagoda floors
    for (let i = 0; i < 3; i++) {
      const floorY = pagodaY + 40 - i * 35;
      const floorWidth = 90 - i * 15;
      
      // Roof
      ctx.fillStyle = '#C0392B';
      ctx.beginPath();
      ctx.moveTo(pagodaX - floorWidth / 2 - 15, floorY + 15);
      ctx.lineTo(pagodaX, floorY - 10);
      ctx.lineTo(pagodaX + floorWidth / 2 + 15, floorY + 15);
      ctx.fill();
      
      // Floor
      ctx.fillStyle = '#F4D03F';
      ctx.fillRect(pagodaX - floorWidth / 2, floorY + 15, floorWidth, 20);
      
      // Windows
      ctx.fillStyle = '#5DADE2';
      ctx.fillRect(pagodaX - 8, floorY + 18, 16, 14);
    }

    // Draw grass hills
    ctx.fillStyle = '#7DCE82';
    ctx.beginPath();
    ctx.ellipse(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80, 250, 80, 0, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#5EBA62';
    ctx.beginPath();
    ctx.ellipse(80, CANVAS_HEIGHT - 50, 120, 60, 0, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#69C96D';
    ctx.beginPath();
    ctx.ellipse(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 40, 130, 50, 0, Math.PI, 0);
    ctx.fill();

    // Draw water waves
    const waveOffset = (Date.now() / 500) % (Math.PI * 2);
    ctx.fillStyle = '#48C9B0';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
      const y = CANVAS_HEIGHT - 40 + Math.sin(x * 0.05 + waveOffset) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fill();

    ctx.fillStyle = '#3DB8A0';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
      const y = CANVAS_HEIGHT - 25 + Math.sin(x * 0.06 + waveOffset + 1) * 6;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fill();

    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const drawCloud = (cx: number, cy: number, size: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.8, cy - size * 0.2, size * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + size * 1.5, cy, size * 0.8, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.7, cy + size * 0.3, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCloud(100, 150, 25);
    drawCloud(280, 100, 20);

    // Draw walls (dark purple with red outline)
    walls.forEach(wall => {
      const wallX = wall.side === 'left' ? 0 : CANVAS_WIDTH - WALL_WIDTH;
      
      // Wall sections
      ctx.fillStyle = '#2C2C54';
      
      // Top section (above gap)
      ctx.fillRect(wallX, wall.y, WALL_WIDTH, wall.gapStart);
      
      // Bottom section (below gap)
      ctx.fillRect(wallX, wall.y + wall.gapStart + GAP_HEIGHT, WALL_WIDTH, CANVAS_HEIGHT - wall.gapStart - GAP_HEIGHT);

      // Red border on inner edge
      ctx.strokeStyle = '#E74C3C';
      ctx.lineWidth = 3;
      
      const innerX = wall.side === 'left' ? WALL_WIDTH : CANVAS_WIDTH - WALL_WIDTH;
      
      // Top section border
      ctx.beginPath();
      ctx.moveTo(innerX, wall.y);
      ctx.lineTo(innerX, wall.y + wall.gapStart);
      ctx.stroke();
      
      // Gap top border
      ctx.beginPath();
      ctx.moveTo(wallX, wall.y + wall.gapStart);
      ctx.lineTo(innerX, wall.y + wall.gapStart);
      ctx.stroke();
      
      // Gap bottom border
      ctx.beginPath();
      ctx.moveTo(wallX, wall.y + wall.gapStart + GAP_HEIGHT);
      ctx.lineTo(innerX, wall.y + wall.gapStart + GAP_HEIGHT);
      ctx.stroke();
      
      // Bottom section border
      ctx.beginPath();
      ctx.moveTo(innerX, wall.y + wall.gapStart + GAP_HEIGHT);
      ctx.lineTo(innerX, wall.y + wall.gapStart + GAP_HEIGHT + CANVAS_HEIGHT);
      ctx.stroke();
    });

    // Draw coins
    coins.forEach(coin => {
      if (!coin.collected) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Shine
        ctx.fillStyle = '#FFEC8B';
        ctx.beginPath();
        ctx.arc(coin.x - 3, coin.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw ninja
    ctx.save();
    ctx.translate(ninja.x, ninja.y);
    
    // Body
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.ellipse(0, 0, NINJA_SIZE / 2, NINJA_SIZE / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.arc(0, -NINJA_SIZE / 2.5, NINJA_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Red headband
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(-NINJA_SIZE / 2.5, -NINJA_SIZE / 2.5 - 3, NINJA_SIZE / 1.2, 6);
    
    // Headband tail
    ctx.beginPath();
    ctx.moveTo(ninja.movingRight ? -NINJA_SIZE / 2.5 : NINJA_SIZE / 2.5, -NINJA_SIZE / 2.5);
    const tailDir = ninja.movingRight ? -1 : 1;
    ctx.quadraticCurveTo(
      tailDir * NINJA_SIZE / 1.5, -NINJA_SIZE / 2,
      tailDir * NINJA_SIZE / 1.2, -NINJA_SIZE / 3
    );
    ctx.lineTo(tailDir * NINJA_SIZE / 1.2, -NINJA_SIZE / 2.2);
    ctx.quadraticCurveTo(
      tailDir * NINJA_SIZE / 1.5, -NINJA_SIZE / 1.8,
      ninja.movingRight ? -NINJA_SIZE / 2.5 : NINJA_SIZE / 2.5, -NINJA_SIZE / 2.5 + 6
    );
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#FFF';
    const eyeX = ninja.movingRight ? 3 : -3;
    ctx.fillRect(eyeX - 4, -NINJA_SIZE / 2.5 - 2, 8, 4);
    
    ctx.restore();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && screenRef.current === 'playing') {
        e.preventDefault();
        handleTap();
      }
      if (e.code === 'Escape' && screenRef.current === 'playing') {
        setScreen('paused');
      }
    };

    const handleClick = () => {
      if (screenRef.current === 'playing') {
        handleTap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvasRef.current?.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvasRef.current?.removeEventListener('click', handleClick);
    };
  }, [handleTap]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameLoop]);

  const handleToggleSound = () => {
    const newProgress = toggleSound();
    setProgress(newProgress);
    ninjaAudioManager.menuClick();
  };

  return (
    <GameLayout
      gameId="ninja-jump"
      title="Ninja Jump"
      score={score}
      highScore={highScore}
      isMuted={!progress.soundEnabled}
      onToggleMute={handleToggleSound}
      showAudioControl
    >
      <Helmet>
        <title>Ninja Jump - Wall Bounce Action Game</title>
        <meta name="description" content="Bounce between walls, collect coins, and climb as high as you can!" />
      </Helmet>

      <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg cursor-pointer"
        />

        {/* Score display */}
        {screen === 'playing' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 px-6 py-2 rounded-lg border-2 border-slate-600">
            <span className="text-2xl font-bold text-white font-mono">{score}</span>
          </div>
        )}

        {/* Sound button */}
        {screen === 'playing' && (
          <button
            onClick={handleToggleSound}
            className="absolute top-4 left-4 p-3 bg-red-500/90 rounded-full hover:bg-red-600 transition-colors"
          >
            {progress.soundEnabled ? (
              <Volume2 className="h-5 w-5 text-white" />
            ) : (
              <VolumeX className="h-5 w-5 text-white" />
            )}
          </button>
        )}

        {/* Pause button */}
        {screen === 'playing' && (
          <button
            onClick={() => setScreen('paused')}
            className="absolute top-4 right-4 p-3 bg-red-500/90 rounded-full hover:bg-red-600 transition-colors"
          >
            <Pause className="h-5 w-5 text-white" />
          </button>
        )}

        {/* Menu Screen */}
        {screen === 'menu' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900/95 to-slate-800/95 rounded-lg">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 mb-2">
              忍者ジャンプ
            </h1>
            <h2 className="text-2xl font-bold text-white mb-8">NINJA JUMP</h2>
            
            <button
              onClick={initGame}
              className="px-10 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-xl rounded-xl hover:scale-105 transition-transform shadow-lg"
            >
              <Play className="inline mr-2 h-6 w-6" /> START GAME
            </button>

            {highScore > 0 && (
              <p className="mt-6 text-yellow-400 text-lg">Best: {highScore}</p>
            )}

            <div className="absolute bottom-8 text-center text-white/70 text-sm px-4">
              <p>Tap or Press Space to change direction</p>
              <p>Navigate through the gaps!</p>
            </div>
          </div>
        )}

        {/* Paused Screen */}
        {screen === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="text-3xl font-bold text-white mb-8">PAUSED</h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setScreen('playing')}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                <Play className="inline mr-2 h-5 w-5" /> RESUME
              </button>
              <button
                onClick={initGame}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                <RotateCcw className="inline mr-2 h-5 w-5" /> RESTART
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                <Home className="inline mr-2 h-5 w-5" /> QUIT
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {screen === 'gameOver' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-lg">
            <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
            <p className="text-3xl text-white mb-2">Score: {score}</p>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-lg mb-4">🎉 New High Score!</p>
            )}
            <p className="text-muted-foreground mb-8">Best: {highScore}</p>
            
            <div className="flex gap-4">
              <button
                onClick={initGame}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                TRY AGAIN
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="px-8 py-3 bg-slate-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                MENU
              </button>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default NinjaJumpGame;
