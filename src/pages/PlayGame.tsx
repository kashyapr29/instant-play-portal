import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import gamesData from '@/data/games.json';

const PlayGame = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const game = gamesData.find((g) => g.id === gameId);
  const relatedGames = gamesData.filter(
    (g) => g.category === game?.category && g.id !== gameId
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!game) {
    return <Navigate to="/" replace />;
  }

  const toggleFullscreen = async () => {
    if (!iframeContainerRef.current) return;

    if (!document.fullscreenElement) {
      await iframeContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{game.title} - Play Free | 5 Minutes Games</title>
        <meta name="description" content={game.description || `Play ${game.title} for free online. No downloads required.`} />
      </Helmet>

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
                  <h1 className="font-bold text-lg">{game.title}</h1>
                  <p className="text-xs text-muted-foreground">{game.category}</p>
                </div>
              </div>

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
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Game Area */}
            <div className="flex-1">
              <div
                ref={iframeContainerRef}
                className={`relative w-full bg-card rounded-xl overflow-hidden border border-border ${
                  isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
                }`}
                style={isFullscreen ? {} : { aspectRatio: '16/9' }}
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
                <iframe
                  src={game.gameUrl}
                  title={game.title}
                  className="absolute inset-0 w-full h-full"
                  allow="fullscreen; autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>

              {/* Game Info */}
              <div className="mt-6 p-6 bg-card rounded-xl border border-border">
                <h2 className="text-xl font-bold mb-3">{game.title}</h2>
                <p className="text-muted-foreground mb-4">{game.description}</p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {game.category}
                  </span>
                  {game.featured && (
                    <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Related Games Sidebar */}
            {relatedGames.length > 0 && (
              <div className="lg:w-72 xl:w-80">
                <div className="bg-card rounded-xl border border-border p-4 sticky top-24">
                  <h3 className="font-bold text-lg mb-4">More {game.category} Games</h3>
                  <div className="space-y-3">
                    {relatedGames.slice(0, 5).map((relatedGame) => (
                      <Link
                        key={relatedGame.id}
                        to={relatedGame.isPlayable ? relatedGame.gameUrl : `/play/${relatedGame.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors group"
                      >
                        <img
                          src={relatedGame.thumbnail}
                          alt={relatedGame.title}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {relatedGame.title}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {relatedGame.description?.slice(0, 40)}...
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
    </>
  );
};

export default PlayGame;
