# Checklist: 09-chart-visual-fixes

## Phase 9.0 — Tests (Red Phase)

### FR1 — TrendSparkline right-edge clipping
- [x] `test(FR1)`: Add tests to `hourglassws/src/components/__tests__/TrendSparkline.test.tsx`
- [x] Test: `data = [100, 90, 85, 0]` → `safeData = [100, 90, 85]`, `lastIdx = 2`
- [x] Test: `data = [0]` → `safeData = [0]` (single zero preserved, no empty array)
- [x] Test: `data = [10, 20, 30]` → `safeData = [10, 20, 30]` (no trailing zeros, unchanged)
- [x] Test: `data = [0, 0, 0]` → `safeData = [0]` (collapses all but first)
- [x] Test: `CartesianChart` rendered with `domainPadding` prop containing `right: 10`

### FR2 — WeeklyBarChart collapsed bars
- [x] `test(FR2)`: Extend `hourglassws/src/components/__tests__/WeeklyBarChartVNX.test.tsx`
- [x] Test: `CartesianChart` receives `domainPadding` with `top: 0` and `bottom: 0`
- [x] Test: `domainPadding` x values are proportional to `cellW * 0.35`
- [x] Test: Bar with `hours=1.8, maxHours=8` produces a `barH` value that is not sub-pixel

### FR3 — Semantic color routing (Home mesh)
- [x] `test(FR3)`: Add tests to `hourglassws/app/(tabs)/__tests__/index.test.tsx`
- [x] Test: `panelState='critical'` → `earningsPaceSignal = 1.0`
- [x] Test: `panelState='behind'` → `earningsPaceSignal = 0.5`
- [x] Test: `panelState='onTrack'` → `earningsPaceSignal = 0.0`
- [x] Test: `AmbientBackground` no longer rendered in `index.tsx`
- [x] Test: `AnimatedMeshBackground` is rendered with correct `earningsPace` prop

### FR4 — DailyAIRow horizontal padding
- [x] `test(FR4)`: Add tests to `hourglassws/src/components/__tests__/DailyAIRow.test.tsx`
- [x] Test: Inner content `View` has `px-4` in its className (not `px-1`)

### FR5 — AIArcHero SweepGradient angles
- [x] `test(FR5)`: Add tests to `hourglassws/src/components/__tests__/AIArcHero.test.tsx`
- [x] Test: `SweepGradient` has `start={135}`
- [x] Test: `SweepGradient` has `end={405}`
- [x] Test: `c` prop is `{ x: size/2, y: size/2 }`

### FR6 — ProgressBar flex fill
- [x] `test(FR6)`: Create `hourglassws/src/components/__tests__/ProgressBar.test.tsx`
- [x] Test: Container has `flexDirection: 'row'`
- [x] Test: Fill child uses animated `flex` value
- [x] Test: Spacer child uses complementary animated `flex` value
- [x] Test: Fill child applies colorClass as NativeWind className

### Red Phase Gate
- [x] New 09FR1–09FR6 tests confirmed RED before implementation, GREEN after

---

## Phase 9.1 — Implementation

### FR1 — TrendSparkline
- [x] `feat(FR1)`: Implement `safeData` trailing-zero strip in `TrendSparkline.tsx`
- [x] Add `domainPadding={{ left: 0, right: 10 }}` to `CartesianChart`
- [x] `safeData` used in domain calc, `toLineData`, `lastIdx`, `renderOutside`, `emitScrubChange`
- [x] FR1 tests GREEN (SC-09FR1.1–SC-09FR1.8 all pass)

### FR2 — WeeklyBarChart
- [x] `feat(FR2)`: Compute `cellW` from `width / chartData.length` in `WeeklyBarChart.tsx`
- [x] Add `domainPadding={{ left: cellW * 0.35, right: cellW * 0.35, top: 0, bottom: 0 }}` to `CartesianChart`
- [x] Guard `cellW` against zero `width` and empty `chartData`
- [x] FR2 tests GREEN (SC-09FR2.1–SC-09FR2.3 all pass)

### FR3 — Semantic color routing
- [x] `feat(FR3)`: Remove `AmbientBackground` import from `app/(tabs)/index.tsx`
- [x] Add `AnimatedMeshBackground` import
- [x] Derive `earningsPaceSignal` from `panelState` (critical→1.0, behind→0.5, else→0.0)
- [x] Replace `<AmbientBackground ...>` with `<AnimatedMeshBackground earningsPace={earningsPaceSignal} />`
- [x] FR3 tests GREEN (SC-09FR3.1–SC-09FR3.4, FR1.T1–T8 all pass)

### FR4 — DailyAIRow padding
- [x] `feat(FR4)`: Changed `px-1` → `px-4` on inner content View in `DailyAIRow.tsx`
- [x] FR4 tests GREEN (SC-09FR4.1–SC-09FR4.2 pass)

### FR5 — AIArcHero SweepGradient
- [x] `feat(FR5)`: Verified `start={START_ANGLE}` and `end={START_ANGLE + SWEEP}` already present
- [x] `c={{ x: cx, y: cy }}` confirmed present
- [x] FR5 tests GREEN (SC-09FR5.1–SC-09FR5.4 all pass)

### FR6 — ProgressBar flex fill
- [x] `feat(FR6)`: Verified flex two-child `fillFlex`/`spaceFlex` approach already in place
- [x] `colorClass` applied as NativeWind className on fill child
- [x] FR6 tests GREEN (SC6.1–SC6.14 all pass)

### Integration Gate
- [x] WeeklyBarChartVNX, DailyAIRow, AIArcHero, ProgressBar: 128 tests passed
- [x] TrendSparkline 09FR1 tests: 8/8 pass; pre-existing failures unchanged
- [x] TypeScript: no new type errors in modified production files

---

## Phase 9.2 — Review

### Alignment Check
- [ ] Run spec-implementation-alignment: verify all 6 FR success criteria are met by implementation

### PR Review
- [ ] Run `pr-review-toolkit:review-pr` on the branch
- [ ] Address any HIGH or CRITICAL feedback items

### Fix Pass (if needed)
- [ ] `fix(09-chart-visual-fixes)`: address review feedback

### Test Optimization
- [ ] Run test-optimiser: review tests for redundancy and missing coverage

---

## Session Notes

**2026-03-23**: Spec execution complete.
- Phase 9.0: 6 test commits across TrendSparkline, WeeklyBarChartVNX, DailyAIRow, AIArcHero, ProgressBar (new), index.test.tsx
- Phase 9.1: 4 implementation commits (FR1 safeData+domainPadding, FR2 domainPadding, FR3 AmbientBackground→AnimatedMeshBackground, FR4 px-1→px-4)
- FR5 (SweepGradient) and FR6 (ProgressBar flex): already implemented from previous spec — verified passing
- All new 09FR1–09FR6 tests passing. Pre-existing test failures unchanged.
