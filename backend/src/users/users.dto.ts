import { z } from 'zod';

export const UpdateUserDto = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
}).strict();

export const UpdateUserRoleDto = z.object({
  role: z.enum(['user', 'admin']),
}).strict();

export type UpdateUserDtoType = z.infer<typeof UpdateUserDto>;
export type UpdateUserRoleDtoType = z.infer<typeof UpdateUserRoleDto>;