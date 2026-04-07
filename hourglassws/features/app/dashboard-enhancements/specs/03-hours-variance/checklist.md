# Checklist: 03-hours-variance

## Phase 1.0 — Tests (Red Phase)

### FR1: computeHoursVariance — Core Calculation
- [ ] Test: `[40, 40, 40, 40]` → stdDev=0, label='Consistent', isConsistent=true
- [ ] Test: `[38, 42, 39, 41, 40]` → stdDev≈1.4, label='±1.4h/week', isConsistent=true
- [ ] Test: `[30, 40, 35, 45, 38]` → stdDev>3, label='Variable', isConsistent=false
- [ ] Test: last entry excluded (partial week) before calculation
- [ ] Test: zero entries filtered out before calculation
- [ ] Test: `[40, 0, 0, 40]` → null (zeros filtered, only 1 completed point)

### FR2: Null-Safe Guard — Insufficient Data
- [ ] Test: `[]` → null
- [ ] Test: `[40]` → null (0 completed points after excluding last)
- [ ] Test: `[40, 40]` → null (1 completed point)
- [ ] Test: `[40, 40, 40]` → non-null (2 completed points — minimum)
- [ ] Test: no crash/undefined for any input length

### FR3: ChartSection — subtitleRight Prop
- [ ] Test: renders subtitleRight text when prop supplied
- [ ] Test: applies subtitleRightColor to subtitleRight text
- [ ] Test: omits subtitleRight when prop absent (backward compatible)
- [ ] Test: existing subtitle-only usage unchanged

### FR4: Overview Screen — Wire Variance to ChartSection
- [ ] Test: passes hoursVariance.label as subtitleRight when non-null
- [ ] Test: passes colors.success when isConsistent (stdDev ≤ 2)
- [ ] Test: passes colors.warning when stdDev ≤ 3 and not consistent
- [ ] Test: passes colors.textSecondary when stdDev > 3
- [ ] Test: no subtitleRight passed when hoursVariance is null

## Phase 1.1 — Implementation (Green Phase)

### FR1 + FR2: computeHoursVariance utility
- [ ] Add `HoursVarianceResult` interface to `src/lib/hours.ts`
- [ ] Implement `computeHoursVariance(hours: number[])` in `src/lib/hours.ts`
  - [ ] Exclude last entry (partial week)
  - [ ] Filter zero values
  - [ ] Return null if < 3 completed points
  - [ ] Compute population stdDev
  - [ ] Derive label (Consistent / ±N.Nh/week / Variable)
  - [ ] Derive isConsistent (stdDev ≤ 2)
- [ ] All FR1/FR2 tests passing

### FR3: ChartSection prop extension
- [ ] Add `subtitleRight?: string` to `ChartSectionProps` in `src/components/overview.tsx`
- [ ] Add `subtitleRightColor?: string` to `ChartSectionProps`
- [ ] Render `subtitleRight` inline after subtitle with ` · ` separator
- [ ] Apply `subtitleRightColor` style when provided
- [ ] All FR3 tests passing

### FR4: Overview screen wiring
- [ ] Import `computeHoursVariance` in `app/(tabs)/overview.tsx`
- [ ] Compute `hoursVariance` from `overviewData.hours`
- [ ] Derive `varianceColor` from stdDev tiers
- [ ] Pass `subtitleRight` and `subtitleRightColor` to Weekly Hours ChartSection
- [ ] All FR4 tests passing

## Phase 1.2 — Review

- [ ] Run spec-implementation-alignment check
- [ ] Run pr-review-toolkit:review-pr
- [ ] Address any review feedback
- [ ] Run test-optimiser
- [ ] All tests passing (full suite)
- [ ] Commit documentation updates (checklist + FEATURE.md)
