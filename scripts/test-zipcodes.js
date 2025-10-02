#!/usr/bin/env node

/**
 * Test script for ZIP codes functionality
 * Usage: node scripts/test-zipcodes.js
 */

const { createClient } = require('@supabase/supabase-js')

async function testZipcodes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔍 Testing ZIP codes table...\n')
  
  // 1. Check table count
  console.log('1. Checking table count...')
  try {
    const { count, error } = await supabase
      .from('lootaura_v2.zipcodes')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Error checking count:', error.message)
      return
    }
    
    console.log(`✅ Table count: ${count}`)
    if (count < 30000) {
      console.log('⚠️  Warning: Expected > 30,000 ZIP codes')
    }
  } catch (err) {
    console.error('❌ Fatal error checking count:', err.message)
    return
  }
  
  // 2. Test specific ZIP codes
  const testZips = ['40204', '78723', '97211', '98107', '85018', '92104', '11103', '02115', '00501']
  
  console.log('\n2. Testing specific ZIP codes...')
  for (const zip of testZips) {
    try {
      const { data, error } = await supabase
        .from('lootaura_v2.zipcodes')
        .select('zip, lat, lng, city, state')
        .eq('zip', zip)
        .single()
      
      if (error) {
        console.log(`❌ ${zip}: Not found (${error.message})`)
      } else {
        console.log(`✅ ${zip}: ${data.city}, ${data.state} (${data.lat}, ${data.lng})`)
      }
    } catch (err) {
      console.log(`❌ ${zip}: Error - ${err.message}`)
    }
  }
  
  // 3. Test normalization edge cases
  console.log('\n3. Testing normalization edge cases...')
  const edgeCases = [
    { input: '2115', expected: '02115' },
    { input: '501', expected: '00501' },
    { input: '123456789', expected: '56789' },
    { input: 'abc123def', expected: '123' },
    { input: '123-45', expected: '12345' }
  ]
  
  for (const test of edgeCases) {
    const normalized = normalizeZip(test.input)
    const passed = normalized === test.expected
    console.log(`${passed ? '✅' : '❌'} "${test.input}" → "${normalized}" (expected: "${test.expected}")`)
  }
  
  console.log('\n🎉 ZIP codes test completed!')
}

function normalizeZip(rawZip) {
  if (!rawZip) return null
  
  // Strip non-digits
  const digits = rawZip.replace(/\D/g, '')
  
  // If length > 5, take last 5
  const lastFive = digits.length > 5 ? digits.slice(-5) : digits
  
  // Left-pad with '0' to length 5
  const normalized = lastFive.padStart(5, '0')
  
  // Validate final against /^\d{5}$/
  if (!/^\d{5}$/.test(normalized)) {
    return null
  }
  
  return normalized
}

if (require.main === module) {
  testZipcodes().catch(console.error)
}

module.exports = { testZipcodes, normalizeZip }
