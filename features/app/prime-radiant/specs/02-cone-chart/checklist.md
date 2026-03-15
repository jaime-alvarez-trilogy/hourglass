# Implementation Checklist

Spec: `02-cone-chart`
Feature: `prime-radiant`

---

## Phase 2.0: Test Foundation

### FR1: Types and Props Contract
- [x] Write test: `AIConeChartProps` interface is exported
- [x] Write test: component returns `null` when `width === 0`
- [x] Write test: component returns `null` when `height === 0`
- [x] Write test: `size` defaults to `'full'` when omitted

### FR2: toPixel Coordinate Helper
- [x] Write test: `hoursX = 0` maps to `paddingLeft`
- [x] Write test: `hoursX = weeklyLimit` maps to `width - paddingRight`
- [x] Write test: `pctY = 0` maps to `height - paddingBottom` (bottom of chart)
- [x] Write test: `pctY = 100` maps to `paddingTop` (top of chart, Y inverted)
- [x] Write test: `weeklyLimit <= 0` does not throw (guard)

### FR3: buildActualPath
- [x] Write test: 0 points → empty path, no throw
- [x] Write test: 1 point → path with moveTo only (no lineTo)
- [x] Write test: 3 points → path visits all three pixel coordinates
- [x] Write test: all points at same Y → horizontal line (does not crash)

### FR4: buildConePath
- [x] Write test: empty upper or lower → returns empty path without throw
- [x] Write test: 2-point upper + 2-point lower → closed path (verifies `.close()`)
- [x] Write test: single-point upper + single-point lower → degenerate closed path, no throw
- [x] Write test: upper traces left-to-right, lower traces right-to-left (verify path structure)

### FR5: buildTargetLinePath
- [x] Write test: line spans from `hoursX = 0` to `hoursX = weeklyLimit`
- [x] Write test: Y position corresponds to `pctY = targetPct`
- [x] Write test: returns a path without throwing for edge case `weeklyLimit = 0`

### FR6: Chart Rendering — Layers
- [x] Write render test: valid `ConeData` + non-zero dimensions → renders Canvas (not null)
- [x] Write render test: renders actual path element
- [x] Write render test: renders cone path element
- [x] Write render test: renders target line element

### FR7: Animation
- [x] Write test: `animState.lineEnd` is `0` at init, `1` at `progress = 0.6`
- [x] Write test: `animState.dotOpacity` is `0` at `progress = 0.6`, `1` at `progress = 1`
- [x] Write test: `animState.coneOpacity` equals `progress` value

### FR8: Axis Labels (full variant only)
- [x] Write render test: `size = 'full'` → axis label Text elements present
- [x] Write render test: `size = 'compact'` → no axis label Text elements

---

## Test Design Validation (MANDATORY)

> Validate test design BEFORE implementing. Weak tests lead to weak implementation.

- [x] Run `red-phase-test-validator` agent
- [x] All FR success criteria have test coverage
- [x] Assertions are specific (not just "exists" or "doesn't throw")
- [x] Mocks return realistic data matching `ConeData` interface from `aiCone.ts`
- [x] Fix any issues identified before proceeding

---

## Phase 2.1: Implementation

### FR1: Types and Props Contract
- [x] Export `AIConeChartProps` interface
- [x] Implement `null` guard for `width === 0` or `height === 0`
- [x] Set `size` default to `'full'`
- [x] Export `AIConeChart` as default export

### FR2: toPixel Coordinate Helper
- [x] Implement `toPixel` with X linear mapping
- [x] Implement Y inverted mapping
- [x] Add `weeklyLimit <= 0` guard (return center point)
- [x] Define `PADDING_FULL` and `PADDING_COMPACT` constants

### FR3: buildActualPath
- [x] Implement `buildActualPath` with 0/1/2+ point guards
- [x] Use SVG path string (`M`/`L` commands) — same pattern as TrendSparkline
- [x] Export as named export

### FR4: buildConePath
- [x] Implement upper left-to-right traversal
- [x] Implement lower right-to-left traversal (`[...lower].reverse()`)
- [x] Append `Z` to close the path
- [x] Handle empty array inputs
- [x] Export as named export

### FR5: buildTargetLinePath
- [x] Implement 2-point M + L path from `(0, targetPct)` to `(weeklyLimit, targetPct)`
- [x] Export as named export

### FR6: Chart Rendering — Layers
- [x] Render Canvas with all five layers in correct z-order
- [x] Cone fill: `colors.cyan`, opacity via `coneOpacity * 0.15`
- [x] Upper boundary stroke: `colors.cyan`, opacity `0.30`
- [x] Lower boundary stroke: `colors.cyan`, opacity `0.30`
- [x] Target line: `colors.warning` at 50% opacity
- [x] Actual line: `colors.cyan`, `strokeWidth={2}`, `strokeCap="round"`, `end={animState.lineEnd}`
- [x] Current dot: `colors.cyan`, radius `dotRadius`, `opacity={animState.dotOpacity}`

### FR7: Animation
- [x] Implement `useSharedValue(0)` + `withTiming(1, timingChartFill)` on mount
- [x] Implement `useReducedMotion()` fast-path (`progress.value = 1`)
- [x] Implement `useAnimatedReaction` + `runOnJS(setAnimState)` bridge
- [x] Compute `lineEnd`, `coneOpacity`, `dotOpacity` from progress
- [x] Implement dot pulse (4 → 7 → 4, 200ms each, once only via ref guard)

### FR8: Axis Labels (full variant only)
- [x] Use `matchFont` to get Skia font reference
- [x] Render X-axis tick labels for hours `[0, 10, 20, 30, 40]` where `tick <= weeklyLimit`
- [x] Render Y-axis tick labels for `['0%', '50%', '75%', '100%']`
- [x] Guard font non-null before rendering Text elements
- [x] Skip all labels when `size === 'compact'`

---

## Phase 2.2: Review (MANDATORY)

> DO NOT skip this phase. All four steps are mandatory.

### Step 0: Spec-Implementation Alignment
- [x] Run `spec-implementation-alignment` agent
- [x] All FR success criteria verified in code
- [x] Interface contracts match implementation (types, props, exports)
- [x] No scope creep (no data fetching, no tab integration)

### Step 1: Comprehensive PR Review
- [x] Run `pr-review-toolkit:review-pr` skill (not available; conducted inline review)

### Step 2: Address Feedback
- [x] Fix HIGH severity issues (critical) — none found
- [x] Fix MEDIUM severity issues — `ToPixelFn` unexported, duplicate `toPixelFn` eliminated
- [x] Re-run tests after fixes — 69/69 passing
- [x] Commit fixes: `fix(02-cone-chart): unexport ToPixelFn, deduplicate toPixelFn`

### Step 3: Test Quality Optimization
- [x] Run `test-optimiser` agent on `AIConeChart.test.ts`
- [x] Applied improvements: fixed `beforeAll` to prevent React context contamination
- [x] Re-run tests to confirm passing — 69/69
- [x] Commit: `fix(02-cone-chart): use beforeAll in path builder tests`

### Final Verification
- [x] All tests passing (69/69)
- [x] No regressions in existing tests (pre-existing failures unchanged — 9 suites were failing before, still 9)
- [x] Patterns match `TrendSparkline`, `WeeklyBarChart` (animation bridge, Skia usage)

---

## Session Notes

**2026-03-15**: Spec created. Depends on `01-cone-math` (complete). `ConeData` and `ConePoint` types confirmed in `src/lib/aiCone.ts`.

**2026-03-15**: Implementation complete.
- Phase 2.0: 1 test commit (69 tests, all FRs FR1-FR8)
- Phase 2.1: 1 implementation commit (AIConeChart.tsx + Skia mock extension)
- Phase 2.2: 2 fix commits (test structure + code quality review)
- All 69 tests passing. No regressions.
- Note: Path builders use SVG string format (matching TrendSparkline pattern) rather than Skia.Path() objects. Tests updated to match.
