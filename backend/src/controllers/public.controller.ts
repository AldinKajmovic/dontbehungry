import { Request, Response, NextFunction } from 'express'
import * as publicRestaurantsService from '../services/public/restaurants.service'

// Type for routes with ID parameter
type IdParams = { id: string }
type RestaurantSearchRequestBody = {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  categoryId?: string
  minRating?: number
  latitude?: number
  longitude?: number
  maxDistanceKm?: number
}

function parseNumericValue(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function parseRestaurantSearchRequest(
  query: Request['query'],
  body?: RestaurantSearchRequestBody
) {
  const page = Math.max(1, parseNumericValue(body?.page ?? query.page) ?? 1)
  const limit = Math.min(50, Math.max(1, parseNumericValue(body?.limit ?? query.limit) ?? 12))
  const search = typeof (body?.search ?? query.search) === 'string' ? String(body?.search ?? query.search) : undefined
  const sortBy = typeof (body?.sortBy ?? query.sortBy) === 'string' ? String(body?.sortBy ?? query.sortBy) : undefined
  const sortOrderValue = body?.sortOrder ?? query.sortOrder
  const sortOrder: 'asc' | 'desc' = sortOrderValue === 'desc' ? 'desc' : 'asc'
  const categoryId = typeof (body?.categoryId ?? query.categoryId) === 'string'
    ? String(body?.categoryId ?? query.categoryId)
    : undefined
  const minRating = parseNumericValue(body?.minRating ?? query.minRating)
  const rawLat = parseNumericValue(body?.latitude)
  const rawLng = parseNumericValue(body?.longitude)
  const latitude = rawLat !== undefined && rawLat >= -90 && rawLat <= 90 ? rawLat : undefined
  const longitude = rawLng !== undefined && rawLng >= -180 && rawLng <= 180 ? rawLng : undefined
  const maxDistanceKm = parseNumericValue(body?.maxDistanceKm)

  return {
    params: { page, limit, search, sortBy, sortOrder },
    filters: { categoryId, minRating, latitude, longitude, maxDistanceKm },
  }
}

// Get all restaurants (public)
export async function getRestaurants(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { params, filters } = parseRestaurantSearchRequest(req.query)

    const result = await publicRestaurantsService.getPublicRestaurants(params, filters)

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function searchRestaurants(
  req: Request<Record<string, never>, unknown, RestaurantSearchRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { params, filters } = parseRestaurantSearchRequest(req.query, req.body)

    const result = await publicRestaurantsService.getPublicRestaurants(params, filters)

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
