'use client'
import { useEffect, useState } from 'react'

export default function EnvironmentCheck() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean
    supabaseKey: boolean
    googleMaps: boolean
    siteUrl: boolean
  }>({
    supabaseUrl: false,
    supabaseKey: false,
    googleMaps: false,
    siteUrl: false,
  })

  useEffect(() => {
    const checkEnv = () => {
      setEnvStatus({
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
          process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co',
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key',
        googleMaps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && 
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== 'placeholder-key',
        siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL && 
          process.env.NEXT_PUBLIC_SITE_URL !== 'https://lootaura.com',
      })
    }

    checkEnv()
  }, [])

  const allConfigured = envStatus.supabaseUrl && envStatus.supabaseKey

  if (allConfigured && envStatus.googleMaps) return null

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="text-yellow-800 font-medium">Configuration Issue</h3>
      <p className="text-yellow-600 text-sm mt-1">
        Some environment variables are not properly configured:
      </p>
      <ul className="text-yellow-600 text-sm mt-2 space-y-1">
        {!envStatus.supabaseUrl && (
          <li>• NEXT_PUBLIC_SUPABASE_URL is missing or invalid</li>
        )}
        {!envStatus.supabaseKey && (
          <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid</li>
        )}
        {!envStatus.googleMaps && (
          <li>• NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing (maps will not work)</li>
        )}
        {!envStatus.siteUrl && (
          <li>• NEXT_PUBLIC_SITE_URL is missing (some features may not work)</li>
        )}
      </ul>
    </div>
  )
}
