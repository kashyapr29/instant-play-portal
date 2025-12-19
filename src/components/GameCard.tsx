import { Link } from 'react-router-dom';
import { Play, Star, Sparkles } from 'lucide-react';

interface GameCardProps {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  featured?: boolean;
  isPlayable?: boolean;
}

const GameCard = ({ id, title, thumbnail, category, featured, isPlayable }: GameCardProps) => {
  // Determine if this is an internal playable game or external iframe
  const isInternalGame = isPlayable === true;
  const linkTo = isInternalGame ? `/game/${id.replace('-game', '').replace('-match', '').replace('-quest', '')}` : `/play/${id}`;

  return (
    <Link
      to={linkTo}
      className="game-card group block"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
        {/* Thumbnail with lazy loading */}
        <img
          src={thumbnail}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop`;
          }}
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        
        {/* Featured badge */}
        {featured && (
          <div className="absolute top-3 left-3 featured-badge flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>Featured</span>
          </div>
        )}

        {/* Playable badge */}
        {isPlayable && (
          <div className="absolute top-3 left-3 bg-primary px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 text-primary-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Playable</span>
          </div>
        )}
        
        {/* Category badge */}
        <div className="absolute top-3 right-3 bg-secondary/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
          {category}
        </div>
        
        {/* Play button overlay */}
        <div className="play-button">
          <div className="p-4 rounded-full bg-primary text-primary-foreground transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="h-8 w-8 fill-current" />
          </div>
        </div>
      </div>
      
      {/* Card content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {title}
        </h3>
      </div>
    </Link>
  );
};

export default GameCard;
