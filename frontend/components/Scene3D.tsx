
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const NebulaCloud = () => {
  const pointsRef = useRef<THREE.Points>(null!);
  const { viewport } = useThree();
  
  // Reduce particle count for better performance (was 5000, now 1500)
  const count = 1500;
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

  // Debounce scroll calculations to avoid blocking main thread
  const scrollRef = useRef({ lastScroll: 0, timeout: null as NodeJS.Timeout | null });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Only recalculate scroll every 100ms to prevent resize jank
    const now = Date.now();
    if (now - (scrollRef.current.lastScroll || 0) > 100) {
      const scroll = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      pointsRef.current.rotation.y = t * 0.02 + scroll * 0.5;
      pointsRef.current.rotation.x = Math.sin(t * 0.1) * 0.1 + scroll * 0.2;
      pointsRef.current.position.y = -scroll * 5;
      scrollRef.current.lastScroll = now;
    }
  });

  return (
    <group>
      <Points ref={pointsRef} positions={positions} colors={colors} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          vertexColors
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      {/* Distant glowing cores */}
      <Float speed={1.5} rotationIntensity={2} floatIntensity={2}>
        <Sphere args={[2, 32, 32]} position={[-5, 2, -10]}>
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
        <Sphere args={[1.5, 32, 32]} position={[6, -3, -8]}>
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
  // Disable 3D scene on mobile devices (< 768px) for better performance
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (isMobile) {
    return null; // Don't render 3D scene on mobile
  }
  
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

export default Scene3D;
