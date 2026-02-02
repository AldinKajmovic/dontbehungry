import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { NextAuthProvider } from '@/providers/NextAuthProvider'
import { CartProvider } from '@/providers/CartProvider'
import { SocketProvider } from '@/providers/SocketProvider'
import { NotificationProvider } from '@/providers/NotificationProvider'

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
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <CartProvider>{children}</CartProvider>
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
