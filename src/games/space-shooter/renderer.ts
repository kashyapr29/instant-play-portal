import { Player, Enemy, Bullet, PowerUp, Particle, Screen } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private time: number = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  update(deltaTime: number) {
    this.time += deltaTime;
  }

  clear() {
    const ctx = this.ctx;
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, this.width, this.height);
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * this.width;
      const y = ((Math.cos(i * 678.90) * 0.5 + 0.5) * this.height + this.time * 50 * (1 + (i % 3))) % this.height;
      const size = (i % 3) + 1;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (i % 5) * 0.1})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPlayer(player: Player) {
    const ctx = this.ctx;
    const { x, y, width, height, shield } = player;
    if (shield > 0) {
      const shieldPulse = Math.sin(this.time * 10) * 0.2 + 0.8;
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 * shieldPulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, width * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
    const exhaustHeight = 10 + Math.random() * 15;
    const gradient = ctx.createLinearGradient(x + width / 2, y + height, x + width / 2, y + height + exhaustHeight);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.3, y + height);
    ctx.lineTo(x + width / 2, y + height + exhaustHeight);
    ctx.lineTo(x + width * 0.7, y + height);
    ctx.fill();
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(0, -height/2);
    ctx.lineTo(width/2, height/2);
    ctx.lineTo(-width/2, height/2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.ellipse(0, 0, width/4, height/3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-width/2, height/4, width/4, height/4);
    ctx.fillRect(width/4, height/4, width/4, height/4);
    ctx.restore();
  }

  drawEnemy(enemy: Enemy) {
    const ctx = this.ctx;
    const { x, y, width, height, type, health, maxHealth } = enemy;
    ctx.save();
    // Use dynamic color if provided, otherwise fallback by type
    const baseColor = enemy.color || (type === 'asteroid' ? '#6b7280' : type === 'scout' ? '#34d399' : type === 'interceptor' ? '#7c3aed' : type === 'bomber' ? '#f59e0b' : type === 'heavy' ? '#ef4444' : '#60a5fa');
    // nicer metallic gradient
    const g = ctx.createLinearGradient(x, y, x + width, y + height);
    g.addColorStop(0, this._shade(baseColor, -0.15));
    g.addColorStop(0.5, baseColor);
    g.addColorStop(1, this._shade(baseColor, 0.12));

    if (type === 'asteroid') {
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this._shade(baseColor, -0.25);
      ctx.lineWidth = Math.max(1, width * 0.04);
      ctx.stroke();
      // craters
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = this._shade(baseColor, -0.25 + i * 0.05);
        ctx.beginPath();
        const cx = x + Math.random() * width;
        const cy = y + Math.random() * height;
        ctx.arc(cx, cy, width * (0.06 + Math.random() * 0.08), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'boss') {
      ctx.fillStyle = g;
      ctx.shadowColor = this._shade(baseColor, 0.4);
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.moveTo(x, y + height * 0.15);
      ctx.bezierCurveTo(x + width * 0.25, y, x + width * 0.75, y, x + width, y + height * 0.15);
      ctx.lineTo(x + width * 0.85, y + height);
      ctx.lineTo(x + width * 0.15, y + height);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = this._shade(baseColor, 0.2);
      ctx.beginPath();
      ctx.arc(x + width * 0.3, y + height * 0.45, width * 0.08, 0, Math.PI * 2);
      ctx.arc(x + width * 0.7, y + height * 0.45, width * 0.08, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Generic ship: draw a sleek hull with panels
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x + width * 0.5, y);
      ctx.lineTo(x + width, y + height * 0.45);
      ctx.lineTo(x + width * 0.7, y + height);
      ctx.lineTo(x + width * 0.3, y + height);
      ctx.lineTo(x, y + height * 0.45);
      ctx.closePath();
      ctx.fill();

      // highlight panel
      ctx.fillStyle = this._shade(baseColor, 0.35);
      ctx.beginPath();
      ctx.moveTo(x + width * 0.5, y + height * 0.08);
      ctx.lineTo(x + width * 0.8, y + height * 0.45);
      ctx.lineTo(x + width * 0.55, y + height * 0.9);
      ctx.lineTo(x + width * 0.45, y + height * 0.9);
      ctx.lineTo(x + width * 0.2, y + height * 0.45);
      ctx.closePath();
      ctx.globalAlpha = 0.28;
      ctx.fill();
      ctx.globalAlpha = 1;

      // cockpit/glow
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.ellipse(x + width * 0.5, y + height * 0.4, width * 0.12, height * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (type !== 'asteroid' && health < maxHealth) {
      const barWidth = width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y - 12, barWidth, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x, y - 12, barWidth * (health / maxHealth), 4);
    }
  }

  drawBullet(bullet: Bullet) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = bullet.color;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    ctx.restore();
  }

  drawPowerUp(powerUp: PowerUp) {
    const ctx = this.ctx;
    const pulse = Math.sin(this.time * 5) * 0.2 + 0.8;
    ctx.save();
    let color = '#fbbf24';
    let label = 'P';
    
    // Weapon colors and labels
    if (powerUp.type === 'weapon-dual') { color = '#3b82f6'; label = '2'; }
    else if (powerUp.type === 'weapon-triple') { color = '#8b5cf6'; label = '3'; }
    else if (powerUp.type === 'weapon-rocket') { color = '#ef4444'; label = '🚀'; }
    else if (powerUp.type === 'weapon-laser') { color = '#ec4899'; label = '⚡'; }
    else if (powerUp.type === 'weapon-spread') { color = '#14b8a6'; label = '⊕'; }
    else if (powerUp.type === 'weapon-pierce') { color = '#f59e0b'; label = '→'; }
    else if (powerUp.type === 'shield') { color = '#06b6d4'; label = '◇'; }
    else if (powerUp.type === 'health') { color = '#ec4899'; label = '❤'; }
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 * pulse;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
    ctx.restore();
  }

  drawParticle(particle: Particle) {
    const ctx = this.ctx;
    ctx.save();
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
    ctx.restore();
  }

  drawHUD(score: number, lives: number, shield: number, weapon: string, level: number, levelProgress: number) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 60);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, 100);
    ctx.fillStyle = '#fff';
    ctx.font = '900 18px Orbitron';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(`SCORE: ${score.toLocaleString().padStart(6, '0')}`, 20, 35);
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${level}`, this.width / 2, 35);
    const pbWidth = 120;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(this.width / 2 - pbWidth/2, 45, pbWidth, 6);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowBlur = 15;
    ctx.fillRect(this.width / 2 - pbWidth/2, 45, pbWidth * levelProgress, 6);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'right';
    const heartX = this.width - 20;
    for(let i=0; i<3; i++) {
       ctx.fillStyle = i < lives ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
       ctx.beginPath();
       const px = heartX - (i * 25);
       const py = 30;
       ctx.arc(px, py, 8, 0, Math.PI * 2);
       ctx.fill();
    }
    // Display current weapon
    ctx.font = '12px Orbitron';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(`WEAPON: ${weapon.toUpperCase()}`, this.width - 20, 65);
    ctx.shadowBlur = 0;
    if (shield > 0) {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.fillRect(20, 50, 100, 4);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(20, 50, shield, 4);
    }
  }

  // helper to adjust hex color brightness (percent between -1 and 1)
  _shade(hex: string, percent: number) {
    try {
      const c = hex.replace('#', '');
      const num = parseInt(c, 16);
      let r = (num >> 16) + Math.round(255 * percent);
      let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent);
      let b = (num & 0x0000FF) + Math.round(255 * percent);
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      const out = ((r << 16) | (g << 8) | b) >>> 0;
      return '#' + out.toString(16).padStart(6, '0');
    } catch (e) {
      return hex;
    }
  }
}
