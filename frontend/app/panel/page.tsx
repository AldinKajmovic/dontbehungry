'use client'

import { useState, useEffect } from 'react'
import { StatsCard } from '@/components/admin/StatsCard'
import { CombinedReportModal } from '@/components/admin/CombinedReportModal'
import { adminService, AdminStats, JobInfo } from '@/services/admin'
import { useLanguage } from '@/hooks/useLanguage'
import { useToast } from '@/hooks/useToast'

// Icons
const UsersIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const RestaurantsIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const OrdersIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

const RevenueIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function AdminDashboard() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [jobs, setJobs] = useState<JobInfo[]>([])
  const [selectedJob, setSelectedJob] = useState('')
  const [isExecutingJob, setIsExecutingJob] = useState(false)

  useEffect(() => {
    loadStats()
    loadJobs()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await adminService.getStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setIsLoading(false)
    }
  }

  const loadJobs = async () => {
    try {
      const data = await adminService.getJobs()
      setJobs(data)
    } catch {
      // Jobs may not be available — non-critical
    }
  }

  const handleExecuteJob = async () => {
    if (!selectedJob) return

    setIsExecutingJob(true)
    try {
      const result = await adminService.executeJob(selectedJob)
      if (result.success) {
        toast.success(`${t('admin.jobs.success')}: ${result.message}`)
      } else {
        toast.error(`${t('admin.jobs.failed')}: ${result.message}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.jobs.failed'))
    } finally {
      setIsExecutingJob(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.dashboard')}</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">{t('admin.welcomeMessage')}</p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('admin.generateReport')}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-neutral-800 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-20 mb-2" />
                  <div className="h-8 bg-gray-200 dark:bg-neutral-700 rounded w-24" />
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-neutral-700 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title={t('admin.stats.totalUsers')}
            value={stats.totalUsers.toLocaleString()}
            icon={UsersIcon}
          />
          <StatsCard
            title={t('admin.stats.restaurants')}
            value={stats.totalRestaurants.toLocaleString()}
            icon={RestaurantsIcon}
          />
          <StatsCard
            title={t('admin.stats.totalOrders')}
            value={stats.totalOrders.toLocaleString()}
            icon={OrdersIcon}
          />
          <StatsCard
            title={t('admin.stats.totalRevenue')}
            value={formatCurrency(stats.totalRevenue)}
            icon={RevenueIcon}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/panel/users"
            className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950/50 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('admin.actions.addNewUser')}</p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">{t('admin.actions.createUserAccount')}</p>
              </div>
            </div>
          </a>

          <a
            href="/panel/restaurants"
            className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950/50 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('admin.actions.addRestaurant')}</p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">{t('admin.actions.registerRestaurant')}</p>
              </div>
            </div>
          </a>

          <a
            href="/panel/orders"
            className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950/50 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('admin.actions.viewOrders')}</p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">{t('admin.actions.manageOrders')}</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Jobs */}
      {jobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.jobs.title')}</h2>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  disabled={isExecutingJob}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="">{t('admin.jobs.selectJob')}</option>
                  {jobs.map((job) => (
                    <option key={job.name} value={job.name}>
                      {job.name} — {job.description}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleExecuteJob}
                disabled={!selectedJob || isExecutingJob}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExecutingJob ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {isExecutingJob ? t('admin.jobs.executing') : t('admin.jobs.execute')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Combined Report Modal */}
      <CombinedReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  )
}
