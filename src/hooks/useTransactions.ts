import { useState, useEffect } from 'react';
import { onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { transactionsCol } from '@/lib/firestore.refs';
import { useAuthStore } from '@/stores/auth.store';
import { getMonthRange } from '@/utils/date';
import type { Transaction } from '@shared/types/transaction';

interface MonthSummary {
  incomeCents:  number;
  expenseCents: number;
  balanceCents: number;
}

interface UseTransactionsResult {
  transactions: Transaction[];
  summary:      MonthSummary;
  loading:      boolean;
}

export function useTransactions(month: Date): UseTransactionsResult {
  const familyId = useAuthStore((s) => s.family?.id);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!familyId) return;

    const { start, end } = getMonthRange(month);
    const q = query(
      transactionsCol(familyId),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc'),
    );

    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });

    return () => unsub();
  }, [familyId, month.getFullYear(), month.getMonth()]);

  const summary: MonthSummary = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') {
        acc.incomeCents  += tx.amountCents;
      } else {
        acc.expenseCents += tx.amountCents;
      }
      acc.balanceCents = acc.incomeCents - acc.expenseCents;
      return acc;
    },
    { incomeCents: 0, expenseCents: 0, balanceCents: 0 },
  );

  return { transactions, summary, loading };
}
