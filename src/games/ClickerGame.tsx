import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, Star, Sparkles } from 'lucide-react';

interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  effect: number;
  type: 'click' | 'auto';
  owned: number;
  icon: React.ReactNode;
}

const ClickerGame = () => {
  const [points, setPoints] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoClickPower, setAutoClickPower] = useState(0);
  const [clickAnimations, setClickAnimations] = useState<{ id: number; x: number; y: number }[]>([]);

  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: 'power1', name: 'Better Clicks', description: '+1 per click', baseCost: 10, costMultiplier: 1.5, effect: 1, type: 'click', owned: 0, icon: <Zap className="h-5 w-5" /> },
    { id: 'power2', name: 'Super Clicks', description: '+5 per click', baseCost: 100, costMultiplier: 1.8, effect: 5, type: 'click', owned: 0, icon: <Star className="h-5 w-5" /> },
    { id: 'auto1', name: 'Auto Clicker', description: '+1 per second', baseCost: 50, costMultiplier: 1.6, effect: 1, type: 'auto', owned: 0, icon: <Sparkles className="h-5 w-5" /> },
    { id: 'auto2', name: 'Super Auto', description: '+5 per second', baseCost: 500, costMultiplier: 2, effect: 5, type: 'auto', owned: 0, icon: <Sparkles className="h-5 w-5" /> },
  ]);

  const getUpgradeCost = (upgrade: Upgrade) => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    setPoints(prev => prev + clickPower);
    setTotalClicks(prev => prev + 1);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setClickAnimations(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setClickAnimations(prev => prev.filter(anim => anim.id !== id));
    }, 1000);
  }, [clickPower]);

  const buyUpgrade = (upgradeId: string) => {
    setUpgrades(prev => {
      const upgrade = prev.find(u => u.id === upgradeId);
      if (!upgrade) return prev;

      const cost = getUpgradeCost(upgrade);
      if (points < cost) return prev;

      setPoints(p => p - cost);

      if (upgrade.type === 'click') {
        setClickPower(cp => cp + upgrade.effect);
      } else {
        setAutoClickPower(ap => ap + upgrade.effect);
      }

      return prev.map(u =>
        u.id === upgradeId ? { ...u, owned: u.owned + 1 } : u
      );
    });
  };

  useEffect(() => {
    if (autoClickPower > 0) {
      const interval = setInterval(() => {
        setPoints(prev => prev + autoClickPower);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoClickPower]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
  };

  return (
    <>
      <Helmet>
        <title>Click Quest - Play Free | 5 Minutes Games</title>
        <meta name="description" content="Click your way to victory in this addictive idle clicker game. Buy upgrades and watch your points grow!" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Games</span>
              </Link>
              <div className="text-muted-foreground text-sm">
                Total Clicks: {formatNumber(totalClicks)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row gap-6 p-4 container mx-auto max-w-4xl">
          {/* Click Area */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold gradient-text mb-2">Click Quest</h1>
              <p className="text-4xl font-bold text-primary">{formatNumber(points)}</p>
              <p className="text-muted-foreground text-sm">points</p>
            </div>

            <div className="relative">
              <button
                onClick={handleClick}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-primary/50 text-primary-foreground font-bold text-xl
                  hover:scale-110 active:scale-95 transition-transform duration-150
                  shadow-lg hover:shadow-primary/50 animate-pulse-glow"
              >
                CLICK!
              </button>

              {clickAnimations.map(anim => (
                <div
                  key={anim.id}
                  className="absolute pointer-events-none text-primary font-bold text-xl animate-fade-in"
                  style={{
                    left: anim.x,
                    top: anim.y,
                    animation: 'float-up 1s ease-out forwards',
                  }}
                >
                  +{clickPower}
                </div>
              ))}
            </div>

            <div className="mt-6 text-center text-muted-foreground">
              <p>Click Power: <span className="text-primary font-bold">{clickPower}</span>/click</p>
              <p>Auto: <span className="text-primary font-bold">{autoClickPower}</span>/second</p>
            </div>
          </div>

          {/* Upgrades */}
          <div className="md:w-80 bg-card rounded-xl border border-border p-4">
            <h2 className="text-xl font-bold mb-4">Upgrades</h2>
            <div className="space-y-3">
              {upgrades.map(upgrade => {
                const cost = getUpgradeCost(upgrade);
                const canAfford = points >= cost;

                return (
                  <button
                    key={upgrade.id}
                    onClick={() => buyUpgrade(upgrade.id)}
                    disabled={!canAfford}
                    className={`
                      w-full p-4 rounded-lg border text-left transition-all
                      ${canAfford
                        ? 'bg-secondary/50 border-primary/30 hover:border-primary hover:bg-secondary'
                        : 'bg-muted/20 border-border opacity-50 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${upgrade.type === 'click' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
                        {upgrade.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{upgrade.name}</span>
                          <span className="text-xs bg-secondary px-2 py-1 rounded">x{upgrade.owned}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{upgrade.description}</p>
                        <p className={`text-sm font-bold ${canAfford ? 'text-primary' : 'text-muted-foreground'}`}>
                          Cost: {formatNumber(cost)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        <style>{`
          @keyframes float-up {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-50px); }
          }
        `}</style>
      </div>
    </>
  );
};

export default ClickerGame;
