import { useEffect, useRef, useState } from 'react'

export function useInfiniteScroll(callback: () => void) {
  const [isFetching, setIsFetching] = useState(false)
  const observerRef = useRef<IntersectionObserver>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0,
    }

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetching) {
        setIsFetching(true)
        callback()
      }
    }, options)

    return () => observerRef.current?.disconnect()
  }, [callback, isFetching])

  useEffect(() => {
    const currentTarget = targetRef.current
    const currentObserver = observerRef.current

    if (currentTarget && currentObserver) {
      currentObserver.observe(currentTarget)
    }

    return () => {
      if (currentTarget && currentObserver) {
        currentObserver.unobserve(currentTarget)
      }
    }
  }, [])

  return { targetRef, isFetching, setIsFetching }
}