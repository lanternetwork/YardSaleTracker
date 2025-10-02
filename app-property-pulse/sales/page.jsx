import SaleCard from '@/components/SaleCard';
import SaleSearchForm from '@/components/SaleSearchForm';
import SalesMap from '@/components/location/SalesMap';
import Pagination from '@/components/Pagination';
import Sale from '@/models/Sale';
import connectDB from '@/config/database';

const SalesPage = async ({ searchParams: { pageSize = 9, page = 1 } }) => {
  await connectDB();
  const skip = (page - 1) * pageSize;

  const total = await Sale.countDocuments({});
  const sales = await Sale.find({}).skip(skip).limit(pageSize);

  // Calculate if pagination is needed
  const showPagination = total > pageSize;

  return (
    <>
      <section className='bg-blue-700 py-4'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start'>
          <SaleSearchForm />
        </div>
      </section>
      
      {/* Map Section */}
      <section className='px-4 py-6'>
        <div className='container-xl lg:container m-auto px-4 py-6'>
          <h2 className='text-xl font-semibold mb-4'>Sales Map</h2>
          <SalesMap 
            sales={sales} 
            center={{ lat: 38.2527, lng: -85.7585 }}
            zoom={10}
          />
        </div>
      </section>

      {/* Sales List Section */}
      <section className='px-4 py-6'>
        <div className='container-xl lg:container m-auto px-4 py-6'>
          <h1 className='text-2xl mb-4'>Browse Sales</h1>
          {sales.length === 0 ? (
            <p>No sales found</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {sales.map((sale, index) => (
                <SaleCard sale={sale} key={index} />
              ))}
            </div>
          )}
          {showPagination && (
            <Pagination
              page={parseInt(page)}
              pageSize={parseInt(pageSize)}
              totalItems={total}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default SalesPage;
