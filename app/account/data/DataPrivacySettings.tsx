'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

interface DeletionRequest {
  status: 'pending' | 'canceled' | 'completed'
  requested_at: string
}

export default function DataPrivacySettings() {
  const { data: user } = useAuth()
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchDeletionRequest = async () => {
      try {
        const response = await fetch('/api/account/delete/status')
        if (response.ok) {
          const data = await response.json()
          setDeletionRequest(data)
        }
      } catch (error) {
        console.error('Failed to fetch deletion request status:', error)
      }
    }

    fetchDeletionRequest()
  }, [])

  const handleExportData = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/account/export')
      
      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lootaura-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: 'Data exported successfully ✓' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to export data' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestDeletion = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/account/delete/request', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to request account deletion')
      }

      setDeletionRequest({ status: 'pending', requested_at: new Date().toISOString() })
      setMessage({ 
        type: 'success', 
        text: 'Account deletion requested. Your sales have been hidden and will be deleted within 7 days.' 
      })
      setShowDeleteConfirm(false)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to request deletion' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelDeletion = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/account/delete/cancel', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to cancel deletion request')
      }

      setDeletionRequest(null)
      setMessage({ type: 'success', text: 'Deletion request canceled ✓' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to cancel deletion' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/account" className="text-amber-600 hover:text-amber-700 text-sm">
            ← Back to Account
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mt-4">Data & Privacy</h1>
          <p className="text-neutral-600 mt-2">Manage your data and account deletion</p>
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

          {/* Data Export */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Export Your Data</h2>
            <p className="text-neutral-600 mb-4">
              Download a copy of all your data including profile, preferences, and sales.
            </p>
            
            <button
              onClick={handleExportData}
              disabled={isLoading}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Exporting...' : 'Export My Data'}
            </button>
          </div>

          {/* Account Deletion */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Account Deletion</h2>
            
            {deletionRequest?.status === 'pending' ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-800 mb-2">Deletion Request Pending</h3>
                  <p className="text-sm text-red-700 mb-3">
                    Your account deletion is pending. Your sales have been hidden and will be permanently deleted within 7 days.
                  </p>
                  <p className="text-sm text-red-600">
                    Requested: {new Date(deletionRequest.requested_at).toLocaleDateString()}
                  </p>
                </div>
                
                <button
                  onClick={handleCancelDeletion}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Canceling...' : 'Cancel Deletion Request'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-medium text-amber-800 mb-2">⚠️ Permanent Action</h3>
                  <p className="text-sm text-amber-700">
                    Requesting account deletion will immediately hide all your sales and schedule your account for permanent deletion within 7 days. This action cannot be undone.
                  </p>
                </div>

                <div className="space-y-2 text-sm text-neutral-600">
                  <p><strong>What happens when you delete your account:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>All your sales will be immediately hidden from public view</li>
                    <li>Your profile and preferences will be deleted</li>
                    <li>Your account will be permanently deleted within 7 days</li>
                    <li>You can cancel the deletion request within 7 days</li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Request Account Deletion
                </button>
              </div>
            )}
          </div>

          {/* Privacy Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Privacy Information</h2>
            
            <div className="space-y-4 text-sm text-neutral-600">
              <div>
                <h3 className="font-medium text-neutral-900 mb-2">Data We Collect</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Account information (email, display name, preferences)</li>
                  <li>Your yard sale listings and photos</li>
                  <li>Search and interaction data</li>
                  <li>Location data (ZIP codes, coordinates)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-neutral-900 mb-2">How We Use Your Data</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>To provide and improve our service</li>
                  <li>To show relevant yard sales in your area</li>
                  <li>To communicate with you about your account</li>
                  <li>To ensure platform safety and prevent abuse</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-neutral-900 mb-2">Your Rights</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Export your data at any time</li>
                  <li>Delete your account and all associated data</li>
                  <li>Update your privacy preferences</li>
                  <li>Contact us with privacy concerns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Confirm Account Deletion</h3>
              <p className="text-neutral-600 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and will hide all your sales immediately.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleRequestDeletion}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {isLoading ? 'Requesting...' : 'Yes, Delete My Account'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
