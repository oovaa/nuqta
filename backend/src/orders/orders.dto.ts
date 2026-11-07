import { z } from 'zod';

export const CreateOrderDto = z.object({
  userId: z.coerce.number().int(),
  productsIds: z.array(z.coerce.number().int()).min(1),
  status: z.string().optional(),
});

export const UpdateOrderStatusDto = z.object({
  status: z.string().min(1),
});

export type CreateOrderDtoType = z.infer<typeof CreateOrderDto>;
export type UpdateOrderStatusDtoType = z.infer<typeof UpdateOrderStatusDto>;