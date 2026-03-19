# Spec Research: 06-native-tabs

**Feature:** brand-revamp
**Spec:** 06-native-tabs
**Complexity:** M

---

## Problem Context

The current tab bar is a JavaScript-rendered custom component styled via Expo Router's `<Tabs>` API. It uses custom colors, haptic feedback (`HapticTab`), and an `IconSymbol` component. Brand guidelines v2.0 mandate NativeTabs to compile down to true platform-native tab bars (UITabBarController on iOS, BottomNavigationView on Android), enabling the premium native feel and, on iOS 26+, automatic integration with UIGlassEffect for a refractive tab bar chrome.

---

## Exploration Findings

### Current tab layout (`app/(tabs)/_layout.tsx`)

```typescript
// Uses: import { Tabs } from 'expo-router';
// Tab structure: Home, Overview, AI, Requests (Approvals), + hidden Explore tab

// Custom styling:
tabBarStyle: {
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
  borderTopWidth: 1,
  elevation: 0,
}
tabBarActiveTintColor: colors.violet    // #A78BFA
tabBarInactiveTintColor: colors.textMuted  // #757575

// Custom HapticTab component for haptic feedback on press
// IconSymbol for SF Symbols icons (iOS) / fallback for Android
// Approvals tab badge: count of pending items
```

### NativeTabs API (Expo SDK 55 / Expo Router v7)

```typescript
import { unstable_NativeTabs as NativeTabs } from 'expo-router/unstable-native-tabs';

// Usage:
<NativeTabs>
  <NativeTabs.Screen name="index" options={{ title: "Home", ... }} />
  <NativeTabs.Screen name="overview" options={{ title: "Overview", ... }} />
  ...
</NativeTabs>

// On iOS: compiles to UITabBarController (native iOS tabs)
// On iOS 26+: automatic UIGlassEffect integration on tab bar
// On Android: compiles to BottomNavigationView (Material Design native)
```

### Known differences from `<Tabs>`
1. `tabBarStyle` prop is not supported in NativeTabs — styling goes through native theme APIs
2. `tabBarBackground` component override is not supported
3. `HapticTab` custom component may not be needed (native tabs handle haptics natively on iOS)
4. `tabBarBadge` prop works on NativeTabs (same API)
5. `href: null` for hidden tabs → `options={{ href: null }}` syntax may differ
6. The `AmbientBackground` is mounted behind the tab content, not inside the tab bar — this layout should still work

### Current role-gating for approvals tab
Approvals tab is always shown (visible to all users) — role gating was removed in spec 07-overview-sync/approvals redesign. No conditional tab hiding required now, simplifying the migration.

### `HapticTab` component
```typescript
// Currently wraps tab press to call Haptics.impactAsync()
// NativeTabs provides native haptics on iOS automatically
// Android: vibrate on tab press (handled natively by BottomNavigationView)
// Decision: HapticTab component is no longer needed for NativeTabs
```

### Feature flag approach
The spec requires `"ENABLE_NATIVE_TABS": true` as a flag. This is stored in `app.json` under `extra`:
```json
{
  "expo": {
    "extra": {
      "ENABLE_NATIVE_TABS": true
    }
  }
}
```
The tab layout reads this via `Constants.expoConfig.extra.ENABLE_NATIVE_TABS` and conditionally renders NativeTabs or legacy Tabs. This allows rollback without a code deploy.

---

## Key Decisions

1. **Conditional render via feature flag** — `_layout.tsx` imports both `Tabs` (legacy) and `NativeTabs`, renders based on `Constants.expoConfig.extra.ENABLE_NATIVE_TABS`. Default in app.json: `true`.

2. **Shared screen configs** — Extract tab screen configuration into a `TAB_SCREENS` constant array so both Tabs and NativeTabs renderers share identical screen options. No duplication.

3. **HapticTab removal** — NativeTabs handles haptics natively. Remove `HapticTab` component usage. The `HapticTab.tsx` file can be kept but is no longer imported.

4. **Icon handling** — NativeTabs uses `tabBarIcon` option same as regular Tabs. `IconSymbol` component continues to work.

5. **AmbientBackground position** — Currently absolutely positioned in `_layout.tsx` behind the tab content. This is a View-based overlay, not part of the tab bar itself. It works identically with NativeTabs.

6. **Tab bar color on iOS 26+** — When UIGlassEffect is active, the tab bar becomes glassy automatically. No configuration needed — iOS handles it.

---

## Interface Contracts

### Updated `app/(tabs)/_layout.tsx`

```typescript
import { unstable_NativeTabs as NativeTabs } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import Constants from 'expo-constants';

const USE_NATIVE_TABS = Constants.expoConfig?.extra?.ENABLE_NATIVE_TABS ?? false;
const TabNavigator = USE_NATIVE_TABS ? NativeTabs : Tabs;

// Shared screen config array:
const TAB_SCREENS = [
  { name: 'index',    title: 'Home',     icon: 'house.fill' },
  { name: 'overview', title: 'Overview', icon: 'chart.bar.fill' },
  { name: 'ai',       title: 'AI',       icon: 'sparkles' },
  { name: 'approvals',title: 'Requests', icon: 'checkmark.circle.fill', getBadge: getApprovalCount },
  { name: 'explore',  title: '',         href: null },   // hidden
] as const;

return (
  <>
    <AmbientBackground ... />
    <TabNavigator
      screenOptions={USE_NATIVE_TABS ? nativeTabOptions : legacyTabOptions}
    >
      {TAB_SCREENS.map(screen => (
        <TabNavigator.Screen key={screen.name} name={screen.name} options={...} />
      ))}
    </TabNavigator>
  </>
);
```

### `app.json` addition
```json
{
  "expo": {
    "extra": {
      "ENABLE_NATIVE_TABS": true,
      "ENABLE_SHARED_ELEMENT_TRANSITIONS": true
    }
  }
}
```

### NativeTabs screen options (typed)
```typescript
interface NativeTabScreenOptions {
  title: string;
  tabBarIcon: ({ color, size }: { color: string; size: number }) => React.ReactNode;
  tabBarBadge?: number | string;
  href?: null;   // hide from tab bar
}
```

---

## Test Plan

### `nativeTabsFeatureFlag`
- [ ] When `ENABLE_NATIVE_TABS=true`, renders `NativeTabs` component
- [ ] When `ENABLE_NATIVE_TABS=false`, renders legacy `Tabs` component
- [ ] When flag is missing from Constants, defaults to false (safe fallback)

### `tabScreenConfiguration`
- [ ] All 4 visible tabs (home, overview, ai, approvals) are rendered
- [ ] Explore tab has `href: null` (hidden from tab bar)
- [ ] Each tab has correct `title` and `tabBarIcon` option
- [ ] Approvals tab shows badge count when pending items > 0
- [ ] Approvals tab shows no badge when pending items = 0

### `tabNavigatorLayout`
- [ ] AmbientBackground is rendered behind tab content (not inside navigator)
- [ ] NoiseOverlay is rendered correctly at root level
- [ ] Tab content scrolls independently of the background layers

### `nativeTabStyling`
- [ ] Active tab tint color is `colors.violet` (#A78BFA)
- [ ] Inactive tab tint color is `colors.textMuted`
- [ ] Tab bar background matches surface color on non-iOS-26 devices

**Mocks needed:**
- `expo-router/unstable-native-tabs`: NativeTabs (mock as Tabs equivalent)
- `expo-constants`: Constants.expoConfig.extra
- `expo-router`: Tabs (existing mock)

---

## Files to Reference

- `hourglassws/app/(tabs)/_layout.tsx` — current tab layout to migrate
- `hourglassws/src/components/HapticTab.tsx` — to be deprecated/removed
- `hourglassws/src/components/IconSymbol.tsx` — icon component (keep as-is)
- `hourglassws/app.json` — to add feature flags
- `hourglassws/package.json` — expo-router version (already ~4.0.0 for SDK 55)
