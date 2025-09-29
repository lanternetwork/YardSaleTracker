import { Sale } from '@/lib/types'

interface StructuredDataProps {
  sale: Sale
  type?: 'Event' | 'Product'
}

export default function StructuredData({ sale, type = 'Event' }: StructuredDataProps) {
  if (type === 'Event') {
    const eventData = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: sale.title,
      description: sale.description,
      startDate: sale.start_at,
      endDate: sale.end_at,
      location: {
        '@type': 'Place',
        name: sale.address,
        address: {
          '@type': 'PostalAddress',
          streetAddress: sale.address,
          addressLocality: sale.city,
          addressRegion: sale.state,
          postalCode: sale.zip,
          addressCountry: 'US'
        },
        geo: sale.lat && sale.lng ? {
          '@type': 'GeoCoordinates',
          latitude: sale.lat,
          longitude: sale.lng
        } : undefined
      },
      // (deprecated; yard sales do not have sale-level prices)
      organizer: {
        '@type': 'Organization',
        name: 'YardSaleFinder',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://lootaura.com'
      },
      eventStatus: sale.status === 'active' ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventCancelled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      image: sale.photos?.[0] ? [sale.photos[0]] : undefined,
      keywords: sale.tags?.join(', '),
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lootaura.com'}/sale/${sale.id}`
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventData) }}
      />
    )
  }

  if (type === 'Product') {
    const productData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: sale.title,
      description: sale.description,
      image: sale.photos || [],
      // (deprecated; yard sales do not have sale-level prices)
      category: 'Yard Sale Items',
      keywords: sale.tags?.join(', '),
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lootaura.com'}/sale/${sale.id}`
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
      />
    )
  }

  return null
}
