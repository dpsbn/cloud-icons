import { useState } from 'react'
import { Icon } from '@/types/icon'
import { useToast } from '@/lib/utils'
import { copySvgToClipboard, downloadSvg, downloadPng } from '@/lib/icon-utils'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface IconCardProps {
  icon: Icon
}

export default function IconCard({ icon }: IconCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleCopyToClipboard = async () => {
    try {
      await copySvgToClipboard(icon)
      showToast(`${icon.icon_name} SVG copied to clipboard!`, 'success')
    } catch (err) {
      console.error('Failed to copy SVG:', err)
      showToast('Failed to copy SVG', 'error')
    }
  }

  const handleDownloadSvg = () => {
    try {
      downloadSvg(icon)
    } catch (err) {
      console.error('Failed to download SVG:', err)
      showToast('Failed to download SVG', 'error')
    }
  }

  const handleDownloadPng = async () => {
    try {
      setIsLoading(true)
      await downloadPng(icon)
    } catch (err) {
      console.error('Failed to download PNG:', err)
      showToast('Failed to download PNG', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="group relative hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col items-center">
          <div
            className="w-24 h-24 flex items-center justify-center mb-2"
            dangerouslySetInnerHTML={{ __html: icon.svg_content }}
          />
          <p className="text-sm text-center text-gray-600 dark:text-gray-300 truncate w-full">
            {icon.icon_name}
          </p>
        </div>

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground p-1.5 rounded-md"
            onClick={handleCopyToClipboard}
            title="Copy SVG"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="bg-primary hover:bg-primary/90 text-primary-foreground p-1.5 rounded-md"
                title="Download"
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleDownloadSvg}>
                Download SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPng} disabled={isLoading}>
                Download PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
