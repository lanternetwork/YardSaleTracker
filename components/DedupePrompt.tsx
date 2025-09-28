'use client'

import { useState } from 'react'
import { type DedupeCandidate } from '@/lib/sales/dedupe'

interface DedupePromptProps {
  candidates: DedupeCandidate[]
  onNotDuplicate: (candidateId: string) => Promise<void>
  onViewCandidate: (candidateId: string) => void
  onContinue: () => void
  isLoading?: boolean
}

export default function DedupePrompt({
  candidates,
  onNotDuplicate,
  onViewCandidate,
  onContinue,
  isLoading = false
}: DedupePromptProps) {
  const [processing, setProcessing] = useState<string | null>(null)

  const handleNotDuplicate = async (candidateId: string) => {
    setProcessing(candidateId)
    try {
      await onNotDuplicate(candidateId)
    } finally {
      setProcessing(null)
    }
  }

  if (candidates.length === 0) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-blue-900">
            Potential Duplicates Found
          </h3>
          <p className="text-xs text-blue-700 mt-1">
            We found {candidates.length} similar sale{candidates.length > 1 ? 's' : ''} nearby. 
            Please review to avoid duplicates.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="bg-white border border-blue-100 rounded-lg p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {candidate.title}
                </h4>
                <div className="text-xs text-gray-600 mt-1">
                  <div>{candidate.date_start}</div>
                  {candidate.time_start && (
                    <div>{candidate.time_start} - {candidate.time_end || 'End time not specified'}</div>
                  )}
                  <div className="text-blue-600">
                    {Math.round(candidate.distance)}m away • {Math.round(candidate.similarity * 100)}% similar
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 ml-3">
                <button
                  onClick={() => onViewCandidate(candidate.id)}
                  className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                >
                  View
                </button>
                
                <button
                  onClick={() => handleNotDuplicate(candidate.id)}
                  disabled={processing === candidate.id}
                  className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  {processing === candidate.id ? 'Processing...' : 'Not a duplicate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={onContinue}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Continue Publishing'}
        </button>
      </div>
    </div>
  )
}