# Node.js Upgrade Guide

## Current Issue
The application now requires Node.js 20+ for Supabase compatibility, but your local environment is running Node.js 18.20.8.

## Why Upgrade is Needed
- **Supabase Deprecation**: Node.js 18 and below are deprecated for `@supabase/supabase-js`
- **Future Compatibility**: Ensures compatibility with upcoming Supabase versions
- **Performance**: Node.js 20 includes performance improvements
- **Security**: Latest LTS version with security updates

## Upgrade Options

### Option 1: Direct Installation (Recommended)
1. **Download Node.js 20 LTS** from [nodejs.org](https://nodejs.org/)
2. **Install the LTS version** (currently 20.18.0)
3. **Verify installation**:
   ```bash
   node --version
   # Should show v20.18.0 or higher
   ```

### Option 2: Using Node Version Manager (NVM)
If you have NVM installed:

```bash
# Install Node.js 20
nvm install 20.18.0

# Use Node.js 20
nvm use 20.18.0

# Set as default
nvm alias default 20.18.0

# Verify
node --version
```

### Option 3: Using n (Node Version Manager)
```bash
# Install n globally
npm install -g n

# Install Node.js 20
sudo n 20.18.0

# Verify
node --version
```

## After Upgrading

1. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Run tests to verify**:
   ```bash
   npm run test:e2e
   ```

3. **Check for warnings**:
   - Should see "✅ Node.js version X.X.X is supported"
   - No more Supabase deprecation warnings

## Troubleshooting

### If you see permission errors:
```bash
# On macOS/Linux
sudo npm install -g n

# On Windows, run PowerShell as Administrator
```

### If you have multiple Node.js versions:
```bash
# Check which version is active
which node
node --version

# Switch versions with nvm
nvm use 20.18.0
```

### If npm is not found after upgrade:
```bash
# Reinstall npm
curl -L https://www.npmjs.com/install.sh | sh
```

## Verification
After upgrading, run:
```bash
npm run test:e2e
```

You should see:
- ✅ Node.js version check passes
- No Supabase deprecation warnings
- Tests run successfully

## Fallback (Development Only)
If you cannot upgrade immediately, the application will show warnings but continue to work in development mode. However, this is not recommended for production.
