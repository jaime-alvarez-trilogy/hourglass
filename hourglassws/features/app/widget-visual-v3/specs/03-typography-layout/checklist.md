# Checklist: 03-typography-layout

## Phase 1.0 — Tests (Write First, Red Phase)

### FR1: Bridge "left left" bug fix
- [ ] Add test: given `hoursRemaining = "7.5h left"`, Android WIDGET_LAYOUT_JS output does NOT contain `"7.5h left left"`
- [ ] Add test: given `hoursRemaining = "7.5h left"`, Android WIDGET_LAYOUT_JS output contains `"7.5h left"` exactly once
- [ ] Add test: given `hoursRemaining = "2.5h OT"`, Android WIDGET_LAYOUT_JS output equals `"2.5h OT"` (no " left" appended)
- [ ] Confirm tests are in `src/widgets/__tests__/widgetLayoutJs.test.ts`
- [ ] Confirm tests FAIL (red phase) before implementation

### FR2: Remaining text under hours card
- [ ] Add test: hours `IosGlassCard` in P3 hero row contains `Text` with `font: { size: 11, weight: 'medium' }` and `foregroundStyle: '#94A3B8'`
- [ ] Add test: given `hoursRemaining = "7.5h left"`, the remaining text equals `"7.5h remaining"`
- [ ] Add test: given `hoursRemaining = "2.5h OT"`, the remaining text equals `"2.5h OT remaining"`
- [ ] Confirm tests are in `src/widgets/__tests__/widgetPolish.test.ts`
- [ ] Confirm tests FAIL (red phase) before implementation

### FR3: Earnings card in hero row
- [ ] Add test: hero HStack in P3 contains exactly two `IosGlassCard` children
- [ ] Add test: second card contains `Text` with `font: { size: 24, weight: 'bold' }` for earnings
- [ ] Add test: second card contains `Text` with `weight: 'medium'` and content `"EARNED"`
- [ ] Confirm tests FAIL (red phase) before implementation

### FR4: StatusPill text weight bold
- [ ] Add test: `StatusPill` tree contains `Text` with `font.weight === 'bold'`
- [ ] Add test: `StatusPill` tree contains NO `Text` with `font.weight === 'semibold'`
- [ ] Confirm tests FAIL (red phase) before implementation

### FR5: Footer row simplified
- [ ] Add test: footer `HStack` in P3 contains a `Text` with "Today:" in content
- [ ] Add test: footer text includes AI percentage indicator
- [ ] Add test: footer does NOT contain a separate `hoursRemaining` text element
- [ ] Confirm tests FAIL (red phase) before implementation

---

## Phase 1.1 — Implementation

### FR1: Fix bridge.ts "left left" bug
- [ ] Locate `WIDGET_LAYOUT_JS` string in `src/widgets/bridge.ts` (~line 812)
- [ ] Remove `+ ' left'` from the `Text` children concatenation
- [ ] Change to: `children: p.hoursRemaining` (no concatenation)
- [ ] Run FR1 tests — all pass

### FR2: Remaining text under hours card
- [ ] In `HourglassWidget.tsx` LargeWidget P3 branch, add secondary `Text` inside hours `IosGlassCard`
- [ ] Text props: `font: { size: 11, weight: 'medium' }`, `foregroundStyle: '#94A3B8'`
- [ ] Text content: `props.hoursRemaining.replace('left', '').trim() + ' remaining'`
- [ ] Run FR2 tests — all pass

### FR3: Earnings card in hero row
- [ ] Replace the right-side `VStack` in hero HStack with a second `IosGlassCard`
- [ ] Earnings card: `Text` with `font: { size: 24, weight: 'bold' }` for `props.earnings`
- [ ] Earnings card: `Text` with `weight: 'medium'` and content `"EARNED"`
- [ ] Run FR3 tests — all pass

### FR4: StatusPill text weight
- [ ] Locate `StatusPill` component in `HourglassWidget.tsx`
- [ ] Change `weight: 'semibold'` → `weight: 'bold'` in the Text element
- [ ] Run FR4 tests — all pass

### FR5: Footer row simplified
- [ ] Replace P3 footer HStack content with single `Text` combining today + AI percentage
- [ ] Footer format: `"Today: {props.today} • AI: {props.aiPct}"`
- [ ] Remove separate `hoursRemaining` text element from footer
- [ ] Update outer VStack padding from asymmetric to uniform 16pt
- [ ] Remove `ZStack` + `RoundedRectangle` wrapper from activity chart section
- [ ] Run FR5 tests — all pass

### Integration
- [ ] Run full test suite: `cd hourglassws && npx jest`
- [ ] All existing widget tests pass (no regressions in P1/P2 modes)
- [ ] No TypeScript errors

---

## Phase 1.2 — Review

- [ ] Run `spec-implementation-alignment` agent to verify alignment between spec.md and implementation
- [ ] Run `pr-review-toolkit:review-pr` for code review
- [ ] Address any review feedback
- [ ] Run `test-optimiser` to review test quality
- [ ] Final test suite run: all tests green
