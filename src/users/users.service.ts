import { userRepository } from '../repositories/user.repository';
import { NotFoundError } from '../utils/errors';
import type { SafeUser } from '../types/user.types';

export class UsersService {
  async getMe(userId: string): Promise<SafeUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const usersService = new UsersService();