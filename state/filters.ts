export type Filters = { 
  q?: string
  maxKm?: number
  dateFrom?: string
  dateTo?: string
  tags?: string[]
  min?: number
  max?: number
  category?: string
}

export const defaultFilters: Filters = { 
  q: '', 
  maxKm: 25, 
  tags: [] 
}
