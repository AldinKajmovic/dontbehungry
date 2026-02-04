'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  icon: ReactNode;
  iconGradient?: 'primary' | 'secondary';
  backgroundGradient?: 'orange' | 'green';
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
  headerRight?: ReactNode;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  icon,
  iconGradient = 'primary',
  backgroundGradient = 'orange',
  footerText,
  footerLinkText,
  footerLinkHref,
  headerRight,
}: AuthLayoutProps) {
  const bgGradient = backgroundGradient === 'orange'
    ? 'from-gray-50 via-white to-orange-50'
    : 'from-gray-50 via-white to-green-50';

  const iconGradientClass = iconGradient === 'primary'
    ? 'from-primary-500 to-primary-600 shadow-primary-500/30'
    : 'from-secondary-500 to-secondary-600 shadow-secondary-500/30';

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br ${bgGradient}`}>
      {/* Language toggle in top-right corner */}
      {headerRight && (
        <div className="absolute top-4 right-4 z-10">
          {headerRight}
        </div>
      )}

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-50 animate-pulse-subtle" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-100 rounded-full blur-3xl opacity-50 animate-pulse-subtle" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo / Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${iconGradientClass} rounded-2xl shadow-lg mb-4 animate-bounce-subtle`}>
            {icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-2">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="card animate-slide-up">
          {children}
        </div>

        {/* Footer link */}
        {footerText && footerLinkHref && (
          <p className="text-center mt-6 text-gray-600 animate-fade-in">
            {footerText}{' '}
            <Link href={footerLinkHref} className="link">
              {footerLinkText}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
