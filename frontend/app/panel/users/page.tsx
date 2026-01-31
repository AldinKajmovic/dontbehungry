'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal'
import { FilterBar } from '@/components/admin/FilterBar'
import { Modal, Input, Button, Alert, Select } from '@/components/ui'
import { adminService, AdminUser, PaginationInfo, UserFilters, SortParams } from '@/services/admin'

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'RESTAURANT_OWNER', label: 'Restaurant Owner' },
  { value: 'DELIVERY_DRIVER', label: 'Delivery Driver' },
  { value: 'ADMIN', label: 'Admin' },
]

const FILTER_CONFIG = [
  {
    key: 'role',
    label: 'Role',
    options: [
      { value: 'CUSTOMER', label: 'Customer' },
      { value: 'RESTAURANT_OWNER', label: 'Restaurant Owner' },
      { value: 'DELIVERY_DRIVER', label: 'Delivery Driver' },
      { value: 'ADMIN', label: 'Admin' },
      { value: 'SUPER_ADMIN', label: 'Super Admin' },
    ],
    placeholder: 'All Roles',
  },
  {
    key: 'emailVerified',
    label: 'Status',
    options: [
      { value: 'true', label: 'Verified' },
      { value: 'false', label: 'Pending' },
    ],
    placeholder: 'All Statuses',
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<UserFilters>({})
  const [sort, setSort] = useState<SortParams>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CUSTOMER',
    // Restaurant fields (only used when role is RESTAURANT_OWNER)
    restaurantName: '',
    restaurantDescription: '',
    restaurantPhone: '',
    restaurantEmail: '',
    restaurantAddress: '',
    restaurantCity: '',
    restaurantCountry: '',
    restaurantPostalCode: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await adminService.getUsers(
        pagination.page,
        pagination.limit,
        search || undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        sort.sortBy ? sort : undefined
      )
      setUsers(result.items)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, search, filters, sort])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined }
      Object.keys(next).forEach((k) => {
        if (!next[k as keyof UserFilters]) delete next[k as keyof UserFilters]
      })
      return next
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSort({ sortBy, sortOrder })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadUsers()
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, page: 1, limit }))
  }

  const openCreateModal = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'CUSTOMER',
      restaurantName: '',
      restaurantDescription: '',
      restaurantPhone: '',
      restaurantEmail: '',
      restaurantAddress: '',
      restaurantCity: '',
      restaurantCountry: '',
      restaurantPostalCode: '',
    })
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      restaurantName: '',
      restaurantDescription: '',
      restaurantPhone: '',
      restaurantEmail: '',
      restaurantAddress: '',
      restaurantCity: '',
      restaurantCountry: '',
      restaurantPostalCode: '',
    })
    setFormError('')
    setShowEditModal(true)
  }

  const openDeleteModal = (user: AdminUser) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFormLoading(true)
      setFormError('')

      // Validate restaurant fields if role is RESTAURANT_OWNER
      if (formData.role === 'RESTAURANT_OWNER') {
        if (!formData.restaurantName || !formData.restaurantAddress || !formData.restaurantCity || !formData.restaurantCountry) {
          setFormError('Restaurant name, address, city, and country are required')
          setFormLoading(false)
          return
        }
      }

      // Create user first
      const newUser = await adminService.createUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        role: formData.role,
      })

      // If role is RESTAURANT_OWNER, create place and restaurant
      if (formData.role === 'RESTAURANT_OWNER') {
        try {
          // Create place first
          const newPlace = await adminService.createPlace({
            address: formData.restaurantAddress,
            city: formData.restaurantCity,
            country: formData.restaurantCountry,
            postalCode: formData.restaurantPostalCode || undefined,
          })

          // Create restaurant with user as owner
          await adminService.createRestaurant({
            name: formData.restaurantName,
            description: formData.restaurantDescription || undefined,
            phone: formData.restaurantPhone || undefined,
            email: formData.restaurantEmail || undefined,
            ownerId: newUser.id,
            placeId: newPlace.id,
          })
        } catch {
          // Restaurant creation failed but user was created
          setFormError('User created but restaurant creation failed. Please create restaurant separately.')
        }
      }

      setUsers((prev) => [newUser, ...prev])
      setShowCreateModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    try {
      setFormLoading(true)
      setFormError('')
      const updateData: Partial<AdminUser> = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        role: formData.role,
      }
      const updatedUser = await adminService.updateUser(selectedUser.id, updateData)
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
      setShowEditModal(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    try {
      setFormLoading(true)
      await adminService.deleteUser(selectedUser.id)
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))
      setShowDeleteModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setFormLoading(false)
    }
  }

  const columns = [
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (user: AdminUser) => (
        <div>
          <p className="font-medium text-gray-900">{user.email}</p>
          <p className="text-xs text-gray-500">{user.firstName} {user.lastName}</p>
        </div>
      ),
    },
    {
      key: 'firstName',
      header: 'First Name',
      sortable: true,
      render: (user: AdminUser) => <span>{user.firstName}</span>,
    },
    {
      key: 'lastName',
      header: 'Last Name',
      sortable: true,
      render: (user: AdminUser) => <span>{user.lastName}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user: AdminUser) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
            ? 'bg-purple-100 text-purple-700'
            : user.role === 'RESTAURANT_OWNER'
            ? 'bg-blue-100 text-blue-700'
            : user.role === 'DELIVERY_DRIVER'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {user.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'emailVerified',
      header: 'Status',
      sortable: true,
      render: (user: AdminUser) => (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm">{user.emailVerified ? 'Verified' : 'Pending'}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (user: AdminUser) => <span className="text-gray-500">{user.phone || '-'}</span>,
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Manage user accounts</p>
        </div>
        <Button onClick={openCreateModal} className="!w-auto !px-4">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </span>
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="input-field"
            />
          </div>
          <Button type="submit" variant="secondary" className="!w-auto !px-6">
            Search
          </Button>
        </div>
      </form>

      {/* Filters */}
      <FilterBar
        filters={FILTER_CONFIG}
        values={filters as Record<string, string>}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Error */}
      {error && (
        <Alert type="error" className="mb-6">{error}</Alert>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No users found"
        sortConfig={sort.sortBy ? { key: sort.sortBy, direction: sort.sortOrder || 'asc' } : undefined}
        onSort={handleSort}
        actions={(user) => (
          <>
            <button
              onClick={() => openEditModal(user)}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => openDeleteModal(user)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      />

      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New User"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            showPasswordToggle
          />

          <Input
            label="Phone"
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            hint="(optional)"
          />

          <Select
            label="Role"
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={ROLE_OPTIONS}
          />

          {/* Restaurant fields - shown when RESTAURANT_OWNER is selected */}
          {formData.role === 'RESTAURANT_OWNER' && (
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
              <p className="text-sm font-medium text-gray-700">Restaurant Details</p>

              <Input
                label="Restaurant Name"
                id="restaurantName"
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                placeholder="My Restaurant"
                required
              />

              <div>
                <label htmlFor="restaurantDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="restaurantDescription"
                  value={formData.restaurantDescription}
                  onChange={(e) => setFormData({ ...formData, restaurantDescription: e.target.value })}
                  placeholder="Describe the restaurant..."
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Restaurant Phone"
                  type="tel"
                  id="restaurantPhone"
                  value={formData.restaurantPhone}
                  onChange={(e) => setFormData({ ...formData, restaurantPhone: e.target.value })}
                  hint="(optional)"
                />
                <Input
                  label="Restaurant Email"
                  type="email"
                  id="restaurantEmail"
                  value={formData.restaurantEmail}
                  onChange={(e) => setFormData({ ...formData, restaurantEmail: e.target.value })}
                  hint="(optional)"
                />
              </div>

              <p className="text-sm font-medium text-gray-700 mt-2">Location</p>

              <Input
                label="Street Address"
                id="restaurantAddress"
                value={formData.restaurantAddress}
                onChange={(e) => setFormData({ ...formData, restaurantAddress: e.target.value })}
                placeholder="123 Main Street"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  id="restaurantCity"
                  value={formData.restaurantCity}
                  onChange={(e) => setFormData({ ...formData, restaurantCity: e.target.value })}
                  placeholder="New York"
                  required
                />
                <Input
                  label="Country"
                  id="restaurantCountry"
                  value={formData.restaurantCountry}
                  onChange={(e) => setFormData({ ...formData, restaurantCountry: e.target.value })}
                  placeholder="USA"
                  required
                />
              </div>

              <Input
                label="Postal Code"
                id="restaurantPostalCode"
                value={formData.restaurantPostalCode}
                onChange={(e) => setFormData({ ...formData, restaurantPostalCode: e.target.value })}
                placeholder="10001"
                hint="(optional)"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              id="edit-firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              id="edit-lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            id="edit-email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Phone"
            type="tel"
            id="edit-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            hint="(optional)"
          />

          <Select
            label="Role"
            id="edit-role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={ROLE_OPTIONS}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This action cannot be undone.`}
        isLoading={formLoading}
      />
    </div>
  )
}
