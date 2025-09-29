'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth, useProfile, useSignOut } from '@/lib/hooks/useAuth'

export default function UserProfile() {
  const { data: user, isLoading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const signOut = useSignOut()
  const [isOpen, setIsOpen] = useState(false)

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <a 
        href="/signin" 
        className="text-neutral-700 hover:text-amber-600 font-medium"
      >
        Sign In
      </a>
    )
  }

  return (
    <div className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-medium text-sm hover:bg-amber-600 transition-colors"
        aria-label="Account menu"
      >
        {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
          <div className="py-1">
            <Link
              href="/account"
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              onClick={() => setIsOpen(false)}
            >
              Account
            </Link>
            <Link
              href="/favorites"
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              onClick={() => setIsOpen(false)}
            >
              Favorites
            </Link>
            <div className="border-t">
              <button
                onClick={() => {
                  signOut.mutate()
                  setIsOpen(false)
                }}
                disabled={signOut.isPending}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {signOut.isPending ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
