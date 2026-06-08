import { z } from 'zod';

export const CreateFixedExpenseSchema = z.object({
  label: z
    .string({ error: 'Nome obrigatório' })
    .min(2, 'Mínimo 2 caracteres')
    .max(80, 'Máximo 80 caracteres')
    .trim(),
  amountCents: z
    .number({ error: 'Valor obrigatório' })
    .int('Valor deve ser inteiro (centavos)')
    .positive('Valor deve ser maior que zero'),
  dueDay: z
    .number()
    .int()
    .min(1, 'Dia mínimo: 1')
    .max(28, 'Dia máximo: 28 (seguro para todos os meses)'),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  responsibleUserId: z.string().min(1, 'Responsável obrigatório'),
});

export type CreateFixedExpenseInput = z.infer<typeof CreateFixedExpenseSchema>;
