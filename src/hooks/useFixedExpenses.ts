import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { fixedExpensesCol } from '@/lib/firestore.refs';
import { useAuthStore } from '@/stores/auth.store';
import type { FixedExpense } from '@shared/types/fixed-expense';

interface UseFixedExpensesResult {
  fixedExpenses:     FixedExpense[];
  totalMonthlyCents: number;
  loading:           boolean;
  error:             string | null;
  retry:             () => void;
}

export function useFixedExpenses(): UseFixedExpensesResult {
  const familyId = useAuthStore((s) => s.family?.id);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [retryKey, setRetryKey]           = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      fixedExpensesCol(familyId),
      where('active', '==', true),
      orderBy('startDate', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setFixedExpenses(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useFixedExpenses] snapshot error:', err.code, err.message);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [familyId, retryKey]);

  const totalMonthlyCents = fixedExpenses.reduce((sum, fe) => sum + fe.amountCents, 0);

  return { fixedExpenses, totalMonthlyCents, loading, error, retry };
}
