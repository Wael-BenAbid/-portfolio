/**
 * Loading Components
 * Skeleton loaders and spinners for better UX during data fetching
 */

import React from 'react';
import { motion } from 'framer-motion';

// ============================================
// Spinner Component
// ============================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-blue-500 border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

// ============================================
// Skeleton Base Component
// ============================================

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', animate = true }) => (
  <div
    className={`bg-gray-800/50 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    aria-hidden="true"
  />
);

// ============================================
// Project Card Skeleton
// ============================================

export const ProjectCardSkeleton: React.FC = () => (
  <div className="group">
    <Skeleton className="aspect-[4/5] w-full mb-6 rounded-sm" />
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
);

// ============================================
// Projects Grid Skeleton
// ============================================

interface ProjectsSkeletonProps {
  count?: number;
}

export const ProjectsGridSkeleton: React.FC<ProjectsSkeletonProps> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
    {Array.from({ length: count }).map((_, i) => (
      <ProjectCardSkeleton key={i} />
    ))}
  </div>
);

// ============================================
// Project Detail Skeleton
// ============================================

export const ProjectDetailSkeleton: React.FC = () => (
  <div className="bg-[#0a0a0a]">
    {/* Hero Skeleton */}
    <section className="relative h-screen w-full">
      <Skeleton className="absolute inset-0" animate={false} />
      <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-24 pb-24">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-20 w-3/4 md:w-1/2 mb-8" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </section>
    
    {/* Content Skeleton */}
    <section className="py-32 px-8 md:px-24">
      <div className="grid md:grid-cols-12 gap-16">
        <div className="md:col-span-4">
          <Skeleton className="h-4 w-20 mb-6" />
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="md:col-span-8 flex flex-col gap-24">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="aspect-video w-full" />
        </div>
      </div>
    </section>
  </div>
);

// ============================================
// About Page Skeleton
// ============================================

export const AboutSkeleton: React.FC = () => (
  <div className="min-h-screen pt-40 px-8 md:px-24 pb-24">
    {/* Header */}
    <div className="mb-24">
      <Skeleton className="h-20 w-64 mb-8" />
      <Skeleton className="h-6 w-96 mb-4" />
      <Skeleton className="h-6 w-80" />
    </div>
    
    {/* Profile Section */}
    <div className="grid md:grid-cols-2 gap-16 mb-24">
      <div>
        <Skeleton className="aspect-square w-full rounded-2xl mb-8" />
      </div>
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    </div>
    
    {/* Skills Section */}
    <div className="mb-24">
      <Skeleton className="h-8 w-32 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-6 bg-gray-900/50 rounded-lg">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
    
    {/* Experience Section */}
    <div>
      <Skeleton className="h-8 w-40 mb-8" />
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6 bg-gray-900/50 rounded-lg">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================
// Settings Skeleton
// ============================================

export const SettingsSkeleton: React.FC = () => (
  <div className="p-8">
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-10 w-48 mb-8" />
      
      {/* Form Fields */}
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}
      </div>
      
      {/* Buttons */}
      <div className="flex gap-4 mt-8">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-32 rounded-lg" />
      </div>
    </div>
  </div>
);

// ============================================
// Full Page Loading
// ============================================

export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
    <div className="text-center">
      <Spinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-400 font-display text-sm uppercase tracking-widest">{message}</p>
    </div>
  </div>
);

// ============================================
// Inline Loading
// ============================================

interface InlineLoadingProps {
  message?: string;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  message = 'Loading...', 
  className = '' 
}) => (
  <div className={`flex items-center justify-center gap-3 py-8 ${className}`}>
    <Spinner size="sm" />
    <span className="text-gray-400 text-sm">{message}</span>
  </div>
);

// ============================================
// Error Display Component
// ============================================

import { AlertCircle, RefreshCw } from 'lucide-react';
import { APIError } from '../services/api';

interface ErrorDisplayProps {
  error: APIError | Error;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, className = '' }) => {
  const isAPIError = error instanceof APIError;
  const message = isAPIError ? error.message : error.message;
  const status = isAPIError ? error.status : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-xl font-display font-bold mb-2">Something went wrong</h3>
      <p className="text-gray-400 mb-2">{message}</p>
      {status && (
        <p className="text-gray-500 text-sm mb-4">Error code: {status}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </motion.div>
  );
};

// ============================================
// Data Wrapper Component
// ============================================

interface DataWrapperProps<T> {
  data: T | null;
  loading: boolean;
  error: APIError | null;
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
  emptyComponent?: React.ReactNode;
  isEmpty?: (data: T) => boolean;
}

export function DataWrapper<T>({
  data,
  loading,
  error,
  children,
  loadingComponent = <InlineLoading />,
  errorComponent,
  onRetry,
  emptyComponent,
  isEmpty,
}: DataWrapperProps<T>): React.ReactNode {
  if (loading) {
    return loadingComponent;
  }

  if (error) {
    if (errorComponent) {
      return errorComponent;
    }
    return <ErrorDisplay error={error} onRetry={onRetry} />;
  }

  if (!data) {
    return emptyComponent || <p className="text-gray-500 text-center py-8">No data available</p>;
  }

  if (isEmpty && isEmpty(data)) {
    return emptyComponent || <p className="text-gray-500 text-center py-8">No data available</p>;
  }

  return children(data);
}

export default Spinner;