'use client'
import { useState } from 'react'
import { useFavorites, useToggleFavorite } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'

export default function FavoriteButton({ 
  saleId, 
  initial = false
}: { 
  saleId: string
  initial?: boolean 
}) {
  const { data: favorites = [] } = useFavorites()
  const toggleFavorite = useToggleFavorite()
  const { success: toastSuccess, error: toastError } = useToast()
  
  // Optimistic state - starts with server state, then tracks local changes
  const [optimisticFavorited, setOptimisticFavorited] = useState<boolean | null>(null)
  
  const serverFavorited = favorites.some((fav: any) => fav.sale_id === saleId || fav.id === saleId)
  const isFavorited = optimisticFavorited !== null ? optimisticFavorited : serverFavorited

  const handleToggle = async () => {
    // Optimistic update
    const newFavorited = !isFavorited
    setOptimisticFavorited(newFavorited)
    
    try {
      await toggleFavorite.mutateAsync({ saleId, isFavorited: !newFavorited })
      toastSuccess(newFavorited ? 'Added to favorites!' : 'Removed from favorites!')
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticFavorited(!newFavorited)
      toastError(error instanceof Error ? error.message : 'Failed to update favorites')
    }
  }

  return (
    <button 
      aria-pressed={isFavorited} 
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      disabled={toggleFavorite.isPending}
      className={`min-h-[44px] min-w-[44px] rounded px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isFavorited 
          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={handleToggle}
    >
      {isFavorited ? '♥ Saved' : '♡ Save'}
    </button>
  )
}
