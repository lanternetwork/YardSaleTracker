import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { allowPublicAdmin } from '@/lib/server/adminAccess'

export const runtime = 'nodejs'

// Helper function to get next Saturday
function getNextSaturday(): Date {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 6 = Saturday
  const daysUntilSaturday = (6 - dayOfWeek) % 7 || 7 // If today is Saturday, get next Saturday
  const nextSaturday = new Date(today)
  nextSaturday.setDate(today.getDate() + daysUntilSaturday)
  return nextSaturday
}

export async function POST(request: NextRequest) {
  try {
    // Check for public admin mode first
    if (allowPublicAdmin()) {
      // In public admin mode, use a default user ID for seeding
      const defaultUserId = '00000000-0000-0000-0000-000000000000'
      console.log('Public admin mode enabled - allowing seed operation')
      
      // Continue with seeding using default user ID
      const nextSaturday = getNextSaturday()
      const dateStr = nextSaturday.toISOString().split('T')[0] // YYYY-MM-DD format

      // Seed data for two test sales
      const seedSales = [
        {
          title: 'Community Yard Sale',
          description: 'Join us for a community-wide yard sale with multiple families participating. Great deals on furniture, electronics, clothing, and more!',
          address: 'Louisville, KY',
          city: 'Louisville',
          state: 'KY',
        lat: 38.2527,
        lng: -85.7585,
        start_at: dateStr + 'T08:00:00Z',
        end_at: dateStr + 'T14:00:00Z',
        tags: ['community', 'furniture', 'electronics'],
        price_min: 1,
        price_max: 100,
        photos: [],
        contact: 'Call for details',
        status: 'active',
        source: 'seed',
        owner_id: defaultUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        },
        {
          title: 'Multi-Family Yard Sale (Saturday)',
          description: 'Three families combining their yard sale items! Furniture, toys, books, kitchen items, and much more. Everything must go!',
          address: 'Oakland, CA',
          city: 'Oakland',
          state: 'CA',
        lat: 37.8044,
        lng: -122.2712,
        start_at: dateStr + 'T08:00:00Z',
        end_at: dateStr + 'T14:00:00Z',
        tags: ['multi-family', 'toys', 'books', 'kitchen'],
        price_min: 2,
        price_max: 50,
        photos: [],
        contact: 'Text for address',
        status: 'active',
        source: 'seed',
        owner_id: defaultUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        }
      ]

      let inserted = 0
      let updated = 0
      const rowIds: string[] = []

      for (const sale of seedSales) {
        const { data, error } = await adminSupabase
          .from('yard_sales')
          .upsert(sale, { 
            onConflict: 'title,address',
            ignoreDuplicates: false 
          })
          .select('id')

        if (error) {
          console.error('Error upserting sale:', error)
          continue
        }

        if (data && data.length > 0) {
          rowIds.push(data[0].id)
          // Check if this was an insert or update by checking if the sale existed before
          const { data: existing } = await adminSupabase
            .from('yard_sales')
            .select('id')
            .eq('title', sale.title)
            .eq('address', sale.address)
            .single()

          if (existing) {
            updated++
          } else {
            inserted++
          }
        }
      }

      return NextResponse.json({
        success: true,
        inserted,
        updated,
        rowIds,
        message: `Seeded ${inserted} new sales and updated ${updated} existing sales (public admin mode)`
      })
    }

    // Regular admin authentication check
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, we'll use a simple admin check - in production this should be more robust
    const token = authHeader.substring(7)
    
    // Get user from Supabase using the token
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you may need to adjust this based on your admin logic)
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const nextSaturday = getNextSaturday()
    const dateStr = nextSaturday.toISOString().split('T')[0] // YYYY-MM-DD format

    // Seed data for two test sales
    const seedSales = [
      {
        title: 'Community Yard Sale',
        description: 'Join us for a community-wide yard sale with multiple families participating. Great deals on furniture, electronics, clothing, and more!',
        address: 'Louisville, KY',
        city: 'Louisville',
        state: 'KY',
        lat: 38.2527,
        lng: -85.7585,
        start_at: dateStr + 'T08:00:00Z',
        end_at: dateStr + 'T14:00:00Z',
        tags: ['community', 'furniture', 'electronics'],
        price_min: 1,
        price_max: 100,
        photos: [],
        contact: 'Call for details',
        status: 'active',
        source: 'seed',
        owner_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: 'Multi-Family Yard Sale (Saturday)',
        description: 'Three families combining their yard sale items! Furniture, toys, books, kitchen items, and much more. Everything must go!',
        address: 'Oakland, CA',
        city: 'Oakland',
        state: 'CA',
        lat: 37.8044,
        lng: -122.2712,
        start_at: dateStr + 'T08:00:00Z',
        end_at: dateStr + 'T14:00:00Z',
        tags: ['multi-family', 'toys', 'books', 'kitchen'],
        price_min: 2,
        price_max: 50,
        photos: [],
        contact: 'Text for address',
        status: 'active',
        source: 'seed',
        owner_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    let inserted = 0
    let updated = 0
    const rowIds: string[] = []

    for (const sale of seedSales) {
      const { data, error } = await adminSupabase
        .from('sales')
        .upsert(sale, { 
          onConflict: 'source,source_id',
          ignoreDuplicates: false 
        })
        .select('id')

      if (error) {
        console.error('Error upserting sale:', error)
        continue
      }

      if (data && data.length > 0) {
        rowIds.push(data[0].id)
        // Check if this was an insert or update by checking if the sale existed before
        const { data: existing } = await adminSupabase
          .from('sales')
          .select('id')
          .eq('source', sale.source)
          .eq('source_id', sale.source_id)
          .single()

        if (existing) {
          updated++
        } else {
          inserted++
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      rowIds,
      message: `Seeded ${inserted} new sales and updated ${updated} existing sales`
    })

  } catch (error) {
    console.error('Seed endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
