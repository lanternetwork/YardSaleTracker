import { MetadataRoute } from 'next'
import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lootaura.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore?tab=map`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/explore?tab=add`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Try to get dynamic sale pages if Supabase is available
  let salePages: MetadataRoute.Sitemap = []
  
  try {
    // Check if we have the required environment variables
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createSupabaseServer()
      
      // Get all active sales for dynamic URLs
      const { data: sales } = await supabase
        .from('yard_sales')
        .select('id, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1000) // Limit to prevent sitemap from being too large

      salePages = (sales || []).map((sale) => ({
        url: `${baseUrl}/sale/${sale.id}`,
        lastModified: new Date(sale.updated_at),
        changeFrequency: 'weekly',
        priority: 0.6,
      }))
    }
  } catch (error) {
    // If Supabase connection fails, just return static pages
    console.warn('Sitemap: Could not fetch sales data, returning static pages only')
  }

  return [...staticPages, ...salePages]
}
