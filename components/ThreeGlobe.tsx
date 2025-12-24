
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup da Cena
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const isDark = document.documentElement.classList.contains('dark');
    const accentColor = new THREE.Color(isDark ? 0x1d4ed8 : 0x3b82f6);
    const sparkColor = new THREE.Color(0x60a5fa);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 2. Globo Estrutural (A Rede de Conexões)
    const globeGeom = new THREE.IcosahedronGeometry(2, 12);
    const globeMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.15 : 0.08,
      blending: THREE.AdditiveBlending
    });
    const globeMesh = new THREE.Mesh(globeGeom, globeMat);
    mainGroup.add(globeMesh);

    // 3. Sistema de Fagulhas (Sparks Network)
    const sparksCount = 10000;
    const positions = new Float32Array(sparksCount * 3);
    const originalPos = new Float32Array(sparksCount * 3);
    const speeds = new Float32Array(sparksCount);

    for (let i = 0; i < sparksCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = 2 + Math.random() * 0.5;
      
      const x = dist * Math.sin(phi) * Math.cos(theta);
      const y = dist * Math.sin(phi) * Math.sin(theta);
      const z = dist * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      originalPos[i * 3] = x;
      originalPos[i * 3 + 1] = y;
      originalPos[i * 3 + 2] = z;

      speeds[i] = 0.5 + Math.random() * 2.5;
    }

    const pointsGeom = new THREE.BufferGeometry();
    pointsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pointsMat = new THREE.PointsMaterial({
      color: sparkColor,
      size: 0.015,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const sparks = new THREE.Points(pointsGeom, pointsMat);
    mainGroup.add(sparks);

    // 4. Luz e Atmosfera
    const pointLight = new THREE.PointLight(accentColor, 10, 30);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();
      animationId = requestAnimationFrame(animate);
      
      mainGroup.rotation.y = time * 0.06;
      mainGroup.rotation.x = Math.sin(time * 0.05) * 0.1;

      // Dinâmica de pulsação orgânica
      const posArray = pointsGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < sparksCount; i++) {
        const i3 = i * 3;
        const pulse = Math.sin(time * speeds[i] + i) * 0.04;
        posArray[i3] = originalPos[i3] * (1 + pulse);
        posArray[i3 + 1] = originalPos[i3 + 1] * ( pulse); // Movimento vertical sutil
        posArray[i3 + 2] = originalPos[i3 + 2] * (1 + pulse);
      }
      pointsGeom.attributes.position.needsUpdate = true;
      pointsMat.opacity = 0.5 + Math.sin(time * 1.5) * 0.3;

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
    <div className="w-full h-full relative overflow-hidden pointer-events-none select-none">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default ThreeGlobe;
