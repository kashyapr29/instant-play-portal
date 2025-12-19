import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const SnakeGame = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number>();
  const directionRef = useRef<Direction>('RIGHT');

  const generateFood = useCallback((): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setGameStarted(true);
  }, []);

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

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setHighScore(prev => Math.max(prev, score));
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setHighScore(prev => Math.max(prev, score));
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, gameOver, isPaused, gameStarted, score, generateFood]);

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      gameLoopRef.current = window.setInterval(moveSnake, INITIAL_SPEED);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, gameStarted, gameOver, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted) {
        setGameStarted(true);
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
    if (!gameStarted) {
      setGameStarted(true);
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

      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Games</span>
              </Link>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="h-5 w-5" />
                  <span className="font-bold">{highScore}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold gradient-text mb-2">Snake Game</h1>
            <p className="text-muted-foreground">Score: <span className="text-primary font-bold">{score}</span></p>
          </div>

          <div 
            className="relative bg-card rounded-xl border-2 border-border overflow-hidden"
            style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
          >
            {/* Grid background */}
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: GRID_SIZE }).map((_, y) => (
                <div key={y} className="flex">
                  {Array.from({ length: GRID_SIZE }).map((_, x) => (
                    <div key={x} className="border border-border" style={{ width: CELL_SIZE, height: CELL_SIZE }} />
                  ))}
                </div>
              ))}
            </div>

            {/* Snake */}
            {snake.map((segment, index) => (
              <div
                key={index}
                className={`absolute rounded-sm transition-all duration-75 ${index === 0 ? 'bg-primary' : 'bg-primary/70'}`}
                style={{
                  left: segment.x * CELL_SIZE,
                  top: segment.y * CELL_SIZE,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                  margin: 1,
                }}
              />
            ))}

            {/* Food */}
            <div
              className="absolute bg-accent rounded-full animate-pulse"
              style={{
                left: food.x * CELL_SIZE + 2,
                top: food.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
              }}
            />

            {/* Game Over / Start overlay */}
            {(gameOver || !gameStarted) && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-4">{gameOver ? 'Game Over!' : 'Snake Game'}</h2>
                {gameOver && <p className="text-muted-foreground mb-4">Final Score: {score}</p>}
                <button
                  onClick={resetGame}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  <RotateCcw className="h-5 w-5" />
                  {gameOver ? 'Play Again' : 'Start Game'}
                </button>
                <p className="text-muted-foreground text-sm mt-4">Use Arrow Keys or WASD to move</p>
              </div>
            )}

            {/* Pause overlay */}
            {isPaused && !gameOver && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                <h2 className="text-2xl font-bold">Paused</h2>
              </div>
            )}
          </div>

          {/* Touch controls for mobile */}
          <div className="mt-6 grid grid-cols-3 gap-2 md:hidden">
            <div />
            <button onClick={() => handleTouchControl('UP')} className="p-4 bg-card rounded-lg border border-border active:bg-primary/20">↑</button>
            <div />
            <button onClick={() => handleTouchControl('LEFT')} className="p-4 bg-card rounded-lg border border-border active:bg-primary/20">←</button>
            <button onClick={() => handleTouchControl('DOWN')} className="p-4 bg-card rounded-lg border border-border active:bg-primary/20">↓</button>
            <button onClick={() => handleTouchControl('RIGHT')} className="p-4 bg-card rounded-lg border border-border active:bg-primary/20">→</button>
          </div>

          <p className="text-muted-foreground text-sm mt-4">Press Space to pause</p>
        </main>
      </div>
    </>
  );
};

export default SnakeGame;
