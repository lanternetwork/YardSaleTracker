'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/lib/hooks/useAuth'
import Link from 'next/link'

interface PreferencesData {
  default_privacy_mode: 'exact' | 'block_until_24h'
}

export default function PreferencesForm() {
  const { data: profile } = useProfile()
  const [formData, setFormData] = useState<PreferencesData>({
    default_privacy_mode: 'exact'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile?.preferences) {
      setFormData({
        default_privacy_mode: profile.preferences.default_privacy_mode || 'exact'
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/account/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save preferences')
      }

      setMessage({ type: 'success', text: 'Preferences saved successfully ✓' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save preferences' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof PreferencesData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value as any }))
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/account" className="text-amber-600 hover:text-amber-700 text-sm">
            ← Back to Account
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mt-4">Preferences</h1>
          <p className="text-neutral-600 mt-2">Set your default preferences for new sales and searches</p>
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
              <label htmlFor="default_privacy_mode" className="block text-sm font-medium text-neutral-700 mb-2">
                Default Privacy Mode
              </label>
              <select
                id="default_privacy_mode"
                value={formData.default_privacy_mode}
                onChange={handleChange('default_privacy_mode')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="exact">Exact location</option>
                <option value="block_until_24h">Block-level until 24h before start</option>
              </select>
              <p className="text-sm text-neutral-500 mt-1">
                {formData.default_privacy_mode === 'exact' 
                  ? 'Your sales will show exact location immediately'
                  : 'Your sales will show block-level location until 24 hours before start'
                }
              </p>
            </div>


            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-2">How these defaults work</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• <strong>Privacy Mode:</strong> Applied to new sales you create</li>
                <li>• <strong>Override:</strong> You can always change this for individual sales</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Preferences'}
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
