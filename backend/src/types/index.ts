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

export interface Register {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface RegisterRestaurant extends Register {
  restaurantName: string;
  restaurantDescription?: string;
  restaurantPhone?: string;
  restaurantEmail?: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface Login {
  email: string;
  password: string;
}

export interface UpdateProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
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
