'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { Modal, Alert } from '@/components/ui'
import { useDeleteAccount } from './hooks'

const WarningIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const TrashIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export function DeleteAccountModal() {
  const { t } = useLanguage()
  const {
    showModal,
    step,
    loading,
    error,
    openModal,
    closeModal,
    nextStep,
    handleDelete,
  } = useDeleteAccount()

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="px-6 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
      >
        {t('profile.deleteAccountBtn')}
      </button>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={step === 1 ? t('profile.deleteAccountTitle') : t('profile.finalConfirmation')}
        icon={step === 1 ? WarningIcon : TrashIcon}
        iconColor="red"
        actions={
          step === 1
            ? [
                { label: t('common.cancel'), onClick: closeModal, variant: 'secondary' },
                { label: t('profile.yesDeleteAccount'), onClick: nextStep, variant: 'secondary' },
              ]
            : [
                { label: t('common.cancel'), onClick: closeModal, variant: 'secondary', disabled: loading },
                { label: loading ? t('profile.deleting') : t('profile.understandDelete'), onClick: handleDelete, variant: 'danger', loading },
              ]
        }
      >
        {step === 1 ? (
          <p className="text-sm text-gray-600">
            {t('profile.deleteAccountWarning')}
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-2">
              {t('profile.deleteAccountFinalWarning')}
            </p>
            <p className="text-sm font-medium text-red-600 mb-2">
              {t('profile.clickToDelete')}
            </p>
            {error && (
              <div className="mt-4">
                <Alert type="error">{error}</Alert>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  )
}
