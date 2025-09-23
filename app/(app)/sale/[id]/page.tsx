import { createSupabaseServer } from '@/lib/supabase/server'
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
  // Check if we're in build mode - if so, return basic metadata
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      title: 'Yard Sale Details',
      description: 'View details of this yard sale.'
    }
  }

  const sb = createSupabaseServer()
  
  const { data: sale } = await sb
    .from('yard_sales')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!sale) {
    return {
      title: 'Sale Not Found',
      description: 'The requested yard sale could not be found.'
    }
  }

  return createSaleMetadata(sale)
}

export default async function SaleDetail({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Check if we're in build mode - if so, return a simple component
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Yard Sale Details</h1>
        <p>Sale details will be loaded at runtime.</p>
      </div>
    )
  }

  const sb = createSupabaseServer()
  
  const { data: sale, error } = await sb
    .from('yard_sales')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !sale) {
    notFound()
  }

  return (
    <>
      <StructuredData sale={sale} type="Event" />
      <SaleDetailClient sale={sale} />
    </>
  )
}
