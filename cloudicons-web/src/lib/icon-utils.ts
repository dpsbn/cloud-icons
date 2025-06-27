import { Icon } from '@/types/icon'

/**
 * Utility functions for working with icons
 */

/**
 * Copy the SVG content of an icon to the clipboard
 * @param icon The icon to copy
 * @returns A promise that resolves when the SVG is copied
 */
export async function copySvgToClipboard(icon: Icon): Promise<void> {
  await navigator.clipboard.writeText(icon.svg_content)
}

/**
 * Download an icon as an SVG file
 * @param icon The icon to download
 */
export function downloadSvg(icon: Icon): void {
  const blob = new Blob([icon.svg_content], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${icon.icon_name}.svg`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Download an icon as a PNG file
 * @param icon The icon to download
 * @returns A promise that resolves when the PNG is downloaded
 */
export async function downloadPng(icon: Icon): Promise<void> {
  const svgBlob = new Blob([icon.svg_content], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()

  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = url
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)

  const pngUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = pngUrl
  a.download = `${icon.icon_name}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}