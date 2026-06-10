import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [focused,      setFocused]      = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[
        styles.inputRow,
        focused && styles.inputFocused,
        error  && styles.inputError,
      ]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textPlaceholder}
          selectionColor={Colors.primary}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? 'none' : rest.autoCapitalize}
          autoCorrect={false}
          accessibilityLabel={label}
          onFocus={(e) => { setFocused(true);  rest.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); rest.onBlur?.(e);  }}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.iconBtn}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword ? (
          <View style={styles.iconBtn}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.feedbackRow}>
          <Ionicons name="alert-circle-outline" size={13} color={Colors.negative} />
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        </View>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },

  label: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.semibold,
    color:         Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  inputRow: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.card,
    borderWidth:       1,
    borderColor:       Colors.border,
    borderRadius:      Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight:         52,
  },
  inputFocused: {
    borderColor: Colors.primary + '80',
    backgroundColor: Colors.card,
  },
  inputError: {
    borderColor: Colors.negative,
  },

  input: {
    flex:            1,
    fontSize:        FontSize.base,
    color:           Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },

  iconBtn: {
    paddingLeft: Spacing.sm,
    minWidth:    36,
    alignItems:  'center',
    justifyContent: 'center',
  },

  feedbackRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  errorText: {
    fontSize:   FontSize.xs,
    color:      Colors.negative,
    fontWeight: FontWeight.medium,
    flex:       1,
  },
  helperText: {
    fontSize: FontSize.xs,
    color:    Colors.textMuted,
  },
});
