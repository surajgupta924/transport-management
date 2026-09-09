import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  email: z.string().email('Valid email is required').toLowerCase(),
  mobile: z
    .string()
    .regex(/^[0-9+\-\s]{8,15}$/, 'Valid mobile number is required')
    .optional()
    .or(z.literal('')),
  password: passwordSchema,
  portalType: z.enum(['STAFF', 'DRIVER', 'CUSTOMER']).optional().default('CUSTOMER'),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const sendOtpSchema = z.object({
  email: z.string().email('Enter a real email address').toLowerCase(),
  purpose: z.enum(['BOOKING', 'REGISTER']).optional().default('BOOKING'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Enter a real email address').toLowerCase(),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  purpose: z.enum(['BOOKING', 'REGISTER']).optional().default('BOOKING'),
});
