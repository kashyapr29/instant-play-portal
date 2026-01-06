import { Player, Zombie, Bullet, PowerUp, Particle } from './types';

export class ZombieRenderer {
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
    // Dark apocalyptic background
    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.width
    );
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Ground texture
    ctx.fillStyle = '#151515';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Blood stains (static decorations)
    ctx.fillStyle = 'rgba(80, 20, 20, 0.3)';
    for (let i = 0; i < 8; i++) {
      const x = (Math.sin(i * 73.5) * 0.5 + 0.5) * this.width;
      const y = (Math.cos(i * 45.2) * 0.5 + 0.5) * this.height;
      ctx.beginPath();
      ctx.arc(x, y, 20 + i * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Fog effect
    const fogGradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 100,
      this.width / 2, this.height / 2, this.width * 0.7
    );
    fogGradient.addColorStop(0, 'transparent');
    fogGradient.addColorStop(1, 'rgba(0, 30, 0, 0.3)');
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawPlayer(player: Player) {
    const ctx = this.ctx;
    const { x, y, width, height, angle, health, maxHealth, armor } = player;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Body
    ctx.fillStyle = '#2d4a3e';
    ctx.beginPath();
    ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Armor indicator
    if (armor > 0) {
      ctx.strokeStyle = '#4a90d9';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, width / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Gun
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(5, -4, 25, 8);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(25, -3, 10, 6);

    // Muzzle flash (random)
    if (Math.random() > 0.7) {
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(35, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Health bar
    const barWidth = 50;
    const barHeight = 6;
    const barY = y - 15;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(centerX - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);
    ctx.fillStyle = health > maxHealth * 0.3 ? '#22c55e' : '#ef4444';
    ctx.fillRect(centerX - barWidth / 2, barY, barWidth * (health / maxHealth), barHeight);
  }

  drawZombie(zombie: Zombie) {
    const ctx = this.ctx;
    const { x, y, width, height, type, health, maxHealth, angle } = zombie;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Different zombie appearances
    let bodyColor = '#3d5a3d';
    let detailColor = '#2a3a2a';
    
    switch (type) {
      case 'walker':
        bodyColor = '#4a6a4a';
        break;
      case 'runner':
        bodyColor = '#6a4a4a';
        break;
      case 'tank':
        bodyColor = '#4a4a5a';
        detailColor = '#3a3a4a';
        break;
      case 'spitter':
        bodyColor = '#4a6a3a';
        detailColor = '#7aff7a';
        break;
      case 'exploder':
        bodyColor = '#8a4a4a';
        detailColor = '#ff6a3a';
        break;
      case 'boss':
        bodyColor = '#2a2a3a';
        detailColor = '#ff0000';
        break;
    }

    // Pulsing glow for special zombies
    if (type === 'exploder' || type === 'boss') {
      const pulse = Math.sin(this.time * 8) * 0.3 + 0.7;
      ctx.shadowColor = detailColor;
      ctx.shadowBlur = 15 * pulse;
    }

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Details
    ctx.fillStyle = detailColor;
    ctx.beginPath();
    ctx.arc(-width * 0.2, -width * 0.15, width * 0.12, 0, Math.PI * 2);
    ctx.arc(width * 0.2, -width * 0.15, width * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Arms reaching forward
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = width * 0.15;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -width * 0.3);
    ctx.lineTo(width * 0.5, -width * 0.5);
    ctx.moveTo(0, width * 0.3);
    ctx.lineTo(width * 0.5, width * 0.5);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();

    // Health bar for non-basic zombies
    if (type !== 'walker' && health < maxHealth) {
      const barWidth = width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y - 8, barWidth, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x, y - 8, barWidth * (health / maxHealth), 4);
    }
  }

  drawBullet(bullet: Bullet) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = bullet.color;
    
    // Calculate angle from direction
    const angle = Math.atan2(bullet.dy, bullet.dx);
    ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
    ctx.rotate(angle);
    
    // Bullet shape
    ctx.beginPath();
    ctx.ellipse(0, 0, bullet.width, bullet.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Tracer
    ctx.strokeStyle = bullet.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-bullet.width * 2, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();
    
    ctx.restore();
  }

  drawPowerUp(powerUp: PowerUp) {
    const ctx = this.ctx;
    const pulse = Math.sin(this.time * 5) * 0.2 + 0.8;
    ctx.save();
    
    let color = '#fbbf24';
    let label = '?';
    
    switch (powerUp.type) {
      case 'health': color = '#22c55e'; label = '+'; break;
      case 'ammo': color = '#f59e0b'; label = '⬢'; break;
      case 'armor': color = '#3b82f6'; label = '◆'; break;
      case 'weapon-shotgun': color = '#ef4444'; label = 'S'; break;
      case 'weapon-smg': color = '#8b5cf6'; label = 'M'; break;
      case 'weapon-rifle': color = '#06b6d4'; label = 'R'; break;
      case 'weapon-minigun': color = '#ec4899'; label = '⚙'; break;
      case 'speed': color = '#22d3ee'; label = '»'; break;
    }

    ctx.shadowColor = color;
    ctx.shadowBlur = 20 * pulse;
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
    
    if (particle.type === 'blood') {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (particle.type === 'spark') {
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5;
      ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
    } else {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.width, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawHUD(score: number, health: number, maxHealth: number, ammo: number, maxAmmo: number, weapon: string, wave: number, zombiesRemaining: number) {
    const ctx = this.ctx;
    
    // Top bar background
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, 80);

    ctx.font = '900 18px Orbitron';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 20, 30);

    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
    ctx.fillText(`WAVE ${wave}`, this.width / 2, 30);
    
    // Zombies remaining
    ctx.font = '14px Orbitron';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`${zombiesRemaining} REMAINING`, this.width / 2, 50);

    // Ammo
    ctx.textAlign = 'right';
    ctx.font = '16px Orbitron';
    ctx.fillStyle = ammo > maxAmmo * 0.2 ? '#f59e0b' : '#ef4444';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
    ctx.fillText(`${weapon.toUpperCase()} | ${ammo}/${maxAmmo}`, this.width - 20, 30);

    // Health bar at bottom
    const barWidth = 200;
    const barHeight = 8;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(20, this.height - 30, barWidth + 4, barHeight + 4);
    ctx.fillStyle = health > maxHealth * 0.3 ? '#22c55e' : '#ef4444';
    ctx.fillRect(22, this.height - 28, barWidth * (health / maxHealth), barHeight);
    
    ctx.font = '12px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('HEALTH', 20, this.height - 40);

    ctx.shadowBlur = 0;
  }
}
