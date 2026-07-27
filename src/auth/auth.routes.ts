import { Router } from 'express';
import {
  signup,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
} from './auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { csrfProtection, issueCsrf } from '../middleware/csrf.middleware';
import { authLimiter, passwordResetLimiter } from '../middleware/rate-limit.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator';

const router = Router();

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SignupDto' }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Email/username already exists }
 *       429: { description: Too many requests }
 */
router.post('/signup', authLimiter, validate(signupSchema), signup);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive tokens (cookies + CSRF)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginDto' }
 *     responses:
 *       200: { description: Login success, sets HttpOnly cookies }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, validate(loginSchema), issueCsrf, login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and issue new pair
 *     responses:
 *       200: { description: New tokens issued }
 *       401: { description: Invalid / reused refresh token }
 */
router.post('/refresh', csrfProtection, issueCsrf, refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out and revoke refresh token
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', authenticate, csrfProtection, logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ForgotPasswordDto' }
 *     responses:
 *       200: { description: Reset email sent if account exists }
 */
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ResetPasswordDto' }
 *     responses:
 *       200: { description: Password reset }
 *       400: { description: Invalid / expired token }
 */
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password for the authenticated user
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ChangePasswordDto' }
 *     responses:
 *       200: { description: Password changed }
 *       401: { description: Wrong current password }
 */
router.post(
  '/change-password',
  authenticate,
  csrfProtection,
  validate(changePasswordSchema),
  changePassword,
);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email address with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VerifyEmailDto' }
 *     responses:
 *       200: { description: Email verified }
 */
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification email
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Email sent }
 */
router.post('/resend-verification', authenticate, csrfProtection, resendVerification);

export { router as authRouter };