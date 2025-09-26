import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { config } from '@/lib/config/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Basic health check
    const health = {
      ok: true,
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 'unknown',
      environment: {
        node: process.env.NODE_ENV,
        vercel: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
      },
      services: {
        supabase: false,
        database: false,
        tables: {
          sales: false,
          ingest_runs: false,
        }
      }
    }

    // Check Supabase connection
    try {
      const supabase = getAdminSupabase()
      health.services.supabase = true
      
      // Check database connectivity
      const { data: dbCheck } = await supabase
        .from('sales')
        .select('id')
        .limit(1)
      
      health.services.database = true
      health.services.tables.sales = true
    } catch (error) {
      console.error('Database health check failed:', error)
    }

    // Check ingest_runs table
    try {
      const supabase = getAdminSupabase()
      const { data: ingestCheck } = await supabase
        .from('ingest_runs')
        .select('id')
        .limit(1)
      
      health.services.tables.ingest_runs = true
    } catch (error) {
      console.error('Ingest runs table check failed:', error)
    }

    // Add feature flags (masked)
    health.features = {
      admin: config.features.admin,
      diagnostics: config.features.diagnostics,
      demo: config.features.demo,
    }

    // Add service availability (masked)
    health.available_services = {
      maps: config.services.maps,
      redis: config.services.redis,
      push: config.services.push,
      sentry: config.services.sentry,
    }

    const responseTime = Date.now() - startTime
    health.response_time_ms = responseTime

    return NextResponse.json(health, {
      status: health.ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      ok: false,
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 'unknown'
    }, { status: 503 })
  }
}
