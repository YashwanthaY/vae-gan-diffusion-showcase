import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 1. VAE Latent Torus Mesh Component
export function VaeScene() {
  const meshRef = useRef();

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.4;
      meshRef.current.rotation.y += delta * 0.6;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1.3, 0.35, 100, 24]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#064e3b"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <points>
        <torusGeometry args={[2.2, 0.12, 16, 80]} />
        <pointsMaterial size={0.03} color="#34d399" transparent opacity={0.8} />
      </points>
    </Float>
  );
}

// 2. GAN Adversarial Hyper-Cubes Component
export function GanScene() {
  const genRef = useRef();
  const discRef = useRef();

  useFrame((state, delta) => {
    if (genRef.current && discRef.current) {
      genRef.current.rotation.x += delta * 0.7;
      genRef.current.rotation.y += delta * 0.5;
      discRef.current.rotation.y -= delta * 0.8;
      discRef.current.rotation.z += delta * 0.4;
      const t = state.clock.getElapsedTime();
      genRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
      discRef.current.scale.setScalar(1 + Math.cos(t * 3) * 0.06);
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={1.2} floatIntensity={1.8}>
      <group>
        <mesh ref={genRef}>
          <boxGeometry args={[2.0, 2.0, 2.0]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#78350f"
            wireframe
            roughness={0.1}
          />
        </mesh>
        <mesh ref={discRef}>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#991b1b"
            metalness={0.8}
            roughness={0.1}
          />
        </mesh>
        <points>
          <sphereGeometry args={[2.4, 20, 20]} />
          <pointsMaterial size={0.035} color="#fbbf24" transparent opacity={0.6} />
        </points>
      </group>
    </Float>
  );
}

// 3. DDPM Iterative Denoising Particles Component
export function DdpmScene() {
  const pointsRef = useRef();
  const count = 900;

  const [positions, initialPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initPos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const nx = (Math.random() - 0.5) * 6;
      const ny = (Math.random() - 0.5) * 6;
      const nz = (Math.random() - 0.5) * 6;

      const row = Math.floor(i / 30);
      const col = i % 30;
      const tx = (col / 30 - 0.5) * 3.4;
      const ty = (row / 30 - 0.5) * 3.4;
      const tz = (Math.sin(row * 0.2) + Math.cos(col * 0.2)) * 0.4;

      pos[i * 3] = nx;
      pos[i * 3 + 1] = ny;
      pos[i * 3 + 2] = nz;

      initPos[i * 3] = tx;
      initPos[i * 3 + 1] = ty;
      initPos[i * 3 + 2] = tz;
    }
    return [pos, initPos];
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.getElapsedTime();
      const morphFactor = (Math.sin(time * 0.8) + 1) / 2;
      const currentPos = pointsRef.current.geometry.attributes.position.array;

      for (let i = 0; i < count; i++) {
        const nx = positions[i * 3];
        const ny = positions[i * 3 + 1];
        const nz = positions[i * 3 + 2];

        const tx = initialPositions[i * 3];
        const ty = initialPositions[i * 3 + 1];
        const tz = initialPositions[i * 3 + 2];

        currentPos[i * 3] = nx * (1 - morphFactor) + tx * morphFactor;
        currentPos[i * 3 + 1] = ny * (1 - morphFactor) + ty * morphFactor;
        currentPos[i * 3 + 2] = nz * (1 - morphFactor) + tz * morphFactor;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.rotation.y = time * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.8} floatIntensity={1.2}>
      <group>
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={count}
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          <PointMaterial
            size={0.05}
            color="#00f3ff"
            transparent
            opacity={0.85}
            sizeAttenuation
          />
        </points>
        <mesh>
          <icosahedronGeometry args={[1.0, 1]} />
          <meshStandardMaterial
            color="#00f3ff"
            emissive="#0284c7"
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>
      </group>
    </Float>
  );
}

// Single Model 3D View with reduced-motion and off-screen pause
export function Model3DView({ modelKey, height = 220 }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const listener = (e) => setReducedMotion(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (reducedMotion) {
    return (
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full flex items-center justify-center bg-slate-950/40 rounded-2xl border border-slate-800"
      >
        <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center font-mono text-xs font-bold"
          style={{
            borderColor: modelKey === 'vae' ? '#10b981' : modelKey === 'gan' ? '#f59e0b' : '#00f3ff',
            color: modelKey === 'vae' ? '#10b981' : modelKey === 'gan' ? '#f59e0b' : '#00f3ff',
          }}
        >
          {modelKey.toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height }} className="w-full relative">
      {isVisible ? (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-10, -10, -5]} intensity={1} color="#a855f7" />

          {modelKey === 'vae' && <VaeScene />}
          {modelKey === 'gan' && <GanScene />}
          {modelKey === 'ddpm' && <DdpmScene />}

          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
        </Canvas>
      ) : (
        <div className="w-full h-full bg-slate-950/30 rounded-2xl" />
      )}
    </div>
  );
}

// Legacy export for backward compatibility
export default function ThreeCanvas({ activeModel }) {
  return <Model3DView modelKey={activeModel} height={480} />;
}
