import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { Profile, Sale } from '@/lib/types'
import { ProfileSchema } from '@/lib/zodSchemas'

export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const sb = createSupabaseBrowser()
      const { data: { user }, error } = await sb.auth.getUser()
      if (error) {
        throw new Error(error.message)
      }
      return user
    },
  })
}

export function useProfile() {
  const { data: user } = useAuth()
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null

      const sb = createSupabaseBrowser()
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        throw new Error(error.message)
      }

      return data as Profile | null
    },
    enabled: !!user,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profileData: Partial<Profile>) => {
      const sb = createSupabaseBrowser()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const parsed = ProfileSchema.partial().safeParse(profileData)
      if (!parsed.success) {
        throw new Error('Invalid profile data')
      }

      const { data, error } = await sb
        .from('profiles')
        .upsert({ user_id: user.id, ...parsed.data })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as Profile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const sb = createSupabaseBrowser()
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useSignUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const sb = createSupabaseBrowser()
      const { data, error } = await sb.auth.signUp({
        email,
        password
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const sb = createSupabaseBrowser()
      const { error } = await sb.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useFavorites() {
  const { data: user } = useAuth()
  
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return []

      const sb = createSupabaseBrowser()
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

      return data?.map((fav: any) => fav.yard_sales).filter(Boolean) as unknown as Sale[] || []
    },
    enabled: !!user,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { data: user } = useAuth()

  return useMutation({
    mutationFn: async ({ saleId, isFavorited }: { saleId: string; isFavorited: boolean }) => {
      if (!user) {
        throw new Error('Please sign in to save favorites')
      }

      const sb = createSupabaseBrowser()
      if (isFavorited) {
        const { error } = await sb
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('sale_id', saleId)

        if (error) {
          throw new Error(error.message)
        }
      } else {
        const { error } = await sb
          .from('favorites')
          .insert({ user_id: user.id, sale_id: saleId })

        if (error) {
          throw new Error(error.message)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
