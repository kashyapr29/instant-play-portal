import GameCard from './GameCard';

interface Game {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  featured?: boolean;
  isPlayable?: boolean;
}

interface GameGridProps {
  games: Game[];
  title?: string;
}

const GameGrid = ({ games, title }: GameGridProps) => {
  return (
    <section className="py-8">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {games.map((game, index) => (
          <div
            key={game.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <GameCard
              id={game.id}
              title={game.title}
              thumbnail={game.thumbnail}
              category={game.category}
              featured={game.featured}
              isPlayable={game.isPlayable}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default GameGrid;
