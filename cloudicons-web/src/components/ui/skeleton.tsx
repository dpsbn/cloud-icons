"use client"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  )
}

export function IconSkeleton() {
  return (
    <div className="p-4 flex flex-col items-center">
      <Skeleton className="w-24 h-24 mb-2" />
      <Skeleton className="w-20 h-4" />
    </div>
  )
}

export function IconGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      data-testid="icon-grid-skeleton"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="border rounded-lg shadow-sm dark:border-gray-700"
        >
          <IconSkeleton />
        </div>
      ))}
    </div>
  )
}
