'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

interface SaleDraft {
  title: string
  description?: string
  address: string
  city: string
  state: string
  zip: string
  lat?: number
  lng?: number
  start_at?: string
  end_at?: string
  price_min?: number
  price_max?: number
  contact?: string
  tags?: string[]
}

export default function ReviewPage() {
  const [draft, setDraft] = useState<SaleDraft | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Load draft from localStorage
    const savedDraft = localStorage.getItem('sale-draft')
    if (savedDraft) {
      try {
        setDraft(JSON.parse(savedDraft))
      } catch (error) {
        console.error('Error loading draft:', error)
        setMessage('Error loading draft data')
      }
    } else {
      setMessage('No draft found. Please create a sale first.')
    }
  }, [])

  const handlePublish = async () => {
    if (!draft || !user) {
      setMessage('Missing draft data or user not authenticated')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...draft,
          status: 'published'
        }),
      })

      if (response.ok) {
        // Clear draft from localStorage
        localStorage.removeItem('sale-draft')
        setMessage('Sale published successfully!')
        router.push('/explore')
      } else {
        const errorData = await response.json()
        setMessage(`Error publishing sale: ${errorData.error}`)
      }
    } catch (error) {
      setMessage('Error publishing sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!draft || !user) {
      setMessage('Missing draft data or user not authenticated')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...draft,
          status: 'draft'
        }),
      })

      if (response.ok) {
        setMessage('Draft saved successfully!')
      } else {
        const errorData = await response.json()
        setMessage(`Error saving draft: ${errorData.error}`)
      }
    } catch (error) {
      setMessage('Error saving draft')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return <div className="p-4 text-center">Redirecting to sign in...</div>
  }

  if (!draft) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Review Your Sale</h1>
        <p className="text-gray-600">{message}</p>
        <button
          onClick={() => router.push('/sell/new')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Sale
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Review Your Sale</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Sale Details</h2>
        <div className="space-y-3">
          <div>
            <strong>Title:</strong> {draft.title}
          </div>
          {draft.description && (
            <div>
              <strong>Description:</strong> {draft.description}
            </div>
          )}
          <div>
            <strong>Location:</strong> {draft.address}, {draft.city}, {draft.state} {draft.zip}
          </div>
          {draft.start_at && (
            <div>
              <strong>Start:</strong> {new Date(draft.start_at).toLocaleString()}
            </div>
          )}
          {draft.end_at && (
            <div>
              <strong>End:</strong> {new Date(draft.end_at).toLocaleString()}
            </div>
          )}
          {(draft.price_min || draft.price_max) && (
            <div>
              <strong>Price Range:</strong> ${draft.price_min || 0} - ${draft.price_max || 'No limit'}
            </div>
          )}
          {draft.contact && (
            <div>
              <strong>Contact:</strong> {draft.contact}
            </div>
          )}
          {draft.tags && draft.tags.length > 0 && (
            <div>
              <strong>Tags:</strong> {draft.tags.join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handlePublish}
          disabled={isSubmitting}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Sale'}
        </button>
        
        <button
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save as Draft'}
        </button>
        
        <button
          onClick={() => router.push('/sell/new')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Edit Sale
        </button>
      </div>

      {message && (
        <div className={`mt-4 p-4 rounded ${
          message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
