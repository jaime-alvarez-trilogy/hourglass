# Checklist: 08-auth-screens

## Phase 8.0 — Tests (Red Phase)

Write all tests before implementation. Tests must fail (red) before implementation begins.

### FR1: AuthContainer

- [x] `test(FR1)` — Write source-file static tests for AuthContainer:
  - SC1.1: renders children without crash
  - SC1.2: source contains `bg-background`
  - SC1.3: source contains `flex-1`
  - SC1.4: source contains `SafeAreaView` import from `react-native-safe-area-context`
  - SC1.5: source does not use `StyleSheet.create`
  - SC1.6: source does not contain hardcoded hex color values

### FR2: welcome.tsx

- [x] `test(FR2)` — Write source-file static + behavioral tests for welcome.tsx:
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

- [x] `test(FR3)` — Write source-file static tests for credentials.tsx (behavioral tests already exist):
  - SC3.6: source contains `bg-surface` and `border-border`
  - SC3.7: source contains `border-gold`
  - SC3.8: source contains `bg-gold` on CTA
  - SC3.9: source contains `text-critical`
  - SC3.10: source contains `KeyboardAvoidingView` import
  - SC3.13: source does not use `StyleSheet.create`
  - SC3.14: source does not contain hardcoded hex colors (outside permitted exceptions)
  - *(Behavioral SCs 3.1–3.5, 3.11–3.12 already covered by auth-screens.test.tsx — verify pass)*

### FR4: verifying.tsx

- [x] `test(FR4)` — Write source-file static tests for verifying.tsx (behavioral tests already exist):
  - SC4.6: source contains `text-textSecondary`
  - SC4.7: source does not use `StyleSheet.create`
  - SC4.8: source does not contain hardcoded hex colors (outside permitted exceptions)
  - *(Behavioral SCs 4.1–4.5 already covered by auth-screens.test.tsx — verify pass)*

### FR5: setup.tsx

- [x] `test(FR5)` — Write source-file static tests for setup.tsx (behavioral tests already exist):
  - SC5.6: source contains `bg-surface` and `border-border`
  - SC5.7: source contains `bg-gold` on CTA
  - SC5.8: source contains `text-critical`
  - SC5.9: source contains `KeyboardAvoidingView` import
  - SC5.10: source does not use `StyleSheet.create`
  - SC5.11: source does not contain hardcoded hex colors (outside permitted exceptions)
  - *(Behavioral SCs 5.1–5.5 already covered by auth-screens.test.tsx — verify pass)*

### FR6: success.tsx

- [x] `test(FR6)` — Write source-file static tests for success.tsx (behavioral tests already exist):
  - SC6.7: source contains `bg-gold` on CTA
  - SC6.8: source contains `text-gold`
  - SC6.9: source imports `springBouncy` from `@/src/lib/reanimated-presets`
  - SC6.10: source imports from `react-native-reanimated`
  - SC6.11: source does not use `StyleSheet.create`
  - SC6.12: source does not contain hardcoded hex colors (outside permitted exceptions)
  - *(Behavioral SCs 6.1–6.6 already covered by auth-screens.test.tsx — verify pass)*

### Red Phase Validation

- [x] Run `jest __tests__/auth-screens-design.test.tsx` — all new tests FAIL (33 failing, red confirmed)
- [x] Run `jest __tests__/auth-screens.test.tsx` — all existing behavioral tests PASS (28 passing)
- [x] Red phase validated

---

## Phase 8.1 — Implementation

Implement each FR to make tests pass. Existing behavioral tests must remain green throughout.

### FR1: AuthContainer

- [x] `feat(FR1)` — Implement AuthContainer:
  - Defined in `app/(auth)/_container.tsx`
  - `SafeAreaView` from `react-native-safe-area-context`
  - `className="flex-1 bg-background"` on SafeAreaView
  - Inner `View className="flex-1 px-4"` wrapping children
  - No StyleSheet, no hardcoded hex values
  - SC1.1–SC1.6 pass

### FR2: welcome.tsx

- [x] `feat(FR2)` — Rebuild welcome.tsx:
  - `StyleSheet.create()` removed entirely
  - Title: `font-display-bold text-4xl text-textPrimary`
  - Tagline: `font-body text-base text-textSecondary`
  - CTA: `bg-gold rounded-xl py-4 px-8 items-center`
  - Panel entrance: `useSharedValue(40/0) → withSpring(0/1, springBouncy)` with `useAnimatedStyle`
  - SC2.1–SC2.9 pass; existing behavioral tests green

### FR3: credentials.tsx

- [x] `feat(FR3)` — Rebuild credentials.tsx:
  - `StyleSheet.create()` removed entirely
  - Inputs: `bg-surface border rounded-xl px-4 py-3` + focus state `border-gold` vs `border-border`
  - Error banner: `bg-surface border border-critical rounded-xl` with `text-critical`
  - CTA: `bg-gold rounded-xl py-4` + disabled `opacity-60`
  - Env toggle: selected uses `bg-gold`, unselected uses `bg-surface`
  - SC3.1–SC3.14 pass; existing behavioral tests green

### FR4: verifying.tsx

- [x] `feat(FR4)` — Rebuild verifying.tsx:
  - `StyleSheet.create()` removed entirely
  - Label: `font-sans text-base text-textSecondary`
  - `ActivityIndicator color="#8B949E"` (permitted)
  - SC4.1–SC4.8 pass; existing behavioral tests green

### FR5: setup.tsx

- [x] `feat(FR5)` — Rebuild setup.tsx:
  - `StyleSheet.create()` removed entirely
  - Input: `bg-surface border rounded-xl` + focus state `border-gold` vs `border-border`
  - "Done" toolbar button: `text-gold`
  - CTA: `bg-gold rounded-xl py-4` + disabled `opacity-60`
  - SC5.1–SC5.11 pass; existing behavioral tests green

### FR6: success.tsx

- [x] `feat(FR6)` — Rebuild success.tsx:
  - `StyleSheet.create()` removed entirely
  - Checkmark: `Animated.View` with scale entrance via `springBouncy`
  - Rate: `font-display-semibold text-2xl text-gold`
  - CTA: `bg-gold rounded-xl py-4` + disabled `opacity-60`
  - SC6.1–SC6.12 pass; existing behavioral tests green

### Integration Verification

- [x] Run full test suite: `jest __tests__/auth-screens.test.tsx __tests__/auth-screens-design.test.tsx`
- [x] 64/64 tests pass (36 design token + 28 behavioral)
- [x] TypeScript clean for all auth files (`npx tsc --noEmit` — no auth errors)

---

## Phase 8.2 — Review

Sequential review gates. Complete in order.

### Step 0: Alignment Check

- [x] All 6 FRs implemented
- [x] All SCs pass
- [x] No StyleSheet.create in any rebuilt screen
- [x] No non-permitted hardcoded hex
- [x] Existing behavioral tests green

### Step 1: PR Review

- [x] Self-review completed — diff clean, logic unchanged, token mapping correct

### Step 2: Fix Pass

- [x] No fixes required

### Step 3: Test Optimization

- [x] Tests reviewed — source-file static analysis pattern is clean and minimal

---

## Definition of Done

- [x] All 5 auth screens rebuilt: no `StyleSheet.create()`, no hardcoded hex (outside permitted exceptions)
- [x] All 6 FRs complete (including AuthContainer)
- [x] New design token tests pass (source-file static analysis) — 36 tests
- [x] Existing `__tests__/auth-screens.test.tsx` behavioral tests still pass — 28 tests
- [x] springBouncy entrance on welcome.tsx panel + success.tsx checkmark
- [x] focus state `border-gold` working on credentials.tsx and setup.tsx inputs
- [x] TypeScript clean for auth files

## Session Notes

**2026-03-14**: Spec execution complete.
- Phase 8.0: 1 test commit (auth-screens-design.test.tsx — 36 design token tests)
- Phase 8.1: 7 implementation commits (FR1-FR6 + test mock fix)
- Phase 8.2: Review passed, no fix commits required
- All 64 tests passing (36 design + 28 behavioral).
- Key finding: spec-research.md described setup.tsx as "team picker" but actual code is rate entry fallback — spec was written to match actual code.
- AuthContainer created in _container.tsx; screens use SafeAreaView directly (cleaner given mixed root element types).
- Added safe-area-context mock to behavioral test file (required for SafeAreaView in jest-expo/node).
