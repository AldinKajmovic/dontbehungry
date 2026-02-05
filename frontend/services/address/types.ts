// Address-specific types

export interface Address {
  id: string
  address: string
  city: string
  state: string | null
  country: string
  postalCode: string | null
  notes: string | null
  isDefault: boolean
  latitude: number | null
  longitude: number | null
}

export interface AddAddressData {
  address: string
  city: string
  state?: string
  country: string
  postalCode?: string
  notes?: string
  isDefault?: boolean
  latitude?: number
  longitude?: number
}

export interface AddressResponse {
  message: string
  address: Address
}
