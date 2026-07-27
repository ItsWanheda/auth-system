import { Router } from 'express';
import { getMe } from './users.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the current authenticated user's profile
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/User' }
 *       401: { description: Unauthorized }
 */
router.get('/me', authenticate, getMe);

export { router as usersRouter };