import { z } from 'zod';

export const CreatePartDto = z.object({
  name: z.string().min(1),
  type: z.enum(['model', 'ram', 'ssd', 'hdd']),
  price: z.coerce.number().nonnegative(),
}).strict();

export const UpdatePartDto = CreatePartDto.partial();

export type CreatePartDtoType = z.infer<typeof CreatePartDto>;
export type UpdatePartDtoType = z.infer<typeof UpdatePartDto>;