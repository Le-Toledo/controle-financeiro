import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';

interface InputProps extends TextInputProps {
  label?:      string;
  error?:      string;
  helper?:     string;
  rightIcon?:  React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  helper,
  rightIcon,
  isPassword = false,
  ...rest
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textPlaceholder}
          selectionColor={Colors.primary}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? 'none' : rest.autoCapitalize}
          autoCorrect={false}
          accessibilityLabel={label}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.iconBtn}
          >
            <Text style={styles.iconText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword ? (
          <View style={styles.iconBtn}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },

  label: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
    color:      Colors.textSecondary,
    letterSpacing: 0.3,
  },

  inputRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.card,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight:       52,
  },
  inputError: {
    borderColor: Colors.negative,
  },

  input: {
    flex:      1,
    fontSize:  FontSize.base,
    color:     Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },

  iconBtn: {
    paddingLeft: Spacing.sm,
    minWidth:    36,
    alignItems:  'center',
  },
  iconText: { fontSize: 16 },

  errorText: {
    fontSize:  FontSize.xs,
    color:     Colors.negative,
    fontWeight: FontWeight.medium,
  },
  helperText: {
    fontSize: FontSize.xs,
    color:    Colors.textMuted,
  },
});
