# Checklist — 01-color-semantics

## Phase 1.0 — Tests (Red Phase)

### FR1: ApprovalCard Manual Badge
- [ ] Write test: source does NOT contain `bg-gold` in Manual badge context
- [ ] Write test: source DOES contain `bg-violet/20` for Manual badge container
- [ ] Write test: source DOES contain `text-violet` for Manual badge text
- [ ] Commit: `test(FR1): add ApprovalCard Manual badge colour assertions`

### FR2: ApprovalCard Approve Button
- [ ] Write test: source does NOT contain `bg-success/20` on Approve button
- [ ] Write test: source DOES contain `bg-violet/20` on Approve button
- [ ] Write test: source DOES contain `text-violet` on Approve button text
- [ ] Write test: source still contains `bg-destructive/20` on Reject button (unchanged)
- [ ] Commit: `test(FR2): add ApprovalCard Approve button colour assertions`

### FR3: Overview Snapshot Hours Colour
- [ ] Write test: `computeSnapshotHoursColor(40, 40)` → `colors.success` (100%)
- [ ] Write test: `computeSnapshotHoursColor(34, 40)` → `colors.success` (85%)
- [ ] Write test: `computeSnapshotHoursColor(30, 40)` → `colors.warning` (75%)
- [ ] Write test: `computeSnapshotHoursColor(24, 40)` → `colors.warning` (60%)
- [ ] Write test: `computeSnapshotHoursColor(20, 40)` → `colors.critical` (50%)
- [ ] Write test: `computeSnapshotHoursColor(0, 40)` → `colors.critical` (0%)
- [ ] Write test: `computeSnapshotHoursColor(40, 0)` → `colors.success` (weeklyLimit = 0 guard)
- [ ] Write test: `computeSnapshotHoursColor(50, 40)` → `colors.success` (overtime)
- [ ] Commit: `test(FR3): add computeSnapshotHoursColor unit tests`

### FR4: Settings Switch trackColor
- [ ] Write test: source contains `trackColor` with `colors.violet`
- [ ] Write test: source contains `thumbColor` with `colors.textPrimary`
- [ ] Write test: source contains `colors.border` as the false track colour
- [ ] Commit: `test(FR4): add modal Switch trackColor assertions`

### FR5: AI Tab Building Momentum Tier
- [ ] Write test: source does NOT contain `colors.gold` for "Building Momentum" tier
- [ ] Write test: source DOES contain `colors.warning` for "Building Momentum" tier
- [ ] Commit: `test(FR5): add AI tab Building Momentum colour assertion`

### Red Phase Validation
- [ ] Run all tests — confirm ALL fail (red phase confirmed)
- [ ] Run red-phase-test-validator

---

## Phase 1.1 — Implementation (Green Phase)

### FR1: ApprovalCard Manual Badge
- [ ] Change `bg-gold/20` → `bg-violet/20` on Manual badge container
- [ ] Change `text-gold` → `text-violet` on Manual badge text
- [ ] Run FR1 tests — confirm passing
- [ ] Commit: `feat(FR1): fix Manual badge colour gold → violet`

### FR2: ApprovalCard Approve Button
- [ ] Change `bg-success/20` → `bg-violet/20` on Approve button container
- [ ] Change `text-success` → `text-violet` on Approve button text
- [ ] Verify Reject button unchanged (`bg-destructive/20 text-destructive`)
- [ ] Run FR2 tests — confirm passing
- [ ] Commit: `feat(FR2): fix Approve button colour success → violet`

### FR3: Overview Snapshot Hours Colour
- [ ] Define `computeSnapshotHoursColor(hours, weeklyLimit)` helper in `overview.tsx`
- [ ] Replace `colors.success` on the weekly hours `<Text>` with the computed colour
- [ ] Verify `colors` import includes `warning` and `critical` tokens
- [ ] Run FR3 tests — confirm passing
- [ ] Commit: `feat(FR3): add computed status colour for overview snapshot hours`

### FR4: Settings Switch trackColor
- [ ] Verify or add `colors` import from `src/lib/colors.ts` in `modal.tsx`
- [ ] Add `trackColor={{ false: colors.border, true: colors.violet }}` to both `<Switch>` elements
- [ ] Add `thumbColor={colors.textPrimary}` to both `<Switch>` elements
- [ ] Run FR4 tests — confirm passing
- [ ] Commit: `feat(FR4): add violet trackColor to Settings switches`

### FR5: AI Tab Building Momentum Tier
- [ ] Change `colors.gold` → `colors.warning` for "Building Momentum" tier in `ai.tsx`
- [ ] Run FR5 tests — confirm passing
- [ ] Commit: `feat(FR5): fix Building Momentum tier colour gold → warning`

### Integration Verification
- [ ] Run full test suite: `cd hourglassws && npx jest --testPathPattern="colorSemantics|computeSnapshotHoursColor"`
- [ ] All tests pass

---

## Phase 1.2 — Review

- [ ] Run spec-implementation-alignment check
- [ ] Run pr-review-toolkit:review-pr
- [ ] Address any review feedback (commit with `fix(01-color-semantics): ...`)
- [ ] Run test-optimiser
- [ ] Final test suite pass — confirm green
