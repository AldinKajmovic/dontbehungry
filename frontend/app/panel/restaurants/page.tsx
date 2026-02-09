'use client'

import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal'
import { RangeFilter } from '@/components/admin/RangeFilter'
import { ReportButton } from '@/components/admin/ReportButton'
import { EmailReportModal } from '@/components/admin/EmailReportModal'
import { Modal, Input, Button, Alert, SearchableSelect, AddressAutocomplete, OpeningHoursForm } from '@/components/ui'
import { ImageBrowserModal } from '@/components/admin/ImageBrowserModal'
import { AdminRestaurant } from '@/services/admin'
import { profileService } from '@/services/profile'
import { CropModal } from '@/components/ui/CropModal'
import { CROP_CONFIGS } from '@/components/ui/cropUtils'
import { useAdminRestaurants } from '@/hooks/admin'

export default function RestaurantsPage() {
  const {
    restaurants, pagination, search, setSearch, filters, sort, isLoading, error,
    showCreateModal, setShowCreateModal, showEditModal, setShowEditModal,
    showDeleteModal, setShowDeleteModal, showEmailReportModal, setShowEmailReportModal,
    showImageBrowser, setShowImageBrowser, selectedRestaurant,
    formData, setFormData, formError, formLoading, imageUploading, prefillLoading,
    imageInputRef, cropSrc, setCropSrc, currentCropConfig, setCurrentCropConfig,
    handleSearch, handlePageChange, handleLimitChange, handleSort,
    handleFilterChange, handleClearFilters, hasActiveFilters,
    openCreateModal, openEditModal, openDeleteModal,
    handleCreate, handleUpdate, handleDelete,
    handleImageFileChange, handleCropConfirm, handleCropCancel,
    loadOwnerOptions, loadPlaceOptions,
    t,
  } = useAdminRestaurants()

  const columns = [
    {
      key: 'name',
      header: t('admin.columns.restaurant'),
      sortable: true,
      render: (restaurant: AdminRestaurant) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{restaurant.name}</p>
          <p className="text-xs text-gray-500 dark:text-neutral-400">{restaurant.place.city}, {restaurant.place.country}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: t('admin.columns.owner'),
      render: (restaurant: AdminRestaurant) => (
        <div>
          <p className="text-sm">{restaurant.owner.firstName} {restaurant.owner.lastName}</p>
          <p className="text-xs text-gray-500 dark:text-neutral-400">{restaurant.owner.email}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: t('admin.columns.rating'),
      sortable: true,
      render: (restaurant: AdminRestaurant) => (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm">{parseFloat(restaurant.rating).toFixed(1)}</span>
        </div>
      ),
    },
    {
      key: 'minOrderAmount',
      header: t('admin.columns.minOrder'),
      sortable: true,
      render: (restaurant: AdminRestaurant) => (
        <span className="text-sm">${restaurant.minOrderAmount || '0'}</span>
      ),
    },
    {
      key: 'deliveryFee',
      header: t('admin.columns.deliveryFee'),
      sortable: true,
      render: (restaurant: AdminRestaurant) => (
        <span className="text-sm">${restaurant.deliveryFee || '0'}</span>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.restaurants')}</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">{t('admin.manageRestaurants')}</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportButton
            reportType="restaurants"
            filters={filters}
            onEmailClick={() => setShowEmailReportModal(true)}
          />
          <Button onClick={openCreateModal} className="!w-auto !px-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('admin.actions.addRestaurant')}
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
              placeholder={t('admin.searchByNameOrEmail')}
              className="input-field"
            />
          </div>
          <Button type="submit" variant="secondary" className="!w-auto !px-6">
            {t('common.search')}
          </Button>
        </div>
      </form>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <SearchableSelect
              label={t('admin.filters.owner')}
              id="filter-owner"
              value={filters.ownerId || ''}
              onChange={(value) => handleFilterChange('ownerId', value)}
              loadOptions={loadOwnerOptions}
              placeholder={t('admin.filters.allOwners')}
              emptyMessage={t('admin.modals.noUsersFound')}
            />
          </div>
          <RangeFilter
            label={t('admin.filters.rating')}
            minValue={filters.minRating || ''}
            maxValue={filters.maxRating || ''}
            onMinChange={(value) => handleFilterChange('minRating', value)}
            onMaxChange={(value) => handleFilterChange('maxRating', value)}
            min={0}
            max={5}
            step={0.1}
          />
          <RangeFilter
            label={t('admin.columns.deliveryFee')}
            minValue={filters.minDeliveryFee || ''}
            maxValue={filters.maxDeliveryFee || ''}
            onMinChange={(value) => handleFilterChange('minDeliveryFee', value)}
            onMaxChange={(value) => handleFilterChange('maxDeliveryFee', value)}
            min={0}
            max={100}
            step={0.5}
            prefix="$"
          />
          <RangeFilter
            label={t('admin.filters.minOrderAmount')}
            minValue={filters.minOrderAmount || ''}
            maxValue={filters.maxOrderAmount || ''}
            onMinChange={(value) => handleFilterChange('minOrderAmount', value)}
            onMaxChange={(value) => handleFilterChange('maxOrderAmount', value)}
            min={0}
            max={500}
            step={1}
            prefix="$"
          />
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              {t('admin.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {/* Table */}
      <DataTable
        columns={columns}
        data={restaurants}
        keyField="id"
        isLoading={isLoading}
        emptyMessage={t('admin.noRestaurantsFound')}
        sortConfig={sort.sortBy ? { key: sort.sortBy, direction: sort.sortOrder || 'asc' } : undefined}
        onSort={handleSort}
        actions={(restaurant) => (
          <>
            <button
              onClick={() => openEditModal(restaurant)}
              className="p-2 text-gray-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => openDeleteModal(restaurant)}
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
        title={t('admin.modals.addNewRestaurant')}
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            label={t('restaurant.name')}
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label={t('restaurant.description')}
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            hint={`(${t('common.optional')})`}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('restaurant.phone')}
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label={t('restaurant.email')}
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              hint={`(${t('common.optional')})`}
            />
          </div>

          <SearchableSelect
            label={t('admin.filters.owner')}
            id="ownerId"
            value={formData.ownerId}
            onChange={(value) => setFormData({ ...formData, ownerId: value })}
            loadOptions={loadOwnerOptions}
            placeholder={t('admin.modals.searchUsers')}
            emptyMessage={t('admin.modals.noUsersFound')}
            required
          />

          {/* Place selection: toggle between existing and new */}
          <div className="border-t border-gray-200 dark:border-neutral-700 pt-4 mt-4">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="placeMode"
                  checked={!formData.createNewPlace}
                  onChange={() => setFormData({ ...formData, createNewPlace: false })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">{t('admin.modals.selectExistingPlace')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="placeMode"
                  checked={formData.createNewPlace}
                  onChange={() => setFormData({ ...formData, createNewPlace: true, placeId: '' })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">{t('admin.modals.createNewPlace')}</span>
              </label>
            </div>

            {!formData.createNewPlace ? (
              <SearchableSelect
                label={t('admin.modals.place')}
                id="placeId"
                value={formData.placeId}
                onChange={(value) => setFormData({ ...formData, placeId: value })}
                loadOptions={loadPlaceOptions}
                placeholder={t('admin.modals.searchPlaces')}
                emptyMessage={t('admin.modals.noPlacesFound')}
                required
              />
            ) : (
              <div className="space-y-4">
                <AddressAutocomplete
                  label={t('address.streetAddress')}
                  placeholder={t('address.searchPlaceholder')}
                  onAddressSelect={(addr) => setFormData({
                    ...formData,
                    newPlaceAddress: addr.address,
                    newPlaceCity: addr.city,
                    newPlaceCountry: addr.country,
                    newPlacePostalCode: addr.postalCode,
                    newPlaceLatitude: addr.latitude,
                    newPlaceLongitude: addr.longitude,
                  })}
                  height="150px"
                />
                {formData.newPlaceAddress && (
                  <div className="text-sm text-gray-600 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800 p-2 rounded">
                    <strong>{t('address.selected')}:</strong> {formData.newPlaceAddress}, {formData.newPlaceCity}, {formData.newPlaceCountry}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 items-start">
            <Input
              label={t('admin.columns.minOrder')}
              type="number"
              step="0.01"
              id="minOrderAmount"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              prefix="$"
              hint={`(${t('common.optional')})`}
            />
            <Input
              label={t('admin.columns.deliveryFee')}
              type="number"
              step="0.01"
              id="deliveryFee"
              value={formData.deliveryFee}
              onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
              prefix="$"
              hint={`(${t('common.optional')})`}
            />
          </div>

          {/* Gallery Section */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium mb-2">{t('admin.modals.gallery')}</p>
            <div className="grid grid-cols-3 gap-3">
              {formData.images.map((imgUrl, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
                    <img
                      src={imgUrl}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imgUrl.startsWith('https://storage.googleapis.com/')) {
                          profileService.deleteImage(imgUrl).catch(() => {})
                        }
                        setFormData((prev) => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index)
                        }))
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {/* Add new image button */}
              {formData.images.length < 6 && (
                <button
                  type="button"
                  className="group flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-800 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors cursor-pointer"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? (
                    <svg className="w-8 h-8 text-gray-400 dark:text-neutral-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-gray-400 dark:text-neutral-500 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <span className="text-xs text-gray-500 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mt-1">{formData.images.length} / 6</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xs text-gray-400 dark:text-neutral-500">{t('admin.modals.clickToAddImages')}</p>
              <button
                type="button"
                onClick={() => setShowImageBrowser(true)}
                className="text-xs text-primary-600 hover:text-primary-700 underline"
              >
                {t('upload.browseExisting')}
              </button>
            </div>
          </div>

          <OpeningHoursForm
            value={formData.openingHours}
            onChange={(hours) => setFormData((prev) => ({ ...prev, openingHours: hours }))}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              {t('admin.buttons.createRestaurant')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('admin.modals.editRestaurant')}
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            label={t('restaurant.name')}
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label={t('restaurant.description')}
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            hint={`(${t('common.optional')})`}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('restaurant.phone')}
              type="tel"
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label={t('restaurant.email')}
              type="email"
              id="edit-email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              hint={`(${t('common.optional')})`}
            />
          </div>

          <SearchableSelect
            label={t('admin.filters.owner')}
            id="edit-ownerId"
            value={formData.ownerId}
            onChange={(value) => setFormData({ ...formData, ownerId: value })}
            loadOptions={loadOwnerOptions}
            placeholder={t('admin.modals.searchUsers')}
            emptyMessage={t('admin.modals.noUsersFound')}
            initialLabel={selectedRestaurant ? `${selectedRestaurant.owner.firstName} ${selectedRestaurant.owner.lastName}` : undefined}
            required
          />

          {/* Place selection: toggle between existing and new */}
          <div className="border-t border-gray-200 dark:border-neutral-700 pt-4 mt-4">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-placeMode"
                  checked={!formData.createNewPlace}
                  onChange={() => setFormData({ ...formData, createNewPlace: false })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">{t('admin.modals.selectExistingPlace')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-placeMode"
                  checked={formData.createNewPlace}
                  onChange={() => setFormData({ ...formData, createNewPlace: true, placeId: '' })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">{t('admin.modals.createNewPlace')}</span>
              </label>
            </div>

            {!formData.createNewPlace ? (
              <SearchableSelect
                label={t('admin.modals.place')}
                id="edit-placeId"
                value={formData.placeId}
                onChange={(value) => setFormData({ ...formData, placeId: value })}
                loadOptions={loadPlaceOptions}
                placeholder={t('admin.modals.searchPlaces')}
                emptyMessage={t('admin.modals.noPlacesFound')}
                initialLabel={selectedRestaurant ? `${selectedRestaurant.place.address}, ${selectedRestaurant.place.city}` : undefined}
                required
              />
            ) : (
              <div className="space-y-4">
                <AddressAutocomplete
                  label={t('address.streetAddress')}
                  placeholder={t('address.searchPlaceholder')}
                  onAddressSelect={(addr) => setFormData({
                    ...formData,
                    newPlaceAddress: addr.address,
                    newPlaceCity: addr.city,
                    newPlaceCountry: addr.country,
                    newPlacePostalCode: addr.postalCode,
                    newPlaceLatitude: addr.latitude,
                    newPlaceLongitude: addr.longitude,
                  })}
                  height="150px"
                />
                {formData.newPlaceAddress && (
                  <div className="text-sm text-gray-600 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800 p-2 rounded">
                    <strong>{t('address.selected')}:</strong> {formData.newPlaceAddress}, {formData.newPlaceCity}, {formData.newPlaceCountry}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 items-start">
            <Input
              label={t('admin.columns.minOrder')}
              type="number"
              step="0.01"
              id="edit-minOrderAmount"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              prefix="$"
              hint={`(${t('common.optional')})`}
            />
            <Input
              label={t('admin.columns.deliveryFee')}
              type="number"
              step="0.01"
              id="edit-deliveryFee"
              value={formData.deliveryFee}
              onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
              prefix="$"
              hint={`(${t('common.optional')})`}
            />
          </div>

          {/* Gallery Section */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium mb-2">{t('admin.modals.gallery')}</p>
            <div className="grid grid-cols-3 gap-3">
              {formData.images.map((imgUrl, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
                    <img
                      src={imgUrl}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imgUrl.startsWith('https://storage.googleapis.com/')) {
                          profileService.deleteImage(imgUrl).catch(() => {})
                        }
                        setFormData((prev) => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index)
                        }))
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {/* Add new image button */}
              {formData.images.length < 6 && (
                <button
                  type="button"
                  className="group flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-800 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors cursor-pointer"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? (
                    <svg className="w-8 h-8 text-gray-400 dark:text-neutral-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-gray-400 dark:text-neutral-500 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <span className="text-xs text-gray-500 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mt-1">{formData.images.length} / 6</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xs text-gray-400 dark:text-neutral-500">{t('admin.modals.clickToAddImages')}</p>
              <button
                type="button"
                onClick={() => setShowImageBrowser(true)}
                className="text-xs text-primary-600 hover:text-primary-700 underline"
              >
                {t('upload.browseExisting')}
              </button>
            </div>
          </div>

          <OpeningHoursForm
            value={formData.openingHours}
            onChange={(hours) => setFormData((prev) => ({ ...prev, openingHours: hours }))}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading || prefillLoading} disabled={prefillLoading}>
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
        title={t('admin.modals.deleteRestaurant')}
        message={t('admin.confirmDelete.restaurant').replace('{name}', selectedRestaurant?.name || '')}
        isLoading={formLoading}
      />

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={showEmailReportModal}
        onClose={() => setShowEmailReportModal(false)}
        reportType="restaurants"
        filters={filters}
      />

      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />

      {cropSrc && (
        <CropModal
          isOpen={!!cropSrc}
          imageSrc={cropSrc}
          cropConfig={currentCropConfig}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* Image Browser Modal */}
      <ImageBrowserModal
        isOpen={showImageBrowser}
        onClose={() => setShowImageBrowser(false)}
        onSelect={(url) => {
          setShowImageBrowser(false)
          const imageCount = formData.images.length
          const config = imageCount === 0
            ? CROP_CONFIGS['restaurant-logo']
            : imageCount === 1
              ? CROP_CONFIGS['restaurant-cover']
              : CROP_CONFIGS['restaurant-gallery']
          setCurrentCropConfig(config)
          setCropSrc(url)
        }}
        defaultFolder="restaurants"
      />
    </div>
  )
}
