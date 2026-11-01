import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Web3DBackground: Dark 4D Cosmic Universe Canvas
 * 
 * Features:
 * - Theme: Dark 4D with Electric Blue & Cyan palette (#030712, #2563eb, #38bdf8, #60a5fa).
 * - Cosmic Sparkling Stars: True circular glowing stars with varied luminosity, twinkling alpha,
 *   and depths (replacing square particles with soft optical star glows).
 * - 4D Hyperspace Projection: Particles translate along a 4th dimensional phase axis (w),
 *   creating undulating spacetime wave ripples and dynamic temporal dilation.
 * - 4D Hyper-Torus Rings: Ethereal blue wireframe rings rotating across multi-dimensional planes.
 * - Interactive Mouse & Touch Gravitational Wave: Spacetime distortion follows cursor movements.
 */
export default function Web3DBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    // Deep cosmic dark space fog with blue tint
    scene.fog = new THREE.FogExp2(0x030712, 0.022);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 28;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 1. Cosmic Lights - Blue & Cyan Spectrum
    const ambientLight = new THREE.AmbientLight(0x0a192f, 2.0);
    scene.add(ambientLight);

    const pointLightBlue = new THREE.PointLight(0x38bdf8, 4.5, 70);
    pointLightBlue.position.set(15, 18, 15);
    scene.add(pointLightBlue);

    const pointLightCyan = new THREE.PointLight(0x2563eb, 3.8, 60);
    pointLightCyan.position.set(-15, -15, 10);
    scene.add(pointLightCyan);

    // 2. Generate Soft Star Texture (Glowing round star with falloff)
    const createStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(147, 197, 253, 0.9)'); // Light blue core
      gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');  // Cyan halo
      gradient.addColorStop(1.0, 'rgba(3, 7, 18, 0)');        // Fade out
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };

    const starTexture = createStarTexture();

    // 3. Cosmic Sparkling Stars (600 Stars with 4D phase attributes)
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const initialPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const phaseW = new Float32Array(starCount);       // 4th dimensional coordinate
    const twinkleSpeed = new Float32Array(starCount);

    const colorPalette = [
      new THREE.Color(0xffffff), // Pure brilliant white star
      new THREE.Color(0x38bdf8), // Cyan star
      new THREE.Color(0x60a5fa), // Light sky blue star
      new THREE.Color(0x93c5fd), // Ice blue star
      new THREE.Color(0x2563eb), // Electric royal blue star
    ];

    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 75;
      const y = (Math.random() - 0.5) * 55;
      const z = (Math.random() - 0.5) * 45;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      // 4D temporal coordinate
      phaseW[i] = Math.random() * Math.PI * 2;
      twinkleSpeed[i] = 1.0 + Math.random() * 3.0;

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.75,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 4. 4D Hyper-Torus Wireframe Rings (Cosmic Blue & Cyan)
    const ringsGroup = new THREE.Group();
    scene.add(ringsGroup);

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.15,
      metalness: 0.9,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });

    for (let i = 0; i < 5; i++) {
      const ringGeo = new THREE.TorusGeometry(4.5 + i * 2.2, 0.08, 16, 64);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set((i - 2) * 8, (i % 2 === 0 ? 1 : -1) * 6, -8 - i * 3);
      ring.rotation.x = Math.PI / 4 + i * 0.3;
      ring.rotation.y = i * 0.4;
      ringsGroup.add(ring);
    }

    // 5. Parallax Mouse & Touch Interaction with 4D Spacetime Wave
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / width) * 2 - 1;
      mouseY = -(e.clientY / height) * 2 + 1;
      targetX = mouseX * 2.5;
      targetY = mouseY * 2.0;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouseX = (e.touches[0].clientX / width) * 2 - 1;
        mouseY = -(e.touches[0].clientY / height) * 2 + 1;
        targetX = mouseX * 2.5;
        targetY = mouseY * 2.0;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // 6. Resize Handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 7. 4D Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth camera interpolation
      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (targetY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // 4D Hyperspace Projection Simulation on Star Field
      const posAttr = starGeo.attributes.position;
      const pos = posAttr.array;

      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        const w = phaseW[i];
        const freq = twinkleSpeed[i];

        // 4D hyperspace undulation: displacement along 4th dimension projected into 3D
        const hyperWave = Math.sin(w + time * freq * 0.4);
        const hyperCos = Math.cos(w + time * 0.3);

        pos[i3] = initialPositions[i3] + hyperWave * 1.8;
        pos[i3 + 1] = initialPositions[i3 + 1] + hyperCos * 1.8;
        pos[i3 + 2] = initialPositions[i3 + 2] + Math.sin(time * 0.2 + w) * 2.5;
      }
      posAttr.needsUpdate = true;

      // Animate 4D Rings across multi-axis rotations
      ringsGroup.children.forEach((ring, idx) => {
        ring.rotation.x += 0.003 * (idx % 2 === 0 ? 1 : -1);
        ring.rotation.y += 0.004 * ((idx + 1) % 2 === 0 ? 1 : -1);
        ring.rotation.z += 0.002;
        ring.position.y += Math.sin(time * 1.2 + idx) * 0.015;
      });

      // Subtle slow star rotation around cosmic center
      starPoints.rotation.y = time * 0.015;
      starPoints.rotation.x = Math.sin(time * 0.01) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      starTexture.dispose();
      ringMat.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030712]"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.12) 0%, rgba(2, 132, 199, 0.06) 40%, rgba(3, 7, 18, 0.95) 100%)`
      }}
    />
  );
}
