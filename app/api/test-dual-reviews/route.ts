import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Create test users if they don't exist
    const testUsers = [
      {
        id: 'test-user-1-1111-1111-1111-111111111111',
        email: 'user1@test.com'
      },
      {
        id: 'test-user-2-2222-2222-2222-222222222222', 
        email: 'user2@test.com'
      }
    ]

    for (const user of testUsers) {
      await supabase
        .from('auth.users')
        .upsert({
          id: user.id,
          email: user.email,
          encrypted_password: 'dummy_password',
          instance_id: '00000000-0000-0000-0000-000000000000',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    // Create profiles for test users
    await supabase
      .from('profiles_v2')
      .upsert([
        {
          id: testUsers[0].id,
          username: 'user1',
          full_name: 'Test User 1'
        },
        {
          id: testUsers[1].id,
          username: 'user2', 
          full_name: 'Test User 2'
        }
      ])

    // Same address for both sales
    const testAddress = {
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      lat: 38.235,
      lng: -85.708
    }

    // Create two sales at the same address by different users
    const sales = [
      {
        id: 'test-sale-1-1111-1111-1111-111111111111',
        owner_id: testUsers[0].id,
        title: 'User 1 Yard Sale',
        description: 'First user at same address',
        ...testAddress,
        date_start: '2025-10-11',
        time_start: '09:00:00',
        date_end: '2025-10-11',
        time_end: '15:00:00',
        status: 'published'
      },
      {
        id: 'test-sale-2-2222-2222-2222-222222222222',
        owner_id: testUsers[1].id,
        title: 'User 2 Yard Sale', 
        description: 'Second user at same address',
        ...testAddress,
        date_start: '2025-10-12',
        time_start: '10:00:00',
        date_end: '2025-10-12',
        time_end: '16:00:00',
        status: 'published'
      }
    ]

    // Insert sales (without address_key for now)
    const { data: insertedSales, error: salesError } = await supabase
      .from('sales_v2')
      .upsert(sales)
      .select('id, title, owner_id')

    if (salesError) {
      throw new Error(`Failed to create sales: ${salesError.message}`)
    }

    // Skip reviews creation for now (requires migration)
    console.log('Skipping reviews creation - migration not run yet')

    // Get the sales data
    const { data: salesWithKeys, error: keysError } = await supabase
      .from('sales_v2')
      .select('id, title, owner_id')
      .in('id', [sales[0].id, sales[1].id])

    if (keysError) {
      throw new Error(`Failed to fetch sales: ${keysError.message}`)
    }

    // For now, just show the sales without review keys (migration not run yet)
    const reviewCounts = []
    for (const sale of salesWithKeys || []) {
      reviewCounts.push({
        sale_id: sale.id,
        title: sale.title,
        address_key: 'Migration not run yet',
        review_key: 'Migration not run yet',
        review_count: 0
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Dual-link review system test data created successfully',
      sales: salesWithKeys,
      review_counts: reviewCounts,
      address: testAddress
    })

  } catch (error: any) {
    console.error('Test dual reviews error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 })
  }
}
