'use client'
import { useState, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface ImageUploaderProps {
  onUpload: (urls: string[]) => void
  maxImages?: number
  existingImages?: string[]
}

export default function ImageUploader({ 
  onUpload, 
  maxImages = 5, 
  existingImages = [] 
}: ImageUploaderProps) {
  const sb = createSupabaseBrowserClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>(existingImages)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const totalImages = images.length + fileArray.length

    if (totalImages > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const uploadPromises = fileArray.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`)
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`)
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `sale-photos/${fileName}`

        const { error: uploadError } = await sb.storage
          .from('sale-photos')
          .upload(filePath, file)

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }

        const { data } = sb.storage
          .from('sale-photos')
          .getPublicUrl(filePath)

        return data.publicUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      const newImages = [...images, ...uploadedUrls]
      setImages(newImages)
      onUpload(newImages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onUpload(newImages)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Photos ({images.length}/{maxImages})
        </label>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-amber-500 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500 mr-2"></div>
              Uploading...
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-2">📷</div>
              <div className="text-sm text-neutral-600">
                Click to upload photos or drag and drop
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                PNG, JPG, GIF up to 5MB each
              </div>
            </div>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Sale photo ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
