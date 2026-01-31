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
}

export interface AddAddressData {
  address: string
  city: string
  state?: string
  country: string
  postalCode?: string
  notes?: string
  isDefault?: boolean
}

export interface AddressResponse {
  message: string
  address: Address
}
