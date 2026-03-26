# Checklist: 01-ios-hud-layout

## Phase 1.0 — Tests (write first, must fail before implementation)

### FR1 — getPriority helper

- [x] `test(FR1)` — SC1.1: isManager=true, pendingCount=3 → 'approvals'
- [x] `test(FR1)` — SC1.2: isManager=false, paceBadge='critical' → 'deficit'
- [x] `test(FR1)` — SC1.3: isManager=false, paceBadge='behind' → 'deficit'
- [x] `test(FR1)` — SC1.4: isManager=false, paceBadge='on_track' → 'default'
- [x] `test(FR1)` — SC1.5: paceBadge='crushed_it' → 'default'
- [x] `test(FR1)` — SC1.6: paceBadge='none' → 'default'
- [x] `test(FR1)` — SC1.7: isManager=true, pendingCount=3, paceBadge='critical' → 'approvals' (P1 beats P2)
- [x] `test(FR1)` — SC1.8: isManager=true, pendingCount=0, paceBadge='behind' → 'deficit'

### FR2 — SmallWidget hero font

- [x] `test(FR2)` — SC2.1: hero Text font.weight === 'heavy'
- [x] `test(FR2)` — SC2.2: hero Text font.design === 'monospaced'
- [x] `test(FR2)` — SC2.3: SmallWidget still renders hoursDisplay text
- [x] `test(FR2)` — SC2.4: SmallWidget shows pace badge text when paceBadge is in PACE_LABELS
- [x] `test(FR2)` — SC2.5: SmallWidget shows manager pending badge when isManager=true, pendingCount > 0

### FR3 — MediumWidget priority layouts

- [x] `test(FR3)` — SC3.1: P1 renders pendingCount text
- [x] `test(FR3)` — SC3.2: P1 renders up to 2 approvalItem names
- [x] `test(FR3)` — SC3.3: P1 does NOT render props.earnings text
- [x] `test(FR3)` — SC3.4: P1 does NOT render props.aiPct text
- [x] `test(FR3)` — SC3.5: P2 renders props.hoursDisplay text
- [x] `test(FR3)` — SC3.6: P2 renders props.hoursRemaining text
- [x] `test(FR3)` — SC3.7: P2 does NOT render props.earnings text
- [x] `test(FR3)` — SC3.8: P2 does NOT render props.aiPct text
- [x] `test(FR3)` — SC3.9: P3 renders two RoundedRectangle glass cards
- [x] `test(FR3)` — SC3.10: P3 today row contains todayDelta when non-empty
- [x] `test(FR3)` — SC3.11: P3 today row falls back to props.today when todayDelta is ""

### FR4 — LargeWidget priority layouts + bottom padding

- [x] `test(FR4)` — SC4.1: outer VStack bottom padding equals 28
- [x] `test(FR4)` — SC4.2: P1 renders up to 3 approvalItem names
- [x] `test(FR4)` — SC4.3: P1 does NOT render bar chart day labels
- [x] `test(FR4)` — SC4.4: P2 renders props.hoursRemaining text
- [x] `test(FR4)` — SC4.5: P2 does NOT render bar chart day labels
- [x] `test(FR4)` — SC4.6: P3 renders bar chart with 7 day-label Text nodes
- [x] `test(FR4)` — SC4.7: hero font in P2/P3 has weight 'heavy' and design 'monospaced'

### FR5 — Today row todayDelta fallback

- [x] `test(FR5)` — SC5.1: MediumWidget P3 today row includes todayDelta when non-empty
- [x] `test(FR5)` — SC5.2: MediumWidget P3 today row shows props.today when todayDelta is ""
- [x] `test(FR5)` — SC5.3: LargeWidget P3 today row includes todayDelta when non-empty
- [x] `test(FR5)` — SC5.4: LargeWidget P3 today row shows props.today when todayDelta is ""

---

## Phase 1.1 — Implementation

### FR1 — getPriority helper

- [x] `feat(FR1)` — Add `getPriority(props: WidgetData)` pure function after colour constants in `HourglassWidget.tsx`
- [x] `feat(FR1)` — Verify all 8 FR1 test cases pass

### FR2 — SmallWidget hero font

- [x] `feat(FR2)` — Change hero Text `font` in SmallWidget from `{ size: 28, weight: 'bold' }` to `{ size: 28, weight: 'heavy', design: 'monospaced' }`
- [x] `feat(FR2)` — Verify FR2 tests pass; existing FR3.1/FR3.2 SmallWidget tests still pass

### FR3 — MediumWidget priority layouts

- [x] `feat(FR3)` — Add `const priority = getPriority(props)` at top of MediumWidget render
- [x] `feat(FR3)` — Implement P1 layout block (PENDING APPROVALS header + items)
- [x] `feat(FR3)` — Implement P2 layout block (deficit warning + hero + hoursRemaining)
- [x] `feat(FR3)` — Implement P3 layout block (glass cards + todayDelta bottom row)
- [x] `feat(FR3)` — Update P1 background tint to `#FF6B0020`
- [x] `feat(FR3)` — Verify all FR3 tests pass

### FR4 — LargeWidget priority layouts + bottom padding

- [x] `feat(FR4)` — Change outer VStack padding from `padding={16}` to `padding={{ top: 16, leading: 16, trailing: 16, bottom: 28 }}`
- [x] `feat(FR4)` — Add `const priority = getPriority(props)` at top of LargeWidget render
- [x] `feat(FR4)` — Implement P1 layout block (up to 3 approvalItems, no bar chart)
- [x] `feat(FR4)` — Implement P2 layout block (deficit warning, no bar chart)
- [x] `feat(FR4)` — Implement P3 layout block (glass cards + IosBarChart + todayDelta)
- [x] `feat(FR4)` — Verify all FR4 tests pass

### FR5 — Today row todayDelta fallback

- [x] `feat(FR5)` — Update MediumWidget P3 today text: `props.todayDelta || props.today`
- [x] `feat(FR5)` — Update LargeWidget P3 today text: `props.todayDelta || props.today`
- [x] `feat(FR5)` — Verify FR5 tests pass

---

## Phase 1.2 — Review

- [x] Run `spec-implementation-alignment` to verify all FRs are implemented per spec
- [x] Run `pr-review-toolkit:review-pr` for code review (manual review — skill unavailable)
- [x] Address any review feedback (no issues found)
- [x] Run `test-optimiser` to check for redundant/weak tests (manual review — tests are strong)
- [x] Run full test suite: `cd hourglassws && npx jest src/__tests__/widgets/widgetVisualIos.test.ts --no-coverage`
- [x] Confirm all existing FR1–FR4 tests from `01-widget-visual-ios` still pass (no regressions)

---

## Session Notes

**2026-03-26**: Implementation complete.
- Phase 1.0: 1 test commit (test(FR1-FR5)) — 36 new tests added, all red as expected; 30 existing tests continued passing
- Phase 1.1: 1 implementation commit (feat(FR1-FR5)) — all 66 tests green
- Phase 1.2: Spec-implementation alignment PASS; manual code review PASS; no issues found; no fix commits needed
- All tests passing: 66/66
- Note: `item.type` in spec was a typo — `WidgetApprovalItem` uses `category` field; corrected in implementation
