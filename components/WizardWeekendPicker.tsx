'use client'
import { useState, useEffect } from 'react'
import { getWeekendRange } from '@/lib/privacy'

interface WizardWeekendPickerProps {
  value: {
    date_start: string
    date_end: string
    time_start: string
    time_end: string
  }
  onChange: (value: {
    date_start: string
    date_end: string
    time_start: string
    time_end: string
  }) => void
}

export default function WizardWeekendPicker({ value, onChange }: WizardWeekendPickerProps) {
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [suggestedWeekend, setSuggestedWeekend] = useState<{ start: Date; end: Date } | null>(null)

  useEffect(() => {
    setIsMultiDay(value.date_end !== value.date_start)
  }, [value.date_start, value.date_end])

  useEffect(() => {
    // Suggest next weekend if no date is set
    if (!value.date_start) {
      const nextWeekend = getWeekendRange(new Date())
      setSuggestedWeekend(nextWeekend)
    }
  }, [value.date_start])

  const handleDateStartChange = (date: string) => {
    const newValue = { ...value, date_start: date }
    
    if (!isMultiDay) {
      newValue.date_end = date
    }
    
    onChange(newValue)
  }

  const handleDateEndChange = (date: string) => {
    if (date < value.date_start) {
      // If end date is before start date, update start date
      onChange({ ...value, date_start: date, date_end: date })
    } else {
      onChange({ ...value, date_end: date })
    }
  }

  const handleTimeStartChange = (time: string) => {
    onChange({ ...value, time_start: time })
  }

  const handleTimeEndChange = (time: string) => {
    if (time < value.time_start && !isMultiDay) {
      // If end time is before start time on same day, update start time
      onChange({ ...value, time_start: time, time_end: time })
    } else {
      onChange({ ...value, time_end: time })
    }
  }

  const useSuggestedWeekend = () => {
    if (suggestedWeekend) {
      const startDate = suggestedWeekend.start.toISOString().split('T')[0]
      const endDate = suggestedWeekend.end.toISOString().split('T')[0]
      
      onChange({
        ...value,
        date_start: startDate,
        date_end: endDate
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">When is your sale?</h2>
        <p className="text-neutral-600">Pick your weekend dates and times</p>
      </div>
      
      {suggestedWeekend && !value.date_start && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Suggested Weekend</h3>
              <p className="text-sm text-blue-700">
                {suggestedWeekend.start.toLocaleDateString()} - {suggestedWeekend.end.toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={useSuggestedWeekend}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
            >
              Use This Weekend
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="duration"
            checked={!isMultiDay}
            onChange={() => setIsMultiDay(false)}
            className="mr-2"
          />
          Single Day
        </label>
        
        <label className="flex items-center">
          <input
            type="radio"
            name="duration"
            checked={isMultiDay}
            onChange={() => setIsMultiDay(true)}
            className="mr-2"
          />
          Multiple Days
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Start Date *</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            value={value.date_start}
            onChange={e => handleDateStartChange(e.target.value)}
            required
          />
        </div>
        
        {isMultiDay && (
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              value={value.date_end}
              onChange={e => handleDateEndChange(e.target.value)}
              min={value.date_start}
            />
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Start Time</label>
          <input
            type="time"
            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            value={value.time_start}
            onChange={e => handleTimeStartChange(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">End Time</label>
          <input
            type="time"
            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            value={value.time_end}
            onChange={e => handleTimeEndChange(e.target.value)}
          />
        </div>
      </div>

      {isMultiDay && value.date_start && value.date_end && (
        <div className="text-sm text-neutral-600">
          <p>
            <strong>Duration:</strong> {value.date_start} to {value.date_end}
            {value.time_start && ` starting at ${value.time_start}`}
            {value.time_end && ` ending at ${value.time_end}`}
          </p>
        </div>
      )}
    </div>
  )
}
