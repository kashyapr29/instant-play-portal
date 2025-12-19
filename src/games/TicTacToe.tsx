import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';

type Player = 'X' | 'O' | null;
type Board = Player[];

const TicTacToe = () => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const calculateWinner = (squares: Board): { winner: Player; line: number[] } | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6], // diagonals
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

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const newResult = calculateWinner(newBoard);
    if (newResult?.winner) {
      setScores(prev => ({
        ...prev,
        [newResult.winner!]: prev[newResult.winner!] + 1,
      }));
    } else if (newBoard.every(square => square !== null)) {
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const resetScores = () => {
    resetGame();
    setScores({ X: 0, O: 0, draws: 0 });
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

      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Games</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-4">Tic Tac Toe</h1>
            
            {/* Scoreboard */}
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

          {/* Game Board */}
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
        </main>
      </div>
    </>
  );
};

export default TicTacToe;
