import api from '../api'
import { PaginatedResponse, SelectOption } from './types'

export interface CrudConfig {
  basePath: string
}

export interface GetListParams {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string | number | boolean | undefined>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function buildParams(params: GetListParams): URLSearchParams {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.append('page', String(params.page))
  if (params.limit) searchParams.append('limit', String(params.limit))
  if (params.search) searchParams.append('search', params.search)
  if (params.sortBy) searchParams.append('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)
  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    }
  }

  return searchParams
}

export async function getList<T>(
  basePath: string,
  params: GetListParams = {}
): Promise<PaginatedResponse<T>> {
  const { page = 1, limit = 10, search, filters, sortBy, sortOrder } = params
  const searchParams = buildParams({ page, limit, search, filters, sortBy, sortOrder })
  const response = await api.get<PaginatedResponse<T>>(`${basePath}?${searchParams}`)
  return response.data
}


export async function getById<T>(basePath: string, id: string): Promise<T> {
  const response = await api.get<T>(`${basePath}/${id}`)
  return response.data
}

export async function create<T, D>(basePath: string, data: D): Promise<T> {
  const response = await api.post<T>(basePath, data)
  return response.data
}

export async function update<T, D>(basePath: string, id: string, data: D): Promise<T> {
  const response = await api.patch<T>(`${basePath}/${id}`, data)
  return response.data
}

export async function remove(basePath: string, id: string): Promise<void> {
  await api.delete(`${basePath}/${id}`)
}

export function createCrudService<T, CreateInput = Partial<T>, UpdateInput = Partial<T>>(
  basePath: string
) {
  return {
    getList: (params?: GetListParams) => getList<T>(basePath, params),
    getById: (id: string) => getById<T>(basePath, id),
    create: (data: CreateInput) => create<T, CreateInput>(basePath, data),
    update: (id: string, data: UpdateInput) => update<T, UpdateInput>(basePath, id, data),
    delete: (id: string) => remove(basePath, id),
  }
}

export function toSelectOptions<T>(
  items: T[],
  getValue: (item: T) => string,
  getLabel: (item: T) => string
): SelectOption[] {
  return items.map((item) => ({
    value: getValue(item),
    label: getLabel(item),
  }))
}

export function createSelectLoader<T>(
  fetchFn: (params: GetListParams) => Promise<PaginatedResponse<T>>,
  getValue: (item: T) => string,
  getLabel: (item: T) => string,
  limit = 25
) {
  return async (search?: string): Promise<SelectOption[]> => {
    const response = await fetchFn({ page: 1, limit, search })
    return toSelectOptions(response.items, getValue, getLabel)
  }
}
