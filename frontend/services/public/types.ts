export interface Category {
  id: string
  name: string
  description: string | null
  iconUrl: string | null
}

export interface RestaurantCategory {
  id: string
  restaurantId: string
  categoryId: string
  category: Category
}

export interface RestaurantPlace {
  city: string
  address: string
  country?: string
}

export interface PublicRestaurant {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
  rating: string | number
  deliveryFee: string | number | null
  minOrderAmount: string | number | null
  categories: RestaurantCategory[]
  place: RestaurantPlace
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: string | number
  imageUrl: string | null
  preparationTime: number | null
  category: {
    id: string
    name: string
  } | null
}

export interface MenuCategory {
  categoryId: string
  categoryName: string
  items: MenuItem[]
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RestaurantFilters {
  categoryId?: string
  minRating?: number
  search?: string
}
