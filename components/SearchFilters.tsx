'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { defaultFilters, Filters } from '@/state/filters'

const COMMON_TAGS = [
  'antiques', 'furniture', 'clothing', 'books', 'toys', 'electronics',
  'kitchen', 'tools', 'art', 'jewelry', 'sports', 'collectibles'
]

export default function SearchFilters({ 
  onChange,
  showAdvanced = false
}: { 
  onChange: (f: Filters) => void
  showAdvanced?: boolean
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [f, setF] = useState<Filters>(defaultFilters)
  const [showMore, setShowMore] = useState(showAdvanced)

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: Filters = {
      q: searchParams.get('q') || '',
      maxKm: searchParams.get('maxKm') ? Number(searchParams.get('maxKm')) : 25,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      min: searchParams.get('min') ? Number(searchParams.get('min')) : undefined,
      max: searchParams.get('max') ? Number(searchParams.get('max')) : undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : []
    }
    setF(urlFilters)
    onChange(urlFilters)
  }, [searchParams, onChange])

  function set<K extends keyof Filters>(k: K, v: any) { 
    const n = { ...f, [k]: v }
    setF(n)
    onChange(n)
    
    // Update URL params
    const params = new URLSearchParams(searchParams.toString())
    if (v === '' || v === undefined || v === null || (Array.isArray(v) && v.length === 0)) {
      params.delete(k)
    } else if (Array.isArray(v)) {
      params.set(k, v.join(','))
    } else {
      params.set(k, String(v))
    }
    
    const newUrl = `${pathname}?${params.toString()}`
    router.replace(newUrl, { scroll: false })
  }

  const toggleTag = (tag: string) => {
    const currentTags = f.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    set('tags', newTags)
  }

  const clearFilters = () => {
    setF(defaultFilters)
    onChange(defaultFilters)
    router.replace(pathname, { scroll: false })
  }

  const hasActiveFilters = f.q || f.maxKm !== 25 || f.dateFrom || f.dateTo || (f.tags && f.tags.length > 0)

  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <input 
            className="w-full px-4 py-2 pl-10 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
            placeholder="Search sales by title or description..." 
            value={f.q || ''}
            onChange={e => set('q', e.target.value)} 
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            🔍
          </div>
        </div>
        <button 
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Less' : 'More'} Filters
        </button>
        {hasActiveFilters && (
          <button 
            className="px-3 py-2 text-neutral-600 hover:text-neutral-800 font-medium" 
            onClick={clearFilters}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showMore && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-neutral-50 rounded-lg">
          {/* Distance filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Max Distance</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                className="w-20 px-2 py-1 rounded border text-sm" 
                placeholder="25" 
                value={f.maxKm ? Math.round(f.maxKm * 0.621371) : ''}
                onChange={e => set('maxKm', Number(e.target.value) * 1.609)} 
              />
              <span className="text-sm text-neutral-600">miles</span>
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input 
              type="date" 
              className="w-full px-2 py-1 rounded border text-sm" 
              value={f.dateFrom || ''}
              onChange={e => set('dateFrom', e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input 
              type="date" 
              className="w-full px-2 py-1 rounded border text-sm" 
              value={f.dateTo || ''}
              onChange={e => set('dateTo', e.target.value)} 
            />
          </div>

          {/* Price range */}
          <div>
            <label className="block text-sm font-medium mb-1">Price Range</label>
            <div className="flex gap-1">
              <input 
                type="number" 
                className="w-20 px-2 py-1 rounded border text-sm" 
                placeholder="Min" 
                value={f.min || ''}
                onChange={e => set('min', e.target.value ? Number(e.target.value) : undefined)} 
              />
              <span className="text-sm text-neutral-600 self-center">-</span>
              <input 
                type="number" 
                className="w-20 px-2 py-1 rounded border text-sm" 
                placeholder="Max" 
                value={f.max || ''}
                onChange={e => set('max', e.target.value ? Number(e.target.value) : undefined)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {COMMON_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                f.tags?.includes(tag)
                  ? 'bg-amber-500 text-white'
                  : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {f.tags && f.tags.length > 0 && (
          <div className="mt-2 text-sm text-neutral-600">
            Selected: {f.tags.join(', ')}
          </div>
        )}
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-neutral-600">Active filters:</span>
          {f.q && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded">
              Search: "{f.q}"
            </span>
          )}
          {f.maxKm !== 25 && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded">
              Within {Math.round(f.maxKm! * 0.621371)} miles
            </span>
          )}
          {f.dateFrom && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded">
              From {new Date(f.dateFrom).toLocaleDateString()}
            </span>
          )}
          {f.dateTo && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded">
              To {new Date(f.dateTo).toLocaleDateString()}
            </span>
          )}
          {f.tags && f.tags.length > 0 && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded">
              {f.tags.length} categories
            </span>
          )}
        </div>
      )}
    </div>
  )
}
