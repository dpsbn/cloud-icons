"use client"

import { Header } from "@/components/layout/header"
import { IconGrid } from "@/components/layout/icon-grid"
import { ProviderSelector } from "@/components/layout/provider-selector"
import { SearchInput } from "@/components/layout/search-input"
import { TagFilter } from "@/components/layout/tag-filter"
import { SizeSelector } from "@/components/layout/size-selector"
import { useState } from "react"

export default function Home() {
  const [totalIcons, setTotalIcons] = useState<number>(0)
  const [currentProvider, setCurrentProvider] = useState<string>('azure')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [iconSize, setIconSize] = useState<number>(64)

  return (
    <main>
      <Header />

      <section className='container mx-auto px-4 py-8'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>
            Cloud provider icons in SVG and PNG format
          </h2>
          <p className='text-gray-600 dark:text-gray-300'>
            Download, copy and paste cloud provider icons in SVG and PNG format for your
            projects.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 mb-4">
            <ProviderSelector 
              onProviderChange={setCurrentProvider} 
              currentProvider={currentProvider} 
            />
            <SearchInput 
              onSearch={setSearchQuery}
              placeholder={`Search ${currentProvider} icons...`}
            />
            <SizeSelector
              onSizeChange={setIconSize}
              currentSize={iconSize}
            />
          </div>

          <div className="mt-6 mb-4">
            <TagFilter 
              onTagsChange={setSelectedTags}
              provider={currentProvider}
            />
          </div>

          <p className='text-sm text-gray-500 mt-4'>
            {totalIcons > 0 
              ? `${totalIcons} ${currentProvider} icons found${searchQuery ? ` for "${searchQuery}"` : ''}${selectedTags.length > 0 ? ` with tags: ${selectedTags.join(', ')}` : ''}`
              : 'Loading icons...'}
          </p>
        </div>

        <IconGrid 
          onTotalCountChange={setTotalIcons} 
          provider={currentProvider}
          searchQuery={searchQuery}
          tags={selectedTags}
          iconSize={iconSize}
        />
      </section>
    </main>
  )
}
