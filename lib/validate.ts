import { z } from 'zod'
import { NextResponse } from 'next/server'

export { z }

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data: T; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Données invalides', details: result.error.flatten().fieldErrors },
        { status: 400 }
      ),
    }
  }
  return { data: result.data, error: null }
}

// ─── Schemas réutilisables ────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid('UUID invalide')

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
})

export const newsletterSchema = z.object({
  email: z.string().email(),
})

export const reviewSchema = z.object({
  event_id: uuidSchema,
  reviewed_id: uuidSchema,
  reviewer_role: z.enum(['creator', 'organizer']),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

export const reportSchema = z.object({
  reported_id: uuidSchema,
  reported_type: z.enum(['profile', 'event', 'review', 'message']),
  reason: z.string().min(5).max(1000),
})

export const itinerarySchema = z.object({
  label: z.string().min(2).max(200),
  region: z.string().max(100).optional(),
  department: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_public: z.boolean().optional().default(true),
})

export const creditUseSchema = z.object({
  type: z.enum(['boost_application', 'boost_profile', 'purchase']),
  ref_id: uuidSchema.optional(),
})

export const creditAdminSchema = z.object({
  user_id: uuidSchema,
  amount: z.number().int().min(1).max(10000),
  type: z.enum(['gift', 'admin', 'monthly_refill']),
  description: z.string().max(500).optional(),
})

export const eventCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  event_type: z.enum(['popup', 'salon', 'fair', 'seasonal', 'permanent']).optional(),
  location: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  department: z.string().max(10).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  stand_count: z.number().int().min(0).optional(),
  stand_price: z.number().min(0).optional(),
  stand_dimensions: z.string().max(100).optional(),
  discipline_tags: z.array(z.string().max(50)).max(20).optional(),
  cover_image: z.string().url().optional(),
  rules: z.string().max(5000).optional(),
  status: z.enum(['draft', 'published', 'closed']).optional(),
})

export const applicationStatusSchema = z.object({
  application_id: uuidSchema,
  status: z.enum(['accepted', 'refused']),
  rejection_reason: z.record(z.unknown()).optional(),
})

export const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
})
