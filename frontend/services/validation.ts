import { z } from 'zod';
import { isValidPhoneNumber, getCountryCallingCode, parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

// Base schemas
export const emailSchema = z.string().email({ message: 'Please enter a valid email address' });
export const passwordSchema = z.string().min(1, { message: 'Password is required' });
export const nameSchema = z.string().min(1, { message: 'This field is required' }).max(50, { message: 'Too long' });
export const optionalEmailSchema = z.string().email({ message: 'Please enter a valid email' }).optional().or(z.literal(''));

// Form schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const registerRestaurantSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
  restaurantName: z.string().min(1, { message: 'Restaurant name is required' }).max(100, { message: 'Restaurant name is too long' }),
  restaurantDescription: z.string().max(500, { message: 'Description is too long' }).optional(),
  restaurantPhone: z.string().optional(),
  restaurantEmail: optionalEmailSchema,
  address: z.string().min(1, { message: 'Address is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  country: z.string().min(1, { message: 'Country is required' }),
  postalCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export function validatePhone(phone: string, countryCode: CountryCode): boolean {
  if (!phone) return true;
  const fullNumber = `+${getCountryCallingCode(countryCode)}${phone.replace(/\D/g, '')}`;
  return isValidPhoneNumber(fullNumber, countryCode);
}

export function formatPhoneE164(phone: string, countryCode: CountryCode): string | undefined {
  if (!phone) return undefined;
  const fullNumber = `+${getCountryCallingCode(countryCode)}${phone.replace(/\D/g, '')}`;
  const parsed = parsePhoneNumberFromString(fullNumber, countryCode);
  return parsed?.format('E.164');
}

export function validateFieldValue(
  fieldName: string,
  value: string,
  options?: {
    password?: string;
    phoneCountry?: CountryCode;
  }
): string | undefined {
  switch (fieldName) {
    case 'firstName':
    case 'lastName':
      if (!value) return 'This field is required';
      if (value.length > 50) return 'Too long';
      break;
    case 'email':
    case 'restaurantEmail':
      if (fieldName === 'email' && !value) return 'Email is required';
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
      break;
    case 'phone':
    case 'restaurantPhone':
      if (value && options?.phoneCountry && !validatePhone(value, options.phoneCountry)) {
        return 'Please enter a valid phone number';
      }
      break;
    case 'password':
      if (!value) return 'Password is required';
      break;
    case 'confirmPassword':
      if (!value) return 'Please confirm your password';
      if (value !== options?.password) return 'Passwords do not match';
      break;
    case 'restaurantName':
      if (!value) return 'Restaurant name is required';
      if (value.length > 100) return 'Restaurant name is too long';
      break;
    case 'address':
      if (!value) return 'Address is required';
      break;
    case 'city':
      if (!value) return 'City is required';
      break;
    case 'country':
      if (!value) return 'Country is required';
      break;
  }
  return undefined;
}

export function extractZodErrors<T extends Record<string, unknown>>(
  result: { success: false; error: z.ZodError }
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  result.error.issues.forEach(err => {
    const field = err.path[0] as keyof T;
    if (!errors[field]) {
      errors[field] = err.message;
    }
  });
  return errors;
}

// Types
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type RegisterRestaurantForm = z.infer<typeof registerRestaurantSchema>;
