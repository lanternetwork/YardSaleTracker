'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { config } from '@/lib/config/env'

interface WizardData {
  title: string
  description: string
  address: string
  date_start: string
  date_end: string
  time_start: string
  time_end: string
  privacy_mode: 'exact' | 'block_until_24h'
  price_min?: number
  price_max?: number
  tags: string[]
}

const COMMON_TAGS = [
  'furniture', 'clothing', 'toys', 'books', 'electronics', 
  'kitchen', 'tools', 'sports', 'collectibles', 'antiques'
]

export default function NewSaleWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  
  const [data, setData] = useState<WizardData>({
    title: '',
    description: '',
    address: '',
    date_start: '',
    date_end: '',
    time_start: '',
    time_end: '',
    privacy_mode: 'exact',
    price_min: undefined,
    price_max: undefined,
    tags: []
  })

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const createDraft = async () => {
    if (draftId) return draftId
    
    setLoading(true)
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: 'draft' })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create draft')
      }
      
      const result = await response.json()
      setDraftId(result.id)
      return result.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async (updates: Partial<WizardData>) => {
    if (!draftId) return
    
    try {
      await fetch(`/api/sales/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    } catch (err) {
      console.error('Failed to save draft:', err)
    }
  }

  const handleNext = async () => {
    if (step < 4) {
      // Save current step data
      await saveDraft(data)
      setStep(step + 1)
    } else {
      // Final step - publish
      await handlePublish()
    }
  }

  const handlePublish = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Create draft if not exists
      const id = await createDraft()
      
      // Redirect to auth if not authenticated
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Store draft session and redirect to auth
        const returnTo = `/sell/${id}/manage?publish=true`
        router.push(`/signin?returnTo=${encodeURIComponent(returnTo)}`)
        return
      }
      
      // Publish the sale
      const response = await fetch(`/api/sales/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to publish sale')
      }
      
      const result = await response.json()
      router.push(`/sell/${id}/manage`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish sale')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">What are you selling?</h2>
              <p className="text-neutral-600">Give your sale a catchy title and description</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                value={data.title}
                onChange={e => updateData({ title: e.target.value })}
                placeholder="Vintage Furniture & Household Items"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                rows={4}
                value={data.description}
                onChange={e => updateData({ description: e.target.value })}
                placeholder="Describe what you're selling, condition, and any special details..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Price Range (optional)</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  className="rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Min price"
                  value={data.price_min || ''}
                  onChange={e => updateData({ price_min: e.target.value ? Number(e.target.value) : undefined })}
                />
                <input
                  type="number"
                  className="rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Max price"
                  value={data.price_max || ''}
                  onChange={e => updateData({ price_max: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">When is your sale?</h2>
              <p className="text-neutral-600">Pick your weekend dates and times</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date *</label>
                <input
                  type="date"
                  className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  value={data.date_start}
                  onChange={e => updateData({ date_start: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  value={data.date_end}
                  onChange={e => updateData({ date_end: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  value={data.time_start}
                  onChange={e => updateData({ time_start: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  value={data.time_end}
                  onChange={e => updateData({ time_end: e.target.value })}
                />
              </div>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Where is your sale?</h2>
              <p className="text-neutral-600">Enter your address for the map</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Address *</label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                value={data.address}
                onChange={e => updateData({ address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Privacy Mode</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy_mode"
                    value="exact"
                    checked={data.privacy_mode === 'exact'}
                    onChange={e => updateData({ privacy_mode: e.target.value as 'exact' | 'block_until_24h' })}
                    className="mr-2"
                  />
                  <div>
                    <div className="font-medium">Exact Location</div>
                    <div className="text-sm text-neutral-600">Show precise address on map</div>
                  </div>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy_mode"
                    value="block_until_24h"
                    checked={data.privacy_mode === 'block_until_24h'}
                    onChange={e => updateData({ privacy_mode: e.target.value as 'exact' | 'block_until_24h' })}
                    className="mr-2"
                  />
                  <div>
                    <div className="font-medium">Block-Level Privacy</div>
                    <div className="text-sm text-neutral-600">Show general area until 24h before start</div>
                  </div>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Tags (optional)</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const newTags = data.tags.includes(tag)
                        ? data.tags.filter(t => t !== tag)
                        : [...data.tags, tag]
                      updateData({ tags: newTags })
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      data.tags.includes(tag)
                        ? 'bg-amber-500 text-white'
                        : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Preview Your Sale</h2>
              <p className="text-neutral-600">Review your listing before publishing</p>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">{data.title}</h3>
              {data.description && (
                <p className="text-neutral-600 mb-4">{data.description}</p>
              )}
              
              <div className="space-y-2 text-sm">
                <div><strong>When:</strong> {data.date_start} {data.time_start && `at ${data.time_start}`}</div>
                <div><strong>Where:</strong> {data.address}</div>
                {data.price_min && (
                  <div><strong>Price:</strong> ${data.price_min}{data.price_max && ` - $${data.price_max}`}</div>
                )}
                {data.tags.length > 0 && (
                  <div><strong>Tags:</strong> {data.tags.join(', ')}</div>
                )}
              </div>
            </div>
            
            {data.privacy_mode === 'block_until_24h' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-blue-600 mr-2">🔒</div>
                  <div>
                    <div className="font-medium text-blue-800">Privacy Mode Active</div>
                    <div className="text-sm text-blue-600">
                      Your exact address will be hidden until 24 hours before your sale starts
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Yard Sale</h1>
          <p className="text-neutral-600">Fill out the form below to list your sale</p>
        </div>
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step ? 'bg-amber-500 text-white' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    stepNum < step ? 'bg-amber-500' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-neutral-600">
            <span>Basics</span>
            <span>When</span>
            <span>Where</span>
            <span>Preview</span>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {renderStep()}
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-2 border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : step === 4 ? 'Publish Sale' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
