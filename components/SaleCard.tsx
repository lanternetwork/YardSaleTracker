import Link from 'next/link'
import FavoriteButton from './FavoriteButton'
import { Sale } from '@/lib/types'

export default function SaleCard({ sale }: { sale: Sale }) {

  return (
    <div className="rounded-xl border p-4 bg-white flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow" data-testid="sale-card">
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-lg sm:text-xl font-semibold line-clamp-1 flex-1">{sale.title}</h3>
        <FavoriteButton saleId={sale.id} initial={false} />
      </div>
      
      {/* Image preview removed: photos are not part of the Sale schema */}
      
      <p className="text-sm text-neutral-600 line-clamp-2">{sale.description}</p>
      <div className="text-sm text-neutral-700">
        {sale.address && <div>{sale.address}</div>}
        {sale.city && sale.state && <div>{sale.city}, {sale.state}</div>}
      </div>
      {sale.date_start && (
        <div className="text-sm text-neutral-600">
          {new Date(`${sale.date_start}T${sale.time_start}`).toLocaleString()}
        </div>
      )}
      {sale.price && (
        <div className="text-sm font-medium text-amber-600">
          ${sale.price}
        </div>
      )}
      <Link 
        className="text-amber-600 font-medium hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded min-h-[44px] flex items-center justify-center" 
        href={`/sale/${sale.id}`}
        aria-label={`View details for ${sale.title}`}
      >
        View Details →
      </Link>
    </div>
  )
}
