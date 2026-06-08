import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';
import { appendDigit, removeDigit, digitsToDisplay } from '@/utils/currency';

interface AmountKeypadProps {
  digits:    string;
  onChange:  (digits: string) => void;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
] as const;

export function AmountKeypad({ digits, onChange }: AmountKeypadProps) {
  function handleKey(key: string) {
    if (key === '⌫') {
      Vibration.vibrate(10);
      onChange(removeDigit(digits));
    } else if (key === '') {
      // vazio — não faz nada
    } else {
      onChange(appendDigit(digits, key));
    }
  }

  return (
    <View style={styles.wrapper}>
      {/* Display do valor */}
      <View style={styles.display}>
        <Text style={styles.currency}>R$</Text>
        <Text style={styles.amount}>{digitsToDisplay(digits)}</Text>
      </View>

      {/* Teclas */}
      <View style={styles.grid}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                onPress={() => handleKey(key)}
                activeOpacity={key ? 0.6 : 1}
                disabled={!key}
                style={[styles.key, !key && styles.keyEmpty, key === '⌫' && styles.keyBack]}
                accessibilityLabel={key === '⌫' ? 'Apagar' : key || undefined}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={[styles.keyText, key === '⌫' && styles.backText]}>
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.lg },

  display: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'center',
    gap:            Spacing.sm,
    paddingVertical: Spacing.md,
  },
  currency: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.semibold,
    color:      Colors.textMuted,
  },
  amount: {
    fontSize:   56,
    fontWeight: FontWeight.extrabold,
    color:      Colors.textPrimary,
    letterSpacing: -2,
    minWidth:   160,
    textAlign:  'right',
  },

  grid:  { gap: Spacing.sm },
  row:   { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },

  key: {
    width:           100,
    height:          64,
    borderRadius:    Radius.lg,
    backgroundColor: Colors.card,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyBack:  { backgroundColor: Colors.cardRaised },

  keyText: {
    fontSize:   FontSize['2xl'],
    fontWeight: FontWeight.medium,
    color:      Colors.textPrimary,
  },
  backText: {
    fontSize: FontSize.xl,
    color:    Colors.textSecondary,
  },
});
