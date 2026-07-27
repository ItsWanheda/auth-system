import type { Request, Response } from 'express';
import { usersService } from './users.service';
import { asyncHandler } from '../utils/async-handler';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getMe(req.user!.id);
  res.json({ success: true, data: user });
});