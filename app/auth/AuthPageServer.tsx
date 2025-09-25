import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import AuthPageClient from './AuthPageClient'

interface AuthPageServerProps {
  searchParams: { returnTo?: string; error?: string }
}

export default async function AuthPageServer({ searchParams }: AuthPageServerProps) {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()

  // If user is already authenticated, redirect them
  if (session) {
    const returnTo = searchParams.returnTo
    const sanitizedReturnTo = returnTo && returnTo !== '/auth' && returnTo !== '/auth/callback' 
      ? returnTo 
      : '/'
    redirect(sanitizedReturnTo)
  }

  return <AuthPageClient returnTo={searchParams.returnTo} error={searchParams.error} />
}
