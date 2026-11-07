import { z } from 'zod';

export const CreateProductDto = z.object({
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  description: z.string().optional(),
  categoryId: z.coerce.number().int().optional().nullable(),
  year: z.coerce.number().int().optional().nullable(),
  color: z.string().optional(),
  ram: z.string().optional(),
  rom: z.string().optional(),
  tag: z.string().optional(),
  company: z.string().optional(),
});

export const UpdateProductDto = CreateProductDto.partial();

export const ProductQueryDto = z.object({
  categoryId: z.coerce.number().int().optional(),
  name: z.string().optional(),
});

export type CreateProductDtoType = z.infer<typeof CreateProductDto>;
export type UpdateProductDtoType = z.infer<typeof UpdateProductDto>;
export type ProductQueryDtoType = z.infer<typeof ProductQueryDto>;