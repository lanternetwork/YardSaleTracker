'use client'
import { useFavorites, useToggleFavorite } from '@/lib/hooks/useFavorites'

export default function FavoriteButton({ 
  saleId, 
  initial = false
}: { 
  saleId: string
  initial?: boolean 
}) {
  const { data: favorites = [] } = useFavorites()
  const { mutateAsync, isPending } = useToggleFavorite()
  
  const list = (favorites as any[])
  const isFavorited = list.some((fav: any) => fav && fav.id === saleId)

  const handleToggle = () => {
    mutateAsync({ saleId, isFavorited })
  }

  return (
    <button 
      aria-pressed={isFavorited} 
      disabled={isPending}
      className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
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
