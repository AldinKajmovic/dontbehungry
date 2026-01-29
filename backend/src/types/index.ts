import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RegisterRestaurantDto extends RegisterDto {
  restaurantName: string;
  restaurantDescription?: string;
  restaurantPhone?: string;
  restaurantEmail?: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  avatarUrl: string | null;
}

export const userSelectFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  emailVerified: true,
  phoneVerified: true,
  avatarUrl: true,
} as const;
