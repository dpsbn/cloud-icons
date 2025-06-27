import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/lib/toast"
import { Icon } from '@/types/icon'

interface UseIconsProps {
  provider: string
  iconSize: string
  searchQuery?: string
  tags?: string[]
  pageSize?: number
  onTotalCountChange?: (count: number) => void
}

interface IconsResponse {
  icons: Icon[]
  total: number
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
  const { showToast, toast } = useToast()

  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY

  const fetchIcons = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
      const tagsParam = tags.length > 0 ? `&tags=${tags.join(',')}` : ''
      const url = `${API_URL}/api/${provider}/icons?page=${page}&pageSize=${pageSize}&size=${iconSize}${searchParam}${tagsParam}`

      const response = await fetch(url, {
        headers: API_KEY ? {
          'X-API-Key': API_KEY
        } : undefined
      })

      if (!response.ok) {
        if (response.status === 429) {
          showToast('Please wait a moment before trying again.', 'warning', 'Rate limit exceeded')
          return
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data: IconsResponse = await response.json()

      setIcons(prev => [...prev, ...data.icons])
      setHasMore(data.icons.length === pageSize)
      setPage(prev => prev + 1)
      onTotalCountChange?.(data.total)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }, [provider, iconSize, searchQuery, tags, page, pageSize, showToast, onTotalCountChange, API_URL, API_KEY])

  // Reset and initial load when search params change
  useEffect(() => {
    setIcons([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [provider, iconSize, searchQuery, tags])

  // Load initial data when page is reset
  useEffect(() => {
    if (page === 1) {
      fetchIcons()
    }
  }, [page, fetchIcons])

  return {
    icons,
    loading,
    error,
    hasMore,
    fetchMore: fetchIcons
  }
}
