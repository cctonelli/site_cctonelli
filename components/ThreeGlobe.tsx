
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
    camera.position.z = 2.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const isDark = document.documentElement.classList.contains('dark');
    const globeColor = 0x2563eb;
    const coreColor = isDark ? 0x010309 : 0xffffff;

    // Outer Glow / Atmosphere
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: globeColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.15 : 0.1,
    });
    
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Solid Core
    const innerGeometry = new THREE.SphereGeometry(0.99, 64, 64);
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: coreColor,
      transparent: true,
      opacity: 0.8,
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerSphere);

    // Strategic Points (Data Visualization Style)
    const pointsGeometry = new THREE.BufferGeometry();
    const pointsCount = 2000;
    const positions = new Float32Array(pointsCount * 3);
    for (let i = 0; i < pointsCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const pointsMaterial = new THREE.PointsMaterial({
      color: globeColor,
      size: 0.005,
      transparent: true,
      opacity: isDark ? 0.9 : 0.7,
      sizeAttenuation: true
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    globe.add(points);

    // High-end Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.3 : 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.SpotLight(0xffffff, 2);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const blueLight = new THREE.PointLight(0x2563eb, 3, 10);
    blueLight.position.set(-2, 1, 2);
    scene.add(blueLight);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      globe.rotation.y += 0.0012;
      globe.rotation.x += 0.0002;
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
    <div className="relative w-full h-full flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full min-h-[500px]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-brand-navy via-transparent to-brand-navy opacity-40"></div>
    </div>
  );
};

export default ThreeGlobe;
