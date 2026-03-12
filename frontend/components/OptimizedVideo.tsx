import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OptimizedVideoProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  lazy?: boolean;
  placeholder?: boolean;
  grayscale?: boolean;
  hoverEffects?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Video Component
 * - Lazy loading by default
 * - Blur placeholder while loading
 * - Supports video files (mp4, webm, ogg)
 */
export const OptimizedVideo: React.FC<OptimizedVideoProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  containerClassName = '',
  lazy = true,
  placeholder = true,
  grayscale = false,
  hoverEffects = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const videoRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    console.error('OptimizedVideo error:', src);
    setHasError(true);
    onError?.();
  };

  return (
    <div 
      ref={videoRef} 
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {placeholder && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load video</span>
        </div>
      )}

      {/* Actual Video */}
      {isInView && !hasError && src ? (
         <motion.video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            width: '100%',
            height: 'auto',
            objectFit: objectFit,
            objectPosition: objectPosition
          }}
          className={`
              ${grayscale ? 'grayscale' : ''}
              ${hoverEffects ? 'transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0' : ''}
              ${className}
            `}
        />
      ) : null}
    </div>
  );
};

export default OptimizedVideo;
