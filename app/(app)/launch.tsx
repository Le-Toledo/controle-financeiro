import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  addDoc, updateDoc, doc, getDoc,
  deleteField, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/lib/firebase';
import { transactionsCol } from '@/lib/firestore.refs';
import { useAuthStore }   from '@/stores/auth.store';
import { useCategories }  from '@/hooks/useCategories';
import { AmountKeypad }   from '@/components/ui/AmountKeypad';
import { CategoryPicker } from '@/components/ui/CategoryPicker';
import { SkeletonBox }    from '@/components/ui/SkeletonBox';
import { Button }         from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { digitsToCents }  from '@/utils/currency';
import type { TransactionType } from '@shared/types/transaction';
import type { Category } from '@shared/types/category';

// ── Skeleton de edição ────────────────────────────────────────────────────────
function EditLoadingSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <SkeletonBox width={32} height={32} borderRadius={Radius.sm} />
        <SkeletonBox width={150} height={18} />
        <View style={{ width: 32 }} />
      </View>
      <View style={sk.body}>
        <View style={sk.row}>
          <SkeletonBox style={{ flex: 1 }} height={50} borderRadius={Radius.md} />
          <SkeletonBox style={{ flex: 1 }} height={50} borderRadius={Radius.md} />
        </View>
        <SkeletonBox height={88} borderRadius={Radius.lg} />
        <View style={sk.section}>
          <SkeletonBox width={80} height={10} />
          <View style={sk.chips}>
            {[88, 104, 80, 112].map((w, i) => (
              <SkeletonBox key={i} width={w} height={44} borderRadius={Radius.full} />
            ))}
          </View>
        </View>
        <View style={sk.section}>
          <SkeletonBox width={48} height={10} />
          <SkeletonBox height={48} borderRadius={Radius.md} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const sk = StyleSheet.create({
  body:    { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  row:     { flexDirection: 'row', gap: Spacing.sm },
  section: { gap: Spacing.sm },
  chips:   { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
});

// ── Tela ─────────────────────────────────────────────────────────────────────
export default function LaunchScreen() {
  const router   = useRouter();
  const { id, type: typeParam } = useLocalSearchParams<{ id?: string; type?: string }>();
  const isEditing = Boolean(id);

  const familyId = useAuthStore((s) => s.family?.id);
  const { categories, loading: catLoading } = useCategories();

  const [digits,            setDigits]           = useState('');
  // Aceita type via param URL (ex: { type: 'income' }) para abrir pré-selecionado
  const [type,              setType]             = useState<TransactionType>(
    typeParam === 'income' ? 'income' : 'expense',
  );
  const [category,          setCategory]         = useState<Category | null>(null);
  const [note,              setNote]             = useState('');
  const [saving,            setSaving]           = useState(false);
  const [date,              setDate]             = useState(new Date());
  const [showDatePicker,    setShowDatePicker]   = useState(false);
  const [loadingEdit,       setLoadingEdit]      = useState(isEditing);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [noteFocused,       setNoteFocused]      = useState(false);

  useEffect(() => {
    if (!pendingCategoryId || categories.length === 0) return;
    const cat = categories.find((c) => c.id === pendingCategoryId);
    if (cat) { setCategory(cat); setPendingCategoryId(null); }
  }, [pendingCategoryId, categories]);

  useEffect(() => {
    if (!id || !familyId) return;
    setLoadingEdit(true);
    getDoc(doc(db, 'families', familyId, 'transactions', id))
      .then((snap) => {
        if (!snap.exists()) { router.back(); return; }
        const data = snap.data();
        setDigits(String(data.amountCents));
        setType(data.type);
        setDate(data.date.toDate());
        setNote(data.note ?? '');
        setPendingCategoryId(data.categoryId);
      })
      .catch(() => router.back())
      .finally(() => setLoadingEdit(false));
  }, [id, familyId]);

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategory(null);
  }

  function onDateChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  }

  async function handleSave() {
    if (!familyId) return;
    const cents = digitsToCents(digits);
    if (cents <= 0) { Alert.alert('Valor inválido', 'Digite um valor maior que zero.'); return; }
    if (!category)  { Alert.alert('Categoria', 'Selecione uma categoria.'); return; }

    setSaving(true);
    try {
      const trimmedNote = note.trim();
      // Overlay current time on the chosen date so same-day entries sort by hour
      const submitDate = new Date(date);
      const now = new Date();
      submitDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

      if (isEditing && id) {
        await updateDoc(doc(db, 'families', familyId, 'transactions', id), {
          amountCents: cents,
          type,
          categoryId:  category.id,
          date:        Timestamp.fromDate(submitDate),
          note:        trimmedNote || deleteField(),
          updatedAt:   serverTimestamp(),
        });
      } else {
        await addDoc(transactionsCol(familyId), {
          amountCents: cents,
          type,
          categoryId:  category.id,
          authorId:    auth.currentUser!.uid,
          date:        Timestamp.fromDate(submitDate),
          ...(trimmedNote ? { note: trimmedNote } : {}),
          source:      'manual' as const,
          createdAt:   serverTimestamp(),
          updatedAt:   serverTimestamp(),
        } as Parameters<typeof addDoc>[1]);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDigits('');
      setNote('');
      setCategory(null);
      setDate(new Date());
      setShowDatePicker(false);
      router.back();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? 'desconhecido';
      console.error('[Launch] erro ao salvar:', code, err);
      Alert.alert('Erro ao salvar', `Código: ${code}\n\nTente novamente.`);
    } finally {
      setSaving(false);
    }
  }

  if (loadingEdit) return <EditLoadingSkeleton />;

  const expenseActive = type === 'expense';
  const incomeActive  = type === 'income';
  const accentColor   = expenseActive ? Colors.negative : Colors.positive;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.handle} />

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
          {isEditing ? 'Editar lançamento' : 'Novo lançamento'}
        </Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Toggle Despesa / Receita ── */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            onPress={() => handleTypeChange('expense')}
            style={[styles.typeBtn, expenseActive && styles.typeBtnExpense]}
            accessibilityRole="radio"
            accessibilityState={{ checked: expenseActive }}
          >
            <Ionicons
              name="trending-down"
              size={18}
              color={expenseActive ? Colors.negative : Colors.textMuted}
            />
            <Text style={[styles.typeBtnText, expenseActive && { color: Colors.negative }]}>
              Despesa
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTypeChange('income')}
            style={[styles.typeBtn, incomeActive && styles.typeBtnIncome]}
            accessibilityRole="radio"
            accessibilityState={{ checked: incomeActive }}
          >
            <Ionicons
              name="trending-up"
              size={18}
              color={incomeActive ? Colors.positive : Colors.textMuted}
            />
            <Text style={[styles.typeBtnText, incomeActive && { color: Colors.positive }]}>
              Receita
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Keypad ── */}
        <AmountKeypad digits={digits} onChange={setDigits} accentColor={accentColor} />

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
              type={type}
              onSelect={setCategory}
            />
          )}
        </View>

        {/* ── Data ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowDatePicker((prev) => !prev)}
            accessibilityLabel={`Data do lançamento: ${format(date, "dd 'de' MMMM", { locale: ptBR })}`}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.dateValue}>
              {format(date, "dd 'de' MMMM", { locale: ptBR })}
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
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
locale="pt-BR"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setShowDatePicker(false)}
                  accessibilityLabel="Confirmar data"
                >
                  <Text style={[styles.doneBtnText, { color: accentColor }]}>Feito</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Nota ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nota</Text>
          <View style={[styles.noteWrap, noteFocused && styles.noteWrapFocused]}>
            <Ionicons
              name="create-outline"
              size={16}
              color={noteFocused || note ? Colors.textSecondary : Colors.textPlaceholder}
              style={styles.noteIcon}
            />
            <TextInput
              style={styles.noteInput}
              placeholder="Observação opcional..."
              placeholderTextColor={Colors.textPlaceholder}
              value={note}
              onChangeText={setNote}
              onFocus={() => setNoteFocused(true)}
              onBlur={() => setNoteFocused(false)}
              maxLength={280}
              multiline
              returnKeyType="done"
              accessibilityLabel="Nota"
            />
          </View>
        </View>

        {/* ── Salvar ── */}
        <View style={styles.saveSection}>
          <Button
            label={isEditing ? 'Salvar alterações' : 'Salvar lançamento'}
            loading={saving}
            onPress={handleSave}
            size="lg"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex:                 1,
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop:           Spacing.sm,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    Radius.full,
    backgroundColor: Colors.border,
    alignSelf:       'center',
    marginBottom:    Spacing.sm,
  },

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

  // Toggle
  typeToggle: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  typeBtn: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.xs,
    paddingVertical: Spacing.sm + 4,
    borderRadius:   Radius.md,
    borderWidth:    1,
    borderColor:    Colors.border,
    backgroundColor: Colors.card,
    minHeight:      48,
  },
  typeBtnExpense: {
    backgroundColor: Colors.negative + '14',
    borderColor:     Colors.negative + '60',
  },
  typeBtnIncome: {
    backgroundColor: Colors.positive + '14',
    borderColor:     Colors.positive + '60',
  },
  typeBtnText: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
    color:      Colors.textMuted,
  },

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
    fontWeight: FontWeight.semibold,
    fontSize:   FontSize.base,
  },

  // Nota
  noteWrap: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    marginHorizontal:  Spacing.lg,
    backgroundColor:   Colors.card,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    minHeight:         56,
  },
  noteWrapFocused: {
    borderColor: Colors.primary + '80',
  },
  noteIcon: {
    marginTop: Spacing.xs + 1,
    marginRight: Spacing.xs,
  },
  noteInput: {
    flex:            1,
    fontSize:        FontSize.base,
    color:           Colors.textPrimary,
    paddingVertical: Spacing.xs,
    minHeight:       40,
  },

  saveSection: {
    marginHorizontal: Spacing.lg,
    marginTop:        Spacing.lg,
    marginBottom:     Spacing.xxl,
  },
});
