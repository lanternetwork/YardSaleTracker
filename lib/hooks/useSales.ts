import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { Sale, SaleItem } from '@/lib/types'
import { SaleSchema } from '@/lib/zodSchemas'

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
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: async () => {
      // Use the optimized search function for better performance
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
        throw new Error(error.message)
      }

      return data as Sale[]
    },
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

      return data?.map(fav => fav.yard_sales).filter(Boolean) as Sale[]
    },
  })
}
