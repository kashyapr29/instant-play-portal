// Fruit Ninja Renderer - Uses original game assets

import {
  Fruit,
  SliceTrail,
  Particle,
  SlicedFruitHalf,
  JuiceSplash,
  FruitType,
} from './types';

// Asset paths
const ASSET_BASE = '/src/games/fruit-ninja/assets/game_assets';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private shakeAmount = 0;
  private shakeDecay = 0.9;

  // Loaded images
  private images: Map<string, HTMLImageElement> = new Map();
  private imagesLoaded = false;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.loadImages();
  }

  private loadImages() {
    const imageList = [
      // Fruits
      'apple', 'apple-1', 'apple-2',
      'banana', 'banana-1', 'banana-2',
      'peach', 'peach-1', 'peach-2',
      'strawberry', 'strawberry-1', 'strawberry-2',
      'watermelon', 'watermelon-1', 'watermelon-2',
      'boom',
      // UI
      'background',
      'home-mask',
      'fruit',
      'ninja',
      'new-game',
      'fruitMode',
      'game-over',
      'score',
      // Lives
      'x1', 'x2', 'x3',
      'xx1', 'xx2', 'xx3',
    ];

    let loadedCount = 0;
    imageList.forEach(name => {
      const img = new Image();
      const ext = name === 'background' ? '.jpg' : '.png';
      img.src = `${ASSET_BASE}/${name}${ext}`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === imageList.length) {
          this.imagesLoaded = true;
        }
      };
      this.images.set(name, img);
    });
  }

  private getImage(name: string): HTMLImageElement | null {
    return this.images.get(name) || null;
  }

  shake(amount: number) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  update() {
    this.shakeAmount *= this.shakeDecay;
    if (this.shakeAmount < 0.1) this.shakeAmount = 0;
  }

  clear() {
    const ctx = this.ctx;
    ctx.save();

    if (this.shakeAmount > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeAmount * 2;
      const shakeY = (Math.random() - 0.5) * this.shakeAmount * 2;
      ctx.translate(shakeX, shakeY);
    }

    // Draw original background
    const bg = this.getImage('background');
    if (bg && bg.complete) {
      ctx.drawImage(bg, 0, 0, this.width, this.height);
    } else {
      // Fallback gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f0f23');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }

  drawFruit(fruit: Fruit) {
    const ctx = this.ctx;
    const { x, y, size, type, rotation } = fruit;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const img = this.getImage(type);
    if (img && img.complete) {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
      // Fallback circle
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = type === 'bomb' ? '#2c3e50' : '#e74c3c';
      ctx.fill();
    }

    ctx.restore();
  }

  drawSlicedHalf(half: SlicedFruitHalf) {
    const ctx = this.ctx;
    const { x, y, rotation, type, isLeft, life } = half;
    const size = 50;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = life;

    const imgName = `${type}-${isLeft ? '1' : '2'}`;
    const img = this.getImage(imgName);
    if (img && img.complete) {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
      // Fallback half circle
      ctx.beginPath();
      if (isLeft) {
        ctx.arc(0, 0, size / 2, Math.PI / 2, -Math.PI / 2);
      } else {
        ctx.arc(0, 0, size / 2, -Math.PI / 2, Math.PI / 2);
      }
      ctx.closePath();
      ctx.fillStyle = '#e74c3c';
      ctx.fill();
    }

    ctx.restore();
  }

  drawSliceTrail(trail: SliceTrail[]) {
    const ctx = this.ctx;
    if (trail.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < trail.length; i++) {
      const prev = trail[i - 1];
      const curr = trail[i];
      const alpha = 1 - curr.age / 20;
      const width = (1 - i / trail.length) * 15 + 3;

      if (alpha <= 0) continue;

      // White blade glow (like original game sword)
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = width;
      ctx.stroke();

      // Inner bright line
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.strokeStyle = `rgba(230, 245, 255, ${alpha * 0.9})`;
      ctx.lineWidth = width * 0.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawParticle(particle: Particle) {
    const ctx = this.ctx;
    const alpha = particle.life / particle.maxLife;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawJuiceSplash(splash: JuiceSplash) {
    const ctx = this.ctx;
    const alpha = splash.life;

    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = splash.color;
    ctx.beginPath();
    ctx.arc(splash.x, splash.y, splash.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawScore(score: number, highScore: number) {
    const ctx = this.ctx;

    ctx.save();

    // Use original score image
    const scoreImg = this.getImage('score');
    if (scoreImg && scoreImg.complete) {
      ctx.drawImage(scoreImg, 10, 10, 40, 40);
    }

    // Score text (orange like original)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff9315';
    ctx.font = 'bold 50px Arial';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 5;
    ctx.fillText(score.toString(), 55, 50);

    // High score
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px Arial';
    ctx.fillText(`Best: ${highScore}`, 55, 70);

    ctx.restore();
  }

  drawLives(lives: number) {
    const ctx = this.ctx;

    ctx.save();

    // Draw X markers like original game
    const x1 = this.getImage('x1');
    const x2 = this.getImage('x2');
    const x3 = this.getImage('x3');
    const xx1 = this.getImage('xx1');
    const xx2 = this.getImage('xx2');
    const xx3 = this.getImage('xx3');

    const baseX = this.width - 110;
    const y = 20;

    // Draw base X markers
    if (x1 && x1.complete) ctx.drawImage(x1, baseX, y, 30, 30);
    if (x2 && x2.complete) ctx.drawImage(x2, baseX + 28, y, 30, 30);
    if (x3 && x3.complete) ctx.drawImage(x3, baseX + 56, y, 30, 30);

    // Draw lost lives (red X)
    if (lives <= 2 && xx1 && xx1.complete) {
      ctx.drawImage(xx1, baseX, y, 30, 30);
    }
    if (lives <= 1 && xx2 && xx2.complete) {
      ctx.drawImage(xx2, baseX + 28, y, 30, 30);
    }
    if (lives === 0 && xx3 && xx3.complete) {
      ctx.drawImage(xx3, baseX + 56, y, 30, 30);
    }

    ctx.restore();
  }

  drawCombo(combo: number, x: number, y: number, timer: number) {
    if (combo < 2) return;

    const ctx = this.ctx;
    const scale = 1 + (timer / 60) * 0.3;
    const alpha = Math.min(1, timer / 30);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Combo text
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.strokeText(`${combo}x COMBO!`, 0, 0);
    ctx.fillText(`${combo}x COMBO!`, 0, 0);

    // Bonus points
    const bonus = combo * 10;
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 20px Arial';
    ctx.shadowBlur = 5;
    ctx.fillText(`+${bonus}`, 0, 30);

    ctx.restore();
  }

  drawMenu(highScore: number, stats: { totalFruitsSliced: number; totalGamesPlayed: number; bestCombo: number }) {
    const ctx = this.ctx;

    ctx.save();

    // Draw home mask overlay
    const homeMask = this.getImage('home-mask');
    if (homeMask && homeMask.complete) {
      ctx.drawImage(homeMask, 0, 0, this.width, this.height * 0.55);
    }

    // Draw FRUIT logo
    const fruitLogo = this.getImage('fruit');
    if (fruitLogo && fruitLogo.complete) {
      ctx.drawImage(fruitLogo, this.width / 2 - 180, 20, 358, 195);
    }

    // Draw NINJA logo
    const ninjaLogo = this.getImage('ninja');
    if (ninjaLogo && ninjaLogo.complete) {
      ctx.drawImage(ninjaLogo, this.width / 2 - 160, 140, 318, 165);
    }

    // Draw new game button
    const newGameImg = this.getImage('new-game');
    if (newGameImg && newGameImg.complete) {
      ctx.drawImage(newGameImg, this.width / 2 - 100, 320, 200, 200);
    }

    // Draw fruit mode icon on button
    const fruitModeImg = this.getImage('fruitMode');
    if (fruitModeImg && fruitModeImg.complete) {
      ctx.drawImage(fruitModeImg, this.width / 2 - 45, 375, 90, 90);
    }

    // Stats panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    (ctx as any).roundRect?.(this.width / 2 - 150, 530, 300, 60, 15) || 
      ctx.rect(this.width / 2 - 150, 530, 300, 60);
    ctx.fill();

    ctx.fillStyle = '#ff9315';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 STATISTICS', this.width / 2, 550);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`High Score: ${highScore} | Fruits: ${stats.totalFruitsSliced} | Best Combo: ${stats.bestCombo}x`, this.width / 2, 575);

    ctx.restore();
  }

  drawGameOver(score: number, highScore: number, isNewHighScore: boolean) {
    const ctx = this.ctx;

    ctx.save();

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw game over image
    const gameOverImg = this.getImage('game-over');
    if (gameOverImg && gameOverImg.complete) {
      ctx.drawImage(gameOverImg, this.width / 2 - 245, 120, 490, 85);
    } else {
      // Fallback text
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 64px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.width / 2, 170);
    }

    // Score label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCORE', this.width / 2, 260);

    // Score value (orange like original)
    ctx.fillStyle = '#ff9315';
    ctx.font = 'bold 72px Arial';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillText(score.toString(), this.width / 2, 330);

    // New high score badge
    ctx.shadowBlur = 0;
    if (isNewHighScore) {
      ctx.fillStyle = '#27ae60';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('🎉 NEW HIGH SCORE! 🎉', this.width / 2, 380);
    } else {
      ctx.fillStyle = '#aaa';
      ctx.font = '20px Arial';
      ctx.fillText(`Best: ${highScore}`, this.width / 2, 380);
    }

    // Play again button
    ctx.fillStyle = '#27ae60';
    ctx.shadowColor = '#27ae60';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    (ctx as any).roundRect?.(this.width / 2 - 100, 430, 200, 55, 27) ||
      ctx.rect(this.width / 2 - 100, 430, 200, 55);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('PLAY AGAIN', this.width / 2, 465);

    // Menu button
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    (ctx as any).roundRect?.(this.width / 2 - 80, 510, 160, 45, 22) ||
      ctx.rect(this.width / 2 - 80, 510, 160, 45);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('MENU', this.width / 2, 540);

    ctx.restore();
  }

  drawPaused() {
    const ctx = this.ctx;

    ctx.save();

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Paused text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 60);

    // Resume button
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    (ctx as any).roundRect?.(this.width / 2 - 80, this.height / 2, 160, 50, 25) ||
      ctx.rect(this.width / 2 - 80, this.height / 2, 160, 50);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('RESUME', this.width / 2, this.height / 2 + 32);

    // Quit button
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    (ctx as any).roundRect?.(this.width / 2 - 80, this.height / 2 + 70, 160, 50, 25) ||
      ctx.rect(this.width / 2 - 80, this.height / 2 + 70, 160, 50);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.fillText('QUIT', this.width / 2, this.height / 2 + 102);

    ctx.restore();
  }
}
