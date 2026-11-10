import React, { useEffect, useRef } from 'react';

export default function GoldWaterSmoke() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle array
    const particles = [];
    const maxParticles = 120;

    // Track previous mouse position for velocity
    let prevMouse = { x: width / 2, y: height / 2 };
    let mouse = { x: width / 2, y: height / 2 };
    let isMoving = false;
    let moveTimeout;

    // Handle Resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Smoke Particle Class
    class SmokeParticle {
      constructor(x, y, vx, vy) {
        this.x = x + (Math.random() - 0.5) * 8;
        this.y = y + (Math.random() - 0.5) * 8;
        // Water drag & swirl velocity
        this.vx = vx * 0.25 + (Math.random() - 0.5) * 1.8;
        this.vy = vy * 0.25 + (Math.random() - 0.5) * 1.8 - 0.4; // slight fluid buoyancy
        this.radius = 8 + Math.random() * 10;
        this.maxRadius = 45 + Math.random() * 35;
        this.alpha = 0.55 + Math.random() * 0.25;
        this.decay = 0.012 + Math.random() * 0.008;
        this.growth = 0.9 + Math.random() * 0.8;
        this.rotation = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.03;
        // Golden palette
        const hues = [
          { r: 255, g: 215, b: 0 },    // Gold
          { r: 245, g: 158, b: 11 },   // Amber gold
          { r: 251, g: 191, b: 36 },   // Warm sun gold
          { r: 254, g: 240, b: 138 }   // Shimmering light gold
        ];
        this.color = hues[Math.floor(Math.random() * hues.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        // Water resistance dampening
        this.vx *= 0.96;
        this.vy *= 0.96;
        // Dissipate & expand like smoke in water
        this.radius = Math.min(this.maxRadius, this.radius + this.growth);
        this.alpha -= this.decay;
        this.rotation += this.spin;
      }

      draw(context) {
        if (this.alpha <= 0) return;
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.rotation);

        // Soft radial gradient for water-smoke diffusion
        const grad = context.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        const { r, g, b } = this.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.9})`);
        grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.45})`);
        grad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.15})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        context.fillStyle = grad;
        context.beginPath();
        context.arc(0, 0, this.radius, 0, Math.PI * 2);
        context.fill();

        context.restore();
      }
    }

    // Spawn smoke along the mouse path
    const spawnSmoke = (currentX, currentY, vx, vy) => {
      const count = Math.min(4, Math.max(2, Math.floor(Math.hypot(vx, vy) * 0.2)));
      for (let i = 0; i < count; i++) {
        if (particles.length < maxParticles) {
          particles.push(new SmokeParticle(currentX, currentY, vx, vy));
        }
      }
    };

    // Mouse Move Listener
    const handleMouseMove = (e) => {
      const currentX = e.clientX;
      const currentY = e.clientY;
      const vx = currentX - prevMouse.x;
      const vy = currentY - prevMouse.y;

      spawnSmoke(currentX, currentY, vx, vy);

      prevMouse = { x: currentX, y: currentY };
      mouse = { x: currentX, y: currentY };

      isMoving = true;
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isMoving = false;
      }, 100);
    };

    // Touch Support for mobile / touchpads
    const handleTouchMove = (e) => {
      if (!e.touches[0]) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const vx = currentX - prevMouse.x;
      const vy = currentY - prevMouse.y;

      spawnSmoke(currentX, currentY, vx, vy);
      prevMouse = { x: currentX, y: currentY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Animation Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 'screen' or 'lighter' blend mode creates the magical glowing smoke effect
      ctx.globalCompositeOperation = 'screen';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      clearTimeout(moveTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 w-full h-full"
      style={{
        mixBlendMode: 'screen'
      }}
    />
  );
}
