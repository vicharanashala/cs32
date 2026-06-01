'use client';
import { useEffect, useRef, memo, useState } from 'react';
import './DotField.css';

const TWO_PI = Math.PI * 2;

const DotField = memo(({
  dotRadius = 1.5,
  dotSpacing = 16,
  className,
  ...rest
}) => {
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const isDarkRef = useRef(false);

  // Read theme on mount and observe mutations
  useEffect(() => {
    isDarkRef.current = document.documentElement.classList.contains('dark');
    const observer = new MutationObserver(() => {
      isDarkRef.current = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let resizeTimer;

    function resize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    }

    function doResize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = {
        w,
        h,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY,
      };

      buildDots(w, h);
    }

    function buildDots(w, h) {
      const step = dotRadius + dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = padX + col * step + step / 2;
          const y = padY + row * step + step / 2;
          dots.push({ x, y });
        }
      }
      dotsRef.current = dots;
    }

    function onMouseMove(e) {
      const s = sizeRef.current;
      mouseRef.current.x = e.pageX - s.offsetX;
      mouseRef.current.y = e.pageY - s.offsetY;
    }

    function onMouseLeave() {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    }

    function tick() {
      const dots = dotsRef.current;
      const m = mouseRef.current;
      const { w, h } = sizeRef.current;
      const len = dots.length;

      ctx.clearRect(0, 0, w, h);

      const isDark = isDarkRef.current;
      const baseOpacity = isDark ? 0.05 : 0.04;
      const activeOpacityBoost = isDark ? 0.35 : 0.25;
      const dotColor = isDark ? '255, 255, 255' : '99, 102, 241'; // white in dark, indigo in light
      const glowColor = isDark ? '99, 102, 241' : '79, 70, 229'; // Indigo primary

      // 1. Draw a soft interactive ambient glow behind the cursor
      if (m.x !== -9999 && m.y !== -9999) {
        const glowRadius = 380;
        const glowGrad = ctx.createRadialGradient(
          m.x, m.y, 0,
          m.x, m.y, glowRadius
        );
        glowGrad.addColorStop(0, `rgba(${glowColor}, ${isDark ? 0.08 : 0.05})`);
        glowGrad.addColorStop(0.5, `rgba(${glowColor}, ${isDark ? 0.025 : 0.015})`);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, glowRadius, 0, TWO_PI);
        ctx.fill();
      }

      const cr = 160; // spotlight radius for interactive dots
      const crSq = cr * cr;
      const baseRad = dotRadius * (isDark ? 1.0 : 0.85);

      // 2. Draw the base grid of dots in one single batch (incredibly fast)
      ctx.fillStyle = `rgba(${dotColor}, ${baseOpacity})`;
      ctx.beginPath();
      for (let i = 0; i < len; i++) {
        const d = dots[i];
        ctx.moveTo(d.x + baseRad, d.y);
        ctx.arc(d.x, d.y, baseRad, 0, TWO_PI);
      }
      ctx.fill();

      // 3. Draw active/glowing dots near the mouse on top
      if (m.x !== -9999 && m.y !== -9999) {
        for (let i = 0; i < len; i++) {
          const d = dots[i];
          const dx = m.x - d.x;
          const dy = m.y - d.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < crSq) {
            const dist = Math.sqrt(distSq);
            const ratio = 1 - dist / cr; // 0 to 1
            const easeRatio = ratio * ratio * ratio; // Cubic curve for steeper focus falloff
            const activeRad = baseRad * (1 + easeRatio * 0.9);
            const activeOpacity = baseOpacity + easeRatio * activeOpacityBoost;

            ctx.fillStyle = `rgba(${dotColor}, ${activeOpacity})`;
            ctx.beginPath();
            ctx.arc(d.x, d.y, activeRad, 0, TWO_PI);
            ctx.fill();
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    doResize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [dotRadius, dotSpacing]);

  return (
    <div className={`dot-field-container ${className || ''}`} {...rest}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
});

DotField.displayName = 'DotField';

export default DotField;