# Implementation Checklist

Spec: `07-shared-transitions`
Feature: `brand-revamp`

---

## Phase 1.0: Test Foundation

### FR1: setTag utility (sharedTransitions.ts)
- [ ] Write test: `setTag` with flag `true` returns `{ sharedTransitionTag: tag }`
- [ ] Write test: `setTag` with flag `false` returns `{}`
- [ ] Write test: `setTag` with `Constants.expoConfig` undefined returns `{}`
- [ ] Write test: `setTag` with `extra` key missing returns `{}`
- [ ] Write test: tag string with special characters is returned unchanged

### FR2: Home screen (index.tsx) SET wrappers
- [ ] Write test: earnings card `Animated.View` has `sharedTransitionTag="home-earnings-card"` when flag enabled
- [ ] Write test: AI card `Animated.View` has `sharedTransitionTag="home-ai-card"` when flag enabled
- [ ] Write test: with flag disabled, neither wrapper has `sharedTransitionTag` prop
- [ ] Write test: existing card layout/press handlers are unaffected

### FR3: Overview screen (overview.tsx) SET wrapper
- [ ] Write test: earnings section `Animated.View` has `sharedTransitionTag="home-earnings-card"` when flag enabled
- [ ] Write test: with flag disabled, wrapper renders without `sharedTransitionTag`

### FR4: AI screen (ai.tsx) SET wrapper
- [ ] Write test: main chart `Animated.View` has `sharedTransitionTag="home-ai-card"` when flag enabled
- [ ] Write test: with flag disabled, wrapper renders without `sharedTransitionTag`

### FR5: app.json feature flag
- [ ] Write test (or assertion): `app.json` contains `ENABLE_SHARED_ELEMENT_TRANSITIONS: true`
- [ ] Write test (or assertion): `app.json` retains `ENABLE_NATIVE_TABS: true`

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts (`expo-constants` mocked with flag true/false)
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: setTag utility
- [ ] Create `hourglassws/src/lib/sharedTransitions.ts`
- [ ] Export `setTag(tag: string): { sharedTransitionTag?: string }`
- [ ] Import `Constants` from `expo-constants`
- [ ] Read `Constants.expoConfig?.extra?.ENABLE_SHARED_ELEMENT_TRANSITIONS ?? false`
- [ ] Return `{ sharedTransitionTag: tag }` when truthy, `{}` when falsy
- [ ] Confirm all FR1 tests pass

### FR2: Home screen wrappers
- [ ] Import `Animated` from `react-native-reanimated` in `index.tsx`
- [ ] Import `setTag` from `../../src/lib/sharedTransitions`
- [ ] Wrap earnings TrendSparkline card in `<Animated.View {...setTag('home-earnings-card')}>`
- [ ] Wrap AI compact card in `<Animated.View {...setTag('home-ai-card')}>`
- [ ] Confirm layout unchanged visually (no width/height on wrapper)
- [ ] Confirm all FR2 tests pass

### FR3: Overview screen wrapper
- [ ] Import `Animated` from `react-native-reanimated` in `overview.tsx`
- [ ] Import `setTag` from correct relative path
- [ ] Wrap earnings section in `<Animated.View {...setTag('home-earnings-card')}>`
- [ ] Confirm overview layout unchanged
- [ ] Confirm all FR3 tests pass

### FR4: AI screen wrapper
- [ ] Import `Animated` from `react-native-reanimated` in `ai.tsx`
- [ ] Import `setTag` from correct relative path
- [ ] Wrap main AIConeChart/chart card in `<Animated.View {...setTag('home-ai-card')}>`
- [ ] Confirm AI screen layout unchanged
- [ ] Confirm all FR4 tests pass

### FR5: app.json flag verification
- [ ] Confirm `app.json` already has `ENABLE_SHARED_ELEMENT_TRANSITIONS: true` (no change needed)
- [ ] Confirm `ENABLE_NATIVE_TABS: true` is still present
- [ ] Confirm FR5 tests/assertions pass

---

## Phase 1.2: Review (MANDATORY)

⚠️ **DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation (`setTag` signature, tag strings, file paths)
- [ ] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(07-shared-transitions): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(07-shared-transitions): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns (setTag plain function, Animated.View wrappers additive only)

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-19**: Spec created. app.json already has ENABLE_SHARED_ELEMENT_TRANSITIONS: true (from spec 06). No new npm packages needed. Implementation is purely additive Animated.View wrappers.
