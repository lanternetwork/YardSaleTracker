import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import AccountOverview from './AccountOverview'

export const runtime = 'nodejs'

export default async function AccountPage() {
  const supabase = createSupabaseServer()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/signin?returnTo=/account')
  }

  return <AccountOverview />
}