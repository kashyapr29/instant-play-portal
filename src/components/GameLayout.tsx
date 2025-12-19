import { useState, useRef, useEffect, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Trophy, Volume2, VolumeX } from 'lucide-react';
import gamesData from '@/data/games.json';

interface GameLayoutProps {
  gameId: string;
  title: string;
  children: ReactNode;
  score?: number;
  highScore?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  showAudioControl?: boolean;
}

const GameLayout = ({
  gameId,
  title,
  children,
  score,
  highScore,
  isMuted,
  onToggleMute,
  showAudioControl = false,
}: GameLayoutProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const currentGame = gamesData.find((g) => g.id === gameId);
  const relatedGames = gamesData.filter(
    (g) => g.category === currentGame?.category && g.id !== gameId
  );

  const toggleFullscreen = async () => {
    if (!gameContainerRef.current) return;

    if (!document.fullscreenElement) {
      await gameContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Games</span>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg">{title}</h1>
                <p className="text-xs text-muted-foreground">{currentGame?.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {showAudioControl && onToggleMute && (
                <button
                  onClick={onToggleMute}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              )}
              {highScore !== undefined && highScore > 0 && (
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="h-5 w-5" />
                  <span className="font-bold">{highScore}</span>
                </div>
              )}
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Exit</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Game Area */}
          <div className="flex-1">
            <div
              ref={gameContainerRef}
              className={`relative bg-card rounded-xl border border-border overflow-hidden ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none flex items-center justify-center bg-background' : ''
              }`}
            >
              {isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/80 hover:bg-secondary transition-colors"
                >
                  <Minimize2 className="h-4 w-4" />
                  <span>Exit Fullscreen</span>
                </button>
              )}
              <div className={isFullscreen ? 'w-full h-full flex items-center justify-center' : ''}>
                {children}
              </div>
            </div>

            {/* Game Description */}
            <div className="mt-6 p-6 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-bold mb-3">{title}</h2>
              <p className="text-muted-foreground mb-4">{currentGame?.description}</p>
              <div className="flex flex-wrap gap-3">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {currentGame?.category}
                </span>
                {currentGame?.featured && (
                  <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </span>
                )}
                {currentGame?.isPlayable && (
                  <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm font-medium">
                    Playable Online
                  </span>
                )}
              </div>
              
              {/* Game Stats */}
              {(score !== undefined || highScore !== undefined) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="font-semibold mb-2">Your Stats</h3>
                  <div className="flex gap-6">
                    {score !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Current Score</p>
                        <p className="text-xl font-bold text-primary">{score}</p>
                      </div>
                    )}
                    {highScore !== undefined && highScore > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">High Score</p>
                        <p className="text-xl font-bold text-accent">{highScore}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Games Sidebar */}
          {relatedGames.length > 0 && (
            <div className="lg:w-72 xl:w-80">
              <div className="bg-card rounded-xl border border-border p-4 sticky top-24">
                <h3 className="font-bold text-lg mb-4">More {currentGame?.category} Games</h3>
                <div className="space-y-3">
                  {relatedGames.slice(0, 5).map((game) => (
                    <Link
                      key={game.id}
                      to={game.isPlayable ? game.gameUrl : `/play/${game.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors group"
                    >
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {game.title}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {game.description?.slice(0, 40)}...
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLayout;
