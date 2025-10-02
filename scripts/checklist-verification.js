// Quick verification script for checklist items
const https = require('https');

const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Checklist-Verification/1.0'
      }
    };

    const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verifyChecklist() {
  console.log('🔍 Verifying Checklist Items...\n');

  try {
    // 1. Test ZIP geocoding with leading zeros
    console.log('1. Testing ZIP geocoding with leading zeros...');
    const zipTest = await makeRequest('/api/geocoding/zip?zip=02115');
    if (zipTest.status === 200 && zipTest.data.source === 'local') {
      console.log('✅ ZIP geocoding works with leading zeros');
    } else {
      console.log('❌ ZIP geocoding failed or not using local source');
    }

    // 2. Test sales API requires location
    console.log('\n2. Testing sales API location requirement...');
    const salesNoLocation = await makeRequest('/api/sales');
    if (salesNoLocation.status === 400) {
      console.log('✅ Sales API correctly requires location');
    } else {
      console.log('❌ Sales API should require location but returned:', salesNoLocation.status);
    }

    // 3. Test sales API with location
    console.log('\n3. Testing sales API with location...');
    const salesWithLocation = await makeRequest('/api/sales?lat=38.2527&lng=-85.7585&distanceKm=25');
    if (salesWithLocation.status === 200 && salesWithLocation.data.ok) {
      console.log('✅ Sales API works with location');
      console.log(`   Found ${salesWithLocation.data.count} sales`);
      if (salesWithLocation.data.degraded) {
        console.log('   ⚠️  Degraded mode detected (PostGIS unavailable)');
      }
    } else {
      console.log('❌ Sales API failed with location');
    }

    // 4. Test diagnostics endpoint
    console.log('\n4. Testing diagnostics endpoint...');
    const diagnostics = await makeRequest('/api/health/search?lat=38.2527&lng=-85.7585&distanceKm=25&dateRange=weekend&cats=tools&q=garage');
    if (diagnostics.status === 200 && diagnostics.data.ok) {
      console.log('✅ Diagnostics endpoint works');
      console.log(`   Counts: total=${diagnostics.data.counts.total}, afterDistance=${diagnostics.data.counts.afterDistance}`);
      if (diagnostics.data.degraded) {
        console.log('   ⚠️  Degraded mode detected');
      }
    } else {
      console.log('❌ Diagnostics endpoint failed');
    }

    console.log('\n🎯 Checklist verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyChecklist();
