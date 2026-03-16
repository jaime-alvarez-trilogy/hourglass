# Checklist — 03-motion-universality

## Phase 3.0 — Tests (Red Phase)

### FR1 tests — index.tsx AnimatedPressable

- [ ] Write `MotionUniversality.test.tsx` — SC1.1: `index.tsx` does NOT import `TouchableOpacity` from react-native
- [ ] Write `MotionUniversality.test.tsx` — SC1.2: `index.tsx` DOES import `AnimatedPressable`
- [ ] Write `MotionUniversality.test.tsx` — SC1.3: `index.tsx` contains `AnimatedPressable` with `testID="settings-button"`
- [ ] Write `MotionUniversality.test.tsx` — SC1.4: `index.tsx` contains `AnimatedPressable` with `testID="retry-button"`
- [ ] Write `MotionUniversality.test.tsx` — SC1.5: smoke render — `HoursDashboard` renders without crash

### FR2 tests — approvals.tsx AnimatedPressable + tint color

- [ ] Write `MotionUniversality.test.tsx` — SC2.1: `approvals.tsx` does NOT import plain `Pressable` from react-native
- [ ] Write `MotionUniversality.test.tsx` — SC2.2: `approvals.tsx` DOES import `AnimatedPressable`
- [ ] Write `MotionUniversality.test.tsx` — SC2.3: `approvals.tsx` contains `AnimatedPressable` wired to `handleApproveAll`
- [ ] Write `MotionUniversality.test.tsx` — SC2.4: `approvals.tsx` contains `AnimatedPressable` wired to `teamRefetch` and `myRefetch`
- [ ] Write `MotionUniversality.test.tsx` — SC2.5: `approvals.tsx` RefreshControl tint does NOT contain `#10B981`
- [ ] Write `MotionUniversality.test.tsx` — SC2.6: `approvals.tsx` RefreshControl tint DOES reference `colors.success`
- [ ] Write `MotionUniversality.test.tsx` — SC2.7: smoke render — `ApprovalsScreen` renders without crash

### FR3 tests — ai.tsx AnimatedPressable

- [ ] Write `MotionUniversality.test.tsx` — SC3.1: `ai.tsx` does NOT import `TouchableOpacity` from react-native
- [ ] Write `MotionUniversality.test.tsx` — SC3.2: `ai.tsx` DOES import `AnimatedPressable`
- [ ] Write `MotionUniversality.test.tsx` — SC3.3: `ai.tsx` contains `AnimatedPressable` with `testID="relogin-button"`
- [ ] Write `MotionUniversality.test.tsx` — SC3.4: `ai.tsx` contains `AnimatedPressable` with `testID="retry-button"`
- [ ] Write `MotionUniversality.test.tsx` — SC3.5: `ai.tsx` contains `AnimatedPressable` wrapping the empty-state Refresh button
- [ ] Write `MotionUniversality.test.tsx` — SC3.6: smoke render — `AIScreen` renders without crash

### Red phase validation

- [ ] Run test suite — all new tests FAIL (red): `cd hourglassws && npx jest src/components/__tests__/MotionUniversality.test.tsx --no-coverage`
- [ ] Confirm failures are the expected "import not found" / "pattern not matched" failures, not test infrastructure errors

---

## Phase 3.1 — Implementation

### FR1 — index.tsx

- [ ] Add `import { AnimatedPressable } from '@/src/components/AnimatedPressable'` to `app/(tabs)/index.tsx`
- [ ] Remove `TouchableOpacity` from the `react-native` import in `app/(tabs)/index.tsx`
- [ ] Replace settings button `TouchableOpacity` with `AnimatedPressable` (preserve `testID="settings-button"` and `onPress`)
- [ ] Replace error-banner retry `TouchableOpacity` with `AnimatedPressable` (preserve `testID="retry-button"` and `onPress={refetch}`)
- [ ] Run FR1 tests green: SC1.1–SC1.5 pass

### FR2 — approvals.tsx

- [ ] Add `import { AnimatedPressable } from '@/src/components/AnimatedPressable'` to `app/(tabs)/approvals.tsx`
- [ ] Add `colors` to the `@/src/lib/colors` import in `app/(tabs)/approvals.tsx`
- [ ] Remove `Pressable` from the `react-native` import in `app/(tabs)/approvals.tsx`
- [ ] Replace Approve All `Pressable` with `AnimatedPressable` (preserve `disabled={isApprovingAll}`, `onPress={handleApproveAll}`, className)
- [ ] Replace team error Retry `Pressable` with `AnimatedPressable` (preserve `onPress={teamRefetch}`)
- [ ] Replace my-requests error Retry `Pressable` with `AnimatedPressable` (preserve `onPress={myRefetch}`)
- [ ] Change RefreshControl `tintColor="#10B981"` to `tintColor={colors.success}`
- [ ] Run FR2 tests green: SC2.1–SC2.7 pass

### FR3 — ai.tsx

- [ ] Add `import { AnimatedPressable } from '@/src/components/AnimatedPressable'` to `app/(tabs)/ai.tsx`
- [ ] Remove `TouchableOpacity` from the `react-native` import in `app/(tabs)/ai.tsx`
- [ ] Replace auth error Re-login `TouchableOpacity` with `AnimatedPressable` (preserve `testID="relogin-button"` and `onPress`)
- [ ] Replace network error Retry `TouchableOpacity` with `AnimatedPressable` (preserve `testID="retry-button"` and `onPress`)
- [ ] Replace empty state Refresh `TouchableOpacity` with `AnimatedPressable` (preserve `onPress={refetch}`)
- [ ] Run FR3 tests green: SC3.1–SC3.6 pass

### Full test suite

- [ ] Run full test suite — all tests pass: `cd hourglassws && npx jest --no-coverage`

---

## Phase 3.2 — Review

- [ ] Run `spec-implementation-alignment`: verify all 3 FRs implemented, all success criteria met
- [ ] Run `pr-review-toolkit:review-pr`: review code quality and brand consistency
- [ ] Address any review feedback
- [ ] Run `test-optimiser`: check for redundant or missing test coverage
- [ ] Final test run — all tests pass
