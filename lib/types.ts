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
  tags: string[]
  price_min?: number
  price_max?: number
  photos: string[]
  contact?: string
  status: 'active'|'completed'|'cancelled'
  source?: string
  owner_id?: string
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
