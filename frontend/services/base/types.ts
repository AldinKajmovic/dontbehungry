// Common types used across all services

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

export interface SelectOption {
  value: string
  label: string
}

export interface MessageResponse {
  message: string
}

export interface ApiError {
  error: string
  details?: string
}
