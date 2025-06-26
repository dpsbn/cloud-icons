"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState, useCallback } from "react"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { useToast } from "@/components/ui/toast"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@/components/ui/dropdown"
import { downloadSvg, downloadPng } from "@/utils/iconDownloader"
import { IconGridSkeleton } from "@/components/ui/skeleton"
import { ErrorMessage } from "@/components/ui/error-message"

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

// Default icon size if not specified
const DEFAULT_ICON_SIZE = 64;
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function IconGrid({
  onTotalCountChange,
  provider = 'azure',
  searchQuery = '',
  tags = [],
  iconSize = DEFAULT_ICON_SIZE
}: {
  onTotalCountChange?: (count: number) => void,
  provider?: string,
  searchQuery?: string,
  tags?: string[],
  iconSize?: number
}) {
  const [icons, setIcons] = useState<Icon[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showToast, ToastContainer } = useToast()
  const [isFetching, setIsFetching] = useState(false)

  const fetchIcons = useCallback(async (pageNum: number, shouldAppend = true) => {
    // Don't fetch if already fetching
    if (isFetching) return;

    // Reset error state before fetching
    setError(null);
    setIsFetching(true);

    try {
      // Build URL with search query and tags if provided
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';

      // Add tags as filter parameters if any are selected
      let tagsParam = '';
      if (tags.length > 0) {
        tagsParam = `&tags=${tags.join(',')}`;
      }

      const url = `${API_URL}/api/${provider}/icons?page=${pageNum}&pageSize=25&size=${iconSize}${searchParam}${tagsParam}`;

      const response = await fetch(url);

      // Check if the response is ok (status in the range 200-299)
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: IconsResponse = await response.json();

      // Validate the response data
      if (!data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from API');
      }

      if (shouldAppend) {
        setIcons(prev => [...prev, ...data.data])
      } else {
        setIcons(data.data)
        // Update total count only on first page load
        if (onTotalCountChange) {
          onTotalCountChange(data.total)
        }
      }

      setHasMore(data.data.length === 25)
      setPage(pageNum + 1)
    } catch (error) {
      console.error('Error fetching icons:', error)
      setError(error instanceof Error ? error.message : 'Failed to load icons. Please try again.');
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }, [onTotalCountChange, provider, searchQuery, tags, iconSize])

  // Initial fetch and reset when filters change
  useEffect(() => {
    setLoading(true)
    setPage(1)
    setIcons([]) // Clear existing icons
    fetchIcons(1, false)
  }, [provider, searchQuery, tags, iconSize, fetchIcons])

  const { targetRef } = useInfiniteScroll(
    useCallback(() => {
      if (hasMore && !loading && !isFetching && icons.length > 0) {
        fetchIcons(page, true)
      }
    }, [hasMore, loading, isFetching, page, fetchIcons, icons.length])
  )

  // Show error message if there's an error
  if (error) {
    return <ErrorMessage message={error} onRetry={() => {
      setPage(1);
      setLoading(true);
      fetchIcons(1, false);
    }} />
  }

  // Show skeleton while loading initial data
  if (loading && icons.length === 0) {
    return <IconGridSkeleton count={25} />
  }

  // Handle keyboard navigation for the icon grid
  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, icon: Icon) => {
    // Handle Enter or Space key to show details
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // You could add a modal or details view here in the future
      showToast(`Selected ${icon.icon_name}`, 'info');
    }
  };

  // Handle keyboard navigation for action buttons
  const handleCopyKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, icon: Icon) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(icon.svg_content)
        .then(() => {
          showToast(`${icon.icon_name} SVG copied to clipboard!`, 'success');
        })
        .catch(err => {
          console.error('Failed to copy SVG:', err);
          showToast('Failed to copy SVG', 'error');
        });
    }
  };

  return (
    <>
      <ToastContainer />
      <div
        className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'
        role="grid"
        aria-label={`${provider} icons grid`}
      >
        {icons.map((icon) => (
          <Card
            key={icon.id}
            className='hover:shadow-lg transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-blue-500'
            tabIndex={0}
            onKeyDown={(e) => handleCardKeyDown(e, icon)}
            role="gridcell"
            aria-label={`${icon.icon_name} icon`}
          >
            <CardContent className='p-4 flex flex-col items-center relative group'>
              <div
                className='w-24 h-24 flex items-center justify-center mb-2'
                role="img"
                aria-label={`${icon.icon_name} icon visualization`}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: icon.svg_content }}
                  aria-hidden="true" // Hide SVG from screen readers as we provide a label
                />
              </div>
              <p
                className='text-sm text-center text-gray-600 dark:text-gray-300'
                id={`icon-name-${icon.id}`}
              >
                {icon.icon_name}
              </p>

              {/* Action buttons - visible on hover and focus */}
              <div
                className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                role="toolbar"
                aria-label={`Actions for ${icon.icon_name}`}
              >
                {/* Copy button */}
                <button
                  className='bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 text-white p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(icon.svg_content)
                      .then(() => {
                        showToast(`${icon.icon_name} SVG copied to clipboard!`, 'success');
                      })
                      .catch(err => {
                        console.error('Failed to copy SVG:', err);
                        showToast('Failed to copy SVG', 'error');
                      });
                  }}
                  onKeyDown={(e) => handleCopyKeyDown(e, icon)}
                  aria-label={`Copy ${icon.icon_name} SVG code`}
                  title={`Copy ${icon.icon_name} SVG code`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>

                {/* Download dropdown */}
                <Dropdown>
                  <DropdownTrigger>
                    <button
                      className='bg-green-500 hover:bg-green-600 focus:bg-green-700 text-white p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                      aria-label={`Download ${icon.icon_name} options`}
                      title={`Download ${icon.icon_name}`}
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem onClick={() => downloadSvg(icon.svg_content, icon.icon_name)}>
                      Download SVG
                    </DropdownItem>
                    <DropdownItem onClick={() => downloadPng(icon.svg_content, icon.icon_name, iconSize)}>
                      Download PNG
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading indicator */}
      {isFetching && hasMore && (
        <div className="mt-4 text-center">
          <IconGridSkeleton count={5} />
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={targetRef} style={{ height: '20px' }} />
    </>
  )
}
