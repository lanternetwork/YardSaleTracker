import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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

  try {
    const supabase = createSupabaseServerClient()
    
    console.log('[ZIPSEED] Starting ZIP codes ingestion...')
    
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
    console.log(`[ZIPSEED] Processing ${zipArray.length} unique 5-digit ZIP codes`)
    
    // Process in chunks
    const CHUNK_SIZE = 500
    const totalChunks = Math.ceil(zipArray.length / CHUNK_SIZE)
    let totalInserted = 0
    let totalUpdated = 0
    let totalSkipped = 0
    let firstError: string | null = null
    
    for (let i = 0; i < totalChunks; i++) {
      const startTime = Date.now()
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, zipArray.length)
      const chunk = zipArray.slice(start, end)
      
      try {
        console.log(`[ZIPSEED] Processing batch ${i + 1}/${totalChunks}, count=${chunk.length}`)
        
        // Upsert the chunk
        const { data, error } = await supabase
          .from('zipcodes')
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
        
        const batchTime = Date.now() - startTime
        console.log(`[ZIPSEED] batch ${i + 1}/${totalChunks} count=${chunk.length} time=${batchTime}ms`)
        
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
    
    if (firstError) {
      return NextResponse.json({ 
        ok: false, 
        error: firstError 
      }, { status: 500 })
    }
    
    console.log(`[ZIPSEED] Completed: inserted=${totalInserted}, updated=${totalUpdated}, skipped=${totalSkipped}`)
    
    return NextResponse.json({
      ok: true,
      total: zipArray.length,
      inserted: totalInserted,
      updated: totalUpdated,
      skipped: totalSkipped
    })
    
  } catch (error: any) {
    console.error('[ZIPSEED] Fatal error:', error.message)
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 })
  }
}
