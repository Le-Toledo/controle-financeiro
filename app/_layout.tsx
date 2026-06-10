import '../global.css';

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { Colors } from '@/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5 }, // 5 min
  },
});

function AuthGate() {
  const { user, family, hydrated, loading } = useAuthStore();
  const segments = useSegments();
  const router   = useRouter();

  // Inicializa o listener de auth
  useAuth();

  useEffect(() => {
    // Aguarda auth resolver E snapshot da família carregar antes de rotear.
    // Sem esse guard, family=null (ainda carregando) causaria redirect falso
    // para family/create mesmo quando o usuário já tem uma família.
    if (!hydrated || loading) return;

    const segs = segments as string[];
    const inAuthGroup   = segs[0] === '(auth)';
    const inFamilySetup = segs[1] === 'family';

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    if (!family) {
      if (!inFamilySetup) router.replace('/(app)/family/create');
      return;
    }

    if (inAuthGroup || inFamilySetup) {
      router.replace('/(app)');
    }
  }, [user, family, hydrated, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor={Colors.bg} />
          <AuthGate />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
