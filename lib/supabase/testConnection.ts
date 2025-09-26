import { createSupabaseBrowser } from './client'

export async function testSupabaseConnection() {
  const sb = createSupabaseBrowser()
  
  try {
    // Test basic connection with a simple query
    const { data, error } = await sb
      .from('yard_sales')
      .select('id')
      .limit(1)
    
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`)
    }
    
    return {
      success: true,
      message: 'Successfully connected to Supabase',
      data: data
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
      error: error
    }
  }
}

export async function testSupabaseRPC() {
  const sb = createSupabaseBrowser()
  
  try {
    // Test RPC function with minimal parameters
    const { data, error } = await sb.rpc('search_sales', {
      search_query: null,
      max_distance_km: null,
      user_lat: null,
      user_lng: null,
      date_from: null,
      date_to: null,
      price_min: null,
      price_max: null,
      tags_filter: null,
      limit_count: 1,
      offset_count: 0
    })
    
    if (error) {
      throw new Error(`RPC function failed: ${error.message}`)
    }
    
    return {
      success: true,
      message: 'RPC function is working',
      data: data
    }
  } catch (error: any) {
    return {
      success: false,
      message: `RPC test failed: ${error.message}`,
      error: error
    }
  }
}
