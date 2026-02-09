'use client'

import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal'
import { FilterBar } from '@/components/admin/FilterBar'
import { ReportButton } from '@/components/admin/ReportButton'
import { EmailReportModal } from '@/components/admin/EmailReportModal'
import { Modal, Input, Button, Alert, Select, AddressAutocomplete, ImageUpload, CROP_CONFIGS } from '@/components/ui'
import { AdminUser } from '@/services/admin'
import { useAdminUsers } from '@/hooks/admin'

export default function UsersPage() {
  const {
    users, pagination, search, setSearch, filters, sort, isLoading, error,
    showCreateModal, setShowCreateModal, showEditModal, setShowEditModal,
    showDeleteModal, setShowDeleteModal, showEmailReportModal, setShowEmailReportModal,
    selectedUser,
    formData, setFormData, formError, formLoading, imageUploading,
    handleSearch, handlePageChange, handleLimitChange, handleSort,
    handleFilterChange, handleClearFilters,
    openCreateModal, openEditModal, openDeleteModal,
    handleCreate, handleUpdate, handleDelete,
    handleAvatarUpload, handleAvatarRemove,
    ROLE_OPTIONS, FILTER_CONFIG,
    t,
  } = useAdminUsers()

  const columns = [
    {
      key: 'email',
      header: t('admin.columns.email'),
      sortable: true,
      render: (user: AdminUser) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
          <p className="text-xs text-gray-500 dark:text-neutral-400">{user.firstName} {user.lastName}</p>
        </div>
      ),
    },
    {
      key: 'firstName',
      header: t('admin.columns.firstName'),
      sortable: true,
      render: (user: AdminUser) => <span>{user.firstName}</span>,
    },
    {
      key: 'lastName',
      header: t('admin.columns.lastName'),
      sortable: true,
      render: (user: AdminUser) => <span>{user.lastName}</span>,
    },
    {
      key: 'role',
      header: t('admin.columns.role'),
      sortable: true,
      render: (user: AdminUser) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400">
          {t(`admin.roles.${user.role}`)}
        </span>
      ),
    },
    {
      key: 'emailVerified',
      header: t('admin.columns.status'),
      sortable: true,
      render: (user: AdminUser) => (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm">{user.emailVerified ? t('admin.status.verified') : t('admin.status.pending')}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('admin.columns.phone'),
      render: (user: AdminUser) => <span className="text-gray-500 dark:text-neutral-400">{user.phone || '-'}</span>,
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.users')}</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">{t('admin.manageUsers')}</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportButton
            reportType="users"
            filters={filters}
            onEmailClick={() => setShowEmailReportModal(true)}
          />
          <Button onClick={openCreateModal} className="!w-auto !px-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('admin.addUser')}
            </span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.searchByEmailOrName')}
              className="input-field"
            />
          </div>
          <Button type="submit" variant="secondary" className="!w-auto !px-6">
            {t('common.search')}
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
        emptyMessage={t('admin.noUsersFound')}
        sortConfig={sort.sortBy ? { key: sort.sortBy, direction: sort.sortOrder || 'asc' } : undefined}
        onSort={handleSort}
        actions={(user) => (
          <>
            <button
              onClick={() => openEditModal(user)}
              className="p-2 text-gray-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => openDeleteModal(user)}
              className="p-2 text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
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
        title={t('admin.modals.addNewUser')}
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('admin.columns.firstName')}
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label={t('admin.columns.lastName')}
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label={t('admin.columns.email')}
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label={t('auth.login.passwordLabel')}
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            showPasswordToggle
          />

          <Input
            label={t('admin.columns.phone')}
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />

          <Select
            label={t('admin.roles.label')}
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={ROLE_OPTIONS}
          />

          <ImageUpload
            currentUrl={formData.avatarUrl || null}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
            uploading={imageUploading}
            shape="circle"
            label={t('profile.profilePicture')}
            hint={`(${t('common.optional')})`}
            width="w-20"
            height="h-20"
            browserFolder="avatars"
            cropConfig={CROP_CONFIGS.avatar}
          />

          {/* User Address Section */}
          <div className="border-t border-gray-200 dark:border-neutral-700 pt-4 mt-4 space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-neutral-300">{t('admin.modals.userAddress')} <span className="text-gray-400 dark:text-neutral-500 font-normal">({t('common.optional')})</span></p>

            <AddressAutocomplete
              label={t('address.streetAddress')}
              placeholder={t('address.searchPlaceholder')}
              onAddressSelect={(addr) => setFormData({
                ...formData,
                userAddress: addr.address,
                userCity: addr.city,
                userCountry: addr.country,
                userPostalCode: addr.postalCode,
                userLatitude: addr.latitude,
                userLongitude: addr.longitude,
              })}
              height="150px"
            />

            {formData.userAddress && (
              <div className="text-sm text-gray-600 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800 p-2 rounded">
                <strong>{t('address.selected')}:</strong> {formData.userAddress}, {formData.userCity}, {formData.userCountry}
              </div>
            )}
          </div>

          {/* Restaurant fields - shown when RESTAURANT_OWNER is selected */}
          {formData.role === 'RESTAURANT_OWNER' && (
            <div className="border-t border-gray-200 dark:border-neutral-700 pt-4 mt-4 space-y-4">
              <p className="text-sm font-medium text-gray-700 dark:text-neutral-300">{t('admin.modals.restaurantDetails')}</p>

              <Input
                label={t('restaurant.name')}
                id="restaurantName"
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                placeholder={t('restaurant.namePlaceholder')}
                required
              />

              <div>
                <label htmlFor="restaurantDescription" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  {t('restaurant.description')} <span className="text-gray-400 dark:text-neutral-500 font-normal">({t('common.optional')})</span>
                </label>
                <textarea
                  id="restaurantDescription"
                  value={formData.restaurantDescription}
                  onChange={(e) => setFormData({ ...formData, restaurantDescription: e.target.value })}
                  placeholder={t('restaurant.descriptionPlaceholder')}
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('restaurant.phone')}
                  type="tel"
                  id="restaurantPhone"
                  value={formData.restaurantPhone}
                  onChange={(e) => setFormData({ ...formData, restaurantPhone: e.target.value })}
                  hint={`(${t('common.optional')})`}
                />
                <Input
                  label={t('restaurant.email')}
                  type="email"
                  id="restaurantEmail"
                  value={formData.restaurantEmail}
                  onChange={(e) => setFormData({ ...formData, restaurantEmail: e.target.value })}
                  hint={`(${t('common.optional')})`}
                />
              </div>

              <p className="text-sm font-medium text-gray-700 dark:text-neutral-300 mt-2">{t('admin.modals.location')}</p>

              <AddressAutocomplete
                label={t('address.streetAddress')}
                placeholder={t('address.searchPlaceholder')}
                onAddressSelect={(addr) => setFormData({
                  ...formData,
                  restaurantAddress: addr.address,
                  restaurantCity: addr.city,
                  restaurantCountry: addr.country,
                  restaurantPostalCode: addr.postalCode,
                  restaurantLatitude: addr.latitude,
                  restaurantLongitude: addr.longitude,
                })}
                height="150px"
              />

              {formData.restaurantAddress && (
                <div className="text-sm text-gray-600 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800 p-2 rounded">
                  <strong>{t('address.selected')}:</strong> {formData.restaurantAddress}, {formData.restaurantCity}, {formData.restaurantCountry}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              {t('admin.buttons.createUser')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('admin.modals.editUser')}
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('admin.columns.firstName')}
              id="edit-firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label={t('admin.columns.lastName')}
              id="edit-lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label={t('admin.columns.email')}
            type="email"
            id="edit-email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label={t('admin.columns.phone')}
            type="tel"
            id="edit-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />

          <Select
            label={t('admin.roles.label')}
            id="edit-role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={ROLE_OPTIONS}
          />

          <ImageUpload
            currentUrl={formData.avatarUrl || null}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
            uploading={imageUploading}
            shape="circle"
            label={t('profile.profilePicture')}
            hint={`(${t('common.optional')})`}
            width="w-20"
            height="h-20"
            browserFolder="avatars"
            cropConfig={CROP_CONFIGS.avatar}
          />

          {/* User Address Section */}
          <div className="border-t border-gray-200 dark:border-neutral-700 pt-4 mt-4 space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-neutral-300">{t('admin.modals.userAddress')}</p>

            {formData.userAddress && (
              <div className="text-sm text-gray-600 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800 p-2 rounded mb-2">
                <strong>{t('address.current')}:</strong> {formData.userAddress}, {formData.userCity}, {formData.userCountry}
              </div>
            )}

            <AddressAutocomplete
              label={t('address.newAddress')}
              placeholder={t('address.searchPlaceholder')}
              onAddressSelect={(addr) => setFormData({
                ...formData,
                userAddress: addr.address,
                userCity: addr.city,
                userCountry: addr.country,
                userPostalCode: addr.postalCode,
                userLatitude: addr.latitude,
                userLongitude: addr.longitude,
              })}
              height="150px"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              {t('admin.buttons.saveChanges')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('admin.modals.deleteUser')}
        message={t('admin.confirmDelete.user').replace('{name}', `${selectedUser?.firstName} ${selectedUser?.lastName}`)}
        isLoading={formLoading}
      />

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={showEmailReportModal}
        onClose={() => setShowEmailReportModal(false)}
        reportType="users"
        filters={filters}
      />
    </div>
  )
}
