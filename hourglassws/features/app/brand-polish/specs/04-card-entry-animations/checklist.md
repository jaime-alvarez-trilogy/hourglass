# Implementation Checklist

Spec: `04-card-entry-animations`
Feature: `brand-polish`

---

## Phase 1.0: Test Foundation

### FR1: useStaggeredEntry Hook
- [ ] Write test: hook returns `getEntryStyle` function and `isReady` boolean
- [ ] Write test: `getEntryStyle(0)` returns style with `opacity: 0` and `translateY: 16` before focus fires
- [ ] Write test: `getEntryStyle(5)` uses 250ms delay (5 * 50)
- [ ] Write test: `getEntryStyle(7)` is capped at 300ms delay when `maxStaggerIndex = 6` (default)
- [ ] Write test: items at index > `maxStaggerIndex` return resting state `{ opacity: 1, translateY: 0 }` immediately
- [ ] Write test: with `useReducedMotion = true`, all items return resting state with no animation dispatched
- [ ] Write test: each focus event resets shared values to initial state and re-fires animation sequence
- [ ] Write test: hook allocates exactly `min(count, maxStaggerIndex + 1)` animated styles

### FR2: Home Screen Stagger
- [ ] Write test: Hero PanelGradient zone is wrapped in `Animated.View` with `getEntryStyle(0)`
- [ ] Write test: Weekly Chart Card is wrapped in `Animated.View` with `getEntryStyle(1)`
- [ ] Write test: AI Trajectory Card (when `coneData` present) is wrapped with `getEntryStyle(2)`
- [ ] Write test: Earnings Card is wrapped with `getEntryStyle(3)`
- [ ] Write test: `UrgencyBanner` is NOT wrapped in an animated entry view

### FR3: AI Screen Stagger
- [ ] Write test: AI Usage Card is wrapped with `getEntryStyle(0)`
- [ ] Write test: BrainLift Card is wrapped with `getEntryStyle(1)`
- [ ] Write test: Prime Radiant Card is wrapped with `getEntryStyle(2)`
- [ ] Write test: Legend Card renders without overlap glitch (cards have distinct indices)

### FR4: Approvals Screen Stagger
- [ ] Write test: Team Requests section `View` is wrapped with `getEntryStyle(0)` for manager role
- [ ] Write test: My Requests section `View` is wrapped with `getEntryStyle(1)` for manager role
- [ ] Write test: My Requests section uses `getEntryStyle(0)` for non-manager role
- [ ] Write test: individual `ApprovalCard` items are NOT individually wrapped with animated entry styles

### FR5: Overview Screen Stagger
- [ ] Write test: Earnings ChartSection is wrapped with `getEntryStyle(0)`
- [ ] Write test: Hours ChartSection is wrapped with `getEntryStyle(1)`
- [ ] Write test: AI Usage ChartSection is wrapped with `getEntryStyle(2)`
- [ ] Write test: BrainLift ChartSection is wrapped with `getEntryStyle(3)`
- [ ] Write test: the scrub snapshot panel `Animated.View` retains its own independent animation (not rewrapped)

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: useStaggeredEntry Hook
- [ ] Create `src/hooks/useStaggeredEntry.ts`
- [ ] Implement `StaggeredEntryOptions` and `UseStaggeredEntryReturn` interfaces
- [ ] Allocate `min(count, maxStaggerIndex + 1)` shared value pairs using `useSharedValue`
- [ ] Pre-create all `useAnimatedStyle` instances at hook init time (not inside `getEntryStyle`)
- [ ] Implement `useEffect` on `isFocused`: reset values then fire staggered springs
- [ ] Implement `reduceMotion` branch: instantly set all values to resting state
- [ ] Implement `getEntryStyle(index)`: returns pre-created animated style or plain resting style
- [ ] Verify all tests pass for FR1

### FR2: Home Screen Stagger
- [ ] Add `import Animated from 'react-native-reanimated'` to `app/(tabs)/index.tsx`
- [ ] Add `import { useStaggeredEntry } from '@/src/hooks/useStaggeredEntry'`
- [ ] Call `useStaggeredEntry({ count: 4 })` in `HoursDashboard` component
- [ ] Wrap Zone 1 `PanelGradient` in `<Animated.View style={getEntryStyle(0)}>`
- [ ] Wrap Zone 2 `Card` (Weekly Chart) in `<Animated.View style={getEntryStyle(1)}>`
- [ ] Wrap Zone 2.5 `Card` (AI Trajectory, conditional) in `<Animated.View style={getEntryStyle(2)}>`
- [ ] Wrap Zone 3 `Card` (Earnings) in `<Animated.View style={getEntryStyle(3)}>`
- [ ] Verify tests pass; confirm `UrgencyBanner` is not wrapped

### FR3: AI Screen Stagger
- [ ] Add `import Animated from 'react-native-reanimated'` to `app/(tabs)/ai.tsx`
- [ ] Add `import { useStaggeredEntry } from '@/src/hooks/useStaggeredEntry'`
- [ ] Call `useStaggeredEntry({ count: 6 })` in `AIScreen` component
- [ ] Wrap AI Usage `Card` in `<Animated.View style={getEntryStyle(0)}>`
- [ ] Wrap BrainLift `Card` in `<Animated.View style={getEntryStyle(1)}>`
- [ ] Wrap Prime Radiant `Card` in `<Animated.View style={getEntryStyle(2)}>`
- [ ] Wrap Daily Breakdown `Card` (conditional) in `<Animated.View style={getEntryStyle(3)}>`
- [ ] Wrap 12-Week Trajectory `Card` (conditional) in `<Animated.View style={getEntryStyle(4)}>`
- [ ] Wrap Legend `Card` in `<Animated.View style={getEntryStyle(5)}>`
- [ ] Verify tests pass

### FR4: Approvals Screen Stagger
- [ ] Add `import Animated from 'react-native-reanimated'` to `app/(tabs)/approvals.tsx`
- [ ] Add `import { useStaggeredEntry } from '@/src/hooks/useStaggeredEntry'`
- [ ] Call `useStaggeredEntry({ count: 2 })` in `ApprovalsScreen` component
- [ ] Wrap Team Requests section `View` in `<Animated.View style={getEntryStyle(0)}>` (manager only)
- [ ] Wrap My Requests section `View` in `<Animated.View style={getEntryStyle(isManager ? 1 : 0)}>`
- [ ] Confirm individual `ApprovalCard` items in `FlatList` are not wrapped
- [ ] Verify tests pass

### FR5: Overview Screen Stagger
- [ ] Add `import { useStaggeredEntry } from '@/src/hooks/useStaggeredEntry'` to `app/(tabs)/overview.tsx`
- [ ] Call `useStaggeredEntry({ count: 4 })` in `OverviewScreen` component
- [ ] Wrap Earnings `<ChartSection ...>` in `<Animated.View style={getEntryStyle(0)}>`
- [ ] Wrap Hours `<ChartSection ...>` in `<Animated.View style={getEntryStyle(1)}>`
- [ ] Wrap AI Usage `<ChartSection ...>` in `<Animated.View style={getEntryStyle(2)}>`
- [ ] Wrap BrainLift `<ChartSection ...>` in `<Animated.View style={getEntryStyle(3)}>`
- [ ] Confirm scrub snapshot panel `Animated.View` retains its own animation (not modified)
- [ ] Verify tests pass

---

## Phase 1.2: Review (MANDATORY)

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR1–FR5 success criteria verified in code
- [ ] Interface contracts match implementation
- [ ] No scope creep (no exit animations, no individual list item animation)

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(04-card-entry-animations): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on `src/hooks/__tests__/useStaggeredEntry.test.ts`
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(04-card-entry-animations): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests (`app/(tabs)/__tests__/` suite)
- [ ] Code follows existing patterns (no StyleSheet, no hardcoded hex values, hook in `src/hooks/`)

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-15**: Spec created. 5 FRs: hook (FR1) + 4 screen wirings (FR2–FR5). No new packages required. Count values: Home=4, AI=6, Approvals=2, Overview=4.
