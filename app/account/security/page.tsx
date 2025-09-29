import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import SecuritySettings from './SecuritySettings'

export const runtime = 'nodejs'

export default async function SecurityPage() {
  const supabase = createSupabaseServer()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/signin?returnTo=/account/security')
  }

  return <SecuritySettings />
}
