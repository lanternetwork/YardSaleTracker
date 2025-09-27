import "./globals.css"
import { Metadata } from 'next'
import { Providers } from './providers'
import WebVitals from '@/components/WebVitals'
import { Header } from './Header'
import { PWAComponents } from './PWAComponents'
import { createHomepageStructuredData, createOrganizationStructuredData } from '@/lib/metadata'
import { APP_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from '@/lib/config/branding'

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: 'yard sale, garage sale, estate sale, local sales, treasure hunting',
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b3d2e" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(createHomepageStructuredData()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(createOrganizationStructuredData()) }}
        />
        <Providers>
          <Header />
          <WebVitals />
          {children}
          <PWAComponents />
        </Providers>
      </body>
    </html>
  )
}
