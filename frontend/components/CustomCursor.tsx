
import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface CustomCursorProps {
  cursorTheme?: string;
  cursorSize?: number;
  customCursorColor?: string;
  primaryColor?: string;
  cursorEnabledMobile?: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({
  cursorTheme = 'default',
  cursorSize = 20,
  customCursorColor = '#6366f1',
  primaryColor = '#6366f1',
  cursorEnabledMobile = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 200 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Detect touch devices (mobile/tablet)
    const mq = window.matchMedia('(hover: none) or (pointer: coarse)');
    setIsTouchDevice(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (isTouchDevice && !cursorEnabledMobile) return;
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleHoverStart = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.dataset.hover === 'true'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleHoverStart);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleHoverStart);
    };
  }, [cursorX, cursorY, isTouchDevice, cursorEnabledMobile]);

  // Don't render custom cursor on touch devices
  if (isTouchDevice && !cursorEnabledMobile) return null;

  // Determine cursor color based on theme
  const getCursorColor = () => {
    switch (cursorTheme) {
      case 'neon':
        return '#00ff00';
      case 'minimal':
        return '#ffffff';
      case 'custom':
        return customCursorColor;
      default:
        return primaryColor;
    }
  };

  // Determine cursor size
  const getCursorSize = () => {
    return cursorSize;
  };

  const cursorColor = getCursorColor();
  const size = getCursorSize();

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          width: size * 2,
          height: size * 2,
          border: `1px solid ${cursorColor}`,
          scale: isHovering ? 2.5 : 1,
          backgroundColor: isHovering ? `${cursorColor}20` : 'transparent',
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
      />
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          width: size / 2,
          height: size / 2,
          backgroundColor: cursorColor,
        }}
      />
    </>
  );
};
