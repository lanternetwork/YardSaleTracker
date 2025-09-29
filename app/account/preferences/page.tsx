import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import PreferencesForm from './PreferencesForm'

export const runtime = 'nodejs'

export default async function PreferencesPage() {
  const supabase = createSupabaseServer()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/signin?returnTo=/account/preferences')
  }

  return <PreferencesForm />
}
