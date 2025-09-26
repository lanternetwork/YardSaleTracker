import Link from 'next/link'
import FavoriteButton from './FavoriteButton'
import OptimizedImage from './OptimizedImage'
import { Sale } from '@/lib/types'

export default function SaleCard({ sale }: { sale: Sale }) {
  const firstPhoto = sale.photos?.[0]
  
  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-neutral-900 line-clamp-2 pr-2">{sale.title}</h3>
        <FavoriteButton saleId={sale.id} initial={false} />
      </div>
      
      {firstPhoto && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
          <OptimizedImage
            src={firstPhoto}
            alt={sale.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      {sale.description && (
        <p className="text-neutral-600 line-clamp-2 mb-4">{sale.description}</p>
      )}
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {sale.address && <span>{sale.address}</span>}
          {sale.city && sale.state && <span>{sale.city}, {sale.state}</span>}
        </div>
        
        {sale.start_at && (
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{new Date(sale.start_at).toLocaleDateString()}</span>
          </div>
        )}
        
        {sale.price_min && sale.price_max && (
          <div className="flex items-center gap-2 text-sm font-medium text-brand-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span>${sale.price_min} - ${sale.price_max}</span>
          </div>
        )}
      </div>
      
      <Link 
        className="btn-secondary w-full justify-center" 
        href={`/sale/${sale.id}`}
      >
        View Details
      </Link>
    </div>
  )
}
