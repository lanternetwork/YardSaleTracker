import SaleHeaderImage from '@/components/SaleHeaderImage';
import SaleDetails from '@/components/SaleDetails';
import connectDB from '@/config/database';
import Sale from '@/models/Sale';
import SaleImages from '@/components/SaleImages';
import BookmarkButton from '@/components/BookmarkButton';
import ShareButtons from '@/components/ShareButtons';
import SaleContactForm from '@/components/SaleContactForm';
import { convertToSerializeableObject } from '@/utils/convertToObject';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

const SalePage = async ({ params }) => {
  await connectDB();
  const saleDoc = await Sale.findById(params.id).lean();
  const sale = convertToSerializeableObject(saleDoc);

  if (!sale) {
    return (
      <h1 className='text-center text-2xl font-bold mt-10'>
        Sale Not Found
      </h1>
    );
  }

  return (
    <>
      <SaleHeaderImage image={sale.images[0]} />
      <section>
        <div className='container m-auto py-6 px-6'>
          <Link
            href='/sales'
            className='text-blue-500 hover:text-blue-600 flex items-center'
          >
            <FaArrowLeft className='mr-2' /> Back to Sales
          </Link>
        </div>
      </section>
      <section className='bg-blue-50'>
        <div className='container m-auto py-10 px-6'>
          <div className='grid grid-cols-1 md:grid-cols-70/30 w-full gap-6'>
            <SaleDetails sale={sale} />

            {/* <!-- Sidebar --> */}
            <aside className='space-y-4'>
              <BookmarkButton sale={sale} />
              <ShareButtons sale={sale} />
              <SaleContactForm sale={sale} />
            </aside>
          </div>
        </div>
      </section>
      <SaleImages images={sale.images} />
    </>
  );
};
export default SalePage;
