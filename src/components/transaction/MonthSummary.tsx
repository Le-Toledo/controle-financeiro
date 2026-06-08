import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { formatCents } from '@/utils/currency';

interface MonthSummaryProps {
  incomeCents:  number;
  expenseCents: number;
  balanceCents: number;
}

export function MonthSummary({ incomeCents, expenseCents, balanceCents }: MonthSummaryProps) {
  const balanceColor = balanceCents >= 0 ? Colors.positive : Colors.negative;

  return (
    <View style={styles.wrapper}>
      {/* Saldo principal */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo do mês</Text>
        <Text style={[styles.balanceAmount, { color: balanceColor }]}>
          {formatCents(Math.abs(balanceCents))}
        </Text>
        {balanceCents < 0 && (
          <Text style={styles.balanceNegativeHint}>acima do que entrou</Text>
        )}
      </View>

      {/* Linha income / expense */}
      <View style={styles.row}>
        <View style={[styles.pill, styles.incomePill]}>
          <Text style={styles.pillIcon}>↑</Text>
          <View>
            <Text style={styles.pillLabel}>Receitas</Text>
            <Text style={[styles.pillAmount, { color: Colors.positive }]}>
              {formatCents(incomeCents)}
            </Text>
          </View>
        </View>

        <View style={[styles.pill, styles.expensePill]}>
          <Text style={styles.pillIcon}>↓</Text>
          <View>
            <Text style={styles.pillLabel}>Despesas</Text>
            <Text style={[styles.pillAmount, { color: Colors.negative }]}>
              {formatCents(expenseCents)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.md },

  balanceCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.xl,
    padding:         Spacing.xl,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             Spacing.xs,
  },
  balanceLabel: {
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize:   FontSize['4xl'],
    fontWeight: FontWeight.extrabold,
    letterSpacing: -1.5,
  },
  balanceNegativeHint: {
    fontSize: FontSize.xs,
    color:    Colors.negative,
  },

  row: {
    flexDirection: 'row',
    gap:           Spacing.md,
  },

  pill: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.sm,
    padding:         Spacing.md,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    backgroundColor: Colors.card,
  },
  incomePill:  {},
  expensePill: {},

  pillIcon: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.bold,
    color:      Colors.textMuted,
    width:      24,
    textAlign:  'center',
  },
  pillLabel: {
    fontSize: FontSize.xs,
    color:    Colors.textMuted,
  },
  pillAmount: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
