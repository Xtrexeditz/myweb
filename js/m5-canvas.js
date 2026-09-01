/**
 * XTrex Velocity Canvas Engine - BMW M Edition
 * Authentic BMW M Colors: Crystal White, Electric Blue, Deep Navy, Vivid Red, Pure Black
 */

class M5VelocityCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.streamlines = [];
    this.particleCount = 150;
    this.streamlineCount = 20;
    
    this.speed = 1.3;
    this.targetSpeed = 1.3;
    this.baseSpeed = 1.3;
    this.acceleration = 0.08;
    this.friction = 0.94;
    
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };
    this.scrollVelocity = 0;
    this.lastScrollY = window.scrollY;
    
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      if (e.clientY <= rect.bottom + 100) {
        this.mouse.targetX = (e.clientX - window.innerWidth / 2) * 0.0008;
        this.mouse.targetY = (e.clientY - window.innerHeight / 2) * 0.0008;
        this.mouse.active = true;
      }
    });

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - this.lastScrollY);
      this.scrollVelocity = Math.min(delta * 0.16, 7.0);
      this.lastScrollY = currentScrollY;
    }, { passive: true });

    this.createParticles();
    this.createStreamlines();
    this.animate();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : window.innerWidth;
    this.height = this.canvas.parentElement ? this.canvas.parentElement.clientHeight : window.innerHeight;
    
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
    
    this.cx = this.width / 2;
    this.cy = this.height / 2;
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.resetParticle({}));
    }
  }

  resetParticle(p) {
    p.x = (Math.random() - 0.5) * this.width * 2.2;
    p.y = (Math.random() - 0.5) * this.height * 2.2;
    p.z = Math.random() * 1000 + 100;
    p.prevZ = p.z;
    p.length = Math.random() * 30 + 12;

    // Authentic BMW M Palette: Crystal White, Electric Light Blue, Dark Blue, Vivid Red
    const palette = [
      'rgba(255, 255, 255, ',    // Pure White
      'rgba(0, 153, 255, ',      // BMW M Light Blue
      'rgba(0, 51, 153, ',       // BMW M Dark Blue
      'rgba(255, 23, 68, ',      // BMW M Red
      'rgba(226, 232, 240, '     // Platinum White
    ];
    p.baseColor = palette[Math.floor(Math.random() * palette.length)];
    p.opacity = Math.random() * 0.7 + 0.25;
    p.thickness = Math.random() * 1.8 + 0.6;
    return p;
  }

  createStreamlines() {
    this.streamlines = [];
    const colors = [
      'rgba(0, 153, 255, ',  // Light Blue
      'rgba(0, 51, 153, ',   // Dark Blue
      'rgba(255, 23, 68, ',  // Red
      'rgba(255, 255, 255, ' // White
    ];
    for (let i = 0; i < this.streamlineCount; i++) {
      this.streamlines.push({
        angle: (i / this.streamlineCount) * Math.PI * 2,
        distance: Math.random() * (this.width * 0.4) + 80,
        speed: Math.random() * 0.002 + 0.001,
        phase: Math.random() * Math.PI * 2,
        length: Math.random() * 140 + 90,
        curveFactor: Math.random() * 40 - 20,
        color: colors[i % colors.length],
        opacity: Math.random() * 0.35 + 0.15
      });
    }
  }

  animate() {
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.targetSpeed = this.baseSpeed + this.scrollVelocity;
    this.speed += (this.targetSpeed - this.speed) * this.acceleration;
    this.scrollVelocity *= this.friction;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawAerodynamicGrid();

    const fov = 450;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.prevZ = p.z;
      p.z -= this.speed * 4.8;

      if (p.z <= 1) {
        this.resetParticle(p);
        p.z = 1000;
        p.prevZ = 1000;
      }

      const sx = (p.x / p.z) * fov + this.cx + this.mouse.x * (1000 - p.z);
      const sy = (p.y / p.z) * fov + this.cy + this.mouse.y * (1000 - p.z);
      
      const prevSx = (p.x / p.prevZ) * fov + this.cx + this.mouse.x * (1000 - p.prevZ);
      const prevSy = (p.y / p.prevZ) * fov + this.cy + this.mouse.y * (1000 - p.prevZ);

      const depthAlpha = Math.max(0, Math.min(1, (1000 - p.z) / 800)) * p.opacity;

      if (sx >= -100 && sx <= this.width + 100 && sy >= -100 && sy <= this.height + 100) {
        this.ctx.beginPath();
        this.ctx.moveTo(prevSx, prevSy);
        this.ctx.lineTo(sx, sy);
        this.ctx.strokeStyle = `${p.baseColor}${depthAlpha})`;
        this.ctx.lineWidth = Math.max(0.6, (1000 - p.z) / 600 * p.thickness * (this.speed > 3 ? 1.5 : 1));
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
      }
    }

    this.drawFluidStreamlines();
    requestAnimationFrame(() => this.animate());
  }

  drawAerodynamicGrid() {
    const horizon = this.height * 0.75 + this.mouse.y * 120;
    this.ctx.save();
    
    const grad = this.ctx.createLinearGradient(0, horizon - 80, 0, this.height);
    grad.addColorStop(0, 'rgba(5, 11, 20, 0.0)');
    grad.addColorStop(0.4, 'rgba(0, 153, 255, 0.03)');
    grad.addColorStop(1, 'rgba(255, 23, 68, 0.04)');
    
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, horizon, this.width, this.height - horizon);

    const lineCount = 18;
    for (let i = 0; i <= lineCount; i++) {
      const xRatio = i / lineCount;
      const startX = this.cx + (xRatio - 0.5) * this.width * 0.3 + this.mouse.x * 200;
      const endX = (xRatio - 0.5) * this.width * 2.4 + this.cx;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, horizon);
      this.ctx.lineTo(endX, this.height);
      this.ctx.strokeStyle = i % 3 === 0 ? 'rgba(0, 153, 255, 0.08)' : (i % 3 === 1 ? 'rgba(0, 51, 153, 0.06)' : 'rgba(255, 23, 68, 0.06)');
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawFluidStreamlines() {
    this.ctx.save();
    for (let s of this.streamlines) {
      s.phase += s.speed * (this.speed * 0.8);
      const angle = s.angle + Math.sin(s.phase) * 0.2;
      const x1 = this.cx + Math.cos(angle) * (s.distance * 0.4) + this.mouse.x * 60;
      const y1 = this.cy + Math.sin(angle) * (s.distance * 0.3) + this.mouse.y * 60;
      
      const cpX = x1 + Math.cos(angle + 0.5) * (s.length * 0.6);
      const cpY = y1 + Math.sin(angle + 0.5) * (s.length * 0.4) + s.curveFactor;
      
      const x2 = x1 + Math.cos(angle) * s.length;
      const y2 = y1 + Math.sin(angle) * (s.length * 0.8);

      const grad = this.ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, `${s.color}0)`);
      grad.addColorStop(0.5, `${s.color}${s.opacity})`);
      grad.addColorStop(1, `${s.color}0)`);

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.quadraticCurveTo(cpX, cpY, x2, y2);
      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = 1.4;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.m5Canvas = new M5VelocityCanvas('hero-canvas');
});
