import { BadRequestError } from '../utils/errors';
import { UpdateProfile, ChangePassword } from '../types';
import { isValidEmailAddress } from './admin/shared'

const MIN_PASSWORD_LENGTH = 8;

export const validateUpdateProfile = (data: UpdateProfile): void => {
  const { firstName, lastName, phone, email } = data;

  if (firstName !== undefined && firstName.trim().length === 0) {
    throw new BadRequestError('Invalid first name', 'First name cannot be empty');
  }

  if (lastName !== undefined && lastName.trim().length === 0) {
    throw new BadRequestError('Invalid last name', 'Last name cannot be empty');
  }

  if (firstName !== undefined && firstName.length > 50) {
    throw new BadRequestError('First name too long', 'First name must be 50 characters or less');
  }

  if (lastName !== undefined && lastName.length > 50) {
    throw new BadRequestError('Last name too long', 'Last name must be 50 characters or less');
  }

  if (phone !== undefined && phone.length > 20) {
    throw new BadRequestError('Phone too long', 'Phone number must be 20 characters or less');
  }

  if (email !== undefined) {
    if (email.trim().length === 0) {
      throw new BadRequestError('Invalid email', 'Email cannot be empty');
    }
    if (!isValidEmailAddress(email)) {
      throw new BadRequestError('Invalid email', 'Please provide a valid email address');
    }
  }
};

export const validateChangePassword = (data: ChangePassword): void => {
  const { currentPassword, newPassword } = data;

  if (!currentPassword) {
    throw new BadRequestError('Missing current password', 'Current password is required');
  }

  if (!newPassword) {
    throw new BadRequestError('Missing new password', 'New password is required');
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new BadRequestError('Password too short', `New password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (currentPassword === newPassword) {
    throw new BadRequestError('Same password', 'New password must be different from current password');
  }
};
