'use client'

import { Modal } from '@/components/ui'
import { MyRestaurant } from '@/services/profile'

interface RestaurantDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  restaurant: MyRestaurant | null
  loading: boolean
  onDelete: () => void
}

const TrashIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export function RestaurantDeleteModal({
  isOpen,
  onClose,
  restaurant,
  loading,
  onDelete,
}: RestaurantDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Restaurant?"
      icon={TrashIcon}
      iconColor="red"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'secondary', disabled: loading },
        { label: loading ? 'Deleting...' : 'Delete', onClick: onDelete, variant: 'danger', loading },
      ]}
    >
      <p className="text-sm text-gray-600 dark:text-neutral-400">
        Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">{restaurant?.name}</span>? This will also delete all menu items associated with this restaurant. This action cannot be undone.
      </p>
    </Modal>
  )
}
