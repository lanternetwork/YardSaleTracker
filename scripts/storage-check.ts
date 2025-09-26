#!/usr/bin/env tsx

/**
 * Storage Sanity Check Script
 * 
 * This script verifies that Supabase Storage is properly configured
 * and accessible with the current environment variables.
 */

import { adminSupabase } from '../lib/supabase/admin'

async function checkStorage() {
  console.log('🔍 Checking Supabase Storage configuration...\n')

  try {
    // Check if the sale-photos bucket exists
    const { data: buckets, error: bucketsError } = await adminSupabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError.message)
      return false
    }

    const salePhotosBucket = buckets.find((bucket: any) => bucket.name === 'sale-photos')
    
    if (!salePhotosBucket) {
      console.error('❌ sale-photos bucket not found')
      console.log('Available buckets:', buckets.map((b: any) => b.name))
      return false
    }

    console.log('✅ sale-photos bucket found')

    // Check bucket policies by trying to list files (this will fail if policies are wrong)
    const { data: files, error: filesError } = await adminSupabase.storage
      .from('sale-photos')
      .list('', { limit: 1 })

    if (filesError) {
      console.error('❌ Failed to list files in sale-photos bucket:', filesError.message)
      console.log('This might indicate incorrect RLS policies')
      return false
    }

    console.log('✅ Can list files in sale-photos bucket')
    console.log(`Found ${files.length} files (showing first 1)`)

    // Try to create a test file (this tests write permissions)
    const testFileName = `test-${Date.now()}.txt`
    const { error: uploadError } = await adminSupabase.storage
      .from('sale-photos')
      .upload(testFileName, 'test content', {
        contentType: 'text/plain'
      })

    if (uploadError) {
      console.error('❌ Failed to upload test file:', uploadError.message)
      return false
    }

    console.log('✅ Can upload files to sale-photos bucket')

    // Clean up test file
    const { error: deleteError } = await adminSupabase.storage
      .from('sale-photos')
      .remove([testFileName])

    if (deleteError) {
      console.warn('⚠️  Failed to clean up test file:', deleteError.message)
    } else {
      console.log('✅ Can delete files from sale-photos bucket')
    }

    // Test public URL generation
    const { data: publicUrlData } = adminSupabase.storage
      .from('sale-photos')
      .getPublicUrl('test-file.jpg')

    if (publicUrlData?.publicUrl) {
      console.log('✅ Public URL generation works')
      console.log('Example public URL:', publicUrlData.publicUrl)
    } else {
      console.warn('⚠️  Public URL generation might not be working')
    }

    console.log('\n🎉 Storage configuration looks good!')
    return true

  } catch (error) {
    console.error('❌ Storage check failed:', error)
    return false
  }
}

// Run the check
checkStorage()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Script error:', error)
    process.exit(1)
  })
