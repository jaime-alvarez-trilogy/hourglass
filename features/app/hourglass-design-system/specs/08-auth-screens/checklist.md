# Checklist: 08-auth-screens

## Phase 8.0 — Tests (Red Phase)

Write all tests before implementation. Tests must fail (red) before implementation begins.

### FR1: AuthContainer

- [ ] `test(FR1)` — Write source-file static tests for AuthContainer:
  - SC1.1: renders children without crash
  - SC1.2: source contains `bg-background`
  - SC1.3: source contains `flex-1`
  - SC1.4: source contains `SafeAreaView` import from `react-native-safe-area-context`
  - SC1.5: source does not use `StyleSheet.create`
  - SC1.6: source does not contain hardcoded hex color values

### FR2: welcome.tsx

- [ ] `test(FR2)` — Write source-file static + behavioral tests for welcome.tsx:
  - SC2.1: renders "Hourglass" title text
  - SC2.2: source contains `font-display-bold`
  - SC2.3: source contains `bg-gold`
  - SC2.4: "Get Started" press calls `router.push('/(auth)/credentials')` *(already in auth-screens.test.tsx — verify passes)*
  - SC2.5: no TextInput rendered *(already in auth-screens.test.tsx — verify passes)*
  - SC2.6: source does not use `StyleSheet.create`
  - SC2.7: source does not contain hardcoded hex colors (outside permitted exceptions)
  - SC2.8: source imports `springBouncy` from `@/src/lib/reanimated-presets`
  - SC2.9: source imports from `react-native-reanimated`

### FR3: credentials.tsx

- [ ] `test(FR3)` — Write source-file static tests for credentials.tsx (behavioral tests already exist):
  - SC3.6: source contains `bg-surface` and `border-border`
  - SC3.7: source contains `border-gold`
  - SC3.8: source contains `bg-gold` on CTA
  - SC3.9: source contains `text-critical`
  - SC3.10: source contains `KeyboardAvoidingView` import
  - SC3.13: source does not use `StyleSheet.create`
  - SC3.14: source does not contain hardcoded hex colors (outside permitted exceptions)
  - *(Behavioral SCs 3.1–3.5, 3.11–3.12 already covered by auth-screens.test.tsx — verify pass)*

### FR4: verifying.tsx

- [ ] `test(FR4)` — Write source-file static tests for verifying.tsx (behavioral tests already exist):
  - SC4.6: source contains `text-textSecondary`
  - SC4.7: source does not use `StyleSheet.create`
  - SC4.8: source does not contain hardcoded hex colors (outside permitted exceptions)
  - *(Behavioral SCs 4.1–4.5 already covered by auth-screens.test.tsx — verify pass)*

### FR5: setup.tsx

- [ ] `test(FR5)` — Write source-file static tests for setup.tsx (behavioral tests already exist):
  - SC5.6: source contains `bg-surface` and `border-border`
  - SC5.7: source contains `bg-gold` on CTA
  - SC5.8: source contains `text-critical`
  - SC5.9: source contains `KeyboardAvoidingView` import
  - SC5.10: source does not use `StyleSheet.create`
  - SC5.11: source does not contain hardcoded hex colors (outside permitted exceptions)
  - *(Behavioral SCs 5.1–5.5 already covered by auth-screens.test.tsx — verify pass)*

### FR6: success.tsx

- [ ] `test(FR6)` — Write source-file static tests for success.tsx (behavioral tests already exist):
  - SC6.7: source contains `bg-gold` on CTA
  - SC6.8: source contains `text-gold`
  - SC6.9: source imports `springBouncy` from `@/src/lib/reanimated-presets`
  - SC6.10: source imports from `react-native-reanimated`
  - SC6.11: source does not use `StyleSheet.create`
  - SC6.12: source does not contain hardcoded hex colors (outside permitted exceptions)
  - *(Behavioral SCs 6.1–6.6 already covered by auth-screens.test.tsx — verify pass)*

### Red Phase Validation

- [ ] Run `jest __tests__/auth-screens-design.test.tsx` (or equivalent new test file) — all new tests FAIL
- [ ] Run `jest __tests__/auth-screens.test.tsx` — all existing behavioral tests PASS (logic unchanged at this point)
- [ ] Run `red-phase-test-validator` agent on test files

---

## Phase 8.1 — Implementation

Implement each FR to make tests pass. Existing behavioral tests must remain green throughout.

### FR1: AuthContainer

- [ ] `feat(FR1)` — Implement AuthContainer:
  - Define local component (either per-screen or in `app/(auth)/_container.tsx`)
  - `SafeAreaView` from `react-native-safe-area-context`
  - `className="flex-1 bg-background"` on SafeAreaView
  - Inner `View className="flex-1 px-4"` wrapping children
  - No StyleSheet, no hardcoded hex values
  - Verify SC1.1–SC1.6 pass

### FR2: welcome.tsx

- [ ] `feat(FR2)` — Rebuild welcome.tsx:
  - Remove `StyleSheet.create()` entirely
  - Use AuthContainer as root
  - Title: `font-display-bold text-4xl text-textPrimary`
  - Tagline: `font-body text-base text-textSecondary`
  - CTA: `TouchableOpacity className="bg-gold rounded-xl py-4 px-8 items-center"`
  - CTA text: `font-sans-semibold text-base text-background`
  - Panel entrance: `useSharedValue(40/0) → withSpring(0/1, springBouncy)` with `useAnimatedStyle`
  - Import `springBouncy` from `@/src/lib/reanimated-presets`
  - Verify SC2.1–SC2.9 pass; existing auth-screens.test.tsx SC2.4, SC2.5 still green

### FR3: credentials.tsx

- [ ] `feat(FR3)` — Rebuild credentials.tsx:
  - Remove `StyleSheet.create()` entirely
  - Use AuthContainer (or `KeyboardAvoidingView` wrapping `ScrollView` pattern preserved)
  - Input: `bg-surface border rounded-xl px-4 py-3 text-textPrimary font-sans` + focus state `border-gold` vs `border-border`
  - Add `onFocus`/`onBlur` handlers for `emailFocused` and `passwordFocused` state
  - Error banner: `bg-surface border border-critical rounded-xl p-4` with `text-critical`
  - CTA: `bg-gold rounded-xl py-4 items-center` + disabled `opacity-60`
  - Env toggle: selected option uses `bg-gold` (or `bg-surfaceElevated`), unselected uses `bg-surface`
  - `placeholderTextColor="#484F58"` permitted (textMuted hex)
  - Verify SC3.1–SC3.14 pass; existing behavioral tests still green

### FR4: verifying.tsx

- [ ] `feat(FR4)` — Rebuild verifying.tsx:
  - Remove `StyleSheet.create()` entirely
  - Use AuthContainer (centered layout: `flex-1 items-center justify-center gap-5`)
  - `ActivityIndicator size="large" color="#8B949E"` (textSecondary hex — permitted)
  - Label: `font-sans text-base text-textSecondary`
  - All `useEffect` navigation logic unchanged
  - Verify SC4.1–SC4.8 pass; existing behavioral tests still green

### FR5: setup.tsx

- [ ] `feat(FR5)` — Rebuild setup.tsx:
  - Remove `StyleSheet.create()` entirely
  - `KeyboardAvoidingView + ScrollView` pattern preserved
  - Input: `bg-surface border rounded-xl px-4 py-3 text-textPrimary font-sans` + focus state
  - Add focus state `border-gold` vs `border-border`
  - Error banner: same pattern as credentials
  - CTA: `bg-gold rounded-xl py-4 items-center` + disabled `opacity-60`
  - Done toolbar "Done" button: `text-gold font-sans-semibold`
  - `placeholderTextColor="#484F58"` permitted
  - Verify SC5.1–SC5.11 pass; existing behavioral tests still green

### FR6: success.tsx

- [ ] `feat(FR6)` — Rebuild success.tsx:
  - Remove `StyleSheet.create()` entirely
  - Use AuthContainer as root
  - Checkmark icon: `Animated.Text` or `Animated.View` with scale entrance via `springBouncy`
  - Checkmark: `text-success text-6xl` (or success color)
  - User name: `font-display-bold text-3xl text-textPrimary`
  - Role: `font-body text-base text-textSecondary`
  - Rate: `font-display-semibold text-2xl text-gold`
  - CTA: `bg-gold rounded-xl py-4 items-center` + disabled `opacity-60`
  - Error banner: `text-critical` pattern
  - Import `springBouncy` from `@/src/lib/reanimated-presets`
  - Verify SC6.1–SC6.12 pass; existing behavioral tests still green

### Integration Verification

- [ ] Run full test suite: `jest __tests__/auth-screens.test.tsx __tests__/auth-screens-design.test.tsx`
- [ ] All tests pass (behavioral + design token)
- [ ] No TypeScript errors: `cd hourglassws && npx tsc --noEmit`

---

## Phase 8.2 — Review

Sequential review gates. Complete in order.

### Step 0: Alignment Check

- [ ] Run `spec-implementation-alignment` agent:
  - All 6 FRs implemented
  - All SC pass
  - No StyleSheet.create in any rebuilt screen
  - No hardcoded hex (outside permitted exceptions)
  - Existing behavioral tests green

### Step 1: PR Review

- [ ] Run `pr-review-toolkit:review-pr` skill
- [ ] Address any feedback

### Step 2: Fix Pass (if needed)

- [ ] `fix(08-auth-screens)` — address review feedback (if any)

### Step 3: Test Optimization

- [ ] Run `test-optimiser` agent on `__tests__/auth-screens-design.test.tsx`
- [ ] Apply optimizations if any

---

## Definition of Done

- [ ] All 5 auth screens rebuilt: no `StyleSheet.create()`, no hardcoded hex (outside permitted exceptions)
- [ ] All 6 FRs complete (including AuthContainer)
- [ ] New design token tests pass (source-file static analysis)
- [ ] Existing `__tests__/auth-screens.test.tsx` behavioral tests still pass
- [ ] springBouncy entrance on welcome.tsx panel + success.tsx checkmark
- [ ] focus state `border-gold` working on credentials.tsx inputs
- [ ] TypeScript clean
