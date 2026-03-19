// FR1 (02-approvals-tab-redesign): Always-visible Requests tab — no role gate.
// Removed: showApprovals conditional, useConfig import, tabBarButton role check.
// Tab title changed from "Approvals" to "Requests".
//
// FR1 (06-wiring-and-tokens): NoiseOverlay wired — wraps Tabs in View, overlay after.
// FR2 (06-wiring-and-tokens): Tab bar uses color tokens (colors.surface / colors.border).
//
// FR6 (01-widget-activation): useWidgetSync wired — updates home screen widget on each
// app open when fresh hours + config data is available.
//
// FR2–FR6 (06-native-tabs): NativeTabs migration with feature flag.
//   - ENABLE_NATIVE_TABS in app.json extra toggles NativeTabs vs legacy Tabs.
//   - TAB_SCREENS shared constant eliminates duplication between render paths.
//   - HapticTab removed — native tab bars handle haptics automatically.

import { unstable_NativeTabs as NativeTabs } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import Constants from 'expo-constants';
import React from 'react';
import { View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import NoiseOverlay from '@/src/components/NoiseOverlay';
import { colors } from '@/src/lib/colors';
import { useHistoryBackfill } from '@/src/hooks/useHistoryBackfill';
import { useHoursData } from '@/src/hooks/useHoursData';
import { useAIData } from '@/src/hooks/useAIData';
import { useApprovalItems } from '@/src/hooks/useApprovalItems';
import { useConfig } from '@/src/hooks/useConfig';
import { useWidgetSync } from '@/src/hooks/useWidgetSync';

// ─── Feature flag ─────────────────────────────────────────────────────────────
// Read at module load time. Toggle in app.json expo.extra to switch renderers
// without a code deploy. Defaults to false (safe fallback to legacy Tabs).

const USE_NATIVE_TABS = Constants.expoConfig?.extra?.ENABLE_NATIVE_TABS ?? false;

// ─── Shared tab screen configuration ─────────────────────────────────────────
// Single source of truth consumed by both NativeTabs and legacy Tabs paths.

const TAB_SCREENS = [
  { name: 'index',     title: 'Home',     icon: 'house.fill' },
  { name: 'overview',  title: 'Overview', icon: 'chart.bar.fill' },
  { name: 'ai',        title: 'AI',       icon: 'sparkles' },
  { name: 'approvals', title: 'Requests', icon: 'checkmark.circle.fill' },
  { name: 'explore',   title: '',         icon: '',  href: null },
] as const;

export default function TabLayout() {
  useHistoryBackfill(); // fire-and-forget — runs once per session, writes AsyncStorage

  // Widget sync: keep home screen widget up-to-date on every app open
  const { data: hoursData } = useHoursData();
  const { data: aiData } = useAIData();
  const { items } = useApprovalItems();
  const { config } = useConfig();
  useWidgetSync(hoursData, aiData, items.length, config, items);

  // Approvals badge: show count when pending > 0, omit otherwise
  const approvalBadge = items.length > 0 ? items.length : undefined;

  if (USE_NATIVE_TABS) {
    // ── NativeTabs path ─────────────────────────────────────────────────────
    // Compiles to UITabBarController (iOS) / BottomNavigationView (Android).
    // tabBarStyle and tabBarBackground are NOT supported — native theming handles it.
    // iOS 26+: system automatically applies UIGlassEffect to UITabBarController.
    return (
      <View style={{ flex: 1 }}>
        <NativeTabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.violet,
            tabBarInactiveTintColor: colors.textMuted,
          }}
        >
          {TAB_SCREENS.map((screen) => {
            if (screen.href === null) {
              // Hidden tab (explore) — not shown in tab bar
              return (
                <NativeTabs.Screen
                  key={screen.name}
                  name={screen.name}
                  options={{ href: null }}
                />
              );
            }
            return (
              <NativeTabs.Screen
                key={screen.name}
                name={screen.name}
                options={{
                  title: screen.title,
                  tabBarIcon: ({ color }: { color: string }) => (
                    <IconSymbol size={28} name={screen.icon as any} color={color} />
                  ),
                  ...(screen.name === 'approvals' && { tabBarBadge: approvalBadge }),
                }}
              />
            );
          })}
        </NativeTabs>
        <NoiseOverlay />
      </View>
    );
  }

  // ── Legacy Tabs path ─────────────────────────────────────────────────────
  // JavaScript-rendered tab bar. Used when ENABLE_NATIVE_TABS=false.
  // HapticTab removed — no longer used in either path.
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.violet,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
        }}
      >
        {TAB_SCREENS.map((screen) => {
          if (screen.href === null) {
            return (
              <Tabs.Screen
                key={screen.name}
                name={screen.name}
                options={{ href: null }}
              />
            );
          }
          return (
            <Tabs.Screen
              key={screen.name}
              name={screen.name}
              options={{
                title: screen.title,
                tabBarIcon: ({ color }: { color: string }) => (
                  <IconSymbol size={28} name={screen.icon as any} color={color} />
                ),
                ...(screen.name === 'approvals' && { tabBarBadge: approvalBadge }),
              }}
            />
          );
        })}
      </Tabs>
      <NoiseOverlay />
    </View>
  );
}
