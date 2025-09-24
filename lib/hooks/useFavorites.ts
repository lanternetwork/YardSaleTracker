import { useQuery } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/lib/supabase/client'

export function useFavorites() {
  const supabase = createSupabaseBrowser()
  
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
      
      if (error) throw error
      return data || []
    }
  })
}

export function useToggleFavorite() {
  const supabase = createSupabaseBrowser()
  
  return {
    mutate: async ({ saleId, isFavorited }: { saleId: string, isFavorited: boolean }) => {
      if (isFavorited) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('sale_id', saleId)
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({ sale_id: saleId })
      }
    },
    isPending: false
  }
}
