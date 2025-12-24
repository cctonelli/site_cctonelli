
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
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const isDark = document.documentElement.classList.contains('dark');
    const globeColor = new THREE.Color(0x2563eb);
    const sparkColor = new THREE.Color(0x60a5fa);
    const coreColor = isDark ? 0x010309 : 0xffffff;

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. O GLOBO ESTRUTURAL (Wireframe)
    const geometry = new THREE.SphereGeometry(1.2, 48, 48);
    const material = new THREE.MeshPhongMaterial({
      color: globeColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.15 : 0.1,
    });
    const globe = new THREE.Mesh(geometry, material);
    mainGroup.add(globe);

    // 2. NÚCLEO SÓLIDO (Efeito Profundidade)
    const innerGeometry = new THREE.SphereGeometry(1.19, 48, 48);
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: coreColor,
      transparent: true,
      opacity: 0.7,
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    mainGroup.add(innerSphere);

    // 3. A GRANDE REDE DE FAGULHAS (Sparks System)
    const pointsCount = 4000;
    const positions = new Float32Array(pointsCount * 3);
    const sizes = new Float32Array(pointsCount);
    const randomOffsets = new Float32Array(pointsCount);

    for (let i = 0; i < pointsCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Partículas levemente acima da superfície para parecerem "fagulhas flutuantes"
      const dist = 1.22 + Math.random() * 0.15;
      
      positions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = dist * Math.cos(phi);
      
      sizes[i] = Math.random() * 0.015;
      randomOffsets[i] = Math.random() * Math.PI * 2;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const pointsMaterial = new THREE.PointsMaterial({
      color: sparkColor,
      size: 0.012,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const sparks = new THREE.Points(pointsGeometry, pointsMaterial);
    mainGroup.add(sparks);

    // ILUMINAÇÃO
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.4 : 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x2563eb, 2);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x60a5fa, 1.5);
    pointLight2.position.set(-5, -5, 2);
    scene.add(pointLight2);

    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      animationId = requestAnimationFrame(animate);
      
      mainGroup.rotation.y += 0.001;
      mainGroup.rotation.x += 0.0002;

      // Efeito de "pulsar" das fagulhas
      pointsMaterial.opacity = 0.5 + Math.sin(elapsedTime * 2) * 0.3;
      
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
      <div ref={containerRef} className="w-full h-full min-h-[600px]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white dark:from-brand-navy via-transparent to-white dark:to-brand-navy opacity-40"></div>
    </div>
  );
};

export default ThreeGlobe;
