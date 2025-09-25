'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import UserProfile from '@/components/UserProfile'

export function Header() {
  const { user } = useAuth()

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
              href={user ? "/favorites" : "/auth?returnTo=/favorites"}
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
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  )
}
