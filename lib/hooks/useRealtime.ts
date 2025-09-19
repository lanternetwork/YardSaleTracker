'use client'
import { useEffect, useRef } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeSales(onUpdate: (payload: any) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    // Subscribe to yard_sales changes
    const channel = supabase
      .channel('yard_sales_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'yard_sales'
        },
        onUpdate
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [supabase, onUpdate])
}

export function useRealtimeFavorites(userId: string, onUpdate: (payload: any) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!userId) return

    // Subscribe to favorites changes for this user
    const channel = supabase
      .channel('favorites_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${userId}`
        },
        onUpdate
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [supabase, userId, onUpdate])
}

export function useRealtimeReviews(saleId: string, onUpdate: (payload: any) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    if (!saleId) return

    // Subscribe to reviews changes for this sale
    const channel = supabase
      .channel('reviews_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `sale_id=eq.${saleId}`
        },
        onUpdate
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [supabase, saleId, onUpdate])
}
