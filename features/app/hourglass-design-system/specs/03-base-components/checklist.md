# Implementation Checklist

Spec: `03-base-components`
Feature: `hourglass-design-system`

---

## Phase 1.0: Test Foundation

### FR1: Card — NativeWind Surface Container
- [ ] Write test: renders children without crash
- [ ] Write test: source contains `bg-surface`, `rounded-2xl`, `border-border` class strings (static analysis)
- [ ] Write test: `elevated={true}` — source contains `bg-surfaceElevated`
- [ ] Write test: `className` prop string is present in source

### FR2: MetricValue — Count-Up Hero Number
- [ ] Write test: renders with `value=0` without crash
- [ ] Write test: `useSharedValue` initialized to 0 (count-up starts from 0)
- [ ] Write test: `withTiming` called with target value and `timingChartFill`
- [ ] Write test: `unit="h"` — formatted string includes `"h"` suffix
- [ ] Write test: `precision=0` with `value=42.5` — formatted string is `"43"`
- [ ] Write test: source contains `font-display` class string

### FR3: SectionLabel — Uppercase Section Header
- [ ] Write test: renders string children without crash
- [ ] Write test: source contains `text-textSecondary` class string
- [ ] Write test: source contains `uppercase` and `tracking-widest` class strings
- [ ] Write test: source contains `font-sans-semibold` class string
- [ ] Write test: `className` prop string is present in source

### FR4: PanelGradient — 5-State Gradient Hero Panel
- [ ] Write test: renders without crash for all 5 states (`onTrack`, `behind`, `critical`, `crushedIt`, `idle`)
- [ ] Write test: `PANEL_GRADIENTS` exported with all 5 state keys
- [ ] Write test: `PANEL_GRADIENTS.crushedIt.colors` contains gold-toned hex value
- [ ] Write test: `PANEL_GRADIENTS.critical.colors` contains rose-toned hex value
- [ ] Write test: `PANEL_GRADIENTS.idle.colors` is a flat surface (no transparent stop)
- [ ] Write test: source contains `springPremium` import/usage
- [ ] Write test: `expo-linear-gradient` import mocked and used
- [ ] Write test: no `StyleSheet.create` in source

### FR5: SkeletonLoader — Pulsing Shimmer Placeholder
- [ ] Write test: renders with default dimensions without crash
- [ ] Write test: source contains `timingSmooth` import/usage
- [ ] Write test: `withRepeat` called with reverse=true
- [ ] Write test: `rounded={true}` — source contains `rounded-full` class string
- [ ] Write test: `rounded={false}` — source contains `rounded-lg` (not `rounded-full`)
- [ ] Write test: custom `width={120}` and `height={40}` applied via style
- [ ] Write test: initial `useSharedValue` called with `0.5`

---

## Test Design Validation (MANDATORY)

**Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Card — NativeWind Surface Container
- [ ] Create `hourglassws/src/components/Card.tsx`
- [ ] Apply `bg-surface rounded-2xl border border-border p-5` NativeWind classes
- [ ] Implement `elevated` prop: switch to `bg-surfaceElevated`
- [ ] Accept and merge optional `className` prop
- [ ] Verify: no `StyleSheet.create`, no hardcoded hex values
- [ ] Run FR1 tests and confirm passing

### FR2: MetricValue — Count-Up Hero Number
- [ ] Create `hourglassws/src/components/MetricValue.tsx`
- [ ] Use `useSharedValue(0)` + `withTiming(value, timingChartFill)` in `useEffect`
- [ ] Use `useAnimatedProps` on `Animated.createAnimatedComponent(TextInput)`
- [ ] Format output: `value.toFixed(precision) + (unit ?? '')`
- [ ] Apply `font-display`, `text-textPrimary`, `text-4xl` defaults
- [ ] Accept `colorClass` and `sizeClass` overrides
- [ ] TextInput: `editable={false}`, `caretHidden={true}`
- [ ] Verify: no `StyleSheet.create`, no hardcoded hex values
- [ ] Run FR2 tests and confirm passing

### FR3: SectionLabel — Uppercase Section Header
- [ ] Create `hourglassws/src/components/SectionLabel.tsx`
- [ ] Apply `text-textSecondary font-sans-semibold text-xs uppercase tracking-widest`
- [ ] Accept and merge optional `className` prop
- [ ] Verify: no `StyleSheet.create`
- [ ] Run FR3 tests and confirm passing

### FR4: PanelGradient — 5-State Gradient Hero Panel
- [ ] Create `hourglassws/src/components/PanelGradient.tsx`
- [ ] Define and export `PANEL_GRADIENTS` with all 5 state entries (35% opacity colors)
- [ ] Import `PanelState` from `@/src/lib/panelState`
- [ ] Use `expo-linear-gradient`'s `LinearGradient` for rendering
- [ ] Wrap in `Animated.View` with `springPremium` entrance animation (`withSpring(1, springPremium)`)
- [ ] Add `useEffect` with `state` dependency to re-animate on state change
- [ ] Accept and merge optional `className` prop
- [ ] Verify: no `StyleSheet.create`, hex values only in `PANEL_GRADIENTS` constant
- [ ] Run FR4 tests and confirm passing

### FR5: SkeletonLoader — Pulsing Shimmer Placeholder
- [ ] Create `hourglassws/src/components/SkeletonLoader.tsx`
- [ ] Use `useSharedValue(0.5)` for opacity start
- [ ] Animate: `withRepeat(withTiming(1, timingSmooth), -1, true)` in `useEffect`
- [ ] Use `useAnimatedStyle` with opacity for `Animated.View`
- [ ] Base classes: `bg-border rounded-lg` (or `rounded-full` when `rounded={true}`)
- [ ] Apply `width` and `height` via inline style prop
- [ ] Default: `width='100%'`, `height=20`
- [ ] Verify: no `StyleSheet.create`
- [ ] Run FR5 tests and confirm passing

---

## Phase 1.2: Review (MANDATORY)

**DO NOT skip this phase.** All four steps are mandatory for every change.

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
- [ ] Commit fixes: `fix(03-base-components): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(03-base-components): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-14**: Spec created. Dependencies confirmed: 01-nativewind-verify (NativeWind className → static source analysis pattern) and 02-panel-state (PanelState type at `src/lib/panelState.ts`).
