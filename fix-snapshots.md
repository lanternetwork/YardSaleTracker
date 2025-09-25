# Snapshot Fix Instructions

## Issue
The scraper tests have snapshot mismatches due to ID generation changes.

## Root Cause
- Changed ID generation from random to timestamp-based
- Snapshots were created with old format
- Need to update snapshots with new format

## Solution
Run these commands in CI environment:

```bash
# Update integration test snapshots
npm test -- --update-snapshots tests/integration/scraper.normalize.test.ts

# Update unit test snapshots  
npm test -- --update-snapshots tests/unit/scraper.parse.test.ts
```

## Alternative: Manual Fix
If snapshots can't be updated automatically, the tests should pass because:
1. Integration test redacts IDs to 'REDACTED_ID'
2. Unit test redacts IDs to 'REDACTED_ID'
3. Both tests use stable data that shouldn't change

## Expected Outcome
After running with --update-snapshots, all tests should pass with the new ID format.
