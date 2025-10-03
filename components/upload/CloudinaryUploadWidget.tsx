'use client'

import { useEffect, useRef, useState } from 'react'
// Simple SVG icons to avoid dependency issues
const CloudUploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

interface CloudinaryUploadWidgetProps {
  onUpload: (urls: string[]) => void
  maxFiles?: number
  className?: string
}

interface CloudinaryWidget {
  open: () => void
  close: () => void
  destroy: () => void
}

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (config: any, callback: (error: any, result: any) => void) => CloudinaryWidget
    }
  }
}

export default function CloudinaryUploadWidget({ 
  onUpload, 
  maxFiles = 10, 
  className = '' 
}: CloudinaryUploadWidgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCloudinaryAvailable, setIsCloudinaryAvailable] = useState(false)
  const widgetRef = useRef<CloudinaryWidget | null>(null)

  // Check if Cloudinary environment variables are available
  useEffect(() => {
    const hasCloudinaryConfig = !!(
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    )
    setIsCloudinaryAvailable(hasCloudinaryConfig)
  }, [])

  // Initialize Cloudinary widget
  useEffect(() => {
    if (!isCloudinaryAvailable || typeof window === 'undefined') return

    const loadCloudinaryScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.cloudinary) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Cloudinary script'))
        document.head.appendChild(script)
      })
    }

    const initializeWidget = async () => {
      try {
        await loadCloudinaryScript()
        
        const widget = window.cloudinary.createUploadWidget(
          {
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
            multiple: true,
            maxFiles: maxFiles,
            cropping: true,
            croppingAspectRatio: 16/9,
            croppingShowDimensions: true,
            resourceType: 'image',
            folder: 'lootaura/sales',
            tags: ['lootaura', 'yard-sale'],
            sources: ['local', 'camera', 'url'],
            showAdvancedOptions: false,
            showPoweredBy: false,
            styles: {
              palette: {
                window: '#FFFFFF',
                sourceBg: '#F4F4F5',
                windowBorder: '#90A0B3',
                tabIcon: '#0078FF',
                inactiveTabIcon: '#8E9FBF',
                menuIcons: '#5A616A',
                link: '#0078FF',
                action: '#FF620C',
                inProgress: '#0078FF',
                complete: '#20B832',
                error: '#EA2727',
                textDark: '#000000',
                textLight: '#FFFFFF'
              },
              fonts: {
                default: null,
                'Roboto, sans-serif': {
                  url: 'https://fonts.googleapis.com/css?family=Roboto',
                  active: true
                }
              }
            }
          },
          (error: any, result: any) => {
            if (error) {
              console.error('Cloudinary upload error:', error)
              setError('Upload failed. Please try again.')
              setIsLoading(false)
              return
            }

            if (result && result.event === 'success') {
              const uploadedUrls = result.info.secure_url ? [result.info.secure_url] : []
              onUpload(uploadedUrls)
              setIsLoading(false)
            }
          }
        )

        widgetRef.current = widget
      } catch (err) {
        console.error('Failed to initialize Cloudinary widget:', err)
        setError('Failed to initialize upload widget.')
        setIsLoading(false)
      }
    }

    initializeWidget()

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy()
      }
    }
  }, [isCloudinaryAvailable, maxFiles, onUpload])

  const handleUpload = () => {
    if (!widgetRef.current) return
    
    setError(null)
    setIsLoading(true)
    widgetRef.current.open()
  }

  // Feature flag: Show optional photos note if Cloudinary not configured
  if (!isCloudinaryAvailable) {
    return (
      <div className={`p-4 border border-gray-200 rounded-lg text-center bg-gray-50 ${className}`}>
        <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          Photos are optional. You can save your sale without images.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Image uploads are not configured in this environment.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <button
        onClick={handleUpload}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[120px]"
      >
        {isLoading ? (
          <>
            <SpinnerIcon className="animate-spin h-6 w-6 text-blue-600 mr-3" />
            <span className="text-blue-600 font-medium">Uploading...</span>
          </>
        ) : (
          <>
            <CloudUploadIcon className="h-6 w-6 text-gray-400 mr-3" />
            <div className="text-left">
              <div className="text-gray-900 font-medium">Upload Images</div>
              <div className="text-gray-500 text-sm">Click to select or drag and drop</div>
              <div className="text-gray-400 text-xs mt-1">Max {maxFiles} images</div>
            </div>
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}
