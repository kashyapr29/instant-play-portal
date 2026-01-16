// Galaxy Rider Renderer

import { 
  PlayerState, Block, Particle, Trail, GameState, Level,
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE 
} from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private screenShake = 0;
  private shakeX = 0;
  private shakeY = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  shake(intensity: number = 8) {
    this.screenShake = intensity;
  }

  updateShake() {
    if (this.screenShake > 0) {
      this.shakeX = (Math.random() - 0.5) * this.screenShake;
      this.shakeY = (Math.random() - 0.5) * this.screenShake;
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) this.screenShake = 0;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  clear(background: string) {
    this.ctx.save();
    this.ctx.translate(this.shakeX, this.shakeY);
    
    // Draw gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    const colors = background.match(/#[0-9a-fA-F]{6}/g) || ['#1a1a2e', '#16213e', '#0f3460'];
    colors.forEach((color, i) => {
      gradient.addColorStop(i / (colors.length - 1), color);
    });
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(-10, -10, CANVAS_WIDTH + 20, CANVAS_HEIGHT + 20);
    
    // Draw stars
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 173 + Date.now() * 0.01) % CANVAS_WIDTH;
      const y = (i * 91) % CANVAS_HEIGHT;
      const size = (i % 3) + 1;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  renderBlocks(blocks: Block[], cameraX: number, cameraY: number) {
    blocks.forEach(block => {
      const screenX = block.x - cameraX;
      const screenY = block.y - cameraY;
      
      // Skip if off screen
      if (screenX + block.width < -50 || screenX > CANVAS_WIDTH + 50) return;
      if (screenY + block.height < -50 || screenY > CANVAS_HEIGHT + 50) return;

      this.ctx.save();
      
      switch (block.type) {
        case 'normal':
          // Neon platform
          this.ctx.fillStyle = '#2a2a4a';
          this.ctx.fillRect(screenX, screenY, block.width, block.height);
          this.ctx.strokeStyle = '#00ffff';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(screenX, screenY, block.width, block.height);
          // Glow effect
          this.ctx.shadowColor = '#00ffff';
          this.ctx.shadowBlur = 10;
          this.ctx.strokeRect(screenX, screenY, block.width, block.height);
          break;
          
        case 'spike':
          this.ctx.fillStyle = '#ff3366';
          const spikeCount = Math.floor(block.width / 15);
          for (let i = 0; i < spikeCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + i * 15, screenY + block.height);
            this.ctx.lineTo(screenX + i * 15 + 7.5, screenY);
            this.ctx.lineTo(screenX + i * 15 + 15, screenY + block.height);
            this.ctx.fill();
          }
          break;
          
        case 'rubber':
          this.ctx.fillStyle = '#ff6600';
          this.ctx.fillRect(screenX, screenY, block.width, block.height);
          this.ctx.strokeStyle = '#ffaa00';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(screenX, screenY, block.width, block.height);
          // Bouncy pattern
          this.ctx.strokeStyle = '#ffcc00';
          this.ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(screenX + block.width/2, screenY + block.height/2, 
              10 + i * 8, 0, Math.PI * 2);
            this.ctx.stroke();
          }
          break;
          
        case 'blackhole':
          // Animated black hole
          const time = Date.now() * 0.003;
          const gradient = this.ctx.createRadialGradient(
            screenX + block.width/2, screenY + block.height/2, 0,
            screenX + block.width/2, screenY + block.height/2, block.width/2
          );
          gradient.addColorStop(0, '#000000');
          gradient.addColorStop(0.5, '#330066');
          gradient.addColorStop(1, 'transparent');
          this.ctx.fillStyle = gradient;
          this.ctx.beginPath();
          this.ctx.arc(screenX + block.width/2, screenY + block.height/2, 
            block.width/2 + Math.sin(time) * 5, 0, Math.PI * 2);
          this.ctx.fill();
          // Spiral effect
          this.ctx.strokeStyle = '#9933ff';
          this.ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(screenX + block.width/2, screenY + block.height/2,
              10 + i * 10 + Math.sin(time + i) * 5, time + i, time + i + Math.PI);
            this.ctx.stroke();
          }
          break;
          
        case 'boost':
          this.ctx.fillStyle = '#00ff00';
          this.ctx.fillRect(screenX, screenY, block.width, block.height);
          // Arrow pattern
          this.ctx.fillStyle = '#00aa00';
          const arrowY = (Date.now() * 0.01) % 20;
          for (let i = 0; i < 3; i++) {
            const ay = screenY + 10 + i * 25 + arrowY;
            if (ay < screenY + block.height - 10) {
              this.ctx.beginPath();
              this.ctx.moveTo(screenX + 10, ay + 10);
              this.ctx.lineTo(screenX + block.width/2, ay);
              this.ctx.lineTo(screenX + block.width - 10, ay + 10);
              this.ctx.fill();
            }
          }
          break;
          
        case 'gravity_flip':
          const gTime = Date.now() * 0.005;
          this.ctx.fillStyle = '#9900ff';
          this.ctx.fillRect(screenX, screenY, block.width, block.height);
          // Flip arrows
          this.ctx.strokeStyle = '#cc66ff';
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.moveTo(screenX + block.width/2, screenY + 10);
          this.ctx.lineTo(screenX + block.width/2, screenY + block.height - 10);
          this.ctx.moveTo(screenX + block.width/2 - 10, screenY + 20);
          this.ctx.lineTo(screenX + block.width/2, screenY + 10);
          this.ctx.lineTo(screenX + block.width/2 + 10, screenY + 20);
          this.ctx.moveTo(screenX + block.width/2 - 10, screenY + block.height - 20);
          this.ctx.lineTo(screenX + block.width/2, screenY + block.height - 10);
          this.ctx.lineTo(screenX + block.width/2 + 10, screenY + block.height - 20);
          this.ctx.stroke();
          // Glow pulse
          this.ctx.shadowColor = '#cc66ff';
          this.ctx.shadowBlur = 10 + Math.sin(gTime) * 5;
          this.ctx.stroke();
          break;
          
        case 'checkpoint':
          this.ctx.fillStyle = '#ffff00';
          this.ctx.fillRect(screenX, screenY, block.width, block.height);
          this.ctx.strokeStyle = '#ffaa00';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(screenX, screenY, block.width, block.height);
          // Flag icon
          this.ctx.fillStyle = '#ffffff';
          this.ctx.fillRect(screenX + 10, screenY + 5, 3, 40);
          this.ctx.fillStyle = '#ff0000';
          this.ctx.beginPath();
          this.ctx.moveTo(screenX + 13, screenY + 5);
          this.ctx.lineTo(screenX + 35, screenY + 15);
          this.ctx.lineTo(screenX + 13, screenY + 25);
          this.ctx.fill();
          break;
          
        case 'finish':
          // Finish flag with animation
          const fTime = Date.now() * 0.01;
          this.ctx.fillStyle = '#ffd700';
          this.ctx.fillRect(screenX, screenY, block.width, block.height);
          // Checkered pattern
          const gridSize = 8;
          for (let gx = 0; gx < block.width / gridSize; gx++) {
            for (let gy = 0; gy < block.height / gridSize; gy++) {
              if ((gx + gy) % 2 === 0) {
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(
                  screenX + gx * gridSize, 
                  screenY + gy * gridSize, 
                  gridSize, gridSize
                );
              }
            }
          }
          // Glow
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 15 + Math.sin(fTime) * 5;
          this.ctx.strokeStyle = '#ffd700';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(screenX, screenY, block.width, block.height);
          break;
          
        case 'ramp':
          this.ctx.fillStyle = '#00aaff';
          this.ctx.beginPath();
          this.ctx.moveTo(screenX, screenY + block.height);
          this.ctx.lineTo(screenX + block.width, screenY);
          this.ctx.lineTo(screenX + block.width, screenY + block.height);
          this.ctx.fill();
          this.ctx.strokeStyle = '#66ccff';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          break;
      }
      
      this.ctx.restore();
    });
  }

  renderPlayer(player: PlayerState, cameraX: number, cameraY: number, gravityFlipped: boolean) {
    const screenX = player.x - cameraX;
    const screenY = player.y - cameraY;
    
    this.ctx.save();
    this.ctx.translate(screenX + PLAYER_SIZE/2, screenY + PLAYER_SIZE/2);
    this.ctx.rotate(player.rotation);
    
    // Glowing spacecraft
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, PLAYER_SIZE);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(0.5, '#0066ff');
    gradient.addColorStop(1, '#000066');
    
    this.ctx.fillStyle = gradient;
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 15;
    
    // Main body - hexagonal ship
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
      const x = Math.cos(angle) * PLAYER_SIZE / 2;
      const y = Math.sin(angle) * PLAYER_SIZE / 2;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fill();
    
    // Inner core
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Engine trail
    if (Math.abs(player.vx) > 1 || player.isJumping) {
      const trailDir = gravityFlipped ? -1 : 1;
      this.ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
      this.ctx.beginPath();
      this.ctx.moveTo(-5, PLAYER_SIZE/2 * trailDir);
      this.ctx.lineTo(0, (PLAYER_SIZE/2 + 15 + Math.random() * 10) * trailDir);
      this.ctx.lineTo(5, PLAYER_SIZE/2 * trailDir);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  renderTrails(trails: Trail[], cameraX: number, cameraY: number) {
    trails.forEach(trail => {
      const alpha = 1 - trail.age / 20;
      if (alpha <= 0) return;
      
      const screenX = trail.x - cameraX;
      const screenY = trail.y - cameraY;
      
      this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, 3 * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  renderParticles(particles: Particle[], cameraX: number, cameraY: number) {
    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      const screenX = p.x - cameraX;
      const screenY = p.y - cameraY;
      
      this.ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  renderHUD(time: number, level: number, attempts: number, gravityFlipped: boolean) {
    this.ctx.save();
    
    // Semi-transparent HUD background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 200, 80);
    
    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'left';
    
    // Time
    const mins = Math.floor(time / 60);
    const secs = (time % 60).toFixed(2);
    this.ctx.fillText(`TIME: ${mins}:${secs.padStart(5, '0')}`, 20, 35);
    
    // Level
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillText(`LEVEL ${level}`, 20, 60);
    
    // Attempts
    this.ctx.fillStyle = '#ff6666';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`Attempts: ${attempts}`, 20, 80);
    
    // Gravity indicator
    if (gravityFlipped) {
      this.ctx.fillStyle = '#ff00ff';
      this.ctx.font = 'bold 16px monospace';
      this.ctx.fillText('⬆ FLIPPED', CANVAS_WIDTH - 100, 30);
    }
    
    this.ctx.restore();
  }

  renderCountdown(countdown: number) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const num = Math.ceil(countdown);
    const scale = 1 + (countdown % 1) * 0.5;
    
    this.ctx.font = `bold ${80 * scale}px monospace`;
    this.ctx.fillStyle = num > 0 ? '#00ffff' : '#00ff00';
    this.ctx.shadowColor = this.ctx.fillStyle;
    this.ctx.shadowBlur = 20;
    
    const text = num > 0 ? num.toString() : 'GO!';
    this.ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    this.ctx.restore();
  }

  renderComplete(time: number, bestTime: number | undefined, isNewBest: boolean, stars: number) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Title
    this.ctx.font = 'bold 48px monospace';
    this.ctx.fillStyle = '#00ff00';
    this.ctx.shadowColor = '#00ff00';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('LEVEL COMPLETE!', CANVAS_WIDTH / 2, 150);
    
    // Stars
    const starY = 220;
    for (let i = 0; i < 3; i++) {
      const filled = i < stars;
      this.ctx.font = '50px monospace';
      this.ctx.fillStyle = filled ? '#ffd700' : '#444444';
      this.ctx.shadowColor = filled ? '#ffd700' : 'transparent';
      this.ctx.shadowBlur = filled ? 15 : 0;
      this.ctx.fillText('★', CANVAS_WIDTH / 2 - 60 + i * 60, starY);
    }
    
    // Time
    const mins = Math.floor(time / 60);
    const secs = (time % 60).toFixed(2);
    this.ctx.font = 'bold 32px monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = 'transparent';
    this.ctx.fillText(`TIME: ${mins}:${secs.padStart(5, '0')}`, CANVAS_WIDTH / 2, 300);
    
    // New best indicator
    if (isNewBest) {
      this.ctx.font = 'bold 24px monospace';
      this.ctx.fillStyle = '#ff00ff';
      this.ctx.shadowColor = '#ff00ff';
      this.ctx.shadowBlur = 15;
      this.ctx.fillText('★ NEW BEST TIME! ★', CANVAS_WIDTH / 2, 350);
    } else if (bestTime) {
      const bMins = Math.floor(bestTime / 60);
      const bSecs = (bestTime % 60).toFixed(2);
      this.ctx.font = '20px monospace';
      this.ctx.fillStyle = '#888888';
      this.ctx.fillText(`Best: ${bMins}:${bSecs.padStart(5, '0')}`, CANVAS_WIDTH / 2, 350);
    }
    
    // Instructions
    this.ctx.font = '18px monospace';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowColor = 'transparent';
    this.ctx.fillText('Press SPACE for next level', CANVAS_WIDTH / 2, 450);
    this.ctx.fillText('Press R to retry', CANVAS_WIDTH / 2, 480);
    
    this.ctx.restore();
  }

  end() {
    this.ctx.restore();
  }
}
