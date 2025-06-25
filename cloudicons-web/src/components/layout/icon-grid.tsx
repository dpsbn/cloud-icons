"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState, useCallback } from "react"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"

interface Icon {
  id: string
  provider: string
  icon_name: string
  description: string
  tags: string[]
  svg_path: string
  license: string
  svg_content: string
}

interface IconsResponse {
  total: number
  page: number
  pageSize: number
  data: Icon[]
}

const ICON_SIZE = 64;
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function IconGrid() {
  const [icons, setIcons] = useState<Icon[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)

  const fetchIcons = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/azure/icons?page=${page}&pageSize=25&size=${ICON_SIZE}`)
      const data: IconsResponse = await response.json()

      if (page === 1) {
        setIcons(data.data)
      } else {
        setIcons(prev => [...prev, ...data.data])
      }

      setHasMore(data.data.length === 25)
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching icons:', error)
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }, [page])

  const { targetRef, isFetching, setIsFetching } = useInfiniteScroll(
    useCallback(() => {
      if (hasMore && !loading) {
        fetchIcons()
      }
    }, [hasMore, loading, fetchIcons])
  )

  useEffect(() => {
    fetchIcons()
  }, [])

  if (loading && page === 1) {
    return <div className="text-center py-8">Loading icons...</div>
  }

  return (
    <>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
        {icons.map((icon) => (
          <Card
            key={icon.id}
            className='hover:shadow-lg transition-shadow cursor-pointer'>
            <CardContent className='p-4 flex flex-col items-center'>
              <div className='w-24 h-24 flex items-center justify-center mb-2'>
                <div
                  dangerouslySetInnerHTML={{ __html: icon.svg_content }}
                />
              </div>
              <p className='text-sm text-center text-gray-600 dark:text-gray-300'>
                {icon.icon_name}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {hasMore && (
        <div
          ref={targetRef}
          className="h-10 w-full flex items-center justify-center mt-4"
        >
          {isFetching && <div>Loading more icons...</div>}
        </div>
      )}
    </>
  )
}
