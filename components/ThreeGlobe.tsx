
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2.5; // Aproximado para preencher mais a tela

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const isDark = document.documentElement.classList.contains('dark');
    const globeColor = new THREE.Color(0x2563eb);
    const sparkColor = new THREE.Color(0x3b82f6);
    const coreColor = isDark ? 0x010309 : 0xffffff;

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. O GLOBO ESTRUTURAL (Wireframe)
    const geometry = new THREE.SphereGeometry(1.2, 50, 50);
    const material = new THREE.MeshPhongMaterial({
      color: globeColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.2 : 0.1,
    });
    const globe = new THREE.Mesh(geometry, material);
    mainGroup.add(globe);

    // 2. NÚCLEO SÓLIDO (Efeito Profundidade)
    const innerGeometry = new THREE.SphereGeometry(1.18, 50, 50);
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: coreColor,
      transparent: true,
      opacity: isDark ? 0.8 : 0.6,
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    mainGroup.add(innerSphere);

    // 3. A GRANDE REDE DE FAGULHAS (Sparks System)
    const pointsCount = 6000; // Mais fagulhas para visibilidade
    const positions = new Float32Array(pointsCount * 3);
    const sizes = new Float32Array(pointsCount);

    for (let i = 0; i < pointsCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const dist = 1.21 + Math.random() * 0.2;
      
      positions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = dist * Math.cos(phi);
      
      sizes[i] = Math.random() * 2;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      color: sparkColor,
      size: 0.015,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const sparks = new THREE.Points(pointsGeometry, pointsMaterial);
    mainGroup.add(sparks);

    // ILUMINAÇÃO
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.5 : 1);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x2563eb, 3);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      animationId = requestAnimationFrame(animate);
      
      mainGroup.rotation.y += 0.0015; // Rotação ligeiramente mais rápida
      mainGroup.rotation.x += 0.0003;

      // Efeito de pulsação nas fagulhas
      pointsMaterial.opacity = 0.6 + Math.sin(elapsedTime * 1.5) * 0.3;
      
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
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full min-h-screen" />
    </div>
  );
};

export default ThreeGlobe;
