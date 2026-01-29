import { prisma } from '../lib/prisma';
import { userSelectFields, UserResponse } from '../types';

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
};

export const findUserById = (id: string): Promise<UserResponse | null> => {
  return prisma.user.findUnique({
    where: { id },
    select: userSelectFields,
  });
};

export const userExists = async (email: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return user !== null;
};
