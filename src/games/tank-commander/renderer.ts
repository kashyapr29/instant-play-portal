import { Tank, EnemyTank, Projectile, Obstacle, PowerUp, Particle } from './types';

export class TankRenderer {
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
    // Military themed background
    ctx.fillStyle = '#2a2a25';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Grid pattern
    ctx.strokeStyle = 'rgba(60, 60, 50, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Dirt patches
    ctx.fillStyle = 'rgba(60, 50, 40, 0.4)';
    for (let i = 0; i < 10; i++) {
      const x = (Math.sin(i * 47.3) * 0.5 + 0.5) * this.width;
      const y = (Math.cos(i * 89.1) * 0.5 + 0.5) * this.height;
      ctx.beginPath();
      ctx.arc(x, y, 30 + i * 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawTank(tank: Tank, isPlayer: boolean = true) {
    const ctx = this.ctx;
    const { x, y, width, height, angle, turretAngle, health, maxHealth, armor } = tank;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Tank body with rotation
    ctx.save();
    ctx.rotate(angle);
    
    // Tracks
    ctx.fillStyle = '#1a1a15';
    ctx.fillRect(-width / 2 - 5, -height / 2, 10, height);
    ctx.fillRect(width / 2 - 5, -height / 2, 10, height);
    
    // Body
    const bodyGradient = ctx.createLinearGradient(-width/2, 0, width/2, 0);
    if (isPlayer) {
      bodyGradient.addColorStop(0, '#4a6741');
      bodyGradient.addColorStop(0.5, '#5a7751');
      bodyGradient.addColorStop(1, '#4a6741');
    } else {
      bodyGradient.addColorStop(0, '#6a4a4a');
      bodyGradient.addColorStop(0.5, '#7a5a5a');
      bodyGradient.addColorStop(1, '#6a4a4a');
    }
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10);
    
    ctx.restore();

    // Turret (separate rotation)
    ctx.rotate(turretAngle);
    
    // Turret base
    ctx.fillStyle = isPlayer ? '#3a5a31' : '#5a3a3a';
    ctx.beginPath();
    ctx.arc(0, 0, width * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Cannon
    ctx.fillStyle = isPlayer ? '#2a3a25' : '#4a2a2a';
    ctx.fillRect(0, -4, width * 0.6, 8);
    ctx.fillStyle = '#1a1a15';
    ctx.fillRect(width * 0.5, -3, width * 0.15, 6);

    // Armor effect
    if (armor > 0) {
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, width * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Health bar for player
    if (isPlayer) {
      const barWidth = 60;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(centerX - barWidth / 2 - 1, y - 15, barWidth + 2, 8);
      ctx.fillStyle = health > maxHealth * 0.3 ? '#4ade80' : '#ef4444';
      ctx.fillRect(centerX - barWidth / 2, y - 14, barWidth * (health / maxHealth), 6);
    }
  }

  drawEnemyTank(enemy: EnemyTank) {
    const ctx = this.ctx;
    const { x, y, width, height, angle, turretAngle, health, maxHealth, type } = enemy;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Get color based on type
    let bodyColor = '#6a4a4a';
    let turretColor = '#5a3a3a';
    
    switch (type) {
      case 'light': bodyColor = '#6a5a4a'; turretColor = '#5a4a3a'; break;
      case 'medium': bodyColor = '#5a5a6a'; turretColor = '#4a4a5a'; break;
      case 'heavy': bodyColor = '#4a4a5a'; turretColor = '#3a3a4a'; break;
      case 'artillery': bodyColor = '#5a6a5a'; turretColor = '#4a5a4a'; break;
      case 'boss': bodyColor = '#3a1a1a'; turretColor = '#2a0a0a'; break;
    }

    // Glow for boss
    if (type === 'boss') {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;
    }

    // Tank body
    ctx.rotate(angle);
    ctx.fillStyle = '#1a1a15';
    ctx.fillRect(-width / 2 - 5, -height / 2, 10, height);
    ctx.fillRect(width / 2 - 5, -height / 2, 10, height);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10);
    
    ctx.rotate(-angle);
    ctx.rotate(turretAngle);
    
    ctx.fillStyle = turretColor;
    ctx.beginPath();
    ctx.arc(0, 0, width * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    const cannonLength = type === 'artillery' ? width * 0.8 : width * 0.6;
    ctx.fillStyle = '#1a1a15';
    ctx.fillRect(0, -4, cannonLength, 8);

    ctx.shadowBlur = 0;
    ctx.restore();

    // Health bar
    if (health < maxHealth) {
      const barWidth = width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x, y - 10, barWidth, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x, y - 10, barWidth * (health / maxHealth), 5);
    }
  }

  drawProjectile(proj: Projectile) {
    const ctx = this.ctx;
    ctx.save();
    
    const angle = Math.atan2(proj.dy, proj.dx);
    ctx.translate(proj.x + proj.width / 2, proj.y + proj.height / 2);
    ctx.rotate(angle);

    if (proj.type === 'shell') {
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, proj.width, proj.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'missile') {
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(-proj.width / 2, -proj.height / 2, proj.width, proj.height);
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(-proj.width / 2, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'flame') {
      ctx.globalAlpha = proj.life;
      ctx.fillStyle = `hsl(${30 + Math.random() * 30}, 100%, 50%)`;
      ctx.beginPath();
      ctx.arc(0, 0, proj.width, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = proj.color;
      ctx.fillRect(-proj.width / 2, -proj.height / 2, proj.width, proj.height);
    }

    ctx.restore();
  }

  drawObstacle(obs: Obstacle) {
    const ctx = this.ctx;
    ctx.save();
    
    switch (obs.type) {
      case 'wall':
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(obs.x + 2, obs.y + 2, obs.width - 4, obs.height - 4);
        break;
      case 'barrel':
        ctx.fillStyle = '#8a4a2a';
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6a3a1a';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
      case 'sandbag':
        ctx.fillStyle = '#a08060';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#806040';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        break;
      case 'crate':
        ctx.fillStyle = '#8a6a4a';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#5a4a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x + 3, obs.y + 3, obs.width - 6, obs.height - 6);
        break;
    }
    
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
      case 'weapon-missile': color = '#ef4444'; label = 'M'; break;
      case 'weapon-flamethrower': color = '#ff6600'; label = 'F'; break;
      case 'shield': color = '#06b6d4'; label = '◇'; break;
    }

    ctx.shadowColor = color;
    ctx.shadowBlur = 20 * pulse;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Orbitron';
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
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    
    if (particle.type === 'explosion') {
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, particle.width, 0, Math.PI * 2);
      ctx.fill();
    } else if (particle.type === 'debris') {
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
    } else {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, particle.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawHUD(score: number, health: number, maxHealth: number, ammo: number, shells: number, weapon: string, mission: number, enemiesRemaining: number) {
    const ctx = this.ctx;
    
    // Top bar
    const gradient = ctx.createLinearGradient(0, 0, 0, 70);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, 70);

    ctx.font = '800 18px Orbitron';
    ctx.shadowColor = 'rgba(100, 180, 100, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 15, 28);

    ctx.textAlign = 'center';
    ctx.fillText(`MISSION ${mission}`, this.width / 2, 28);
    
    ctx.font = '14px Orbitron';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`${enemiesRemaining} HOSTILES`, this.width / 2, 48);

    ctx.textAlign = 'right';
    ctx.font = '16px Orbitron';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`${weapon.toUpperCase()} | ${ammo} / ${shells}`, this.width - 15, 28);

    // Bottom health bar
    const barWidth = 180;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(15, this.height - 28, barWidth + 4, 12);
    ctx.fillStyle = health > maxHealth * 0.3 ? '#4ade80' : '#ef4444';
    ctx.fillRect(17, this.height - 26, barWidth * (health / maxHealth), 8);
    
    ctx.font = '12px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('ARMOR', 15, this.height - 38);

    ctx.shadowBlur = 0;
  }
}
