"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SizeSelectorProps {
  onSizeChange: (size: number) => void
  currentSize: number
}

const AVAILABLE_SIZES = [16, 24, 32, 48, 64, 96, 128]

export function SizeSelector({ onSizeChange, currentSize }: SizeSelectorProps) {
  return (
    <div className="w-full max-w-xs">
      <Select
        value={currentSize.toString()}
        onValueChange={(value) => onSizeChange(parseInt(value))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select icon size" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_SIZES.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}px
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}