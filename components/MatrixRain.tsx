
import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  color?: string;
  speed?: number;
  opacity?: number;
  fontSize?: number;
  density?: number; // 0.1 to 1
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

  // Níveis de densidade baseados na intensidade - moved outside useEffect to fix 'Cannot find name actualDensity' in dependency array
  const actualDensity = intensity === 'ultra' ? 0.995 : intensity === 'high' ? 0.99 : density;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Katakana + Alpha + Special (V8 Matrix Signature)
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?";
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
      // Ajuste de frame skipping para velocidade
      const skipFrames = speed < 0.5 ? 4 : speed < 1 ? 2 : 1;
      if (frameCount % skipFrames !== 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Rastro persistente
      ctx.fillStyle = `rgba(1, 3, 9, ${0.1 * (1/speed)})`;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = color;
      ctx.font = `${fontSize}px font-mono, monospace`;
      ctx.fontWeight = '900';

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Glow dinâmico baseado na intensidade
        if (intensity !== 'normal') {
          ctx.shadowBlur = intensity === 'ultra' ? 12 : 6;
          ctx.shadowColor = color;
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        ctx.shadowBlur = 0;

        // Reset dos pingos
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
      const newColumns = Math.floor(width / fontSize);
      if (newColumns > drops.length) {
        for (let i = drops.length; i < newColumns; i++) {
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

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  );
};

export default MatrixRain;
