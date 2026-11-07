import { z } from 'zod';

export const CreateCategoryDto = z.object({ name: z.string().min(1) });
export const UpdateCategoryDto = CreateCategoryDto;

export type CreateCategoryDtoType = z.infer<typeof CreateCategoryDto>;
export type UpdateCategoryDtoType = z.infer<typeof UpdateCategoryDto>;