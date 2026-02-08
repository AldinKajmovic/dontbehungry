// Shared types for profile services
import { UserResponse } from '../../types'

export { UserResponse }

export interface UpdateProfileResult {
  user: UserResponse
  emailChanged: boolean
  verificationEmailFailed?: boolean
}

export interface OpeningHoursInput {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

export interface GalleryImageInput {
  imageUrl: string
  sortOrder: number
}

export interface OpeningHoursResponse {
  id: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

export interface GalleryImageResponse {
  id: string
  imageUrl: string
  sortOrder: number
}

export interface MyRestaurantResponse {
  id: string
  name: string
  description: string | null
  phone: string | null
  email: string | null
  logoUrl: string | null
  coverUrl: string | null
  rating: string
  minOrderAmount: string | null
  deliveryFee: string | null
  place: {
    id: string
    address: string
    city: string
    country: string
  }
  openingHours: OpeningHoursResponse[]
  galleryImages: GalleryImageResponse[]
}

export interface CreateMyRestaurantData {
  name: string
  description?: string | null
  phone?: string | null
  email?: string | null
  address: string
  city: string
  country: string
  postalCode?: string | null
  minOrderAmount?: number | null
  deliveryFee?: number | null
  openingHours?: OpeningHoursInput[]
  galleryImages?: GalleryImageInput[]
}

export interface UpdateMyRestaurantData {
  name?: string
  description?: string | null
  phone?: string | null
  email?: string | null
  minOrderAmount?: number | null
  deliveryFee?: number | null
  logoUrl?: string | null
  coverUrl?: string | null
  openingHours?: OpeningHoursInput[]
  galleryImages?: GalleryImageInput[]
}

export interface MyMenuItemResponse {
  id: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isAvailable: boolean
  preparationTime: number | null
  category: { id: string; name: string } | null
}

export interface CreateMyMenuItemData {
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  categoryId?: string | null
  isAvailable?: boolean
  preparationTime?: number | null
}

export interface UpdateMyMenuItemData {
  name?: string
  description?: string | null
  price?: number
  imageUrl?: string | null
  categoryId?: string | null
  isAvailable?: boolean
  preparationTime?: number | null
}

export interface OrderHistoryFilters {
  createdAtFrom?: Date
  createdAtTo?: Date
  status?: string
  page?: number
  limit?: number
}

export interface OrderHistoryItem {
  id: string
  status: string
  totalAmount: string
  createdAt: string
  deliveredAt: string | null
  restaurant: { id: string; name: string }
  deliveryPlace: { address: string; city: string; latitude: number | null; longitude: number | null }
  orderItems: Array<{ name: string; quantity: number; unitPrice: string }>
  payment: { status: string; method: string } | null
}

export interface OrderHistoryResponse {
  orders: OrderHistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RestaurantOrderItem extends OrderHistoryItem {
  customerName: string
  customerPhone: string | null
}

export interface RestaurantOrdersResponse {
  orders: RestaurantOrderItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateOrderData {
  restaurantId: string
  deliveryAddressId: string
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DIGITAL_WALLET'
  notes?: string
  items: Array<{
    menuItemId: string
    quantity: number
    notes?: string
  }>
}

export interface CreatedOrderResponse {
  id: string
  status: string
  totalAmount: string
  createdAt: string
  restaurant: { id: string; name: string }
  deliveryPlace: { address: string; city: string }
  orderItems: Array<{ name: string; quantity: number; unitPrice: string }>
  payment: { status: string; method: string }
}

export interface UpdateRestaurantOrderData {
  status: string
  notes?: string
}
