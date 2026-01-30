import api from './api'

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

class AddressService {
  async getAddresses(): Promise<{ addresses: Address[] }> {
    const response = await api.get<{ addresses: Address[] }>('/api/addresses')
    return response.data
  }

  async addAddress(data: AddAddressData): Promise<AddressResponse> {
    const response = await api.post<AddressResponse>('/api/addresses', data)
    return response.data
  }

  async updateAddress(id: string, data: Partial<AddAddressData>): Promise<AddressResponse> {
    const response = await api.patch<AddressResponse>(`/api/addresses/${id}`, data)
    return response.data
  }

  async deleteAddress(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/api/addresses/${id}`)
    return response.data
  }

  async setDefaultAddress(id: string): Promise<AddressResponse> {
    const response = await api.post<AddressResponse>(`/api/addresses/${id}/default`)
    return response.data
  }
}

export const addressService = new AddressService()
