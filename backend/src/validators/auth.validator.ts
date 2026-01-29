import { BadRequestError } from '../utils/errors';
import { RegisterDto, RegisterRestaurantDto, LoginDto } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export const validateEmail = (email: string): void => {
  if (!EMAIL_REGEX.test(email)) {
    throw new BadRequestError('Invalid email', 'Please provide a valid email address');
  }
};

export const validatePassword = (password: string): void => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new BadRequestError('Password too short', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }
};

export const validateRegister = (data: RegisterDto): void => {
  const { email, password, firstName, lastName } = data;

  if (!email || !password || !firstName || !lastName) {
    throw new BadRequestError('Missing required fields', 'Email, password, firstName, and lastName are required');
  }

  validateEmail(email);
  validatePassword(password);
};

export const validateRegisterRestaurant = (data: RegisterRestaurantDto): void => {
  validateRegister(data);

  const { restaurantName, address, city, country } = data;

  if (!restaurantName || !address || !city || !country) {
    throw new BadRequestError('Missing required fields', 'Restaurant name, address, city, and country are required');
  }
};

export const validateLogin = (data: LoginDto): void => {
  const { email, password } = data;

  if (!email || !password) {
    throw new BadRequestError('Missing credentials', 'Email and password are required');
  }
};
