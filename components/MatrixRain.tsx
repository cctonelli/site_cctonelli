
import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  color?: string;
  speed?: number;
  opacity?: number;
  fontSize?: number;
  density?: number; 
  intensity?: 'normal' | 'high' | 'ultra';
}

const MatrixRain: React.FC<MatrixRainProps> = ({ 
  color = '#2563eb', 
  speed = 1.5, 
  opacity = 0.15,
  fontSize = 14,
  density = 0.98,
  intensity = 'normal'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actualDensity = intensity === 'ultra' ? 0.998 : intensity === 'high' ? 0.99 : density;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const charArray = chars.split("");
    const columns = Math.floor(width / fontSize);
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -height / fontSize);
    }

    let animationId: number;
    let frameCount = 0;

    const draw = () => {
      frameCount++;
      const skipFrames = speed < 0.5 ? 3 : 1;
      if (frameCount % skipFrames !== 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Rastro mais longo para efeito imersivo
      ctx.fillStyle = `rgba(1, 3, 9, ${intensity === 'ultra' ? 0.05 : 0.08})`;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = color;
      ctx.font = `900 ${fontSize}px font-mono, monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Brilho Neon Master
        if (intensity === 'ultra') {
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        ctx.shadowBlur = 0;

        if (drops[i] * fontSize > height && Math.random() > actualDensity) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const newCols = Math.floor(width / fontSize);
      if (newCols > drops.length) {
        for (let i = drops.length; i < newCols; i++) {
          drops[i] = Math.floor(Math.random() * -height / fontSize);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [color, speed, fontSize, actualDensity, intensity]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" style={{ opacity }} />;
};

export default MatrixRain;
