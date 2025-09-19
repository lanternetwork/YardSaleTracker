import SaleCard from './SaleCard'
import EmptyState from './EmptyState'
import { Sale } from '@/lib/types'

export default function SalesList({ sales }: { sales: Sale[] }) {
  if (!sales?.length) {
    return (
      <EmptyState 
        title="No Sales Found" 
        cta={
          <a 
            href="/explore?tab=add" 
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Post the first sale →
          </a>
        } 
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sales.map(sale => <SaleCard key={sale.id} sale={sale} />)}
    </div>
  )
}
