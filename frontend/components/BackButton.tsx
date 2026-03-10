import React, { useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  className?: string;
  to?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ className = '', to }) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLButtonElement>(null);

  // Mouse position for 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics
  const springX = useSpring(mouseX, { stiffness: 180, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 180, damping: 18 });

  // Map mouse offset → rotation angles (±14 deg)
  const rotateY = useTransform(springX, [-0.5, 0.5], [-14, 14]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 800,
      }}
      whileHover={{ scale: 1.08, z: 20 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative flex items-center gap-2 px-4 py-2 backdrop-blur-md rounded-xl text-white overflow-hidden cursor-pointer select-none ${className}`}
    >
      {/* Glowing border */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl border border-white/20 group-hover:border-cyan-400/60 transition-colors duration-300"
        style={{ boxShadow: undefined }}
      />
      {/* Glow bg on hover */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.18) 0%, transparent 70%)',
        }}
      />
      {/* Static dark bg */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl bg-white/[0.07] group-hover:bg-white/[0.13] transition-colors duration-300"
      />

      {/* Arrow icon — slides left on hover */}
      <motion.span
        className="relative z-10 flex items-center"
        style={{ translateZ: 8 }}
        initial={{ x: 0 }}
        whileHover={{ x: -3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <ArrowLeft size={16} strokeWidth={2.5} className="text-cyan-300 group-hover:text-cyan-200 transition-colors" />
      </motion.span>

      {/* Label */}
      <span className="relative z-10 text-sm font-medium tracking-wide text-white/80 group-hover:text-white transition-colors" style={{ translateZ: 8 }}>
        Retour
      </span>
    </motion.button>
  );
};
