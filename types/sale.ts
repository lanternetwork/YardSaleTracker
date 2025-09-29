export interface Sale {
  id: string
  title: string
  description?: string
  address?: string
  city?: string
  state?: string
  start_at?: string
  date_start?: string
  time_start?: string
  end_at?: string
  date_end?: string
  time_end?: string
  tags?: string[]
  photos?: string[]
}
