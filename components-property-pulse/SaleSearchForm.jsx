'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SaleSearchForm = () => {
  const [location, setLocation] = useState('');
  const [saleType, setSaleType] = useState('All');

  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (location === '' && saleType === 'All') {
      router.push('/sales');
    } else {
      const query = `?location=${location}&saleType=${saleType}`;

      router.push(`/sales/search-results${query}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='mt-3 mx-auto max-w-2xl w-full flex flex-col md:flex-row items-center'
    >
      <div className='w-full md:w-3/5 md:pr-2 mb-4 md:mb-0'>
        <label htmlFor='location' className='sr-only'>
          Location
        </label>
        <input
          type='text'
          id='location'
          placeholder='Enter City, State, or ZIP Code'
          className='w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring focus:ring-blue-500'
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div className='w-full md:w-2/5 md:pl-2'>
        <label htmlFor='sale-type' className='sr-only'>
          Sale Type
        </label>
        <select
          id='sale-type'
          className='w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring focus:ring-blue-500'
          value={saleType}
          onChange={(e) => setSaleType(e.target.value)}
        >
          <option value='All'>All Sales</option>
          <option value='Yard Sale'>Yard Sale</option>
          <option value='Garage Sale'>Garage Sale</option>
          <option value='Estate Sale'>Estate Sale</option>
          <option value='Moving Sale'>Moving Sale</option>
          <option value='Flea Market'>Flea Market</option>
          <option value='Antique Sale'>Antique Sale</option>
          <option value='Other'>Other</option>
        </select>
      </div>
      <button
        type='submit'
        className='md:ml-4 mt-4 md:mt-0 w-full md:w-auto px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-500'
      >
        Search
      </button>
    </form>
  );
};

export default SaleSearchForm;
