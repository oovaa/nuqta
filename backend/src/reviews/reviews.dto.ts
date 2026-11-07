import { z } from 'zod';

export const CreateReviewDto = z.object({
  productId: z.coerce.number().int(),
  review: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
}).strict();

export const UpdateReviewDto = z.object({
  review: z.string().min(1).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
}).strict();

export type CreateReviewDtoType = z.infer<typeof CreateReviewDto>;
export type UpdateReviewDtoType = z.infer<typeof UpdateReviewDto>;