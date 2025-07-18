"use client"

import * as React from 'react';

interface InfiniteScrollProps {
  isLoading: boolean;
  hasMore: boolean;
  next: () => unknown;
  threshold?: number;
  root?: Element | Document | null;
  rootMargin?: string;
  reverse?: boolean;
  children?: React.ReactNode;
}

interface RefAttributes {
  ref?: React.Ref<HTMLElement>;
}

export default function InfiniteScroll({
  isLoading,
  hasMore,
  next,
  threshold = 1,
  root = null,
  rootMargin = '0px',
  reverse,
  children,
}: InfiniteScrollProps) {
  const observer = React.useRef<IntersectionObserver>(null);

  // Flatten children before using them in the callback
  const flattenChildren = React.useMemo(() => React.Children.toArray(children), [children]);

  const observerRef = React.useCallback(
    (element: HTMLElement | null) => {
      let safeThreshold = threshold;
      if (threshold < 0 || threshold > 1) {
        console.warn(
          'threshold should be between 0 and 1. You are exceed the range. will use default value: 1',
        );
        safeThreshold = 1;
      }

      if (isLoading) return;

      if (observer.current) observer.current.disconnect();
      if (!element) return;

      observer.current = new IntersectionObserver(
        (entries) => {
          // Only call next if we have children, are intersecting, and have more items
          if (entries[0].isIntersecting && hasMore && flattenChildren.length > 0) {
            next();
          }
        },
        { threshold: safeThreshold, root, rootMargin },
      );
      observer.current.observe(element);
    },
    [hasMore, isLoading, next, threshold, root, rootMargin, flattenChildren],
  );

  return (
    <>
      {flattenChildren.map((child, index) => {
        if (!React.isValidElement(child)) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('You should use a valid element with InfiniteScroll');
          }
          return child;
        }

        const isObserveTarget = reverse ? index === 0 : index === flattenChildren.length - 1;
        const ref = isObserveTarget ? observerRef : null;
        return React.cloneElement(child as React.ReactElement<RefAttributes>, { ref });
      })}
    </>
  );
}
