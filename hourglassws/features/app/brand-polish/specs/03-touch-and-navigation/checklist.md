# Implementation Checklist

Spec: `03-touch-and-navigation`
Feature: `brand-polish`

---

## Phase 1.0: Test Foundation

### FR1: AnimatedPressable Component
- [ ] Write test: renders children without layout changes
- [ ] Write test: scale sharedValue reaches 0.96 on pressIn (or animates toward it)
- [ ] Write test: scale sharedValue returns to 1.0 on pressOut
- [ ] Write test: onPress callback is invoked on tap
- [ ] Write test: custom scaleValue prop is respected
- [ ] Write test: when disabled={true}, scale stays at 1.0 after press events
- [ ] Write test: component exported as named export AnimatedPressable

### FR2: FadeInScreen Spring Entrance
- [ ] Write test: screen content enters with opacity animation on tab focus
- [ ] Write test: translateY starts at 8 and animates to 0 on focus
- [ ] Write test: both opacity and translateY reset when screen loses focus
- [ ] Write test: when useReducedMotion returns true, content is immediately visible
- [ ] Write test: children render correctly with no layout shift in final state

### FR3: HapticTab Scale Feedback
- [ ] Write test: tab icon Animated.View has scale applied via useAnimatedStyle
- [ ] Write test: scale reduces on pressIn
- [ ] Write test: scale returns to 1.0 on pressOut / release
- [ ] Write test: Haptics.impactAsync still fires on press

### FR4: Key Buttons Upgraded to AnimatedPressable
- [ ] Write test: ApprovalCard approve button renders as AnimatedPressable
- [ ] Write test: ApprovalCard reject button renders as AnimatedPressable
- [ ] Write test: modal.tsx Sign Out button renders as AnimatedPressable
- [ ] Write test: existing onPress callbacks preserved after migration

---

## Test Design Validation (MANDATORY)

WARNING: **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: AnimatedPressable Component
- [ ] Create `src/components/AnimatedPressable.tsx`
- [ ] Add `useSharedValue(1)` for scale, `useAnimatedStyle` for transform
- [ ] Wire `onPressIn` → `withTiming(scaleValue, timingInstant)`
- [ ] Wire `onPressOut` → `withSpring(1, springSnappy)`
- [ ] Skip animation when `disabled` prop is true
- [ ] Pass all PressableProps through to underlying Pressable
- [ ] Export as named export `AnimatedPressable`

### FR2: FadeInScreen Spring Entrance
- [ ] Migrate `src/components/FadeInScreen.tsx` from `Animated` (RN core) to Reanimated
- [ ] Add `useSharedValue(0)` for opacity and `useSharedValue(8)` for translateY
- [ ] On focus: `opacity.value = withTiming(1, timingSmooth)`, `translateY.value = withSpring(0, springSnappy)`
- [ ] On blur: reset values directly (no animation) — `opacity.value = 0`, `translateY.value = 8`
- [ ] Add `useReducedMotion()` check — skip animation, show final state immediately
- [ ] Verify external API unchanged: `<FadeInScreen>{children}</FadeInScreen>`

### FR3: HapticTab Scale Feedback
- [ ] Add `useSharedValue(1)` for iconScale to `components/haptic-tab.tsx`
- [ ] Add `useAnimatedStyle` returning `transform: [{ scale: iconScale.value }]`
- [ ] Wrap `props.children` in `Animated.View` with animatedStyle
- [ ] Wire `onPressIn` → haptic call + `iconScale.value = withTiming(0.88, timingInstant)`
- [ ] Wire `onPressOut` → `iconScale.value = withSpring(1, springSnappy)`
- [ ] Verify active/inactive tab styling is unaffected

### FR4: Key Buttons Upgraded to AnimatedPressable
- [ ] In `src/components/ApprovalCard.tsx`: replace Approve `TouchableOpacity` with `AnimatedPressable`
- [ ] In `src/components/ApprovalCard.tsx`: replace Reject `TouchableOpacity` with `AnimatedPressable`
- [ ] In `app/modal.tsx`: replace Sign Out `TouchableOpacity` with `AnimatedPressable`
- [ ] Remove `TouchableOpacity` imports from both files
- [ ] Verify `onPress`, `style`/`className`, `disabled` props pass through correctly

---

## Phase 1.2: Review (MANDATORY)

WARNING: **DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation
- [ ] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(03-touch-and-navigation): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(03-touch-and-navigation): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-15**: Spec created. 4 FRs — FR1 (new AnimatedPressable), FR2 (FadeInScreen upgrade), FR3 (HapticTab scale), FR4 (button migrations). No new dependencies needed.
