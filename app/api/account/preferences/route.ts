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

    const { default_privacy_mode } = await request.json()

    // Get current profile to merge preferences
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current profile:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch current preferences' }, { status: 500 })
    }

    // Merge preferences
    const currentPreferences = currentProfile?.preferences || {}
    const updatedPreferences = {
      ...currentPreferences,
      default_privacy_mode
    }

    // Upsert profile with merged preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        preferences: updatedPreferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error upserting profile preferences:', profileError)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json(profile.preferences)

  } catch (error) {
    console.error('Error in POST /api/account/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
