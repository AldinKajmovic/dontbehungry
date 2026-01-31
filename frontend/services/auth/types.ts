// Auth-specific types

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  emailVerified: boolean
  phoneVerified: boolean
  avatarUrl?: string
}

export interface AuthResponse {
  message: string
  user: User
}

export interface RegisterUserData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  address?: string
  city?: string
  country?: string
}

export interface RegisterRestaurantData extends RegisterUserData {
  restaurantName: string
  restaurantDescription?: string
  restaurantPhone?: string
  restaurantEmail?: string
  address: string
  city: string
  country: string
  postalCode?: string
  minOrderAmount?: number
  deliveryFee?: number
}

export interface LoginData {
  email: string
  password: string
}
