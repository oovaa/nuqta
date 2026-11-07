import { z } from 'zod';

export const CreatePaymentDto = z.object({
  userId: z.coerce.number().int(),
  orderId: z.coerce.number().int(),
  shippingId: z.coerce.number().int(),
  amount: z.coerce.number().nonnegative(),
  method: z.enum(['cash', 'bank', 'card']),
  bankAccountNumber: z.string().optional(),
  cardNumber: z.string().optional(),
  cvv: z.string().optional(),
  expiry: z.string().optional(),
});

export type CreatePaymentDtoType = z.infer<typeof CreatePaymentDto>;