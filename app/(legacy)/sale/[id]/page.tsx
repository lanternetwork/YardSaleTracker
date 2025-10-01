import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'
import { notFound } from 'next/navigation'
import { SaleDetailClient } from './SaleDetailClient'
import { createSaleMetadata } from '@/lib/metadata'
import StructuredData from '@/components/StructuredData'

export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}) {
  const sb = createSupabaseServerClient()
  
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
  const sb = createSupabaseServerClient()
  
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
