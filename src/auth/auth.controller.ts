import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { setAccessTokenCookie, setRefreshTokenCookie, clearAuthCookies } from '../utils/cookies';
import { asyncHandler } from '../utils/async-handler';
import { UnauthorizedError } from '../utils/errors';
import type {
  SignupInput,
  LoginInput,
  ChangePasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ForgotPasswordInput,
} from '../validators/auth.validator';

const getMetadata = (req: Request) => ({
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

const setAuthCookies = (res: Response, access: string, refresh: string): void => {
  setAccessTokenCookie(res, access);
  setRefreshTokenCookie(res, refresh);
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as SignupInput;
  const result = await authService.signup(input, getMetadata(req));
  res.status(201).json({
    success: true,
    message: 'User registered. Please check your email to verify your account.',
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const tokens = await authService.login(input, getMetadata(req));
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: {
      accessToken: tokens.accessToken,
      csrfToken: res.locals.csrfToken,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();
  await authService.logout(refreshToken, userId, getMetadata(req));
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) throw new UnauthorizedError('Refresh token missing');
  const tokens = await authService.refresh(refreshToken, getMetadata(req));
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  res.json({
    success: true,
    message: 'Tokens refreshed',
    data: {
      accessToken: tokens.accessToken,
      csrfToken: res.locals.csrfToken,
    },
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as ForgotPasswordInput;
  await authService.forgotPassword(email, getMetadata(req));
  res.json({
    success: true,
    message: 'If that email exists, a reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as ResetPasswordInput;
  await authService.resetPassword(input, getMetadata(req));
  res.json({ success: true, message: 'Password reset successfully' });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as ChangePasswordInput;
  await authService.changePassword(req.user!.id, input, getMetadata(req));
  clearAuthCookies(res);
  res.json({ success: true, message: 'Password changed. Please log in again.' });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body as VerifyEmailInput;
  await authService.verifyEmail(token, getMetadata(req));
  res.json({ success: true, message: 'Email verified successfully' });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  await authService.resendVerificationEmail(req.user!.id, getMetadata(req));
  res.json({ success: true, message: 'Verification email sent' });
});