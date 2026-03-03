import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { MediaItem } from '../types';

interface ImageCarouselProps {
  media: MediaItem[];
  projectTitle: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ media, projectTitle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-lg">
      {/* Carousel Container */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {media[currentIndex].type === 'image' && media[currentIndex].url && (
              <img
                src={media[currentIndex].url}
                alt={`${projectTitle} - Media ${currentIndex + 1}`}
                className="w-full h-full object-contain"
              />
            )}
            {media[currentIndex].type === 'video' && media[currentIndex].url && (
              <video
                src={media[currentIndex].url}
                poster={media[currentIndex].thumbnail_url || undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-cover object-center"
              />
            )}
            {media[currentIndex].caption && (
              <p className="absolute bottom-6 left-6 text-sm text-white/90 italic backdrop-blur-sm bg-black/30 px-4 py-2 rounded z-10">
                {media[currentIndex].caption}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrevious}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 p-4 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 backdrop-blur-sm z-20"
        aria-label="Previous media"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 p-4 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 backdrop-blur-sm z-20"
        aria-label="Next media"
      >
        <ChevronRight size={24} />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
        {media.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-blue-500 scale-125'
                : 'bg-gray-400/50 hover:bg-gray-400'
            }`}
            aria-label={`Go to media ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
