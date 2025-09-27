'use client'
import { useState, useEffect } from 'react'

interface WeekendPickerProps {
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

export default function WeekendPicker({ value, onChange }: WeekendPickerProps) {
  const [isMultiDay, setIsMultiDay] = useState(false)

  useEffect(() => {
    setIsMultiDay(value.date_end !== value.date_start)
  }, [value.date_start, value.date_end])

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

  const toggleMultiDay = () => {
    const newIsMultiDay = !isMultiDay
    setIsMultiDay(newIsMultiDay)
    
    if (!newIsMultiDay) {
      // Single day - set end date to start date
      onChange({ ...value, date_end: value.date_start })
    }
  }

  return (
    <div className="space-y-4">
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
