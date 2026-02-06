'use client'

import { Button, Section } from '@/components/ui'
import { useDriverAvailability } from './hooks/useDriverAvailability'
import { useLanguage } from '@/hooks/useLanguage'

// Map English month names to translation keys
const monthKeyMap: Record<string, string> = {
  'January': 'january',
  'February': 'february',
  'March': 'march',
  'April': 'april',
  'May': 'may',
  'June': 'june',
  'July': 'july',
  'August': 'august',
  'September': 'september',
  'October': 'october',
  'November': 'november',
  'December': 'december',
}

export function DriverAvailabilitySection() {
  const { t } = useLanguage()
  const {
    isDriver,
    isOnline,
    formattedElapsedTime,
    hasStartedWorking,
    monthlyHours,
    totalHours,
    loading,
    toggling,
    error,
    locationError,
    toggle,
  } = useDriverAvailability()

  // Get localized month name
  const getLocalizedMonthName = (englishName: string): string => {
    const key = monthKeyMap[englishName]
    return key ? t(`profile.availability.months.${key}`) : englishName
  }

  if (!isDriver) return null

  return (
    <Section
      title={t('profile.availability.title')}
      description={t('profile.availability.description')}
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Location Error Message */}
        {locationError && isOnline && (
          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-start gap-2">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">{t('profile.availability.locationWarning')}</p>
              <p className="text-xs mt-0.5">{locationError}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Status Toggle Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                {/* Status Indicator */}
                <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <p className="font-medium text-gray-900">
                    {isOnline ? t('profile.availability.online') : t('profile.availability.offline')}
                  </p>
                  {isOnline && (
                    <p className="text-sm text-gray-600">
                      {hasStartedWorking
                        ? `${t('profile.availability.workingTime')}: ${formattedElapsedTime}`
                        : t('profile.availability.waitingForOrders')
                      }
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant={isOnline ? 'secondary' : 'primary'}
                className="!w-auto !py-2 !px-6"
                onClick={toggle}
                disabled={toggling}
              >
                {toggling ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    {t('profile.availability.updating')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isOnline ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        {t('profile.availability.goOffline')}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('profile.availability.goOnline')}
                      </>
                    )}
                  </span>
                )}
              </Button>
            </div>

            {/* Monthly Hours Table */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('profile.availability.monthlyHours')}</h3>
              {monthlyHours.length === 0 ? (
                <p className="text-sm text-gray-500">{t('profile.availability.noShiftHistory')}</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-600">{t('profile.availability.month')}</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">{t('profile.availability.shifts')}</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">{t('profile.availability.hours')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyHours.map((month) => (
                          <tr
                            key={month.month}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-2 px-3 text-gray-900">
                              {getLocalizedMonthName(month.monthName)} {month.year}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-600">
                              {month.shiftCount}
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-gray-900">
                              {month.totalHours.toFixed(1)}{t('profile.availability.hoursUnit')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td className="py-2 px-3 font-semibold text-gray-900">{t('profile.availability.total')}</td>
                          <td className="py-2 px-3 text-right text-gray-600">
                            {monthlyHours.reduce((sum, m) => sum + m.shiftCount, 0)}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-primary-600">
                            {totalHours.toFixed(1)}{t('profile.availability.hoursUnit')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('profile.availability.showingLast6Months')}
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Section>
  )
}
