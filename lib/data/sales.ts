import { createSupabaseServer, getTableName } from '@/lib/supabase/server'
import { z } from 'zod'

// Zod schemas for validation
const SaleInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip_code: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  date_start: z.string().min(1, 'Start date is required'),
  time_start: z.string().min(1, 'Start time is required'),
  date_end: z.string().optional(),
  time_end: z.string().optional(),
  price: z.number().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'completed', 'cancelled']).default('draft'),
  privacy_mode: z.enum(['exact', 'block_until_24h']).default('exact'),
  is_featured: z.boolean().default(false),
})

const ItemInputSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  price: z.number().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  images: z.array(z.string()).default([]),
  is_sold: z.boolean().default(false),
})

const GetSalesParamsSchema = z.object({
  city: z.string().optional(),
  distanceKm: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  categories: z.array(z.string()).optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
})

// TypeScript types
export type Sale = {
  id: string
  owner_id: string
  title: string
  description?: string
  address?: string
  city: string
  state: string
  zip_code?: string
  lat?: number
  lng?: number
  date_start: string
  time_start: string
  date_end?: string
  time_end?: string
  price?: number
  tags?: string[]
  status: 'draft' | 'published' | 'completed' | 'cancelled'
  privacy_mode: 'exact' | 'block_until_24h'
  is_featured: boolean
  created_at: string
  updated_at: string
}

export type Item = {
  id: string
  sale_id: string
  name: string
  description?: string
  price?: number
  category?: string
  condition?: string
  images: string[]
  is_sold: boolean
  created_at: string
  updated_at: string
}

export type GetSalesParams = z.infer<typeof GetSalesParamsSchema>
export type SaleInput = z.infer<typeof SaleInputSchema>
export type ItemInput = z.infer<typeof ItemInputSchema>

// Data functions
export async function getSales(params: GetSalesParams = {}) {
  try {
    const validatedParams = GetSalesParamsSchema.parse(params)
    const supabase = createSupabaseServer()
    const salesTable = getTableName('sales')
    
    let query = supabase
      .from(salesTable)
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(validatedParams.limit)
      .range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1)

    // Filter by city
    if (validatedParams.city) {
      query = query.ilike('city', `%${validatedParams.city}%`)
    }

    // Filter by categories/tags
    if (validatedParams.categories && validatedParams.categories.length > 0) {
      query = query.overlaps('tags', validatedParams.categories)
    }

    // Filter by date range
    if (validatedParams.dateRange) {
      query = query
        .gte('date_start', validatedParams.dateRange.start)
        .lte('date_start', validatedParams.dateRange.end)
    }

    // Filter by distance (if lat/lng provided)
    if (validatedParams.lat && validatedParams.lng && validatedParams.distanceKm) {
      // Note: This is a simplified distance filter
      // In production, you'd want to use PostGIS or a more sophisticated approach
      const latRange = validatedParams.distanceKm / 111 // Rough conversion: 1 degree ≈ 111 km
      const lngRange = validatedParams.distanceKm / (111 * Math.cos(validatedParams.lat * Math.PI / 180))
      
      query = query
        .gte('lat', validatedParams.lat - latRange)
        .lte('lat', validatedParams.lat + latRange)
        .gte('lng', validatedParams.lng - lngRange)
        .lte('lng', validatedParams.lng + lngRange)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching sales:', error)
      throw new Error('Failed to fetch sales')
    }

    return data as Sale[]
  } catch (error) {
    console.error('Error in getSales:', error)
    throw error
  }
}

export async function getSaleById(id: string): Promise<Sale | null> {
  try {
    const supabase = createSupabaseServer()
    const salesTable = getTableName('sales')
    
    const { data, error } = await supabase
      .from(salesTable)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No rows returned
      }
      console.error('Error fetching sale:', error)
      throw new Error('Failed to fetch sale')
    }

    return data as Sale
  } catch (error) {
    console.error('Error in getSaleById:', error)
    throw error
  }
}

export async function createSale(input: SaleInput): Promise<Sale> {
  try {
    const validatedInput = SaleInputSchema.parse(input)
    const supabase = createSupabaseServer()
    const salesTable = getTableName('sales')
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from(salesTable)
      .insert({
        owner_id: user.id,
        ...validatedInput,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sale:', error)
      throw new Error('Failed to create sale')
    }

    return data as Sale
  } catch (error) {
    console.error('Error in createSale:', error)
    throw error
  }
}

export async function updateSale(id: string, input: Partial<SaleInput>): Promise<Sale> {
  try {
    const validatedInput = SaleInputSchema.partial().parse(input)
    const supabase = createSupabaseServer()
    const salesTable = getTableName('sales')
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from(salesTable)
      .update(validatedInput)
      .eq('id', id)
      .eq('owner_id', user.id) // Ensure user owns the sale
      .select()
      .single()

    if (error) {
      console.error('Error updating sale:', error)
      throw new Error('Failed to update sale')
    }

    return data as Sale
  } catch (error) {
    console.error('Error in updateSale:', error)
    throw error
  }
}

export async function deleteSale(id: string): Promise<void> {
  try {
    const supabase = createSupabaseServer()
    const salesTable = getTableName('sales')
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { error } = await supabase
      .from(salesTable)
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id) // Ensure user owns the sale

    if (error) {
      console.error('Error deleting sale:', error)
      throw new Error('Failed to delete sale')
    }
  } catch (error) {
    console.error('Error in deleteSale:', error)
    throw error
  }
}

export async function listItems(saleId: string): Promise<Item[]> {
  try {
    const supabase = createSupabaseServer()
    const itemsTable = getTableName('items')
    
    const { data, error } = await supabase
      .from(itemsTable)
      .select('*')
      .eq('sale_id', saleId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error)
      throw new Error('Failed to fetch items')
    }

    return data as Item[]
  } catch (error) {
    console.error('Error in listItems:', error)
    throw error
  }
}

export async function createItem(saleId: string, input: ItemInput): Promise<Item> {
  try {
    const validatedInput = ItemInputSchema.parse(input)
    const supabase = createSupabaseServer()
    const itemsTable = getTableName('items')
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Verify user owns the sale
    const sale = await getSaleById(saleId)
    if (!sale || sale.owner_id !== user.id) {
      throw new Error('Unauthorized to add items to this sale')
    }

    const { data, error } = await supabase
      .from(itemsTable)
      .insert({
        sale_id: saleId,
        ...validatedInput,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating item:', error)
      throw new Error('Failed to create item')
    }

    return data as Item
  } catch (error) {
    console.error('Error in createItem:', error)
    throw error
  }
}

export async function toggleFavorite(saleId: string): Promise<{ is_favorited: boolean }> {
  try {
    const supabase = createSupabaseServer()
    const favoritesTable = getTableName('favorites')
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if already favorited
    const { data: existingFavorite } = await supabase
      .from(favoritesTable)
      .select('id')
      .eq('sale_id', saleId)
      .eq('user_id', user.id)
      .single()

    if (existingFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from(favoritesTable)
        .delete()
        .eq('sale_id', saleId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error removing favorite:', error)
        throw new Error('Failed to remove favorite')
      }

      return { is_favorited: false }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from(favoritesTable)
        .insert({
          sale_id: saleId,
          user_id: user.id,
        })

      if (error) {
        console.error('Error adding favorite:', error)
        throw new Error('Failed to add favorite')
      }

      return { is_favorited: true }
    }
  } catch (error) {
    console.error('Error in toggleFavorite:', error)
    throw error
  }
}
