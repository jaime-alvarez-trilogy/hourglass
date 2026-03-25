# Implementation Checklist

Spec: `03-android-visual`
Feature: `widget-brand-revamp`

---

## Phase 1.0: Test Foundation

### FR1: Helper Functions
- [ ] Write tests for `buildMeshSvg` returns valid SVG string containing `<svg`, `<defs`, `<radialGradient`
- [ ] Write tests for `buildMeshSvg` Node C color: urgency='critical' → '#F43F5E', urgency='high' → '#F59E0B', paceBadge='on_track' → '#10B981', paceBadge='crushed_it' → '#FFDF89', default → '#A78BFA'
- [ ] Write tests for `badgeColor('crushed_it')` → `'#FFDF89'`, `'on_track'` → `'#10B981'`, `'behind'` → `'#F59E0B'`, `'critical'` → `'#F43F5E'`, `'none'` → `''`
- [ ] Write tests for `badgeLabel('crushed_it')` → `'CRUSHED IT'`, `'on_track'` → `'ON TRACK'`, `'behind'` → `'BEHIND PACE'`, `'critical'` → `'CRITICAL'`, `'none'` → `''`
- [ ] Write tests for `deltaColor('+2.1h')` → `'#10B981'`, `deltaColor('-$84')` → `'#F59E0B'`, `deltaColor('')` → `'transparent'`
- [ ] Write tests for `blProgressBar(5, 5, 200)` → SVG with fill width=200; `blProgressBar(10, 5, 200)` → capped at 200; `blProgressBar(2.5, 5, 200)` → fill width=100

### FR2: SVG Mesh Background Layer
- [ ] Write tests that `SmallWidget` renders `SvgWidget` as first child of root `FlexWidget`
- [ ] Write tests that `MediumWidget` renders `SvgWidget` as first child of root `FlexWidget`
- [ ] Write tests that `SvgWidget` svg prop contains output of `buildMeshSvg`
- [ ] Write tests that `FallbackWidget` does NOT render a `SvgWidget` mesh

### FR3: Glass Panel Cards
- [ ] Write tests that medium widget hours panel has outer `backgroundColor: '#2F2E41'` with `borderRadius: 13`
- [ ] Write tests that medium widget hours panel has inner `backgroundColor: '#16151F'` with `borderRadius: 12`
- [ ] Write tests that medium widget earnings panel uses same glass border trick
- [ ] Write tests that no `#FFFFFF` appears in any background style
- [ ] Write tests that small widget wraps content in glass panel

### FR4: Pace Badge
- [ ] Write tests for `paceBadge='on_track'` → badge renders with `backgroundColor: '#10B981'`, text `'ON TRACK'`
- [ ] Write tests for `paceBadge='crushed_it'` → badge renders with `backgroundColor: '#FFDF89'`, text `'CRUSHED IT'`
- [ ] Write tests for `paceBadge='behind'` → badge renders with `backgroundColor: '#F59E0B'`, text `'BEHIND PACE'`
- [ ] Write tests for `paceBadge='critical'` → badge renders with `backgroundColor: '#F43F5E'`, text `'CRITICAL'`
- [ ] Write tests for `paceBadge='none'` → no badge rendered
- [ ] Write tests for `paceBadge` undefined → no badge rendered (backward compat, no crash)
- [ ] Write tests that badge text color is `'#0D0C14'`

### FR5: Trend Delta Text
- [ ] Write tests for `weekDeltaHours='+2.1h'` → renders text containing `↑` and `2.1h`, color `#10B981`
- [ ] Write tests for `weekDeltaHours='-3.4h'` → renders text containing `↓` and `3.4h`, color `#F59E0B`
- [ ] Write tests for `weekDeltaHours=''` → no delta TextWidget rendered for hours
- [ ] Write tests for `weekDeltaEarnings='+$84'` → renders with `↑` and color `#10B981`
- [ ] Write tests for `weekDeltaEarnings='-$136'` → renders with `↓` and color `#F59E0B`
- [ ] Write tests for `weekDeltaEarnings=''` → no delta TextWidget rendered for earnings
- [ ] Write tests for undefined weekDelta fields → no crash (treated as `''`)

### FR6: BrainLift Progress Bar
- [ ] Write tests that `brainlift='3.2h'`, `brainliftTarget='5h'` → `SvgWidget` svg contains fill width ≈ 76 (Math.floor(3.2/5 * 120))
- [ ] Write tests that `brainlift='6h'`, `brainliftTarget='5h'` → fill width capped at 120
- [ ] Write tests that `brainliftTarget` missing → defaults to `'5h'`
- [ ] Write tests that `brainlift='0h'` → fill width = 0
- [ ] Write tests that BrainLift progress bar only appears in medium widget hours mode (not action/urgency mode, not small widget)
- [ ] Write tests that BL label color is `#A78BFA`
- [ ] Write tests that malformed `brainlift` value does not crash

### FR7: Manager Urgency Mode
- [ ] Write tests for `isManager=true, urgency='critical', pendingCount=3` → countdown hero visible, approval items shown
- [ ] Write tests for `isManager=true, urgency='high', pendingCount=1` → urgency mode triggered
- [ ] Write tests for `isManager=true, urgency='low', pendingCount=5` → hours mode (not urgency mode)
- [ ] Write tests for `isManager=false` → no approval items, always hours mode
- [ ] Write tests for `isManager=true, urgency='critical', pendingCount=0` → hours mode (no pending)
- [ ] Write tests that deadline past (deadline < Date.now()) → shows `'Due now'`

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching `WidgetData` interface
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Helper Functions
- [ ] Export `buildMeshSvg(urgency: WidgetUrgency, paceBadge: string): string` — 360×200 SVG with 3 radial gradient nodes
- [ ] Export `badgeColor(paceBadge: string): string` — returns hex or `''` for 'none'
- [ ] Export `badgeLabel(paceBadge: string): string` — returns uppercase label or `''` for 'none'
- [ ] Export `deltaColor(delta: string): string` — `+`→green, `-`→amber, empty→transparent
- [ ] Export `blProgressBar(brainliftHours: number, targetHours: number, width: number): string` — inline SVG with violet fill, capped at 100%
- [ ] Remove old `URGENCY_BG` constant (no longer needed for backgrounds)

### FR2: SVG Mesh Background Layer
- [ ] Refactor `SmallWidget` root `FlexWidget`: add `position: 'relative'`, add `SvgWidget` as first child
- [ ] Refactor `MediumWidget` root `FlexWidget`: add `position: 'relative'`, add `SvgWidget` as first child
- [ ] Both widgets call `buildMeshSvg(data.urgency, data.paceBadge ?? 'none')` for SVG string
- [ ] Remove `URGENCY_BG` background from `SmallWidget` and `MediumWidget` roots

### FR3: Glass Panel Cards
- [ ] Wrap medium widget hours section in outer/inner `FlexWidget` glass panel (border `#2F2E41`, surface `#16151F`)
- [ ] Wrap medium widget earnings section in outer/inner `FlexWidget` glass panel
- [ ] Wrap small widget content in outer/inner `FlexWidget` glass panel

### FR4: Pace Badge
- [ ] Add pace badge rendering to `MediumWidget` hours mode (below the two hero panels, above stats row)
- [ ] Add pace badge rendering to `SmallWidget` (below hours hero, above hoursRemaining)
- [ ] Guard: render only when `paceBadge !== 'none'` and not undefined

### FR5: Trend Delta Text
- [ ] Add `weekDeltaHours` delta text to medium widget hours panel (sub-label below "this week")
- [ ] Add `weekDeltaEarnings` delta text to medium widget earnings panel (sub-label with arrow)
- [ ] Guard: render only when delta string is non-empty

### FR6: BrainLift Progress Bar
- [ ] Add BrainLift row (label + `SvgWidget` bar + text) to `MediumWidget` hours mode
- [ ] Parse `parseFloat(data.brainlift)` for numeric hours value
- [ ] Parse `parseFloat(data.brainliftTarget ?? '5h')` for target value
- [ ] Guard: handle `NaN` from malformed parse → treat as 0

### FR7: Manager Urgency Mode
- [ ] Replace `actionMode` check in `MediumWidget` with combined urgency mode + action mode logic
- [ ] Urgency mode: `isManager && (urgency === 'high' || urgency === 'critical') && pendingCount > 0`
- [ ] Urgency mode: render countdown hero with urgency accent color, seconday hours/earnings row, up to 2 approval items
- [ ] Compute countdown: `Math.max(0, Math.floor((data.deadline - Date.now()) / 3600000))` → `'{N}h left'` or `'Due now'`
- [ ] Non-urgency action mode: existing action mode behavior preserved

---

## Phase 1.2: Review (MANDATORY)

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
- [ ] Commit fixes: `fix(03-android-visual): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(03-android-visual): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns in `HourglassWidget.tsx`
- [ ] Brand compliance: no `#FFFFFF`, gold for earnings, cyan for AI%, violet for BrainLift

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-24**: Spec created. Blocked by 01-data-extensions (complete). Ready for implementation.
