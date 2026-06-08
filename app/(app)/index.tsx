import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth.store';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { MonthSummary } from '@/components/transaction/MonthSummary';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { capitalize, formatMonthLabel } from '@/utils/date';
import { formatCents } from '@/utils/currency';

export default function HomeScreen() {
  const router = useRouter();
  const { user, family } = useAuthStore();
  const now = new Date();

  const { transactions, summary, loading } = useTransactions(now);
  const { categories }                     = useCategories();
  const { totalMonthlyCents }              = useFixedExpenses();

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const recent  = transactions.slice(0, 5);
  const firstName = user?.displayName?.split(' ')[0] ?? 'você';

  function handleSignOut() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  }

  return (
    <ScreenWrapper scrollable padded>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Olá, {firstName} 👋</Text>
          <Text style={styles.familyName}>{family?.name}</Text>
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.avatar}
          accessibilityLabel="Sair da conta"
        >
          <Text style={styles.avatarText}>
            {(user?.displayName ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mês atual */}
      <Text style={styles.monthLabel}>
        {capitalize(formatMonthLabel(now))}
      </Text>

      {/* Cards de resumo */}
      <MonthSummary
        incomeCents={summary.incomeCents}
        expenseCents={summary.expenseCents}
        balanceCents={summary.balanceCents}
      />

      {/* Gasto fixo mensal */}
      {totalMonthlyCents > 0 && (
        <View style={styles.fixedCard}>
          <Text style={styles.fixedLabel}>📋 Fixos mensais</Text>
          <Text style={styles.fixedAmount}>{formatCents(totalMonthlyCents)}</Text>
        </View>
      )}

      {/* Últimas transações */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos lançamentos</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/month')}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.seeAll}>Ver tudo</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Carregando...</Text>
          </View>
        ) : recent.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={styles.emptyTitle}>Nenhum lançamento ainda</Text>
            <Text style={styles.emptyText}>Toque no + para registrar seu primeiro gasto</Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {recent.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} category={catMap[tx.categoryId]} />
            ))}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingTop:     Spacing.lg,
    paddingBottom:  Spacing.md,
  },
  greeting:   { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  familyName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 2 },

  avatar: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: Colors.primaryFaint, borderWidth: 1, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },

  monthLabel: {
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },

  fixedCard: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  fixedLabel:  { fontSize: FontSize.sm, color: Colors.textSecondary },
  fixedAmount: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.warning },

  section: { marginTop: Spacing.lg, gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  seeAll:        { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },

  txList: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    divideY:         1,
  } as never,

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptyText:  { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
