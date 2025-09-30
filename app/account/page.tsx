import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import AccountClient from './AccountClient'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'

export default async function AccountPage() {
  const supabase = createSupabaseServerClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    notFound()
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from(T.profiles)
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<AccountSkeleton />}>
        <AccountClient 
          user={user}
          profile={profile}
        />
      </Suspense>
    </div>
  )
}

function AccountSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-1/3"></div>
        
        {/* Profile form skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
