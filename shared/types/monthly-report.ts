import type { Timestamp } from 'firebase/firestore';

export interface CategorySummary {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amountCents: number;
  percentage: number;   // 0–100 do total de despesas
}

export interface MemberSummary {
  userId: string;
  displayName: string;
  avatarColor: string;
  expenseCents: number;
  incomeCents: number;
}

export interface MonthlyReport {
  id: string;                    // YYYY-MM, ex: '2025-06'
  totalIncomeCents: number;
  totalExpenseCents: number;
  balanceCents: number;          // income - expense
  fixedExpenseCents: number;
  variableExpenseCents: number;
  byCategory: CategorySummary[];
  byMember: MemberSummary[];
  transactionCount: number;
  projectedExpenseCents: number; // Projeção de fim de mês (gasto ÷ dias decorridos × dias do mês)
  generatedAt: Timestamp;
}
