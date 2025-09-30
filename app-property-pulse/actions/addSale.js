'use server';
import connectDB from '@/config/database';
import Sale from '@/models/Sale';
import { getSessionUser } from '@/utils/getSessionUser';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import cloudinary from '@/config/cloudinary';

async function addSale(formData) {
  await connectDB();

  const sessionUser = await getSessionUser();

  if (!sessionUser || !sessionUser.userId) {
    throw new Error('User ID is required');
  }

  const { userId } = sessionUser;

  // Access all values for tags and images
  const tags = formData.getAll('tags');
  const images = formData.getAll('images').filter((image) => image.name !== '');

  // Create the saleData object with embedded seller_info
  const saleData = {
    title: formData.get('title'),
    category: formData.get('category'),
    description: formData.get('description'),
    address: formData.get('address'),
    city: formData.get('city'),
    state: formData.get('state'),
    zip_code: formData.get('zip_code'),
    date_start: formData.get('date_start'),
    time_start: formData.get('time_start'),
    date_end: formData.get('date_end'),
    time_end: formData.get('time_end'),
    price: formData.get('price') ? parseFloat(formData.get('price')) : null,
    tags,
    seller_info: {
      name: formData.get('seller_info.name'),
      email: formData.get('seller_info.email'),
      phone: formData.get('seller_info.phone'),
    },
    owner_id: userId,
    status: 'draft',
  };

  const imageUrls = [];

  for (const imageFile of images) {
    const imageBuffer = await imageFile.arrayBuffer();
    const imageArray = Array.from(new Uint8Array(imageBuffer));
    const imageData = Buffer.from(imageArray);

    // Convert the image data to base64
    const imageBase64 = imageData.toString('base64');

    // Make request to upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${imageBase64}`,
      {
        folder: 'lootaura',
      }
    );

    imageUrls.push(result.secure_url);
  }

  saleData.images = imageUrls;

  const newSale = new Sale(saleData);
  await newSale.save();

  revalidatePath('/', 'layout');

  redirect(`/sales/${newSale._id}`);
}

export default addSale;
