import { Icon } from '@/types/icon'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Copy } from 'lucide-react'

interface IconCardProps {
  icon: Icon
}

export function IconCard({ icon }: IconCardProps) {
  const handleCopySVG = async () => {
    try {
      await navigator.clipboard.writeText(icon.svg_content)
      console.log(`${icon.icon_name} SVG copied to clipboard!`)
    } catch (error) {
      console.error('Failed to copy SVG:', error)
    }
  }

  const handleDownloadSVG = async () => {
    try {
      const blob = new Blob([icon.svg_content], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${icon.icon_name}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download SVG:', error)
    }
  }

  const handleDownloadPNG = async () => {
    try {
      const response = await fetch(icon.png_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${icon.icon_name}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download PNG:', error)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 flex flex-col items-center gap-2">
        <div
          className="w-full aspect-square flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
          dangerouslySetInnerHTML={{ __html: icon.svg_content }}
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
          {icon.icon_name}
        </p>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={handleCopySVG}>
            <Copy className="h-4 w-4 mr-1" />
            SVG
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadSVG}>
            <Download className="h-4 w-4 mr-1" />
            SVG
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPNG}>
            <Download className="h-4 w-4 mr-1" />
            PNG
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
