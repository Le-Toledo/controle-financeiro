import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input }         from '@/components/ui/Input';
import { Button }        from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing } from '@/theme';

const RegisterSchema = z
  .object({
    name:            z.string().min(2, 'Mínimo 2 caracteres').max(60),
    email:           z.string().email('E-mail inválido'),
    password:        z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path:    ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
  });

  async function onSubmit({ name, email, password }: RegisterForm) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, { displayName: name.trim() });
      // O AuthGate em _layout.tsx vai redirecionar p/ criar família automaticamente
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      const friendly = msg.includes('email-already-in-use')
        ? 'Este e-mail já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.';
      Alert.alert('Ops!', friendly);
    }
  }

  return (
    <ScreenWrapper scrollable padded>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtn}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      {/* Logo compacto */}
      <View style={styles.logoArea}>
        <Text style={styles.logoIcon}>💚</Text>
        <Text style={styles.logoText}>FinCasal</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>Depois você vai criar ou entrar em uma família</Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nome completo"
              placeholder="Maria Silva"
              autoComplete="name"
              autoCapitalize="words"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

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
              autoComplete="new-password"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirmar senha"
              placeholder="••••••••"
              isPassword
              autoComplete="new-password"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          label="Criar conta"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitBtn}
        />
      </View>

      {/* Link de login */}
      <View style={styles.links}>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity accessibilityRole="link">
            <Text style={styles.linkText}>
              Já tem conta? <Text style={styles.linkBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Spacing.lg },
  backBtn: {
    fontSize:  FontSize.base,
    color:     Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  logoArea: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  logoIcon: { fontSize: 32 },
  logoText: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color:      Colors.primary,
    letterSpacing: -0.5,
  },

  form: { gap: Spacing.md },

  title: {
    fontSize:   FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color:      Colors.textPrimary,
  },
  subtitle: {
    fontSize:    FontSize.sm,
    color:       Colors.textMuted,
    marginBottom: Spacing.sm,
  },

  submitBtn: { marginTop: Spacing.sm },

  links: {
    alignItems:    'center',
    paddingVertical: Spacing.xl,
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
