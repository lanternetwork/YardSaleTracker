import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { Sale, SaleItem } from '@/lib/types'
import { SaleSchema } from '@/lib/zodSchemas'

export function useSales(filters?: {
  q?: string
  maxKm?: number
  lat?: number
  lng?: number
  dateFrom?: string
  dateTo?: string
  tags?: string[]
}) {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: async () => {
      const sb = createSupabaseBrowser()
      
      // Default date filter: this weekend & future if no date filter present
      let dateFrom = filters?.dateFrom
      let dateTo = filters?.dateTo
      
      if (!dateFrom && !dateTo) {
        const today = new Date()
        const startOfWeekend = new Date(today)
        
        // Find the start of this weekend (Friday)
        const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysToFriday = (5 - dayOfWeek + 7) % 7 // Days until Friday
        startOfWeekend.setDate(today.getDate() + daysToFriday)
        
        // If it's already weekend (Friday-Sunday), use today
        if (dayOfWeek >= 5) {
          startOfWeekend.setDate(today.getDate())
        }
        
        dateFrom = startOfWeekend.toISOString().split('T')[0]
        // No end date - show all future sales
      }
      
      // Try the optimized RPC function first
      try {
        const { data, error } = await sb.rpc('search_sales', {
          search_query: filters?.q || null,
          max_distance_km: filters?.maxKm || null,
          user_lat: filters?.lat || null,
          user_lng: filters?.lng || null,
          date_from: dateFrom,
          date_to: dateTo,
          min_price_param: null,
          max_price_param: null,
          tags_filter: filters?.tags || null,
          limit_count: 100,
          offset_count: 0
        })

        if (error) {
          throw new Error(error.message)
        }

        return data as Sale[]
      } catch (rpcError) {
        // Fallback to regular query if RPC function is not available
        console.warn('RPC function not available, using fallback query:', rpcError)
        
        let query = sb
          .from('yard_sales')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(100)

        // Apply text search filter
        if (filters?.q) {
          query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`)
        }

        // Apply date filters (using existing start_at column until migration is applied)
        if (dateFrom) {
          query = query.gte('start_at', dateFrom + 'T00:00:00Z')
        }
        if (dateTo) {
          query = query.lte('start_at', dateTo + 'T23:59:59Z')
        }


        // Apply tags filter
        if (filters?.tags && filters.tags.length > 0) {
          query = query.overlaps('tags', filters.tags)
        }

        const { data, error } = await query

        if (error) {
          throw new Error(error.message)
        }

        return data as Sale[]
      }
    },
  })
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const sb = createSupabaseBrowser()
      const { data, error } = await sb
        .from('yard_sales')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as Sale
    },
    enabled: !!id,
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (saleData: any) => {
      const parsed = SaleSchema.safeParse(saleData)
      if (!parsed.success) {
        throw new Error('Invalid sale data')
      }

      const sb = createSupabaseBrowser()
      const { data, error } = await sb
        .from('yard_sales')
        .insert([parsed.data])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as Sale
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

export function useUpdateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...saleData }: { id: string } & Partial<Sale>) => {
      const parsed = SaleSchema.partial().safeParse(saleData)
      if (!parsed.success) {
        throw new Error('Invalid sale data')
      }

      const sb = createSupabaseBrowser()
      const { data, error } = await sb
        .from('yard_sales')
        .update(parsed.data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as Sale
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sale', data.id] })
    },
  })
}

export function useDeleteSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const sb = createSupabaseBrowser()
      const { error } = await sb
        .from('yard_sales')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

export function useSaleItems(saleId: string) {
  return useQuery({
    queryKey: ['sale-items', saleId],
    queryFn: async () => {
      const sb = createSupabaseBrowser()
      const { data, error } = await sb
        .from('sale_items')
        .select('*')
        .eq('sale_id', saleId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data as SaleItem[]
    },
    enabled: !!saleId,
  })
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const sb = createSupabaseBrowser()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return []

      const { data, error } = await sb
        .from('favorites')
        .select(`
          sale_id,
          yard_sales (*)
        `)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      return data?.map(fav => fav.yard_sales).filter(Boolean) as unknown as Sale[]
    },
  })
}
