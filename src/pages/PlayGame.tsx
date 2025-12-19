import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useRef } from 'react';
import gamesData from '@/data/games.json';

const PlayGame = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const game = gamesData.find((g) => g.id === gameId);

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
        <header className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="hidden sm:inline">Back to Games</span>
                </Link>
                <div className="h-6 w-px bg-border" />
                <div>
                  <h1 className="font-bold text-lg">{game.title}</h1>
                  <p className="text-xs text-muted-foreground">{game.category}</p>
                </div>
              </div>

              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Exit Fullscreen</span>
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

        {/* Game Container */}
        <div className="container mx-auto px-4 py-6">
          <div
            ref={iframeContainerRef}
            className="relative w-full bg-card rounded-xl overflow-hidden border border-border"
            style={{ aspectRatio: '16/9' }}
          >
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
            <h2 className="text-xl font-bold mb-2">{game.title}</h2>
            <p className="text-muted-foreground">{game.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <span className="bg-secondary px-3 py-1 rounded-full text-sm">
                {game.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlayGame;
