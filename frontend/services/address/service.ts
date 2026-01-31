// Address service
import api from '../api'
import { MessageResponse } from '../base/types'
import { Address, AddAddressData, AddressResponse } from './types'

const BASE_PATH = '/api/addresses'

class AddressService {
  async getAddresses(): Promise<{ addresses: Address[] }> {
    const response = await api.get<{ addresses: Address[] }>(BASE_PATH)
    return response.data
  }

  async addAddress(data: AddAddressData): Promise<AddressResponse> {
    const response = await api.post<AddressResponse>(BASE_PATH, data)
    return response.data
  }

  async updateAddress(id: string, data: Partial<AddAddressData>): Promise<AddressResponse> {
    const response = await api.patch<AddressResponse>(`${BASE_PATH}/${id}`, data)
    return response.data
  }

  async deleteAddress(id: string): Promise<MessageResponse> {
    const response = await api.delete<MessageResponse>(`${BASE_PATH}/${id}`)
    return response.data
  }

  async setDefaultAddress(id: string): Promise<AddressResponse> {
    const response = await api.post<AddressResponse>(`${BASE_PATH}/${id}/default`)
    return response.data
  }
}

export const addressService = new AddressService()
