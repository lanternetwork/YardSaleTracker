import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { allowPublicAdmin } from '@/lib/server/adminAccess'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Check for public admin mode first
    if (allowPublicAdmin()) {
      console.log('Public admin mode enabled - allowing cleanup operation')
      
      // Delete all existing sales to start fresh
      const { error: deleteError } = await adminSupabase
        .from('yard_sales')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

      if (deleteError) {
        console.error('Error deleting sales:', deleteError)
        return NextResponse.json({ error: 'Failed to delete sales' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Database cleaned up successfully (public admin mode)'
      })
    }

    // Regular admin authentication check
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from Supabase using the token
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(authHeader.substring(7))
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Delete all existing sales to start fresh
    const { error: deleteError } = await adminSupabase
      .from('yard_sales')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (deleteError) {
      console.error('Error deleting sales:', deleteError)
      return NextResponse.json({ error: 'Failed to delete sales' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database cleaned up successfully'
    })

  } catch (error) {
    console.error('Cleanup endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
