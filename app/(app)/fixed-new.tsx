import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  addDoc, updateDoc, doc, getDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { format, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/lib/firebase';
import { fixedExpensesCol, transactionsCol } from '@/lib/firestore.refs';
import { useAuthStore }   from '@/stores/auth.store';
import { useCategories }  from '@/hooks/useCategories';
import { AmountKeypad }   from '@/components/ui/AmountKeypad';
import { CategoryPicker } from '@/components/ui/CategoryPicker';
import { SkeletonBox }    from '@/components/ui/SkeletonBox';
import { Button }         from '@/components/ui/Button';
import { Input }          from '@/components/ui/Input';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { digitsToCents }  from '@/utils/currency';
import { CreateFixedExpenseSchema, type CreateFixedExpenseInput } from '@shared/schemas/fixed-expense.schema';
import type { Category } from '@shared/types/category';

// ── Skeleton de edição ────────────────────────────────────────────────────────
function EditLoadingSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SkeletonBox width={32} height={32} borderRadius={Radius.sm} />
        <SkeletonBox width={160} height={18} />
        <View style={{ width: 32 }} />
      </View>
      <View style={sk.body}>
        {/* Nome da conta skeleton */}
        <View style={sk.section}>
          <SkeletonBox width={100} height={10} />
          <SkeletonBox height={48} borderRadius={Radius.md} />
        </View>
        {/* Keypad skeleton */}
        <SkeletonBox height={88} borderRadius={Radius.lg} />
        {/* Data skeleton */}
        <View style={sk.section}>
          <SkeletonBox width={120} height={10} />
          <SkeletonBox height={48} borderRadius={Radius.md} />
        </View>
        {/* Categoria skeleton */}
        <View style={sk.section}>
          <SkeletonBox width={80} height={10} />
          <View style={sk.chips}>
            {[88, 104, 80, 112].map((w, i) => (
              <SkeletonBox key={i} width={w} height={44} borderRadius={Radius.full} />
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const sk = StyleSheet.create({
  body:    { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  chips:   { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
});

// ── Tela ─────────────────────────────────────────────────────────────────────
export default function FixedExpenseFormScreen() {
  const router   = useRouter();
  const { id }   = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const familyId = useAuthStore((s) => s.family?.id);
  const { categories, loading: catLoading } = useCategories();

  const [digits,            setDigits]           = useState('');
  const [category,          setCategory]         = useState<Category | null>(null);
  const [saving,            setSaving]           = useState(false);
  const [startDate,         setStartDate]        = useState(new Date());
  const [showDatePicker,    setShowDatePicker]   = useState(false);
  const [loadingEdit,       setLoadingEdit]      = useState(isEditing);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<CreateFixedExpenseInput>({
    resolver: zodResolver(CreateFixedExpenseSchema),
    defaultValues: { label: '', responsibleUserId: auth.currentUser?.uid ?? '' },
  });

  useEffect(() => {
    if (!pendingCategoryId || categories.length === 0) return;
    const cat = categories.find((c) => c.id === pendingCategoryId);
    if (cat) { setCategory(cat); setPendingCategoryId(null); }
  }, [pendingCategoryId, categories]);

  useEffect(() => {
    if (!id || !familyId) return;
    setLoadingEdit(true);
    getDoc(doc(db, 'families', familyId, 'fixedExpenses', id))
      .then((snap) => {
        if (!snap.exists()) { router.back(); return; }
        const data = snap.data();
        reset({ label: data.label, responsibleUserId: data.responsibleUserId });
        setDigits(String(data.amountCents));
        setStartDate(data.startDate.toDate());
        setPendingCategoryId(data.categoryId);
      })
      .catch(() => router.back())
      .finally(() => setLoadingEdit(false));
  }, [id, familyId]);

  function onDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) setStartDate(selectedDate);
  }

  async function onSubmit(data: CreateFixedExpenseInput) {
    if (!familyId) return;
    const cents = digitsToCents(digits);
    if (cents <= 0) { Alert.alert('Valor inválido', 'Digite um valor maior que zero.'); return; }
    if (!category)  { Alert.alert('Categoria', 'Selecione uma categoria.'); return; }

    setSaving(true);
    try {
      if (isEditing && id) {
        await updateDoc(doc(db, 'families', familyId, 'fixedExpenses', id), {
          label:             data.label.trim(),
          amountCents:       cents,
          categoryId:        category.id,
          responsibleUserId: auth.currentUser!.uid,
          startDate:         Timestamp.fromDate(startDate),
          updatedAt:         serverTimestamp(),
        });
      } else {
        const uid = auth.currentUser!.uid;
        const feRef = await addDoc(fixedExpensesCol(familyId), {
          label:             data.label.trim(),
          amountCents:       cents,
          categoryId:        category.id,
          responsibleUserId: uid,
          active:            true,
          startDate:         Timestamp.fromDate(startDate),
          createdAt:         serverTimestamp(),
          updatedAt:         serverTimestamp(),
        } as Parameters<typeof addDoc>[1]);

        // Create the transaction for the current month immediately so it appears
        // in the Home and Report screens without waiting for a component remount.
        const now      = new Date();
        const monthEnd = endOfMonth(now);
        if (startDate <= monthEnd) {
          await addDoc(transactionsCol(familyId), {
            amountCents:    cents,
            type:           'expense' as const,
            categoryId:     category.id,
            note:           data.label.trim(),
            authorId:       uid,
            date:           Timestamp.fromDate(new Date()),
            source:         'fixed' as const,
            fixedExpenseId: feRef.id,
            createdAt:      serverTimestamp(),
            updatedAt:      serverTimestamp(),
          } as Parameters<typeof addDoc>[1]);
        }
      }
      setDigits('');
      reset({ label: '', responsibleUserId: auth.currentUser?.uid ?? '' });
      setCategory(null);
      setStartDate(new Date());
      setShowDatePicker(false);
      router.back();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? 'desconhecido';
      console.error('[FixedNew] erro ao salvar:', code, err);
      Alert.alert('Erro ao salvar', `Código: ${code}\n\nTente novamente.`);
    } finally {
      setSaving(false);
    }
  }

  if (loadingEdit) return <EditLoadingSkeleton />;

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Fechar"
        >
          <Ionicons name="close" size={22} color={Colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.title}>
          {isEditing ? 'Editar gasto fixo' : 'Novo gasto fixo'}
        </Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Nome da conta ── */}
        <View style={styles.fieldPad}>
          <Controller
            control={control}
            name="label"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nome da conta"
                placeholder="ex: Aluguel, Internet, Escola"
                autoCapitalize="words"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.label?.message}
              />
            )}
          />
        </View>

        {/* ── Valor ── */}
        <AmountKeypad digits={digits} onChange={setDigits} />

        {/* ── Data de início ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Início da cobrança</Text>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowDatePicker((prev) => !prev)}
            accessibilityLabel={`Data de início: ${format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.dateValue}>
              {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
            <Ionicons
              name={showDatePicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.textMuted}
            />
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={startDate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                locale="pt-BR"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setShowDatePicker(false)}
                  accessibilityLabel="Confirmar data"
                >
                  <Text style={styles.doneBtnText}>Feito</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Categoria ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Categoria</Text>
          {catLoading ? (
            <View style={styles.catSkeleton}>
              {[88, 104, 80, 112].map((w, i) => (
                <SkeletonBox key={i} width={w} height={44} borderRadius={Radius.full} />
              ))}
            </View>
          ) : (
            <CategoryPicker
              categories={categories}
              selectedId={category?.id ?? null}
              type="expense"
              onSelect={setCategory}
            />
          )}
        </View>

        {/* ── Salvar ── */}
        <View style={styles.saveSection}>
          <Button
            label={isEditing ? 'Salvar alterações' : 'Salvar gasto fixo'}
            loading={saving}
            onPress={handleSubmit(onSubmit)}
            size="lg"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width:           44,
    height:          44,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    Radius.sm,
  },
  title: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.semibold,
    color:      Colors.textPrimary,
  },

  fieldPad: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  // Seções
  section: { marginTop: Spacing.lg },
  sectionLabel: {
    fontSize:          FontSize.xs,
    fontWeight:        FontWeight.semibold,
    color:             Colors.textMuted,
    textTransform:     'uppercase',
    letterSpacing:     1.5,
    paddingHorizontal: Spacing.lg,
    marginBottom:      Spacing.sm,
  },

  // Skeleton de categorias
  catSkeleton: {
    flexDirection:     'row',
    paddingHorizontal: Spacing.lg,
    gap:               Spacing.sm,
  },

  // Date row
  dateRow: {
    flexDirection:     'row',
    alignItems:        'center',
    marginHorizontal:  Spacing.lg,
    backgroundColor:   Colors.card,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 4,
    gap:               Spacing.sm,
    minHeight:         48,
  },
  dateValue: {
    flex:       1,
    fontSize:   FontSize.base,
    color:      Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },

  pickerWrap: {
    marginHorizontal: Spacing.lg,
    marginTop:        Spacing.sm,
    backgroundColor:  Colors.card,
    borderRadius:     Radius.md,
    borderWidth:      1,
    borderColor:      Colors.border,
    overflow:         'hidden',
  },
  doneBtn: {
    alignItems:        'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.sm,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
  },
  doneBtnText: {
    color:      Colors.primary,
    fontWeight: FontWeight.semibold,
    fontSize:   FontSize.base,
  },

  saveSection: {
    marginHorizontal: Spacing.lg,
    marginTop:        Spacing.lg,
    marginBottom:     Spacing.xxl,
  },
});
