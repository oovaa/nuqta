import { z } from 'zod';

export const CreateSoldLaptopDto = z.object({
  userId: z.coerce.number().int(),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int(),
  ram: z.string().min(1),
  rom: z.string().min(1),
  romType: z.enum(['ssd', 'hdd']),
  size: z.string().min(1),
  cpu: z.string().min(1),
  gpu: z.string().optional(),
  batteryHealth: z.coerce.number().int().optional().nullable(),
  chargeCycles: z.coerce.number().int().optional().nullable(),
  conditionRating: z.coerce.number().int().optional(),
  price: z.coerce.number().nonnegative(),
  images: z.array(z.string()).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']).optional(),
}).strict();

export const UpdateSoldLaptopDto = CreateSoldLaptopDto.partial();

export const UpdateSoldLaptopStatusDto = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
}).strict();

export type CreateSoldLaptopDtoType = z.infer<typeof CreateSoldLaptopDto>;
export type UpdateSoldLaptopDtoType = z.infer<typeof UpdateSoldLaptopDto>;
export type UpdateSoldLaptopStatusDtoType = z.infer<typeof UpdateSoldLaptopStatusDto>;