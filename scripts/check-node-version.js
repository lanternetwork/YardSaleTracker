#!/usr/bin/env node

/**
 * Node.js Version Check Script
 * Ensures the correct Node.js version is being used
 */

const fs = require('fs');
const path = require('path');

// Read .nvmrc file
const nvmrcPath = path.join(__dirname, '..', '.nvmrc');
const requiredVersion = fs.readFileSync(nvmrcPath, 'utf8').trim();

// Get current Node.js version
const currentVersion = process.version;

// Parse versions
const parseVersion = (version) => {
  const match = version.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3])
  };
};

const required = parseVersion(requiredVersion);
const current = parseVersion(currentVersion);

if (!required || !current) {
  console.error('❌ Unable to parse version numbers');
  process.exit(1);
}

// Check if current version meets requirements
const isVersionCompatible = () => {
  if (current.major > required.major) return true;
  if (current.major < required.major) return false;
  if (current.minor > required.minor) return true;
  if (current.minor < required.minor) return false;
  return current.patch >= required.patch;
};

if (!isVersionCompatible()) {
  console.error(`❌ Node.js version mismatch!`);
  console.error(`   Required: ${requiredVersion}`);
  console.error(`   Current:  ${currentVersion}`);
  console.error(`   Please use nvm to switch to the correct version:`);
  console.error(`   nvm install ${requiredVersion}`);
  console.error(`   nvm use ${requiredVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version check passed`);
console.log(`   Required: ${requiredVersion}`);
console.log(`   Current:  ${currentVersion}`);
