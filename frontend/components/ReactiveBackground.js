'use client';
import { useEffect, useRef, useCallback } from 'react';

const PARTICLE_COUNT = 1000;
const PARTICLE_RADIUS = 2;
const ATTRACTION_RADIUS = 200;
const REPULSION_RADIUS = 60;
const BASE_SPEED = 0.8;
const ATTRACTION_STRENGTH = 0.25;
const REPULSION_STRENGTH = 0.4;

function createParticle(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * BASE_SPEED,
    vy: (Math.random() - 0.5) * BASE_SPEED,
    radius: PARTICLE_RADIUS + Math.random() * 1,
    baseVx: (Math.random() - 0.5) * BASE_SPEED,
    baseVy: (Math.random() - 0.5) * BASE_SPEED,
  };
}

export default function ReactiveBackground() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef(null);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const existing = particlesRef.current.length;
    const needed = PARTICLE_COUNT - existing;
    if (needed > 0) {
      for (let i = 0; i < needed; i++) {
        particlesRef.current.push(createParticle(canvas.width, canvas.height));
      }
    } else if (needed < 0) {
      particlesRef.current = particlesRef.current.slice(0, PARTICLE_COUNT);
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { x: mx, y: my } = mouseRef.current;

    for (const p of particlesRef.current) {
      const dx = mx - p.x;
      const dy = my - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ATTRACTION_RADIUS && dist > REPULSION_RADIUS) {
        const force = (ATTRACTION_RADIUS - dist) / ATTRACTION_RADIUS * ATTRACTION_STRENGTH;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      } else if (dist <= REPULSION_RADIUS && dist > 0) {
        const force = (REPULSION_RADIUS - dist) / REPULSION_RADIUS * REPULSION_STRENGTH;
        p.vx -= (dx / dist) * force;
        p.vy -= (dy / dist) * force;
      }

      p.vx += (p.baseVx - p.vx) * 0.03;
      p.vy += (p.baseVy - p.vy) * 0.03;

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > BASE_SPEED * 3) {
        p.vx = (p.vx / speed) * BASE_SPEED * 3;
        p.vy = (p.vy / speed) * BASE_SPEED * 3;
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) { p.x = canvas.width; p.baseVx = Math.abs(p.baseVx); }
      if (p.x > canvas.width) { p.x = 0; p.baseVx = -Math.abs(p.baseVx); }
      if (p.y < 0) { p.y = canvas.height; p.baseVy = Math.abs(p.baseVy); }
      if (p.y > canvas.height) { p.y = 0; p.baseVy = -Math.abs(p.baseVy); }

const isDark = document.documentElement.classList.contains('dark');
    const baseColor = isDark ? [199, 175, 255] : [99, 102, 241];
      const alpha = 0.4;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${baseColor.join(',')}, ${alpha})`;
      ctx.fill();
    }

    if (mx > 0 && my > 0) {
      const isDark = document.documentElement.classList.contains('dark');
      const ringColor = isDark ? 'rgba(139, 92, 246, 0.06)' : 'rgba(99, 102, 241, 0.08)';
      ctx.beginPath();
      ctx.arc(mx, my, ATTRACTION_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    resize();
    draw();

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [resize, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}