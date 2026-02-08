// Aurora Bands — flowing ribbons of translucent color
// Soft green/teal bands that undulate like northern lights on a light background

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const canvas = document.getElementById('flow-field');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  let width, height;
  let bands = [];
  let time = 0;
  let animationId;

  // Noise engine
  const noise = {
    perm: [],
    grad: [],

    init() {
      for (let i = 0; i < 256; i++) {
        this.perm[i] = i;
        this.grad[i] = Math.random() * 2 - 1;
      }
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
      }
      for (let i = 0; i < 256; i++) {
        this.perm[256 + i] = this.perm[i];
        this.grad[256 + i] = this.grad[i];
      }
    },

    fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    },

    lerp(a, b, t) {
      return a + t * (b - a);
    },

    get(x, y, z) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      const u = this.fade(x), v = this.fade(y), w = this.fade(z);
      const A = this.perm[X] + Y, AA = this.perm[A] + Z, AB = this.perm[A + 1] + Z;
      const B = this.perm[X + 1] + Y, BA = this.perm[B] + Z, BB = this.perm[B + 1] + Z;
      return this.lerp(
        this.lerp(
          this.lerp(this.grad[AA], this.grad[BA], u),
          this.lerp(this.grad[AB], this.grad[BB], u), v),
        this.lerp(
          this.lerp(this.grad[AA + 1], this.grad[BA + 1], u),
          this.lerp(this.grad[AB + 1], this.grad[BB + 1], u), v),
        w);
    }
  };

  const bandDefs = [
    { r: 56,  g: 200, b: 97,  alpha: 0.22, width: 0.35, yBase: 0.12, speed: 1.0,  freq: 1.0,  amp: 0.10  },
    { r: 34,  g: 197, b: 152, alpha: 0.18, width: 0.30, yBase: 0.25, speed: 0.7,  freq: 1.3,  amp: 0.12  },
    { r: 16,  g: 185, b: 129, alpha: 0.25, width: 0.40, yBase: 0.38, speed: 0.5,  freq: 0.8,  amp: 0.14  },
    { r: 72,  g: 190, b: 220, alpha: 0.16, width: 0.28, yBase: 0.50, speed: 0.9,  freq: 1.1,  amp: 0.11  },
    { r: 99,  g: 220, b: 130, alpha: 0.20, width: 0.38, yBase: 0.62, speed: 0.6,  freq: 0.9,  amp: 0.13  },
    { r: 45,  g: 160, b: 200, alpha: 0.15, width: 0.25, yBase: 0.72, speed: 1.1,  freq: 1.4,  amp: 0.09  },
    { r: 110, g: 230, b: 183, alpha: 0.18, width: 0.32, yBase: 0.85, speed: 0.8,  freq: 1.0,  amp: 0.12  },
  ];

  class Band {
    constructor(def) {
      this.r = def.r;
      this.g = def.g;
      this.b = def.b;
      this.alpha = def.alpha;
      this.bandWidth = def.width;
      this.yBase = def.yBase;
      this.speed = def.speed;
      this.freq = def.freq;
      this.amp = def.amp;
      this.noiseOffset = Math.random() * 1000;
    }

    draw() {
      const steps = Math.ceil(width / 3);
      const t = time * 0.002 * this.speed;
      const bandH = this.bandWidth * height;

      // Build the top edge path
      ctx.beginPath();
      ctx.moveTo(0, height);

      const topPoints = [];
      const botPoints = [];

      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const xNorm = i / steps;

        // Layer multiple noise octaves for organic movement
        const n1 = noise.get(xNorm * this.freq * 2 + this.noiseOffset, t, 0);
        const n2 = noise.get(xNorm * this.freq * 4 + this.noiseOffset + 50, t * 1.5, 0.5) * 0.5;
        const n3 = noise.get(xNorm * this.freq * 8 + this.noiseOffset + 100, t * 0.7, 1.0) * 0.25;

        const waveOffset = (n1 + n2 + n3) * this.amp * height;
        const yCenter = this.yBase * height + waveOffset;

        // Band thickness also undulates slightly
        const thickNoise = noise.get(xNorm * 3 + this.noiseOffset + 200, t * 0.5, 2.0);
        const localThick = bandH * (0.8 + thickNoise * 0.4);

        topPoints.push({ x, y: yCenter - localThick / 2 });
        botPoints.push({ x, y: yCenter + localThick / 2 });
      }

      // Draw filled band shape with gradient
      const avgTopY = topPoints.reduce((s, p) => s + p.y, 0) / topPoints.length;
      const avgBotY = botPoints.reduce((s, p) => s + p.y, 0) / botPoints.length;

      const gradient = ctx.createLinearGradient(0, avgTopY, 0, avgBotY);
      gradient.addColorStop(0,   `rgba(${this.r}, ${this.g}, ${this.b}, 0)`);
      gradient.addColorStop(0.2, `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alpha * 0.6})`);
      gradient.addColorStop(0.5, `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alpha})`);
      gradient.addColorStop(0.8, `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alpha * 0.6})`);
      gradient.addColorStop(1,   `rgba(${this.r}, ${this.g}, ${this.b}, 0)`);

      ctx.beginPath();
      // Top edge left to right
      ctx.moveTo(topPoints[0].x, topPoints[0].y);
      for (let i = 1; i < topPoints.length; i++) {
        const prev = topPoints[i - 1];
        const curr = topPoints[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
      }
      ctx.lineTo(topPoints[topPoints.length - 1].x, topPoints[topPoints.length - 1].y);

      // Bottom edge right to left
      for (let i = botPoints.length - 1; i >= 0; i--) {
        if (i === botPoints.length - 1) {
          ctx.lineTo(botPoints[i].x, botPoints[i].y);
          continue;
        }
        const prev = botPoints[i + 1];
        const curr = botPoints[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
      }

      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  function createBands() {
    bands = bandDefs.map(def => new Band(def));
  }

  // Render at half resolution — CSS stretches to full viewport,
  // creating a natural soft-focus effect that makes bands look atmospheric
  function resize() {
    width = Math.ceil(window.innerWidth * 0.5);
    height = Math.ceil(window.innerHeight * 0.5);
    canvas.width = width;
    canvas.height = height;
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (const band of bands) {
      band.draw();
    }

    time++;
    animationId = requestAnimationFrame(animate);
  }

  function init() {
    noise.init();
    resize();
    createBands();
    animate();
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resize();
    }, 200);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });

  init();
})();
