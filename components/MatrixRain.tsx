import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  color?: string;
  speed?: number;
  opacity?: number;
  fontSize?: number;
}

const MatrixRain: React.FC<MatrixRainProps> = ({ 
  color = '#2563eb', 
  speed = 1, 
  opacity = 0.15,
  fontSize = 14 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Caracteres extraídos do seu script Python V8 MATRIX
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()";
    const charArray = chars.split("");

    const columns = Math.floor(width / fontSize);
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -height / fontSize);
    }

    let animationId: number;
    let frameCount = 0;

    const draw = () => {
      // Ajuste de velocidade baseado no parâmetro speed
      frameCount++;
      if (frameCount % (speed < 1 ? 2 : 1) !== 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Efeito de fade
      ctx.fillStyle = `rgba(1, 3, 9, ${0.1 * (1/speed)})`;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = color;
      ctx.font = `${fontSize}px font-mono, monospace`;
      ctx.fontWeight = '900';

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Desenha a letra com glow sutil
        ctx.shadowBlur = 5;
        ctx.shadowColor = color;
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        ctx.shadowBlur = 0;

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
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
  }, [color, speed, fontSize]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  );
};

export default MatrixRain;