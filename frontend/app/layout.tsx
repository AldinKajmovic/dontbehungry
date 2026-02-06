import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { NextAuthProvider } from '@/providers/NextAuthProvider'
import { CartProvider } from '@/providers/CartProvider'
import { SocketProvider } from '@/providers/SocketProvider'
import { NotificationProvider } from '@/providers/NotificationProvider'
import { LanguageProvider } from '@/providers/LanguageProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { ToastContainer } from '@/components/ui'
import DriverOrderQueueOverlay from '@/components/driver/DriverOrderQueueOverlay'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Glovo Copy - Food Delivery',
  description: 'Order food from your favorite restaurants',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <LanguageProvider>
            <AuthProvider>
              <SocketProvider>
                <NotificationProvider>
                  <ToastProvider>
                    <CartProvider>
                      {children}
                      <ToastContainer />
                      <DriverOrderQueueOverlay />
                    </CartProvider>
                  </ToastProvider>
                </NotificationProvider>
              </SocketProvider>
            </AuthProvider>
          </LanguageProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
