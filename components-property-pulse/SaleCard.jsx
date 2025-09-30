import Image from 'next/image';
import Link from 'next/link';
import {
  FaTag,
  FaCalendarAlt,
  FaMoneyBill,
  FaMapMarker,
  FaClock,
} from 'react-icons/fa';

const SaleCard = ({ sale }) => {
  const getPriceDisplay = () => {
    if (sale.price) {
      return `$${sale.price.toLocaleString()}`;
    }
    return 'Free';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className='rounded-xl shadow-md relative'>
      <Image
        src={sale.images?.[0] || '/images/placeholder-sale.jpg'}
        alt={sale.title}
        height={0}
        width={0}
        sizes='100vw'
        className='w-full h-auto rounded-t-xl'
        priority={true}
      />
      <div className='p-4'>
        <div className='text-left md:text-center lg:text-left mb-6'>
          <div className='text-gray-600'>{sale.category || 'Yard Sale'}</div>
          <h3 className='text-xl font-bold'>{sale.title}</h3>
        </div>
        <h3 className='absolute top-[10px] right-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right'>
          {getPriceDisplay()}
        </h3>

        <div className='flex justify-center gap-4 text-gray-500 mb-4'>
          {sale.tags && sale.tags.length > 0 && (
            <p>
              <FaTag className='md:hidden lg:inline mr-2' /> {sale.tags.length}
              <span className='md:hidden lg:inline'> Tags</span>
            </p>
          )}
          <p>
            <FaCalendarAlt className='md:hidden lg:inline mr-2' /> {formatDate(sale.date_start)}
          </p>
          <p>
            <FaClock className='md:hidden lg:inline mr-2' /> {formatTime(sale.time_start)}
          </p>
        </div>

        <div className='flex justify-center gap-4 text-green-900 text-sm mb-4'>
          <p>
            <FaMoneyBill className='md:hidden lg:inline mr-2' /> {sale.date_start}
          </p>
          {sale.date_end && (
            <p>
              <FaMoneyBill className='md:hidden lg:inline mr-2' /> {sale.date_end}
            </p>
          )}
        </div>

        <div className='border border-gray-100 mb-5'></div>

        <div className='flex flex-col lg:flex-row justify-between mb-4'>
          <div className='flex align-middle gap-2 mb-4 lg:mb-0'>
            <FaMapMarker className='text-orange-700 mt-1' />
            <span className='text-orange-700'>
              {' '}
              {sale.city}, {sale.state}
            </span>
          </div>
          <Link
            href={`/sales/${sale._id}`}
            className='h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm'
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};
export default SaleCard;
