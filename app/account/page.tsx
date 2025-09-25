'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface UserSession {
  id: string
  created_at: string
  updated_at: string
  factor_id?: string
  aal?: string
  not_after?: string
}

export default function AccountPage() {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const { user, signOut } = useAuth()
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    
    loadSessions()
  }, [user, router])

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase.auth.getSessions()
      if (error) {
        console.error('Error loading sessions:', error)
      } else {
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      setMessage('Error signing out')
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.auth.admin.signOut(sessionId)
      if (error) {
        setMessage(`Error revoking session: ${error.message}`)
      } else {
        setMessage('Session revoked successfully')
        loadSessions() // Reload sessions
      }
    } catch (error) {
      setMessage('Error revoking session')
    }
  }

  const handleExportData = async () => {
    setMessage('Export functionality coming soon - this will download your sales and favorites data')
    // TODO: Implement data export
  }

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setMessage('Account deletion functionality coming soon - this will permanently delete your account and all associated data')
      // TODO: Implement account deletion
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
        <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
        {isLoading ? (
          <p>Loading sessions...</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <p><strong>Session ID:</strong> {session.id}</p>
                  <p><strong>Created:</strong> {new Date(session.created_at).toLocaleString()}</p>
                  <p><strong>Last Updated:</strong> {new Date(session.updated_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export My Data
          </button>
          <button
            onClick={handleDeleteAccount}
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
