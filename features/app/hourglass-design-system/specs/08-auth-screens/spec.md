# 08-auth-screens

**Status:** Draft
**Created:** 2026-03-14
**Last Updated:** 2026-03-14
**Owner:** @trilogy

---

## Overview

### What Is Being Built

Rebuild all 5 auth screens in `app/(auth)/` — welcome, credentials, verifying, setup, success — to use the Hourglass design system: NativeWind v4 `className` tokens, Reanimated v4 entrance animations, and no hardcoded hex colors.

A shared `AuthContainer` component (local to auth screens, not exported) provides a consistent `SafeAreaView + bg-background` wrapper used by all 5 screens.

### Current State

All 5 screens use `StyleSheet.create()` with hardcoded hex values:
- `#0D1117` background → should be `bg-background`
- `#00FF88` CTA buttons → should be `bg-gold` (brand accent)
- `#8B949E` labels → should be `text-textSecondary`
- `#1C1C1E` / `#161B22` inputs → should be `bg-surface border-border`
- No entrance animations anywhere

### How It Will Work

1. **AuthContainer** — shared local wrapper: `SafeAreaView` + `bg-background flex-1` + `px-4` screen padding. All 5 screens use it as their root container.

2. **welcome.tsx** — rebuilt with `font-display-bold` title, `font-body` tagline, `bg-gold` CTA button, and a springBouncy panel entrance animation on mount.

3. **credentials.tsx** — rebuilt with NativeWind input styling (`bg-surface border-border rounded-xl`), `useState`-based focus state that switches input border to `border-gold`, `KeyboardAvoidingView + ScrollView` preserved, `bg-gold` Sign In button.

4. **verifying.tsx** — rebuilt with `ActivityIndicator` using `color` from tokens, `text-textSecondary` label. No logic change — step-based navigation via `useOnboarding` is unchanged.

5. **setup.tsx** — Rate entry fallback screen (shown when hourly rate auto-detect fails). Rebuilt with NativeWind input tokens, `bg-gold` Continue button, `KeyboardAvoidingView + ScrollView`. No logic change.

6. **success.tsx** — rebuilt with springBouncy scale entrance on the checkmark icon, `text-gold` for rate display, `bg-gold` Go to Dashboard button, user name + role display. No logic change.

### Scope Note

The spec-research.md describes setup.tsx as a "team selection" screen, but the actual implementation is a rate entry fallback screen (`submitRate` API). This spec aligns with the actual code. No team picker logic exists or will be added here.

### Key Constraints

- Logic in all 5 screens is **unchanged** — only styling and animations change
- `OnboardingContext` and `useSetup` are **not modified**
- `AuthContainer` is **local only** — not exported to `src/components/`
- Existing test suite in `__tests__/auth-screens.test.tsx` must continue passing after rebuild
- NativeWind v4 className tests use **source-file static analysis** (fs.readFileSync), not rendered prop assertions

---

## Out of Scope

1. **Team selection UI** — Descoped: The spec-research.md mentioned a "team picker" for setup.tsx, but the actual screen is a rate entry fallback. No team selection UI exists in the codebase and it is not part of this spec.

2. **OnboardingContext changes** — Descoped: The context, `useSetup` hook, and all business logic are unchanged. This spec is styling-only.

3. **Auth screen navigation logic** — Descoped: All `useEffect` navigation patterns (step → route transitions) are preserved verbatim.

4. **Exporting AuthContainer globally** — Descoped: `AuthContainer` is a local component for use within `app/(auth)/` only. It will not be added to `src/components/`.

5. **New auth flows** — Descoped: No OAuth, biometrics, SSO, or additional onboarding steps. Only the 5 existing screens are rebuilt.

6. **Font loading** — Deferred to app-level setup: Fonts (SpaceGrotesk, Inter, PlusJakartaSans) must be loaded via `expo-font` in `app/_layout.tsx`. That is already in place from spec `03-base-components`. This spec assumes fonts are available.

7. **Dark/light mode theming** — Descoped: Design system is dark-only. All screens use the dark token set.

8. **Accessibility (a11y) audit** — Descoped: `accessibilityLabel` and `accessibilityRole` improvements are not part of this spec.

9. **Animated entrance for individual form fields** — Descoped: Staggered field animations are deferred. Only panel-level entrance animations (springBouncy on card/panel) are in scope.

---

## Functional Requirements

---

### FR1: AuthContainer — Shared SafeAreaView Wrapper

A local component (not exported) providing consistent screen-level layout for all auth screens.

**Interface:**
```typescript
function AuthContainer({ children }: { children: React.ReactNode }): JSX.Element
```

**Success Criteria:**

- SC1.1 — Renders children without crash
- SC1.2 — Source contains `bg-background` class string
- SC1.3 — Source contains `flex-1` class string
- SC1.4 — Source contains `SafeAreaView` import from `react-native-safe-area-context`
- SC1.5 — Source does not use `StyleSheet.create`
- SC1.6 — Source does not contain hardcoded hex color values

---

### FR2: welcome.tsx Rebuild

Rebuilt welcome screen with dark glass aesthetic, `font-display-bold` title, `bg-gold` CTA button, and springBouncy panel entrance animation.

**Logic preserved:** `router.push('/(auth)/credentials')` on CTA press.

**Success Criteria:**

- SC2.1 — Renders "Hourglass" title text
- SC2.2 — Source contains `font-display-bold` class string
- SC2.3 — Source contains `bg-gold` class string on/near the CTA button
- SC2.4 — "Get Started" button press calls `router.push('/(auth)/credentials')`
- SC2.5 — No `TextInput` rendered (welcome screen is display-only)
- SC2.6 — Source does not use `StyleSheet.create`
- SC2.7 — Source does not contain hardcoded hex color values (outside comments and placeholderTextColor)
- SC2.8 — Source imports `springBouncy` from `@/src/lib/reanimated-presets` and uses it for panel entrance animation
- SC2.9 — Source imports from `react-native-reanimated` (`Animated`, `useSharedValue`, or `useAnimatedStyle`)

---

### FR3: credentials.tsx Rebuild

Rebuilt credentials form with NativeWind input tokens, `useState`-based focus state switching input border to `border-gold`, `KeyboardAvoidingView + ScrollView` preserved, `bg-gold` Sign In button, and `text-critical` error display.

**Logic preserved:** All `useOnboarding()` calls — `submitCredentials`, `setEnvironment`, `isLoading`, `error`, `step` navigation in `useEffect`.

**Success Criteria:**

- SC3.1 — Email input has `keyboardType="email-address"` and `autoCapitalize="none"`; password input has `secureTextEntry`
- SC3.2 — Empty fields: Sign In press shows validation errors; `submitCredentials` not called
- SC3.3 — Both fields filled: Sign In calls `submitCredentials(email, password)`
- SC3.4 — `isLoading=true`: Sign In button is disabled and shows `ActivityIndicator`
- SC3.5 — `error` non-null: error string rendered
- SC3.6 — Source contains `bg-surface` and `border-border` class strings on the input
- SC3.7 — Source contains `border-gold` class string (focus state)
- SC3.8 — Source contains `bg-gold` class string on the CTA button
- SC3.9 — Source contains `text-critical` class string (error display)
- SC3.10 — Source contains `KeyboardAvoidingView` import and usage
- SC3.11 — Source renders Production and QA environment toggle options
- SC3.12 — `setEnvironment(false)` called when Production selected; `setEnvironment(true)` when QA selected
- SC3.13 — Source does not use `StyleSheet.create`
- SC3.14 — Source does not contain hardcoded hex color values (outside comments and permitted placeholderTextColor/ActivityIndicator color)

---

### FR4: verifying.tsx Rebuild

Rebuilt verifying screen with design token text color and `ActivityIndicator`. Logic entirely unchanged.

**Logic preserved:** All `useOnboarding()` step-based navigation in `useEffect`.

**Success Criteria:**

- SC4.1 — Renders `ActivityIndicator` and "Verifying your account…" text
- SC4.2 — No interactive controls (`TouchableOpacity`, `TextInput`) rendered
- SC4.3 — When `step === 'success'`: navigates to `/(auth)/success` via `replace`
- SC4.4 — When `step === 'setup'`: navigates to `/(auth)/setup` via `replace`
- SC4.5 — When `step === 'credentials'`: navigates to `/(auth)/credentials` via `replace`
- SC4.6 — Source contains `text-textSecondary` class string
- SC4.7 — Source does not use `StyleSheet.create`
- SC4.8 — Source does not contain hardcoded hex color values (outside comments and permitted ActivityIndicator color)

---

### FR5: setup.tsx Rebuild

Rebuilt rate entry fallback screen with NativeWind input tokens, `bg-gold` Continue button, `KeyboardAvoidingView + ScrollView`. Logic unchanged.

**Logic preserved:** All `useOnboarding()` calls — `submitRate`, `isLoading`, `error`, `step` navigation in `useEffect`.

**Success Criteria:**

- SC5.1 — Renders numeric input with `keyboardType="decimal-pad"`
- SC5.2 — Empty input: Continue press shows validation error; `submitRate` not called
- SC5.3 — Valid positive number: Continue calls `submitRate(rate)` as a number
- SC5.4 — `isLoading=true`: Continue button disabled and shows `ActivityIndicator`; "Continue" text not visible
- SC5.5 — `error` non-null: error string rendered
- SC5.6 — Source contains `bg-surface` and `border-border` class strings on the input
- SC5.7 — Source contains `bg-gold` class string on the CTA button
- SC5.8 — Source contains `text-critical` class string (error display)
- SC5.9 — Source contains `KeyboardAvoidingView` import and usage
- SC5.10 — Source does not use `StyleSheet.create`
- SC5.11 — Source does not contain hardcoded hex color values (outside comments and permitted placeholderTextColor/ActivityIndicator color)

---

### FR6: success.tsx Rebuild

Rebuilt success confirmation screen with springBouncy scale entrance on checkmark icon, `text-gold` for rate display, `bg-gold` Go to Dashboard button, user name and role display. Logic unchanged.

**Logic preserved:** All `useOnboarding()` calls — `pendingConfig`, `pendingCredentials`; `saveCredentials` + `saveConfig` writes; `router.replace('/(tabs)')` navigation.

**Success Criteria:**

- SC6.1 — Displays `fullName` as primary heading text
- SC6.2 — Shows "Contributor" when `isManager=false`; "Manager" when `isManager=true`
- SC6.3 — Displays hourly rate formatted with `$` and `hr` present
- SC6.4 — "Go to Dashboard" press calls `saveCredentials` and `saveConfig({ setupComplete: true })`
- SC6.5 — Dashboard button is not disabled initially
- SC6.6 — Shows error message when storage write fails
- SC6.7 — Source contains `bg-gold` class string on the CTA button
- SC6.8 — Source contains `text-gold` class string (rate display)
- SC6.9 — Source imports `springBouncy` from `@/src/lib/reanimated-presets` and uses it for checkmark entrance animation
- SC6.10 — Source imports from `react-native-reanimated` (`Animated`, `useSharedValue`, or `useAnimatedStyle`)
- SC6.11 — Source does not use `StyleSheet.create`
- SC6.12 — Source does not contain hardcoded hex color values (outside comments and permitted ActivityIndicator color)

---

## Technical Design

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/app/(auth)/welcome.tsx` | Full rebuild — remove StyleSheet, add NativeWind + Reanimated |
| `hourglassws/app/(auth)/credentials.tsx` | Full rebuild — remove StyleSheet, add NativeWind + focus state |
| `hourglassws/app/(auth)/verifying.tsx` | Full rebuild — remove StyleSheet, add NativeWind tokens |
| `hourglassws/app/(auth)/setup.tsx` | Full rebuild — remove StyleSheet, add NativeWind tokens |
| `hourglassws/app/(auth)/success.tsx` | Full rebuild — remove StyleSheet, add NativeWind + Reanimated |

### Files to Reference (Unchanged)

| File | Purpose |
|------|---------|
| `hourglassws/tailwind.config.js` | Token reference: `background`, `surface`, `border`, `gold`, `textPrimary`, `textSecondary`, `textMuted`, `critical` |
| `hourglassws/src/lib/reanimated-presets.ts` | `springBouncy` for panel/card entrances |
| `hourglassws/src/contexts/OnboardingContext.tsx` | `useOnboarding()` hook — unchanged |
| `hourglassws/src/hooks/useAuth.ts` | `UseSetupResult` type — unchanged |
| `hourglassws/__tests__/auth-screens.test.tsx` | Existing behavioral tests — must continue passing |

### AuthContainer Design

`AuthContainer` can be defined as a local helper at the top of each screen file (duplicate-but-simple approach) or in a shared local file `app/(auth)/_container.tsx` (not exported from the package). Either approach is acceptable. The implementation sub-agent should choose the cleaner option.

```typescript
// Minimal shape:
import { SafeAreaView } from 'react-native-safe-area-context';

function AuthContainer({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4">
        {children}
      </View>
    </SafeAreaView>
  );
}
```

### NativeWind Token Mapping

| Old (StyleSheet) | New (NativeWind className) |
|-----------------|---------------------------|
| `backgroundColor: '#0D1117'` | `bg-background` |
| `backgroundColor: '#161B22'` / `#1C1C1E` | `bg-surface` |
| `backgroundColor: '#00FF88'` (CTA) | `bg-gold` |
| `color: '#FFFFFF'` | `text-textPrimary` |
| `color: '#8B949E'` | `text-textSecondary` |
| `color: '#484F58'` | `text-textMuted` (placeholder via `placeholderTextColor`) |
| `color: '#00FF88'` (rate/check) | `text-gold` |
| `color: '#F85149'` / `'#F43F5E'` | `text-critical` |
| `borderColor: '#30363D'` | `border-border` |
| `borderColor: '#F85149'` | `border-critical` |
| `borderRadius: 8` (inputs) | `rounded-xl` |
| `borderRadius: 12` (buttons) | `rounded-xl` |

### Typography Mapping

| Usage | NativeWind className |
|-------|---------------------|
| App title "Hourglass" | `font-display-bold text-4xl text-textPrimary` |
| Screen title ("Sign In", "Set Your Rate") | `font-display-semibold text-3xl text-textPrimary` |
| Subtitle/tagline | `font-body text-base text-textSecondary` |
| Form labels | `font-sans-medium text-sm text-textSecondary` |
| Input text | `font-sans text-base text-textPrimary` |
| CTA button text | `font-sans-semibold text-base text-background` |
| Error text | `font-sans text-sm text-critical` |
| Rate display (`$75 / hr`) | `font-display-semibold text-2xl text-gold` |

### Reanimated v4 Entrance Pattern

welcome.tsx and success.tsx use the programmatic API (useSharedValue + withSpring):

```typescript
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springBouncy } from '@/src/lib/reanimated-presets';
import { useEffect } from 'react';

// Panel entrance — slide up from 40px + fade in
const translateY = useSharedValue(40);
const opacity = useSharedValue(0);

useEffect(() => {
  translateY.value = withSpring(0, springBouncy);
  opacity.value = withSpring(1, springBouncy);
}, []);

const animStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: translateY.value }],
  opacity: opacity.value,
}));
```

For success.tsx checkmark — scale entrance:
```typescript
const scale = useSharedValue(0);

useEffect(() => {
  scale.value = withSpring(1, springBouncy);
}, []);

const iconStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));
```

### Input Focus State Pattern

```typescript
const [emailFocused, setEmailFocused] = useState(false);

<TextInput
  className={`bg-surface border rounded-xl px-4 py-3 text-textPrimary font-sans ${
    emailFocused ? 'border-gold' : 'border-border'
  }`}
  onFocus={() => setEmailFocused(true)}
  onBlur={() => setEmailFocused(false)}
/>
```

### Permitted Hex Values

Two hex values are permitted in rebuilt screens (cannot use className for these React Native props):

1. `placeholderTextColor="#484F58"` — textMuted hex, on TextInput only
2. `color="#8B949E"` — on `ActivityIndicator` color prop only (textSecondary hex)

All other styling must use NativeWind className tokens.

### Existing Test Compatibility

The existing `__tests__/auth-screens.test.tsx` tests use `UNSAFE_getAllByType` to find elements by type, checking behavioral correctness (navigation, validation, hook calls). They do NOT check className. Rebuilt screens must preserve:
- All `TouchableOpacity` elements with the same label text
- All `TextInput` elements with the same `keyboardType`, `secureTextEntry`, `autoCapitalize` props
- All text content (exact strings like "Verifying your account…", "Production", "QA")

New tests (added in Phase 8.0) use source-file static analysis for className tokens, following `Card.test.tsx` pattern.

### Edge Cases

1. **KeyboardAvoidingView on Android**: `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` must be preserved in credentials.tsx and setup.tsx.

2. **isLoading disabled state**: `disabled={isLoading}` + conditional `opacity-60` class.

3. **Reanimated in test environment**: `useSharedValue` / `withSpring` / `useAnimatedStyle` resolve to no-ops in Jest via the reanimated jest preset — expected and correct.

4. **SafeAreaView source**: Use `react-native-safe-area-context` (not React Native's built-in), consistent with Expo Router conventions.

### Data Flow

```
OnboardingContext (useSetup)
  ├── step → navigation (useEffect in each screen)
  ├── submitCredentials(email, pw) → credentials.tsx
  ├── submitRate(rate) → setup.tsx
  ├── setEnvironment(useQA) → credentials.tsx
  ├── isLoading → disabled state on CTAs
  ├── error → error banner in credentials.tsx + setup.tsx
  ├── pendingConfig → success.tsx (fullName, isManager, hourlyRate)
  └── pendingCredentials → success.tsx (passed to saveCredentials)
```
