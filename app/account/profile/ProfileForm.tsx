'use client'

import { useState, useEffect } from 'react'
import { useAuth, useProfile } from '@/lib/hooks/useAuth'
import Link from 'next/link'

interface ProfileData {
  display_name: string
  avatar_url: string
  home_zip: string
}

export default function ProfileForm() {
  const { data: user } = useAuth()
  const { data: profile } = useProfile()
  const [formData, setFormData] = useState<ProfileData>({
    display_name: '',
    avatar_url: '',
    home_zip: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || '',
        home_zip: profile.home_zip || ''
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save profile')
      }

      setMessage({ type: 'success', text: 'Profile saved successfully ✓' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save profile' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/account" className="text-amber-600 hover:text-amber-700 text-sm">
            ← Back to Account
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mt-4">Profile</h1>
          <p className="text-neutral-600 mt-2">Update your display information</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-neutral-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="display_name"
                value={formData.display_name}
                onChange={handleChange('display_name')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Your name as it appears to others"
              />
              <p className="text-sm text-neutral-500 mt-1">
                This will be shown on your sales and in your profile
              </p>
            </div>

            <div>
              <label htmlFor="avatar_url" className="block text-sm font-medium text-neutral-700 mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                id="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange('avatar_url')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="https://example.com/your-avatar.jpg"
              />
              <p className="text-sm text-neutral-500 mt-1">
                Optional: URL to your profile picture
              </p>
            </div>

            <div>
              <label htmlFor="home_zip" className="block text-sm font-medium text-neutral-700 mb-2">
                Home ZIP Code
              </label>
              <input
                type="text"
                id="home_zip"
                value={formData.home_zip}
                onChange={handleChange('home_zip')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="12345"
                pattern="[0-9]{5}"
                maxLength={5}
              />
              <p className="text-sm text-neutral-500 mt-1">
                Used as default location for new sales and search
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Profile'}
              </button>
              
              <Link
                href="/account"
                className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
