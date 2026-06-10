import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';

// ── Tab icon com indicador ativo ──────────────────────────────────────────────
function TabIcon({
  name,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
}) {
  return (
    <View style={tabIconStyles.wrap}>
      {focused && <View style={tabIconStyles.dot} />}
      <Ionicons
        name={focused ? name : (`${name}-outline` as React.ComponentProps<typeof Ionicons>['name'])}
        size={22}
        color={focused ? Colors.primary : Colors.textMuted}
      />
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 3 },
  dot:  {
    width:           4,
    height:          4,
    borderRadius:    Radius.full,
    backgroundColor: Colors.primary,
    position:        'absolute',
    top:             -8,
  },
});

// ── FAB central ──────────────────────────────────────────────────────────────
function LaunchButton() {
  const router = useRouter();

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(app)/launch');
  }

  return (
    <View style={fabStyles.ring}>
      <View
        onTouchEnd={handlePress}
        style={fabStyles.btn}
        accessibilityLabel="Novo lançamento"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </View>
    </View>
  );
}

const fabStyles = StyleSheet.create({
  ring: {
    width:           72,
    height:          72,
    borderRadius:    Radius.full,
    backgroundColor: Colors.primaryFaint,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -28,
    borderWidth:     1,
    borderColor:     Colors.primary + '30',
  },
  btn: {
    width:           56,
    height:          56,
    borderRadius:    Radius.full,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     Colors.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.55,
    shadowRadius:    14,
    elevation:       10,
  },
});

// ── Layout ────────────────────────────────────────────────────────────────────
export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarStyle:             styles.tabBar,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle:        styles.tabLabel,
        tabBarItemStyle:         styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="fixed"
        options={{
          title: 'Fixos',
          tabBarIcon: ({ focused }) => <TabIcon name="repeat" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="launch"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: () => (
            <View style={styles.fabWrapper}>
              <LaunchButton />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="month"
        options={{
          title: 'Relatório',
          tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} />,
        }}
      />

      <Tabs.Screen name="fixed-new"      options={{ href: null }} />
      <Tabs.Screen name="family/create"  options={{ href: null }} />
      <Tabs.Screen name="family/join"    options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor:  Colors.border,
    borderTopWidth:  1,
    height:          Platform.OS === 'ios' ? 82 : 64,
    paddingBottom:   Platform.OS === 'ios' ? 22 : 8,
    paddingTop:      Spacing.xs,
  },
  tabItem:  { flex: 1 },
  tabLabel: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.medium,
    marginTop:  2,
  },
  fabWrapper: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
