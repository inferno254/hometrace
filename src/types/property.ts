export type PublicPropertyRow = {
  id: string
  title: string
  description: string | null
  ai_generated_description: string | null
  price: number
  price_type: string
  bedrooms: number | null
  bathrooms: number | null
  property_type: string
  county: string
  town: string
  area_label: string | null
  listing_reference: string | null
  cover_image_url: string | null
  image_urls: string[] | null
  amenity_names: string[] | null
  furnished: boolean | null
  size_sqm: number | null
  created_at: string
}

/** Full row stored in Postgres (admins only) */
export type DbProperty = {
  id: string
  listing_reference: string | null
  title: string
  description: string | null
  ai_generated_description: string | null
  price: number
  price_type: string
  bedrooms: number | null
  bathrooms: number | null
  property_type: string
  county: string
  town: string
  area_label: string | null
  estate: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  owner_phone: string | null
  is_available: boolean
  is_published: boolean
  furnished: boolean | null
  size_sqm: number | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export type PropertyInquiry = {
  id: string
  property_id: string
  name: string
  phone: string
  message: string | null
  created_at: string
}

export type ListingQuality = {
  completeness: number
  missing: string[]
}
