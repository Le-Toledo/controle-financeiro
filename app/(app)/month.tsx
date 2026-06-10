import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SectionList, Alert, ScrollView,
} from 'react-native';
import { addMonths, subMonths } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { db } from '@/lib/firebase';
import { useAuthStore }    from '@/stores/auth.store';
import { useTransactions }     from '@/hooks/useTransactions';
import { useCategories }       from '@/hooks/useCategories';
import { useMaterializeFixed } from '@/hooks/useMaterializeFixed';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { MonthSummary }    from '@/components/transaction/MonthSummary';
import { ScreenWrapper }   from '@/components/ui/ScreenWrapper';
import { SkeletonBox }     from '@/components/ui/SkeletonBox';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/theme';
import { groupByDay, capitalize, formatMonthLabel } from '@/utils/date';
import type { Transaction } from '@shared/types/transaction';

// ── Skeleton ─────────────────────────────────────────────────────────────────
function MonthScreenSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={skStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Resumo skeleton */}
      <View style={skStyles.summaryPad}>
        <MonthSummary incomeCents={0} expenseCents={0} balanceCents={0} loading />
      </View>

      {/* Dois grupos de dia skeleton */}
      {[3, 2].map((count, gi) => (
        <View key={gi}>
          {/* Day header skeleton */}
          <View style={skStyles.dayHeaderWrap}>
            <SkeletonBox width={90} height={11} />
          </View>

          {/* Rows skeleton dentro de card */}
          <View style={[skStyles.sectionCard, gi > 0 && { marginTop: Spacing.sm }]}>
            {Array.from({ length: count }).map((_, i) => (
              <View
                key={i}
                style={[skStyles.row, i > 0 && skStyles.rowDivider]}
              >
                <SkeletonBox width={44} height={44} borderRadius={Radius.md} />
                <View style={{ flex: 1, gap: 6 }}>
                  <SkeletonBox width="55%" height={14} />
                  <SkeletonBox width="38%" height={11} />
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <SkeletonBox width={72} height={14} />
                  <SkeletonBox width={36} height={10} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const skStyles = StyleSheet.create({
  scrollContent: { paddingBottom: Spacing.xxl },
  summaryPad:    { padding: Spacing.lg },
  dayHeaderWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.sm,
  },
  sectionCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor:  Colors.card,
    borderRadius:     Radius.lg,
    borderWidth:      1,
    borderColor:      Colors.border,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
  },
});

// ── Tela ─────────────────────────────────────────────────────────────────────
export default function MonthScreen() {
  const router   = useRouter();
  const familyId = useAuthStore((s) => s.family?.id);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { transactions, summary, loading }  = useTransactions(currentMonth);
  const { categories }                      = useCategories();
  const { pending: materializing }          = useMaterializeFixed(currentMonth);
  const isLoading = loading || materializing;

  const catMap  = Object.fromEntries(categories.map((c) => [c.id, c]));
  const grouped = groupByDay(transactions);

  const sections = grouped.map(({ dateKey, label, items }) => ({
    key:   dateKey,
    title: label,
    data:  items,
  }));

  const isCurrentMonth =
    currentMonth.getMonth()    === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear();

  // ── Handlers ───────────────────────────────────────────────────────────────
  function prevMonth() { setCurrentMonth((d) => subMonths(d, 1)); }
  function nextMonth() {
    const next = addMonths(currentMonth, 1);
    if (next <= new Date()) setCurrentMonth(next);
  }

  function handleTransactionPress(tx: Transaction) {
    if (tx.source === 'fixed') {
      Alert.alert(
        'Gasto fixo recorrente',
        'Excluir remove este lançamento e desativa a cobrança nos próximos meses.',
        [
          {
            text: 'Editar gasto fixo',
            onPress: () =>
              router.push({ pathname: '/(app)/fixed-new', params: { id: tx.fixedExpenseId } }),
          },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => excluirFixed(tx),
          },
          { text: 'Cancelar', style: 'cancel' },
        ],
      );
      return;
    }
    Alert.alert('Lançamento', undefined, [
      {
        text: 'Editar',
        onPress: () => router.push({ pathname: '/(app)/launch', params: { id: tx.id } }),
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => confirmDelete(tx),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function excluirFixed(tx: Transaction) {
    if (!familyId) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, 'families', familyId, 'transactions', tx.id));
    if (tx.fixedExpenseId) {
      batch.delete(doc(db, 'families', familyId, 'fixedExpenses', tx.fixedExpenseId));
    }
    batch.commit().catch((err: unknown) => {
      const e = err as { code?: string; message?: string };
      console.error('[excluirFixed] ERRO:', e.code, '|', e.message);
      Alert.alert('Erro', 'Não foi possível excluir. Tente novamente.');
    });
  }

  function confirmDelete(tx: Transaction) {
    Alert.alert('Excluir lançamento', 'Tem certeza? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!familyId) return;
          try {
            await deleteDoc(doc(db, 'families', familyId, 'transactions', tx.id));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir. Tente novamente.');
          }
        },
      },
    ]);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>

      {/* ── Navegação de mês ── */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={prevMonth}
          style={styles.navBtn}
          accessibilityLabel="Mês anterior"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.monthTitleWrap}>
          <Text style={styles.monthTitle}>
            {capitalize(formatMonthLabel(currentMonth))}
          </Text>
          {!isLoading && transactions.length > 0 && (
            <Text style={styles.monthCount}>
              {transactions.length} lançamento{transactions.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={nextMonth}
          disabled={isCurrentMonth}
          style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
          accessibilityLabel="Próximo mês"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={isCurrentMonth ? Colors.border : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* ── Conteúdo ── */}
      {isLoading ? (
        <MonthScreenSkeleton />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}

          ListHeaderComponent={
            <View style={styles.summaryPad}>
              <MonthSummary
                incomeCents={summary.incomeCents}
                expenseCents={summary.expenseCents}
                balanceCents={summary.balanceCents}
              />
            </View>
          }

          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Text style={styles.emptyEmoji}>📅</Text>
                </View>
                <Text style={styles.emptyTitle}>Nenhum lançamento</Text>
                <Text style={styles.emptyText}>
                  Use o + para registrar receitas e despesas deste mês.
                </Text>
              </View>
            </View>
          }

          renderSectionHeader={({ section }) => (
            <View style={styles.dayHeaderWrap}>
              <View style={styles.dayHeaderPill}>
                <Text style={styles.dayHeaderText}>{section.title}</Text>
              </View>
            </View>
          )}

          renderItem={({ item, section, index }) => {
            const isFirst = index === 0;
            const isLast  = index === section.data.length - 1;
            return (
              <View
                style={[
                  styles.txWrapper,
                  isFirst && styles.txFirst,
                  isLast  && styles.txLast,
                  !isFirst && styles.txDivider,
                ]}
              >
                <TransactionCard
                  transaction={item}
                  category={catMap[item.categoryId]}
                  onPress={() => handleTransactionPress(item)}
                />
              </View>
            );
          }}

          renderSectionFooter={() => <View style={styles.sectionGap} />}
        />
      )}
    </ScreenWrapper>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Navegação de mês
  monthNav: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor:   Colors.surface,
  },
  navBtn: {
    width:           44,
    height:          44,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    Radius.md,
    backgroundColor: Colors.card,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  navBtnDisabled: { opacity: 0.4 },
  monthTitleWrap: { alignItems: 'center', gap: 2 },
  monthTitle: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.semibold,
    color:      Colors.textPrimary,
  },
  monthCount: {
    fontSize:  FontSize.xs,
    color:     Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  // Lista
  listContent: { paddingBottom: Spacing.xxl },
  summaryPad:  { padding: Spacing.lg },

  // Day header
  dayHeaderWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.xs,
  },
  dayHeaderPill: {
    alignSelf:       'flex-start',
    backgroundColor: Colors.cardRaised,
    borderRadius:    Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   3,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  dayHeaderText: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.semibold,
    color:         Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Itens de transação (cartão por grupo de dia)
  txWrapper: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  txFirst:   { borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  txLast:    { borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg, borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  txDivider: { borderTopWidth: 1, borderTopColor: Colors.border + '80', borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },

  sectionGap: { height: Spacing.xs },

  // Estado vazio
  emptyWrap: { paddingHorizontal: Spacing.lg },
  empty: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     Colors.border,
    alignItems:      'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap:             Spacing.sm,
  },
  emptyIconWrap: {
    width:           64,
    height:          64,
    borderRadius:    Radius.full,
    backgroundColor: Colors.cardRaised,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.xs,
  },
  emptyEmoji: { fontSize: 30 },
  emptyTitle: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.semibold,
    color:      Colors.textSecondary,
  },
  emptyText: {
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
    textAlign:  'center',
    lineHeight: 20,
  },
});
