import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';
import { Colors, Radius, FontSize, FontWeight, Spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  style?: ViewStyle;
  variant?: Variant;
  size?:    Size;
  loading?: boolean;
  label:    string;
  fullWidth?: boolean;
}

export function Button({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  label,
  disabled,
  fullWidth = true,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? Colors.primary : '#fff'} size="small" />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   Radius.md,
    minHeight:      44, // acessibilidade — toque mínimo
  },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.5 },

  // Variantes
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.negative,
  },

  // Tamanhos
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  size_md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 4 },
  size_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },

  // Labels
  label: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
  label_primary:   { color: '#0A0D14' },
  label_secondary: { color: Colors.textPrimary },
  label_ghost:     { color: Colors.primary },
  label_danger:    { color: '#fff' },

  labelSize_sm:   { fontSize: FontSize.sm },
  labelSize_md:   { fontSize: FontSize.base },
  labelSize_lg:   { fontSize: FontSize.lg },
});
