import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { RotateCcw } from 'lucide-react';
import { useHighScore } from '@/hooks/useHighScore';
import { useGameAudio } from '@/hooks/useGameAudio';
import GameLayout from '@/components/GameLayout';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const GAME_SPEED = 120; // Constant speed for all difficulties

const OBSTACLE_COUNT = {
  easy: 0,
  medium: 2,
  hard: 5,
};

type Difficulty = 'easy' | 'medium' | 'hard';
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const SnakeGame = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [bonusFood, setBonusFood] = useState<Position | null>(null);
  const [applesEaten, setApplesEaten] = useState(0);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number>();
  const directionRef = useRef<Direction>('RIGHT');

  const { highScore, updateHighScore } = useHighScore('snake-game');
  const { playSound, isMuted, toggleMute } = useGameAudio();

  const generateFood = useCallback((currentObstacles: Position[] = []): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      currentObstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y)
    );
    return newFood;
  }, [snake]);

  const generateObstacles = useCallback((selectedDifficulty: Difficulty): Position[] => {
    const obstacleCount = OBSTACLE_COUNT[selectedDifficulty];
    const generatedObstacles: Position[] = [];
    
    for (let i = 0; i < obstacleCount; i++) {
      let obstaclePositions: Position[] = [];
      let isValidPlacement = false;
      
      while (!isValidPlacement) {
        obstaclePositions = [];
        const startX = Math.floor(Math.random() * GRID_SIZE);
        const startY = Math.floor(Math.random() * GRID_SIZE);
        const direction = Math.floor(Math.random() * 4); // 0: up, 1: down, 2: left, 3: right
        const length = Math.floor(Math.random() * 2) + 2; // 2-3 pixels length
        
        // Generate line based on direction
        for (let j = 0; j < length; j++) {
          let x = startX;
          let y = startY;
          
          switch (direction) {
            case 0: // UP
              y = startY - j;
              break;
            case 1: // DOWN
              y = startY + j;
              break;
            case 2: // LEFT
              x = startX - j;
              break;
            case 3: // RIGHT
              x = startX + j;
              break;
          }
          
          // Check bounds
          if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            obstaclePositions.push({ x, y });
          }
        }
        
        // Validate placement
        isValidPlacement = 
          obstaclePositions.length > 0 &&
          obstaclePositions.every(pos =>
            !snake.some(segment => segment.x === pos.x && segment.y === pos.y) &&
            !generatedObstacles.some(obs => obs.x === pos.x && obs.y === pos.y) &&
            !(pos.x === food.x && pos.y === food.y)
          );
      }
      
      generatedObstacles.push(...obstaclePositions);
    }
    return generatedObstacles;
  }, [snake, food]);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setBonusFood(null);
    setApplesEaten(0);
    setObstacles([]);
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setGameStarted(true);
    playSound('click');
  }, [playSound]);

  const startGame = useCallback((selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    const generatedObstacles = generateObstacles(selectedDifficulty);
    setObstacles(generatedObstacles);
    setGameStarted(true);
    playSound('click');
  }, [playSound, generateObstacles]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      const currentDirection = directionRef.current;

      switch (currentDirection) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        updateHighScore(score);
        playSound('gameOver');
        return prevSnake;
      }

      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        updateHighScore(score);
        playSound('gameOver');
        return prevSnake;
      }

      // Check if head hits obstacle
      if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
        setGameOver(true);
        updateHighScore(score);
        playSound('gameOver');
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check if head hits regular apple
      if (head.x === food.x && head.y === food.y) {
        const newAppleCount = applesEaten + 1;
        setApplesEaten(newAppleCount);
        setScore(prev => {
          const newScore = prev + 10;
          updateHighScore(newScore);
          return newScore;
        });
        
        // Spawn bonus food after eating 5 apples
        if (newAppleCount % 5 === 0) {
          let bonusPos: Position;
          do {
            bonusPos = {
              x: Math.floor(Math.random() * GRID_SIZE),
              y: Math.floor(Math.random() * GRID_SIZE),
            };
          } while (
            newSnake.some(segment => segment.x === bonusPos.x && segment.y === bonusPos.y) ||
            (bonusPos.x === food.x && bonusPos.y === food.y)
          );
          setBonusFood(bonusPos);
        }
        
        setFood(generateFood(obstacles));
        playSound('success');
        return newSnake;
      }

      // Check if head hits bonus food
      if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
        setScore(prev => {
          const newScore = prev + 50;
          updateHighScore(newScore);
          return newScore;
        });
        setBonusFood(null);
        setApplesEaten(0);
        playSound('success');
        // Add 5 segments to snake
        return [
          head,
          ...newSnake,
          ...Array(4).fill(null).map((_, i) => newSnake[newSnake.length - 1 - i])
        ];
      }

      newSnake.pop();
      return newSnake;
    });
  }, [food, bonusFood, applesEaten, obstacles, gameOver, isPaused, gameStarted, score, generateFood, updateHighScore, playSound]);

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused && difficulty) {
      gameLoopRef.current = window.setInterval(moveSnake, GAME_SPEED);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, gameStarted, gameOver, isPaused, difficulty]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current !== 'DOWN') {
            directionRef.current = 'UP';
            setDirection('UP');
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current !== 'UP') {
            directionRef.current = 'DOWN';
            setDirection('DOWN');
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current !== 'RIGHT') {
            directionRef.current = 'LEFT';
            setDirection('LEFT');
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current !== 'LEFT') {
            directionRef.current = 'RIGHT';
            setDirection('RIGHT');
          }
          break;
        case ' ':
          if (!gameOver) setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  const handleTouchControl = (newDirection: Direction) => {
    if (!gameStarted || !difficulty) {
      return;
    }
    
    if (
      (newDirection === 'UP' && directionRef.current !== 'DOWN') ||
      (newDirection === 'DOWN' && directionRef.current !== 'UP') ||
      (newDirection === 'LEFT' && directionRef.current !== 'RIGHT') ||
      (newDirection === 'RIGHT' && directionRef.current !== 'LEFT')
    ) {
      directionRef.current = newDirection;
      setDirection(newDirection);
    }
  };

  return (
    <>
      <Helmet>
        <title>Snake Game - Play Free | 5 Minutes Games</title>
        <meta name="description" content="Play the classic Snake game for free. Eat food, grow longer, and try to beat your high score!" />
      </Helmet>

      <style>{`
        @keyframes snakeHeadGlow {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.8)); }
          50% { filter: drop-shadow(0 0 20px rgba(34, 197, 94, 1)); }
        }
        @keyframes snakeTailPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes foodPulse {
          0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.8)); }
          50% { transform: scale(1.1) rotate(5deg); filter: drop-shadow(0 0 16px rgba(220, 38, 38, 1)); }
        }
        @keyframes bonusFloat {
          0%, 100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)); }
          50% { transform: translateY(-4px) scale(1.15); filter: drop-shadow(0 0 20px rgba(251, 191, 36, 1)); }
        }
        .snake-head {
          animation: snakeHeadGlow 1.5s ease-in-out infinite;
        }
        .snake-segment {
          animation: snakeTailPulse 2s ease-in-out infinite;
        }
        .apple-item {
          animation: foodPulse 0.8s ease-in-out infinite;
        }
        .bonus-item {
          animation: bonusFloat 0.6s ease-in-out infinite;
        }
        .game-board {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
          box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(34, 197, 94, 0.15);
        }
      `}</style>

      <GameLayout
        gameId="snake-game"
        title="Snake Classic"
        score={score}
        highScore={highScore}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        showAudioControl
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background via-background to-primary/5">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black gradient-text mb-3 drop-shadow-lg">
              🐍 Snake Classic
            </h1>
            <div className="flex justify-center gap-8 text-lg flex-wrap">
              <div className="px-6 py-2 rounded-full bg-primary/10 border border-primary/30">
                <span className="text-muted-foreground">Score: </span>
                <span className="text-primary font-bold text-xl">{score}</span>
              </div>
              <div className="px-6 py-2 rounded-full bg-accent/10 border border-accent/30">
                <span className="text-muted-foreground">Best: </span>
                <span className="text-accent font-bold text-xl">{highScore}</span>
              </div>
              <div className="px-6 py-2 rounded-full bg-orange-500/10 border border-orange-500/30">
                <span className="text-muted-foreground">🍎 </span>
                <span className="text-orange-500 font-bold text-xl">{applesEaten} / 5</span>
              </div>                {difficulty && (
                  <div className="px-6 py-2 rounded-full bg-purple-500/10 border border-purple-500/30">
                    <span className="text-muted-foreground">Difficulty: </span>
                    <span className="text-purple-500 font-bold text-xl capitalize">{difficulty}</span>
                  </div>
                )}            </div>
          </div>

          <div 
            className="game-board relative rounded-2xl overflow-hidden border-4 border-primary/50 shadow-2xl"
            style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
          >
            {/* Difficulty Selection Screen */}
            {!difficulty && !gameStarted && (
              <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center backdrop-blur-sm rounded-2xl z-10">
                <h2 className="text-3xl font-black mb-8 text-center">Select Difficulty</h2>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => startGame('easy')}
                    className="px-8 py-4 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-green-500/50 transition-all hover:scale-105 active:scale-95"
                  >
                    🟢 Easy (No Obstacles)
                  </button>
                  <button
                    onClick={() => startGame('medium')}
                    className="px-8 py-4 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all hover:scale-105 active:scale-95"
                  >
                    🟡 Medium (2 Obstacles)
                  </button>
                  <button
                    onClick={() => startGame('hard')}
                    className="px-8 py-4 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-red-500/50 transition-all hover:scale-105 active:scale-95"
                  >
                    🔴 Hard (5 Obstacles)
                  </button>
                </div>
                <p className="text-muted-foreground text-sm mt-8 text-center">Choose your difficulty level. Avoid obstacles or Game Over!</p>
              </div>
            )}
            
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: GRID_SIZE }).map((_, y) => (
                <div key={y} className="flex">
                  {Array.from({ length: GRID_SIZE }).map((_, x) => (
                    <div 
                      key={x} 
                      className="border border-primary/20" 
                      style={{ width: CELL_SIZE, height: CELL_SIZE }} 
                    />
                  ))}
                </div>
              ))}
            </div>

            {snake.map((segment, index) => {
              const segmentRatio = index / snake.length;
              const isHead = index === 0;
              
              return (
                <div
                  key={index}
                  className={`absolute transition-all duration-75 ${isHead ? 'snake-head' : 'snake-segment'}`}
                  style={{
                    left: segment.x * CELL_SIZE + 1,
                    top: segment.y * CELL_SIZE + 1,
                    width: CELL_SIZE - 2,
                    height: CELL_SIZE - 2,
                  }}
                >
                  {isHead ? (
                    // Realistic snake head with eyes
                    <svg viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
                      <defs>
                        <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="50%" stopColor="#16a34a" />
                          <stop offset="100%" stopColor="#15803d" />
                        </linearGradient>
                        <radialGradient id="eyeShine" cx="30%" cy="30%">
                          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
                          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                        </radialGradient>
                      </defs>
                      {/* Head body */}
                      <rect x="1" y="1" width="18" height="18" rx="3" ry="3" fill="url(#headGradient)" />
                      {/* Head shine */}
                      <rect x="2" y="2" width="6" height="6" rx="2" fill="rgba(255, 255, 255, 0.3)" />
                      {/* Left eye */}
                      <circle cx="6" cy="7" r="2.5" fill="#000" />
                      <circle cx="6" cy="7" r="1.5" fill="url(#eyeShine)" />
                      {/* Right eye */}
                      <circle cx="14" cy="7" r="2.5" fill="#000" />
                      <circle cx="14" cy="7" r="1.5" fill="url(#eyeShine)" />
                      {/* Tongue */}
                      <path d="M 10 13 Q 9 15 10 16 Q 11 15 10 13" fill="#ef4444" opacity="0.7" />
                    </svg>
                  ) : (
                    // Snake body segments with gradient
                    <svg viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
                      <defs>
                        <linearGradient id={`bodyGradient${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={`rgba(34, 197, 94, ${0.9 - segmentRatio * 0.5})`} />
                          <stop offset="50%" stopColor={`rgba(22, 163, 74, ${0.8 - segmentRatio * 0.5})`} />
                          <stop offset="100%" stopColor={`rgba(21, 128, 61, ${0.7 - segmentRatio * 0.5})`} />
                        </linearGradient>
                      </defs>
                      {/* Body segment */}
                      <rect x="1" y="1" width="18" height="18" rx="2" ry="2" fill={`url(#bodyGradient${index})`} />
                      {/* Segment edge for definition */}
                      <rect x="1" y="1" width="18" height="18" rx="2" ry="2" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />
                    </svg>
                  )}
                </div>
              );
            })}

            {/* Regular Apple */}
            <div
              className="apple-item absolute"
              style={{
                left: food.x * CELL_SIZE + 2,
                top: food.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
              }}
            >
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                {/* Apple body */}
                <defs>
                  <radialGradient id="appleGradient" cx="35%" cy="35%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="70%" stopColor="#991b1b" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="55" r="42" fill="url(#appleGradient)" />
                {/* Apple shine */}
                <ellipse cx="35" cy="35" rx="12" ry="15" fill="rgba(255, 255, 255, 0.4)" />
                {/* Stem */}
                <rect x="47" y="10" width="6" height="18" fill="#92400e" rx="2" />
                {/* Leaf */}
                <ellipse cx="60" cy="18" rx="8" ry="6" fill="#22c55e" transform="rotate(-25 60 18)" />
              </svg>
            </div>

            {/* Obstacles */}
            {obstacles.map((obstacle, index) => (
              <div
                key={`obstacle-${index}`}
                className="absolute"
                style={{
                  left: obstacle.x * CELL_SIZE + 1,
                  top: obstacle.y * CELL_SIZE + 1,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                }}
              >
                <svg viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id={`obstacleGradient${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  {/* Obstacle block */}
                  <rect x="2" y="2" width="16" height="16" rx="2" fill={`url(#obstacleGradient${index})`} />
                  {/* Warning cross pattern */}
                  <line x1="5" y1="5" x2="15" y2="15" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" />
                  <line x1="15" y1="5" x2="5" y2="15" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" />
                </svg>
              </div>
            ))}

            {/* Bonus Golden Apple */}
            {bonusFood && (
              <div
                className="bonus-item absolute"
                style={{
                  left: bonusFood.x * CELL_SIZE,
                  top: bonusFood.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 100 100" style={{ width: '85%', height: '85%' }}>
                  <defs>
                    <radialGradient id="goldGradient" cx="35%" cy="35%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="70%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </radialGradient>
                  </defs>
                  {/* Golden Apple */}
                  <circle cx="50" cy="55" r="45" fill="url(#goldGradient)" />
                  {/* Golden shine */}
                  <ellipse cx="32" cy="32" rx="14" ry="18" fill="rgba(255, 255, 255, 0.5)" />
                  {/* Stem */}
                  <rect x="47" y="8" width="6" height="20" fill="#92400e" rx="2" />
                  {/* Leaf */}
                  <ellipse cx="62" cy="16" rx="9" ry="7" fill="#22c55e" transform="rotate(-25 62 16)" />
                  {/* Crown shine */}
                  <circle cx="50" cy="25" r="4" fill="rgba(255, 255, 255, 0.7)" />
                </svg>
              </div>
            )}

            {(gameOver || !gameStarted) && (
              <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center backdrop-blur-sm rounded-2xl">
                <h2 className="text-4xl font-black mb-6">
                  {gameOver ? '💀 Game Over!' : '🎮 Ready to Play?'}
                </h2>
                {gameOver && (
                  <div className="text-center mb-6">
                    <p className="text-muted-foreground mb-2">Final Score</p>
                    <p className="text-5xl font-black gradient-text">{score}</p>
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setDifficulty(null);
                      setGameStarted(false);
                      setGameOver(false);
                      setScore(0);
                      setApplesEaten(0);
                      setBonusFood(null);
                      setObstacles([]);
                      setSnake([{ x: 10, y: 10 }]);
                      setFood({ x: 15, y: 15 });
                      setDirection('RIGHT');
                      directionRef.current = 'RIGHT';
                      setIsPaused(false);
                      playSound('click');
                    }}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-primary-foreground font-bold text-lg hover:shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 active:scale-95"
                  >
                    <RotateCcw className="h-6 w-6" />
                    {gameOver ? 'Play Again' : 'Start Game'}
                  </button>
                  
                </div>
                <div className="mt-6 text-center">
                  <p className="text-muted-foreground text-sm mb-2">⌨️ Use Arrow Keys or WASD</p>
                  <p className="text-muted-foreground text-sm">📱 Or tap buttons below on mobile</p>
                </div>
              </div>
            )}

            {isPaused && !gameOver && (
              <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center backdrop-blur-sm rounded-2xl">
                <h2 className="text-4xl font-black mb-4">⏸️ Paused</h2>
                <p className="text-muted-foreground">Press Space to resume</p>
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 md:hidden">
            <div />
            <button 
              onClick={() => handleTouchControl('UP')} 
              disabled={!difficulty}
              className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border-2 border-primary/40 active:bg-primary/40 active:shadow-lg active:shadow-primary/50 transition-all font-bold text-xl hover:border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↑
            </button>
            <div />
            <button 
              onClick={() => handleTouchControl('LEFT')} 
              disabled={!difficulty}
              className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border-2 border-primary/40 active:bg-primary/40 active:shadow-lg active:shadow-primary/50 transition-all font-bold text-xl hover:border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <button 
              onClick={() => handleTouchControl('DOWN')} 
              disabled={!difficulty}
              className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border-2 border-primary/40 active:bg-primary/40 active:shadow-lg active:shadow-primary/50 transition-all font-bold text-xl hover:border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↓
            </button>
            <button 
              onClick={() => handleTouchControl('RIGHT')} 
              disabled={!difficulty}
              className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border-2 border-primary/40 active:bg-primary/40 active:shadow-lg active:shadow-primary/50 transition-all font-bold text-xl hover:border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>

          <p className="text-muted-foreground text-sm mt-6">Press Space to pause • More fun incoming! 🚀</p>
        </div>
      </GameLayout>
    </>
  );
};

export default SnakeGame;
