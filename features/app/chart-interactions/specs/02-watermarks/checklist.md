# Checklist: 02-watermarks

**Spec:** [spec.md](./spec.md)
**Status:** Ready for implementation

---

## Phase 2.0 — Tests (Red Phase)

Write all tests before any implementation. All tests must fail initially.

### FR1: WeeklyBarChart watermark label

- [x] `test(FR1)`: When `watermarkLabel="38.5h"` provided — source contains a Skia `<Text>` render with that string
- [x] `test(FR1)`: Watermark opacity ≤ 0.10 (verify opacity prop on the Text element)
- [x] `test(FR1)`: Watermark is horizontally centered — x position derived from width/2 minus half text width
- [x] `test(FR1)`: Watermark is vertically centered — y position near height/2
- [x] `test(FR1)`: `watermarkLabel` undefined → no watermark Text element rendered (no crash)
- [x] `test(FR1)`: `watermarkLabel=""` → no watermark Text element rendered

### FR2: AIConeChart legend row

- [x] `test(FR2)`: When `size="full"` → legend row rendered with 3 items containing "AI%", "75% target", "projected"
- [x] `test(FR2)`: Legend references `HOLO_GLOW` (`#38BDF8`) for AI% indicator
- [x] `test(FR2)`: Legend references `AMBER_CORE` (`#FCD34D`) for target indicator
- [x] `test(FR2)`: Legend references `PROJ_COLOR` (`#818CF8`) for projected indicator
- [x] `test(FR2)`: When `size="compact"` → no legend rendered

### FR3: TrendSparkline cap label

- [x] `test(FR3)`: When `showGuide && capLabel="$2,000"` → Skia `<Text>` element in source with that string
- [x] `test(FR3)`: Cap label opacity ≤ 0.40
- [x] `test(FR3)`: Cap label x position ≈ right edge (x near width - padding)
- [x] `test(FR3)`: `capLabel` without `showGuide` → no cap label rendered
- [x] `test(FR3)`: `capLabel` undefined → no crash, no label rendered

### FR4: Home tab prop wiring

- [x] `test(FR4)`: `WeeklyBarChart` receives `watermarkLabel` prop derived from `hoursData.total`
- [x] `test(FR4)`: Earnings `TrendSparkline` receives `showGuide`, `maxValue`, and `capLabel` props

---

## Phase 2.1 — Implementation

Implement each FR to make its tests pass. Run tests after each FR.

### FR1: WeeklyBarChart watermark label

- [x] `feat(FR1)`: Add `watermarkLabel?: string` to `WeeklyBarChartProps` interface
- [x] `feat(FR1)`: Import `matchFont` and `Text` from `@shopify/react-native-skia`
- [x] `feat(FR1)`: Add `const font = matchFont({ fontFamily: 'System', fontSize: 52 })` inside component
- [x] `feat(FR1)`: Render centered Skia `<Text>` inside Canvas, guarded by `watermarkLabel && font`
- [x] `feat(FR1)`: Opacity ≤ 0.10 (target 0.07)
- [x] `feat(FR1)`: Verify FR1 tests pass

### FR2: AIConeChart legend row

- [x] `feat(FR2)`: Wrap AIConeChart Canvas in `<View>` when `size === 'full'`
- [x] `feat(FR2)`: Add legend row below Canvas with 3 items (AI%, 75% target, projected)
- [x] `feat(FR2)`: Use existing color constants (`HOLO_GLOW`, `AMBER_CORE`, `PROJ_COLOR`)
- [x] `feat(FR2)`: Guard: `size === 'compact'` renders no legend
- [x] `feat(FR2)`: Verify FR2 tests pass

### FR3: TrendSparkline cap label

- [x] `feat(FR3)`: Add `capLabel?: string` to `TrendSparklineProps` interface
- [x] `feat(FR3)`: Import `Text` and `matchFont` from `@shopify/react-native-skia`
- [x] `feat(FR3)`: Render Skia `<Text>` at right edge of guide line, guarded by `showGuide && capLabel && font`
- [x] `feat(FR3)`: Opacity ≤ 0.40 (target 0.35), font size 10sp, right-aligned
- [x] `feat(FR3)`: Verify FR3 tests pass

### FR4: Home tab prop wiring

- [x] `feat(FR4)`: Pass `watermarkLabel` to `WeeklyBarChart` in `app/(tabs)/index.tsx`
- [x] `feat(FR4)`: Pass `showGuide`, `maxValue`, `capLabel` to earnings `TrendSparkline`
- [x] `feat(FR4)`: Use graceful fallbacks when data is loading
- [x] `feat(FR4)`: Verify FR4 tests pass

### Integration

- [x] Run full test suite — all 02-watermarks tests passing (136/136)
- [x] No TypeScript errors

---

## Phase 2.2 — Review

Sequential gates — do not parallelize.

- [x] `spec-implementation-alignment`: All FR success criteria satisfied (verified manually)
- [x] `pr-review-toolkit:review-pr`: Code review pass — fix: colors.textMuted for legend label
- [x] Address any review feedback — fixed hardcoded color token
- [x] `test-optimiser`: Tests cover all SCs, source-analysis + render strategy, edge cases covered
- [x] Final test run — all 136 02-watermarks tests passing

---

## Session Notes

**2026-03-15**: Implementation complete.
- Phase 2.0: 1 test commit (test(FR1-FR4)) + 2 fix commits (SC1.10, SC3.7, index.test)
- Phase 2.1: 3 implementation commits (feat(FR1) WeeklyBarChart watermark, feat(FR2) AIConeChart legend, feat(FR3) TrendSparkline cap label) + 1 mock fix
- Note: FR1 and FR4 were already committed from previous session (part of 01-overtime-display and home tab wiring work)
- Phase 2.2: Review passed, 1 fix commit (colors.textMuted token)
- All 136 02-watermarks tests passing. SC3.8-SC3.10 in TrendSparkline render tests fail only due to uncommitted 04-ai-scrub working-tree changes (scrub gesture in TrendSparkline not yet committed for that spec).
