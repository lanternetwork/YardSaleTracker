import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  // Simple response for build compatibility
  return NextResponse.json({ 
    success: true,
    message: 'Push subscription endpoint - requires runtime environment'
  })
}

export async function DELETE(request: NextRequest) {
  // Simple response for build compatibility
  return NextResponse.json({ 
    success: true,
    message: 'Push unsubscription endpoint - requires runtime environment'
  })
}
