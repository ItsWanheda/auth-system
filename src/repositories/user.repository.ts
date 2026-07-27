import type { User, Prisma } from '@prisma/client';
import { prisma } from '../prisma/prisma.client';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async markVerified(id: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { isVerified: true } });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { username } });
    return count > 0;
  }
}

export const userRepository = new UserRepository();