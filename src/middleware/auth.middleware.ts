import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { userRepository } from '../repositories/user.repository';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')
        : undefined);

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const requireVerified = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user?.isVerified) {
    return next(new UnauthorizedError('Email verification required'));
  }
  next();
};