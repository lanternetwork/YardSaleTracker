'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Zod schemas for validation
const SaleInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  date_start: z.string().min(1, 'Start date is required'),
  time_start: z.string().min(1, 'Start time is required'),
  date_end: z.string().optional(),
  time_end: z.string().optional(),
  lat: z.number().min(-90).max(90, 'Invalid latitude'),
  lng: z.number().min(-180).max(180, 'Invalid longitude'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip_code: z.string().optional(),
  tags: z.array(z.string()).default([]),
  price: z.number().min(0, 'Price must be positive').optional(),
  photos: z.array(z.string()).default([]),
}).refine((data) => {
  // If end date is provided, it must be >= start date
  if (data.date_end && data.date_start) {
    const startDate = new Date(data.date_start)
    const endDate = new Date(data.date_end)
    if (endDate < startDate) {
      return false
    }
  }
  return true
}, {
  message: 'End date must be on or after start date',
  path: ['date_end']
})

const ItemInputSchema = z.object({
  title: z.string().min(1, 'Item title is required'),
  description: z.string().optional(),
  price_cents: z.number().min(0).optional(),
  image_url: z.string().url().optional(),
})

export type SaleInput = z.infer<typeof SaleInputSchema>
export type ItemInput = z.infer<typeof ItemInputSchema>

// Action result types
export type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Authentication required')
  }
  
  return { supabase, user }
}

// Sale actions
export async function createSale(input: SaleInput): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    
    // Validate input
    const validatedInput = SaleInputSchema.parse(input)
    
    const { data, error } = await supabase
      .from(T.sales)
      .insert({
        owner_id: user.id,
        title: validatedInput.title,
        description: validatedInput.description,
        date_start: validatedInput.date_start,
        time_start: validatedInput.time_start,
        date_end: validatedInput.date_end,
        time_end: validatedInput.time_end,
        lat: validatedInput.lat,
        lng: validatedInput.lng,
        address: validatedInput.address,
        city: validatedInput.city,
        state: validatedInput.state,
        zip_code: validatedInput.zip_code,
        tags: validatedInput.tags,
        price: validatedInput.price,
        cover_image_url: validatedInput.photos.length > 0 ? validatedInput.photos[0] : null,
        status: 'published',
        privacy_mode: 'exact',
        is_featured: false,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/sales')
    revalidatePath('/sell')
    
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        fieldErrors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).map(([key, value]) => [
            key, 
            value || []
          ])
        ) as Record<string, string[]>
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }
  }
}

export async function updateSale(id: string, input: Partial<SaleInput>): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    
    // Validate input - create a partial schema for updates
    const UpdateSaleSchema = z.object({
      title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
      description: z.string().optional(),
      date_start: z.string().min(1, 'Start date is required').optional(),
      time_start: z.string().min(1, 'Start time is required').optional(),
      date_end: z.string().optional(),
      time_end: z.string().optional(),
      lat: z.number().min(-90).max(90, 'Invalid latitude').optional(),
      lng: z.number().min(-180).max(180, 'Invalid longitude').optional(),
      address: z.string().min(1, 'Address is required').optional(),
      city: z.string().min(1, 'City is required').optional(),
      state: z.string().min(1, 'State is required').optional(),
      zip_code: z.string().optional(),
      tags: z.array(z.string()).optional(),
      price: z.number().min(0, 'Price must be positive').optional(),
      photos: z.array(z.string()).optional(),
    })
    
    const validatedInput = UpdateSaleSchema.parse(input)
    
    const { data, error } = await supabase
      .from(T.sales)
      .update({
        title: validatedInput.title,
        description: validatedInput.description,
        date_start: validatedInput.date_start,
        time_start: validatedInput.time_start,
        date_end: validatedInput.date_end,
        time_end: validatedInput.time_end,
        lat: validatedInput.lat,
        lng: validatedInput.lng,
        address: validatedInput.address,
        city: validatedInput.city,
        state: validatedInput.state,
        zip_code: validatedInput.zip_code,
        tags: validatedInput.tags,
        price: validatedInput.price,
        cover_image_url: validatedInput.photos && validatedInput.photos.length > 0 ? validatedInput.photos[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('owner_id', user.id) // Ensure user owns the sale
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/sales')
    revalidatePath(`/sales/${id}`)
    revalidatePath('/sell')
    
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        fieldErrors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).map(([key, value]) => [
            key, 
            value || []
          ])
        ) as Record<string, string[]>
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }
  }
}

export async function deleteSale(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    
    const { error } = await supabase
      .from(T.sales)
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id) // Ensure user owns the sale

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/sales')
    revalidatePath('/sell')
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }
  }
}

// Item actions
export async function createItem(saleId: string, input: ItemInput): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    
    // Validate input
    const validatedInput = ItemInputSchema.parse(input)
    
    // First verify the user owns the sale
    const { data: sale, error: saleError } = await supabase
      .from(T.sales)
      .select('id')
      .eq('id', saleId)
      .eq('owner_id', user.id)
      .single()

    if (saleError || !sale) {
      return { success: false, error: 'Sale not found or access denied' }
    }
    
    const { data, error } = await supabase
      .from(T.items)
      .insert({
        sale_id: saleId,
        name: validatedInput.title,
        description: validatedInput.description,
        price: validatedInput.price_cents ? validatedInput.price_cents / 100 : null,
        image_url: validatedInput.image_url,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/sales/${saleId}`)
    revalidatePath('/sell')
    
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        fieldErrors: Object.fromEntries(
          Object.entries(error.flatten().fieldErrors).map(([key, value]) => [
            key, 
            value || []
          ])
        ) as Record<string, string[]>
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }
  }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    
    // First get the item to verify ownership through the sale
    const { data: item, error: itemError } = await supabase
      .from(T.items)
      .select(`
        id,
        sales!inner (
          id,
          owner_id
        )
      `)
      .eq('id', id)
      .single()

    if (itemError || !item) {
      return { success: false, error: 'Item not found' }
    }

    // Check if user owns the sale
    if (item.sales[0]?.owner_id !== user.id) {
      return { success: false, error: 'Access denied' }
    }
    
    const { error } = await supabase
      .from(T.items)
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/sales')
    revalidatePath('/sell')
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }
  }
}

// Favorite actions
export async function toggleFavorite(saleId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    
    // Check if already favorited
    const { data: existing } = await supabase
      .from(T.favorites)
      .select('*')
      .eq('user_id', user.id)
      .eq('sale_id', saleId)
      .single()

    if (existing) {
      // Remove from favorites
      const { error } = await supabase
        .from(T.favorites)
        .delete()
        .eq('user_id', user.id)
        .eq('sale_id', saleId)

      if (error) {
        return { success: false, error: error.message }
      }

      revalidatePath('/favorites')
      revalidatePath(`/sales/${saleId}`)
      
      return { success: true, data: { favorited: false } }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from(T.favorites)
        .insert({
          user_id: user.id,
          sale_id: saleId,
        })

      if (error) {
        return { success: false, error: error.message }
      }

      revalidatePath('/favorites')
      revalidatePath(`/sales/${saleId}`)
      
      return { success: true, data: { favorited: true } }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }
  }
}
