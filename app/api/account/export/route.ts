import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get user's sales
    const { data: sales } = await supabase
      .from('yard_sales')
      .select('id, title, description, date_start, date_end, time_start, time_end, address, lat, lng, privacy_mode, status, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    // Prepare export data
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      profile: profile || null,
      sales: sales || [],
      metadata: {
        total_sales: sales?.length || 0,
        export_version: '1.0'
      }
    }

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="lootaura-export.json"'
      }
    })

  } catch (error) {
    console.error('Error in GET /api/account/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
