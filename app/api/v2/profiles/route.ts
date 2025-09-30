import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, getTableName } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use schema-qualified table name
    const profilesTable = getTableName('profiles')
    
    const { data: profile, error } = await supabase
      .from(profilesTable)
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
    
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const body = await request.json()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use schema-qualified table name
    const profilesTable = getTableName('profiles')
    
    const { data: profile, error } = await supabase
      .from(profilesTable)
      .upsert({
        user_id: user.id,
        display_name: body.display_name,
        avatar_url: body.avatar_url,
        home_zip: body.home_zip,
        preferences: body.preferences || {}
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error upserting profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
