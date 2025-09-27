import { NextResponse } from 'next/server'
import { allowPublicAdmin } from '@/lib/server/adminAccess'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const isPublicAdminEnabled = allowPublicAdmin()
    
    return NextResponse.json({
      enabled: isPublicAdminEnabled,
      environment: process.env.VERCEL_ENV || 'development'
    })
  } catch (error) {
    console.error('Public mode check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
