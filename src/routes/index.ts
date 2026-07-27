import { Router } from 'express';
import { authRouter } from '../auth/auth.routes';
import { usersRouter } from '../users/users.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

router.use('/auth', authRouter);
router.use('/users', usersRouter);

export { router as apiRouter };