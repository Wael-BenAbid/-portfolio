
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const NebulaCloud = () => {
  const pointsRef = useRef<THREE.Points>(null!);
  const { viewport } = useThree();
  
  // Create a denser, more cloud-like particle system
  const count = 5000;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Create a sprawling, organic shape
      const r = 15 * Math.pow(Math.random(), 0.5);
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Gradient from blue to dark purple
      const mixedColor = i % 2 === 0 ? '#3b82f6' : '#1e3a8a';
      color.set(mixedColor);
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    return [pos, cols];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const scroll = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

    // Subtle drift
    pointsRef.current.rotation.y = t * 0.02 + scroll * 0.5;
    pointsRef.current.rotation.x = Math.sin(t * 0.1) * 0.1 + scroll * 0.2;
    
    // Parallax: shift position based on scroll
    pointsRef.current.position.y = -scroll * 5;
  });

  return (
    <group>
      <Points ref={pointsRef} positions={positions} colors={colors} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          vertexColors
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      {/* Distant glowing cores */}
      <Float speed={1.5} rotationIntensity={2} floatIntensity={2}>
        <Sphere args={[2, 64, 64]} position={[-5, 2, -10]}>
          <MeshDistortMaterial
            color="#1e40af"
            speed={2}
            distort={0.5}
            radius={1}
            opacity={0.1}
            transparent
          />
        </Sphere>
      </Float>
      
      <Float speed={2} rotationIntensity={1} floatIntensity={4}>
        <Sphere args={[1.5, 64, 64]} position={[6, -3, -8]}>
          <MeshDistortMaterial
            color="#3b82f6"
            speed={3}
            distort={0.3}
            radius={1}
            opacity={0.08}
            transparent
          />
        </Sphere>
      </Float>
    </group>
  );
};

export const Scene3D: React.FC = () => {
  return (
    <div className="w-full h-full">
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 50 }}
        dpr={[1, 2]} // Performance optimization
      >
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 25]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#3b82f6" />
        <NebulaCloud />
      </Canvas>
    </div>
  );
};
