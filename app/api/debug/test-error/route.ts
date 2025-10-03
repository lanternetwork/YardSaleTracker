import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Only allow in Preview/Development environments
    const isPreview = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development'
    if (!isPreview) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const errorType = searchParams.get('type') || 'generic'

    // Capture test error with context
    const testError = new Error(`Test error from /api/debug/test-error (type: ${errorType})`)
    
    Sentry.captureException(testError, {
      tags: {
        api: 'debug',
        method: 'GET',
        test: true
      },
      extra: {
        errorType,
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
        url: request.url
      }
    })

    return NextResponse.json({
      ok: true,
      message: `Test error sent to Sentry (type: ${errorType})`,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV
    })

  } catch (error: any) {
    console.error('[DEBUG_TEST_ERROR] Fatal error:', error.message)
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 })
  }
}
