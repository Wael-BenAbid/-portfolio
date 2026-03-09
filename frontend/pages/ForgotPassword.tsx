import React, { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, Check, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { BackButton } from '../components/BackButton';

// ============ ADVANCED 3D BACKGROUND COMPONENTS ============

// Wave Field Background - Complex moving mesh with shader
const WaveField = () => {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const vertexShader = `
    uniform float uTime;
    uniform float uWaveAmplitude;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying float vWaveHeight;
    
    void main() {
      vec3 pos = position;
      
      // Multiple wave layers
      float wave1 = sin(pos.x * 0.3 + uTime) * cos(pos.y * 0.3 + uTime * 0.7) * uWaveAmplitude;
      float wave2 = sin(pos.y * 0.2 + uTime * 0.5) * cos(pos.x * 0.4 + uTime * 0.3) * uWaveAmplitude * 0.7;
      float wave3 = sin((pos.x + pos.y) * 0.15 + uTime * 0.8) * uWaveAmplitude * 0.5;
      
      pos.z += wave1 + wave2 + wave3;
      pos.x += sin(pos.y * 0.2 + uTime * 0.4) * 0.2;
      pos.y += cos(pos.x * 0.2 + uTime * 0.3) * 0.2;
      
      vPosition = pos;
      vWaveHeight = (wave1 + wave2 + wave3) / uWaveAmplitude;
      vNormal = normalize(normalMatrix * normal);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying float vWaveHeight;
    
    void main() {
      // Animated color based on position and time
      float freq1 = sin(vPosition.x * 1.5 + uTime) * 0.5 + 0.5;
      float freq2 = cos(vPosition.y * 1.5 + uTime * 0.7) * 0.5 + 0.5;
      float freq3 = sin((vPosition.x + vPosition.y) * 0.8 + uTime * 0.5) * 0.5 + 0.5;
      
      // Color gradient
      vec3 col1 = mix(vec3(0.2, 0.05, 0.6), vec3(0.8, 0.1, 0.9), freq1); // purple to magenta
      vec3 col2 = mix(vec3(0.05, 0.3, 0.9), vec3(0.1, 0.8, 1.0), freq2); // blue to cyan
      vec3 finalColor = mix(col1, col2, freq3);
      
      // Fresnel effect
      float fresnel = dot(normalize(vNormal), normalize(vec3(0.0, 0.0, 1.0)));
      fresnel = pow(1.0 - abs(fresnel), 3.0);
      
      finalColor += vec3(fresnel) * 0.5;
      
      gl_FragColor = vec4(finalColor, 0.8);
    }
  `;

  useFrame((state) => {
    if (material.current) {
      material.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={mesh} scale={[10, 10, 1]} position={[0, 0, -6]} rotation={[0.3, 0.2, 0]}>
      <planeGeometry args={[2, 2, 128, 128]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ 
          uTime: { value: 0 },
          uWaveAmplitude: { value: 0.4 }
        }}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  );
};

// Morphing Core - Complex transforming geometry
const MorphingCore = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhongMaterial>(null);
  const positionAttribute = useRef<THREE.BufferAttribute | null>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  useFrame((state) => {
    if (meshRef.current && materialRef.current) {
      // Rotation
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.12;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.18;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.08;
      
      // Pulsation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.2;
      meshRef.current.scale.setScalar(scale);

      // Morphing deformation
      const geometry = meshRef.current.geometry as THREE.IcosahedronGeometry;
      if (!positionAttribute.current) {
        positionAttribute.current = geometry.attributes.position as THREE.BufferAttribute;
        originalPositions.current = new Float32Array(positionAttribute.current.array as Float32Array);
      }

      const posArray = positionAttribute.current.array as Float32Array;
      const origArray = originalPositions.current!;

      for (let i = 0; i < posArray.length; i += 3) {
        const origX = origArray[i];
        const origY = origArray[i + 1];
        const origZ = origArray[i + 2];
        const len = Math.sqrt(origX * origX + origY * origY + origZ * origZ);

        const wave = Math.sin(len * 10 + state.clock.elapsedTime * 2) * 0.15;
        const newLen = len + wave;

        if (len > 0) {
          posArray[i] = (origX / len) * newLen;
          posArray[i + 1] = (origY / len) * newLen;
          posArray[i + 2] = (origZ / len) * newLen;
        }
      }
      (positionAttribute.current as THREE.BufferAttribute).needsUpdate = true;

      // Color animation
      const hue = (state.clock.elapsedTime * 0.15) % 1;
      materialRef.current.color.setHSL(hue, 0.8, 0.55);
      materialRef.current.emissive.setHSL(hue, 1, 0.3);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[1.2, 6]} />
      <meshPhongMaterial
        ref={materialRef}
        emissiveIntensity={0.5}
        shininess={100}
        wireframe={false}
      />
    </mesh>
  );
};

// Orbital Resonance Rings - Multiple rotating tori
const OrbitalRings = () => {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.children.forEach((child: THREE.Object3D, idx: number) => {
        child.rotation.x = state.clock.elapsedTime * (0.25 + idx * 0.12);
        child.rotation.y = state.clock.elapsedTime * (0.18 - idx * 0.1);
        child.rotation.z = state.clock.elapsedTime * (0.05 + idx * 0.08);
      });
    }
  });

  return (
    <group ref={group}>
      {[0, 1, 2, 3].map((idx) => (
        <mesh key={idx} scale={1.4 + idx * 0.35}>
          <torusGeometry args={[1, 0.08, 16, 48]} />
          <meshStandardMaterial
            color={new THREE.Color().setHSL(0.58 + idx * 0.08, 0.9, 0.5)}
            metalness={0.7}
            roughness={0.25}
            emissive={new THREE.Color().setHSL(0.58 + idx * 0.08, 1, 0.35)}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
};

// Dynamic Light System - Orbiting lights
const DynamicLights = () => {
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);
  const light3Ref = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (light1Ref.current) {
      light1Ref.current.position.x = Math.sin(t * 0.4) * 6;
      light1Ref.current.position.y = Math.cos(t * 0.3) * 6;
      light1Ref.current.position.z = Math.sin(t * 0.5) * 3;
    }
    if (light2Ref.current) {
      light2Ref.current.position.x = Math.cos(t * 0.35) * 6;
      light2Ref.current.position.y = Math.sin(t * 0.45) * 6;
      light2Ref.current.position.z = Math.cos(t * 0.5) * 3;
    }
    if (light3Ref.current) {
      light3Ref.current.position.x = Math.sin(t * 0.5 + Math.PI) * 5;
      light3Ref.current.position.y = Math.cos(t * 0.4 + Math.PI) * 5;
      light3Ref.current.position.z = Math.sin(t * 0.6) * 4;
    }
  });

  return (
    <>
      <pointLight ref={light1Ref} intensity={2.5} color="#6366f1" distance={20} />
      <pointLight ref={light2Ref} intensity={2} color="#ec4899" distance={20} />
      <pointLight ref={light3Ref} intensity={1.8} color="#06b6d4" distance={18} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 8, 5]} intensity={0.7} />
    </>
  );
};

// 3D Background Scene - Advanced spectacle
const AuthScene = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 60 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.1 }}
    >
      <color attach="background" args={['#0a0415']} />
      <fog attach="fog" args={['#0a0415', 6, 20]} />
      
      <Suspense fallback={null}>
        <DynamicLights />
        <WaveField />
        <MorphingCore />
        <OrbitalRings />
      </Suspense>
    </Canvas>
  );
};

// Main Component
const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if there's a reset token in the URL
    const token = searchParams.get('token');
    if (token) {
      setStep('reset');
      sessionStorage.setItem('reset_token', token);
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send reset email. Please try again.');
      }
    } catch (_err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem('reset_token');
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          password: newPassword,
          password_confirm: confirmPassword
        })
      });

      if (response.ok) {
        setSuccess(true);
        sessionStorage.removeItem('reset_token');
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to reset password. Token may have expired.');
      }
    } catch (_err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <AuthScene />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full">
                <Mail className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-slate-400 text-sm">
              {step === 'email' ? 'Request a password reset' : 'Create a new password'}
            </p>
          </motion.div>

          {/* Step 1: Request Reset Email */}
          {step === 'email' && !success && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleRequestReset}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  disabled={loading}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-slate-400 text-sm">
                Remember your password?{' '}
                <a href="/auth" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                  Back to Login
                </a>
              </p>
            </motion.form>
          )}

          {/* Step 2: Reset Password */}
          {step === 'reset' && !success && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleResetPassword}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  disabled={loading}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {step === 'email' ? 'Email Sent!' : 'Password Reset!'}
                </h2>
                <p className="text-slate-400 mb-4">
                  {step === 'email'
                    ? 'Check your email for the reset link. Redirecting to login...'
                    : 'Your password has been reset successfully. Redirecting to login...'}
                </p>
                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
