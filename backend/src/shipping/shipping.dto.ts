import { z } from 'zod';

export const CreateShippingDto = z.object({
  orderId: z.coerce.number().int(),
  userId: z.coerce.number().int(),
  phone: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  price: z.coerce.number().nonnegative(),
}).strict();

export const UpdateShippingDto = z.object({
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']).optional(),
  price: z.coerce.number().nonnegative().optional(),
}).strict();

export type CreateShippingDtoType = z.infer<typeof CreateShippingDto>;
export type UpdateShippingDtoType = z.infer<typeof UpdateShippingDto>;