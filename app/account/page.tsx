'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useAuth, useSignOut } from '@/lib/hooks/useAuth'

export default function AccountPage() {
  const [message, setMessage] = useState('')
  const router = useRouter()
  const { user } = useAuth()
  const signOut = useSignOut()
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!user) {
      router.push('/auth')
    }
  }, [user, router])

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync()
      router.push('/')
    } catch (error) {
      setMessage('Error signing out')
    }
  }

  if (!user) {
    return <div className="p-4 text-center">Redirecting...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-2">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email Verified:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
          <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}</p>
          <p><strong>Account Created:</strong> {user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        <div className="space-y-3">
          <button
            onClick={() => setMessage('Export coming soon')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export My Data
          </button>
          <button
            onClick={() => setMessage('Delete account coming soon')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Sign Out</h2>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Sign Out
        </button>
      </div>

      {message && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-800">
          {message}
        </div>
      )}
    </div>
  )
}
