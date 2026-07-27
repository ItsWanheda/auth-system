import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Authentication API',
      version: '1.0.0',
      description: 'Production-ready authentication system with JWT, refresh tokens, and CSRF protection',
      contact: { name: 'API Support', email: 'support@example.com' },
    },
    servers: [{ url: env.APP_URL, description: 'API Server' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
      },
      schemas: {
        SignupDto: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 50, example: 'johndoe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 8, example: 'StrongP@ss123' },
          },
        },
        LoginDto: {
          type: 'object',
          required: ['password'],
          properties: {
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            password: { type: 'string' },
          },
        },
        ForgotPasswordDto: {
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        },
        ResetPasswordDto: {
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
        },
        ChangePasswordDto: {
          type: 'object',
          required: ['oldPassword', 'newPassword'],
          properties: {
            oldPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
        },
        VerifyEmailDto: {
          type: 'object',
          required: ['token'],
          properties: { token: { type: 'string' } },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/auth/*.ts', './src/users/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);