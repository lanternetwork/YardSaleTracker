export type Sale = {
  id: string
  title: string
  description?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  lat?: number
  lng?: number
  start_at?: string
  end_at?: string
  date_start?: string
  date_end?: string
  time_start?: string
  time_end?: string
  privacy_mode?: 'exact' | 'block_until_24h'
  geocode_precision?: string
  tags: string[]
  // (deprecated; yard sales do not have sale-level prices)
  photos: string[]
  contact?: string
  status: 'active'|'completed'|'cancelled'|'draft'|'published'|'hidden'|'auto_hidden'
  source?: string
  source_id?: string
  owner_id?: string
  first_seen_at?: string
  last_seen_at?: string
  created_at?: string
  updated_at?: string
}

export type SaleItem = {
  id: string
  sale_id: string
  name: string
  category?: string
  condition?: string
  price?: number
  photo?: string
  purchased: boolean
  created_at?: string
}

export type Profile = {
  id: string
  display_name?: string
  avatar_url?: string
  created_at?: string
}

export type Favorite = {
  user_id: string
  sale_id: string
  created_at?: string
}

export type Marker = {
  id: string
  title: string
  lat: number
  lng: number
  address?: string
  privacy_mode?: 'exact' | 'block_until_24h'
  date_start?: string
  time_start?: string
}

export type NegativeMatch = {
  id: string
  sale_id_a: string
  sale_id_b: string
  created_by: string
  created_at?: string
}
