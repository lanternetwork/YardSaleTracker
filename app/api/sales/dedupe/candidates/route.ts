import { NextRequest, NextResponse } from 'next/server'
import { findDuplicateCandidates } from '@/lib/sales/dedupe'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const options = await request.json()
    
    const candidates = await findDuplicateCandidates(options)
    
    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Error in POST /api/sales/dedupe/candidates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}