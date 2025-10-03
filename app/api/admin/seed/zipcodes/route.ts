import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { RateLimiter } from '@/lib/rateLimiter'
import { checkAndSetIdempotency } from '@/lib/admin/idempotency'

function authOk(req: NextRequest): boolean {
  const token = process.env.SEED_TOKEN
  if (!token) return false
  const hdr = req.headers.get('authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(hdr)
  if (!m) return false
  return m[1] === token
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 5/min per IP
  const limiter = new RateLimiter({ windowMs: 60 * 1000, maxRequests: 5 })
  const rate = await limiter.checkLimit(req as any)
  if (!rate.success) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 })
  }

  // Idempotency: 24h replay protection for the entire ingestion
  const idKey = req.headers.get('Idempotency-Key') || req.headers.get('idempotency-key')
  const idStatus = checkAndSetIdempotency(idKey)
  if (idStatus === 'replay') {
    return NextResponse.json({ ok: true, status: 'idempotent_replay' })
  }

  try {
    const { searchParams } = new URL(req.url)
    const dryRun = searchParams.get('dryRun') === 'true'
    
    const supabase = createSupabaseServerClient()
    const startedAt = new Date().toISOString()
    
    console.log(`[ZIPSEED] Starting ZIP codes ingestion... dryRun=${dryRun}`)
    
    // Import the zipcodes package
    const zipcodes = require('zipcodes')
    
    // Get all unique ZIP codes from the package
    const allZipData = zipcodes.all()
    console.log(`[ZIPSEED] Loaded ${allZipData.length} ZIP records from package`)
    
    // Filter to unique 5-digit ZIPs and extract required fields
    const uniqueZips = new Map()
    for (const zipData of allZipData) {
      if (zipData.zip && zipData.zip.length === 5 && /^\d{5}$/.test(zipData.zip)) {
        uniqueZips.set(zipData.zip, {
          zip: zipData.zip,
          lat: parseFloat(zipData.latitude),
          lng: parseFloat(zipData.longitude),
          city: zipData.city || null,
          state: zipData.state || null
        })
      }
    }
    
    const zipArray = Array.from(uniqueZips.values())
    const totalFound = zipArray.length
    const chunkSize = 500
    const estimatedBatches = Math.ceil(totalFound / chunkSize)
    
    console.log(`[ZIPSEED] Processing ${totalFound} unique 5-digit ZIP codes`)
    console.log(`[ZIPSEED] Chunk size: ${chunkSize}, Estimated batches: ${estimatedBatches}`)
    
    if (dryRun) {
      console.log(`[ZIPSEED] DRY RUN - No data will be written`)
      const finishedAt = new Date().toISOString()
      const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
      
      return NextResponse.json({
        ok: true,
        dryRun: true,
        totalFound,
        chunkSize,
        estimatedBatches,
        startedAt,
        finishedAt,
        durationMs
      })
    }
    
    // Real run - process in chunks
    let totalInserted = 0
    let totalUpdated = 0
    let totalSkipped = 0
    let firstError: string | null = null
    
    for (let i = 0; i < estimatedBatches; i++) {
      const batchStartTime = Date.now()
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, zipArray.length)
      const chunk = zipArray.slice(start, end)
      
      try {
        console.log(`[ZIPSEED] Processing batch ${i + 1}/${estimatedBatches}, count=${chunk.length}`)
        
        // Upsert the chunk (direct table access for writes)
        const { data, error } = await supabase
          .from('lootaura_v2.zipcodes')
          .upsert(chunk, { 
            onConflict: 'zip',
            ignoreDuplicates: false 
          })
          .select('zip')
        
        if (error) {
          throw new Error(`Batch ${i + 1} failed: ${error.message}`)
        }
        
        // Count results (this is approximate since upsert doesn't return detailed counts)
        const inserted = chunk.length // We'll assume all were processed
        totalInserted += inserted
        
        const batchTime = Date.now() - batchStartTime
        console.log(`[ZIPSEED] batch ${i + 1}/${estimatedBatches} count=${chunk.length} time=${batchTime}ms`)
        
      } catch (error: any) {
        const errorMsg = `Batch ${i + 1} failed: ${error.message}`
        console.error(`[ZIPSEED] ${errorMsg}`)
        
        if (!firstError) {
          firstError = errorMsg
        }
        
        // Stop processing on first error
        break
      }
    }
    
    const finishedAt = new Date().toISOString()
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
    
    if (firstError) {
      console.log(`[ZIPSEED] Failed after ${durationMs}ms: ${firstError}`)
      return NextResponse.json({ 
        ok: false, 
        error: firstError,
        startedAt,
        finishedAt,
        durationMs
      }, { status: 500 })
    }
    
    console.log(`[ZIPSEED] Completed in ${durationMs}ms: inserted=${totalInserted}, updated=${totalUpdated}, skipped=${totalSkipped}`)
    
    return NextResponse.json({
      ok: true,
      dryRun: false,
      totalFound,
      chunkSize,
      estimatedBatches,
      inserted: totalInserted,
      updated: totalUpdated,
      skipped: totalSkipped,
      startedAt,
      finishedAt,
      durationMs
    })
    
  } catch (error: any) {
    console.error('[ZIPSEED] Fatal error:', error.message)
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 })
  }
}
