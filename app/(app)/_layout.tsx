import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/theme';

function TabIcon({
  name,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
}) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as React.ComponentProps<typeof Ionicons>['name'])}
      size={24}
      color={focused ? Colors.primary : Colors.textMuted}
    />
  );
}

function LaunchButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/launch')}
      style={styles.fab}
      accessibilityLabel="Novo lançamento"
      accessibilityRole="button"
    >
      <Text style={styles.fabIcon}>+</Text>
    </TouchableOpacity>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:           false,
        tabBarStyle:           styles.tabBar,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle:      styles.tabLabel,
        tabBarItemStyle:       styles.tabItem,
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
        name="month"
        options={{
          title: 'Mês',
          tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} />,
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
        name="fixed"
        options={{
          title: 'Fixos',
          tabBarIcon: ({ focused }) => <TabIcon name="repeat" focused={focused} />,
        }}
      />

      {/* Telas ocultas da tab bar */}
      <Tabs.Screen name="family/create" options={{ href: null }} />
      <Tabs.Screen name="family/join"   options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor:  Colors.border,
    borderTopWidth:  1,
    height:          Platform.OS === 'ios' ? 80 : 64,
    paddingBottom:   Platform.OS === 'ios' ? 20 : 8,
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
    marginTop:      -20,
  },
  fab: {
    width:           60,
    height:          60,
    borderRadius:    Radius.full,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     Colors.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    12,
    elevation:       8,
  },
  fabIcon: {
    fontSize:   32,
    fontWeight: FontWeight.bold,
    color:      '#0A0D14',
    lineHeight: 36,
  },
});
