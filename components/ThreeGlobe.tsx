
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const isDark = document.documentElement.classList.contains('dark');
    const globeColor = new THREE.Color(isDark ? 0x2563eb : 0x3b82f6);
    const sparkColor = new THREE.Color(isDark ? 0x60a5fa : 0x2563eb);
    
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. GLOBO WIREFRAME (A "REDE" BASE)
    const geometry = new THREE.IcosahedronGeometry(1.5, 15);
    const material = new THREE.MeshPhongMaterial({
      color: globeColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.25 : 0.15,
      blending: THREE.AdditiveBlending
    });
    const globe = new THREE.Mesh(geometry, material);
    mainGroup.add(globe);

    // 2. SISTEMA DE FAGULHAS DINÂMICAS (SPARKS)
    const sparksCount = 8000;
    const positions = new Float32Array(sparksCount * 3);
    const originalPositions = new Float32Array(sparksCount * 3);
    const velocities = new Float32Array(sparksCount);

    for (let i = 0; i < sparksCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Raio base ligeiramente flutuante
      const dist = 1.5 + Math.random() * 0.1;
      
      const x = dist * Math.sin(phi) * Math.cos(theta);
      const y = dist * Math.sin(phi) * Math.sin(theta);
      const z = dist * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      velocities[i] = 0.5 + Math.random() * 2.5;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      color: sparkColor,
      size: 0.015,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const sparks = new THREE.Points(pointsGeometry, pointsMaterial);
    mainGroup.add(sparks);

    // 3. ATMOSFERA / GLOW INTERNO
    const glowGeometry = new THREE.SphereGeometry(1.45, 32, 32);
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: globeColor,
      transparent: true,
      opacity: isDark ? 0.05 : 0.02,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mainGroup.add(glow);

    // ILUMINAÇÃO
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.5 : 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x2563eb, isDark ? 10 : 5);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const secondaryLight = new THREE.PointLight(0x60a5fa, 5);
    secondaryLight.position.set(-10, -10, -10);
    scene.add(secondaryLight);

    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();
      animationId = requestAnimationFrame(animate);
      
      // Rotação majestosa
      mainGroup.rotation.y = time * 0.1;
      mainGroup.rotation.x = Math.sin(time * 0.05) * 0.1;

      // Animação das fagulhas (pulsação e leve jitter)
      const posArray = pointsGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < sparksCount; i++) {
        const i3 = i * 3;
        const pulse = Math.sin(time * velocities[i] + i) * 0.02;
        
        // As fagulhas "respiram" em relação à superfície original
        posArray[i3] = originalPositions[i3] * (1 + pulse);
        posArray[i3 + 1] = originalPositions[i3 + 1] * (1 + pulse);
        posArray[i3 + 2] = originalPositions[i3 + 2] * (1 + pulse);
      }
      pointsGeometry.attributes.position.needsUpdate = true;
      
      // Pulsação de opacidade global das fagulhas
      pointsMaterial.opacity = 0.5 + Math.sin(time * 2) * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default ThreeGlobe;
