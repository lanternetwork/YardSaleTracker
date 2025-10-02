'use client'

import { FaFilter, FaTimes } from 'react-icons/fa'

interface FilterTriggerProps {
  isOpen: boolean
  onToggle: () => void
  activeFiltersCount: number
  className?: string
}

export default function FilterTrigger({ 
  isOpen, 
  onToggle, 
  activeFiltersCount,
  className = '' 
}: FilterTriggerProps) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px] ${className}`}
    >
      {isOpen ? (
        <FaTimes className="h-4 w-4 text-gray-500 mr-2" />
      ) : (
        <FaFilter className="h-4 w-4 text-gray-500 mr-2" />
      )}
      
      <span className="text-sm font-medium text-gray-700">
        {isOpen ? 'Close Filters' : 'Filters'}
      </span>
      
      {activeFiltersCount > 0 && (
        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {activeFiltersCount}
        </span>
      )}
    </button>
  )
}
