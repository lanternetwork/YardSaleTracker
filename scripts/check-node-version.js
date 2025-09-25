#!/usr/bin/env node

const requiredVersion = '20.0.0'
const currentVersion = process.version.slice(1) // Remove 'v' prefix
const isDevelopment = process.env.NODE_ENV !== 'production' && process.env.CI !== 'true'

function compareVersions(version1, version2) {
  const v1parts = version1.split('.').map(Number)
  const v2parts = version2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0
    const v2part = v2parts[i] || 0
    
    if (v1part > v2part) return 1
    if (v1part < v2part) return -1
  }
  return 0
}

if (compareVersions(currentVersion, requiredVersion) < 0) {
  if (isDevelopment) {
    console.warn(`⚠️  Node.js version ${currentVersion} is deprecated for Supabase.`)
    console.warn(`   Recommended: Node.js ${requiredVersion} or higher`)
    console.warn(`   Current:     Node.js ${currentVersion}`)
    console.warn(`   You may see deprecation warnings during tests.`)
    console.warn(`   To fix: Upgrade to Node.js 20+ or use nvm to switch versions.`)
    console.warn(`   Continue with tests...`)
    // Allow development to continue with warnings
  } else {
    console.error(`❌ Node.js version ${currentVersion} is not supported.`)
    console.error(`   Required: Node.js ${requiredVersion} or higher`)
    console.error(`   Current:  Node.js ${currentVersion}`)
    console.error(`   Please upgrade to Node.js 20 or later.`)
    process.exit(1)
  }
} else {
  console.log(`✅ Node.js version ${currentVersion} is supported.`)
}
