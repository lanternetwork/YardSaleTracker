import { MetadataRoute } from 'next'
import { createSupabaseServer } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseServer()
  
  // Get all active sales for dynamic URLs
  const { data: sales } = await supabase
    .from('yard_sales')
    .select('id, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1000) // Limit to prevent sitemap from being too large

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yardsalefinder.com'

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

  // Dynamic sale pages
  const salePages: MetadataRoute.Sitemap = (sales || []).map((sale) => ({
    url: `${baseUrl}/sale/${sale.id}`,
    lastModified: new Date(sale.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...salePages]
}
