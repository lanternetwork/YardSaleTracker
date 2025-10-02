import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Guard: Only allow in Preview environments
    const vercelEnv = process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || 'local'
    if (vercelEnv === 'production') {
      return NextResponse.json({ ok: false, error: 'Not available in production' }, { status: 403 })
    }

    const supabase = createSupabaseServerClient()

    // Count total and missing city/state
    const { data: totalData, error: totalError } = await supabase
      .from('lootaura_v2.zipcodes')
      .select('zip', { count: 'exact', head: true })

    if (totalError) {
      throw new Error(`Count total failed: ${totalError.message}`)
    }

    const { data: missingData, error: missingError } = await supabase
      .from('lootaura_v2.zipcodes')
      .select('zip', { count: 'exact', head: true })
      .is('state', null)

    if (missingError) {
      throw new Error(`Count missing failed: ${missingError.message}`)
    }

    const total = (totalData as any)?.length === 0 ? (totalData as any)?.length : (totalData as any) // count is on headers; fallback below
    const totalCount = (total as any)?.length ?? (totalData as any) ?? (totalError as any)?.count ?? (missingData as any)?.count

    // Supabase JS returns counts via response.count, but select(head:true) returns [] with count on headers internally.
    // More reliable approach: use .select('*', { count: 'exact' }).limit(0)
    const { count: totalCount2, error: totalError2 } = await supabase
      .from('lootaura_v2.zipcodes')
      .select('*', { count: 'exact' })
      .limit(0)

    const { count: missingCount2, error: missingError2 } = await supabase
      .from('lootaura_v2.zipcodes')
      .select('*', { count: 'exact' })
      .is('state', null)
      .limit(0)

    if (totalError2) {
      throw new Error(`Count total(2) failed: ${totalError2.message}`)
    }
    if (missingError2) {
      throw new Error(`Count missing(2) failed: ${missingError2.message}`)
    }

    // Dry run seed call for logging
    try {
      const url = new URL('/api/admin/seed/zipcodes?dryRun=true', `${request.nextUrl.origin}`)
      const dryRunRes = await fetch(url, { method: 'GET' })
      const dryRunJson = await dryRunRes.json()
      console.log('[ZIPCODES][DRYRUN]', { status: dryRunRes.status, body: dryRunJson })
    } catch (e: any) {
      console.log('[ZIPCODES][DRYRUN][ERROR]', e?.message || e)
    }

    return NextResponse.json({
      ok: true,
      total: totalCount2 ?? 0,
      missing_city_state: missingCount2 ?? 0,
      env: vercelEnv
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'unknown' }, { status: 500 })
  }
}


