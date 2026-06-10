import { useEffect, useRef, useState } from 'react';
import {
  getDocs, addDoc, query, where, Timestamp, serverTimestamp,
  waitForPendingWrites,
} from 'firebase/firestore';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { auth, db } from '@/lib/firebase';
import { fixedExpensesCol, transactionsCol } from '@/lib/firestore.refs';
import { useAuthStore } from '@/stores/auth.store';

interface UseMaterializeFixedResult {
  /** true enquanto a verificação/criação de transações fixas ainda está em andamento */
  pending: boolean;
}

/**
 * Garante que cada gasto fixo ativo tenha exatamente uma transação
 * source='fixed' no mês dado. Idempotente: verifica antes de criar.
 * Retorna `pending=true` enquanto o processo está em andamento, para que
 * a UI possa manter o estado de carregamento e evitar flash de saldo incorreto.
 */
export function useMaterializeFixed(month: Date): UseMaterializeFixedResult {
  const familyId = useAuthStore((s) => s.family?.id);
  const doneRef  = useRef(new Set<string>());
  const [pending, setPending] = useState(true);

  useEffect(() => {
    if (!familyId || !auth.currentUser) {
      setPending(false);
      return;
    }

    const monthKey = format(month, 'yyyy-MM');
    const cacheKey = `${familyId}:${monthKey}`;
    if (doneRef.current.has(cacheKey)) {
      setPending(false);
      return;
    }
    doneRef.current.add(cacheKey);
    setPending(true);

    const monthStart = startOfMonth(month);
    const monthEnd   = endOfMonth(month);
    const tsStart    = Timestamp.fromDate(monthStart);
    const tsEnd      = Timestamp.fromDate(monthEnd);

    async function run() {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const [feSnap, txSnap] = await Promise.all([
        getDocs(query(fixedExpensesCol(familyId!), where('active', '==', true))),
        getDocs(query(
          transactionsCol(familyId!),
          where('date', '>=', tsStart),
          where('date', '<=', tsEnd),
        )),
      ]);

      if (feSnap.empty) return;

      // Quais fixedExpenseIds já foram materializados este mês
      const materialized = new Set(
        txSnap.docs
          .filter((d) => d.data().source === 'fixed')
          .map((d) => d.data().fixedExpenseId as string),
      );

      const toCreate = feSnap.docs
        .map((d) => ({ ...d.data(), id: d.id }))
        .filter((fe) => {
          if (materialized.has(fe.id)) return false;
          // Só materializa se a vigência já começou
          return fe.startDate.toDate() <= monthEnd;
        });

      if (toCreate.length === 0) return;

      await Promise.all(
        toCreate.map((fe) =>
          addDoc(transactionsCol(familyId!), {
            amountCents:    fe.amountCents,
            type:           'expense' as const,
            categoryId:     fe.categoryId,
            authorId:       uid,
            date:           tsStart,
            source:         'fixed' as const,
            fixedExpenseId: fe.id,
            createdAt:      serverTimestamp(),
            updatedAt:      serverTimestamp(),
          } as Parameters<typeof addDoc>[1]),
        ),
      );

      // Aguarda o servidor confirmar as escritas antes de liberar o pending=false.
      // Com memoryLocalCache as escritas vão direto para a rede; sem este await,
      // setPending(false) pode disparar antes do onSnapshot retornar as novas
      // transações, causando render com saldo zerado.
      await waitForPendingWrites(db);

      console.log(`[materializeFixed] ${toCreate.length} tx(s) criada(s) → ${monthKey}`);
    }

    run()
      .catch((err) =>
        console.error('[materializeFixed]', (err as { code?: string })?.code ?? String(err)),
      )
      .finally(() => setPending(false));
  }, [familyId, month.getFullYear(), month.getMonth()]);

  return { pending };
}
