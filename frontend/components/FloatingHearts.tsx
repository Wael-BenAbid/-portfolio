import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface FloatingHeartsProps {
  count: number;
  onComplete?: () => void;
}

const FloatingHearts: React.FC<FloatingHeartsProps> = ({ count, onComplete }) => {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    if (count <= 0) return;

    // Create hearts at random positions
    const newHearts = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 80 - 40,
      y: Math.random() * 60 - 30,
      delay: i * 0.05,
    }));

    setHearts(newHearts);

    // Clear hearts after animation completes
    const timer = setTimeout(() => {
      setHearts([]);
      if (onComplete) onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ 
              opacity: 0, 
              scale: 0, 
              x: heart.x, 
              y: heart.y 
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [heart.y, heart.y - 100],
              rotate: [0, 360],
            }}
            transition={{
              duration: 1.5,
              delay: heart.delay,
              ease: "easeOut",
            }}
            className="absolute"
          >
            <Heart 
              size={32 + Math.random() * 48}
              className="text-red-500 fill-red-500/50"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingHearts;
