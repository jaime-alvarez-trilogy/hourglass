# 06-native-tabs

**Status:** Draft
**Created:** 2026-03-19
**Last Updated:** 2026-03-19
**Owner:** @jalvarez0907

---

## Overview

This spec migrates the tab bar in `app/(tabs)/_layout.tsx` from Expo Router's JavaScript-rendered `<Tabs>` to `unstable_NativeTabs` from `expo-router/unstable-native-tabs`. The result compiles to UITabBarController on iOS and BottomNavigationView on Android — true platform-native chrome rather than a JS-painted overlay.

A feature flag (`ENABLE_NATIVE_TABS`) in `app.json` under `expo.extra` lets the team toggle between the NativeTabs and legacy Tabs renderers without a code deploy, enabling instant rollback if a device-specific issue surfaces.

A shared `TAB_SCREENS` constant array holds all screen configurations (name, title, icon, badge getter) in one place; both renderers consume it identically, eliminating duplication.

The `HapticTab` wrapper component is removed from the tab bar: native tab bars on iOS trigger haptic feedback automatically, and BottomNavigationView on Android handles its own tactile feedback. The file is kept on disk (it may be used elsewhere or needed in future), but is no longer imported by `_layout.tsx`.

`AmbientBackground` (and its `NoiseOverlay` sibling) remain positioned in the outer `<View>` wrapper, unaffected by the navigator type. `app.json` also gains `ENABLE_SHARED_ELEMENT_TRANSITIONS: true` in the same `extra` block, pre-wiring the flag that spec 07 will consume.

---

## Out of Scope

1. **UIGlassEffect tab bar chrome (iOS 26+)** — Descoped. When the device runs iOS 26 and `UITabBarController` is active, the system automatically applies the glass effect. No additional code is required and it is not tested in this spec.

2. **Tab bar color customisation on NativeTabs** — Descoped. `tabBarStyle` is not supported by NativeTabs; native theming APIs handle colour. The brand violet (`#A78BFA`) is set via `tabBarActiveTintColor` which NativeTabs does support. No attempt to override native background colour is made.

3. **Deleting `HapticTab.tsx` from disk** — Descoped. The file is deprecated (no longer imported by `_layout.tsx`) but not deleted, as it may be referenced by existing tests or reused in other contexts.

4. **Shared Element Transitions wiring** — Deferred to [07-shared-transitions](../07-shared-transitions/spec-research.md). The `ENABLE_SHARED_ELEMENT_TRANSITIONS` flag added to `app.json` in this spec is purely additive; `07-shared-transitions` owns the implementation.

5. **Approvals badge real-time refresh** — Descoped. The badge count is derived from `useApprovalItems` already wired in `_layout.tsx`. This spec does not change data-fetching behaviour.

6. **Android-specific tab bar animations / ripple** — Descoped. BottomNavigationView's default Material Design ripple and transition behaviour is accepted as-is.

7. **Lock screen / widget tab interactions** — Descoped. Widgets do not interact with the tab navigator.

---

## Functional Requirements

### FR1 — Feature flag in app.json

Add two flags to the `expo.extra` block of `app.json`:

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

`ENABLE_NATIVE_TABS` defaults to `true`. `ENABLE_SHARED_ELEMENT_TRANSITIONS` is set to `true` for spec 07.

**Success Criteria:**
- SC1.1 — `app.json` `expo.extra` contains `"ENABLE_NATIVE_TABS": true`
- SC1.2 — `app.json` `expo.extra` contains `"ENABLE_SHARED_ELEMENT_TRANSITIONS": true`
- SC1.3 — Existing `router` and `eas` entries inside `extra` are unchanged

---

### FR2 — Feature flag read in _layout.tsx

`_layout.tsx` reads the flag via `expo-constants` and selects the navigator:

```typescript
import Constants from 'expo-constants';
const USE_NATIVE_TABS = Constants.expoConfig?.extra?.ENABLE_NATIVE_TABS ?? false;
```

The safe default is `false` — if the flag is absent the layout falls back to the legacy `<Tabs>` renderer.

**Success Criteria:**
- SC2.1 — When `ENABLE_NATIVE_TABS=true`, `_layout.tsx` uses `NativeTabs` as the navigator
- SC2.2 — When `ENABLE_NATIVE_TABS=false`, `_layout.tsx` uses legacy `Tabs` as the navigator
- SC2.3 — When the flag is absent from Constants, the layout defaults to `false` (legacy Tabs)
- SC2.4 — `_layout.tsx` imports `Constants` from `expo-constants`

---

### FR3 — TAB_SCREENS shared constant

Extract all tab screen configurations into a single `TAB_SCREENS` constant array. Both the NativeTabs and legacy Tabs renderers map over this array to render their screens — no duplication.

```typescript
const TAB_SCREENS = [
  { name: 'index',     title: 'Home',     icon: 'house.fill' },
  { name: 'overview',  title: 'Overview', icon: 'chart.bar.fill' },
  { name: 'ai',        title: 'AI',       icon: 'sparkles' },
  { name: 'approvals', title: 'Requests', icon: 'checkmark.circle.fill' },
  { name: 'explore',   title: '',         icon: '',  href: null },
] as const;
```

**Success Criteria:**
- SC3.1 — All four visible tabs (index, overview, ai, approvals) are present in `TAB_SCREENS`
- SC3.2 — The `explore` entry has `href: null` (hidden from the tab bar)
- SC3.3 — Each visible tab entry has `name`, `title`, and `icon` fields
- SC3.4 — Tab icons map to the correct SF Symbol names: `house.fill`, `chart.bar.fill`, `sparkles`, `checkmark.circle.fill`
- SC3.5 — Tab titles are: Home, Overview, AI, Requests

---

### FR4 — NativeTabs navigator render path

When `USE_NATIVE_TABS` is true, render `<NativeTabs>` with `tabBarActiveTintColor` and `tabBarInactiveTintColor` screen options. Map over `TAB_SCREENS` to render `<NativeTabs.Screen>` elements.

```typescript
import { unstable_NativeTabs as NativeTabs } from 'expo-router/unstable-native-tabs';
```

**Success Criteria:**
- SC4.1 — `NativeTabs` is imported from `expo-router/unstable-native-tabs`
- SC4.2 — Active tint color is `colors.violet` (#A78BFA)
- SC4.3 — Inactive tint color is `colors.textMuted` (#757575)
- SC4.4 — `tabBarStyle`/`tabBarBackground` props are NOT passed to NativeTabs (unsupported)
- SC4.5 — The approvals tab badge count is provided via `tabBarBadge` when pending items > 0
- SC4.6 — The approvals tab has no badge (or badge undefined) when pending count = 0
- SC4.7 — The explore tab is hidden via `options={{ href: null }}`

---

### FR5 — Legacy Tabs fallback path

When `USE_NATIVE_TABS` is false, the existing legacy `<Tabs>` render path is preserved with `tabBarStyle`, `HapticTab` removed as the `tabBarButton`, and the same `TAB_SCREENS` map.

**Note:** `HapticTab` is removed from the `tabBarButton` option in BOTH render paths. The native tab bar handles haptics automatically, and the legacy path is also cleaned up to remove the now-deprecated custom wrapper.

**Success Criteria:**
- SC5.1 — Legacy path renders `<Tabs>` when `USE_NATIVE_TABS=false`
- SC5.2 — Source does NOT contain `tabBarButton: HapticTab` in either path
- SC5.3 — Source does NOT import `HapticTab` (import line removed)
- SC5.4 — `tabBarStyle` is present in the legacy Tabs screenOptions (preserved for non-native path)

---

### FR6 — AmbientBackground / NoiseOverlay layout unchanged

`AmbientBackground` (if present) and `NoiseOverlay` remain in the outer `<View>` wrapper, positioned outside the navigator, unaffected by the navigator type switch.

**Success Criteria:**
- SC6.1 — `<NoiseOverlay />` is rendered after the navigator element (same position as before)
- SC6.2 — The outer `<View style={{ flex: 1 }}>` wrapper is preserved
- SC6.3 — All existing hooks (`useHistoryBackfill`, `useHoursData`, `useAIData`, `useApprovalItems`, `useConfig`, `useWidgetSync`) remain wired in `TabLayout`

---

## Technical Design

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/app.json` | Add `ENABLE_NATIVE_TABS: true` and `ENABLE_SHARED_ELEMENT_TRANSITIONS: true` to `expo.extra` |
| `hourglassws/app/(tabs)/_layout.tsx` | Full rewrite: add Constants import, feature flag read, TAB_SCREENS constant, conditional NativeTabs/Tabs render, remove HapticTab |

### Files NOT Changed

| File | Reason |
|------|--------|
| `hourglassws/components/haptic-tab.tsx` | Kept on disk; existing tests reference it. Import removed from `_layout.tsx` only. |
| `hourglassws/src/components/NoiseOverlay.tsx` | Unchanged — outer layout wrapper unchanged |
| `hourglassws/src/components/IconSymbol.tsx` | Unchanged — `tabBarIcon` prop API identical |
| `hourglassws/src/lib/colors.ts` | Unchanged — colors already defined |

### Files to Create

- `hourglassws/app/(tabs)/__tests__/native-tabs.test.tsx` — new test file for FR1–FR6

### Existing Tests — Compatibility

Existing test files for `_layout.tsx` cover earlier specs:
- `app/__tests__/tabs-layout.test.tsx` — FR1/FR2 from 06-wiring-and-tokens
- `app/(tabs)/__tests__/layout.test.tsx` — FR1 from 02-approvals-tab-redesign

The `tabs-layout.test.tsx` check `'FR1.3 — source renders <Tabs component (still present)'` remains valid: both the `<Tabs` import and the legacy render path JSX stay in source even after this migration. The import of `HapticTab` is removed from `_layout.tsx`, so `haptic-tab.tsx` mock in `layout.test.tsx` should be verified — if the import is gone the mock becomes a no-op rather than a failure.

---

### Data Flow

```
app.json (expo.extra)
  └── ENABLE_NATIVE_TABS: true
        │
        ▼
Constants.expoConfig.extra.ENABLE_NATIVE_TABS  (read at module load time)
        │
        ├─ true  → <NativeTabs> + NativeTabs.Screen × TAB_SCREENS
        └─ false → <Tabs>       + Tabs.Screen       × TAB_SCREENS

TAB_SCREENS (const array)
  └── Shared by both paths; contains name/title/icon/href for each tab

useApprovalItems()
  └── items.length → tabBarBadge on approvals screen (both paths)
```

---

### NativeTabs Screen Options Pattern

```typescript
// NativeTabs screen options (no tabBarStyle, no tabBarBackground)
const nativeTabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.violet,
  tabBarInactiveTintColor: colors.textMuted,
};

// Legacy Tabs screen options (preserve existing behaviour)
const legacyTabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.violet,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
};
```

---

### Badge Logic

```typescript
// Approvals badge: show count when > 0, omit when 0
tabBarBadge: items.length > 0 ? items.length : undefined
```

`undefined` removes the badge entirely from the native tab bar (both NativeTabs and Tabs treat `undefined` as no badge).

---

### Edge Cases

1. **`Constants.expoConfig` is null** — Optional chaining (`?.extra?.ENABLE_NATIVE_TABS`) returns `undefined`; the `?? false` fallback kicks in → legacy Tabs. Safe.

2. **Module-level evaluation of `USE_NATIVE_TABS`** — Evaluated once at module load. In tests, `Constants` must be mocked before the module is required. Tests that need to flip the flag must use `jest.resetModules()` between test suites.

3. **`NativeTabs.Screen` vs `Tabs.Screen`** — When `USE_NATIVE_TABS=true`, the navigator is `NativeTabs` and screens must be `NativeTabs.Screen` sub-components (not `Tabs.Screen`). The implementation must ensure correct sub-component pairing to avoid mismatched navigator/screen types at runtime.

4. **`href: null` on explore tab** — NativeTabs supports the same `href: null` option as Tabs for hiding a tab from the bar.

5. **Existing tests** — `app/__tests__/tabs-layout.test.tsx` checks for `<Tabs` in source. After this migration the source conditionally renders either navigator; the legacy path's `<Tabs` JSX remains present in the file for the fallback, so the check still passes.

---

### Dependency Check

- `expo-router` (already installed) — provides `Tabs` and `unstable_NativeTabs`
- `expo-constants` (already installed via Expo SDK) — provides `Constants.expoConfig`
- No new npm dependencies required
