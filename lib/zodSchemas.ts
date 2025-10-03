import { z } from 'zod'

export const SaleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip_code: z.string().optional(),
  date_start: z.string().min(1, 'Start date is required'),
  time_start: z.string().min(1, 'Start time is required'),
  date_end: z.string().optional(),
  time_end: z.string().optional(),
  lat: z.number().min(-90).max(90, 'Invalid latitude'),
  lng: z.number().min(-180).max(180, 'Invalid longitude'),
  tags: z.array(z.string()).default([]),
  price: z.number().min(0, 'Price must be positive').optional(),
  photos: z.array(z.string()).default([])
}).refine((data) => {
  // If end date is provided, it must be >= start date
  if (data.date_end && data.date_start) {
    const startDate = new Date(data.date_start)
    const endDate = new Date(data.date_end)
    if (endDate < startDate) {
      return false
    }
  }
  return true
}, {
  message: 'End date must be on or after start date',
  path: ['date_end']
})

export const SaleItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  condition: z.string().optional(),
  price: z.number().optional(),
  photo: z.string().optional(),
  purchased: z.boolean().default(false)
})

export const ProfileSchema = z.object({
  display_name: z.string().optional(),
  avatar_url: z.string().optional()
})
