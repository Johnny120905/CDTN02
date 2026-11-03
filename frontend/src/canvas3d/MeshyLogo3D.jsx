import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * MeshyLogo3D component:
 * Loads and renders the authentic 3D GLB model `meshy-3d-logo.glb`
 * with 4D dynamic lighting, subtle hover/mouse tilt, and auto-rotation.
 */
export default function MeshyLogo3D({ 
  size = 56, 
  interactive = true, 
  autoRotate = true, 
  className = '',
  fallbackSrc = '/logo.jpg'
}) {
  const mountRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let scene, camera, renderer, model, animId;
    let targetRotX = 0;
    let targetRotY = 0;
    let mouseX = 0;
    let mouseY = 0;

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 3.5);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      mount.appendChild(renderer.domElement);

      // Lighting - 4D Cosmic Blue & Cyan Theme
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.5); // Cyan
      dirLight1.position.set(3, 4, 3);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x2563eb, 2.0); // Royal Blue
      dirLight2.position.set(-3, -2, -2);
      scene.add(dirLight2);

      const pointLight = new THREE.PointLight(0x60a5fa, 2.0, 10);
      pointLight.position.set(0, 1, 2);
      scene.add(pointLight);

      // Load GLB
      const loader = new GLTFLoader();
      loader.load(
        '/meshy-3d-logo.glb',
        (gltf) => {
          model = gltf.scene;

          // Compute bounding box & auto-center
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const sizeVec = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
          const scale = 2.0 / (maxDim || 1);

          model.scale.set(scale, scale, scale);
          model.position.sub(center.multiplyScalar(scale));

          // Enhance materials
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.metalness = Math.min(child.material.metalness || 0.3, 0.6);
                child.material.roughness = Math.max(child.material.roughness || 0.4, 0.25);
              }
            }
          });

          scene.add(model);
          setIsLoaded(true);
        },
        undefined,
        (err) => {
          console.warn('[MeshyLogo3D] Could not load .glb, using fallback image', err);
          setLoadError(true);
        }
      );

      // Mouse interactive tilt
      const handleMouseMove = (e) => {
        if (!interactive) return;
        const rect = mount.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotY = mouseX * 0.8;
        targetRotX = -mouseY * 0.5;
      };

      const handleMouseLeave = () => {
        targetRotX = 0;
        targetRotY = 0;
      };

      if (interactive) {
        mount.addEventListener('mousemove', handleMouseMove);
        mount.addEventListener('mouseleave', handleMouseLeave);
      }

      // Animation Loop
      let clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        if (model) {
          if (autoRotate) {
            model.rotation.y += 0.012;
            // 4D floating undulating effect
            model.position.y = Math.sin(elapsedTime * 2.0) * 0.08;
          }
          if (interactive) {
            model.rotation.y += (targetRotY - model.rotation.y) * 0.05;
            model.rotation.x += (targetRotX - model.rotation.x) * 0.05;
          }
        }

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        cancelAnimationFrame(animId);
        if (interactive) {
          mount.removeEventListener('mousemove', handleMouseMove);
          mount.removeEventListener('mouseleave', handleMouseLeave);
        }
        if (renderer.domElement && mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (e) {
      console.warn('[MeshyLogo3D] Three.js init failed', e);
      setLoadError(true);
    }
  }, [size, interactive, autoRotate]);

  if (loadError) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl ${className}`} style={{ width: size, height: size }}>
        <img src={fallbackSrc} alt="PARTIME.VN Logo" className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div 
      ref={mountRef} 
      className={`relative flex items-center justify-center cursor-pointer select-none transition-transform hover:scale-105 ${className}`} 
      style={{ width: size, height: size }}
      title="PARTIME.VN - Logo 3D tương tác 4D"
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={fallbackSrc} alt="PARTIME.VN Logo Loading" className="w-full h-full object-contain p-1 rounded-2xl opacity-80" />
        </div>
      )}
    </div>
  );
}

