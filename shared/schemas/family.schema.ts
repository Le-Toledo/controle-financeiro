import { z } from 'zod';

export const CreateFamilySchema = z.object({
  name: z
    .string({ error: 'Nome obrigatório' })
    .min(2, 'Mínimo 2 caracteres')
    .max(60, 'Máximo 60 caracteres')
    .trim(),
});

export const JoinFamilySchema = z.object({
  inviteCode: z
    .string({ error: 'Código obrigatório' })
    .length(8, 'O código tem exatamente 8 caracteres')
    .toUpperCase(),
});

export type CreateFamilyInput = z.infer<typeof CreateFamilySchema>;
export type JoinFamilyInput   = z.infer<typeof JoinFamilySchema>;
