import { useState, useCallback, useEffect } from "react"
import { getIcons } from '@/api/icons'
import { Icon } from '@/types/icon'

interface UseIconsProps {
  provider: string
  iconSize: string
  searchQuery?: string
  tags?: string[]
  pageSize?: number
  onTotalCountChange?: (count: number) => void
}

export function useIcons({
  provider,
  iconSize,
  searchQuery = '',
  tags = [],
  pageSize = 50,
  onTotalCountChange
}: UseIconsProps) {
  const [icons, setIcons] = useState<Icon[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // Memoize the search parameters to prevent unnecessary re-renders
  const searchParams = useCallback(() => ({
    provider,
    pageSize,
    size: iconSize,
    search: searchQuery,
    tags: tags.length > 0 ? tags : undefined,
  }), [provider, pageSize, iconSize, searchQuery, tags])

  const fetchIcons = useCallback(async (isInitialFetch = false) => {
    if (!provider) {
      setError('Provider is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = {
        ...searchParams(),
        page: isInitialFetch ? 1 : page,
      }
      console.log('Fetching icons with params:', params)

      const response = await getIcons(params)
      console.log('Received data:', response)

      // Handle the new API response format where icons are in the data property
      const newIcons = Array.isArray(response?.data) ? response.data : []
      console.log('Processed icons:', newIcons)

      if (isInitialFetch) {
        console.log('Setting initial icons')
        setIcons(newIcons)
        setPage(2)
      } else {
        console.log('Appending icons')
        setIcons(prev => {
          const updated = [...prev, ...newIcons]
          console.log('Updated icons array:', updated)
          return updated
        })
        setPage(prev => prev + 1)
      }

      setHasMore(newIcons.length === pageSize && newIcons.length > 0)
      onTotalCountChange?.(response?.total || 0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching icons:', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [provider, page, searchParams, pageSize, onTotalCountChange])

  // Effect for initial load and search parameter changes
  useEffect(() => {
    console.log('Search params changed:', {
      provider,
      iconSize,
      searchQuery,
      tags: tags.join(','),
      pageSize
    })
    setHasMore(true)
    setError(null)
    fetchIcons(true)
  }, [provider, iconSize, searchQuery, tags.join(','), pageSize]) // Only re-run when search parameters change

  return {
    icons,
    loading,
    error,
    hasMore,
    fetchMore: () => fetchIcons(false)
  }
}
