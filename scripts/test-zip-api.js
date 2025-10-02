#!/usr/bin/env node

/**
 * Test script for ZIP geocoding API endpoint
 * Usage: node scripts/test-zip-api.js [base-url]
 */

const baseUrl = process.argv[2] || 'http://localhost:3000'

async function testZipApi() {
  console.log(`🔍 Testing ZIP geocoding API at ${baseUrl}\n`)
  
  // Test cases with expected results
  const testCases = [
    { input: '40204', description: 'Louisville, KY' },
    { input: '78723', description: 'Austin, TX' },
    { input: '97211', description: 'Portland, OR' },
    { input: '98107', description: 'Seattle, WA' },
    { input: '85018', description: 'Phoenix, AZ' },
    { input: '92104', description: 'San Diego, CA' },
    { input: '11103', description: 'Queens, NY' },
    { input: '02115', description: 'Boston, MA (leading zero)' },
    { input: '00501', description: 'Holtsville, NY (leading zero)' },
    // Edge cases
    { input: '2115', description: 'Should normalize to 02115' },
    { input: '501', description: 'Should normalize to 00501' },
    { input: '123456789', description: 'Should take last 5 digits' },
    { input: 'abc123def', description: 'Should extract digits only' },
    { input: '123-45', description: 'Should handle dashes' },
    { input: 'invalid', description: 'Should reject invalid input' },
    { input: '', description: 'Should reject empty input' }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const testCase of testCases) {
    try {
      const url = `${baseUrl}/api/geocoding/zip?zip=${encodeURIComponent(testCase.input)}`
      console.log(`Testing: "${testCase.input}" (${testCase.description})`)
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.ok) {
        console.log(`  ✅ Found: ${data.city}, ${data.state} (${data.lat}, ${data.lng}) [${data.source}]`)
        passed++
      } else {
        console.log(`  ❌ Error: ${data.error}`)
        if (testCase.input === 'invalid' || testCase.input === '') {
          console.log(`  ✅ Expected failure for invalid input`)
          passed++
        } else {
          failed++
        }
      }
    } catch (error) {
      console.log(`  ❌ Network error: ${error.message}`)
      failed++
    }
    console.log('')
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed === 0) {
    console.log('🎉 All tests passed!')
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.')
  }
}

if (require.main === module) {
  testZipApi().catch(console.error)
}

module.exports = { testZipApi }
