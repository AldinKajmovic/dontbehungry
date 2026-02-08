'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { Button, Section, CropModal } from '@/components/ui'
import { useRestaurants } from './hooks'
import { RestaurantFormModal } from './RestaurantFormModal'
import { RestaurantViewModal } from './RestaurantViewModal'
import { RestaurantDeleteModal } from './RestaurantDeleteModal'

export function RestaurantSection() {
  const { t } = useLanguage()
  const {
    restaurants,
    loading,
    isRestaurantOwner,
    showFormModal,
    showViewModal,
    showDeleteModal,
    editingRestaurant,
    viewingRestaurant,
    deletingRestaurant,
    form,
    formLoading,
    deleteLoading,
    error,
    handleChange,
    handleAddressSelect,
    removeImage,
    onAddImage,
    handleImageFileChange,
    handleCropConfirm,
    handleCropCancel,
    cropSrc,
    cropConfig,
    imageInputRef,
    imageUploading,
    openAddModal,
    openEditModal,
    closeFormModal,
    openViewModal,
    closeViewModal,
    openDeleteModal,
    closeDeleteModal,
    handleSubmit,
    handleDelete,
    setOpeningHours,
  } = useRestaurants()

  if (!isRestaurantOwner) return null

  return (
    <>
      <Section
        title={t('profile.myRestaurants')}
        description={t('profile.manageRestaurants')}
        headerAction={
          <Button
            type="button"
            variant="secondary"
            className="!w-auto !py-2 !px-4 text-sm"
            onClick={openAddModal}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('profile.addRestaurant')}
            </span>
          </Button>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">{t('profile.noRestaurantsYet')}</p>
            <Button
              type="button"
              variant="secondary"
              className="!w-auto !py-2 !px-4"
              onClick={openAddModal}
            >
              {t('profile.addFirstRestaurant')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="relative p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                onClick={() => openViewModal(restaurant)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {restaurant.logoUrl ? (
                      <img
                        src={restaurant.logoUrl}
                        alt={restaurant.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{restaurant.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {restaurant.place.city}, {restaurant.place.country}
                    </p>
                    {restaurant.rating && (
                      <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {restaurant.rating}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openViewModal(restaurant)
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    View
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(restaurant)
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Edit
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDeleteModal(restaurant)
                    }}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <RestaurantFormModal
        isOpen={showFormModal}
        onClose={closeFormModal}
        editingRestaurant={editingRestaurant}
        form={form}
        formLoading={formLoading}
        error={error}
        handleChange={handleChange}
        handleAddressSelect={handleAddressSelect}
        removeImage={removeImage}
        onAddImage={onAddImage}
        imageUploading={imageUploading}
        handleSubmit={handleSubmit}
        onOpeningHoursChange={setOpeningHours}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {cropSrc && (
        <CropModal
          isOpen={!!cropSrc}
          imageSrc={cropSrc}
          cropConfig={cropConfig}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <RestaurantViewModal
        isOpen={showViewModal}
        onClose={closeViewModal}
        restaurant={viewingRestaurant}
        onEdit={() => {
          closeViewModal()
          if (viewingRestaurant) openEditModal(viewingRestaurant)
        }}
      />

      <RestaurantDeleteModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        restaurant={deletingRestaurant}
        loading={deleteLoading}
        onDelete={handleDelete}
      />
    </>
  )
}
