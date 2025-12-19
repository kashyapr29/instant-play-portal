import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';

const CARD_EMOJIS = ['🎮', '🎲', '🎯', '🏆', '⭐', '🚀', '💎', '🔥'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryGame = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [gameComplete, setGameComplete] = useState(false);

  const initializeGame = () => {
    const shuffledCards: Card[] = [...CARD_EMOJIS, ...CARD_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameComplete(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (matches === CARD_EMOJIS.length) {
      setGameComplete(true);
      if (!bestScore || moves < bestScore) {
        setBestScore(moves);
      }
    }
  }, [matches, moves, bestScore]);

  const handleCardClick = (cardId: number) => {
    if (isChecking) return;
    if (flippedCards.length === 2) return;
    if (cards[cardId].isMatched) return;
    if (flippedCards.includes(cardId)) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards(prev =>
      prev.map(card =>
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    );

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);

      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards[firstId];
      const secondCard = cards[secondId];

      if (firstCard.emoji === secondCard.emoji) {
        setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              card.id === firstId || card.id === secondId
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatches(prev => prev + 1);
          setFlippedCards([]);
          setIsChecking(false);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              card.id === firstId || card.id === secondId
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Memory Match - Play Free | 5 Minutes Games</title>
        <meta name="description" content="Test your memory with this fun card matching game. Find all pairs in the fewest moves!" />
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
                {bestScore && (
                  <div className="flex items-center gap-2 text-primary">
                    <Trophy className="h-5 w-5" />
                    <span className="font-bold">{bestScore} moves</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-2">Memory Match</h1>
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <p>Moves: <span className="text-primary font-bold">{moves}</span></p>
              <p>Matches: <span className="text-primary font-bold">{matches}/{CARD_EMOJIS.length}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || card.isFlipped}
                className={`
                  w-16 h-16 sm:w-20 sm:h-20 rounded-xl text-3xl font-bold
                  transition-all duration-300 transform
                  ${card.isFlipped || card.isMatched
                    ? 'bg-primary/20 rotate-0'
                    : 'bg-card border-2 border-border hover:border-primary hover:scale-105 rotate-180'
                  }
                  ${card.isMatched ? 'opacity-50' : ''}
                `}
                style={{ perspective: '1000px' }}
              >
                <span className={`transition-opacity duration-200 ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}`}>
                  {card.emoji}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={initializeGame}
            className="mt-8 flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            New Game
          </button>

          {gameComplete && (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm z-50">
              <div className="bg-card p-8 rounded-2xl border border-border text-center max-w-sm mx-4">
                <h2 className="text-3xl font-bold gradient-text mb-4">🎉 You Won!</h2>
                <p className="text-muted-foreground mb-2">Completed in {moves} moves</p>
                {bestScore === moves && <p className="text-primary font-bold mb-4">New Best Score!</p>}
                <button
                  onClick={initializeGame}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors mx-auto"
                >
                  <RotateCcw className="h-5 w-5" />
                  Play Again
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default MemoryGame;
