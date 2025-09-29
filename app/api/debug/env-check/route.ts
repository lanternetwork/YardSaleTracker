import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      googleMapsApiKey: {
        exists: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        length: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length || 0,
        prefix: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) || 'none',
        isValid: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.startsWith('AIza') || false
      },
      supabase: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      vercel: {
        env: process.env.VERCEL_ENV || 'development',
        region: process.env.VERCEL_REGION || 'unknown'
      }
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Environment variables check'
    })

  } catch (error) {
    console.error('Env check error:', error)
    return NextResponse.json(
      { error: 'Environment check failed', details: error },
      { status: 500 }
    )
  }
}
