import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  // Simple response for build compatibility
  return NextResponse.json({ 
    success: true,
    sent: 0,
    failed: 0,
    total: 0,
    message: 'Push test endpoint - requires runtime environment'
  })
}
