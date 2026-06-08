import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  setDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';

import { db, auth } from '@/lib/firebase';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input }         from '@/components/ui/Input';
import { Button }        from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing } from '@/theme';
import { JoinFamilySchema, type JoinFamilyInput } from '@shared/schemas/family.schema';

export default function FamilyJoinScreen() {
  const router    = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<JoinFamilyInput>({
    resolver: zodResolver(JoinFamilySchema),
    defaultValues: { inviteCode: '' },
  });

  async function onSubmit({ inviteCode }: JoinFamilyInput) {
    const user = auth.currentUser;
    if (!user) return;

    setIsLoading(true);
    try {
      // Busca família pelo invite code
      const q = query(
        collection(db, 'families'),
        where('inviteCode', '==', inviteCode.toUpperCase()),
        limit(1),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        Alert.alert('Código inválido', 'Nenhuma família encontrada com este código. Verifique e tente novamente.');
        return;
      }

      const familyDoc  = snap.docs[0];
      const familyData = familyDoc.data();

      // Impede entrar em família que já é membro
      if ((familyData.members as string[]).includes(user.uid)) {
        Alert.alert('Ops!', 'Você já faz parte desta família.');
        return;
      }

      // Adiciona o usuário à família
      await updateDoc(familyDoc.ref, {
        members: arrayUnion(user.uid),
      });

      // Cria o documento do membro na subcollection
      await setDoc(doc(db, 'families', familyDoc.id, 'members', user.uid), {
        id:          user.uid,
        role:        'member',
        displayName: user.displayName ?? user.email ?? 'Usuário',
        avatarColor: Colors.categoryColors[Math.floor(Math.random() * Colors.categoryColors.length)],
        joinedAt:    serverTimestamp(),
      });

      // AuthGate vai redirecionar automaticamente para /(app)
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível entrar na família. Tente novamente.');
    } finally {
      setIsLoading(false);
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

      <View style={styles.content}>
        <Text style={styles.emoji}>🤝</Text>
        <Text style={styles.title}>Entrar em uma família</Text>
        <Text style={styles.subtitle}>
          Peça o código de convite para quem criou o espaço familiar.
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="inviteCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Código de convite"
                placeholder="Ex: ABCD1234"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                onChangeText={(t) => onChange(t.toUpperCase())}
                onBlur={onBlur}
                value={value}
                error={errors.inviteCode?.message}
                helper="8 caracteres, letras e números"
              />
            )}
          />

          <Button
            label="Entrar na família"
            loading={isLoading}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header:    { paddingTop: Spacing.lg },
  backBtn:   { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  content: {
    flex:          1,
    alignItems:    'center',
    paddingTop:    Spacing.xl,
    gap:           Spacing.md,
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

  form: { width: '100%', gap: Spacing.md, marginTop: Spacing.md },
});
