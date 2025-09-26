'use client'
import { useAuth, useSignOut } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AccountPage() {
  const { data: user, isLoading } = useAuth()
  const signOut = useSignOut()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin?returnTo=/account')
    }
  }, [user, isLoading, router])

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User ID</label>
                  <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Sign In</label>
                  <p className="text-gray-900">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Account Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  disabled={signOut.isPending}
                >
                  {signOut.isPending ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Data & Privacy</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Your data is stored securely and never shared with third parties</p>
                <p>• You can export your data at any time</p>
                <p>• Account deletion is permanent and cannot be undone</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
