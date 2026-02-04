'use client'

import { useState, FormEvent } from 'react'
import { Modal, Button, Alert, Input } from '@/components/ui'
import { reportsService, ReportType } from '@/services/admin'
import { useLanguage } from '@/hooks/useLanguage'

interface EmailReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportType: ReportType
  filters?: Record<string, string | undefined>
}

export function EmailReportModal({
  isOpen,
  onClose,
  reportType,
  filters,
}: EmailReportModalProps) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const reportTypeName = t(`admin.reports.types.${reportType}`)
  const defaultSubject = `Admin Report - ${reportTypeName} - ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!email) {
      setError(t('admin.reports.emailRequired'))
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(t('admin.reports.invalidEmail'))
      return
    }

    try {
      setIsLoading(true)
      await reportsService.emailReport({
        reportType,
        email,
        subject: subject || defaultSubject,
        message: message || undefined,
        filters,
      })
      setSuccess(true)
      // Reset form after 2 seconds and close
      setTimeout(() => {
        setEmail('')
        setSubject('')
        setMessage('')
        setSuccess(false)
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.reports.sendFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setEmail('')
      setSubject('')
      setMessage('')
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('admin.reports.emailTitle', { type: reportTypeName })}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }
      iconColor="primary"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{t('admin.reports.sentSuccess')}</Alert>}

        <Input
          label={t('admin.reports.recipientEmail')}
          id="report-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          disabled={isLoading || success}
        />

        <div>
          <label htmlFor="report-subject" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.reports.subject')} <span className="text-gray-400 font-normal">({t('common.optional')})</span>
          </label>
          <input
            id="report-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={defaultSubject}
            className="input-field"
            disabled={isLoading || success}
          />
        </div>

        <div>
          <label htmlFor="report-message" className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.reports.message')} <span className="text-gray-400 font-normal">({t('common.optional')})</span>
          </label>
          <textarea
            id="report-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('admin.reports.addCustomMessage')}
            rows={3}
            className="input-field resize-none"
            disabled={isLoading || success}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isLoading}
            disabled={success}
          >
            {t('admin.reports.sendReport')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
