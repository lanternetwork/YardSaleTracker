import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('Force seeding with admin client...')
    
    // Get next Saturday
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilSaturday = (6 - dayOfWeek) % 7 || 7
    const nextSaturday = new Date(today)
    nextSaturday.setDate(today.getDate() + daysUntilSaturday)
    const dateStr = nextSaturday.toISOString().split('T')[0]

    // Simple test data - minimal fields only
    const testSales = [
      {
        title: 'Test Sale 1',
        description: 'Test description',
        address: 'Louisville, KY',
        lat: 38.2527,
        lng: -85.7585,
        start_at: dateStr + 'T08:00:00Z',
        end_at: dateStr + 'T14:00:00Z',
        status: 'active',
        source: 'test',
        tags: ['test'],
        photos: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: 'Test Sale 2', 
        description: 'Test description',
        address: 'Oakland, CA',
        lat: 37.8044,
        lng: -122.2712,
        start_at: dateStr + 'T08:00:00Z',
        end_at: dateStr + 'T14:00:00Z',
        status: 'active',
        source: 'test',
        tags: ['test'],
        photos: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: 'Test Sale 3',
        description: 'Test description', 
        address: 'San Francisco, CA',
        lat: 37.7749,
        lng: -122.4194,
        start_at: dateStr + 'T09:00:00Z',
        end_at: dateStr + 'T15:00:00Z',
        status: 'active',
        source: 'test',
        tags: ['test'],
        photos: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    let inserted = 0
    const errors: string[] = []

    for (const sale of testSales) {
      try {
        console.log('Inserting sale:', sale.title)
        const { data, error } = await adminSupabase
          .from('yard_sales')
          .insert(sale)
          .select('id')

        if (error) {
          console.error('Insert error:', error)
          errors.push(`${sale.title}: ${error.message}`)
        } else if (data && data.length > 0) {
          inserted++
          console.log('Inserted:', data[0].id)
        }
      } catch (err) {
        console.error('Exception inserting sale:', err)
        errors.push(`${sale.title}: ${err}`)
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      errors,
      message: `Force seeded ${inserted} sales. Errors: ${errors.length}`
    })

  } catch (error) {
    console.error('Force seed error:', error)
    return NextResponse.json(
      { error: 'Force seed failed', details: error },
      { status: 500 }
    )
  }
}
