"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchInputProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function SearchInput({ onSearch, placeholder = "Search icons..." }: SearchInputProps) {
  const [query, setQuery] = useState("")
  
  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [query, onSearch])
  
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 w-full"
      />
    </div>
  )
}