import { useEffect, useRef, useState, useCallback } from 'react'

export function useInfiniteScroll(onLoadMore: () => Promise<void>, options = { threshold: 200 }) {
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  const loadingRef = useRef(false) // Add ref to track loading state

  // Keep the callback reference updated
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  const handleScroll = useCallback(async () => {
    // Use ref instead of state to prevent race conditions
    if (loadingRef.current || !containerRef.current) return

    const container = containerRef.current
    const scrollBottom = container.scrollTop + container.clientHeight
    const threshold = options.threshold

    // Check if we're near the bottom
    if (scrollBottom + threshold >= container.scrollHeight) {
      try {
        loadingRef.current = true // Set loading ref
        setIsLoading(true)
        await onLoadMoreRef.current()
      } finally {
        loadingRef.current = false // Reset loading ref
        setIsLoading(false)
      }
    }
  }, [options.threshold])

  useEffect(() => {
    const currentContainer = containerRef.current
    if (!currentContainer) return

    // Only use scroll event, remove wheel event to prevent duplicate triggers
    const debouncedScroll = debounce(handleScroll, 100) // Add debounce
    currentContainer.addEventListener('scroll', debouncedScroll)

    return () => {
      currentContainer.removeEventListener('scroll', debouncedScroll)
    }
  }, [handleScroll])

  // Add debounce utility function
  function debounce<T extends unknown[]>(
    fn: (...args: T) => void,
    ms: number
  ): (...args: T) => void {
    let timer: NodeJS.Timeout
    return function (this: unknown, ...args: T) {
      clearTimeout(timer)
      timer = setTimeout(() => fn.apply(this, args), ms)
    }
  }

  return {
    containerRef,
    isLoading
  }
}