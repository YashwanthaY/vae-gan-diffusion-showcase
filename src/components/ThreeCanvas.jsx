import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sphere, MeshWobbleMaterial, Trail, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 1. VAE Latent Torus Mesh Component
function VaeScene() {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.4;
      meshRef.current.rotation.y += delta * 0.6;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1.5, 0.4, 128, 32]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#064e3b"
          roughness={0.2}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Latent Gaussian Ring particles */}
      <points>
        <torusGeometry args={[2.5, 0.15, 16, 100]} />
        <pointsMaterial size={0.03} color="#34d399" transparent opacity={0.8} />
      </points>
    </Float>
  );
}

// 2. GAN Adversarial Hyper-Cubes Component
function GanScene() {
  const genRef = useRef();
  const discRef = useRef();

  useFrame((state, delta) => {
    if (genRef.current && discRef.current) {
      genRef.current.rotation.x += delta * 0.8;
      genRef.current.rotation.y += delta * 0.5;
      discRef.current.rotation.y -= delta * 0.9;
      discRef.current.rotation.z += delta * 0.4;
      
      // Adversarial oscillation pulse
      const t = state.clock.getElapsedTime();
      genRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
      discRef.current.scale.setScalar(1 + Math.cos(t * 3) * 0.08);
    }
  });

  return (
    <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
      <group>
        {/* Generator Cube (Outer Amber Wireframe) */}
        <mesh ref={genRef}>
          <boxGeometry args={[2.4, 2.4, 2.4]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#78350f"
            wireframe
            roughness={0.1}
          />
        </mesh>

        {/* Discriminator Core (Inner Glowing Cube) */}
        <mesh ref={discRef}>
          <boxGeometry args={[1.3, 1.3, 1.3]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#991b1b"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Energy Beam Orbits */}
        <points>
          <sphereGeometry args={[2.8, 24, 24]} />
          <pointsMaterial size={0.04} color="#fbbf24" transparent opacity={0.6} />
        </points>
      </group>
    </Float>
  );
}

// 3. DDPM Iterative Denoising Particles Component
function DdpmScene() {
  const pointsRef = useRef();
  const count = 1200;

  // Generate noise cloud that collapses into structured grid
  const [positions, initialPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initPos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Noise position (isotropic Gaussian cloud)
      const nx = (Math.random() - 0.5) * 7;
      const ny = (Math.random() - 0.5) * 7;
      const nz = (Math.random() - 0.5) * 7;

      // Target structured crystal position
      const row = Math.floor(i / 35);
      const col = i % 35;
      const tx = (col / 35 - 0.5) * 3.8;
      const ty = (row / 35 - 0.5) * 3.8;
      const tz = (Math.sin(row * 0.2) + Math.cos(col * 0.2)) * 0.5;

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
      // Oscillate morphing between noise cloud and structured crystal (representing 500 DDIM denoising step progression)
      const morphFactor = (Math.sin(time * 0.8) + 1) / 2; // 0 to 1

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
            size={0.06}
            color="#00f3ff"
            transparent
            opacity={0.9}
            sizeAttenuation
          />
        </points>

        {/* Central Holographic Core */}
        <mesh>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial
            color="#00f3ff"
            emissive="#0284c7"
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>
    </Float>
  );
}

// Main Canvas Wrapper
export default function ThreeCanvas({ activeModel }) {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#a855f7" />

        {activeModel === 'vae' && <VaeScene />}
        {activeModel === 'gan' && <GanScene />}
        {activeModel === 'ddpm' && <DdpmScene />}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
