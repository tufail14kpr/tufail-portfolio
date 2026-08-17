'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function StarField() {
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const count = 5000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 80;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta * 0.03;
      ref.current.rotation.y -= delta * 0.05;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#6c63ff"
          size={0.05}
          sizeAttenuation
          depthWrite={false}
          opacity={0.8}
        />
      </Points>
    </group>
  );
}

function FloatingOrb() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(elapsed.current * 0.5) * 0.3;
      meshRef.current.rotation.x = elapsed.current * 0.3;
      meshRef.current.rotation.z = elapsed.current * 0.2;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.8, 100, 100]} position={[3, 0, 0]}>
      <MeshDistortMaterial
        color="#6c63ff"
        attach="material"
        distort={0.4}
        speed={2}
        roughness={0}
        metalness={0.5}
        transparent
        opacity={0.15}
        wireframe={false}
      />
    </Sphere>
  );
}

function WireframeSphere() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y = elapsed.current * 0.2;
      meshRef.current.rotation.x = elapsed.current * 0.1;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.6, 30, 30]} position={[3, 0, 0]}>
      <meshBasicMaterial color="#6c63ff" wireframe transparent opacity={0.2} />
    </Sphere>
  );
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#6c63ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00d4ff" />
        <StarField />
        <FloatingOrb />
        <WireframeSphere />
      </Suspense>
    </Canvas>
  );
}
