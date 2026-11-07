import { z } from 'zod';

export const RegisterDto = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ChangePasswordDto = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const ResetPasswordDto = z.object({
  email: z.string().email(),
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
export type ChangePasswordDtoType = z.infer<typeof ChangePasswordDto>;
export type ResetPasswordDtoType = z.infer<typeof ResetPasswordDto>;