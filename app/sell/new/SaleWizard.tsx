'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAutosaveDraft } from '@/lib/hooks/useAutosaveDraft'
import TimePresetSelector from '@/components/TimePresetSelector'
import { type TimePreset } from '@/lib/date/presets'

interface WizardStep {
  id: string
  title: string
  description: string
}

const steps: WizardStep[] = [
  { id: 'basics', title: 'Sale Details', description: 'Title, description, and photos' },
  { id: 'when', title: 'When', description: 'Date and time of your sale' },
  { id: 'where', title: 'Where', description: 'Location and address' },
  { id: 'preview', title: 'Preview', description: 'Review and publish your sale' }
]

interface SaleData {
  id?: string
  title: string
  description: string
  photos: string[]
  date_start: string
  date_end?: string
  time_start: string
  time_end?: string
  address: string
  lat?: number
  lng?: number
  privacy_mode: 'exact' | 'block_until_24h'
}

export default function SaleWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [saleData, setSaleData] = useState<SaleData>({
    title: '',
    description: '',
    photos: [],
    date_start: '',
    date_end: '',
    time_start: '',
    time_end: '',
    address: '',
    privacy_mode: 'exact'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('')

  const updateSaleData = (updates: Partial<SaleData>) => {
    setSaleData(prev => ({ ...prev, ...updates }))
  }

  // Autosave functionality
  const { isSaving, lastSaved, error: saveError, saveNow } = useAutosaveDraft(saleData, {
    delay: 800,
    onSave: async (data) => {
      if (!data.id) {
        // Create new draft
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          throw new Error('Failed to create draft')
        }
        
        const result = await response.json()
        setSaleData(prev => ({ ...prev, id: result.id }))
      } else {
        // Update existing draft
        const response = await fetch(`/api/sales/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          throw new Error('Failed to save draft')
        }
      }
    },
    onError: (error) => {
      console.error('Autosave error:', error)
    }
  })

  // Handle time preset selection
  const handlePresetSelect = (preset: TimePreset) => {
    setSelectedPreset(preset.id)
    
    if (preset.id === 'custom') {
      // Clear preset data, let user fill manually
      updateSaleData({
        date_start: '',
        date_end: '',
        time_start: '',
        time_end: ''
      })
    } else {
      // Apply preset data
      updateSaleData({
        date_start: preset.date_start,
        date_end: preset.date_end,
        time_start: preset.time_start,
        time_end: preset.time_end
      })
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Create draft sale
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      })

      if (!response.ok) {
        throw new Error('Failed to create sale')
      }

      const { id } = await response.json()
      
      // Redirect to publish flow
      router.push(`/sell/${id}/publish`)
    } catch (error) {
      console.error('Error creating sale:', error)
      alert('Failed to create sale. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'basics':
        return (
          <BasicsStep 
            data={saleData} 
            onChange={updateSaleData} 
          />
        )
      case 'when':
        return (
          <WhenStep 
            data={saleData} 
            onChange={updateSaleData} 
          />
        )
      case 'where':
        return (
          <WhereStep 
            data={saleData} 
            onChange={updateSaleData} 
          />
        )
      case 'preview':
        return (
          <PreviewStep 
            data={saleData} 
            onPublish={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600">
                {steps[currentStep].description}
              </p>
            </div>
            
            {/* Autosave status */}
            <div className="text-sm text-gray-500">
              {isSaving && (
                <span className="flex items-center text-blue-600">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span className="text-green-600">
                  ✓ Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {saveError && (
                <span className="text-red-600">
                  ⚠ Save failed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Sale'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step components
function BasicsStep({ data, onChange }: { data: SaleData; onChange: (updates: Partial<SaleData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sale Title *
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Multi-Family Garage Sale"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe what you're selling..."
        />
      </div>
    </div>
  )
}

function WhenStep({ data, onChange }: { data: SaleData; onChange: (updates: Partial<SaleData>) => void }) {
  return (
    <div className="space-y-6">
      <TimePresetSelector
        onPresetSelect={(preset) => {
          if (preset.id === 'custom') {
            onChange({
              date_start: '',
              date_end: '',
              time_start: '',
              time_end: ''
            })
          } else {
            onChange({
              date_start: preset.date_start,
              date_end: preset.date_end,
              time_start: preset.time_start,
              time_end: preset.time_end
            })
          }
        }}
        selectedPreset={data.date_start && data.time_start ? 'custom' : ''}
      />

      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Custom Schedule</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={data.date_start}
              onChange={(e) => onChange({ date_start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (optional)
            </label>
            <input
              type="date"
              value={data.date_end || ''}
              onChange={(e) => onChange({ date_end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <input
              type="time"
              value={data.time_start}
              onChange={(e) => onChange({ time_start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time (optional)
            </label>
            <input
              type="time"
              value={data.time_end || ''}
              onChange={(e) => onChange({ time_end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function WhereStep({ data, onChange }: { data: SaleData; onChange: (updates: Partial<SaleData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address *
        </label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your address"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Privacy Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="exact"
              checked={data.privacy_mode === 'exact'}
              onChange={(e) => onChange({ privacy_mode: e.target.value as 'exact' | 'block_until_24h' })}
              className="mr-2"
            />
            <span>Show exact location</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="block_until_24h"
              checked={data.privacy_mode === 'block_until_24h'}
              onChange={(e) => onChange({ privacy_mode: e.target.value as 'exact' | 'block_until_24h' })}
              className="mr-2"
            />
            <span>Block-level location until 24h before start</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function PreviewStep({ 
  data, 
  onPublish, 
  isSubmitting 
}: { 
  data: SaleData; 
  onPublish: () => void; 
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Preview Your Sale</h3>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900">{data.title}</h4>
        {data.description && (
          <p className="text-gray-600 mt-2">{data.description}</p>
        )}
        
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p><strong>When:</strong> {data.date_start} at {data.time_start}</p>
          {data.date_end && <p><strong>Ends:</strong> {data.date_end} at {data.time_end}</p>}
          <p><strong>Where:</strong> {data.address}</p>
          <p><strong>Privacy:</strong> {data.privacy_mode === 'exact' ? 'Exact location' : 'Block-level until 24h before'}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> You'll be asked to sign in before publishing your sale. 
          This ensures you can manage your listing later.
        </p>
      </div>
    </div>
  )
}
