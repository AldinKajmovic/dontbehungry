// Profile-specific types
import { User, AuthResponse } from '../auth/types'

// Re-export for convenience
export type { User, AuthResponse }

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
}

export interface UpdateProfileResponse {
  message: string
  user: User
  emailChanged?: boolean
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface UpdateAvatarData {
  avatarUrl: string | null
}

// Restaurant owner types
export interface MyRestaurant {
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
}

// Menu item types for restaurant owners
export interface MyMenuItem {
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

export interface Category {
  id: string
  name: string
}
