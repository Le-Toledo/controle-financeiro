import { z } from 'zod';

// Apenas os campos controlados pelo react-hook-form.
// amountCents e categoryId são validados manualmente em onSubmit.
export const CreateFixedExpenseSchema = z.object({
  label: z
    .string({ error: 'Nome obrigatório' })
    .min(2, 'Mínimo 2 caracteres')
    .max(80, 'Máximo 80 caracteres')
    .trim(),
  responsibleUserId: z.string().min(1, 'Responsável obrigatório'),
});

export type CreateFixedExpenseInput = z.infer<typeof CreateFixedExpenseSchema>;
