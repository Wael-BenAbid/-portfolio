
import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[1000] bg-[#0f0f0f] flex flex-col items-center justify-center">
      <div className="relative overflow-hidden mb-4">
        <motion.h2
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="text-2xl font-display font-bold tracking-[0.5em] uppercase"
        >
          ADRIAN
        </motion.h2>
      </div>
      <div className="w-32 h-px bg-gray-800 relative overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute top-0 left-0 h-full w-full bg-blue-500"
        />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="mt-6 text-[10px] font-display uppercase tracking-[0.3em]"
      >
        Initializing Experience
      </motion.p>
    </div>
  );
};
