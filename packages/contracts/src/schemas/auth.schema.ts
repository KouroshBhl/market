import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// ============================================
// Enums
// ============================================

export const UserRoleSchema = z.enum(['BUYER', 'SELLER', 'ADMIN']).openapi('UserRole');
export type UserRole = z.infer<typeof UserRoleSchema>;

// ============================================
// Auth Request Schemas
// ============================================

export const SignupRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .openapi('SignupRequest');

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const LoginRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  })
  .openapi('LoginRequest');

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RefreshRequestSchema = z
  .object({
    refreshToken: z.string().optional(),
  })
  .openapi('RefreshRequest');

export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const ExchangeCodeRequestSchema = z
  .object({
    code: z.string().min(1, 'Code is required'),
  })
  .openapi('ExchangeCodeRequest');

export type ExchangeCodeRequest = z.infer<typeof ExchangeCodeRequestSchema>;

// ============================================
// Auth Response Schemas
// ============================================

export const AuthTokensResponseSchema = z
  .object({
    accessToken: z.string(),
    expiresIn: z.number(),
  })
  .openapi('AuthTokensResponse');

export type AuthTokensResponse = z.infer<typeof AuthTokensResponseSchema>;

export const AuthUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: UserRoleSchema,
    sellerId: z.string().uuid().nullable(),
    displayName: z.string().nullable(),
  })
  .openapi('AuthUser');

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthMeResponseSchema = z
  .object({
    user: AuthUserSchema,
  })
  .openapi('AuthMeResponse');

export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;

export const LogoutResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi('LogoutResponse');

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

// ============================================
// Seller Setup Schemas
// ============================================

export const SellerSetupRequestSchema = z
  .object({
    displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100),
  })
  .openapi('SellerSetupRequest');

export type SellerSetupRequest = z.infer<typeof SellerSetupRequestSchema>;

export const SellerProfileSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    displayName: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('SellerProfile');

export type SellerProfile = z.infer<typeof SellerProfileSchema>;

// ============================================
// Error Schemas
// ============================================

export const AuthErrorSchema = z
  .object({
    statusCode: z.number(),
    message: z.string(),
    errors: z
      .array(
        z.object({
          path: z.string(),
          message: z.string(),
        }),
      )
      .optional(),
  })
  .openapi('AuthError');

export type AuthError = z.infer<typeof AuthErrorSchema>;
