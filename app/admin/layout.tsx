import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/security/admin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServer()
  let email: string | null = null
  try {
    const { data }: any = await supabase.auth.getUser()
    email = data?.user?.email ?? null
  } catch {}
  if (!isAdminEmail(email)) {
    notFound()
  }
  return <>{children}</>
}


