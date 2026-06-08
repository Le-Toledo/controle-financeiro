import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SectionList, ActivityIndicator,
} from 'react-native';
import { addMonths, subMonths } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories }   from '@/hooks/useCategories';
import { TransactionCard } from '@/components/transaction/TransactionCard';
import { MonthSummary }    from '@/components/transaction/MonthSummary';
import { ScreenWrapper }   from '@/components/ui/ScreenWrapper';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { groupByDay, capitalize, formatMonthLabel } from '@/utils/date';

export default function MonthScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { transactions, summary, loading } = useTransactions(currentMonth);
  const { categories } = useCategories();

  const catMap  = Object.fromEntries(categories.map((c) => [c.id, c]));
  const grouped = groupByDay(transactions);

  const sections = grouped.map(({ dateKey, label, items }) => ({
    key: dateKey,
    title: label,
    data:  items,
  }));

  function prevMonth() { setCurrentMonth((d) => subMonths(d, 1)); }
  function nextMonth() {
    const next = addMonths(currentMonth, 1);
    if (next <= new Date()) setCurrentMonth(next);
  }

  const isCurrentMonth =
    currentMonth.getMonth()    === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear();

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      {/* Header de navegação de mês */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} accessibilityLabel="Mês anterior" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {capitalize(formatMonthLabel(currentMonth))}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          disabled={isCurrentMonth}
          accessibilityLabel="Próximo mês"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={isCurrentMonth ? Colors.border : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
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
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>Nenhum lançamento</Text>
              <Text style={styles.emptyText}>
                Toque no + para registrar receitas e despesas
              </Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.dayHeader}>{section.title}</Text>
          )}
          renderItem={({ item, section, index }) => {
            const isLast = index === section.data.length - 1;
            return (
              <View style={[styles.txWrapper, !isLast && styles.txDivider]}>
                <TransactionCard transaction={item} category={catMap[item.categoryId]} />
              </View>
            );
          }}
          renderSectionFooter={() => <View style={styles.sectionGap} />}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  monthNav: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  monthTitle: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.semibold,
    color:      Colors.textPrimary,
  },

  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent:   { paddingBottom: Spacing.xxl },
  summaryPad:    { padding: Spacing.lg },

  dayHeader: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    color:      Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.sm,
    backgroundColor:   Colors.bg,
  },

  txWrapper:   { paddingHorizontal: Spacing.lg },
  txDivider:   { borderBottomWidth: 1, borderBottomColor: Colors.border + '66' },
  sectionGap:  { height: Spacing.sm, backgroundColor: Colors.surface },

  empty:      { alignItems: 'center', paddingVertical: Spacing.xxl * 1.5, gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptyText:  { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
