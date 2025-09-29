import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { display_name, avatar_url } = await request.json()

    // Upsert profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        display_name,
        avatar_url,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error upserting profile:', profileError)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Error in POST /api/account/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
