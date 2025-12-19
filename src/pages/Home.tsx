import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import FeaturedGame from '@/components/FeaturedGame';
import GameGrid from '@/components/GameGrid';
import gamesData from '@/data/games.json';
import { Gamepad2, Zap, Clock, Trophy } from 'lucide-react';

const Home = () => {
  const featuredGame = gamesData.find((game) => game.featured);
  const allGames = gamesData;

  return (
    <>
      <Helmet>
        <title>5 Minutes Games - Play Free Online Games Instantly</title>
        <meta name="description" content="Play hundreds of free online games instantly. No downloads, no registration. Arcade, puzzle, action, racing games and more!" />
      </Helmet>

      <Layout>
        {/* Hero Section */}
        <section className="relative py-12 md:py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
                <span className="gradient-text">Play Free Games</span>
                <br />
                <span className="text-foreground">In Your Browser</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
                Jump into hundreds of free online games. No downloads, no registration required. Just click and play!
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Gamepad2 className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">100+ Games</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Instant Play</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">5 Min Sessions</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Free Forever</p>
                </div>
              </div>
            </div>

            {/* Featured Game */}
            {featuredGame && (
              <FeaturedGame
                id={featuredGame.id}
                title={featuredGame.title}
                thumbnail={featuredGame.thumbnail}
                category={featuredGame.category}
                description={featuredGame.description}
              />
            )}

            {/* All Games Grid */}
            <GameGrid games={allGames} title="All Games" />
          </div>

          {/* Background decorations */}
          <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          </div>
        </section>
      </Layout>
    </>
  );
};

export default Home;
