import { useState, useEffect } from 'react'
import { getProviders } from '@/api/providers'

/**
 * Hook for fetching and managing providers
 * @returns An object containing the providers and loading state
 */
export function useProviders() {
  const [providers, setProviders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const data = await getProviders()
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
  }, [])

  return {
    providers,
    loading
  }
}