// Category validation: create, update
import { BadRequestError } from '../../utils/errors'
import { validateStringLength } from './shared'

export interface CreateCategoryData {
  name: string
  description?: string
  iconUrl?: string
}

export function validateCreateCategory(data: CreateCategoryData): void {
  const { name } = data

  if (!name) {
    throw new BadRequestError('Missing required fields', 'Category name is required')
  }

  // Security: Validate string lengths
  validateStringLength(name, 'name')
  validateStringLength(data.description, 'description')
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  iconUrl?: string
}
