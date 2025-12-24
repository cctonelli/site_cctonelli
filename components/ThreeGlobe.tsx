
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Configuração Inicial
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const isDark = document.documentElement.classList.contains('dark');
    const accentColor = new THREE.Color(isDark ? 0x3b82f6 : 0x2563eb);
    const sparkColor = new THREE.Color(isDark ? 0x60a5fa : 0x3b82f6);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. GLOBO WIREFRAME (A REDE ESTRUTURAL)
    const globeGeom = new THREE.IcosahedronGeometry(1.6, 12);
    const globeMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.2 : 0.1,
      blending: THREE.AdditiveBlending
    });
    const globeMesh = new THREE.Mesh(globeGeom, globeMat);
    globeGroup.add(globeMesh);

    // 2. SISTEMA DE FAGULHAS (THE SPARKS)
    const sparksCount = 10000;
    const positions = new Float32Array(sparksCount * 3);
    const colors = new Float32Array(sparksCount * 3);
    const sizes = new Float32Array(sparksCount);
    const originalDist = new Float32Array(sparksCount);

    for (let i = 0; i < sparksCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = 1.6 + Math.random() * 0.3;
      originalDist[i] = dist;

      positions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = dist * Math.cos(phi);

      colors[i * 3] = sparkColor.r;
      colors[i * 3 + 1] = sparkColor.g;
      colors[i * 3 + 2] = sparkColor.b;

      sizes[i] = Math.random() * 1.5;
    }

    const sparksGeom = new THREE.BufferGeometry();
    sparksGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    sparksGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const sparksMat = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const sparksMesh = new THREE.Points(sparksGeom, sparksMat);
    globeGroup.add(sparksMesh);

    // ILUMINAÇÃO
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(accentColor, 2, 10);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // ANIMAÇÃO
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();
      animationId = requestAnimationFrame(animate);

      // Rotação suave
      globeGroup.rotation.y = time * 0.08;
      globeGroup.rotation.x = Math.sin(time * 0.1) * 0.1;

      // Pulsação das fagulhas
      sparksMat.opacity = 0.6 + Math.sin(time * 2) * 0.3;
      
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
    <div className="w-full h-full relative overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default ThreeGlobe;
