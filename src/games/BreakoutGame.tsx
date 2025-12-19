import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 320;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 10;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 55;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 4;

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Brick {
  x: number;
  y: number;
  visible: boolean;
  color: string;
}

const COLORS = ['#4fd1c5', '#38b2ac', '#319795', '#2c7a7a', '#285e61'];

const BreakoutGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paddleX, setPaddleX] = useState(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [ball, setBall] = useState<Ball>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, dx: 4, dy: -4 });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const ballRef = useRef(ball);
  const paddleRef = useRef(paddleX);
  const bricksRef = useRef(bricks);
  const gameOverRef = useRef(gameOver);

  useEffect(() => { ballRef.current = ball; }, [ball]);
  useEffect(() => { paddleRef.current = paddleX; }, [paddleX]);
  useEffect(() => { bricksRef.current = bricks; }, [bricks]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  const initBricks = useCallback(() => {
    const newBricks: Brick[] = [];
    const startX = (CANVAS_WIDTH - (BRICK_COLS * (BRICK_WIDTH + BRICK_GAP))) / 2;
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: startX + col * (BRICK_WIDTH + BRICK_GAP),
          y: 40 + row * (BRICK_HEIGHT + BRICK_GAP),
          visible: true,
          color: COLORS[row % COLORS.length],
        });
      }
    }
    return newBricks;
  }, []);

  const resetGame = useCallback(() => {
    setBall({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, dx: 4, dy: -4 });
    setPaddleX(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
    setBricks(initBricks());
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setGameStarted(true);
  }, [initBricks]);

  useEffect(() => {
    setBricks(initBricks());
  }, [initBricks]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setPaddleX(Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      setPaddleX(Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2)));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver || gameWon) return;

    const gameLoop = setInterval(() => {
      setBall(prevBall => {
        let newX = prevBall.x + prevBall.dx;
        let newY = prevBall.y + prevBall.dy;
        let newDx = prevBall.dx;
        let newDy = prevBall.dy;

        // Wall collisions
        if (newX <= BALL_SIZE / 2 || newX >= CANVAS_WIDTH - BALL_SIZE / 2) {
          newDx = -newDx;
          newX = Math.max(BALL_SIZE / 2, Math.min(CANVAS_WIDTH - BALL_SIZE / 2, newX));
        }
        if (newY <= BALL_SIZE / 2) {
          newDy = -newDy;
          newY = BALL_SIZE / 2;
        }

        // Paddle collision
        const paddle = paddleRef.current;
        if (
          newY >= CANVAS_HEIGHT - PADDLE_HEIGHT - BALL_SIZE / 2 - 10 &&
          newY <= CANVAS_HEIGHT - PADDLE_HEIGHT &&
          newX >= paddle &&
          newX <= paddle + PADDLE_WIDTH
        ) {
          newDy = -Math.abs(newDy);
          const hitPos = (newX - paddle) / PADDLE_WIDTH;
          newDx = (hitPos - 0.5) * 8;
        }

        // Ball falls below
        if (newY > CANVAS_HEIGHT) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
              setHighScore(hs => Math.max(hs, score));
            }
            return newLives;
          });
          return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, dx: 4, dy: -4 };
        }

        // Brick collisions
        setBricks(prevBricks => {
          let hitBrick = false;
          const newBricks = prevBricks.map(brick => {
            if (
              brick.visible &&
              newX >= brick.x &&
              newX <= brick.x + BRICK_WIDTH &&
              newY >= brick.y &&
              newY <= brick.y + BRICK_HEIGHT
            ) {
              hitBrick = true;
              setScore(s => s + 10);
              return { ...brick, visible: false };
            }
            return brick;
          });

          if (hitBrick) {
            newDy = -newDy;
          }

          // Check win
          if (newBricks.every(b => !b.visible)) {
            setGameWon(true);
            setHighScore(hs => Math.max(hs, score + 10));
          }

          return newBricks;
        });

        return { x: newX, y: newY, dx: newDx, dy: newDy };
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, gameWon, score]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bricks
    bricks.forEach(brick => {
      if (brick.visible) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
        ctx.strokeStyle = '#ffffff20';
        ctx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      }
    });

    // Draw paddle
    ctx.fillStyle = '#4fd1c5';
    ctx.fillRect(paddleX, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();
  }, [ball, paddleX, bricks]);

  return (
    <>
      <Helmet>
        <title>Breakout - Play Free | 5 Minutes Games</title>
        <meta name="description" content="Break all the bricks in this classic arcade game. Control the paddle and keep the ball in play!" />
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
            <h1 className="text-3xl font-bold gradient-text mb-2">Breakout</h1>
            <div className="flex items-center justify-center gap-6">
              <p className="text-muted-foreground">Score: <span className="text-primary font-bold">{score}</span></p>
              <p className="text-muted-foreground">Lives: <span className="text-accent font-bold">{lives}</span></p>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border-2 border-border">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="block"
            />

            {(!gameStarted || gameOver || gameWon) && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-4">
                  {gameWon ? '🎉 You Won!' : gameOver ? 'Game Over' : 'Breakout'}
                </h2>
                {(gameOver || gameWon) && <p className="text-muted-foreground mb-4">Score: {score}</p>}
                <button
                  onClick={resetGame}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  <RotateCcw className="h-5 w-5" />
                  {gameStarted ? 'Play Again' : 'Start Game'}
                </button>
                <p className="text-muted-foreground text-sm mt-4">Move mouse or touch to control paddle</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default BreakoutGame;
