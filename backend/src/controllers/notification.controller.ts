import { Response, NextFunction } from 'express'
import * as notificationService from '../services/notification.service'
import { BadRequestError } from '../utils/errors'
import { AuthenticatedRequest } from '../types'

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { page, limit } = req.query

    let pageNum = 1
    let limitNum = 5

    if (page) {
      pageNum = parseInt(page as string, 10)
      if (isNaN(pageNum) || pageNum < 1) {
        throw new BadRequestError('Invalid page', 'page must be a positive integer')
      }
    }

    if (limit) {
      limitNum = parseInt(limit as string, 10)
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new BadRequestError('Invalid limit', 'limit must be between 1 and 100')
      }
    }

    const result = await notificationService.getNotifications(req.user.userId, pageNum, limitNum)

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getUnreadCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const count = await notificationService.getUnreadCount(req.user.userId)

    res.json({ count })
  } catch (error) {
    next(error)
  }
}

export async function markAsRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { id } = req.params
    const notificationId = Array.isArray(id) ? id[0] : id

    if (!notificationId) {
      throw new BadRequestError('Invalid ID', 'Notification ID is required')
    }

    const notification = await notificationService.markAsRead(notificationId, req.user.userId)

    res.json({
      message: 'Notification marked as read',
      notification,
    })
  } catch (error) {
    next(error)
  }
}

export async function markAllAsRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const result = await notificationService.markAllAsRead(req.user.userId)

    res.json({
      message: 'All notifications marked as read',
      count: result.count,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteNotification(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new BadRequestError('Unauthorized', 'User not authenticated')
    }

    const { id } = req.params
    const notificationId = Array.isArray(id) ? id[0] : id

    if (!notificationId) {
      throw new BadRequestError('Invalid ID', 'Notification ID is required')
    }

    await notificationService.deleteNotification(notificationId, req.user.userId)

    res.json({
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
