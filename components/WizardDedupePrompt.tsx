'use client'
import { useState } from 'react'
import { DuplicateCandidate } from '@/lib/dedupe'

interface WizardDedupePromptProps {
  duplicates: DuplicateCandidate[]
  onMarkNotDuplicate: (saleId: string) => Promise<void>
  onContinue: () => void
  onCancel: () => void
}

export default function WizardDedupePrompt({ 
  duplicates, 
  onMarkNotDuplicate, 
  onContinue, 
  onCancel 
}: WizardDedupePromptProps) {
  const [markedNotDuplicates, setMarkedNotDuplicates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)

  const handleMarkNotDuplicate = async (saleId: string) => {
    setLoading(saleId)
    try {
      await onMarkNotDuplicate(saleId)
      setMarkedNotDuplicates(prev => new Set([...prev, saleId]))
    } catch (error) {
      console.error('Failed to mark as not duplicate:', error)
    } finally {
      setLoading(null)
    }
  }

  const remainingDuplicates = duplicates.filter(d => !markedNotDuplicates.has(d.id))

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <div className="text-yellow-600 mr-3 mt-1">⚠️</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Possible Duplicates Found
          </h3>
          <p className="text-yellow-700 mb-4">
            We found {duplicates.length} sales that might be duplicates of yours. 
            Please review them and mark any that are not duplicates.
          </p>
          
          <div className="space-y-3 mb-4">
            {duplicates.map(duplicate => (
              <div key={duplicate.id} className="bg-white border border-yellow-200 rounded p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 mb-1">{duplicate.title}</h4>
                    <p className="text-sm text-neutral-600 mb-2">{duplicate.address}</p>
                    <div className="flex gap-4 text-xs text-neutral-500">
                      <span>Distance: {duplicate.distance}m</span>
                      <span>Similarity: {Math.round(duplicate.similarity * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="ml-3">
                    {markedNotDuplicates.has(duplicate.id) ? (
                      <span className="text-green-600 font-medium text-sm">✓ Marked as not duplicate</span>
                    ) : (
                      <button
                        onClick={() => handleMarkNotDuplicate(duplicate.id)}
                        disabled={loading === duplicate.id}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {loading === duplicate.id ? 'Saving...' : 'Mark as Not Duplicate'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-yellow-300 rounded text-yellow-700 hover:bg-yellow-100"
            >
              Cancel
            </button>
            
            <div className="flex gap-3">
              {remainingDuplicates.length > 0 && (
                <button
                  onClick={onContinue}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Continue with {remainingDuplicates.length} possible duplicates
                </button>
              )}
              
              {remainingDuplicates.length === 0 && (
                <button
                  onClick={onContinue}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Publish Sale
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
