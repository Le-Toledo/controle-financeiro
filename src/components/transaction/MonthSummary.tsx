import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { formatCents } from '@/utils/currency';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

interface MonthSummaryProps {
  incomeCents:  number;
  expenseCents: number;
  balanceCents: number;
  loading?:     boolean;
}

export function MonthSummary({
  incomeCents,
  expenseCents,
  balanceCents,
  loading = false,
}: MonthSummaryProps) {
  if (loading) {
    return (
      <View style={styles.wrapper}>
        {/* Skeleton do card de saldo */}
        <View style={[styles.balanceCard, styles.balanceCardSkeleton]}>
          <SkeletonBox width={100} height={12} style={{ alignSelf: 'center' }} />
          <SkeletonBox width={180} height={44} borderRadius={Radius.md} style={{ alignSelf: 'center', marginTop: Spacing.sm }} />
        </View>

        {/* Skeleton das pills */}
        <View style={styles.row}>
          <View style={[styles.pill, { flex: 1 }]}>
            <SkeletonBox width={32} height={32} borderRadius={Radius.sm} />
            <View style={{ gap: 6, flex: 1 }}>
              <SkeletonBox width={60} height={10} />
              <SkeletonBox width={90} height={16} />
            </View>
          </View>
          <View style={[styles.pill, { flex: 1 }]}>
            <SkeletonBox width={32} height={32} borderRadius={Radius.sm} />
            <View style={{ gap: 6, flex: 1 }}>
              <SkeletonBox width={60} height={10} />
              <SkeletonBox width={90} height={16} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  const balancePositive = balanceCents >= 0;
  const balanceColor    = balancePositive ? Colors.positive : Colors.negative;
  const balancePrefix   = balancePositive ? '+' : '−';

  // Barra de progresso despesas/receitas (mostra quanto das receitas já foi gasto)
  const progressRatio = incomeCents > 0
    ? Math.min(expenseCents / incomeCents, 1)
    : expenseCents > 0 ? 1 : 0;
  const progressColor = progressRatio >= 1
    ? Colors.negative
    : progressRatio >= 0.8
    ? Colors.warning
    : Colors.positive;

  return (
    <View style={styles.wrapper}>
      {/* Saldo principal */}
      <View style={[styles.balanceCard, { borderColor: balanceColor + '30' }]}>
        <Text style={styles.balanceLabel}>SALDO DO MÊS</Text>
        <Text style={[styles.balanceAmount, { color: balanceColor }]}>
          {balancePrefix} {formatCents(Math.abs(balanceCents))}
        </Text>
        {!balancePositive && (
          <Text style={styles.balanceWarning}>acima das receitas do mês</Text>
        )}

        {/* Barra de progresso */}
        {incomeCents > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressRatio * 100}%` as `${number}%`, backgroundColor: progressColor },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: progressColor }]}>
              {Math.round(progressRatio * 100)}% comprometido
            </Text>
          </View>
        )}
      </View>

      {/* Pills: Receitas / Despesas */}
      <View style={styles.row}>
        <View style={[styles.pill, styles.incomePill]}>
          <View style={[styles.pillIconWrap, { backgroundColor: Colors.positive + '18' }]}>
            <Ionicons name="trending-up" size={18} color={Colors.positive} />
          </View>
          <View style={styles.pillText}>
            <Text style={styles.pillLabel}>Receitas</Text>
            <Text style={[styles.pillAmount, { color: Colors.positive }]}>
              {formatCents(incomeCents)}
            </Text>
          </View>
        </View>

        <View style={[styles.pill, styles.expensePill]}>
          <View style={[styles.pillIconWrap, { backgroundColor: Colors.negative + '18' }]}>
            <Ionicons name="trending-down" size={18} color={Colors.negative} />
          </View>
          <View style={styles.pillText}>
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
  wrapper: { gap: Spacing.sm },

  balanceCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.lg,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             Spacing.xs,
  },
  balanceCardSkeleton: {
    paddingVertical: Spacing.xl,
  },
  balanceLabel: {
    fontSize:      FontSize.xs,
    color:         Colors.textMuted,
    fontWeight:    FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  balanceAmount: {
    fontSize:      FontSize['4xl'],
    fontWeight:    FontWeight.extrabold,
    letterSpacing: -1.5,
  },
  balanceWarning: {
    fontSize:  FontSize.xs,
    color:     Colors.negative,
    marginTop: 2,
  },

  progressWrap: {
    width: '100%',
    gap:   Spacing.xs,
    marginTop: Spacing.sm,
  },
  progressTrack: {
    height:          4,
    borderRadius:    Radius.full,
    backgroundColor: Colors.border,
    overflow:        'hidden',
  },
  progressFill: {
    height:       '100%',
    borderRadius: Radius.full,
  },
  progressLabel: {
    fontSize:  FontSize.xs,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },

  row: {
    flexDirection: 'row',
    gap:           Spacing.sm,
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
  incomePill:  { borderLeftWidth: 3, borderLeftColor: Colors.positive },
  expensePill: { borderLeftWidth: 3, borderLeftColor: Colors.negative },

  pillIconWrap: {
    width:          36,
    height:         36,
    borderRadius:   Radius.sm,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pillText: { flex: 1, gap: 2 },
  pillLabel: {
    fontSize: FontSize.xs,
    color:    Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  pillAmount: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
