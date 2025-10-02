'use client';
import addSale from '@/app/actions/addSale';

const SaleAddForm = () => {
  return (
    <form action={addSale}>
      <h2 className='text-3xl text-center font-semibold mb-6'>Add Sale</h2>

      <div className='mb-4'>
        <label htmlFor='category' className='block text-gray-700 font-bold mb-2'>
          Sale Category
        </label>
        <select
          id='category'
          name='category'
          className='border rounded w-full py-2 px-3'
          required
        >
          <option value='Yard Sale'>Yard Sale</option>
          <option value='Garage Sale'>Garage Sale</option>
          <option value='Estate Sale'>Estate Sale</option>
          <option value='Moving Sale'>Moving Sale</option>
          <option value='Flea Market'>Flea Market</option>
          <option value='Antique Sale'>Antique Sale</option>
          <option value='Other'>Other</option>
        </select>
      </div>
      <div className='mb-4'>
        <label className='block text-gray-700 font-bold mb-2'>
          Sale Title
        </label>
        <input
          type='text'
          id='title'
          name='title'
          className='border rounded w-full py-2 px-3 mb-2'
          placeholder='eg. Amazing Yard Sale - Everything Must Go!'
          required
        />
      </div>
      <div className='mb-4'>
        <label
          htmlFor='description'
          className='block text-gray-700 font-bold mb-2'
        >
          Description
        </label>
        <textarea
          id='description'
          name='description'
          className='border rounded w-full py-2 px-3'
          rows='4'
          placeholder='Describe your sale - what items you have, special deals, etc.'
        ></textarea>
      </div>

      <div className='mb-4 bg-blue-50 p-4'>
        <label className='block text-gray-700 font-bold mb-2'>Location</label>
        <input
          type='text'
          id='address'
          name='address'
          className='border rounded w-full py-2 px-3 mb-2'
          placeholder='Street Address'
        />
        <input
          type='text'
          id='city'
          name='city'
          className='border rounded w-full py-2 px-3 mb-2'
          placeholder='City'
          required
        />
        <input
          type='text'
          id='state'
          name='state'
          className='border rounded w-full py-2 px-3 mb-2'
          placeholder='State'
          required
        />
        <input
          type='text'
          id='zip_code'
          name='zip_code'
          className='border rounded w-full py-2 px-3 mb-2'
          placeholder='ZIP Code'
        />
      </div>

      <div className='mb-4 flex flex-wrap'>
        <div className='w-full sm:w-1/2 pr-2'>
          <label htmlFor='date_start' className='block text-gray-700 font-bold mb-2'>
            Start Date
          </label>
          <input
            type='date'
            id='date_start'
            name='date_start'
            className='border rounded w-full py-2 px-3'
            required
          />
        </div>
        <div className='w-full sm:w-1/2 pl-2'>
          <label htmlFor='time_start' className='block text-gray-700 font-bold mb-2'>
            Start Time
          </label>
          <input
            type='time'
            id='time_start'
            name='time_start'
            className='border rounded w-full py-2 px-3'
            required
          />
        </div>
      </div>

      <div className='mb-4 flex flex-wrap'>
        <div className='w-full sm:w-1/2 pr-2'>
          <label htmlFor='date_end' className='block text-gray-700 font-bold mb-2'>
            End Date (Optional)
          </label>
          <input
            type='date'
            id='date_end'
            name='date_end'
            className='border rounded w-full py-2 px-3'
          />
        </div>
        <div className='w-full sm:w-1/2 pl-2'>
          <label htmlFor='time_end' className='block text-gray-700 font-bold mb-2'>
            End Time (Optional)
          </label>
          <input
            type='time'
            id='time_end'
            name='time_end'
            className='border rounded w-full py-2 px-3'
          />
        </div>
      </div>

      <div className='mb-4'>
        <label className='block text-gray-700 font-bold mb-2'>Sale Tags</label>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
          <div>
            <input
              type='checkbox'
              id='tag_furniture'
              name='tags'
              value='Furniture'
              className='mr-2'
            />
            <label htmlFor='tag_furniture'>Furniture</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_electronics'
              name='tags'
              value='Electronics'
              className='mr-2'
            />
            <label htmlFor='tag_electronics'>Electronics</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_clothing'
              name='tags'
              value='Clothing'
              className='mr-2'
            />
            <label htmlFor='tag_clothing'>Clothing</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_toys'
              name='tags'
              value='Toys'
              className='mr-2'
            />
            <label htmlFor='tag_toys'>Toys</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_books'
              name='tags'
              value='Books'
              className='mr-2'
            />
            <label htmlFor='tag_books'>Books</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_tools'
              name='tags'
              value='Tools'
              className='mr-2'
            />
            <label htmlFor='tag_tools'>Tools</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_kitchen'
              name='tags'
              value='Kitchen Items'
              className='mr-2'
            />
            <label htmlFor='tag_kitchen'>Kitchen Items</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_sports'
              name='tags'
              value='Sports Equipment'
              className='mr-2'
            />
            <label htmlFor='tag_sports'>Sports Equipment</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_garden'
              name='tags'
              value='Garden'
              className='mr-2'
            />
            <label htmlFor='tag_garden'>Garden</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_collectibles'
              name='tags'
              value='Collectibles'
              className='mr-2'
            />
            <label htmlFor='tag_collectibles'>Collectibles</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_art'
              name='tags'
              value='Art & Decor'
              className='mr-2'
            />
            <label htmlFor='tag_art'>Art & Decor</label>
          </div>
          <div>
            <input
              type='checkbox'
              id='tag_misc'
              name='tags'
              value='Miscellaneous'
              className='mr-2'
            />
            <label htmlFor='tag_misc'>Miscellaneous</label>
          </div>
        </div>
      </div>

      <div className='mb-4 bg-blue-50 p-4'>
        <label className='block text-gray-700 font-bold mb-2'>
          Pricing (Optional)
        </label>
        <div className='flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4'>
          <div className='flex items-center'>
            <label htmlFor='price' className='mr-2'>
              Starting Price
            </label>
            <input
              type='number'
              id='price'
              name='price'
              className='border rounded w-full py-2 px-3'
              placeholder='0'
            />
          </div>
          <div className='flex items-center'>
            <label htmlFor='price_range' className='mr-2'>
              Price Range
            </label>
            <input
              type='text'
              id='price_range'
              name='price_range'
              className='border rounded w-full py-2 px-3'
              placeholder='$1-$50'
            />
          </div>
        </div>
      </div>

      <div className='mb-4'>
        <label
          htmlFor='seller_name'
          className='block text-gray-700 font-bold mb-2'
        >
          Seller Name
        </label>
        <input
          type='text'
          id='seller_name'
          name='seller_info.name'
          className='border rounded w-full py-2 px-3'
          placeholder='Your Name'
        />
      </div>
      <div className='mb-4'>
        <label
          htmlFor='seller_email'
          className='block text-gray-700 font-bold mb-2'
        >
          Seller Email
        </label>
        <input
          type='email'
          id='seller_email'
          name='seller_info.email'
          className='border rounded w-full py-2 px-3'
          placeholder='your@email.com'
          required
        />
      </div>
      <div className='mb-4'>
        <label
          htmlFor='seller_phone'
          className='block text-gray-700 font-bold mb-2'
        >
          Seller Phone
        </label>
        <input
          type='tel'
          id='seller_phone'
          name='seller_info.phone'
          className='border rounded w-full py-2 px-3'
          placeholder='(555) 123-4567'
        />
      </div>

      <div className='mb-4'>
        <label htmlFor='images' className='block text-gray-700 font-bold mb-2'>
          Images (Select up to 4 images)
        </label>
        <input
          type='file'
          id='images'
          name='images'
          className='border rounded w-full py-2 px-3'
          accept='image/*'
          multiple
          required
        />
      </div>

      <div>
        <button
          className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline'
          type='submit'
        >
          Add Sale
        </button>
      </div>
    </form>
  );
};

export default SaleAddForm;
