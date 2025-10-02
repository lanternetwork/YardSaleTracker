'use client'

import { useState } from 'react'

export interface DateRange {
  type: 'any' | 'today' | 'weekend' | 'next_weekend' | 'range'
  startDate?: string
  endDate?: string
}

interface DateSelectorProps {
  value: DateRange
  onChange: (dateRange: DateRange) => void
  className?: string
}

export default function DateSelector({ value, onChange, className = '' }: DateSelectorProps) {
  const [showCustomRange, setShowCustomRange] = useState(false)

  const handleTypeChange = (type: DateRange['type']) => {
    if (type === 'range') {
      setShowCustomRange(true)
      onChange({ type, startDate: '', endDate: '' })
    } else {
      setShowCustomRange(false)
      onChange({ type })
    }
  }

  const handleCustomRangeChange = (field: 'startDate' | 'endDate', date: string) => {
    onChange({
      ...value,
      [field]: date
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date Range
        </label>
        <div className="space-y-2">
          {[
            { value: 'any', label: 'Any Date' },
            { value: 'today', label: 'Today' },
            { value: 'weekend', label: 'This Weekend' },
            { value: 'next_weekend', label: 'Next Weekend' },
            { value: 'range', label: 'Custom Range' }
          ].map((option) => (
            <label key={option.value} className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
              value.type === option.value 
                ? 'bg-blue-50 border border-blue-200' 
                : 'hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="dateRange"
                value={option.value}
                checked={value.type === option.value}
                onChange={() => handleTypeChange(option.value as DateRange['type'])}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm font-medium ${
                value.type === option.value ? 'text-blue-900' : 'text-gray-700'
              }`}>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {showCustomRange && (
        <div className="space-y-3 pl-6 border-l-2 border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={value.startDate || ''}
              onChange={(e) => handleCustomRangeChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={value.endDate || ''}
              onChange={(e) => handleCustomRangeChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
