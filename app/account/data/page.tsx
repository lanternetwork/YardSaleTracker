import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import DataPrivacySettings from './DataPrivacySettings'

export const runtime = 'nodejs'

export default async function DataPrivacyPage() {
  const supabase = createSupabaseServer()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/signin?returnTo=/account/data')
  }

  return <DataPrivacySettings />
}
