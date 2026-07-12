export type Role = 'creator' | 'organizer' | 'visitor' | 'admin'

export interface Profile {
  id: string
  role: Role
  full_name: string
  avatar_url?: string | null
  bio?: string | null
  created_at: string
  is_admin?: boolean | null
  is_creator?: boolean
  is_organizer?: boolean
  username?: string | null
  subscription_tier?: string
}

export interface CreatorProfile extends Profile {
  disciplines: string[]
  city?: string | null
  region?: string | null
  department?: string | null
  travel_radius?: '5' | '10' | '25' | 'national'
  portfolio_images: string[]
  website?: string | null
  instagram?: string | null
  etsy?: string | null
  siret_verified?: boolean
  insurance_verified?: boolean
  insurance_doc_url?: string | null
  siret?: string | null
  availability?: Record<string, unknown>
  lat?: number | null
  lng?: number | null
}

export interface OrganizerProfile extends Profile {
  organization_name?: string
  website?: string | null
  instagram?: string | null
}

export interface Event {
  id: string
  organizer_id: string
  title: string
  description?: string | null
  event_type: 'permanent' | 'seasonal' | 'popup' | 'salon' | 'fair'
  theme?: string[] | null
  location?: string | null
  city?: string | null
  region?: string | null
  department?: string | null
  lat?: number | null
  lng?: number | null
  start_date: string
  end_date: string
  start_time?: string | null
  end_time?: string | null
  stand_count?: number
  stand_price?: number
  stand_dimensions?: string | null
  discipline_tags?: string[]
  cover_image?: string | null
  media?: string[] | null
  rules?: string | null
  stripe_enabled?: boolean
  status: 'draft' | 'published' | 'closed'
  created_at: string
  updated_at?: string | null
  address?: string | null
}

export interface Application {
  id: string
  event_id: string
  creator_id: string
  message?: string | null
  status: 'pending' | 'accepted' | 'refused'
  stripe_payment_id?: string | null
  boosted_at?: string | null
  portfolio_images?: string[] | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  event_id: string
  reviewer_id: string
  reviewed_id: string
  reviewer_role: 'creator' | 'organizer'
  rating: number
  comment?: string | null
  tags?: string[]
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read_at?: string | null
  created_at: string
}

export interface Conversation {
  id: string
  event_id?: string | null
  creator_id: string
  organizer_id: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body?: string | null
  link?: string | null
  read_at?: string | null
  created_at?: string | null
}
