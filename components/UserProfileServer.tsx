import Link from 'next/link'
import { Session } from '@supabase/supabase-js'

interface UserProfileServerProps {
  session: Session | null
}

export default function UserProfileServer({ session }: UserProfileServerProps) {
  if (!session) {
    return (
      <Link 
        href="/auth" 
        className="text-neutral-700 hover:text-brand-600 font-medium transition-colors"
      >
        Sign In
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-medium text-sm">
        {session.user.email?.[0]?.toUpperCase() || 'U'}
      </div>

      {/* User info */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-700">
          {session.user.email}
        </span>
        
        {/* Profile dropdown */}
        <div className="relative group">
          <button className="text-neutral-500 hover:text-neutral-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-4">
              <h3 className="font-semibold text-neutral-900 mb-3">Profile Settings</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-neutral-600">Email</div>
                  <div className="text-sm font-medium">{session.user.email}</div>
                </div>

                <div className="pt-2 border-t">
                  <a
                    href="/account"
                    className="block w-full text-left px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 rounded"
                  >
                    Account Settings
                  </a>
                  <a
                    href="/auth/signout"
                    className="block w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Sign Out
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
