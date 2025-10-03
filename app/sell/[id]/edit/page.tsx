import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import SaleForm from '@/components/forms/SaleForm'
import { getSaleById } from '@/lib/data/sales'

interface EditSalePageProps {
  params: {
    id: string
  }
}

export default async function EditSalePage({ params }: EditSalePageProps) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?returnTo=/sell/' + params.id + '/edit')
  }

  // Get the sale data
  const sale = await getSaleById(params.id)
  
  if (!sale) {
    notFound()
  }

  // Check if user owns the sale
  if (sale.owner_id !== user.id) {
    redirect('/sales/' + params.id)
  }

  // Transform sale data to form format
  const initialData = {
    title: sale.title,
    description: sale.description,
    address: sale.address,
    city: sale.city,
    state: sale.state,
    zip_code: sale.zip_code,
    date_start: sale.date_start,
    time_start: sale.time_start,
    date_end: sale.date_end,
    time_end: sale.time_end,
    lat: sale.lat,
    lng: sale.lng,
    tags: sale.tags || [],
    price: sale.price,
    photos: sale.cover_image_url ? [sale.cover_image_url] : [],
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Sale</h1>
            <p className="text-gray-600">Update your yard sale listing</p>
          </div>
          
          <SaleForm 
            initialData={initialData}
            isEdit={true}
            saleId={params.id}
          />
        </div>
      </div>
    </div>
  )
}