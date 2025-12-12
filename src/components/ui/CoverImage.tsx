import React, { useState, useRef, useLayoutEffect } from 'react';
import { Music } from 'lucide-react';
import { clsx } from 'clsx';

interface CoverImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  iconSize?: number | string;
}

export const CoverImage = React.forwardRef<HTMLImageElement, CoverImageProps>(
  ({ src, alt, className, iconSize = "40%", ...props }, ref) => {
    const [hasError, setHasError] = useState(false);
    const prevSrcRef = useRef(src);

    // Use useLayoutEffect to reset error state synchronously before paint
    /* eslint-disable react-hooks/set-state-in-effect -- Intentional: sync derived state when src prop changes */
    useLayoutEffect(() => {
      if (prevSrcRef.current !== src) {
        prevSrcRef.current = src;
        setHasError(false);
      }
    }, [src]);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (!src || hasError) {
      return (
        <div
          className={clsx("flex items-center justify-center bg-gray-800 text-gray-600 overflow-hidden", className)}
          role="img"
          aria-label={alt}
        >
          <Music size={iconSize} />
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        onError={() => setHasError(true)}
        {...props}
      />
    );
  }
);

CoverImage.displayName = 'CoverImage';
