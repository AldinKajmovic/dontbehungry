'use client'

import { useState, FormEvent } from 'react'
import { Modal, Button, Alert } from '@/components/ui'
import { reportsService, ReportType } from '@/services/admin'

interface CombinedReportModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SectionOption {
  value: ReportType
  label: string
  description: string
}

const SECTIONS: SectionOption[] = [
  { value: 'orders', label: 'Orders', description: 'All order data including status, totals, and customers' },
  { value: 'restaurants', label: 'Restaurants', description: 'Restaurant listings with ratings and contact info' },
  { value: 'users', label: 'Users', description: 'User accounts with roles and verification status' },
  { value: 'reviews', label: 'Reviews', description: 'Customer reviews and ratings' },
  { value: 'categories', label: 'Categories', description: 'Food categories for menu organization' },
  { value: 'menuItems', label: 'Menu Items', description: 'Restaurant menu items with prices' },
  { value: 'places', label: 'Places', description: 'Delivery addresses and locations' },
]

type ReportMode = 'download' | 'email'

export function CombinedReportModal({ isOpen, onClose }: CombinedReportModalProps) {
  const [selectedSections, setSelectedSections] = useState<Set<ReportType>>(new Set())
  const [mode, setMode] = useState<ReportMode>('download')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const toggleSection = (section: ReportType) => {
    const newSections = new Set(selectedSections)
    if (newSections.has(section)) {
      newSections.delete(section)
    } else {
      newSections.add(section)
    }
    setSelectedSections(newSections)
  }

  const selectAll = () => {
    setSelectedSections(new Set(SECTIONS.map(s => s.value)))
  }

  const clearAll = () => {
    setSelectedSections(new Set())
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (selectedSections.size === 0) {
      setError('Please select at least one section')
      return
    }

    const sections = Array.from(selectedSections)

    if (mode === 'email') {
      if (!email) {
        setError('Email address is required')
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address')
        return
      }
    }

    try {
      setIsLoading(true)

      if (mode === 'download') {
        await reportsService.downloadCombinedReport(sections)
        handleClose()
      } else {
        const defaultSubject = `Admin Combined Report - ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
        await reportsService.emailReport({
          reportType: 'combined',
          email,
          subject: subject || defaultSubject,
          message: message || undefined,
          sections,
        })
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setSelectedSections(new Set())
      setMode('download')
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
      title="Generate Combined Report"
      size="lg"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      iconColor="primary"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">Report sent successfully!</Alert>}

        {/* Delivery Method Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Method
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('download')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'download'
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'email'
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </span>
            </button>
          </div>
        </div>

        {/* Section Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Sections ({selectedSections.size} selected)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {SECTIONS.map((section) => (
              <label
                key={section.value}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSections.has(section.value)
                    ? 'bg-primary-50 border border-primary-200'
                    : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSections.has(section.value)}
                  onChange={() => toggleSection(section.value)}
                  className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{section.label}</p>
                  <p className="text-xs text-gray-500">{section.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Email Fields (only shown when mode is 'email') */}
        {mode === 'email' && (
          <>
            <div>
              <label htmlFor="combined-email" className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email
              </label>
              <input
                id="combined-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="input-field"
                required={mode === 'email'}
                disabled={isLoading || success}
              />
            </div>

            <div>
              <label htmlFor="combined-subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="combined-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Admin Combined Report"
                className="input-field"
                disabled={isLoading || success}
              />
            </div>

            <div>
              <label htmlFor="combined-message" className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="combined-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a custom message to the email..."
                rows={2}
                className="input-field resize-none"
                disabled={isLoading || success}
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isLoading}
            disabled={success || selectedSections.size === 0}
          >
            {mode === 'download' ? 'Download Report' : 'Send Report'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
