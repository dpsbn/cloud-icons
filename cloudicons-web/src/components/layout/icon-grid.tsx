"use client"

import InfiniteScroll from '@/components/ui/infinite-scroll'
import IconCard from '@/components/icon-card'
import { useIcons } from '@/hooks/use-icons'

interface IconGridProps {
  provider: string
  iconSize: string
  searchQuery?: string
  tags?: string[]
  onTotalCountChange?: (count: number) => void
}

export const IconGrid = ({ 
  provider, 
  iconSize, 
  searchQuery = '', 
  tags = [], 
  onTotalCountChange 
}: IconGridProps) => {
  const { 
    icons, 
    loading, 
    error, 
    hasMore, 
    fetchMore 
  } = useIcons({
    provider,
    iconSize,
    searchQuery,
    tags,
    onTotalCountChange
  })

  if (error && icons.length === 0) {
    return <div className="text-center text-red-500">{error}</div>
  }

  return (
    <InfiniteScroll
      isLoading={loading}
      hasMore={hasMore}
      next={fetchMore}
      threshold={0.8}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {icons.map((icon) => (
          <IconCard key={icon.id} icon={icon} />
        ))}
        {loading && (
          <div className="col-span-full flex justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </InfiniteScroll>
  )
}
