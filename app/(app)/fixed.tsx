import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { useAuthStore }     from '@/stores/auth.store';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { useCategories }    from '@/hooks/useCategories';
import { ScreenWrapper }    from '@/components/ui/ScreenWrapper';
import { SkeletonBox }      from '@/components/ui/SkeletonBox';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/theme';
import { formatCents }      from '@/utils/currency';
import type { FixedExpense } from '@shared/types/fixed-expense';

// ── Skeleton ─────────────────────────────────────────────────────────────────
function FixedSkeleton() {
  return (
    <View style={styles.unifiedCard}>
      {/* Hero skeleton */}
      <View style={[sk.hero]}>
        <SkeletonBox width={140} height={11} style={{ alignSelf: 'center' }} />
        <SkeletonBox width={160} height={38} borderRadius={Radius.md} style={{ alignSelf: 'center', marginTop: Spacing.sm }} />
        <SkeletonBox width={110} height={10} style={{ alignSelf: 'center', marginTop: 6 }} />
      </View>
      <View style={styles.heroDivider} />
      {/* Item skeletons */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={[sk.row, i > 0 && styles.itemDivider]}>
          <SkeletonBox width={44} height={44} borderRadius={Radius.md} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="55%" height={14} />
            <SkeletonBox width="38%" height={10} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <SkeletonBox width={88} height={14} />
            <SkeletonBox width={44} height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

const sk = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.xs, padding: Spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
});

// ── Tela ─────────────────────────────────────────────────────────────────────
export default function FixedScreen() {
  const router   = useRouter();
  const familyId = useAuthStore((s) => s.family?.id);
  const { fixedExpenses, totalMonthlyCents, loading, error, retry } = useFixedExpenses();
  const { categories } = useCategories();
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  function handleAdd() { router.push('/(app)/fixed-new'); }

  function handleItemPress(fe: FixedExpense) {
    Alert.alert(fe.label, undefined, [
      { text: 'Editar', onPress: () => router.push({ pathname: '/(app)/fixed-new', params: { id: fe.id } }) },
      { text: 'Desativar', onPress: () => confirmDeactivate(fe) },
      { text: 'Excluir', style: 'destructive', onPress: () => confirmDelete(fe) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function confirmDeactivate(fe: FixedExpense) {
    Alert.alert(
      'Desativar gasto fixo',
      `Desativar "${fe.label}"? Ele não será mais gerado nos próximos meses.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar', style: 'destructive',
          onPress: async () => {
            if (!familyId) return;
            try {
              await updateDoc(doc(db, 'families', familyId, 'fixedExpenses', fe.id),
                { active: false, endDate: serverTimestamp(), updatedAt: serverTimestamp() });
            } catch (err: unknown) {
              const e = err as { code?: string; message?: string };
              console.error('[confirmDeactivate] ERRO:', e.code, '|', e.message);
              Alert.alert('Erro', 'Não foi possível desativar. Tente novamente.');
            }
          },
        },
      ],
    );
  }

  function confirmDelete(fe: FixedExpense) {
    Alert.alert(
      'Excluir gasto fixo',
      `Tem certeza que deseja excluir "${fe.label}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            if (!familyId) return;
            try {
              await deleteDoc(doc(db, 'families', familyId, 'fixedExpenses', fe.id));
            } catch (err: unknown) {
              const e = err as { code?: string; message?: string };
              console.error('[confirmDelete] ERRO:', e.code, '|', e.message);
              Alert.alert('Erro', 'Não foi possível excluir. Tente novamente.');
            }
          },
        },
      ],
    );
  }

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Gastos Fixos</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn} accessibilityLabel="Adicionar gasto fixo">
          <Ionicons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <FixedSkeleton />
        ) : error ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIconWrap, { backgroundColor: Colors.negative + '18' }]}>
              <Ionicons name="cloud-offline-outline" size={30} color={Colors.negative} />
            </View>
            <Text style={styles.emptyTitle}>Erro ao carregar</Text>
            <Text style={styles.emptyText}>Verifique sua conexão e tente novamente.</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { borderColor: Colors.negative + '40', backgroundColor: Colors.negative + '12' }]}
              onPress={retry}
            >
              <Ionicons name="refresh-outline" size={16} color={Colors.negative} />
              <Text style={[styles.emptyBtnText, { color: Colors.negative }]}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : fixedExpenses.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>📋</Text>
            </View>
            <Text style={styles.emptyTitle}>Nenhum gasto fixo</Text>
            <Text style={styles.emptyText}>
              Aluguel, internet, escola... adicione as contas que se repetem todo mês.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleAdd}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.emptyBtnText}>Adicionar gasto fixo</Text>
            </TouchableOpacity>
          </View>
        ) : (

          /* ── Card unificado: hero + lista ── */
          <View style={styles.unifiedCard}>

            {/* Hero */}
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>COMPROMETIDO POR MÊS</Text>
              <Text style={styles.heroAmount}>{formatCents(totalMonthlyCents)}</Text>
              <Text style={styles.heroSub}>
                {fixedExpenses.length} compromisso{fixedExpenses.length !== 1 ? 's' : ''} ativo{fixedExpenses.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.heroDivider} />

            {/* Lista de itens */}
            {fixedExpenses.map((fe, index) => (
              <FixedItem
                key={fe.id}
                item={fe}
                catName={catMap[fe.categoryId]?.name}
                catIcon={catMap[fe.categoryId]?.icon}
                catColor={catMap[fe.categoryId]?.color}
                total={totalMonthlyCents}
                isLast={index === fixedExpenses.length - 1}
                showDivider={index > 0}
                onPress={() => handleItemPress(fe)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

// ── Item ──────────────────────────────────────────────────────────────────────
interface FixedItemProps {
  item:       FixedExpense;
  catName?:   string;
  catIcon?:   string;
  catColor?:  string;
  total:      number;
  isLast:     boolean;
  showDivider: boolean;
  onPress:    () => void;
}

function FixedItem({ item, catName, catIcon, catColor, total, isLast, showDivider, onPress }: FixedItemProps) {
  const pct      = total > 0 ? Math.round((item.amountCents / total) * 100) : 0;
  const barWidth = Math.max(4, Math.min(56, Math.round(pct * 0.56)));  // 0-100% → 0-56px
  const accent   = catColor ?? Colors.warning;

  return (
    <TouchableOpacity
      style={[
        styles.item,
        showDivider && styles.itemDivider,
        isLast && styles.itemLast,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}, ${formatCents(item.amountCents)}`}
    >
      {/* Ícone */}
      <View style={[styles.iconBadge, { backgroundColor: accent + '22' }]}>
        <Text style={styles.icon}>{catIcon ?? '📦'}</Text>
      </View>

      {/* Nome + categoria */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
        <Text style={styles.itemMeta}  numberOfLines={1}>{catName ?? 'Outros'}</Text>
      </View>

      {/* Valor + barra — largura fixa, nunca comprimido */}
      <View style={styles.itemRight}>
        <Text style={styles.itemAmount} numberOfLines={1}>
          {formatCents(item.amountCents)}
        </Text>
        <View style={styles.pctRow}>
          <View style={styles.pctTrack}>
            <View style={[styles.pctFill, { width: barWidth, backgroundColor: accent }]} />
          </View>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor:   Colors.surface,
  },
  title:  { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryFaint,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },

  content: {
    padding:       Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // ── Card unificado ────────────────────────────────────────────────────────
  unifiedCard: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     Colors.warning + '50',
    borderTopWidth:  3,
    borderTopColor:  Colors.warning,
    overflow:        'hidden',
    ...Shadow.md,
  },

  hero: {
    alignItems:        'center',
    paddingVertical:   Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap:               Spacing.xs,
  },
  heroLabel: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.semibold,
    color:         Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heroAmount: {
    fontSize:      FontSize['3xl'],
    fontWeight:    FontWeight.extrabold,
    color:         Colors.warning,
    letterSpacing: -1,
  },
  heroSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },

  heroDivider: { height: 1, backgroundColor: Colors.border },

  // ── Item ──────────────────────────────────────────────────────────────────
  item: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.md,
    paddingVertical:   Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  itemDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  itemLast:    {},   // reservado para expansão futura

  iconBadge: {
    width: 44, height: 44,
    borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: 20 },

  itemInfo: { flex: 1, gap: 2, minWidth: 0 },  // minWidth:0 permite truncar texto
  itemLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  itemMeta:  { fontSize: FontSize.sm, color: Colors.textMuted },

  // CORREÇÃO: flexShrink:0 + minWidth garante que o valor não é espremido
  itemRight: {
    alignItems: 'flex-end',
    gap:        4,
    flexShrink: 0,
    minWidth:   96,
  },
  itemAmount: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
    color:      Colors.textPrimary,
  },

  // Barra de percentual com largura absoluta (não %)
  pctRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pctTrack: {
    width:           56,
    height:          3,
    borderRadius:    Radius.full,
    backgroundColor: Colors.border,
    overflow:        'hidden',
  },
  pctFill: { height: '100%', borderRadius: Radius.full },
  pctText: {
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
    fontWeight: FontWeight.medium,
    minWidth:   28,
    textAlign:  'right',
  },

  // ── Estados ───────────────────────────────────────────────────────────────
  empty: {
    backgroundColor:   Colors.card,
    borderRadius:      Radius.xl,
    borderWidth:       1,
    borderColor:       Colors.border,
    alignItems:        'center',
    justifyContent:    'center',
    gap:               Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.xxl,
    minHeight:         260,
  },
  emptyIconWrap: {
    width: 64, height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.cardRaised,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyEmoji: { fontSize: 30 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFaint,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  emptyBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
});
