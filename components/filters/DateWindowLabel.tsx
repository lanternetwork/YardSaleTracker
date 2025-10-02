'use client'

interface DateWindowLabelProps {
  dateWindow?: {
    label: string
    start: string
    end: string
    display: string
  }
  className?: string
}

export default function DateWindowLabel({ dateWindow, className = '' }: DateWindowLabelProps) {
  if (!dateWindow) return null

  return (
    <div className={`inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium ${className}`}>
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {dateWindow.display}
    </div>
  )
}
