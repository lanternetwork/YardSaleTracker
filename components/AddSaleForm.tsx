'use client'
import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import * as SalesHooks from '@/lib/hooks/useSales'
import { geocodeAddress } from '@/lib/geocode'
import { SaleSchema } from '@/lib/zodSchemas'
import { logger } from '@/lib/log'
import ImageUploader from './ImageUploader'

export default function AddSaleForm() {
  const createSale = SalesHooks.useCreateSale()
  const addressRef = useRef<HTMLInputElement>(null)
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured')
      return
    }

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      libraries: ['places']
    })

    loader.load().then(() => {
      if (!addressRef.current) return

      const autocomplete = new google.maps.places.Autocomplete(addressRef.current, {
        fields: ['formatted_address', 'geometry', 'address_components']
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        const geometry = place.geometry?.location
        
        if (geometry) {
          const lat = geometry.lat()
          const lng = geometry.lng()
          setCoords({ lat, lng })
          setAddress(place.formatted_address || '')
          
          logger.info('Address geocoded via Google Places', {
            component: 'AddSaleForm',
            operation: 'geocode_places',
            address: place.formatted_address,
            lat,
            lng
          })
        }
      })
    }).catch(err => {
      console.error('Error loading Google Maps:', err)
      setError('Failed to load address autocomplete')
    })
  }, [])

  // Handle manual address geocoding
  const handleAddressChange = async (value: string) => {
    setAddress(value)
    if (value.length > 5) {
      try {
        const result = await geocodeAddress(value)
        if (result) {
          setCoords({ lat: result.lat, lng: result.lng })
          
          logger.info('Address geocoded via fallback geocoder', {
            component: 'AddSaleForm',
            operation: 'geocode_fallback',
            address: value,
            lat: result.lat,
            lng: result.lng,
            geocoder: 'nominatim'
          })
        } else {
          logger.warn('Geocoding failed for address', {
            component: 'AddSaleForm',
            operation: 'geocode_fallback',
            address: value
          })
        }
      } catch (err) {
        logger.error('Geocoding error', err as Error, {
          component: 'AddSaleForm',
          operation: 'geocode_fallback',
          address: value
        })
      }
    }
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const payload = {
        title: String(formData.get('title') || ''),
        description: String(formData.get('description') || ''),
        address: String(formData.get('address') || ''),
        start_at: String(formData.get('start_at') || ''),
        end_at: String(formData.get('end_at') || ''),
        price_min: formData.get('price_min') ? Number(formData.get('price_min')) : undefined,
        price_max: formData.get('price_max') ? Number(formData.get('price_max')) : undefined,
        contact: String(formData.get('contact') || ''),
        lat: coords?.lat,
        lng: coords?.lng,
        tags,
        photos
      }

      const parsed = SaleSchema.safeParse(payload)
      if (!parsed.success) {
        setError('Please complete required fields')
        return
      }

      if (
        typeof payload.price_min === 'number' &&
        typeof payload.price_max === 'number' &&
        payload.price_min > payload.price_max
      ) {
        setError('Min price must be less than max price')
        return
      }

      const createdSale = await createSale.mutateAsync(parsed.data)

      logger.info('Sale created successfully', {
        component: 'AddSaleForm',
        operation: 'create_sale',
        saleId: createdSale.id,
        title: createdSale.title,
        hasCoordinates: !!(coords?.lat && coords?.lng)
      })

      // Reset form
      ;(e.target as HTMLFormElement).reset()
      setCoords(null)
      setAddress('')
      setPhotos([])
      setTags([])
      setTagInput('')
      setError(null)
      
      // Show success message
      alert('Sale posted successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      console.error('Error posting sale:', err)
    }
  }

  return (
    <form role="form" aria-label="Add sale" onSubmit={onSubmit} noValidate className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">Sale Title *</label>
        <input 
          id="title"
          name="title" 
          required 
          type="text"
          aria-label="Sale Title *"
          placeholder="e.g., Estate Sale - Antiques & Collectibles" 
          className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium mb-1">Address *</label>
        <input 
          id="address"
          name="address" 
          ref={addressRef} 
          required
          type="text"
          aria-label="Address *"
          value={address}
          onChange={e => handleAddressChange(e.target.value)}
          placeholder="Start typing your address..." 
          className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        {coords && (
          <p className="text-xs text-green-600 mt-1">✓ Location found</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
        <textarea 
          id="description"
          name="description" 
          aria-label="Description"
          placeholder="Describe what you're selling..." 
          rows={3}
          className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_at" className="block text-sm font-medium mb-1">Start Date & Time</label>
          <input 
            id="start_at"
            type="datetime-local" 
            name="start_at" 
            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="end_at" className="block text-sm font-medium mb-1">End Date & Time</label>
          <input 
            id="end_at"
            type="datetime-local" 
            name="end_at" 
            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price_min" className="block text-sm font-medium mb-1">Min Price ($)</label>
          <input 
            id="price_min"
            type="number" 
            name="price_min" 
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="price_max" className="block text-sm font-medium mb-1">Max Price ($)</label>
          <input 
            id="price_max"
            type="number" 
            name="price_max" 
            min="0"
            step="0.01"
            placeholder="100.00"
            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact" className="block text-sm font-medium mb-1">Contact Info</label>
        <input 
          id="contact"
          name="contact" 
          type="text"
          aria-label="Contact Info"
          placeholder="Phone number or email" 
          className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="tag-input" className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex gap-2 mb-2">
          <input 
            id="tag-input"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Add a tag..." 
            aria-label="Add tag"
            className="flex-1 rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button 
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm flex items-center gap-1"
              >
                {tag}
                <button 
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-amber-600 hover:text-amber-800"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button 
        type="submit"
        disabled={createSale.isPending}
        className="w-full rounded bg-amber-500 px-4 py-2 text-white font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {createSale.isPending ? 'Posting...' : 'Post Sale'}
      </button>

      <ImageUploader 
        onUpload={setPhotos}
        maxImages={5}
        existingImages={photos}
      />
    </form>
  )
}
