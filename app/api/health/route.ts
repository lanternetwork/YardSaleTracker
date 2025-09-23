import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // Simple health check that doesn't require database connection
  return NextResponse.json({ 
    ok: true,
    timestamp: new Date().toISOString(),
    status: 'healthy'
  })
}
