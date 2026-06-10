import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { appendDigit, removeDigit, digitsToDisplay } from '@/utils/currency';

interface AmountKeypadProps {
  digits:   string;
  onChange: (digits: string) => void;
  accentColor?: string;
}

const NUM_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
] as const;

export function AmountKeypad({ digits, onChange, accentColor }: AmountKeypadProps) {
  const accent = accentColor ?? Colors.textPrimary;

  function handleKey(key: string) {
    if (key === '⌫') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(removeDigit(digits));
    } else if (key) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(appendDigit(digits, key));
    }
  }

  return (
    <View style={styles.wrapper}>
      {/* ── Display ── */}
      <View style={styles.displayWrap}>
        <Text style={styles.currency}>R$</Text>
        <Text style={[styles.amount, { color: accent }]}>
          {digitsToDisplay(digits)}
        </Text>
      </View>

      {/* ── Separador ── */}
      <View style={styles.divider} />

      {/* ── Teclado ── */}
      <View style={styles.grid}>
        {NUM_ROWS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                onPress={() => handleKey(key)}
                activeOpacity={key ? 0.55 : 1}
                disabled={!key}
                style={[styles.key, !key && styles.keyEmpty, key === '⌫' && styles.keyBack]}
                accessibilityLabel={key === '⌫' ? 'Apagar' : key || undefined}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                {key === '⌫' ? (
                  <Ionicons name="backspace-outline" size={22} color={Colors.textSecondary} />
                ) : (
                  <Text style={[styles.keyText, !key && styles.keyTextEmpty]}>
                    {key}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 0 },

  // Display
  displayWrap: {
    flexDirection:   'row',
    alignItems:      'baseline',
    justifyContent:  'center',
    gap:             Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  currency: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.semibold,
    color:      Colors.textMuted,
    paddingBottom: 4,
  },
  amount: {
    fontSize:      56,
    fontWeight:    FontWeight.extrabold,
    letterSpacing: -2,
    minWidth:      160,
    textAlign:     'right',
  },

  divider: {
    height:           1,
    backgroundColor:  Colors.border,
    marginHorizontal: Spacing.lg,
    marginBottom:     Spacing.md,
  },

  // Grid
  grid: { gap: Spacing.xs + 2, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  row:  { flexDirection: 'row', gap: Spacing.xs + 2, justifyContent: 'center' },

  key: {
    width:           105,
    height:          60,
    borderRadius:    Radius.lg,
    backgroundColor: Colors.card,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  keyEmpty: {
    backgroundColor: 'transparent',
    borderColor:     'transparent',
  },
  keyBack: {
    backgroundColor: Colors.cardRaised,
    borderColor:     Colors.border,
  },

  keyText: {
    fontSize:   FontSize['2xl'],
    fontWeight: FontWeight.medium,
    color:      Colors.textPrimary,
  },
  keyTextEmpty: {
    color: 'transparent',
  },
});
