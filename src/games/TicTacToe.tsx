import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { RotateCcw } from 'lucide-react';
import { useHighScore } from '@/hooks/useHighScore';
import { useGameAudio } from '@/hooks/useGameAudio';
import GameLayout from '@/components/GameLayout';

type Player = 'X' | 'O' | null;
type Board = Player[];

const TicTacToe = () => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const { highScore: totalWins, updateHighScore } = useHighScore('tic-tac-toe');
  const { playSound, isMuted, toggleMute } = useGameAudio();

  const calculateWinner = (squares: Board): { winner: Player; line: number[] } | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    return null;
  };

  const result = calculateWinner(board);
  const winner = result?.winner;
  const winningLine = result?.line || [];
  const isDraw = !winner && board.every(square => square !== null);

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    playSound('click');
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const newResult = calculateWinner(newBoard);
    if (newResult?.winner) {
      playSound('win');
      setScores(prev => {
        const newScores = {
          ...prev,
          [newResult.winner!]: prev[newResult.winner!] + 1,
        };
        if (newResult.winner === 'X') {
          updateHighScore(newScores.X);
        }
        return newScores;
      });
    } else if (newBoard.every(square => square !== null)) {
      playSound('fail');
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
    }
  };

  useEffect(() => {
    const savedScores = localStorage.getItem('tictactoe_scores');
    if (savedScores) {
      setScores(JSON.parse(savedScores));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tictactoe_scores', JSON.stringify(scores));
  }, [scores]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    playSound('click');
  };

  const resetScores = () => {
    resetGame();
    setScores({ X: 0, O: 0, draws: 0 });
    localStorage.removeItem('tictactoe_scores');
  };

  const getStatus = () => {
    if (winner) return `Winner: ${winner}`;
    if (isDraw) return "It's a Draw!";
    return `Next Player: ${isXNext ? 'X' : 'O'}`;
  };

  return (
    <>
      <Helmet>
        <title>Tic Tac Toe - Play Free | 5 Minutes Games</title>
        <meta name="description" content="Play classic Tic Tac Toe for free. Challenge a friend in this timeless strategy game!" />
      </Helmet>

      <GameLayout
        gameId="tic-tac-toe"
        title="Tic Tac Toe"
        highScore={totalWins}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        showAudioControl
      >
        <div className="flex flex-col items-center justify-center p-6 min-h-[400px]">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-4">Tic Tac Toe</h1>
            
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">X</p>
                <p className="text-muted-foreground">{scores.X} wins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">—</p>
                <p className="text-muted-foreground">{scores.draws} draws</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">O</p>
                <p className="text-muted-foreground">{scores.O} wins</p>
              </div>
            </div>

            <p className={`text-xl font-semibold ${winner ? 'text-primary' : 'text-muted-foreground'}`}>
              {getStatus()}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {board.map((square, index) => (
              <button
                key={index}
                onClick={() => handleClick(index)}
                disabled={!!square || !!winner}
                className={`
                  w-20 h-20 sm:w-24 sm:h-24 rounded-xl text-4xl font-bold
                  transition-all duration-200
                  ${winningLine.includes(index) 
                    ? 'bg-primary/30 border-2 border-primary' 
                    : 'bg-card border-2 border-border hover:border-primary/50'
                  }
                  ${!square && !winner ? 'hover:bg-card/80 cursor-pointer' : ''}
                  ${square === 'X' ? 'text-primary' : 'text-accent'}
                `}
              >
                {square}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              New Game
            </button>
            <button
              onClick={resetScores}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              Reset Scores
            </button>
          </div>
        </div>
      </GameLayout>
    </>
  );
};

export default TicTacToe;
