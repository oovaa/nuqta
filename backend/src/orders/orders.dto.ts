import { z } from 'zod';

export const CreateOrderDto = z.object({
  userId: z.coerce.number().int(),
  productsIds: z.array(z.coerce.number().int()).min(1),
  status: z.enum(['active', 'checked_out', 'abandoned', 'completed']).optional(),
}).strict();

export const UpdateOrderStatusDto = z.object({
  status: z.enum(['active', 'checked_out', 'abandoned', 'completed']),
}).strict();

export type CreateOrderDtoType = z.infer<typeof CreateOrderDto>;
export type UpdateOrderStatusDtoType = z.infer<typeof UpdateOrderStatusDto>;