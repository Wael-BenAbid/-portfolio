import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOptimizedImageUrl, isVideoUrl } from '../constants';

interface OptimizedImageProps {
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
 * Optimized Image Component
 * - Lazy loading by default
 * - Blur placeholder while loading
 * - Optimized Unsplash URLs
 * - Error fallback
 * - Supports image files (jpg, jpeg, png, gif, webp)
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
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // Get optimized URL
  const optimizedSrc = getOptimizedImageUrl(src, width || 800);
  
  // Get WebP version for modern browsers (only for images)
  const webpSrc = src && src.includes('unsplash.com') && optimizedSrc 
    ? (optimizedSrc as string).replace(/&auto=format/, '&auto=format&fm=webp')
    : optimizedSrc;

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

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('OptimizedImage error:', target?.src || 'Unknown source');
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
      {isInView && !hasError && optimizedSrc ? (
         <motion.img
          src={optimizedSrc}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          onLoad={handleLoad}
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
  const [hasError, setHasError] = useState(false);

  // Check if src is a video file (including extension-less Cloudinary /video/upload/ URLs)
  const isVideo = isVideoUrl(src);
  
  const optimizedSrc = isVideo ? src : getOptimizedImageUrl(src, 800);
  const optimizedSrcSet = srcSet
    .map(({ width, descriptor }) => {
      const optimizedUrl = getOptimizedImageUrl(src, width);
      return optimizedUrl ? `${optimizedUrl} ${descriptor}` : undefined;
    })
    .filter((item): item is string => item !== undefined)
    .join(', ');

  const handleLoad = () => {
    setIsLoaded(true);
    props.onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    props.onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${props.containerClassName || ''}`}>
      {props.placeholder && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}

      {optimizedSrc && isVideo ? (
        <video
          src={optimizedSrc}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${props.className || ''}`}
        />
      ) : optimizedSrc ? (
        <img
          src={optimizedSrc}
          srcSet={optimizedSrcSet}
          sizes={sizes}
          alt={alt}
          loading={props.lazy ? 'lazy' : 'eager'}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${props.className || ''}`}
        />
      ) : null}
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
  const [hasError, setHasError] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Check if src is a video file (including extension-less Cloudinary /video/upload/ URLs)
  const isVideo = isVideoUrl(src);

  const optimizedSrc = isVideo ? src : getOptimizedImageUrl(src, 1920);

  useEffect(() => {
    if (!parallax) return;

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          transform: parallax ? `translateY(${scrollY * 0.3}px)` : undefined,
        }}
      >
        {optimizedSrc && isVideo ? (
            <video
              src={optimizedSrc}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              onLoadedData={handleLoad}
              onError={handleError}
            />
          ) : optimizedSrc ? (
            <img
              src={optimizedSrc}
              alt=""
              className="w-full h-full object-cover"
              onLoad={handleLoad}
              onError={handleError}
            />
          ) : null}
        {overlay && (
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        )}
        {hasError && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Failed to load background image</span>
          </div>
        )}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default OptimizedImage;