import type { Timestamp } from 'firebase/firestore';

export type TransactionType   = 'expense' | 'income';
export type TransactionSource = 'fixed' | 'manual';

export interface Transaction {
  id: string;
  amountCents: number;         // Inteiro em centavos — nunca float
  type: TransactionType;
  categoryId: string;
  authorId: string;            // UID de quem registrou o lançamento
  date: Timestamp;             // Data do gasto em UTC
  note?: string;               // Observação livre (max 280 chars)
  source: TransactionSource;
  fixedExpenseId?: string;     // Preenchido quando source === 'fixed' — garante idempotência
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
