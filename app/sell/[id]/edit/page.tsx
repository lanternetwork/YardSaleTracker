import { notFound } from 'next/navigation'
import { getSaleById } from '@/lib/data'
import SellWizardClient from '../../new/SellWizardClient'

interface SellEditPageProps {
  params: {
    id: string
  }
}

export default async function SellEditPage({ params }: SellEditPageProps) {
  const sale = await getSaleById(params.id)

  if (!sale) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SellWizardClient 
        initialData={{
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
          price: sale.price,
          tags: sale.tags,
          status: sale.status
        }}
        isEdit={true}
        saleId={sale.id}
      />
    </div>
  )
}
