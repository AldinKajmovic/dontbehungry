'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { Input, Button, Alert, Section } from '@/components/ui'
import { usePasswordForm } from './hooks'

export function PasswordForm() {
  const { t } = useLanguage()
  const {
    form,
    loading,
    success,
    error,
    handleChange,
    handleSubmit,
  } = usePasswordForm()

  return (
    <Section title={t('profile.changePassword')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {success && <Alert type="success">{success}</Alert>}
        {error && <Alert type="error">{error}</Alert>}

        <Input
          label={t('profile.currentPassword')}
          type="password"
          id="currentPassword"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleChange}
          placeholder={t('profile.enterCurrentPassword')}
          showPasswordToggle
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('profile.newPassword')}
            type="password"
            id="newPassword"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder={t('profile.enterNewPassword')}
            showPasswordToggle
          />
          <Input
            label={t('profile.confirmNewPassword')}
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder={t('profile.confirmNewPasswordPlaceholder')}
            showPasswordToggle
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-neutral-400">
          {t('profile.passwordTooShort')}
        </p>

        <Button type="submit" isLoading={loading} className="!w-auto !px-6">
          {loading ? t('profile.changing') : t('profile.changePassword')}
        </Button>
      </form>
    </Section>
  )
}
