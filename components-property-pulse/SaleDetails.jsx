import {
  FaTag,
  FaCalendarAlt,
  FaClock,
  FaTimes,
  FaCheck,
  FaMapMarker,
  FaMoneyBill,
} from 'react-icons/fa';
import SaleMap from '@/components/SaleMap';

const SaleDetails = ({ sale }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
    <main>
      <div className='bg-white p-6 rounded-lg shadow-md text-center md:text-left'>
        <div className='text-gray-500 mb-4'>{sale.category || 'Yard Sale'}</div>
        <h1 className='text-3xl font-bold mb-4'>{sale.title}</h1>
        <div className='text-gray-500 mb-4 flex align-middle justify-center md:justify-start'>
          <FaMapMarker className='text-orange-700 mt-1 mr-1' />
          <p className='text-orange-700'>
            {sale.address}, {sale.city} {sale.state}
          </p>
        </div>

        <h3 className='text-lg font-bold my-6 bg-gray-800 text-white p-2'>
          Sale Information
        </h3>
        <div className='flex flex-col md:flex-row justify-around'>
          <div className='flex items-center justify-center mb-4 border-b border-gray-200 md:border-b-0 pb-4 md:pb-0'>
            <div className='text-gray-500 mr-2 font-bold'>Start Date</div>
            <div className='text-2xl font-bold text-blue-500'>
              {formatDate(sale.date_start)}
            </div>
          </div>
          <div className='flex items-center justify-center mb-4 border-b border-gray-200 md:border-b-0 pb-4 md:pb-0'>
            <div className='text-gray-500 mr-2 font-bold'>Start Time</div>
            <div className='text-2xl font-bold text-blue-500'>
              {formatTime(sale.time_start)}
            </div>
          </div>
          <div className='flex items-center justify-center mb-4 pb-4 md:pb-0'>
            <div className='text-gray-500 mr-2 font-bold'>Price</div>
            <div className='text-2xl font-bold text-blue-500'>
              {sale.price ? `$${sale.price.toLocaleString()}` : 'Free'}
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white p-6 rounded-lg shadow-md mt-6'>
        <h3 className='text-lg font-bold mb-6'>Description & Details</h3>
        <div className='flex justify-center gap-4 text-blue-500 mb-4 text-xl space-x-9'>
          {sale.tags && sale.tags.length > 0 && (
            <p>
              <FaTag className='inline-block mr-2' /> {sale.tags.length}{' '}
              <span className='hidden sm:inline'>Tags</span>
            </p>
          )}
          <p>
            <FaCalendarAlt className='inline-block mr-2' /> {formatDate(sale.date_start)}
          </p>
          <p>
            <FaClock className='inline-block mr-2' /> {formatTime(sale.time_start)}
          </p>
        </div>
        <p className='text-gray-500 mb-4'>{sale.description}</p>
      </div>

      {sale.tags && sale.tags.length > 0 && (
        <div className='bg-white p-6 rounded-lg shadow-md mt-6'>
          <h3 className='text-lg font-bold mb-6'>Sale Categories</h3>
          <ul className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 list-none space-y-2'>
            {sale.tags.map((tag, index) => (
              <li key={index}>
                <FaCheck className='inline-block text-green-600 mr-2' /> {tag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='bg-white p-6 rounded-lg shadow-md mt-6'>
        <SaleMap sale={sale} />
      </div>
    </main>
  );
};

export default SaleDetails;
