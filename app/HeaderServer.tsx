import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import UserProfileServer from '@/components/UserProfileServer'

export default async function HeaderServer() {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <nav className="sticky top-0 z-50 navbar-backdrop">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/" 
            className="text-2xl font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            YardSaleFinder
          </Link>
          
          <div className="flex gap-8 items-center">
            <Link 
              href="/explore" 
              className="text-neutral-700 hover:text-brand-600 font-medium transition-colors"
            >
              Browse Sales
            </Link>
            <Link 
              href={session ? "/favorites" : "/auth?returnTo=/favorites"}
              className="text-neutral-700 hover:text-brand-600 font-medium transition-colors"
            >
              Favorites
            </Link>
            <Link 
              href="/sell/new" 
              className="btn-primary"
            >
              Create Sale
            </Link>
            <UserProfileServer session={session} />
          </div>
        </div>
      </div>
    </nav>
  )
}
