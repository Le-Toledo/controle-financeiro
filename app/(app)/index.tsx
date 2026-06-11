import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/lib/firebase';
import { useAuthStore }    from '@/stores/auth.store';
import { useTransactions }  from '@/hooks/useTransactions';
import { useCategories }    from '@/hooks/useCategories';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { ScreenWrapper }   from '@/components/ui/ScreenWrapper';
import { SkeletonBox }     from '@/components/ui/SkeletonBox';
import { MonthSummary }    from '@/components/transaction/MonthSummary';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/theme';
import { capitalize, formatMonthLabel } from '@/utils/date';
import { formatCents } from '@/utils/currency';
import type { Transaction } from '@shared/types/transaction';

// ── Skeleton da lista de transações ──────────────────────────────────────────
function TransactionListSkeleton() {
  return (
    <View style={styles.txList}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.skeletonRow, i > 0 && styles.skeletonDivider]}>
          <SkeletonBox width={44} height={44} borderRadius={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="60%" height={14} />
            <SkeletonBox width="40%" height={11} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <SkeletonBox width={72} height={14} />
            <SkeletonBox width={36} height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Tela ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router   = useRouter();
  const { user, family } = useAuthStore();
  const familyId = family?.id;
  const now      = new Date();

  const { transactions, summary, loading: isLoading } = useTransactions(now);
  const { categories }                               = useCategories();
  const { totalMonthlyCents }                        = useFixedExpenses();

  const catMap    = Object.fromEntries(categories.map((c) => [c.id, c]));
  const recent    = transactions.slice(0, 5);
  const firstName = user?.displayName?.split(' ')[0] ?? 'você';

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSignOut() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut(auth) },
    ]);
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
        onPress: () => confirmDeleteTransaction(tx),
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

  function confirmDeleteTransaction(tx: Transaction) {
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
    <ScreenWrapper scrollable padded>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View style={{ gap: 2 }}>
          <Text style={styles.greeting}>Olá, {firstName} 👋</Text>
          <Text style={styles.familyName}>{family?.name}</Text>
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.avatar}
          accessibilityLabel="Sair da conta"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.avatarText}>
            {(user?.displayName ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Mês ── */}
      <Text style={styles.monthLabel}>
        {capitalize(formatMonthLabel(now))}
      </Text>

      {/* ── Resumo do mês (com skeleton enquanto carrega) ── */}
      <MonthSummary
        incomeCents={summary.incomeCents}
        expenseCents={summary.expenseCents}
        balanceCents={summary.balanceCents}
        loading={isLoading}
      />

      {/* ── Ações rápidas ── */}
      {!isLoading && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push({ pathname: '/(app)/launch', params: { type: 'income' } })}
            accessibilityRole="button"
            accessibilityLabel="Registrar receita"
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.positive + '1A' }]}>
              <Ionicons name="trending-up" size={18} color={Colors.positive} />
            </View>
            <Text style={[styles.quickLabel, { color: Colors.positive }]}>Registrar receita</Text>
          </TouchableOpacity>

          <View style={styles.quickSep} />

          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push('/(app)/launch')}
            accessibilityRole="button"
            accessibilityLabel="Registrar despesa"
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.negative + '1A' }]}>
              <Ionicons name="trending-down" size={18} color={Colors.negative} />
            </View>
            <Text style={[styles.quickLabel, { color: Colors.negative }]}>Registrar despesa</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Compromissos fixos ── */}
      {!isLoading && totalMonthlyCents > 0 && (
        <TouchableOpacity
          style={styles.fixedCard}
          onPress={() => router.push('/(app)/fixed')}
          accessibilityRole="button"
          accessibilityLabel={`Gastos fixos mensais: ${formatCents(totalMonthlyCents)}`}
        >
          <View style={styles.fixedLeft}>
            <View style={styles.fixedIconWrap}>
              <Text style={styles.fixedIcon}>📋</Text>
            </View>
            <View>
              <Text style={styles.fixedLabel}>Compromissos fixos</Text>
              <Text style={styles.fixedSub}>incluso nas despesas acima</Text>
            </View>
          </View>
          <View style={styles.fixedRight}>
            <Text style={styles.fixedAmount}>{formatCents(totalMonthlyCents)}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>
      )}

      {/* ── Últimas transações ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos lançamentos</Text>
          {!isLoading && recent.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/month')}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAll}>Ver tudo</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <TransactionListSkeleton />
        ) : recent.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>💸</Text>
            </View>
            <Text style={styles.emptyTitle}>Nenhum lançamento ainda</Text>
            <Text style={styles.emptyText}>
              Use o + abaixo para registrar sua primeira receita ou despesa.
            </Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {recent.map((tx, idx) => (
              <View key={tx.id} style={idx > 0 && styles.txDivider}>
                <TransactionCard
                  transaction={tx}
                  category={catMap[tx.categoryId]}
                  onPress={() => handleTransactionPress(tx)}
                />
              </View>
            ))}
          </View>
        )}
      </View>

    </ScreenWrapper>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Top bar
  topBar: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingTop:     Spacing.lg,
    paddingBottom:  Spacing.md,
  },
  greeting: {
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  familyName: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.bold,
    color:      Colors.textPrimary,
  },
  avatar: {
    width:           44,
    height:          44,
    borderRadius:    Radius.full,
    backgroundColor: Colors.primaryFaint,
    borderWidth:     1,
    borderColor:     Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
    color:      Colors.primary,
  },

  // Mês
  monthLabel: {
    fontSize:      FontSize.xs,
    color:         Colors.textMuted,
    fontWeight:    FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom:  Spacing.sm,
  },

  // Ações rápidas
  quickActions: {
    flexDirection:   'row',
    alignItems:      'center',
    marginTop:       Spacing.md,
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    overflow:        'hidden',
  },
  quickBtn: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.xs,
    paddingVertical: Spacing.sm + 4,
    minHeight:      48,
  },
  quickIcon: {
    width:          28,
    height:         28,
    borderRadius:   Radius.sm,
    alignItems:     'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  quickSep: {
    width:           1,
    height:          24,
    backgroundColor: Colors.border,
  },

  // Compromissos fixos
  fixedCard: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    marginTop:       Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  fixedLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  fixedIconWrap: {
    width:           40,
    height:          40,
    borderRadius:    Radius.sm,
    backgroundColor: Colors.warning + '18',
    alignItems:      'center',
    justifyContent:  'center',
  },
  fixedIcon:   { fontSize: 18 },
  fixedLabel:  { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  fixedSub:    { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  fixedRight:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  fixedAmount: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.warning },

  // Seção de transações
  section: {
    marginTop: Spacing.lg,
    gap:       Spacing.sm,
  },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  sectionTitle: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
    color:      Colors.textPrimary,
  },
  seeAll: {
    fontSize:   FontSize.sm,
    color:      Colors.primary,
    fontWeight: FontWeight.medium,
  },

  // Lista de transações
  txList: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    ...Shadow.sm,
  },
  txDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
  },

  // Skeleton row
  skeletonRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.md,
    paddingVertical: Spacing.md,
  },
  skeletonDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80',
  },

  // Estado vazio
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
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
  emptyEmoji: { fontSize: 32 },
  emptyTitle: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
    color:      Colors.textSecondary,
  },
  emptyText: {
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
