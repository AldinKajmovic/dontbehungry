// Zod validation schemas
import { z } from 'zod'

// Base schemas
export const emailSchema = z.string().email({ message: 'Please enter a valid email address' })
export const passwordSchema = z.string().min(1, { message: 'Password is required' })
export const nameSchema = z
  .string()
  .min(1, { message: 'This field is required' })
  .max(50, { message: 'Too long' })
export const optionalEmailSchema = z
  .string()
  .email({ message: 'Please enter a valid email' })
  .optional()
  .or(z.literal(''))

// Form schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: z.string().optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const registerRestaurantSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: z.string().optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    restaurantName: z
      .string()
      .min(1, { message: 'Restaurant name is required' })
      .max(100, { message: 'Restaurant name is too long' }),
    restaurantDescription: z.string().max(500, { message: 'Description is too long' }).optional(),
    restaurantPhone: z.string().optional(),
    restaurantEmail: optionalEmailSchema,
    address: z.string().min(1, { message: 'Address is required' }),
    city: z.string().min(1, { message: 'City is required' }),
    country: z.string().min(1, { message: 'Country is required' }),
    postalCode: z.string().optional(),
    minOrderAmount: z.string().optional(),
    deliveryFee: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Types inferred from schemas
export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
export type RegisterRestaurantForm = z.infer<typeof registerRestaurantSchema>
