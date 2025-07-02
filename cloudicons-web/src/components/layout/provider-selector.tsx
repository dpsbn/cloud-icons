"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProviders } from "@/hooks"

interface ProviderSelectorProps {
  onProviderChange: (provider: string) => void
  currentProvider: string
}

export function ProviderSelector({ onProviderChange, currentProvider }: ProviderSelectorProps) {
  const { providers, loading } = useProviders()

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
