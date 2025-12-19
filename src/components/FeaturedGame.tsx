import { Link } from 'react-router-dom';
import { Play, Star, Sparkles } from 'lucide-react';

interface FeaturedGameProps {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  description?: string;
}

const FeaturedGame = ({ id, title, thumbnail, category, description }: FeaturedGameProps) => {
  return (
    <section className="relative py-8">
      <div className="relative overflow-hidden rounded-2xl bg-card">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image side */}
          <div className="relative aspect-video md:aspect-auto overflow-hidden">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card md:block hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent md:hidden" />
          </div>

          {/* Content side */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="featured-badge flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>Featured Game</span>
              </div>
              <span className="bg-secondary px-3 py-1 rounded-full text-xs font-medium">
                {category}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
              {title}
            </h2>

            {description && (
              <p className="text-muted-foreground mb-6 text-lg">
                {description}
              </p>
            )}

            <Link
              to={`/play/${id}`}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-105 w-fit group"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Play Now</span>
              <Sparkles className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
      </div>
    </section>
  );
};

export default FeaturedGame;
