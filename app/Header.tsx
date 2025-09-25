'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import UserProfile from '@/components/UserProfile'

export function Header() {
  const { user } = useAuth()

  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-amber-600">
            YardSaleFinder
          </Link>
          
          <div className="flex gap-6 items-center">
            <Link 
              href="/explore" 
              className="text-neutral-700 hover:text-amber-600 font-medium"
            >
              Browse Sales
            </Link>
            <Link 
              href={user ? "/favorites" : "/auth?returnTo=/favorites"}
              className="text-neutral-700 hover:text-amber-600 font-medium"
            >
              Favorites
            </Link>
            <Link 
              href="/sell/new" 
              className="text-neutral-700 hover:text-amber-600 font-medium"
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
