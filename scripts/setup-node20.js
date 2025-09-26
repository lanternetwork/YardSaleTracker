#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Node.js 20 Setup Helper');
console.log('========================\n');

// Check current Node.js version
const currentVersion = process.version;
console.log(`Current Node.js version: ${currentVersion}`);

// Check if we're already on Node.js 20+
const majorVersion = parseInt(currentVersion.slice(1).split('.')[0]);
if (majorVersion >= 20) {
  console.log('✅ Already using Node.js 20+');
  process.exit(0);
}

console.log('❌ Node.js 20+ required for Supabase compatibility');
console.log('\n📋 Upgrade Options:');
console.log('1. Download from https://nodejs.org/ (Recommended)');
console.log('2. Use nvm: nvm install 20.18.0 && nvm use 20.18.0');
console.log('3. Use n: npm install -g n && sudo n 20.18.0');
console.log('\n📖 See docs/NODEJS_UPGRADE_GUIDE.md for detailed instructions');

// Check if nvm is available
try {
  execSync('nvm --version', { stdio: 'ignore' });
  console.log('\n🔧 NVM detected! Quick setup:');
  console.log('   nvm install 20.18.0');
  console.log('   nvm use 20.18.0');
  console.log('   nvm alias default 20.18.0');
} catch (e) {
  console.log('\n💡 Tip: Install nvm for easy Node.js version management');
  console.log('   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash');
}

console.log('\n🚀 After upgrading, run: npm run test:e2e');
