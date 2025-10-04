'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSale, updateSale, type SaleInput } from '@/app/(sales)/_actions'
import { SaleSchema } from '@/lib/zodSchemas'
import CloudinaryUploadWidget from '@/components/upload/CloudinaryUploadWidget'
import ImageThumbnailGrid from '@/components/upload/ImageThumbnailGrid'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/hooks/useAuth'

interface SaleFormProps {
  initialData?: Partial<SaleInput>
  isEdit?: boolean
  saleId?: string
}

interface FieldError {
  field: string
  message: string
}

export default function SaleForm({ initialData, isEdit = false, saleId }: SaleFormProps) {
  const router = useRouter()
  const { success: toastSuccess, error: toastError } = useToast()
  const { data: user, isLoading: authLoading } = useAuth()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<FieldError[]>([])
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [formData, setFormData] = useState<Partial<SaleInput>>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip_code: initialData?.zip_code || '',
    date_start: initialData?.date_start || '',
    time_start: initialData?.time_start || '',
    date_end: initialData?.date_end || '',
    time_end: initialData?.time_end || '',
    lat: initialData?.lat || 0,
    lng: initialData?.lng || 0,
    tags: initialData?.tags || [],
    price: initialData?.price,
    photos: initialData?.photos || [],
  })

  const handleInputChange = (field: keyof SaleInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    setErrors(prev => prev.filter(error => error.field !== field))
  }

  const handlePhotoUpload = (urls: string[]) => {
    setFormData(prev => ({
      ...prev,
      photos: [...(prev.photos || []), ...urls]
    }))
  }

  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index) || []
    }))
  }

  const handleTagToggle = (tag: string) => {
    setFormData(prev => {
      const currentTags = prev.tags || []
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag]
      return { ...prev, tags: newTags }
    })
  }

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Client-side validation
    const validation = SaleSchema.safeParse(formData)
    if (!validation.success) {
      const fieldErrors: FieldError[] = Object.entries(validation.error.flatten().fieldErrors).map(([field, messages]) => ({
        field,
        message: messages?.[0] || 'Invalid value'
      }))
      setErrors(fieldErrors)
      toastError('Please fix the errors below')
      return
    }

    // Check authentication before submission
    if (!user && !authLoading) {
      setShowLoginPrompt(true)
      return
    }

    startTransition(async () => {
      try {
        let result
        if (isEdit && saleId) {
          result = await updateSale(saleId, formData)
        } else {
          result = await createSale(formData as SaleInput)
        }

        if (!result.success) {
          if (result.fieldErrors) {
            const fieldErrors: FieldError[] = Object.entries(result.fieldErrors).map(([field, messages]) => ({
              field,
              message: messages?.[0] || 'Invalid value'
            }))
            setErrors(fieldErrors)
            toastError('Please fix the errors below')
          } else {
            toastError(result.error || 'An error occurred')
          }
          return
        }

        toastSuccess(isEdit ? 'Sale updated successfully!' : 'Sale created successfully!')
        router.push(`/sales/${result.data?.id || saleId}`)
      } catch (error) {
        console.error('Form submission error:', error)
        toastError('An unexpected error occurred')
      }
    })
  }

  const availableTags = [
    'Furniture', 'Electronics', 'Clothing', 'Toys',
    'Books', 'Tools', 'Kitchen', 'Sports',
    'Garden', 'Art', 'Collectibles', 'Miscellaneous'
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sale Title *
        </label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., Huge Yard Sale with Antiques"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            getFieldError('title') ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {getFieldError('title') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('title')}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your sale and what items you're selling..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={formData.date_start || ''}
            onChange={(e) => handleInputChange('date_start', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError('date_start') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError('date_start') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('date_start')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Time *
          </label>
          <input
            type="time"
            value={formData.time_start || ''}
            onChange={(e) => handleInputChange('time_start', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError('time_start') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError('time_start') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('time_start')}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date (Optional)
          </label>
          <input
            type="date"
            value={formData.date_end || ''}
            onChange={(e) => handleInputChange('date_end', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError('date_end') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {getFieldError('date_end') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('date_end')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Time (Optional)
          </label>
          <input
            type="time"
            value={formData.time_end || ''}
            onChange={(e) => handleInputChange('time_end', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address *
        </label>
        <input
          type="text"
          value={formData.address || ''}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Street address"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            getFieldError('address') ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {getFieldError('address') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('address')}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="City"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError('city') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError('city') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('city')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            value={formData.state || ''}
            onChange={(e) => handleInputChange('state', e.target.value)}
            placeholder="State"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError('state') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError('state') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('state')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code
          </label>
          <input
            type="text"
            value={formData.zip_code || ''}
            onChange={(e) => handleInputChange('zip_code', e.target.value)}
            placeholder="ZIP Code"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitude *
          </label>
          <input
            type="number"
            step="any"
            value={formData.lat || ''}
            onChange={(e) => handleInputChange('lat', parseFloat(e.target.value) || 0)}
            placeholder="e.g., 40.7128"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError('lat') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError('lat') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('lat')}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Longitude *
          </label>
          <input
            type="number"
            step="any"
            value={formData.lng || ''}
            onChange={(e) => handleInputChange('lng', parseFloat(e.target.value) || 0)}
            placeholder="e.g., -74.0060"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError('lng') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError('lng') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('lng')}</p>
          )}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Starting Price (Optional)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.price || ''}
          onChange={(e) => handleInputChange('price', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="0.00"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">Leave blank if items are free</p>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableTags.map((tag) => (
            <label key={tag} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.tags?.includes(tag) || false}
                onChange={() => handleTagToggle(tag)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos (Optional)
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Add photos to showcase your items. You can upload up to 10 photos.
        </p>
        
        <CloudinaryUploadWidget 
          onUpload={handlePhotoUpload}
          maxFiles={10 - (formData.photos?.length || 0)}
          className="mb-6"
        />

        {formData.photos && formData.photos.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Uploaded Photos ({formData.photos.length}/10)
            </h3>
            <ImageThumbnailGrid 
              images={formData.photos}
              onRemove={handleRemovePhoto}
              maxImages={10}
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {isEdit ? 'Update Sale' : 'Create Sale'}
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>

    {/* Login Prompt Modal */}
    {showLoginPrompt && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sign in to post your sale</h3>
          <p className="text-gray-600 mb-6">
            You need to create an account or sign in to post your yard sale. This helps us keep the platform safe and allows you to manage your listings.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowLoginPrompt(false)
                router.push('/auth/signin?returnTo=/sell/new')
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  )
}
