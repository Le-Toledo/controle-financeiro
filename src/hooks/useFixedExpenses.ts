import { useState, useEffect } from 'react';
import { onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { fixedExpensesCol } from '@/lib/firestore.refs';
import { useAuthStore } from '@/stores/auth.store';
import type { FixedExpense } from '@shared/types/fixed-expense';

interface UseFixedExpensesResult {
  fixedExpenses:    FixedExpense[];
  totalMonthlyCents: number;
  loading:          boolean;
}

export function useFixedExpenses(): UseFixedExpensesResult {
  const familyId = useAuthStore((s) => s.family?.id);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    if (!familyId) return;

    const q = query(
      fixedExpensesCol(familyId),
      where('active', '==', true),
      orderBy('dueDay', 'asc'),
    );

    const unsub = onSnapshot(q, (snap) => {
      setFixedExpenses(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });

    return () => unsub();
  }, [familyId]);

  const totalMonthlyCents = fixedExpenses.reduce((sum, fe) => sum + fe.amountCents, 0);

  return { fixedExpenses, totalMonthlyCents, loading };
}
