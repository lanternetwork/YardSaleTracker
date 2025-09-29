'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth, useProfile } from '@/lib/hooks/useAuth'

export default function AccountOverview() {
  const { data: user } = useAuth()
  const { data: profile } = useProfile()
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', href: '/account' },
    { id: 'profile', label: 'Profile', href: '/account/profile' },
    { id: 'preferences', label: 'Preferences', href: '/account/preferences' },
    { id: 'sales', label: 'My Sales', href: '/account/sales' },
    { id: 'security', label: 'Security & Sessions', href: '/account/security' },
    { id: 'data', label: 'Data & Privacy', href: '/account/data' },
  ]

  const hasDefaults = profile?.preferences && Object.keys(profile.preferences).length > 0
  const hasProfile = profile?.display_name || profile?.home_zip

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Account</h1>
          <p className="text-neutral-600 mt-2">Manage your profile, preferences, and account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6">Account Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quick Status Cards */}
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <h3 className="font-medium text-neutral-900 mb-2">Profile Status</h3>
                    <div className="flex items-center gap-2">
                      {hasProfile ? (
                        <span className="text-green-600 text-sm">✓ Complete</span>
                      ) : (
                        <span className="text-amber-600 text-sm">⚠ Incomplete</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      {hasProfile ? 'Your profile is set up' : 'Add your display name and home ZIP'}
                    </p>
                    <Link
                      href="/account/profile"
                      className="inline-block mt-2 text-sm text-amber-600 hover:text-amber-700"
                    >
                      {hasProfile ? 'Edit Profile' : 'Complete Profile'} →
                    </Link>
                  </div>

                  <div className="bg-neutral-50 rounded-lg p-4">
                    <h3 className="font-medium text-neutral-900 mb-2">Preferences</h3>
                    <div className="flex items-center gap-2">
                      {hasDefaults ? (
                        <span className="text-green-600 text-sm">✓ Configured</span>
                      ) : (
                        <span className="text-amber-600 text-sm">⚠ Default</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      {hasDefaults ? 'Your preferences are set' : 'Set your default privacy and radius'}
                    </p>
                    <Link
                      href="/account/preferences"
                      className="inline-block mt-2 text-sm text-amber-600 hover:text-amber-700"
                    >
                      {hasDefaults ? 'Edit Preferences' : 'Set Preferences'} →
                    </Link>
                  </div>

                  <div className="bg-neutral-50 rounded-lg p-4">
                    <h3 className="font-medium text-neutral-900 mb-2">My Sales</h3>
                    <p className="text-sm text-neutral-600">
                      Manage your posted yard sales
                    </p>
                    <Link
                      href="/account/sales"
                      className="inline-block mt-2 text-sm text-amber-600 hover:text-amber-700"
                    >
                      View My Sales →
                    </Link>
                  </div>

                  <div className="bg-neutral-50 rounded-lg p-4">
                    <h3 className="font-medium text-neutral-900 mb-2">Security</h3>
                    <p className="text-sm text-neutral-600">
                      Manage sign-in methods and sessions
                    </p>
                    <Link
                      href="/account/security"
                      className="inline-block mt-2 text-sm text-amber-600 hover:text-amber-700"
                    >
                      Security Settings →
                    </Link>
                  </div>
                </div>

                {/* Account Info */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-medium text-neutral-900 mb-4">Account Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Email</span>
                      <span className="font-medium">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Member since</span>
                      <span className="font-medium">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
