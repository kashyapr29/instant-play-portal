import { Ball, Brick, Paddle, Particle, PowerUp, PowerUpType } from './types';

// Color palette
const COLORS = {
  background: '#0a0a1a',
  backgroundGradientStart: '#0a0a1a',
  backgroundGradientEnd: '#1a1a3a',
  paddle: '#00ffff',
  paddleGlow: '#00ffff40',
  ball: '#ffffff',
  ballGlow: '#ffffff60',
  ballTrail: '#ffffff20',
  ui: '#ffffff',
  uiMuted: '#888888',
  accent: '#ff00ff',
  success: '#00ff88',
  danger: '#ff4444',
};

const BRICK_COLORS: Record<string, { fill: string; glow: string; border: string }> = {
  normal: { fill: '#4fd1c5', glow: '#4fd1c540', border: '#6ee7db' },
  strong: { fill: '#f6ad55', glow: '#f6ad5540', border: '#fbd38d' },
  superStrong: { fill: '#fc8181', glow: '#fc818140', border: '#feb2b2' },
  unbreakable: { fill: '#4a5568', glow: '#4a556840', border: '#718096' },
  explosive: { fill: '#f56565', glow: '#f5656560', border: '#fc8181' },
  powerup: { fill: '#9f7aea', glow: '#9f7aea60', border: '#b794f4' },
};

const POWERUP_COLORS: Record<PowerUpType, string> = {
  multiball: '#00ffff',
  widePaddle: '#00ff88',
  slowMotion: '#ffff00',
  fireball: '#ff6600',
  extraLife: '#ff00ff',
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private time: number = 0;
  private shakeAmount: number = 0;
  private shakeDecay: number = 0.9;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  update(deltaTime: number) {
    this.time += deltaTime;
    this.shakeAmount *= this.shakeDecay;
  }

  shake(amount: number) {
    this.shakeAmount = Math.min(this.shakeAmount + amount, 10);
  }

  clear() {
    const ctx = this.ctx;
    
    // Apply screen shake
    ctx.save();
    if (this.shakeAmount > 0.5) {
      const shakeX = (Math.random() - 0.5) * this.shakeAmount;
      const shakeY = (Math.random() - 0.5) * this.shakeAmount;
      ctx.translate(shakeX, shakeY);
    }

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, COLORS.backgroundGradientStart);
    gradient.addColorStop(1, COLORS.backgroundGradientEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Grid pattern
    ctx.strokeStyle = '#ffffff08';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y <= this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  restore() {
    this.ctx.restore();
  }

  drawBall(ball: Ball, isFireball: boolean = false) {
    const ctx = this.ctx;

    // Draw trail
    ball.trail.forEach((pos, i) => {
      const alpha = (i / ball.trail.length) * 0.3;
      const size = ball.radius * (0.3 + (i / ball.trail.length) * 0.7);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = isFireball ? `rgba(255, 102, 0, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    });

    // Ball glow
    const glowGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 3);
    glowGradient.addColorStop(0, isFireball ? '#ff660080' : COLORS.ballGlow);
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(ball.x - ball.radius * 3, ball.y - ball.radius * 3, ball.radius * 6, ball.radius * 6);

    // Main ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    const ballGradient = ctx.createRadialGradient(
      ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
      ball.x, ball.y, ball.radius
    );
    ballGradient.addColorStop(0, isFireball ? '#ffcc00' : '#ffffff');
    ballGradient.addColorStop(1, isFireball ? '#ff6600' : '#aaaaaa');
    ctx.fillStyle = ballGradient;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
  }

  drawPaddle(paddle: Paddle, isWide: boolean = false) {
    const ctx = this.ctx;
    const width = isWide ? paddle.width * 1.5 : paddle.width;
    const x = paddle.x - (isWide ? (width - paddle.width) / 2 : 0);

    // Glow effect
    ctx.shadowColor = COLORS.paddle;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Main paddle with gradient
    const gradient = ctx.createLinearGradient(x, paddle.y, x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(0.5, '#00cccc');
    gradient.addColorStop(1, '#009999');
    ctx.fillStyle = gradient;

    // Rounded rectangle
    const radius = paddle.height / 2;
    ctx.beginPath();
    ctx.roundRect(x, paddle.y, width, paddle.height, radius);
    ctx.fill();

    // Top highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x + 2, paddle.y + 1, width - 4, paddle.height / 3, radius / 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  drawBrick(brick: Brick) {
    if (!brick.visible) return;

    const ctx = this.ctx;
    let colorSet = BRICK_COLORS.normal;

    switch (brick.type) {
      case 'strong':
        colorSet = brick.health === 3 ? BRICK_COLORS.superStrong : BRICK_COLORS.strong;
        break;
      case 'unbreakable':
        colorSet = BRICK_COLORS.unbreakable;
        break;
      case 'explosive':
        colorSet = BRICK_COLORS.explosive;
        break;
      case 'powerup':
        colorSet = BRICK_COLORS.powerup;
        break;
    }

    // Glow
    ctx.shadowColor = colorSet.glow;
    ctx.shadowBlur = 10;

    // Main brick with gradient
    const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
    gradient.addColorStop(0, colorSet.border);
    gradient.addColorStop(0.3, colorSet.fill);
    gradient.addColorStop(1, colorSet.fill);
    ctx.fillStyle = gradient;

    const radius = 4;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.width, brick.height, radius);
    ctx.fill();

    // Border
    ctx.strokeStyle = colorSet.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Health indicator for strong bricks
    if (brick.type === 'strong' && brick.health > 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(brick.health.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2);
    }

    // Unbreakable pattern
    if (brick.type === 'unbreakable') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const lineY = brick.y + (brick.height / 4) * (i + 1);
        ctx.beginPath();
        ctx.moveTo(brick.x + 4, lineY);
        ctx.lineTo(brick.x + brick.width - 4, lineY);
        ctx.stroke();
      }
    }

    // Explosive icon
    if (brick.type === 'explosive') {
      const pulse = Math.sin(this.time * 5) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💥', brick.x + brick.width / 2, brick.y + brick.height / 2);
    }

    // Powerup sparkle
    if (brick.type === 'powerup') {
      const sparkle = Math.sin(this.time * 8 + brick.x) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * 0.6})`;
      ctx.font = '10px Arial';
      ctx.fillText('✨', brick.x + brick.width / 2, brick.y + brick.height / 2);
    }

    ctx.shadowBlur = 0;
  }

  drawPowerUp(powerUp: PowerUp) {
    if (!powerUp.active) return;

    const ctx = this.ctx;
    const size = 20;
    const bobY = Math.sin(this.time * 4 + powerUp.x) * 3;

    // Glow
    const color = POWERUP_COLORS[powerUp.type];
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    // Circle background
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y + bobY, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const icons: Record<PowerUpType, string> = {
      multiball: '⚡',
      widePaddle: '↔',
      slowMotion: '⏱',
      fireball: '🔥',
      extraLife: '❤️',
    };
    ctx.fillText(icons[powerUp.type], powerUp.x, powerUp.y + bobY);

    ctx.shadowBlur = 0;
  }

  drawParticle(particle: Particle) {
    const ctx = this.ctx;
    const alpha = particle.life / particle.maxLife;
    
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.fill();
  }

  drawUI(score: number, lives: number, level: number, combo: number, activePowerUps: { type: PowerUpType; endTime: number }[], currentTime: number) {
    const ctx = this.ctx;

    // Top bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, this.width, 30);

    ctx.font = 'bold 14px "Segoe UI", Arial';
    ctx.textBaseline = 'middle';

    // Score
    ctx.fillStyle = COLORS.ui;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 10, 15);

    // Level
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${level}`, this.width / 2, 15);

    // Lives
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.danger;
    let livesText = '';
    for (let i = 0; i < lives; i++) {
      livesText += '❤️ ';
    }
    ctx.fillText(livesText.trim(), this.width - 10, 15);

    // Combo indicator
    if (combo > 1) {
      const comboAlpha = Math.min(1, combo / 10);
      ctx.fillStyle = `rgba(255, 215, 0, ${comboAlpha})`;
      ctx.font = `bold ${16 + combo}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`${combo}x COMBO!`, this.width / 2, 50);
    }

    // Active power-ups
    activePowerUps.forEach((powerUp, index) => {
      const remaining = Math.max(0, (powerUp.endTime - currentTime) / 1000);
      if (remaining > 0) {
        const y = 60 + index * 25;
        const color = POWERUP_COLORS[powerUp.type];
        ctx.fillStyle = color;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${powerUp.type.toUpperCase()}: ${remaining.toFixed(1)}s`, 10, y);
      }
    });
  }
}
