import React, { useEffect, useRef } from 'react';

interface RadialProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  text?: string;
  subtitle?: string;
  showPercentage?: boolean;
}

const RadialProgress: React.FC<RadialProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#e74c3c',
  backgroundColor = '#f0f0f0',
  text,
  subtitle,
  showPercentage = true,
}) => {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (circleRef.current) {
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      
      const offset = circumference - (percentage / 100) * circumference;
      circleRef.current.style.strokeDasharray = `${circumference} ${circumference}`;
      circleRef.current.style.strokeDashoffset = `${offset}`;
    }
  }, [percentage, size, strokeWidth]);

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            className="transition-all duration-300"
          />
          <circle
            ref={circleRef}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl font-bold">{percentage}%</div>
          </div>
        )}
      </div>
      {text && (
        <div className="text-center mt-4">
          <div className="font-bold text-xl">{text}</div>
          {subtitle && (
            <div className="text-sm text-gray-600">{subtitle}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RadialProgress;
