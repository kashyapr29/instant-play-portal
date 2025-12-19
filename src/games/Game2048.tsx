import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { RotateCcw } from 'lucide-react';
import { useHighScore } from '@/hooks/useHighScore';
import { useGameAudio } from '@/hooks/useGameAudio';
import GameLayout from '@/components/GameLayout';

const GRID_SIZE = 4;
const WINNING_TILE = 2048;

type Board = (number | null)[][];

const Game2048 = () => {
  const [board, setBoard] = useState<Board>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  
  const { highScore, updateHighScore } = useHighScore('2048');
  const { playSound, isMuted, toggleMute } = useGameAudio();

  const createEmptyBoard = (): Board => {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  };

  const addRandomTile = useCallback((currentBoard: Board): Board => {
    const emptyCells: { row: number; col: number }[] = [];
    currentBoard.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === null) {
          emptyCells.push({ row: rowIndex, col: colIndex });
        }
      });
    });

    if (emptyCells.length === 0) return currentBoard;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }, []);

  const initializeGame = useCallback(() => {
    let newBoard = createEmptyBoard();
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setWon(false);
    playSound('click');
  }, [addRandomTile, playSound]);

  useEffect(() => {
    initializeGame();
  }, []);

  const slideRow = (row: (number | null)[]): { newRow: (number | null)[]; points: number; merged: boolean } => {
    const filtered = row.filter((cell): cell is number => cell !== null);
    let points = 0;
    let merged = false;
    
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        points += filtered[i];
        merged = true;
        if (filtered[i] === WINNING_TILE) setWon(true);
        filtered.splice(i + 1, 1);
      }
    }

    while (filtered.length < GRID_SIZE) {
      filtered.push(null);
    }

    return { newRow: filtered, points, merged };
  };

  const moveLeft = (currentBoard: Board): { newBoard: Board; points: number; moved: boolean; merged: boolean } => {
    let totalPoints = 0;
    let moved = false;
    let anyMerged = false;
    
    const newBoard = currentBoard.map(row => {
      const { newRow, points, merged } = slideRow([...row]);
      totalPoints += points;
      if (merged) anyMerged = true;
      if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true;
      return newRow;
    });

    return { newBoard, points: totalPoints, moved, merged: anyMerged };
  };

  const rotateBoard = (currentBoard: Board): Board => {
    return currentBoard[0].map((_, index) =>
      currentBoard.map(row => row[index]).reverse()
    );
  };

  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;

    let currentBoard = board.map(row => [...row]);
    let rotations = 0;

    switch (direction) {
      case 'right': rotations = 2; break;
      case 'up': rotations = 1; break;
      case 'down': rotations = 3; break;
    }

    for (let i = 0; i < rotations; i++) {
      currentBoard = rotateBoard(currentBoard);
    }

    const { newBoard: movedBoard, points, moved, merged } = moveLeft(currentBoard);

    let finalBoard = movedBoard;
    for (let i = 0; i < (4 - rotations) % 4; i++) {
      finalBoard = rotateBoard(finalBoard);
    }

    if (moved) {
      if (merged) {
        playSound('merge');
      } else {
        playSound('move');
      }
      
      finalBoard = addRandomTile(finalBoard);
      setBoard(finalBoard);
      const newScore = score + points;
      setScore(newScore);
      updateHighScore(newScore);

      const hasEmptyCell = finalBoard.some(row => row.some(cell => cell === null));
      if (!hasEmptyCell) {
        let canMove = false;
        for (let i = 0; i < GRID_SIZE; i++) {
          for (let j = 0; j < GRID_SIZE; j++) {
            const current = finalBoard[i][j];
            if (
              (j < GRID_SIZE - 1 && current === finalBoard[i][j + 1]) ||
              (i < GRID_SIZE - 1 && current === finalBoard[i + 1][j])
            ) {
              canMove = true;
              break;
            }
          }
          if (canMove) break;
        }
        if (!canMove) {
          setGameOver(true);
          playSound('gameOver');
          updateHighScore(newScore);
        }
      }
    }
  }, [board, gameOver, score, addRandomTile, playSound, updateHighScore]);

  useEffect(() => {
    if (won) {
      playSound('win');
      updateHighScore(score);
    }
  }, [won, playSound, score, updateHighScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          e.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
        case 'd':
          e.preventDefault();
          move('right');
          break;
        case 'ArrowUp':
        case 'w':
          e.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
        case 's':
          e.preventDefault();
          move('down');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const getTileColor = (value: number | null): string => {
    const colors: { [key: number]: string } = {
      2: 'bg-[#eee4da] text-[#776e65]',
      4: 'bg-[#ede0c8] text-[#776e65]',
      8: 'bg-[#f2b179] text-white',
      16: 'bg-[#f59563] text-white',
      32: 'bg-[#f67c5f] text-white',
      64: 'bg-[#f65e3b] text-white',
      128: 'bg-[#edcf72] text-white',
      256: 'bg-[#edcc61] text-white',
      512: 'bg-[#edc850] text-white',
      1024: 'bg-[#edc53f] text-white',
      2048: 'bg-[#edc22e] text-white',
    };
    return value ? (colors[value] || 'bg-[#3c3a32] text-white') : 'bg-muted/30';
  };

  return (
    <>
      <Helmet>
        <title>2048 - Play Free | 5 Minutes Games</title>
        <meta name="description" content="Combine tiles to reach 2048 in this addictive puzzle game!" />
      </Helmet>

      <GameLayout
        gameId="2048"
        title="2048"
        score={score}
        highScore={highScore}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        showAudioControl
      >
        <div className="flex flex-col items-center justify-center p-4 min-h-[450px]">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold gradient-text mb-2">2048</h1>
            <p className="text-xl text-muted-foreground">Score: <span className="text-primary font-bold">{score}</span></p>
          </div>

          <div className="relative bg-[#bbada0] p-3 rounded-lg">
            <div className="grid grid-cols-4 gap-2">
              {board.flat().map((cell, index) => (
                <div
                  key={index}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-md flex items-center justify-center font-bold text-xl sm:text-2xl transition-all ${getTileColor(cell)}`}
                >
                  {cell}
                </div>
              ))}
            </div>

            {(gameOver || won) && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-2">{won ? '🎉 You Won!' : 'Game Over'}</h2>
                <p className="text-muted-foreground mb-4">Score: {score}</p>
                <button
                  onClick={initializeGame}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  <RotateCcw className="h-5 w-5" />
                  Try Again
                </button>
              </div>
            )}
          </div>

          <button
            onClick={initializeGame}
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            New Game
          </button>

          <p className="text-muted-foreground text-sm mt-4">Use Arrow Keys or WASD to play</p>
        </div>
      </GameLayout>
    </>
  );
};

export default Game2048;
