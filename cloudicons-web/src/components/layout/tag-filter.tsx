"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface Icon {
  tags?: string[]
}

interface TagFilterProps {
  onTagsChange: (tags: string[]) => void
  provider: string
}

export function TagFilter({ onTagsChange, provider }: TagFilterProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  // Fetch all icons to extract tags
  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true)
        // Fetch first page of icons to extract tags
        const response = await fetch(`${API_URL}/api/${provider}/icons?page=1&pageSize=100`)
        const data = await response.json()

        // Extract unique tags from icons
        const tags = new Set<string>()
        data.data.forEach((icon: Icon) => {
          if (icon.tags && Array.isArray(icon.tags)) {
            icon.tags.forEach((tag: string) => tags.add(tag))
          }
        })

        setAvailableTags(Array.from(tags).sort())
        // Reset selected tags when provider changes
        setSelectedTags([])
        onTagsChange([])
      } catch (error) {
        console.error('Error fetching tags:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [provider, API_URL, onTagsChange])

  const toggleTag = (tag: string) => {
    let newSelectedTags: string[]

    if (selectedTags.includes(tag)) {
      // Remove tag if already selected
      newSelectedTags = selectedTags.filter(t => t !== tag)
    } else {
      // Add tag if not selected
      newSelectedTags = [...selectedTags, tag]
    }

    setSelectedTags(newSelectedTags)
    onTagsChange(newSelectedTags)
  }

  if (loading) {
    return <div className="w-full">Loading tags...</div>
  }

  if (availableTags.length === 0) {
    return <div className="w-full">No tags available</div>
  }

  return (
    <div className="w-full">
      <p className="text-sm text-gray-500 mb-2">Filter by tags:</p>
      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}