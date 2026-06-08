import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Platform,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth } from '@/lib/firebase';
import { fixedExpensesCol }  from '@/lib/firestore.refs';
import { useAuthStore }      from '@/stores/auth.store';
import { useCategories }     from '@/hooks/useCategories';
import { AmountKeypad }      from '@/components/ui/AmountKeypad';
import { CategoryPicker }    from '@/components/ui/CategoryPicker';
import { Button }            from '@/components/ui/Button';
import { Input }             from '@/components/ui/Input';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { digitsToCents }     from '@/utils/currency';
import { CreateFixedExpenseSchema, type CreateFixedExpenseInput } from '@shared/schemas/fixed-expense.schema';
import type { Category } from '@shared/types/category';

interface Props {
  onClose: () => void;
}

export default function NewFixedExpenseSheet({ onClose }: Props) {
  const familyId = useAuthStore((s) => s.family?.id);
  const { categories } = useCategories();

  const [digits,         setDigits]         = useState('');
  const [category,       setCategory]       = useState<Category | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [startDate,      setStartDate]      = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<CreateFixedExpenseInput>({
    resolver: zodResolver(CreateFixedExpenseSchema),
    defaultValues: { label: '', dueDay: 5, responsibleUserId: auth.currentUser?.uid ?? '' },
  });

  function onDateChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  }

  async function onSubmit(data: CreateFixedExpenseInput) {
    if (!familyId) return;
    const cents = digitsToCents(digits);
    if (cents <= 0) {
      Alert.alert('Valor inválido', 'Digite um valor maior que zero.');
      return;
    }
    if (!category) {
      Alert.alert('Categoria', 'Selecione uma categoria.');
      return;
    }

    setSaving(true);
    try {
      await addDoc(fixedExpensesCol(familyId), {
        label:             data.label.trim(),
        amountCents:       cents,
        dueDay:            Number(data.dueDay),
        categoryId:        category.id,
        responsibleUserId: auth.currentUser!.uid,
        active:            true,
        startDate:         Timestamp.fromDate(startDate),
        createdAt:         serverTimestamp(),
        updatedAt:         serverTimestamp(),
      } as Parameters<typeof addDoc>[1]);
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? 'desconhecido';
      console.error('[FixedNew] erro ao salvar:', code, err);
      Alert.alert('Erro ao salvar', `Código: ${code}\n\nTente novamente.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Novo gasto fixo</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Nome */}
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

        {/* Valor */}
        <AmountKeypad digits={digits} onChange={setDigits} />

        {/* Dia de vencimento */}
        <View style={styles.fieldPad}>
          <Controller
            control={control}
            name="dueDay"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Dia de vencimento (1–28)"
                placeholder="5"
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={(t) => onChange(parseInt(t) || 1)}
                onBlur={onBlur}
                value={value ? String(value) : ''}
                error={errors.dueDay?.message}
                helper="Use até dia 28 para funcionar em fevereiro"
              />
            )}
          />
        </View>

        {/* Data de início */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Início da cobrança</Text>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowDatePicker((prev) => !prev)}
            accessibilityLabel={`Data de início: ${format(startDate, 'dd/MM/yyyy', { locale: ptBR })}`}
          >
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateValue}>
              {format(startDate, 'dd/MM/yyyy', { locale: ptBR })}
            </Text>
            <Text style={styles.dateChevron}>{showDatePicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={startDate}
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
                  <Text style={styles.doneBtnText}>Feito</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Categoria (só expense) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Categoria</Text>
          <CategoryPicker
            categories={categories}
            selectedId={category?.id ?? null}
            type="expense"
            onSelect={setCategory}
          />
        </View>

        <View style={styles.fieldPad}>
          <Button
            label="Salvar gasto fixo"
            loading={saving}
            onPress={handleSubmit(onSubmit)}
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: { fontSize: FontSize.lg, color: Colors.textMuted, width: 32, textAlign: 'center' },
  title:    { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },

  fieldPad: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  section:      { marginTop: Spacing.lg },
  sectionLabel: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
    color:      Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },

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
});
