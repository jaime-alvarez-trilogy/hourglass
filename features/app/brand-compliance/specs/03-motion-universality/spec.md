# 03-motion-universality

**Status:** Ready for Implementation
**Created:** 2026-03-16
**Last Updated:** 2026-03-16

---

## Overview

Motion universality applies the existing Reanimated animation primitives (`AnimatedPressable`, `FadeInScreen`, `useStaggeredEntry`) consistently to every interactive surface in the app. Currently, these primitives exist and work correctly in isolation but are not wired to all touchable elements. The result is an app that feels "dead" in certain spots — the settings gear, retry buttons, and the Approve All button give no visual scale feedback on press.

### What Has Already Been Done

The research audit revealed that several items originally flagged have already been addressed in prior specs:

- `HapticTab` — already upgraded with Reanimated scale (0.88, timingInstant/springSnappy)
- `ai.tsx` — already wrapped in `FadeInScreen` with `useStaggeredEntry({ count: 6 })`
- `overview.tsx` — already wrapped in `FadeInScreen` with `useStaggeredEntry({ count: 4 })`
- `approvals.tsx` — already wrapped in `FadeInScreen` with `useStaggeredEntry({ count: 2 })`

### Remaining Work

Three files need targeted fixes:

1. **`index.tsx`** — Settings button and error-banner retry button use `TouchableOpacity`. Both need `AnimatedPressable`.
2. **`approvals.tsx`** — Three plain `Pressable` elements need `AnimatedPressable`. One hardcoded tint color needs replacing with `colors.success`.
3. **`ai.tsx`** — Three `TouchableOpacity` elements in error/empty states need `AnimatedPressable`.

All changes are drop-in substitutions. No new components, hooks, or API changes.

---

## Out of Scope

1. **HapticTab animation** — **Descoped:** Already fully implemented. `components/haptic-tab.tsx` uses `useSharedValue`, `withTiming(0.88, timingInstant)`, `withSpring(1, springSnappy)`.

2. **FadeInScreen on AI tab** — **Descoped:** Already implemented. `ai.tsx` is already wrapped in `FadeInScreen`.

3. **FadeInScreen on Overview tab** — **Descoped:** Already implemented. `overview.tsx` is already wrapped in `FadeInScreen`.

4. **useStaggeredEntry on AI tab** — **Descoped:** Already implemented. `ai.tsx` calls `useStaggeredEntry({ count: 6 })`.

5. **useStaggeredEntry on Overview tab** — **Descoped:** Already implemented. `overview.tsx` calls `useStaggeredEntry({ count: 4 })`.

6. **useStaggeredEntry on Approvals tab** — **Descoped:** Already implemented. `approvals.tsx` calls `useStaggeredEntry({ count: 2 })`.

7. **AnimatedPressable on ApprovalCard approve/reject buttons** — **Descoped:** Already implemented, validated by `TouchAndNavigation.test.tsx`.

8. **AnimatedPressable on modal Sign Out button** — **Descoped:** Already validated in `TouchAndNavigation.test.tsx`.

9. **Scroll-physics tuning** — **Deferred to a future performance spec:** Beyond brand compliance scope.

10. **Gesture-driven swipe-to-dismiss on modals** — **Deferred to a future navigation spec:** Requires react-native-gesture-handler integration not yet adopted.

11. **Shared element transitions between tabs** — **Deferred to a future navigation spec:** Requires Expo Router v3 shared elements API.

12. **Animation on RefreshControl spinner itself** — **Descoped:** Native OS pull-to-refresh cannot be animated via Reanimated; `tintColor` is the only customizable attribute.

---

## Functional Requirements

### FR1 — index.tsx: Replace TouchableOpacity with AnimatedPressable

**Description:** The Settings button and error-banner retry button in `app/(tabs)/index.tsx` use `TouchableOpacity`, which provides only opacity fade feedback. Replace both with `AnimatedPressable` for scale feedback consistent with the design system.

**Changes:**
- Settings button (~line 200): Replace `<TouchableOpacity onPress={...} testID="settings-button">` with `<AnimatedPressable onPress={...} testID="settings-button">`
- Error banner retry button (~line 270): Replace `<TouchableOpacity onPress={refetch} ...>` with `<AnimatedPressable onPress={refetch} ...>`
- Add import: `import { AnimatedPressable } from '@/src/components/AnimatedPressable'`
- Remove `TouchableOpacity` from the `react-native` import (it will be unused)

**Success Criteria:**
- SC1.1 — `index.tsx` source does NOT import `TouchableOpacity` from react-native
- SC1.2 — `index.tsx` source DOES import `AnimatedPressable` from `@/src/components/AnimatedPressable`
- SC1.3 — `index.tsx` source contains `AnimatedPressable` wrapping the settings gear (`testID="settings-button"`)
- SC1.4 — `index.tsx` source contains `AnimatedPressable` for the error-banner retry button (`testID="retry-button"`)
- SC1.5 — `HoursDashboard` renders without crash in test environment

---

### FR2 — approvals.tsx: Replace Pressable with AnimatedPressable + fix tint color

**Description:** Three plain `Pressable` elements in `app/(tabs)/approvals.tsx` need upgrading to `AnimatedPressable`. The `RefreshControl` tintColor uses a hardcoded hex `#10B981` instead of the `colors.success` design token.

**Changes:**
- Approve All button (~line 125): `<Pressable ... onPress={handleApproveAll}` → `<AnimatedPressable ... onPress={handleApproveAll}`
- Team error Retry (~line 144): `<Pressable onPress={teamRefetch}>` → `<AnimatedPressable onPress={teamRefetch}>`
- My-requests error Retry (~line 207): `<Pressable onPress={myRefetch}>` → `<AnimatedPressable onPress={myRefetch}>`
- RefreshControl (~line 156): `tintColor="#10B981"` → `tintColor={colors.success}`
- Add import: `import { AnimatedPressable } from '@/src/components/AnimatedPressable'`
- Add `colors` to existing import from `@/src/lib/colors` if not already imported
- Remove `Pressable` from the `react-native` import (it will be unused)

**Success Criteria:**
- SC2.1 — `approvals.tsx` source does NOT contain `import.*Pressable.*from 'react-native'` (plain Pressable import removed)
- SC2.2 — `approvals.tsx` source DOES import `AnimatedPressable`
- SC2.3 — `approvals.tsx` source contains `AnimatedPressable` with `handleApproveAll` as onPress
- SC2.4 — `approvals.tsx` source contains `AnimatedPressable` with `teamRefetch` and `myRefetch` as onPress
- SC2.5 — `approvals.tsx` RefreshControl tintColor does NOT contain the literal string `#10B981`
- SC2.6 — `approvals.tsx` RefreshControl tintColor DOES reference `colors.success`
- SC2.7 — `ApprovalsScreen` renders without crash in test environment

---

### FR3 — ai.tsx: Replace TouchableOpacity with AnimatedPressable in error/empty states

**Description:** Three `TouchableOpacity` elements in `app/(tabs)/ai.tsx` serve as action buttons in error and empty states. Replace all three with `AnimatedPressable`.

**Changes:**
- Auth error Re-login button (~line 123): `<TouchableOpacity ... testID="relogin-button">` → `<AnimatedPressable ... testID="relogin-button">`
- Network error Retry button (~line 140): `<TouchableOpacity ... testID="retry-button">` → `<AnimatedPressable ... testID="retry-button">`
- Empty state Refresh button (~line 157): `<TouchableOpacity ... onPress={refetch}>` → `<AnimatedPressable ... onPress={refetch}>`
- Add import: `import { AnimatedPressable } from '@/src/components/AnimatedPressable'`
- Remove `TouchableOpacity` from the `react-native` import (it will be unused)

**Success Criteria:**
- SC3.1 — `ai.tsx` source does NOT import `TouchableOpacity` from react-native
- SC3.2 — `ai.tsx` source DOES import `AnimatedPressable` from `@/src/components/AnimatedPressable`
- SC3.3 — `ai.tsx` source contains `AnimatedPressable` with `testID="relogin-button"`
- SC3.4 — `ai.tsx` source contains `AnimatedPressable` with `testID="retry-button"`
- SC3.5 — `ai.tsx` source contains `AnimatedPressable` wrapping the empty-state Refresh button
- SC3.6 — `AIScreen` renders without crash in test environment

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/components/AnimatedPressable.tsx` | Drop-in Pressable replacement; `scaleValue` defaults to 0.96; extends `PressableProps` |
| `hourglassws/src/lib/reanimated-presets.ts` | `timingInstant` (150ms ease-out) and `springSnappy` — used internally by AnimatedPressable |
| `hourglassws/src/lib/colors.ts` | `colors.success` — replaces hardcoded `#10B981` |

### Files to Modify

| File | Change | FR |
|------|--------|----|
| `hourglassws/app/(tabs)/index.tsx` | Settings button + error retry: `TouchableOpacity` → `AnimatedPressable` | FR1 |
| `hourglassws/app/(tabs)/approvals.tsx` | Approve All + 2× Retry: `Pressable` → `AnimatedPressable`; RefreshControl tint | FR2 |
| `hourglassws/app/(tabs)/ai.tsx` | 3× error/empty state: `TouchableOpacity` → `AnimatedPressable` | FR3 |

### Files to Create

| File | Purpose |
|------|---------|
| `hourglassws/src/components/__tests__/MotionUniversality.test.tsx` | Source-file static checks + smoke renders for FR1, FR2, FR3 |

### Data Flow

No data flow changes. These are pure UI substitutions — the same `onPress` callbacks, `disabled` flags, `className`, and `style` props pass through `AnimatedPressable` unchanged.

```
User press → AnimatedPressable.onPressIn
           → scale.value = withTiming(0.96, timingInstant)  // 150ms ease-out
           → AnimatedPressable.onPressOut
           → scale.value = withSpring(1, springSnappy)       // fast settle
```

### AnimatedPressable Interface Contract

```typescript
interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  scaleValue?: number;    // default: 0.96
  className?: string;
  style?: StyleProp<ViewStyle>;
}
```

Migration pattern from `TouchableOpacity`:
```tsx
// Before
import { TouchableOpacity } from 'react-native';
<TouchableOpacity onPress={fn} testID="x" className="...">

// After
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
<AnimatedPressable onPress={fn} testID="x" className="...">
```

Migration pattern from `Pressable`:
```tsx
// Before
import { Pressable } from 'react-native';
<Pressable onPress={fn} disabled={isLoading} className="rounded-xl px-4 py-2 bg-success">

// After
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
<AnimatedPressable onPress={fn} disabled={isLoading} className="rounded-xl px-4 py-2 bg-success">
```

### Edge Cases

**Disabled state on Approve All:** `disabled={isApprovingAll}` passes through correctly. `AnimatedPressable` guards animation with `if (!disabled)` — no regression.

**ActivityIndicator inside Approve All:** Renders fine inside `Animated.View` wrapper.

**className on AnimatedPressable:** Applied to the outer `Animated.View`. NativeWind classes for background/border/radius render correctly.

**colors.success type:** `string` — direct assignment to `tintColor` (accepts `string | undefined`).

### Test Strategy

Tests use source-file static analysis (reading `.tsx` source as string) rather than deep rendering:
- Does not require mocking the full navigation/data stack
- Verifies the structural changes brand compliance cares about
- Resilient to render errors from unmocked hooks

Runtime smoke tests use `react-test-renderer` to verify no crash.

New test file `MotionUniversality.test.tsx` covers FR1, FR2, FR3. Existing tests (`TouchAndNavigation.test.tsx`, `HapticTab.test.tsx`) remain unchanged.
