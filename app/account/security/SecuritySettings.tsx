'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth, useSignOut } from '@/lib/hooks/useAuth'

export default function SecuritySettings() {
  const { data: user } = useAuth()
  const signOut = useSignOut()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSignOutEverywhere = async () => {
    if (!confirm('This will sign you out of all devices and sessions. Continue?')) {
      return
    }

    setIsSigningOut(true)
    setMessage(null)

    try {
      const response = await fetch('/api/account/security/signout-everywhere', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to sign out everywhere')
      }

      setMessage({ type: 'success', text: 'Signed out of all devices successfully ✓' })
      
      // Redirect to sign in after a short delay
      setTimeout(() => {
        window.location.href = '/signin'
      }, 2000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to sign out everywhere' 
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleReconnect = async (provider: 'email' | 'google') => {
    try {
      if (provider === 'email') {
        // For email, we'll use the magic link flow
        const response = await fetch('/api/account/security/reconnect-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user?.email })
        })

        if (!response.ok) {
          throw new Error('Failed to send reconnection email')
        }

        setMessage({ 
          type: 'success', 
          text: 'Reconnection email sent! Check your inbox and click the link to reconnect.' 
        })
      } else {
        // For Google, redirect to OAuth
        window.location.href = `/api/account/security/reconnect-google?returnTo=${encodeURIComponent('/account/security')}`
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to reconnect' 
      })
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/account" className="text-amber-600 hover:text-amber-700 text-sm">
            ← Back to Account
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mt-4">Security & Sessions</h1>
          <p className="text-neutral-600 mt-2">Manage your sign-in methods and active sessions</p>
        </div>

        <div className="space-y-6">
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Sign-in Methods */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Sign-in Methods</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">Email</div>
                    <div className="text-sm text-neutral-600">{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleReconnect('email')}
                  className="px-3 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-50"
                >
                  Reconnect
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">Google</div>
                    <div className="text-sm text-neutral-600">Connected via Google OAuth</div>
                  </div>
                </div>
                <button
                  onClick={() => handleReconnect('google')}
                  className="px-3 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-50"
                >
                  Reconnect
                </button>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Active Sessions</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-neutral-900">Current Session</div>
                    <div className="text-sm text-neutral-600">This device • Active now</div>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-medium text-amber-800 mb-2">Sign out everywhere</h3>
              <p className="text-sm text-amber-700 mb-3">
                This will sign you out of all devices and sessions. You'll need to sign in again on all devices.
              </p>
              <button
                onClick={handleSignOutEverywhere}
                disabled={isSigningOut}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out Everywhere'}
              </button>
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Security Tips</h2>
            
            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Use a strong, unique password for your email account</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Enable two-factor authentication on your email account</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Sign out of shared or public computers</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Report suspicious activity immediately</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
