'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/useAuth'
import api from '@/services/api'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
  children: ReactNode
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL
const SKIP_SOCKET_PATHS = ['/auth/']

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const pathname = usePathname()

  const shouldSkipSocket = SKIP_SOCKET_PATHS.some(path => pathname?.startsWith(path))

  const getSocketToken = useCallback(async (retries = 3): Promise<string | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await api.get<{ token: string }>('/api/auth/socket-token')
        return response.data.token
      } catch (error) {
        console.error(`Failed to get socket token (attempt ${attempt}/${retries}):`, error)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt))
        }
      }
    }
    return null
  }, [])

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    if (shouldSkipSocket) {
      disconnectSocket()
      return
    }

    if (authLoading) return

    if (!isAuthenticated || !user) {
      disconnectSocket()
      return
    }

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return
    }

    if (socketRef.current?.connected) {
      return
    }
    const initSocket = async () => {
      if (shouldSkipSocket || !isAuthenticated) return
      const { io } = await import('socket.io-client')
      const token = await getSocketToken()

      if (!token) {
        console.error('No socket token available')
        return
      }

      if (shouldSkipSocket || !isAuthenticated) return

      const newSocket = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: false, // Disable auto-reconnect to prevent 401 loops
      })

      newSocket.on('connect', () => {
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message)
        setIsConnected(false)
      })

      socketRef.current = newSocket
      setSocket(newSocket)
    }

    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [authLoading, isAuthenticated, user?.id, user?.role, getSocketToken, shouldSkipSocket, disconnectSocket])

  const value: SocketContextType = {
    socket,
    isConnected,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext)
  if (context === undefined) {
    return { socket: null, isConnected: false }
  }
  return context
}
