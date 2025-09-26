import { notFound } from 'next/navigation'
import { SaleDetailClient } from './SaleDetailClient'
import { createSaleMetadata } from '@/lib/metadata'
import StructuredData from '@/components/StructuredData'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Always return basic metadata during build
  return {
    title: 'Yard Sale Details',
    description: 'View details of this yard sale.'
  }
}

export default async function SaleDetail({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Return a simple component during build
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Yard Sale Details</h1>
      <p>Sale details will be loaded at runtime.</p>
    </div>
  )
}
