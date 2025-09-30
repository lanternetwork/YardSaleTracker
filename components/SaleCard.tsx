import Link from 'next/link'
import FavoriteButton from './FavoriteButton'
import OptimizedImage from './OptimizedImage'
import { Sale } from '@/lib/types'

export default function SaleCard({ sale }: { sale: Sale }) {
  const firstPhoto = sale.photos?.[0]
  
  return (
    <div className="rounded-xl border p-4 bg-white flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between">
        <h3 className="text-xl font-semibold line-clamp-1">{sale.title}</h3>
        <FavoriteButton saleId={sale.id} initial={false} />
      </div>
      
      {firstPhoto && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <OptimizedImage
            src={firstPhoto}
            alt={sale.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
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
        className="text-amber-600 font-medium hover:text-amber-700" 
        href={`/sale/${sale.id}`}
      >
        View Details →
      </Link>
    </div>
  )
}
