'use client'
import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    
    // Get initial session
    supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
      setUser(data.user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    data: user,
    isLoading: loading
  }
}

export function useSignIn() {
  const supabase = createSupabaseBrowser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string, password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authSession'] })
    }
  })
}

export function useSignUp() {
  const supabase = createSupabaseBrowser()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string, password: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      if (error) throw error
      return data
    }
  })
}

export function useSignOut() {
  const supabase = createSupabaseBrowser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authSession'] })
    }
  })
}

export function useProfile() {
  const supabase = createSupabaseBrowser()
  const { data: user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useUpdateProfile() {
  const supabase = createSupabaseBrowser()
  const queryClient = useQueryClient()
  const { data: user } = useAuth()

  return useMutation({
    mutationFn: async (updates: { display_name?: string, avatar_url?: string }) => {
      if (!user) throw new Error('User not authenticated')
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    }
  })
}

// Re-export favorites hooks for convenience
export { useFavorites, useToggleFavorite } from './useFavorites'