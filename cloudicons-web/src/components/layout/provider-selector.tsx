"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProviderSelectorProps {
  onProviderChange: (provider: string) => void
  currentProvider: string
}

export function ProviderSelector({ onProviderChange, currentProvider }: ProviderSelectorProps) {
  const [providers, setProviders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    async function fetchProviders() {
      try {
        const response = await fetch(`${API_URL}/api/cloud-providers`)
        const data = await response.json()
        setProviders(data)
      } catch (error) {
        console.error('Error fetching providers:', error)
        // Fallback to at least having Azure
        setProviders(['azure'])
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [API_URL])

  if (loading) {
    return <div className="w-full max-w-xs">Loading providers...</div>
  }

  return (
    <div className="w-full max-w-xs">
      <Select value={currentProvider} onValueChange={onProviderChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a provider" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem key={provider} value={provider}>
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}