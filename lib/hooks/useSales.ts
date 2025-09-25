import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { Sale, SaleItem } from '@/lib/types'
import { SaleSchema } from '@/lib/zodSchemas'
import { getMockSales } from '@/lib/mockData'

const sb = createSupabaseBrowser()

export function useSales(filters?: {
  q?: string
  maxKm?: number
  lat?: number
  lng?: number
  dateFrom?: string
  dateTo?: string
  tags?: string[]
  min?: number
  max?: number
}) {
  return useQuery<Sale[], Error>({
    queryKey: ['sales', filters],
    queryFn: async () => {
      try {
        // Try the optimized search function first
        const { data, error } = await sb.rpc('search_sales', {
          search_query: filters?.q || null,
          max_distance_km: filters?.maxKm || null,
          user_lat: filters?.lat || null,
          user_lng: filters?.lng || null,
          date_from: filters?.dateFrom || null,
          date_to: filters?.dateTo || null,
          price_min: filters?.min || null,
          price_max: filters?.max || null,
          tags_filter: filters?.tags || null,
          limit_count: 100,
          offset_count: 0
        })

        if (error) {
          console.warn('RPC search_sales failed, falling back to direct query:', error.message)
          throw error
        }

        const result = (data as unknown as any[]).flat ? (data as unknown as any[]).flat() as Sale[] : (data as unknown as Sale[])
        return result as Sale[]
      } catch (rpcError) {
        console.warn('RPC function not available, using fallback query')
        
        // Fallback to direct table query
        let query = sb.from('yard_sales').select('*')
        
        // Apply basic filters
        if (filters?.q) {
          query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`)
        }
        
        if (filters?.dateFrom) {
          query = query.gte('start_at', filters.dateFrom)
        }
        
        if (filters?.dateTo) {
          query = query.lte('end_at', filters.dateTo)
        }
        
        if (filters?.min !== undefined) {
          query = query.gte('price_min', filters.min)
        }
        
        if (filters?.max !== undefined) {
          query = query.lte('price_max', filters.max)
        }
        
        if (filters?.tags && filters.tags.length > 0) {
          query = query.overlaps('tags', filters.tags)
        }
        
        const { data, error } = await query.limit(100)
        
        if (error) {
          console.warn('Direct database query failed, using mock data:', error.message)
          return getMockSales() as Sale[]
        }
        
        // If no data returned, use mock data as fallback
        if (!data || data.length === 0) {
          console.warn('No data returned from database, using mock data')
          return getMockSales() as Sale[]
        }
        
        return (data as Sale[])
      }
    },
    retry: (failureCount, error) => {
      // Retry up to 3 times for network issues
      if (failureCount < 3 && (
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('Failed to fetch')
      )) {
        console.log(`Retrying fetch attempt ${failureCount + 1}/3`)
        return true
      }
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
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

      return (data as any[])?.map((fav: any) => fav.yard_sales).filter(Boolean) as Sale[]
    },
  })
}
