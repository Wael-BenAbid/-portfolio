import React, { useState, useRef } from 'react';
import { Heart } from 'lucide-react';
import FloatingHearts from './FloatingHearts';
import { API_BASE_URL } from '../constants';
import { authFetch } from '../services/api';

interface LikeButtonProps {
  contentId: number;
  contentType: 'project' | 'media';
  initialLiked?: boolean;
  initialLikesCount?: number;
  onLike?: (liked: boolean, count: number) => void;
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  contentId,
  contentType,
  initialLiked = false,
  initialLikesCount = 0,
  onLike,
  className = '',
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [showHearts, setShowHearts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const animationRef = useRef<number | null>(null);

  const handleLike = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await authFetch(
        `${API_BASE_URL}/interactions/like/${contentType}/${contentId}/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikesCount(data.likes_count || initialLikesCount + (data.liked ? 1 : -1));
        
        // Show floating hearts animation
        if (data.liked) {
          setShowHearts(5 + Math.floor(Math.random() * 5));
        }

        if (onLike) {
          onLike(data.liked, data.likes_count);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* Floating Hearts Animation */}
      {showHearts > 0 && (
        <FloatingHearts
          count={showHearts}
          onComplete={() => setShowHearts(0)}
        />
      )}

      {/* Like Button */}
       <button
        onClick={(e) => {
          e.stopPropagation();
          handleLike();
        }}
        disabled={isLoading}
        className={`relative p-2 rounded-full transition-all duration-300 ${
          isLoading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-red-500/10 active:scale-95'
        }`}
        aria-label={isLiked ? 'Unlike' : 'Like'}
      >
        <Heart
          size={24}
          className={`transition-all duration-300 ${
            isLiked
              ? 'text-red-500 fill-red-500 scale-110'
              : 'text-gray-400 hover:text-red-500'
          }`}
        />
      </button>

      {/* Likes Count */}
      <span
        className={`text-sm font-medium transition-all duration-300 ${
          isLiked ? 'text-red-500' : 'text-gray-500'
        }`}
      >
        {likesCount}
      </span>
    </div>
  );
};

export default LikeButton;
