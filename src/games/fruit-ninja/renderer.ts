// Fruit Ninja Renderer

import {
  Fruit,
  SliceTrail,
  Particle,
  SlicedFruitHalf,
  JuiceSplash,
  FRUIT_COLORS,
  FRUIT_INNER_COLORS,
  FruitType,
} from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private shakeAmount = 0;
  private shakeDecay = 0.9;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
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

    // Gradient background - traditional dojo style
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Wood texture lines
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < this.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(this.width, i + (Math.sin(i * 0.1) * 5));
      ctx.stroke();
    }

    ctx.restore();
  }

  drawFruit(fruit: Fruit) {
    const ctx = this.ctx;
    const { x, y, size, type, rotation } = fruit;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const color = FRUIT_COLORS[type];
    const innerColor = FRUIT_INNER_COLORS[type];

    if (type === 'bomb') {
      // Draw bomb
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#2c3e50';
      ctx.fill();

      // Bomb highlight
      ctx.beginPath();
      ctx.arc(-size / 6, -size / 6, size / 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();

      // Fuse
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.quadraticCurveTo(size / 4, -size / 2 - 10, size / 3, -size / 2 - 15);
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Spark
      ctx.beginPath();
      ctx.arc(size / 3, -size / 2 - 15, 4 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b35';
      ctx.fill();

      // Skull icon
      ctx.fillStyle = '#e74c3c';
      ctx.font = `${size / 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠', 0, 0);
    } else {
      // Outer glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;

      // Main fruit body
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(-size / 6, -size / 6, size / 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();

      // Leaf/stem for some fruits
      if (type === 'apple' || type === 'peach') {
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.quadraticCurveTo(5, -size / 2 - 8, 2, -size / 2 - 12);
        ctx.strokeStyle = '#2d5016';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Leaf
        ctx.beginPath();
        ctx.ellipse(8, -size / 2 - 5, 8, 5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = '#27ae60';
        ctx.fill();
      }

      // Banana curves
      if (type === 'banana') {
        ctx.beginPath();
        ctx.moveTo(-size / 2, 0);
        ctx.quadraticCurveTo(0, -size / 3, size / 2, 0);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Strawberry seeds
      if (type === 'strawberry') {
        ctx.fillStyle = '#f1c40f';
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const seedX = Math.cos(angle) * size / 4;
          const seedY = Math.sin(angle) * size / 4;
          ctx.beginPath();
          ctx.ellipse(seedX, seedY, 2, 3, angle, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Watermelon stripes
      if (type === 'watermelon') {
        ctx.strokeStyle = '#1e8449';
        ctx.lineWidth = 3;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 8, -size / 2);
          ctx.lineTo(i * 8, size / 2);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  drawSlicedHalf(half: SlicedFruitHalf) {
    const ctx = this.ctx;
    const { x, y, rotation, type, isLeft } = half;
    const size = 40;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const color = FRUIT_COLORS[type];
    const innerColor = FRUIT_INNER_COLORS[type];

    // Draw half circle
    ctx.beginPath();
    if (isLeft) {
      ctx.arc(0, 0, size / 2, Math.PI / 2, -Math.PI / 2);
    } else {
      ctx.arc(0, 0, size / 2, -Math.PI / 2, Math.PI / 2);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Inner flesh
    ctx.beginPath();
    if (isLeft) {
      ctx.arc(2, 0, size / 2.5, Math.PI / 2, -Math.PI / 2);
    } else {
      ctx.arc(-2, 0, size / 2.5, -Math.PI / 2, Math.PI / 2);
    }
    ctx.closePath();
    ctx.fillStyle = innerColor;
    ctx.fill();

    // Seeds for watermelon
    if (type === 'watermelon') {
      ctx.fillStyle = '#1a1a2e';
      for (let i = 0; i < 3; i++) {
        const seedY = (i - 1) * 8;
        ctx.beginPath();
        ctx.ellipse(isLeft ? 5 : -5, seedY, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
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
      const width = (1 - i / trail.length) * 12 + 2;

      if (alpha <= 0) continue;

      // Blade glow
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
      ctx.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.8})`;
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
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = splash.color;
    ctx.beginPath();
    ctx.arc(splash.x, splash.y, splash.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawScore(score: number, highScore: number) {
    const ctx = this.ctx;

    // Score panel
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.roundRect(15, 15, 150, 50, 10);
    ctx.fill();

    // Score icon (fruit)
    ctx.fillStyle = '#f39c12';
    ctx.font = '24px Arial';
    ctx.fillText('🍊', 25, 48);

    // Score text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(score.toString(), 60, 50);

    // High score
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.fillText(`Best: ${highScore}`, 25, 28);

    ctx.restore();
  }

  drawLives(lives: number) {
    const ctx = this.ctx;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.roundRect(this.width - 130, 15, 115, 40, 10);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      ctx.font = '24px Arial';
      ctx.fillStyle = i < lives ? '#e74c3c' : 'rgba(255, 255, 255, 0.2)';
      ctx.fillText('❌', this.width - 120 + i * 35, 44);
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
    ctx.strokeText(`${combo}x COMBO!`, 0, 0);
    ctx.fillText(`${combo}x COMBO!`, 0, 0);

    // Bonus points
    const bonus = combo * 10;
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`+${bonus}`, 0, 30);

    ctx.restore();
  }

  drawMenu(highScore: number, stats: { totalFruitsSliced: number; totalGamesPlayed: number; bestCombo: number }) {
    const ctx = this.ctx;

    // Title
    ctx.save();

    // Decorative elements
    ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
    ctx.beginPath();
    ctx.arc(this.width / 2, 150, 200, 0, Math.PI * 2);
    ctx.fill();

    // Title text with shadow
    ctx.shadowColor = '#e74c3c';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FRUIT', this.width / 2, 120);

    ctx.fillStyle = '#f39c12';
    ctx.fillText('NINJA', this.width / 2, 190);

    ctx.shadowBlur = 0;

    // Decorative fruits
    const fruits = ['🍎', '🍌', '🍑', '🍓', '🍉'];
    fruits.forEach((fruit, i) => {
      const angle = (i / fruits.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 130;
      const fx = this.width / 2 + Math.cos(angle) * radius;
      const fy = 150 + Math.sin(angle) * radius;
      ctx.font = '40px Arial';
      ctx.fillText(fruit, fx, fy);
    });

    // Play button
    ctx.fillStyle = '#27ae60';
    ctx.shadowColor = '#27ae60';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 100, 280, 200, 60, 30);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('▶ PLAY', this.width / 2, 318);

    // Stats panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 150, 380, 300, 150, 15);
    ctx.fill();

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('🏆 STATISTICS', this.width / 2, 410);

    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText(`High Score: ${highScore}`, this.width / 2, 445);
    ctx.fillText(`Fruits Sliced: ${stats.totalFruitsSliced}`, this.width / 2, 475);
    ctx.fillText(`Games Played: ${stats.totalGamesPlayed}`, this.width / 2, 505);
    ctx.fillText(`Best Combo: ${stats.bestCombo}x`, this.width / 2, 535);

    // Instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px Arial';
    ctx.fillText('Swipe to slice fruits! Avoid bombs!', this.width / 2, this.height - 30);

    ctx.restore();
  }

  drawGameOver(score: number, highScore: number, isNewHighScore: boolean) {
    const ctx = this.ctx;

    ctx.save();

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Game Over text
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#e74c3c';
    ctx.shadowBlur = 30;
    ctx.fillText('GAME OVER', this.width / 2, 180);

    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('SCORE', this.width / 2, 260);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 72px Arial';
    ctx.fillText(score.toString(), this.width / 2, 330);

    // New high score badge
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
    ctx.roundRect(this.width / 2 - 100, 430, 200, 55, 27);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('PLAY AGAIN', this.width / 2, 465);

    // Menu button
    ctx.fillStyle = '#3498db';
    ctx.shadowColor = '#3498db';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 80, 510, 160, 45, 22);
    ctx.fill();

    ctx.shadowBlur = 0;
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
    ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 50);

    // Resume button
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 80, this.height / 2, 160, 50, 25);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('RESUME', this.width / 2, this.height / 2 + 33);

    // Menu button
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 80, this.height / 2 + 70, 160, 50, 25);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.fillText('QUIT', this.width / 2, this.height / 2 + 103);

    ctx.restore();
  }
}
