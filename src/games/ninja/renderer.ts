// Renderer for Ninja Jump game

import { 
  Ninja, Platform, Obstacle, Collectible, Particle, Enemy, BackgroundElement,
  LevelTheme, PlatformType
} from './types';
import { getThemeColors } from './levels';

export class NinjaRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private theme: LevelTheme = 'bamboo_forest';
  private cameraY: number = 0;
  private frameCount: number = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  setTheme(theme: LevelTheme) {
    this.theme = theme;
  }

  setCameraY(y: number) {
    this.cameraY = y;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawBackground(bgElements: BackgroundElement[]) {
    const colors = getThemeColors(this.theme);
    
    // Create gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, colors.bg[0]);
    gradient.addColorStop(0.5, colors.bg[1]);
    gradient.addColorStop(1, colors.bg[2]);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw background elements with parallax
    bgElements.forEach(elem => {
      this.drawBackgroundElement(elem);
    });

    this.frameCount++;
  }

  private drawBackgroundElement(elem: BackgroundElement) {
    const screenY = elem.y - this.cameraY * elem.speed;
    
    this.ctx.save();
    this.ctx.globalAlpha = elem.opacity;
    this.ctx.translate(elem.x, screenY);
    this.ctx.scale(elem.scale, elem.scale);

    switch (elem.type) {
      case 'cloud':
        this.drawCloud();
        break;
      case 'bird':
        this.drawBird();
        break;
      case 'lantern':
        this.drawLantern();
        break;
      case 'tree':
        this.drawTree();
        break;
      case 'mountain':
        this.drawMountain();
        break;
    }

    this.ctx.restore();
  }

  private drawCloud() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
    this.ctx.arc(25, -5, 25, 0, Math.PI * 2);
    this.ctx.arc(50, 0, 30, 0, Math.PI * 2);
    this.ctx.arc(25, 10, 20, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawBird() {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-10, 0);
    this.ctx.quadraticCurveTo(-5, -5, 0, 0);
    this.ctx.quadraticCurveTo(5, -5, 10, 0);
    this.ctx.stroke();
  }

  private drawLantern() {
    // Paper lantern
    this.ctx.fillStyle = '#ff4444';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#8b0000';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Glow effect
    const glow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    glow.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
    glow.addColorStop(1, 'rgba(255, 200, 100, 0)');
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawTree() {
    // Trunk
    this.ctx.fillStyle = '#5d4037';
    this.ctx.fillRect(-5, -30, 10, 60);

    // Leaves
    this.ctx.fillStyle = '#2d5a3f';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -60);
    this.ctx.lineTo(-25, -20);
    this.ctx.lineTo(25, -20);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(0, -45);
    this.ctx.lineTo(-20, -10);
    this.ctx.lineTo(20, -10);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawMountain() {
    this.ctx.fillStyle = 'rgba(100, 100, 120, 0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(-60, 40);
    this.ctx.lineTo(0, -40);
    this.ctx.lineTo(60, 40);
    this.ctx.closePath();
    this.ctx.fill();

    // Snow cap
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.moveTo(-15, -10);
    this.ctx.lineTo(0, -40);
    this.ctx.lineTo(15, -10);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawNinja(ninja: Ninja) {
    const screenY = this.height - (ninja.y - this.cameraY);
    
    this.ctx.save();
    this.ctx.translate(ninja.x, screenY);
    
    if (!ninja.facingRight) {
      this.ctx.scale(-1, 1);
    }

    // Invincibility flash effect
    if (ninja.invincible && Math.floor(this.frameCount / 5) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    // Dash trail effect
    if (ninja.isDashing) {
      this.ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
      for (let i = 1; i <= 3; i++) {
        this.ctx.fillRect(
          -ninja.width / 2 - i * 10,
          -ninja.height / 2,
          ninja.width,
          ninja.height
        );
      }
    }

    // Body (dark ninja suit)
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(-ninja.width / 2, -ninja.height / 2, ninja.width, ninja.height);

    // Head
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.beginPath();
    this.ctx.arc(0, -ninja.height / 2 - 8, 10, 0, Math.PI * 2);
    this.ctx.fill();

    // Eye slit (glowing in the dark)
    this.ctx.fillStyle = ninja.isWallSliding ? '#ff6b6b' : '#64ffda';
    this.ctx.fillRect(2, -ninja.height / 2 - 10, 6, 3);

    // Headband
    this.ctx.fillStyle = '#e63946';
    this.ctx.fillRect(-12, -ninja.height / 2 - 12, 24, 4);
    
    // Headband tail
    this.ctx.beginPath();
    this.ctx.moveTo(-12, -ninja.height / 2 - 10);
    this.ctx.quadraticCurveTo(-18, -ninja.height / 2 - 5, -25, -ninja.height / 2 - 8);
    this.ctx.lineTo(-25, -ninja.height / 2 - 12);
    this.ctx.quadraticCurveTo(-18, -ninja.height / 2 - 9, -12, -ninja.height / 2 - 14);
    this.ctx.fill();

    // Belt
    this.ctx.fillStyle = '#b8860b';
    this.ctx.fillRect(-ninja.width / 2, 0, ninja.width, 4);

    // Arms in action pose
    this.ctx.fillStyle = '#1a1a2e';
    if (ninja.isJumping || ninja.isDashing) {
      // Extended arms
      this.ctx.fillRect(ninja.width / 2, -5, 8, 5);
      this.ctx.fillRect(-ninja.width / 2 - 8, -10, 8, 5);
    } else {
      // Relaxed arms
      this.ctx.fillRect(ninja.width / 2, -2, 6, 12);
      this.ctx.fillRect(-ninja.width / 2 - 6, -2, 6, 12);
    }

    // Wall sliding pose
    if (ninja.isWallSliding) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(
        ninja.wallSide === 'right' ? ninja.width / 2 : -ninja.width / 2 - 5,
        -ninja.height / 2,
        5,
        ninja.height
      );
    }

    this.ctx.restore();
  }

  drawPlatform(platform: Platform) {
    const screenY = this.height - (platform.y - this.cameraY);
    
    this.ctx.save();
    this.ctx.translate(platform.x, screenY);

    const colors = this.getPlatformColors(platform.type);
    
    // Platform shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(3, 3, platform.width, platform.height);

    // Main platform
    const gradient = this.ctx.createLinearGradient(0, 0, 0, platform.height);
    gradient.addColorStop(0, colors.top);
    gradient.addColorStop(1, colors.bottom);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, platform.width, platform.height);

    // Platform details based on type
    this.drawPlatformDetails(platform, colors);

    // Border
    this.ctx.strokeStyle = colors.border;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, platform.width, platform.height);

    // Crumbling effect
    if (platform.crumbling && platform.crumbleTimer) {
      const shake = Math.sin(this.frameCount * 0.5) * 2;
      this.ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
      this.ctx.fillRect(shake, 0, platform.width, platform.height);
      
      // Falling debris particles
      for (let i = 0; i < 3; i++) {
        this.ctx.fillStyle = colors.bottom;
        this.ctx.fillRect(
          Math.random() * platform.width,
          platform.height + Math.random() * 10,
          4,
          4
        );
      }
    }

    this.ctx.restore();
  }

  private getPlatformColors(type: PlatformType): { top: string; bottom: string; border: string } {
    const colorMap: Record<PlatformType, { top: string; bottom: string; border: string }> = {
      normal: { top: '#6b705c', bottom: '#3a3d34', border: '#2a2d24' },
      bamboo: { top: '#7cb342', bottom: '#558b2f', border: '#33691e' },
      stone: { top: '#78909c', bottom: '#546e7a', border: '#37474f' },
      wood: { top: '#8d6e63', bottom: '#5d4037', border: '#3e2723' },
      ice: { top: '#b3e5fc', bottom: '#81d4fa', border: '#4fc3f7' },
      bouncy: { top: '#ff7043', bottom: '#e64a19', border: '#bf360c' },
      crumbling: { top: '#a1887f', bottom: '#6d4c41', border: '#4e342e' },
      moving: { top: '#9575cd', bottom: '#7e57c2', border: '#5e35b1' },
      spike: { top: '#ef5350', bottom: '#c62828', border: '#b71c1c' },
      checkpoint: { top: '#ffd54f', bottom: '#ffb300', border: '#ff8f00' },
    };

    return colorMap[type] || colorMap.normal;
  }

  private drawPlatformDetails(platform: Platform, colors: { top: string; bottom: string; border: string }) {
    switch (platform.type) {
      case 'bamboo':
        // Bamboo segments
        for (let i = 0; i < platform.width; i += 15) {
          this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          this.ctx.beginPath();
          this.ctx.moveTo(i, 0);
          this.ctx.lineTo(i, platform.height);
          this.ctx.stroke();
        }
        break;

      case 'ice':
        // Ice shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(5, 3);
        this.ctx.lineTo(platform.width - 10, 3);
        this.ctx.lineTo(platform.width - 15, 6);
        this.ctx.lineTo(10, 6);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'bouncy':
        // Spring coil pattern
        this.ctx.strokeStyle = '#fff3e0';
        this.ctx.lineWidth = 2;
        for (let i = 5; i < platform.width - 5; i += 8) {
          this.ctx.beginPath();
          this.ctx.arc(i, platform.height / 2, 3, 0, Math.PI);
          this.ctx.stroke();
        }
        break;

      case 'checkpoint':
        // Flag or marker
        this.ctx.fillStyle = '#ff5722';
        this.ctx.beginPath();
        this.ctx.moveTo(platform.width / 2, -20);
        this.ctx.lineTo(platform.width / 2 + 15, -10);
        this.ctx.lineTo(platform.width / 2, 0);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Pole
        this.ctx.fillStyle = '#5d4037';
        this.ctx.fillRect(platform.width / 2 - 2, -25, 4, 25);
        break;

      case 'spike':
        // Draw spikes on top
        this.ctx.fillStyle = '#b71c1c';
        const spikeCount = Math.floor(platform.width / 12);
        for (let i = 0; i < spikeCount; i++) {
          const spikeX = 6 + i * 12;
          this.ctx.beginPath();
          this.ctx.moveTo(spikeX - 5, 0);
          this.ctx.lineTo(spikeX, -10);
          this.ctx.lineTo(spikeX + 5, 0);
          this.ctx.closePath();
          this.ctx.fill();
        }
        break;
    }
  }

  drawCollectible(collectible: Collectible) {
    if (collectible.collected) return;

    const screenY = this.height - (collectible.y - this.cameraY);
    
    this.ctx.save();
    this.ctx.translate(collectible.x, screenY);
    this.ctx.rotate(collectible.rotation);

    // Floating animation
    const floatY = Math.sin(this.frameCount * 0.1 + collectible.x) * 3;
    this.ctx.translate(0, floatY);

    // Glow effect
    const glowColor = this.getCollectibleGlow(collectible.type);
    const glow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw collectible based on type
    switch (collectible.type) {
      case 'coin':
        this.drawCoin();
        break;
      case 'gem':
        this.drawGem();
        break;
      case 'scroll':
        this.drawScroll();
        break;
      case 'health':
        this.drawHeart();
        break;
      default:
        this.drawPowerUpIcon(collectible.type);
    }

    this.ctx.restore();
  }

  private getCollectibleGlow(type: string): string {
    const glowMap: Record<string, string> = {
      coin: 'rgba(255, 215, 0, 0.4)',
      gem: 'rgba(138, 43, 226, 0.4)',
      scroll: 'rgba(255, 248, 220, 0.4)',
      health: 'rgba(255, 0, 100, 0.4)',
      powerup_speed: 'rgba(0, 191, 255, 0.4)',
      powerup_jump: 'rgba(50, 205, 50, 0.4)',
      powerup_shield: 'rgba(255, 140, 0, 0.4)',
      powerup_magnet: 'rgba(255, 20, 147, 0.4)',
    };
    return glowMap[type] || 'rgba(255, 255, 255, 0.4)';
  }

  private drawCoin() {
    this.ctx.fillStyle = '#ffd700';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#daa520';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#daa520';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('¥', 0, 0);
  }

  private drawGem() {
    this.ctx.fillStyle = '#9b59b6';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -12);
    this.ctx.lineTo(8, -4);
    this.ctx.lineTo(8, 4);
    this.ctx.lineTo(0, 12);
    this.ctx.lineTo(-8, 4);
    this.ctx.lineTo(-8, -4);
    this.ctx.closePath();
    this.ctx.fill();

    // Shine
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -10);
    this.ctx.lineTo(6, -3);
    this.ctx.lineTo(0, -1);
    this.ctx.lineTo(-4, -5);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawScroll() {
    this.ctx.fillStyle = '#f5deb3';
    this.ctx.fillRect(-8, -6, 16, 12);
    
    this.ctx.fillStyle = '#8b4513';
    this.ctx.fillRect(-10, -8, 4, 16);
    this.ctx.fillRect(6, -8, 4, 16);

    // Text lines
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i += 3) {
      this.ctx.beginPath();
      this.ctx.moveTo(-5, i);
      this.ctx.lineTo(4, i);
      this.ctx.stroke();
    }
  }

  private drawHeart() {
    this.ctx.fillStyle = '#e91e63';
    this.ctx.beginPath();
    this.ctx.moveTo(0, 4);
    this.ctx.bezierCurveTo(-10, -2, -10, -10, 0, -6);
    this.ctx.bezierCurveTo(10, -10, 10, -2, 0, 4);
    this.ctx.fill();

    // Shine
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(-4, -5, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawPowerUpIcon(type: string) {
    const iconColors: Record<string, string> = {
      powerup_speed: '#00bfff',
      powerup_jump: '#32cd32',
      powerup_shield: '#ff8c00',
      powerup_magnet: '#ff1493',
    };

    this.ctx.fillStyle = iconColors[type] || '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Icon symbol
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const symbols: Record<string, string> = {
      powerup_speed: '⚡',
      powerup_jump: '↑',
      powerup_shield: '🛡',
      powerup_magnet: '◎',
    };
    this.ctx.fillText(symbols[type] || '★', 0, 0);
  }

  drawObstacle(obstacle: Obstacle) {
    if (!obstacle.active) return;

    const screenY = this.height - (obstacle.y - this.cameraY);
    
    this.ctx.save();
    this.ctx.translate(obstacle.x, screenY);
    
    if (obstacle.rotation) {
      this.ctx.rotate(obstacle.rotation);
    }

    switch (obstacle.type) {
      case 'shuriken':
        this.drawShuriken(obstacle);
        break;
      case 'spike':
        this.drawSpike(obstacle);
        break;
      case 'fire':
        this.drawFire(obstacle);
        break;
      case 'arrow':
        this.drawArrow(obstacle);
        break;
    }

    this.ctx.restore();
  }

  private drawShuriken(obstacle: Obstacle) {
    const size = obstacle.width / 2;
    
    this.ctx.fillStyle = '#37474f';
    this.ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI / 2) + this.frameCount * 0.1;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fill();

    // Center
    this.ctx.fillStyle = '#263238';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawSpike(obstacle: Obstacle) {
    this.ctx.fillStyle = '#ef5350';
    this.ctx.beginPath();
    this.ctx.moveTo(-obstacle.width / 2, obstacle.height / 2);
    this.ctx.lineTo(0, -obstacle.height / 2);
    this.ctx.lineTo(obstacle.width / 2, obstacle.height / 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = '#c62828';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawFire(obstacle: Obstacle) {
    // Animated fire
    const flicker = Math.sin(this.frameCount * 0.3) * 3;
    
    // Outer flame
    const gradient = this.ctx.createRadialGradient(0, flicker, 0, 0, 0, obstacle.width);
    gradient.addColorStop(0, '#ffeb3b');
    gradient.addColorStop(0.4, '#ff9800');
    gradient.addColorStop(1, '#f44336');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.moveTo(-obstacle.width / 2, obstacle.height / 2);
    this.ctx.quadraticCurveTo(-obstacle.width / 4, 0, 0, -obstacle.height / 2 + flicker);
    this.ctx.quadraticCurveTo(obstacle.width / 4, 0, obstacle.width / 2, obstacle.height / 2);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawArrow(obstacle: Obstacle) {
    this.ctx.fillStyle = '#5d4037';
    this.ctx.fillRect(-obstacle.width / 2, -2, obstacle.width, 4);
    
    // Arrowhead
    this.ctx.fillStyle = '#37474f';
    this.ctx.beginPath();
    this.ctx.moveTo(obstacle.width / 2, 0);
    this.ctx.lineTo(obstacle.width / 2 - 10, -6);
    this.ctx.lineTo(obstacle.width / 2 - 10, 6);
    this.ctx.closePath();
    this.ctx.fill();

    // Fletching
    this.ctx.fillStyle = '#f44336';
    this.ctx.beginPath();
    this.ctx.moveTo(-obstacle.width / 2, 0);
    this.ctx.lineTo(-obstacle.width / 2 - 8, -5);
    this.ctx.lineTo(-obstacle.width / 2 + 5, 0);
    this.ctx.lineTo(-obstacle.width / 2 - 8, 5);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawEnemy(enemy: Enemy) {
    if (!enemy.active) return;

    const screenY = this.height - (enemy.y - this.cameraY);
    
    this.ctx.save();
    this.ctx.translate(enemy.x, screenY);
    
    if (!enemy.facingRight) {
      this.ctx.scale(-1, 1);
    }

    switch (enemy.type) {
      case 'guard':
        this.drawGuard(enemy);
        break;
      case 'archer':
        this.drawArcher(enemy);
        break;
      case 'ghost':
        this.drawGhost(enemy);
        break;
      case 'crow':
        this.drawCrow(enemy);
        break;
    }

    this.ctx.restore();
  }

  private drawGuard(enemy: Enemy) {
    // Body
    this.ctx.fillStyle = '#b71c1c';
    this.ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);

    // Armor
    this.ctx.fillStyle = '#37474f';
    this.ctx.fillRect(-enemy.width / 2, -enemy.height / 4, enemy.width, enemy.height / 3);

    // Head with helmet
    this.ctx.fillStyle = '#37474f';
    this.ctx.beginPath();
    this.ctx.arc(0, -enemy.height / 2 - 8, 10, 0, Math.PI * 2);
    this.ctx.fill();

    // Eyes
    this.ctx.fillStyle = '#ff5252';
    this.ctx.fillRect(2, -enemy.height / 2 - 10, 4, 3);
  }

  private drawArcher(enemy: Enemy) {
    // Body
    this.ctx.fillStyle = '#1b5e20';
    this.ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);

    // Bow
    this.ctx.strokeStyle = '#5d4037';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(enemy.width / 2 + 5, 0, 15, -Math.PI / 2, Math.PI / 2);
    this.ctx.stroke();

    // String
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(enemy.width / 2 + 5, -15);
    this.ctx.lineTo(enemy.width / 2 + 5, 15);
    this.ctx.stroke();
  }

  private drawGhost(enemy: Enemy) {
    const wobble = Math.sin(this.frameCount * 0.1) * 3;
    
    this.ctx.globalAlpha = 0.7;
    
    // Ghost body
    const gradient = this.ctx.createLinearGradient(0, -enemy.height / 2, 0, enemy.height / 2);
    gradient.addColorStop(0, '#e8eaf6');
    gradient.addColorStop(1, 'rgba(232, 234, 246, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, -5 + wobble, 15, Math.PI, 0);
    this.ctx.lineTo(15, enemy.height / 2);
    
    // Wavy bottom
    for (let i = 15; i >= -15; i -= 6) {
      this.ctx.quadraticCurveTo(i - 3, enemy.height / 2 + 5, i - 6, enemy.height / 2);
    }
    
    this.ctx.closePath();
    this.ctx.fill();

    // Eyes
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.beginPath();
    this.ctx.arc(-5, -5 + wobble, 4, 0, Math.PI * 2);
    this.ctx.arc(5, -5 + wobble, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawCrow(enemy: Enemy) {
    const flapY = Math.sin(this.frameCount * 0.3) * 5;
    
    // Body
    this.ctx.fillStyle = '#212121';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Wings
    this.ctx.beginPath();
    this.ctx.moveTo(-5, -5);
    this.ctx.quadraticCurveTo(-15, -15 + flapY, -20, -5 + flapY);
    this.ctx.lineTo(-5, 0);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(5, -5);
    this.ctx.quadraticCurveTo(15, -15 + flapY, 20, -5 + flapY);
    this.ctx.lineTo(5, 0);
    this.ctx.fill();

    // Beak
    this.ctx.fillStyle = '#ff9800';
    this.ctx.beginPath();
    this.ctx.moveTo(12, 0);
    this.ctx.lineTo(18, 2);
    this.ctx.lineTo(12, 4);
    this.ctx.closePath();
    this.ctx.fill();

    // Eye
    this.ctx.fillStyle = '#f44336';
    this.ctx.beginPath();
    this.ctx.arc(6, -2, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawParticle(particle: Particle) {
    const screenY = this.height - (particle.y - this.cameraY);
    const alpha = particle.life / particle.maxLife;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.translate(particle.x, screenY);

    switch (particle.type) {
      case 'dust':
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'spark':
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        break;

      case 'leaf':
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, particle.size, particle.size / 2, this.frameCount * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'star':
        this.drawStarShape(particle.size, particle.color);
        break;

      case 'trail':
        const trailGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
        trailGradient.addColorStop(0, particle.color);
        trailGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = trailGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        break;
    }

    this.ctx.restore();
  }

  private drawStarShape(size: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawHUD(score: number, coins: number, height: number, lives: number, level: number, timeRemaining: number, combo: number) {
    // Semi-transparent HUD background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.width, 60);

    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.textAlign = 'left';

    // Score
    this.ctx.fillStyle = '#ffd700';
    this.ctx.fillText(`SCORE: ${score}`, 15, 25);

    // Height
    this.ctx.fillStyle = '#64ffda';
    this.ctx.fillText(`HEIGHT: ${Math.floor(height)}m`, 15, 45);

    // Coins
    this.ctx.fillStyle = '#ffeb3b';
    this.ctx.fillText(`💰 ${coins}`, 180, 25);

    // Level
    this.ctx.fillStyle = '#ce93d8';
    this.ctx.fillText(`LVL ${level}`, 180, 45);

    // Lives
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f48fb1';
    let heartsText = '';
    for (let i = 0; i < lives; i++) heartsText += '❤️ ';
    this.ctx.fillText(heartsText.trim(), this.width - 15, 25);

    // Time
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = Math.floor(timeRemaining % 60);
    const timeColor = timeRemaining < 30 ? '#ff5252' : '#ffffff';
    this.ctx.fillStyle = timeColor;
    this.ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, this.width - 15, 45);

    // Combo display
    if (combo > 1) {
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 24px "Courier New", monospace';
      this.ctx.fillStyle = '#ff9800';
      this.ctx.fillText(`${combo}x COMBO!`, this.width / 2, 40);
    }
  }
}
