import { z } from 'zod';

export const UpdateUserDto = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export const UpdateUserRoleDto = z.object({
  role: z.enum(['user', 'admin']),
});

export type UpdateUserDtoType = z.infer<typeof UpdateUserDto>;
export type UpdateUserRoleDtoType = z.infer<typeof UpdateUserRoleDto>;