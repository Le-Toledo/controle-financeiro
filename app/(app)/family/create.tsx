import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  doc,
  setDoc,
  collection,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { db, auth } from '@/lib/firebase';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input }         from '@/components/ui/Input';
import { Button }        from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/theme';
import { CreateFamilySchema, type CreateFamilyInput } from '@shared/schemas/family.schema';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '@shared/types/category';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/I/1 confusos
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function FamilyCreateScreen() {
  const [inviteCode]    = useState(generateInviteCode);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<CreateFamilyInput>({
    resolver: zodResolver(CreateFamilySchema),
    defaultValues: { name: '' },
  });

  async function onSubmit({ name }: CreateFamilyInput) {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Sessão expirada', 'Faça login novamente.');
      return;
    }

    setIsLoading(true);
    try {
      // Passo 1: batch atômico — família + membro devem commitar juntos
      const batch = writeBatch(db);

      const familyRef = doc(collection(db, 'families'));
      batch.set(familyRef, {
        name:      name.trim(),
        currency:  'BRL',
        timezone:  'America/Sao_Paulo',
        ownerId:   user.uid,
        members:   [user.uid],
        plan:      'free',
        inviteCode,
        createdAt: serverTimestamp(),
      });

      const memberRef = doc(db, 'families', familyRef.id, 'members', user.uid);
      batch.set(memberRef, {
        id:          user.uid,
        role:        'owner',
        displayName: user.displayName ?? user.email ?? 'Usuário',
        avatarColor: Colors.primary,
        joinedAt:    serverTimestamp(),
      });

      await batch.commit();

      // Passo 2: categorias seed criadas após a família existir (isMember já passa)
      // Erro aqui não bloqueia o uso do app — AuthGate já redireciona via onSnapshot
      const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
      await Promise.all(
        allCategories.map((cat) => {
          const catRef = doc(collection(db, 'families', familyRef.id, 'categories'));
          return setDoc(catRef, { ...cat, id: catRef.id, createdAt: serverTimestamp() });
        }),
      );
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? 'desconhecido';
      console.error('[FamilyCreate] erro:', code, err);
      Alert.alert(
        'Erro ao criar família',
        `Código: ${code}\n\nTente novamente ou contate o suporte.`,
      );
      setIsLoading(false);
    }
  }

  return (
    <ScreenWrapper scrollable padded>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🏡</Text>
        <Text style={styles.title}>Crie o espaço do casal</Text>
        <Text style={styles.subtitle}>
          Todos os dados financeiros ficam neste espaço compartilhado.
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nome da família"
              placeholder="ex: Família Silva, Nós Dois 💑"
              autoCapitalize="words"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        {/* Preview do invite code */}
        <View style={styles.inviteCard}>
          <Text style={styles.inviteLabel}>Código de convite</Text>
          <Text style={styles.inviteCode}>{inviteCode}</Text>
          <Text style={styles.inviteHint}>
            Compartilhe este código com seu parceiro(a) para entrar na mesma família.
          </Text>
        </View>

        <Button
          label="Criar família"
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
        />
      </View>

      {/* Link alternativo */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Já tem um código? </Text>
        <Link href="/(app)/family/join" asChild>
          <TouchableOpacity accessibilityRole="link">
            <Text style={styles.footerLink}>Entrar em uma família</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems:    'center',
    paddingTop:    Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap:           Spacing.sm,
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize:   FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color:      Colors.textPrimary,
    textAlign:  'center',
  },
  subtitle: {
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  form: { gap: Spacing.md },

  inviteCard: {
    backgroundColor: Colors.card,
    borderWidth:     1,
    borderColor:     Colors.primaryFaint,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    alignItems:      'center',
    gap:             Spacing.xs,
  },
  inviteLabel: {
    fontSize:  FontSize.xs,
    color:     Colors.textMuted,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inviteCode: {
    fontSize:   FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color:      Colors.primary,
    letterSpacing: 6,
  },
  inviteHint: {
    fontSize:  FontSize.xs,
    color:     Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 18,
  },

  footer: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    paddingVertical: Spacing.xl,
  },
  footerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  footerLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
});
