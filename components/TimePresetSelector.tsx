'use client'

import { useState } from 'react'
import { getTimePresets, getTimePresetSummary, type TimePreset } from '@/lib/date/presets'

interface TimePresetSelectorProps {
  onPresetSelect: (preset: TimePreset) => void
  selectedPreset?: string
  timezone?: string
}

export default function TimePresetSelector({
  onPresetSelect,
  selectedPreset,
  timezone = 'America/Los_Angeles'
}: TimePresetSelectorProps) {
  const [activePreset, setActivePreset] = useState(selectedPreset || '')
  const presets = getTimePresets(timezone)
  
  const handlePresetClick = (preset: TimePreset) => {
    setActivePreset(preset.id)
    onPresetSelect(preset)
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Start</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose a common time slot or create your own schedule
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            className={`
              p-4 rounded-lg border-2 text-left transition-all duration-200
              ${activePreset === preset.id
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="font-medium text-sm">{preset.label}</div>
            <div className="text-xs text-gray-600 mt-1">
              {preset.description}
            </div>
            {activePreset === preset.id && (
              <div className="text-xs text-amber-700 mt-2 font-medium">
                ✓ Selected
              </div>
            )}
          </button>
        ))}
      </div>
      
      {activePreset && activePreset !== 'custom' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <strong>Selected:</strong> {getTimePresetSummary(presets.find(p => p.id === activePreset)!)}
          </div>
        </div>
      )}
    </div>
  )
}
