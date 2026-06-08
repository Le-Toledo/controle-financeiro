import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input }         from '@/components/ui/Input';
import { Button }        from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing } from '@/theme';

const LoginSchema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginScreen() {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit({ email, password }: LoginForm) {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar';
      const friendly =
        msg.includes('invalid-credential') || msg.includes('wrong-password')
          ? 'E-mail ou senha incorretos.'
          : msg.includes('user-not-found')
          ? 'Usuário não encontrado.'
          : 'Erro ao entrar. Tente novamente.';
      Alert.alert('Ops!', friendly);
    }
  }

  return (
    <ScreenWrapper scrollable padded>
      {/* Logo */}
      <View style={styles.logoArea}>
        <Text style={styles.logoIcon}>💚</Text>
        <Text style={styles.logoText}>FinCasal</Text>
        <Text style={styles.logoSub}>Finanças do casal, organizadas</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.title}>Bem-vindo de volta</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="E-mail"
              placeholder="vocês@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Senha"
              placeholder="••••••••"
              isPassword
              autoComplete="current-password"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <Button
          label="Entrar"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitBtn}
        />
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Links */}
      <View style={styles.links}>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity accessibilityRole="link">
            <Text style={styles.linkText}>Não tem conta? <Text style={styles.linkBold}>Criar conta</Text></Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  logoArea: {
    alignItems: 'center',
    paddingTop:  Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  logoIcon: { fontSize: 56 },
  logoText: {
    fontSize:   FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color:      Colors.primary,
    letterSpacing: -1,
  },
  logoSub: {
    fontSize: FontSize.sm,
    color:    Colors.textMuted,
    marginTop: 2,
  },

  form: { gap: Spacing.md },

  title: {
    fontSize:   FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color:      Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  submitBtn: { marginTop: Spacing.sm },

  divider: {
    flexDirection: 'row',
    alignItems:    'center',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSize.sm,
    color:    Colors.textMuted,
  },

  links: {
    alignItems: 'center',
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  linkText: {
    fontSize: FontSize.sm,
    color:    Colors.textSecondary,
  },
  linkBold: {
    color:      Colors.primary,
    fontWeight: FontWeight.semibold,
  },
});
