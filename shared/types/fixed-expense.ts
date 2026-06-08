import type { Timestamp } from 'firebase/firestore';

export interface FixedExpense {
  id: string;
  label: string;
  amountCents: number;          // Inteiro em centavos
  dueDay: number;               // 1–28 (28 = seguro para fevereiro)
  categoryId: string;
  responsibleUserId: string;    // Quem paga esta conta
  active: boolean;
  startDate: Timestamp;         // Mês a partir do qual vale
  endDate?: Timestamp;          // Quando foi desativado (audit trail; prefira active=false)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
