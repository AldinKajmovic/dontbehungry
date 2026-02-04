import { BadRequestError } from '../utils/errors';
import { Register, RegisterRestaurant, Login } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

// Password must contain at least one uppercase, one lowercase, one number, and one special character
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const validateEmail = (email: string): void => {
  if (!EMAIL_REGEX.test(email)) {
    throw new BadRequestError('Invalid email', 'Please provide a valid email address');
  }
};

export const validatePassword = (password: string): void => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new BadRequestError('Password too short', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    throw new BadRequestError(
      'Password too weak',
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    );
  }
};

export const validateRegister = (data: Register): void => {
  const { email, password, firstName, lastName, phone } = data;

  if (!email || !password || !firstName || !lastName || !phone) {
    throw new BadRequestError('Missing required fields', 'Email, password, firstName, lastName, and phone are required');
  }

  validateEmail(email);
  validatePassword(password);
};

export const validateRegisterRestaurant = (data: RegisterRestaurant): void => {
  validateRegister(data);

  const { restaurantName, address, city, country } = data;

  if (!restaurantName || !address || !city || !country) {
    throw new BadRequestError('Missing required fields', 'Restaurant name, address, city, and country are required');
  }
};

export const validateLogin = (data: Login): void => {
  const { email, password } = data;

  if (!email || !password) {
    throw new BadRequestError('Missing credentials', 'Email and password are required');
  }
};
