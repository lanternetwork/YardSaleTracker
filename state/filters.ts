export type Filters = { 
  q?: string
  maxKm?: number
  dateFrom?: string
  dateTo?: string
  tags?: string[]
  category?: string
}

// Default to today + 7 days
const today = new Date()
const sevenDaysFromNow = new Date(today)
sevenDaysFromNow.setDate(today.getDate() + 7)

export const defaultFilters: Filters = { 
  q: '', 
  maxKm: 25, 
  tags: [],
  dateFrom: today.toISOString().split('T')[0],
  dateTo: sevenDaysFromNow.toISOString().split('T')[0]
}
