import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { formatCents } from '@/utils/currency';
import { formatTime } from '@/utils/date';
import type { Transaction } from '@shared/types/transaction';
import type { Category } from '@shared/types/category';

interface TransactionCardProps {
  transaction: Transaction;
  category?:   Category;
  onPress?:    () => void;
}

export function TransactionCard({ transaction, category, onPress }: TransactionCardProps) {
  const isExpense = transaction.type === 'expense';
  const sign      = isExpense ? '−' : '+';
  const color     = isExpense ? Colors.negative : Colors.positive;

  const inner = (
    <>
      {/* Ícone da categoria */}
      <View style={[styles.iconBadge, { backgroundColor: (category?.color ?? Colors.border) + '22' }]}>
        <Text style={styles.icon}>{category?.icon ?? '📦'}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {category?.name ?? 'Outros'}
        </Text>
        {transaction.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {transaction.note}
          </Text>
        ) : null}
      </View>

      {/* Valor + hora */}
      <View style={styles.right}>
        <Text style={[styles.amount, { color }]}>
          {sign} {formatCents(transaction.amountCents)}
        </Text>
        <Text style={styles.time}>
          {formatTime(transaction.date.toDate())}
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${category?.name ?? 'Lançamento'}, ${sign} ${formatCents(transaction.amountCents)}`}
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },

  iconBadge: {
    width:          44,
    height:         44,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },

  info:  { flex: 1, gap: 2 },
  name: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.medium,
    color:      Colors.textPrimary,
  },
  note: {
    fontSize: FontSize.sm,
    color:    Colors.textMuted,
  },

  right:  { alignItems: 'flex-end', gap: 2 },
  amount: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  time: {
    fontSize: FontSize.xs,
    color:    Colors.textMuted,
  },
});
