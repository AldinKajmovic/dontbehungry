import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { verifyToken } from '../utils/jwt'
import { config } from '../config'
import { JwtPayload } from '../types'
import { logger } from '../utils/logger'

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload
}

const userSockets = new Map<string, Set<string>>()
const adminSockets = new Set<string>()

let io: Server | null = null

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
  })

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Authentication error: No token provided'))
    }

    try {
      const payload = verifyToken(token)
      socket.user = payload
      next()
    } catch {
      next(new Error('Authentication error: Invalid token'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.userId
    const userRole = socket.user?.role

    if (userId) {
      const isAdmin = userRole === 'ADMIN'

      if (isAdmin) {
        // Track admin sockets separately
        adminSockets.add(socket.id)
        logger.debug('Admin connected', { userId, socketId: socket.id })
      } else {
        // Track regular user sockets
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set())
        }
        userSockets.get(userId)!.add(socket.id)
        logger.debug('User connected', { userId, socketId: socket.id })
      }

      socket.on('disconnect', () => {
        if (isAdmin) {
          adminSockets.delete(socket.id)
          logger.debug('Admin disconnected', { userId, socketId: socket.id })
        } else {
          const sockets = userSockets.get(userId)
          if (sockets) {
            sockets.delete(socket.id)
            if (sockets.size === 0) {
              userSockets.delete(userId)
            }
          }
          logger.debug('User disconnected', { userId, socketId: socket.id })
        }
      })
    }
  })

  return io
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized')
  }
  return io
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  const sockets = userSockets.get(userId)
  if (sockets && io) {
    sockets.forEach((socketId) => {
      io!.to(socketId).emit(event, data)
    })
  }
}

export function isUserConnected(userId: string): boolean {
  const sockets = userSockets.get(userId)
  return !!sockets && sockets.size > 0
}

export function emitToAdmins(event: string, data: unknown): void {
  if (io && adminSockets.size > 0) {
    adminSockets.forEach((socketId) => {
      io!.to(socketId).emit(event, data)
    })
  }
}
