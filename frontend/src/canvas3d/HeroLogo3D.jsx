import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Smartphone, Tablet, Laptop, Monitor } from 'lucide-react';

/**
 * HeroLogo3D component: Re-engineered 3D Three.js model
 * strictly matching media_1793386310642_63ce43dd.jpg:
 * Stylized Letter 'P' Clock with left-wing arrow, clock face ticks,
 * center pivot, hour hand, and minute hand with sprouting green leaf.
 */
export default function HeroLogo3D() {
  const mountRef = useRef(null);
  const [deviceHint, setDeviceHint] = useState('Rê chuột hoặc vuốt màn hình để xoay 3D');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setDeviceHint('Chạm & vuốt màn hình để xoay 3D');
    }

    let width = container.clientWidth || 360;
    let height = container.clientHeight || 360;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.z = width < 480 ? 9.2 : 7.8;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    // 1. Shaders / Materials matching official logo colors
    const emeraldGlossy = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.22,
      metalness: 0.6,
      bevelSegments: 4,
    });

    const darkForest = new THREE.MeshStandardMaterial({
      color: 0x047857,
      roughness: 0.35,
      metalness: 0.45,
    });

    const leafGreen = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.15,
      metalness: 0.65,
    });

    const clockDialMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.12,
      metalness: 0.05,
    });

    // 2. BUILD THE EXACT P-CLOCK SHAPE (Outer Shell)
    // Geometry based on media_1793386310642_63ce43dd.jpg
    const pShape = new THREE.Shape();
    
    // Top right outer arc of the clock (from top center x=0.2, y=2.2 clockwise to bottom connector x=0.2, y=-0.5)
    // Clock center is at (0.2, 0.85)
    const cx = 0.2;
    const cy = 0.85;
    const R_out = 1.45;
    const R_in = 0.95;

    // Outer contour:
    // Start at top connector
    pShape.moveTo(cx, cy + R_out);
    
    // Clock outer arc to bottom right
    pShape.absarc(cx, cy, R_out, Math.PI / 2, -Math.PI / 2, true);

    // Bottom horizontal loop connector
    pShape.lineTo(-0.4, -0.6);

    // Leg of P: Downwards diagonal stem
    pShape.lineTo(-0.7, -1.8);
    // Beveled bottom edge of the P
    pShape.lineTo(-1.3, -1.8);
    // Outer edge of P stem going up
    pShape.lineTo(-1.0, -0.2);

    // Left Wing Arrow Feature (top-left chevron on official logo)
    pShape.lineTo(-1.7, -0.2);
    pShape.lineTo(-2.2, 0.3); // sharp arrow tip
    pShape.lineTo(-1.8, 0.8);
    pShape.lineTo(-0.8, 0.8);

    // Rejoin the clock circle at top-left
    pShape.absarc(cx, cy, R_out, Math.PI, Math.PI / 2, true);

    // Inner Hole (The clock opening)
    const holePath = new THREE.Path();
    holePath.absarc(cx, cy, R_in, 0, Math.PI * 2, false);
    pShape.holes.push(holePath);

    const extrudeSettings = {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 2,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    };

    const pGeometry = new THREE.ExtrudeGeometry(pShape, extrudeSettings);
    pGeometry.center();
    const pMesh = new THREE.Mesh(pGeometry, emeraldGlossy);
    logoGroup.add(pMesh);

    // 3. INNER CLOCK DIAL (Circular White Surface inside)
    const dialGeometry = new THREE.CylinderGeometry(R_in * 0.98, R_in * 0.98, 0.1, 48);
    dialGeometry.rotateX(Math.PI / 2);
    const dialMesh = new THREE.Mesh(dialGeometry, clockDialMat);
    dialMesh.position.set(cx - 0.25, cy - 0.95, 0.05);
    logoGroup.add(dialMesh);

    // 4. CLOCK TICK MARKS (12, 3, 6, 9)
    const ticksGroup = new THREE.Group();
    ticksGroup.position.set(cx - 0.25, cy - 0.95, 0.12);

    const tickGeo = new THREE.BoxGeometry(0.06, 0.22, 0.04);
    
    // 12 o'clock tick
    const tick12 = new THREE.Mesh(tickGeo, darkForest);
    tick12.position.set(0, 0.72, 0);
    ticksGroup.add(tick12);

    // 6 o'clock tick
    const tick6 = new THREE.Mesh(tickGeo, darkForest);
    tick6.position.set(0, -0.72, 0);
    ticksGroup.add(tick6);

    // 3 o'clock tick
    const tick3 = new THREE.Mesh(tickGeo, darkForest);
    tick3.rotation.z = Math.PI / 2;
    tick3.position.set(0.72, 0, 0);
    ticksGroup.add(tick3);

    // 9 o'clock tick
    const tick9 = new THREE.Mesh(tickGeo, darkForest);
    tick9.rotation.z = Math.PI / 2;
    tick9.position.set(-0.72, 0, 0);
    ticksGroup.add(tick9);

    logoGroup.add(ticksGroup);

    // 5. CLOCK HANDS & SPROUTING LEAF (Exact motif from official logo)
    const handsGroup = new THREE.Group();
    handsGroup.position.set(cx - 0.25, cy - 0.95, 0.16);

    // Center pivot
    const pivotGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 24);
    pivotGeo.rotateX(Math.PI / 2);
    const pivotMesh = new THREE.Mesh(pivotGeo, darkForest);
    handsGroup.add(pivotMesh);

    // Hour hand pointing to ~7:20
    const hourHandGeo = new THREE.BoxGeometry(0.08, 0.55, 0.05);
    const hourHand = new THREE.Mesh(hourHandGeo, darkForest);
    hourHand.position.set(-0.22, -0.22, 0);
    hourHand.rotation.z = 0.78; // 45 deg down-left
    handsGroup.add(hourHand);

    // Minute hand pointing straight up to 12:00
    const minHandGeo = new THREE.BoxGeometry(0.08, 0.75, 0.05);
    const minHand = new THREE.Mesh(minHandGeo, darkForest);
    minHand.position.set(0, 0.35, 0);
    handsGroup.add(minHand);

    // Sprouting Green Leaf Motif branching to the right (~1 o'clock)
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.18, 0.2, 0.32, 0.45);
    leafShape.quadraticCurveTo(0.1, 0.55, 0, 0.7);
    leafShape.quadraticCurveTo(-0.1, 0.55, -0.32, 0.45);
    leafShape.quadraticCurveTo(-0.18, 0.2, 0, 0);

    const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
    const leafMesh = new THREE.Mesh(leafGeo, leafGreen);
    leafMesh.scale.set(0.48, 0.48, 0.48);
    leafMesh.position.set(0.24, 0.48, 0.02);
    leafMesh.rotation.z = -0.55; // Angle leaf pointing towards ~1:30
    handsGroup.add(leafMesh);

    logoGroup.add(handsGroup);

    // 6. FLOATING PARTICLES (Subtle green sparkles)
    const particleCount = 140;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 7. LIGHTING (Rich studio lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(3, 5, 5);
    scene.add(keyLight);

    const greenFillLight = new THREE.PointLight(0x10b981, 3.2, 20);
    greenFillLight.position.set(-4, -3, 3);
    scene.add(greenFillLight);

    const topRimLight = new THREE.PointLight(0x34d399, 2.0, 15);
    topRimLight.position.set(0, 4, 4);
    scene.add(topRimLight);

    // 8. INTERACTION (Mouse & Multi-touch for PC, Laptop, iPad, Mobile)
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / height) * 2 - 1);
      targetRotationY = nx * 0.65;
      targetRotationX = -ny * 0.45;
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        targetRotationY += dx * 0.007;
        targetRotationX += dy * 0.005;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    // 9. ANIMATION LOOP
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth follow
      logoGroup.rotation.y += (targetRotationY - logoGroup.rotation.y) * 0.06;
      logoGroup.rotation.x += (targetRotationX - logoGroup.rotation.x) * 0.06;

      // Subtle breathing
      logoGroup.position.y = Math.sin(elapsed * 1.6) * 0.12;
      leafMesh.rotation.z = -0.55 + Math.sin(elapsed * 2.5) * 0.06;

      particles.rotation.y = elapsed * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // 10. RESIZE LISTENER
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.position.z = width < 480 ? 9.2 : 7.8;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] lg:h-[460px] flex items-center justify-center select-none">
      {/* 3D WebGL Canvas */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none" 
      />

      {/* Interactive Tag Badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-emerald-100 flex items-center gap-2 text-[11px] font-bold text-emerald-800 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
        <span>Mô hình 3D Logo PARTIME.VN • {deviceHint}</span>
        <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 pl-1 border-l border-slate-200">
          <Monitor className="w-3 h-3" />
          <Laptop className="w-3 h-3" />
          <Tablet className="w-3 h-3" />
          <Smartphone className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
