import { z } from 'zod';

export const CreateTransactionSchema = z.object({
  amountCents: z
    .number({ error: 'Valor obrigatório' })
    .int('Valor deve ser inteiro (centavos)')
    .positive('Valor deve ser maior que zero'),
  type: z.enum(['expense', 'income']),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  date: z.string().datetime({ message: 'Data inválida' }),
  note: z.string().max(280, 'Máximo 280 caracteres').optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
