import React, { useState } from 'react';

interface ImageRevealProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
}

export const ImageReveal: React.FC<ImageRevealProps> = ({
  containerClassName,
  className,
  onLoad,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnimComplete, setIsAnimComplete] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
    // After reveal animation (1.2s), switch to standard interaction speed (500ms)
    // This ensures hover effects feel snappy after the slow reveal
    setTimeout(() => setIsAnimComplete(true), 1200);
  };

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 dark:bg-zinc-800 ${containerClassName || ''}`}
    >
      {/* Skeleton / Placeholder */}
      <div
        className={`absolute inset-0 bg-gray-200 dark:bg-zinc-700 animate-pulse z-0 transition-opacity duration-500 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <img
        {...props}
        onLoad={handleLoad}
        className={`
          relative z-10 w-full h-full object-cover will-change-transform
          transition-all ease-out
          ${isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-xl scale-110'}
          ${isAnimComplete ? 'duration-500' : 'duration-[1200ms]'}
          ${className || ''}
        `}
      />
    </div>
  );
};
