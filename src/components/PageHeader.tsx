interface PageHeaderProps {
  title: string;
  description?: string;
}

const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <div className="relative py-12 md:py-16 overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 gradient-text animate-fade-in">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
            {description}
          </p>
        )}
      </div>
      
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default PageHeader;
