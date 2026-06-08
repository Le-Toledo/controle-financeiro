import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { useAuthStore }      from '@/stores/auth.store';
import { useFixedExpenses }  from '@/hooks/useFixedExpenses';
import { useCategories }     from '@/hooks/useCategories';
import { ScreenWrapper }     from '@/components/ui/ScreenWrapper';
import { Button }            from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { formatCents }       from '@/utils/currency';
import { formatDueDay }      from '@/utils/date';
import type { FixedExpense } from '@shared/types/fixed-expense';
import NewFixedExpenseSheet  from './fixed-new';

export default function FixedScreen() {
  const router    = useRouter();
  const familyId  = useAuthStore((s) => s.family?.id);
  const { fixedExpenses, totalMonthlyCents, loading } = useFixedExpenses();
  const { categories } = useCategories();
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const [showForm, setShowForm] = useState(false);

  async function handleDeactivate(fe: FixedExpense) {
    Alert.alert(
      'Desativar gasto fixo',
      `Desativar "${fe.label}"? Ele não será mais gerado nos próximos meses.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            if (!familyId) return;
            await updateDoc(
              doc(db, 'families', familyId, 'fixedExpenses', fe.id),
              { active: false, endDate: serverTimestamp(), updatedAt: serverTimestamp() },
            );
          },
        },
      ],
    );
  }

  if (showForm) {
    return <NewFixedExpenseSheet onClose={() => setShowForm(false)} />;
  }

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gastos Fixos</Text>
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={styles.addBtn}
          accessibilityLabel="Adicionar gasto fixo"
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Total mensal */}
      {totalMonthlyCents > 0 && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total mensal em fixos</Text>
          <Text style={styles.totalAmount}>{formatCents(totalMonthlyCents)}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : fixedExpenses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Nenhum gasto fixo</Text>
          <Text style={styles.emptyText}>
            Aluguel, internet, escola... adicione as contas que se repetem todo mês.
          </Text>
          <Button
            label="+ Adicionar gasto fixo"
            variant="ghost"
            fullWidth={false}
            onPress={() => setShowForm(true)}
            style={{ marginTop: Spacing.md }}
          />
        </View>
      ) : (
        <FlatList
          data={fixedExpenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const cat = catMap[item.categoryId];
            return (
              <View style={styles.card}>
                <View style={[styles.iconBadge, { backgroundColor: (cat?.color ?? Colors.border) + '22' }]}>
                  <Text style={styles.icon}>{cat?.icon ?? '📦'}</Text>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={styles.cardMeta}>
                    Vence dia {formatDueDay(item.dueDay)} · {cat?.name ?? 'Outros'}
                  </Text>
                </View>

                <View style={styles.cardRight}>
                  <Text style={styles.cardAmount}>{formatCents(item.amountCents)}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeactivate(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={`Desativar ${item.label}`}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title:  { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: { padding: Spacing.sm, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },

  totalCard: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    marginHorizontal: Spacing.lg,
    marginTop:       Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  totalLabel:  { fontSize: FontSize.sm, color: Colors.textMuted },
  totalAmount: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.warning },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { paddingVertical: Spacing.md },
  separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },

  card: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  iconBadge: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  icon:     { fontSize: 20 },
  cardInfo: { flex: 1, gap: 2 },
  cardLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  cardMeta:  { fontSize: FontSize.sm, color: Colors.textMuted },
  cardRight: { alignItems: 'flex-end', gap: Spacing.xs },
  cardAmount: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptyText:  { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
