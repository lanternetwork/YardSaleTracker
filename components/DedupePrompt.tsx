'use client'
import { useState } from 'react'
import { DuplicateCandidate } from '@/lib/dedupe'

interface DedupePromptProps {
  duplicates: DuplicateCandidate[]
  onMarkNotDuplicate: (saleId: string) => void
  onContinue: () => void
  onCancel: () => void
}

export default function DedupePrompt({ 
  duplicates, 
  onMarkNotDuplicate, 
  onContinue, 
  onCancel 
}: DedupePromptProps) {
  const [markedNotDuplicates, setMarkedNotDuplicates] = useState<Set<string>>(new Set())

  const handleMarkNotDuplicate = (saleId: string) => {
    setMarkedNotDuplicates(prev => new Set([...prev, saleId]))
    onMarkNotDuplicate(saleId)
  }

  const remainingDuplicates = duplicates.filter(d => !markedNotDuplicates.has(d.id))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Possible Duplicates Found</h2>
          <p className="text-neutral-600 mb-6">
            We found {duplicates.length} sales that might be duplicates of yours. 
            Please review them and mark any that are not duplicates.
          </p>
          
          <div className="space-y-4 mb-6">
            {duplicates.map(duplicate => (
              <div key={duplicate.id} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{duplicate.title}</h3>
                    <p className="text-neutral-600 text-sm mb-2">{duplicate.address}</p>
                    <div className="flex gap-4 text-sm text-neutral-500">
                      <span>Distance: {duplicate.distance}m</span>
                      <span>Similarity: {Math.round(duplicate.similarity * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {markedNotDuplicates.has(duplicate.id) ? (
                      <span className="text-green-600 font-medium text-sm">✓ Marked as not duplicate</span>
                    ) : (
                      <button
                        onClick={() => handleMarkNotDuplicate(duplicate.id)}
                        className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 text-sm font-medium"
                      >
                        Mark as Not Duplicate
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
              className="px-6 py-2 border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            
            <div className="flex gap-3">
              {remainingDuplicates.length > 0 && (
                <button
                  onClick={onContinue}
                  className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Continue with {remainingDuplicates.length} possible duplicates
                </button>
              )}
              
              {remainingDuplicates.length === 0 && (
                <button
                  onClick={onContinue}
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
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
