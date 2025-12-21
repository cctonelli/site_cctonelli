
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
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const isDark = document.documentElement.classList.contains('dark');
    const globeColor = isDark ? 0x3b82f6 : 0x1e40af;
    const pointColor = isDark ? 0x60a5fa : 0x3b82f6;

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: globeColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.3 : 0.2,
    });
    
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    const innerGeometry = new THREE.SphereGeometry(0.98, 64, 64);
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: isDark ? 0x0f172a : 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerSphere);

    const pointsGeometry = new THREE.BufferGeometry();
    const pointsCount = 1200;
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
      color: pointColor,
      size: 0.006,
      transparent: true,
      opacity: isDark ? 0.8 : 0.6
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    globe.add(points);

    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.5 : 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(pointColor, 2.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const animate = () => {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.0015;
      globe.rotation.x += 0.0003;
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

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const dark = document.documentElement.classList.contains('dark');
          material.color.setHex(dark ? 0x3b82f6 : 0x1e40af);
          innerMaterial.color.setHex(dark ? 0x0f172a : 0xffffff);
          pointsMaterial.color.setHex(dark ? 0x60a5fa : 0x3b82f6);
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full min-h-[400px]" />;
};

export default ThreeGlobe;
