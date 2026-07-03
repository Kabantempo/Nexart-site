export interface Profile {
  id: string
  role: 'creator' | 'organizer'
  full_name: string
  avatar_url?: string
  bio?: string
  created_at: string
}

export interface CreatorProfile extends Profile {
  disciplines: string[]
  city: string
  region: string
  department: string
  travel_radius: '5' | '10' | '25' | 'national'
  portfolio_images: string[]
  website?: string
  instagram?: string
  etsy?: string
  siret_verified: boolean
  insurance_verified: boolean
  insurance_doc_url?: string
  siret?: string
  availability: Record<string, unknown>
}

export interface OrganizerProfile extends Profile {
  organization_name: string
  website?: string
  instagram?: string
}

export interface Event {
  id: string
  organizer_id: string
  title: string
  description: string
  event_type: 'permanent' | 'seasonal' | 'popup' | 'salon' | 'fair'
  theme: string[]
  location: string
  city: string
  region: string
  department: string
  lat: number
  lng: number
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  stand_count: number
  stand_price: number
  stand_dimensions: string
  discipline_tags: string[]
  cover_image?: string
  media: string[]
  rules: string
  stripe_enabled: boolean
  status: 'draft' | 'published' | 'closed'
  created_at: string
}

export interface Application {
  id: string
  event_id: string
  creator_id: string
  message?: string
  status: 'pending' | 'accepted' | 'refused'
  stripe_payment_id?: string
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
  comment?: string
  tags: string[]
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read_at?: string
  created_at: string
}

export interface Conversation {
  id: string
  event_id: string
  creator_id: string
  organizer_id: string
  created_at: string
}
