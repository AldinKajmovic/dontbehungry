'use client'

import { useState, useEffect, useCallback } from 'react'
import { PaginationInfo, PaginatedResponse } from '@/services/admin'
import { SortParams } from '@/services/admin'

interface FilterBase {
  [key: string]: string | undefined
}

interface UseAdminListOptions<TItem, TFilters extends FilterBase> {
  fetchFn: (
    page: number,
    limit: number,
    search?: string,
    filters?: TFilters,
    sort?: SortParams
  ) => Promise<PaginatedResponse<TItem>>
}

export function useAdminList<TItem, TFilters extends FilterBase>(
  options: UseAdminListOptions<TItem, TFilters>
) {
  const { fetchFn } = options

  const [items, setItems] = useState<TItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<TFilters>({} as TFilters)
  const [sort, setSort] = useState<SortParams>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchFn(
        pagination.page,
        pagination.limit,
        search || undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        sort.sortBy ? sort : undefined
      )
      setItems(result.items)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, search, filters, sort, fetchFn])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadItems()
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, page: 1, limit }))
  }

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSort({ sortBy, sortOrder })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined }
      Object.keys(next).forEach((k) => {
        if (!next[k as keyof TFilters]) delete next[k as keyof TFilters]
      })
      return next
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({} as TFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return {
    items, setItems,
    pagination, search, setSearch, filters, sort,
    isLoading, error, setError,
    handleSearch, handlePageChange, handleLimitChange, handleSort,
    handleFilterChange, handleClearFilters, hasActiveFilters,
    reload: loadItems,
  }
}
