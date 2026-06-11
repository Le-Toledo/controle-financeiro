import { useState, useEffect, useRef } from 'react';
import {
  onSnapshot, query, where, orderBy,
  getDocs, addDoc, Timestamp, serverTimestamp, waitForPendingWrites,
} from 'firebase/firestore';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { auth, db } from '@/lib/firebase';
import { transactionsCol, fixedExpensesCol } from '@/lib/firestore.refs';
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
  // tracks which months have already been materialized in this component lifetime
  const doneRef = useRef(new Set<string>());

  useEffect(() => {
    if (!familyId || !auth.currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { start, end } = getMonthRange(month);
    const monthKey   = format(month, 'yyyy-MM');
    const cacheKey   = `${familyId}:${monthKey}`;
    const monthStart = startOfMonth(month);
    const monthEnd   = endOfMonth(month);
    const tsStart    = Timestamp.fromDate(monthStart);
    const tsEnd      = Timestamp.fromDate(monthEnd);

    let unsub: (() => void) | null = null;

    async function materializeAndSubscribe() {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Materialize fixed expenses before subscribing so the first snapshot
      // already includes them (avoids the waitForPendingWrites → onSnapshot gap).
      if (!doneRef.current.has(cacheKey)) {
        doneRef.current.add(cacheKey);

        const [feSnap, txSnap] = await Promise.all([
          getDocs(query(fixedExpensesCol(familyId!), where('active', '==', true))),
          getDocs(query(
            transactionsCol(familyId!),
            where('date', '>=', tsStart),
            where('date', '<=', tsEnd),
          )),
        ]);

        if (!feSnap.empty) {
          const materialized = new Set(
            txSnap.docs
              .filter((d) => d.data().source === 'fixed')
              .map((d) => d.data().fixedExpenseId as string),
          );

          const toCreate = feSnap.docs
            .map((d) => ({ ...d.data(), id: d.id }))
            .filter((fe) => !materialized.has(fe.id) && fe.startDate.toDate() <= monthEnd);

          if (toCreate.length > 0) {
            await Promise.all(
              toCreate.map((fe) =>
                addDoc(transactionsCol(familyId!), {
                  amountCents:    fe.amountCents,
                  type:           'expense' as const,
                  categoryId:     fe.categoryId,
                  note:           fe.label,
                  authorId:       uid,
                  date:           tsStart,
                  source:         'fixed' as const,
                  fixedExpenseId: fe.id,
                  createdAt:      serverTimestamp(),
                  updatedAt:      serverTimestamp(),
                } as Parameters<typeof addDoc>[1]),
              ),
            );
            await waitForPendingWrites(db);
            console.log(`[materializeFixed] ${toCreate.length} tx(s) criada(s) → ${monthKey}`);
          }
        }
      }

      // Subscribe after materialization: first snapshot is guaranteed to include
      // the fixed transactions that were just written.
      const q = query(
        transactionsCol(familyId!),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'desc'),
      );

      unsub = onSnapshot(
        q,
        (snap) => {
          const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
          console.log(
            `[useTransactions] snapshot ${monthKey}: ${docs.length} tx(s) —`,
            docs.map((t) => `${t.source}/${t.type}/${t.amountCents}cts`).join(', ') || '(vazio)',
          );
          setTransactions(docs);
          setLoading(false);
        },
        (err) => {
          console.error('[useTransactions] snapshot error:', err.code, err.message);
          setLoading(false);
        },
      );
    }

    materializeAndSubscribe().catch((err) => {
      console.error('[useTransactions] setup error:', err);
      setLoading(false);
    });

    return () => { unsub?.(); };
  }, [familyId, month.getFullYear(), month.getMonth()]);

  const summary: MonthSummary = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') {
        acc.incomeCents  += tx.amountCents;
      } else if (tx.type === 'expense') {
        acc.expenseCents += tx.amountCents;
      }
      acc.balanceCents = acc.incomeCents - acc.expenseCents;
      return acc;
    },
    { incomeCents: 0, expenseCents: 0, balanceCents: 0 },
  );

  console.log(
    `[useTransactions] summary ${format(month, 'yyyy-MM')}:`,
    `income=${summary.incomeCents}`,
    `expense=${summary.expenseCents}`,
    `balance=${summary.balanceCents}`,
    `(${transactions.length} txs)`,
  );

  return { transactions, summary, loading };
}
