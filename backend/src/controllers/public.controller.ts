import { Request, Response, NextFunction } from 'express'
import * as publicRestaurantsService from '../services/public/restaurants.service'

// Type for routes with ID parameter
type IdParams = { id: string }

// Get all restaurants (public)
export async function getRestaurants(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12))
    const search = req.query.search as string | undefined
    const sortBy = req.query.sortBy as string | undefined
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc'
    const categoryId = req.query.categoryId as string | undefined
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined
    const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined
    const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined
    const maxDistanceKm = req.query.maxDistanceKm ? parseFloat(req.query.maxDistanceKm as string) : undefined

    const result = await publicRestaurantsService.getPublicRestaurants(
      { page, limit, search, sortBy, sortOrder },
      { categoryId, minRating, latitude, longitude, maxDistanceKm }
    )

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getRestaurantById(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const restaurant = await publicRestaurantsService.getPublicRestaurantById(id)
    res.json(restaurant)
  } catch (error) {
    next(error)
  }
}

export async function getCategories(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await publicRestaurantsService.getPublicCategories()
    res.json(categories)
  } catch (error) {
    next(error)
  }
}

export async function getRestaurantMenuItems(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const categoryId = req.query.categoryId as string | undefined
    const menuItems = await publicRestaurantsService.getRestaurantMenuItems(id, categoryId)
    res.json(menuItems)
  } catch (error) {
    next(error)
  }
}
