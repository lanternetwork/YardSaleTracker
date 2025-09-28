import Link from 'next/link'
import FavoriteButton from './FavoriteButton'
import OptimizedImage from './OptimizedImage'
import PrivacyCountdown from './PrivacyCountdown'
import { Sale } from '@/lib/types'
import { maskLocation } from '@/lib/privacy'

export default function SaleCard({ sale }: { sale: Sale }) {
  const firstPhoto = sale.photos?.[0]
  
  // Apply privacy masking if needed
  const maskedLocation = sale.lat && sale.lng ? maskLocation({
    lat: sale.lat,
    lng: sale.lng,
    address: sale.address || '',
    privacy_mode: sale.privacy_mode || 'exact',
    date_start: sale.date_start || sale.start_at || '',
    time_start: sale.time_start
  }) : null
  
  const displayAddress = maskedLocation ? maskedLocation.address : sale.address
  
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
            width={400}
            height={192}
            className="object-cover w-full h-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      <p className="text-sm text-neutral-600 line-clamp-2">{sale.description}</p>
      <div className="text-sm text-neutral-700">
        {displayAddress && <div>{displayAddress}</div>}
        {sale.city && sale.state && <div>{sale.city}, {sale.state}</div>}
      </div>
      
      {maskedLocation?.is_masked && maskedLocation.reveal_time && (
        <PrivacyCountdown revealTime={maskedLocation.reveal_time} />
      )}
      
      {sale.start_at && (
        <div className="text-sm text-neutral-600">
          {new Date(sale.start_at).toLocaleString()}
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
