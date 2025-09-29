import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import MySalesList from './MySalesList'

export const runtime = 'nodejs'

export default async function MySalesPage() {
  const supabase = createSupabaseServer()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/signin?returnTo=/account/sales')
  }

  return <MySalesList />
}
