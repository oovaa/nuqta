import { z } from 'zod';

export const AddCartItemDto = z.object({
  productId: z.coerce.number().int(),
  quantity: z.coerce.number().int().positive().default(1),
}).strict();

export const UpdateCartItemDto = z.object({
  quantity: z.coerce.number().int().nonnegative(),
}).strict();

export type AddCartItemDtoType = z.infer<typeof AddCartItemDto>;
export type UpdateCartItemDtoType = z.infer<typeof UpdateCartItemDto>;