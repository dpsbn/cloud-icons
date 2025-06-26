/**
 * Utility functions for downloading icons in different formats
 */

/**
 * Download an SVG icon as an SVG file
 * @param svgContent The SVG content to download
 * @param fileName The name of the file to download
 */
export function downloadSvg(svgContent: string, fileName: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  downloadBlob(blob, `${fileName}.svg`);
}

/**
 * Download an SVG icon as a PNG file
 * @param svgContent The SVG content to convert to PNG
 * @param fileName The name of the file to download
 * @param size The size of the PNG image
 */
export function downloadPng(svgContent: string, fileName: string, size: number): void {
  // Create a canvas element to render the SVG
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Canvas 2D context not supported');
    return;
  }
  
  // Set canvas size
  canvas.width = size;
  canvas.height = size;
  
  // Create an image element to load the SVG
  const img = new Image();
  
  // Convert SVG to data URL
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  
  // When the image loads, draw it on the canvas and download
  img.onload = () => {
    // Clear canvas and draw image
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    
    // Convert canvas to PNG and download
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${fileName}.png`);
      }
    }, 'image/png');
    
    // Clean up
    URL.revokeObjectURL(url);
  };
  
  // Set image source to SVG data URL
  img.src = url;
}

/**
 * Helper function to download a blob as a file
 * @param blob The blob to download
 * @param fileName The name of the file to download
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}