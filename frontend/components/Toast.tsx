import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast, Toast } from '../contexts/ToastContext';

interface ToastComponentProps {
  toast: Toast;
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast }) => {
  const { removeToast } = useToast();
  const timerRef = useRef<any | null>(null);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      timerRef.current = setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.duration, removeToast, toast.id]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackground = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-[#1a1a1a] border-green-500/50';
      case 'error':
        return 'bg-[#1a1a1a] border-red-500/50';
      case 'info':
        return 'bg-[#1a1a1a] border-blue-500/50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 400 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 400 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative flex items-center gap-3 px-6 py-4 rounded-lg border text-white shadow-lg backdrop-blur-sm min-w-[300px] max-w-[400px] ${getBackground()}`}
    >
      {getIcon()}
      
      <div className="flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-white" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastComponent key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};