import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ScrollView, Platform,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { auth } from '@/lib/firebase';
import { transactionsCol } from '@/lib/firestore.refs';
import { useAuthStore }    from '@/stores/auth.store';
import { useCategories }   from '@/hooks/useCategories';
import { AmountKeypad }    from '@/components/ui/AmountKeypad';
import { CategoryPicker }  from '@/components/ui/CategoryPicker';
import { Button }          from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { digitsToCents }   from '@/utils/currency';
import type { TransactionType } from '@shared/types/transaction';
import type { Category } from '@shared/types/category';

export default function LaunchScreen() {
  const router   = useRouter();
  const familyId = useAuthStore((s) => s.family?.id);
  const { categories, loading: catLoading } = useCategories();

  const [digits,         setDigits]         = useState('');
  const [type,           setType]           = useState<TransactionType>('expense');
  const [category,       setCategory]       = useState<Category | null>(null);
  const [note,           setNote]           = useState('');
  const [saving,         setSaving]         = useState(false);
  const [date,           setDate]           = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      await addDoc(transactionsCol(familyId), {
        amountCents: cents,
        type,
        categoryId:  category.id,
        authorId:    auth.currentUser!.uid,
        date:        Timestamp.fromDate(date),
        ...(trimmedNote ? { note: trimmedNote } : {}),
        source:    'manual' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as Parameters<typeof addDoc>[1]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? 'desconhecido';
      console.error('[Launch] erro ao salvar:', code, err);
      Alert.alert('Erro ao salvar', `Código: ${code}\n\nTente novamente.`);
    } finally {
      setSaving(false);
    }
  }

  const expenseActive = type === 'expense';
  const incomeActive  = type === 'income';

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Fechar">
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Novo lançamento</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Toggle Despesa / Receita */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            onPress={() => handleTypeChange('expense')}
            style={[
              styles.typeBtn,
              expenseActive && { backgroundColor: Colors.negative + '22', borderColor: Colors.negative },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: expenseActive }}
          >
            <Text style={[styles.typeBtnText, expenseActive && { color: Colors.negative }]}>
              ↓ Despesa
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTypeChange('income')}
            style={[
              styles.typeBtn,
              incomeActive && { backgroundColor: Colors.positive + '22', borderColor: Colors.positive },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: incomeActive }}
          >
            <Text style={[styles.typeBtnText, incomeActive && { color: Colors.positive }]}>
              ↑ Receita
            </Text>
          </TouchableOpacity>
        </View>

        {/* Keypad */}
        <AmountKeypad digits={digits} onChange={setDigits} />

        {/* Categorias */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Categoria</Text>
          {catLoading ? (
            <Text style={styles.loadingText}>Carregando...</Text>
          ) : (
            <CategoryPicker
              categories={categories}
              selectedId={category?.id ?? null}
              type={type}
              onSelect={setCategory}
            />
          )}
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowDatePicker((prev) => !prev)}
            accessibilityLabel={`Data do lançamento: ${format(date, 'dd/MM/yyyy', { locale: ptBR })}`}
          >
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateValue}>
              {format(date, "dd/MM/yyyy", { locale: ptBR })}
            </Text>
            <Text style={styles.dateChevron}>{showDatePicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
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

        {/* Nota */}
        <View style={styles.noteWrap}>
          <TextInput
            style={styles.noteInput}
            placeholder="Nota opcional..."
            placeholderTextColor={Colors.textPlaceholder}
            value={note}
            onChangeText={setNote}
            maxLength={280}
            multiline
            returnKeyType="done"
            accessibilityLabel="Nota"
          />
        </View>

        {/* Salvar */}
        <View style={styles.saveSection}>
          <Button label="Salvar lançamento" loading={saving} onPress={handleSave} size="lg" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius:  Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 40, height: 4, borderRadius: Radius.full,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: { fontSize: FontSize.lg, color: Colors.textMuted, width: 32, textAlign: 'center' },
  title:    { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },

  typeToggle: { flexDirection: 'row', margin: Spacing.lg, gap: Spacing.sm },
  typeBtn: {
    flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  typeBtnText: {
    fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textSecondary,
  },

  section:      { marginTop: Spacing.lg },
  sectionLabel: {
    fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  loadingText: { paddingHorizontal: Spacing.lg, color: Colors.textMuted, fontSize: FontSize.sm },

  dateRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  dateIcon:    { fontSize: FontSize.base },
  dateValue:   { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  dateChevron: { fontSize: FontSize.xs, color: Colors.textMuted },

  pickerWrap: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  doneBtn: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  doneBtnText: { color: Colors.primary, fontWeight: FontWeight.semibold, fontSize: FontSize.base },

  noteWrap: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, minHeight: 52, justifyContent: 'center',
  },
  noteInput: {
    fontSize: FontSize.base, color: Colors.textPrimary,
    paddingVertical: Spacing.sm, minHeight: 52,
  },
  saveSection: { margin: Spacing.lg, marginBottom: Spacing.xxl },
});
