#!/usr/bin/env tsx

/**
 * Smoke test script for Craigslist scraper
 * This script tests the live scraper without inserting into database
 * 
 * Usage: npm run smoke:scrape
 * 
 * WARNING: This makes real requests to Craigslist. Use sparingly.
 */

import { parseCraigslistList } from '../lib/scraper/parseCraigslist'

interface ScrapeResult {
  success: boolean
  results: any[]
  error?: string
  duration: number
}

async function smokeTestScraper(): Promise<ScrapeResult> {
  const startTime = Date.now()
  
  try {
    console.log('🔍 Starting Craigslist scraper smoke test...')
    console.log('⚠️  WARNING: This makes real requests to Craigslist')
    
    // Test parameters
    const city = 'sfbay'
    const query = 'garage sale'
    const limit = 3
    
    console.log(`📍 City: ${city}`)
    console.log(`🔎 Query: ${query}`)
    console.log(`📊 Limit: ${limit}`)
    
    // Make request to our API
    const response = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'YardSaleTracker-SmokeTest/1.0'
      },
      body: JSON.stringify({ city, query, limit })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`API Error ${response.status}: ${errorData.error || response.statusText}`)
    }
    
    const data = await response.json()
    const duration = Date.now() - startTime
    
    console.log(`✅ OK (${data.results?.length || 0} results) in ${duration}ms`)
    
    // Log first 3 results
    if (data.results && data.results.length > 0) {
      console.log('\n📋 Sample results:')
      data.results.slice(0, 3).forEach((item: any, index: number) => {
        console.log(`  ${index + 1}. ${item.title}`)
        console.log(`     📅 ${item.start_at || 'No date'}`)
        console.log(`     💰 ${item.price_min ? `$${item.price_min}` : 'No price'}`)
        console.log(`     🔗 ${item.url || 'No URL'}`)
        console.log('')
      })
    }
    
    return {
      success: true,
      results: data.results || [],
      duration
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error(`❌ SCRAPE ERROR: ${errorMessage}`)
    console.error(`⏱️  Duration: ${duration}ms`)
    
    return {
      success: false,
      results: [],
      error: errorMessage,
      duration
    }
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  smokeTestScraper()
    .then(result => {
      if (result.success) {
        console.log(`\n🎉 Smoke test completed successfully!`)
        process.exit(0)
      } else {
        console.log(`\n💥 Smoke test failed!`)
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error)
      process.exit(1)
    })
}

export { smokeTestScraper }
