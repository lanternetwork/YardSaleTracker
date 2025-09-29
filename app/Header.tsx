'use client'
import Link from 'next/link'
import UserProfile from '@/components/UserProfile'
import { APP_NAME } from '@/lib/config/branding'

export function Header() {
  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-amber-600">
            {APP_NAME}
          </Link>
          
          <div className="flex gap-6 items-center">
            <Link 
              href="/explore" 
              className="text-neutral-700 hover:text-amber-600 font-medium"
            >
              Browse Sales
            </Link>
            <Link 
              href="/favorites" 
              className="text-neutral-700 hover:text-amber-600 font-medium"
            >
              Favorites
            </Link>
            <Link 
              href="/explore?tab=add" 
              className="text-neutral-700 hover:text-amber-600 font-medium"
            >
              Post Sale
            </Link>
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  )
}
