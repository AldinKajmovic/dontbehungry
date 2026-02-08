'use client'

import { useState } from 'react'

export function useAdminModals() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEmailReportModal, setShowEmailReportModal] = useState(false)

  return {
    showCreateModal, setShowCreateModal,
    showEditModal, setShowEditModal,
    showDeleteModal, setShowDeleteModal,
    showEmailReportModal, setShowEmailReportModal,
  }
}
