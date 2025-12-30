import { useState, useEffect } from 'react';
import GameLayout from '@/components/GameLayout';
import { createBoard, revealCell, toggleFlag, Cell, GameState, DIFFICULTY_SETTINGS, Difficulty, BOARD_SIZE, MINE_COUNT } from './logic.ts';
import { Button } from '@/components/ui/button';
import { Flag, Bomb, RefreshCw, Smile, Frown, PartyPopper, Zap } from 'lucide-react';
import { useGameAudio } from '@/hooks/useGameAudio';
import { toast } from 'sonner';

// Cell Component with 3D Effect
const MinesweeperCell = ({ 
  cell, 
  onClick, 
  onRightClick,
  isGameOver 
}: { 
  cell: Cell; 
  onClick: () => void; 
  onRightClick: (e: React.MouseEvent) => void;
  isGameOver: boolean;
}) => {
  const getFlagContent = () => {
    return <Flag className="w-4 h-4 text-red-500 drop-shadow-lg" />;
  };

  const getBombContent = () => {
    return <Bomb className="w-5 h-5 text-yellow-400 drop-shadow-lg animate-pulse" />;
  };

  const getNumberContent = () => {
    const colors = [
      '',
      'text-blue-600 font-bold',
      'text-green-600 font-bold',
      'text-red-600 font-bold',
      'text-purple-700 font-bold',
      'text-red-700 font-bold',
      'text-teal-600 font-bold',
      'text-black font-bold',
      'text-gray-700 font-bold'
    ];
    return (
      <span className={`text-xl ${colors[cell.neighborMines]}`}>
        {cell.neighborMines}
      </span>
    );
  };

  const baseStyle = {
    perspective: '1000px',
    transformStyle: 'preserve-3d' as const,
  };

  if (!cell.isRevealed) {
    return (
      <div
        onClick={onClick}
        onContextMenu={onRightClick}
        style={baseStyle}
        className="w-full h-full cursor-pointer group"
      >
        <div className="w-full h-full relative transform transition-all duration-200 group-hover:scale-95 group-active:scale-90">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 rounded-sm border-2 border-slate-400 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.3)]" />
          <div className="absolute inset-1 bg-gradient-to-br from-slate-300 to-slate-500 rounded-sm opacity-60" />
        </div>
      </div>
    );
  }

  // Revealed cell
  if (cell.isMine) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800 rounded-sm border border-red-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)]">
        {getBombContent()}
      </div>
    );
  }

  // Safe cell
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 rounded-sm border border-gray-500/50 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),inset_-1px_-1px_2px_rgba(0,0,0,0.1)]">
      {cell.isFlagged && getFlagContent()}
      {!cell.isFlagged && cell.neighborMines > 0 && getNumberContent()}
    </div>
  );
};

const MinesweeperGame = () => {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [timer, setTimer] = useState(0);
  const [flagsUsed, setFlagsUsed] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stats, setStats] = useState({ wins: 0, bestTime: Infinity });
  const [revealedCount, setRevealedCount] = useState(0);
  const { playSound, isMuted, toggleMute } = useGameAudio();

  const settings = DIFFICULTY_SETTINGS[difficulty];
  const totalNonMines = settings.boardSize * settings.boardSize - settings.mineCount;

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const startNewGame = () => {
    setBoard(createBoard(settings.boardSize, settings.mineCount));
    setGameState('idle');
    setTimer(0);
    setFlagsUsed(0);
    setRevealedCount(0);
  };

  const handleCellClick = (x: number, y: number) => {
    if (gameState === 'won' || gameState === 'lost') return;
    if (board[y]?.[x]?.isFlagged) return;

    let currentBoard = board;
    let currentGameState = gameState;

    if (gameState === 'idle') {
      currentBoard = createBoard(settings.boardSize, settings.mineCount, x, y);
      setBoard(currentBoard);
      setGameState('playing');
      currentGameState = 'playing';
      playSound('move');
    }

    const result = revealCell(currentBoard, x, y);
    setBoard(result.board);

    // Count revealed non-mine cells
    let revealed = 0;
    result.board.forEach(row => row.forEach(cell => {
      if (cell.isRevealed && !cell.isMine) revealed++;
    }));
    setRevealedCount(revealed);

    if (result.gameOver) {
      setGameState('lost');
      playSound('gameover');
      setTimeout(() => {
        toast.error('💣 Boom! You hit a mine!', { duration: 3000 });
      }, 100);
    } else if (result.win) {
      setGameState('won');
      playSound('win');
      const newBestTime = timer < stats.bestTime ? timer : stats.bestTime;
      setStats({ 
        wins: stats.wins + 1, 
        bestTime: newBestTime 
      });
      setTimeout(() => {
        toast.success('🎉 Victory! Minefield cleared!', { duration: 3000 });
      }, 100);
    } else {
      playSound('move');
    }
  };

  const handleRightClick = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (gameState === 'won' || gameState === 'lost') return;
    if (gameState === 'idle') return;

    const newBoard = toggleFlag(board, x, y);
    setBoard(newBoard);
    
    let flags = 0;
    newBoard.forEach(row => row.forEach(cell => { if (cell.isFlagged) flags++; }));
    setFlagsUsed(flags);
    playSound('move');
  };

  const getGameIcon = () => {
    if (gameState === 'idle' || gameState === 'playing') return <Smile className="w-6 h-6 text-green-500" />;
    if (gameState === 'lost') return <Frown className="w-6 h-6 text-red-500" />;
    return <PartyPopper className="w-6 h-6 text-yellow-500" />;
  };

  const boardSize = settings.boardSize;
  const cellSize = boardSize <= 8 ? 45 : boardSize <= 10 ? 38 : 32;
  const boardDimension = boardSize * cellSize + (boardSize - 1) * 2;

  return (
    <GameLayout
      gameId="minesweeper"
      title="Minesweeper"
      score={timer}
      highScore={stats.bestTime === Infinity ? 0 : stats.bestTime}
      isMuted={isMuted}
      onToggleMute={toggleMute}
      showAudioControl
    >
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto gap-8 px-4">
        
        {/* Difficulty Selector */}
        {gameState === 'idle' && (
          <div className="w-full flex gap-3 justify-center">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <Button
                key={d}
                onClick={() => setDifficulty(d)}
                variant={difficulty === d ? 'default' : 'outline'}
                className={`capitalize font-bold transition-all ${
                  difficulty === d 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50' 
                    : 'hover:bg-slate-700'
                }`}
              >
                {d}
              </Button>
            ))}
          </div>
        )}

        {/* Header Stats */}
        <div className="w-full grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-xl p-4 shadow-lg text-center">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Mines</span>
            <span className="text-3xl font-mono text-red-400 font-bold block mt-1">
              {Math.max(0, settings.mineCount - flagsUsed)}
            </span>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-xl p-4 shadow-lg flex flex-col items-center justify-center">
            <Button 
              onClick={startNewGame} 
              variant="ghost"
              size="icon" 
              className="w-14 h-14 rounded-full border-2 border-slate-600 hover:bg-slate-700/50 transition-all active:scale-95"
            >
              {getGameIcon()}
            </Button>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-2">New Game</span>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-xl p-4 shadow-lg text-center">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Time</span>
            <span className="text-3xl font-mono text-cyan-400 font-bold block mt-1">{timer.toString().padStart(3, '0')}</span>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-gradient-to-br from-slate-900 to-black border-4 border-slate-700 rounded-xl p-3 shadow-2xl">
          <div 
            className="bg-gradient-to-br from-slate-800 to-slate-900 gap-[2px] inline-grid rounded-lg p-2 border border-slate-700/50"
            style={{ 
              gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
              width: `${boardDimension + 16}px`,
              height: `${boardDimension + 16}px`
            }}
          >
            {board.map((row, y) => (
              row.map((cell, x) => (
                <div key={`${x}-${y}`} style={{ width: `${cellSize}px`, height: `${cellSize}px` }}>
                  <MinesweeperCell
                    cell={cell}
                    onClick={() => handleCellClick(x, y)}
                    onRightClick={(e) => handleRightClick(e, x, y)}
                    isGameOver={gameState === 'lost'}
                  />
                </div>
              ))
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        {gameState === 'playing' && (
          <div className="w-full max-w-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400 font-bold">Progress</span>
              <span className="text-xs text-slate-300 font-mono">{revealedCount}/{totalNonMines}</span>
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600/50">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-500/50"
                style={{ width: `${(revealedCount / totalNonMines) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Game Over Message */}
        {(gameState === 'won' || gameState === 'lost') && (
          <div className={`w-full p-6 rounded-xl border-2 text-center ${
            gameState === 'won' 
              ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-600/50' 
              : 'bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-600/50'
          }`}>
            <h2 className={`text-3xl font-bold ${gameState === 'won' ? 'text-green-400' : 'text-red-400'}`}>
              {gameState === 'won' ? '🎉 Victory!' : '💣 Game Over!'}
            </h2>
            <p className={`text-sm mt-2 ${gameState === 'won' ? 'text-green-300' : 'text-red-300'}`}>
              {gameState === 'won' 
                ? `Cleared in ${timer} seconds on ${difficulty} difficulty!`
                : `You hit a mine! Try again.`
              }
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="w-full grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">Games Won</p>
            <p className="text-2xl font-mono font-bold text-green-400 mt-1">{stats.wins}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">Best Time</p>
            <p className="text-2xl font-mono font-bold text-yellow-400 mt-1">
              {stats.bestTime === Infinity ? '--' : stats.bestTime}s
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full bg-slate-900/50 border border-slate-700/30 rounded-lg p-4 text-center text-sm text-slate-300">
          <p className="flex items-center justify-center gap-2 mb-2">
            <span>🖱️ Left Click to Reveal</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <span>🚩 Right Click to Flag</span>
          </p>
        </div>

      </div>
    </GameLayout>
  );
};

export default MinesweeperGame;
