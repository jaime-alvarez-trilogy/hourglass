# Checklist — 04-chart-polish

## Phase 4.0 — Tests (Write First, Must Fail Red)

### FR1 — TrendSparkline strokeWidth default
- [x] Test: `TrendSparkline` renders with `strokeWidth` defaulting to `3` when no prop passed
- [x] Test: `TrendSparkline` respects explicit `strokeWidth` prop when provided (backward compat)

### FR2 — TrendSparkline three-layer glow
- [x] Test: Outer glow Paint has `strokeWidth={14}`
- [x] Test: Outer glow `BlurMask` has `blur={12}`
- [x] Test: Mid glow Paint exists with `strokeWidth={7}`
- [x] Test: Mid glow `BlurMask` has `blur={4}`
- [x] Test: Mid glow color uses `color + '80'` (50% opacity)
- [x] Test: Core line has no `BlurMask` child (2 BlurMask layers counted, core has none)

### FR3 — WeeklyBarChart todayColor prop
- [x] Test: `WeeklyBarChart` accepts `todayColor` prop without TypeScript error
- [x] Test: When `todayColor` is provided, today's bar uses that color
- [x] Test: When `todayColor` is omitted, today's bar defaults to `colors.success`
- [x] Test: Completed past days still use `colors.success`
- [x] Test: Future days still use `colors.textMuted`

### FR4 — Home screen TODAY_BAR_COLORS mapping
- [x] Test: `TODAY_BAR_COLORS` covers all 6 PanelState values (`onTrack`, `behind`, `critical`, `crushedIt`, `overtime`, `idle`)
- [x] Test: `panelState === 'critical'` maps to `colors.critical`
- [x] Test: `panelState === 'behind'` maps to `colors.warning`
- [x] Test: `panelState === 'onTrack'` maps to `colors.success`
- [x] Test: `panelState === 'crushedIt'` maps to `colors.overtimeWhiteGold`
- [x] Test: `panelState === 'overtime'` maps to `colors.overtimeWhiteGold`
- [x] Test: `panelState === 'idle'` maps to `colors.textMuted`
- [x] Test: `WeeklyBarChart` in `index.tsx` receives `todayColor` prop driven by `panelState`

---

## Phase 4.1 — Implementation

### FR1 — TrendSparkline strokeWidth default
- [x] Change `strokeWidth` prop default from `2` to `3` in `TrendSparkline.tsx`
- [x] Verify all callers without explicit `strokeWidth` receive 3px (no caller changes needed)

### FR2 — TrendSparkline three-layer glow
- [x] Update outer glow: `strokeWidth` 10→14, `BlurMask blur` 8→12 in `TrendSparkline.tsx`
- [x] Insert mid glow layer: `strokeWidth={7}`, `color={color + '80'}`, `BlurMask blur={4}` in `TrendSparkline.tsx`
- [x] Reference `AIConeChart.tsx` for exact JSX structure of glow layers

### FR3 — WeeklyBarChart todayColor prop
- [x] Add `todayColor?: string` to `WeeklyBarChartProps` interface in `WeeklyBarChart.tsx`
- [x] Destructure with default: `todayColor = colors.success`
- [x] Replace hardcoded `colors.gold` for today's bar with `todayColor`

### FR4 — Home screen TODAY_BAR_COLORS mapping
- [x] Define `TODAY_BAR_COLORS: Record<PanelState, string>` at module scope in `index.tsx`
- [x] Import `PanelState` type if not already imported (was already imported)
- [x] Pass `todayColor={TODAY_BAR_COLORS[panelState]}` to `WeeklyBarChart` in `index.tsx`
- [x] Handle loading/undefined `panelState` case with fallback to `colors.success` (panelState always computed)

---

## Phase 4.2 — Review

- [x] Run spec-implementation-alignment check — PASS (all FR success criteria met)
- [x] Run pr-review-toolkit:review-pr — N/A (no PR yet; review done inline)
- [x] Address any review feedback — none required
- [x] Run test-optimiser — tests are focused static-analysis style, no bloat
- [x] All 04-chart-polish tests passing (green) — 27 new passing tests
- [x] TypeScript compiles — no new errors introduced by these changes

---

## Session Notes

**2026-03-16**: Spec execution complete.
- Phase 4.0: 3 test commits (TrendSparkline.test.tsx, WeeklyBarChart.test.tsx, index-chart-polish.test.tsx)
- Phase 4.1: 1 implementation commit (TrendSparkline.tsx, WeeklyBarChart.tsx, index.tsx)
- Phase 4.2: Alignment check PASS, no review feedback
- All 04-chart-polish tests passing. Pre-existing failures in 07-chart-line-polish tests are unrelated (different spec, conflicting requirements between specs).
- Net test improvement: 106 failing → 79 failing (27 fewer failures overall).
