# Implementation Checklist

Spec: `02-cone-chart`
Feature: `prime-radiant`

---

## Phase 2.0: Test Foundation

### FR1: Types and Props Contract
- [ ] Write test: `AIConeChartProps` interface is exported
- [ ] Write test: component returns `null` when `width === 0`
- [ ] Write test: component returns `null` when `height === 0`
- [ ] Write test: `size` defaults to `'full'` when omitted

### FR2: toPixel Coordinate Helper
- [ ] Write test: `hoursX = 0` maps to `paddingLeft`
- [ ] Write test: `hoursX = weeklyLimit` maps to `width - paddingRight`
- [ ] Write test: `pctY = 0` maps to `height - paddingBottom` (bottom of chart)
- [ ] Write test: `pctY = 100` maps to `paddingTop` (top of chart, Y inverted)
- [ ] Write test: `weeklyLimit <= 0` does not throw (guard)

### FR3: buildActualPath
- [ ] Write test: 0 points → empty path, no throw
- [ ] Write test: 1 point → path with moveTo only (no lineTo)
- [ ] Write test: 3 points → path visits all three pixel coordinates
- [ ] Write test: all points at same Y → horizontal line (does not crash)

### FR4: buildConePath
- [ ] Write test: empty upper or lower → returns empty path without throw
- [ ] Write test: 2-point upper + 2-point lower → closed path (verifies `.close()`)
- [ ] Write test: single-point upper + single-point lower → degenerate closed path, no throw
- [ ] Write test: upper traces left-to-right, lower traces right-to-left (verify path structure)

### FR5: buildTargetLinePath
- [ ] Write test: line spans from `hoursX = 0` to `hoursX = weeklyLimit`
- [ ] Write test: Y position corresponds to `pctY = targetPct`
- [ ] Write test: returns a path without throwing for edge case `weeklyLimit = 0`

### FR6: Chart Rendering — Layers
- [ ] Write render test: valid `ConeData` + non-zero dimensions → renders Canvas (not null)
- [ ] Write render test: renders actual path element
- [ ] Write render test: renders cone path element
- [ ] Write render test: renders target line element

### FR7: Animation
- [ ] Write test: `animState.lineEnd` is `0` at init, `1` at `progress = 0.6`
- [ ] Write test: `animState.dotOpacity` is `0` at `progress = 0.6`, `1` at `progress = 1`
- [ ] Write test: `animState.coneOpacity` equals `progress` value

### FR8: Axis Labels (full variant only)
- [ ] Write render test: `size = 'full'` → axis label Text elements present
- [ ] Write render test: `size = 'compact'` → no axis label Text elements

---

## Test Design Validation (MANDATORY)

> Validate test design BEFORE implementing. Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching `ConeData` interface from `aiCone.ts`
- [ ] Fix any issues identified before proceeding

---

## Phase 2.1: Implementation

### FR1: Types and Props Contract
- [ ] Export `AIConeChartProps` interface
- [ ] Implement `null` guard for `width === 0` or `height === 0`
- [ ] Set `size` default to `'full'`
- [ ] Export `AIConeChart` as default export

### FR2: toPixel Coordinate Helper
- [ ] Implement `toPixel` with X linear mapping
- [ ] Implement Y inverted mapping
- [ ] Add `weeklyLimit <= 0` guard (return center point)
- [ ] Define `PADDING_FULL` and `PADDING_COMPACT` constants

### FR3: buildActualPath
- [ ] Implement `buildActualPath` with 0/1/2+ point guards
- [ ] Use Skia `Skia.Path.Make()` or `path()` API
- [ ] Export as named export

### FR4: buildConePath
- [ ] Implement upper left-to-right traversal
- [ ] Implement lower right-to-left traversal
- [ ] Call `.close()` to close the path
- [ ] Handle empty array inputs
- [ ] Export as named export

### FR5: buildTargetLinePath
- [ ] Implement 2-point M + L path from `(0, targetPct)` to `(weeklyLimit, targetPct)`
- [ ] Export as named export

### FR6: Chart Rendering — Layers
- [ ] Render Canvas with all five layers in correct z-order
- [ ] Cone fill: `colors.cyan`, opacity via `coneOpacity * 0.15`
- [ ] Upper boundary stroke: `colors.cyan`, opacity `0.30`
- [ ] Lower boundary stroke: `colors.cyan`, opacity `0.30`
- [ ] Target line: `colors.warning` at 50% opacity, dashed `[6, 4]`
- [ ] Actual line: `colors.cyan`, `strokeWidth={2}`, `strokeCap="round"`, `end={animState.lineEnd}`
- [ ] Current dot: `colors.cyan`, radius `dotRadius`, `opacity={animState.dotOpacity}`

### FR7: Animation
- [ ] Implement `useSharedValue(0)` + `withTiming(1, timingChartFill)` on mount
- [ ] Implement `useReducedMotion()` fast-path (`progress.value = 1`)
- [ ] Implement `useAnimatedReaction` + `runOnJS(setAnimState)` bridge
- [ ] Compute `lineEnd`, `coneOpacity`, `dotOpacity` from progress
- [ ] Implement dot pulse (4 → 7 → 4, 200ms each, once only via ref guard)

### FR8: Axis Labels (full variant only)
- [ ] Use `matchFont` to get Skia font reference
- [ ] Render X-axis tick labels for hours `[0, 10, 20, 30, 40]` where `tick <= weeklyLimit`
- [ ] Render Y-axis tick labels for `['0%', '50%', '75%', '100%']`
- [ ] Guard font non-null before rendering Text elements
- [ ] Skip all labels when `size === 'compact'`

---

## Phase 2.2: Review (MANDATORY)

> DO NOT skip this phase. All four steps are mandatory.

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation (types, props, exports)
- [ ] No scope creep (no data fetching, no tab integration)

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(02-cone-chart): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on `AIConeChart.test.ts`
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(02-cone-chart): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Patterns match `TrendSparkline`, `WeeklyBarChart` (animation bridge, Skia usage)

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-15**: Spec created. Depends on `01-cone-math` (complete). `ConeData` and `ConePoint` types confirmed in `src/lib/aiCone.ts`.
