import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'

export const runtime = 'nodejs'

export default async function ProfilePage() {
  const supabase = createSupabaseServer()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/signin?returnTo=/account/profile')
  }

  return <ProfileForm />
}
