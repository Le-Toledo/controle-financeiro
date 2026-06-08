import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/theme';

interface ScreenWrapperProps {
  children:    React.ReactNode;
  scrollable?: boolean;
  style?:      ViewStyle;
  padded?:     boolean;
}

export function ScreenWrapper({
  children,
  scrollable = false,
  style,
  padded = true,
}: ScreenWrapperProps) {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, padded && styles.padded]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <>{children}</>
  );

  return (
    <SafeAreaView style={[styles.safe, style]}>
      <KeyboardAvoidingView
        style={[styles.flex, !scrollable && padded && styles.padded]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  flex:          { flex: 1 },
  padded:        { paddingHorizontal: Spacing.lg },
  scrollContent: { flexGrow: 1 },
});
