import { Schema, model, models } from 'mongoose';

const SaleSchema = new Schema(
  {
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Yard Sale',
    },
    description: {
      type: String,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zip_code: {
      type: String,
    },
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
    date_start: {
      type: Date,
      required: true,
    },
    time_start: {
      type: String,
      required: true,
    },
    date_end: {
      type: Date,
    },
    time_end: {
      type: String,
    },
    price: {
      type: Number,
    },
    tags: [
      {
        type: String,
      },
    ],
    seller_info: {
      name: {
        type: String,
      },
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
    images: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'completed', 'cancelled'],
      default: 'draft',
    },
    privacy_mode: {
      type: String,
      enum: ['exact', 'block_until_24h'],
      default: 'exact',
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Sale = models.Sale || model('Sale', SaleSchema);

export default Sale;
