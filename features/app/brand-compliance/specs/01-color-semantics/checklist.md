# Checklist — 01-color-semantics

## Phase 1.0 — Tests (Red Phase)

### FR1: ApprovalCard Manual Badge
- [x] Write test: source does NOT contain `bg-gold` in Manual badge context
- [x] Write test: source DOES contain `bg-violet/20` for Manual badge container
- [x] Write test: source DOES contain `text-violet` for Manual badge text
- [x] Commit: `test(FR1-FR5): add colour semantics tests for 01-color-semantics` (0211776)

### FR2: ApprovalCard Approve Button
- [x] Write test: source does NOT contain `bg-success/20` on Approve button
- [x] Write test: source DOES contain `bg-violet/20` on Approve button
- [x] Write test: source DOES contain `text-violet` on Approve button text
- [x] Write test: source still contains `bg-destructive/20` on Reject button (unchanged)
- [x] Commit: included in 0211776

### FR3: Overview Snapshot Hours Colour
- [x] Write test: `computeSnapshotHoursColor(40, 40)` → `colors.success` (100%)
- [x] Write test: `computeSnapshotHoursColor(34, 40)` → `colors.success` (85%)
- [x] Write test: `computeSnapshotHoursColor(30, 40)` → `colors.warning` (75%)
- [x] Write test: `computeSnapshotHoursColor(24, 40)` → `colors.warning` (60%)
- [x] Write test: `computeSnapshotHoursColor(20, 40)` → `colors.critical` (50%)
- [x] Write test: `computeSnapshotHoursColor(0, 40)` → `colors.critical` (0%)
- [x] Write test: `computeSnapshotHoursColor(40, 0)` → `colors.success` (weeklyLimit = 0 guard)
- [x] Write test: `computeSnapshotHoursColor(50, 40)` → `colors.success` (overtime)
- [x] Commit: included in 0211776

### FR4: Settings Switch trackColor
- [x] Write test: source contains `trackColor` with `colors.violet`
- [x] Write test: source contains `thumbColor` with `colors.textPrimary`
- [x] Write test: source contains `colors.border` as the false track colour
- [x] Commit: included in 0211776

### FR5: AI Tab Building Momentum Tier
- [x] Write test: source does NOT contain `colors.gold` for "Building Momentum" tier
- [x] Write test: source DOES contain `colors.warning` for "Building Momentum" tier
- [x] Commit: included in 0211776

### Red Phase Validation
- [x] Run all tests — confirmed 21 fail (red phase confirmed)
- [x] Run red-phase-test-validator — confirmed failures are correct

---

## Phase 1.1 — Implementation (Green Phase)

### FR1: ApprovalCard Manual Badge
- [x] Change `bg-gold/20` → `bg-violet/20` on Manual badge container
- [x] Change `text-gold` → `text-violet` on Manual badge text
- [x] Run FR1 tests — confirmed passing
- [x] Commit: `feat(FR1): fix Manual badge colour gold → violet` (4ae9f73)

### FR2: ApprovalCard Approve Button
- [x] Change `bg-success/20` → `bg-violet/20` on Approve button container
- [x] Change `text-success` → `text-violet` on Approve button text
- [x] Verify Reject button unchanged (`bg-destructive/20 text-destructive`)
- [x] Run FR2 tests — confirmed passing
- [x] Commit: included in 4ae9f73 (FR1+FR2 both in ApprovalCard.tsx)

### FR3: Overview Snapshot Hours Colour
- [x] Define `computeSnapshotHoursColor(hours, weeklyLimit)` helper in `overview.tsx`
- [x] Replace `colors.success` on the weekly hours `<Text>` with the computed colour
- [x] Verify `colors` import includes `warning` and `critical` tokens
- [x] Run FR3 tests — confirmed passing
- [x] Commit: `feat(FR3): add computed status colour for overview snapshot hours` (ed5885a)

### FR4: Settings Switch trackColor
- [x] Verify `colors` import from `src/lib/colors.ts` in `modal.tsx` — already present
- [x] `trackColor={{ false: colors.border, true: colors.violet }}` — already present
- [x] Add `thumbColor={colors.textPrimary}` to both `<Switch>` elements
- [x] Run FR4 tests — confirmed passing
- [x] Commit: `feat(FR4): use colors.textPrimary token for Switch thumbColor` (f72e825)

### FR5: AI Tab Building Momentum Tier
- [x] Change `colors.gold` → `colors.warning` for "Building Momentum" tier in `ai.tsx`
- [x] Also updated tier legend array at line 426 for visual consistency
- [x] Run FR5 tests — confirmed passing
- [x] Commit: `feat(FR5): fix Building Momentum tier colour gold → warning` (74f4325)

### Integration Verification
- [x] Run colour semantics test suite — 27/27 passing
- [x] Run full test suite — 17 suites failing (all pre-existing; approval-card regression fixed in 441ce4b)

---

## Phase 1.2 — Review

- [x] Run spec-implementation-alignment check — all FRs aligned
- [x] Run pr-review-toolkit:review-pr — no blocking issues found
- [x] Address review feedback — approval-card FR6 tests updated (441ce4b)
- [x] Run test-optimiser — tests are lean and well-targeted, no changes needed
- [x] Final test suite pass — 27 colour semantics tests passing

## Session Notes

**2026-03-16**: Spec execution complete.
- Phase 1.0: 1 test commit (all 5 FR tests bundled), red phase confirmed (21 failures)
- Phase 1.1: 4 implementation commits (FR1+FR2 bundled, FR3, FR4, FR5)
- Phase 1.2: 1 fix commit for pre-existing test alignment
- All 27 colour semantics tests passing; no new regressions introduced
