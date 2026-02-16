import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOptimizedImageUrl } from '../constants';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  lazy?: boolean;
  placeholder?: boolean;
  grayscale?: boolean;
  hoverEffects?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Image Component
 * - Lazy loading by default
 * - Blur placeholder while loading
 * - Optimized Unsplash URLs
 * - Error fallback
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
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
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // Get optimized URL
  const optimizedSrc = getOptimizedImageUrl(src, width || 800);

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

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div 
      ref={imgRef} 
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
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}

      {/* Actual Image */}
      {isInView && !hasError && (
        <motion.img
          src={optimizedSrc}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className={`
            w-full h-full object-cover
            ${grayscale ? 'grayscale' : ''}
            ${hoverEffects ? 'transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0' : ''}
            ${className}
          `}
        />
      )}
    </div>
  );
};

/**
 * Responsive Image Component
 * Serves different sizes based on viewport
 */
interface ResponsiveImageProps extends OptimizedImageProps {
  sizes?: string;
  srcSet?: { width: number; descriptor: string }[];
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes = '100vw',
  srcSet = [
    { width: 400, descriptor: '400w' },
    { width: 800, descriptor: '800w' },
    { width: 1200, descriptor: '1200w' },
  ],
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const optimizedSrcSet = srcSet
    .map(({ width, descriptor }) => `${getOptimizedImageUrl(src, width)} ${descriptor}`)
    .join(', ');

  return (
    <div className={`relative overflow-hidden ${props.containerClassName || ''}`}>
      {props.placeholder && !isLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
      <img
        src={getOptimizedImageUrl(src, 800)}
        srcSet={optimizedSrcSet}
        sizes={sizes}
        alt={alt}
        loading={props.lazy ? 'lazy' : 'eager'}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${props.className || ''}`}
      />
    </div>
  );
};

/**
 * Background Image Component
 * For hero sections and backgrounds
 */
interface BackgroundImageProps {
  src: string;
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  parallax?: boolean;
}

export const BackgroundImage: React.FC<BackgroundImageProps> = ({
  src,
  children,
  className = '',
  overlay = true,
  overlayOpacity = 0.3,
  parallax = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!parallax) return;

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax]);

  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          transform: parallax ? `translateY(${scrollY * 0.3}px)` : undefined,
        }}
      >
        <img
          src={getOptimizedImageUrl(src, 1920)}
          alt=""
          className="w-full h-full object-cover"
          onLoad={() => setIsLoaded(true)}
        />
        {overlay && (
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        )}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default OptimizedImage;