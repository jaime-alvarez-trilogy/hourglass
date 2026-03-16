# Checklist: 03-overview-hero

**Spec:** [spec.md](./spec.md)
**Status:** Complete

---

## Phase 3.0 — Tests (Red Phase)

Write all tests before any implementation. Tests must fail (red) against current codebase.

### FR3 — `computeEarningsPace` tests

- [x] Create `hourglassws/src/lib/__tests__/overviewUtils.test.ts`
- [x] SC3.1 — `[100, 100, 100, 100]` → `1.0`
- [x] SC3.2 — `[80, 80, 80, 120]` → `1.5`
- [x] SC3.3 — `[100, 100, 100, 60]` → `0.6`
- [x] SC3.4 — `[100, 100, 100, 0]` → `0.0`
- [x] SC3.5 — `[100]` (length 1) → `1.0`
- [x] SC3.6 — `[]` (empty) → `1.0`
- [x] SC3.7 — prior average uses `earnings.slice(0, -1)`
- [x] SC3.8 — prior avg = 0 → `1.0` (division by zero guard)
- [x] Commit: `test(FR3): add computeEarningsPace tests`

### FR1/FR2 — `OverviewHeroCard` tests

- [x] Create `hourglassws/src/components/__tests__/OverviewHeroCard.test.tsx`
- [x] SC1.1 — source contains `$` + `toLocaleString()` earnings formatting
- [x] SC1.2 — source contains `h` suffix for hours
- [x] SC1.3 — source imports `Card` and uses `elevated` prop
- [x] SC1.4 — source contains `"LAST 4 WEEKS"` and `"LAST 12 WEEKS"` strings
- [x] SC1.5 — source uses `TouchableOpacity` or `Pressable` for toggle
- [x] SC1.6 — source calls `onWindowChange(4)` (or passes 4)
- [x] SC1.7 — source calls `onWindowChange(12)` (or passes 12)
- [x] SC1.8 — active pill uses `colors.surface` background
- [x] SC1.9 — source has side-by-side row layout (flexDirection row)
- [x] SC2.1 — overtime badge text contains `OT` when `overtimeHours > 0`
- [x] SC2.2 — overtime badge uses `overtimeWhiteGold` color
- [x] SC2.3 — overtime badge conditionally absent when `overtimeHours === 0`
- [x] SC2.4 — overtime value uses `Math.round`
- [x] Commit: `test(FR1-FR2): add OverviewHeroCard source analysis tests`

### FR4/FR5 — overview.tsx ambient wiring tests

- [x] Extend `hourglassws/app/(tabs)/__tests__/overview.test.tsx`
- [x] SC4.1 — `overview.tsx` imports `AmbientBackground`
- [x] SC4.2 — `AmbientBackground` present outside `ScrollView` in source
- [x] SC4.3 — `overview.tsx` imports `getAmbientColor`
- [x] SC4.4 — `computeEarningsPace` called with `overviewData.earnings`
- [x] SC4.5 — `{ type: 'earningsPace'` pattern present in source
- [x] SC4.6 — null fallback for ambient color when data unavailable
- [x] SC5.1 — standalone header toggle row removed (old toggle pattern absent)
- [x] SC5.2 — `OverviewHeroCard` rendered before scrub panel in source
- [x] SC5.3 — `window` prop passed to `OverviewHeroCard`
- [x] SC5.4 — `onWindowChange={handleWindowChange}` passed to `OverviewHeroCard`
- [x] SC5.5 — `totalEarnings` uses sum of `overviewData.earnings`
- [x] SC5.6 — `totalHours` uses sum of `overviewData.hours`
- [x] SC5.7 — `overtimeHours` uses `Math.max(0, ...)` pattern
- [x] Commit: `test(FR4-FR5): add overview ambient wiring and hero integration tests`

---

## Phase 3.1 — Implementation

Implement in dependency order: FR3 → FR1/FR2 (parallel) → FR4/FR5.

### FR3 — `computeEarningsPace`

- [x] Create `hourglassws/src/lib/overviewUtils.ts`
- [x] Implement `computeEarningsPace(earnings: number[]): number`
- [x] Edge: `length < 2` → `1.0`
- [x] Edge: prior avg = 0 → `1.0`
- [x] Verify all `overviewUtils.test.ts` tests pass (green)
- [x] Commit: `feat(FR3): implement computeEarningsPace in overviewUtils.ts`

### FR1/FR2 — `OverviewHeroCard` component

- [x] Create `hourglassws/src/components/OverviewHeroCard.tsx`
- [x] Import `Card` from `./Card`
- [x] Import `colors` from `@/src/lib/colors`
- [x] Render period label ("LAST 4 WEEKS" / "LAST 12 WEEKS")
- [x] Render 4W/12W toggle with active pill styling
- [x] Render earnings metric (`$X,XXX` in gold)
- [x] Render hours metric (`XXXh` in textPrimary)
- [x] Render overtime badge when `overtimeHours > 0` (`+Xh OT` in overtimeWhiteGold)
- [x] Verify `OverviewHeroCard.test.tsx` tests pass (green)
- [x] Commit: `feat(FR1-FR2): implement OverviewHeroCard with dual metrics and overtime badge`

### FR4/FR5 — overview.tsx ambient wiring + toggle migration

- [x] Add `useHoursData` import (if not already present)
- [x] Import `AmbientBackground`, `getAmbientColor` from `@/src/components/AmbientBackground`
- [x] Import `computeEarningsPace` from `@/src/lib/overviewUtils`
- [x] Import `OverviewHeroCard` from `@/src/components/OverviewHeroCard`
- [x] Compute `earningsPace` and `ambientColor` from `overviewData.earnings`
- [x] Place `<AmbientBackground color={ambientColor} />` inside `SafeAreaView`, outside `ScrollView`
- [x] Add `<OverviewHeroCard ... />` as first item inside `ScrollView`
- [x] Remove standalone header toggle row (the `<View>` with title + toggle pills)
- [x] Compute `overtimeHours = Math.max(0, (hoursData?.total ?? 0) - (config?.weeklyLimit ?? 0))`
- [x] Compute `totalEarnings = overviewData.earnings.reduce((s, v) => s + v, 0)`
- [x] Compute `totalHours = overviewData.hours.reduce((s, v) => s + v, 0)`
- [x] Verify existing tests still pass (no regressions)
- [x] Verify new FR4/FR5 tests pass (green)
- [x] Commit: `feat(FR4-FR5): wire AmbientBackground and OverviewHeroCard into overview screen`

---

## Phase 3.2 — Review

Sequential gates. Complete in order.

- [x] Run `spec-implementation-alignment` check against spec.md — PASS (all 27 SC satisfied)
- [x] Run `pr-review-toolkit:review-pr` — PASS (1 fix: hoist pill styles to constants)
- [x] Address any feedback — `fix(03-overview-hero): hoist toggle pill styles to module-level constants`
- [x] Run `test-optimiser` on new test files — PASS (no changes needed)
- [x] All tests passing (run full test suite) — 105/105 new tests pass, no regressions
- [x] Update this checklist — mark all tasks complete
- [x] Update `FEATURE.md` changelog entry for `03-overview-hero`

---

## Session Notes

**2026-03-16**: Implementation complete.
- Phase 3.0: 3 test commits (test(FR3), test(FR1-FR2), test(FR4-FR5)) — 105 tests total
- Phase 3.1: 3 implementation commits (feat(FR3), feat(FR1-FR2), feat(FR4-FR5))
- Phase 3.2: 2 fix commits (SectionLabel className fix, pill styles hoisted to constants)
- All 105 new tests passing. No regressions in pre-existing passing tests.
- Pre-existing failures (16 suites, 112 tests) unchanged — from other in-progress specs.
