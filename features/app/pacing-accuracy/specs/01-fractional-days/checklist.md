# Implementation Checklist

Spec: `01-fractional-days`
Feature: `pacing-accuracy`

---

## Phase 1.0: Test Foundation

### FR1: `computeDaysElapsed` returns fractional 0.0–5.0

- [x] Update `SC1.1` — Monday 08:00 now returns ≈ 0.333, not integer `1`
- [x] Update `SC1.3` — Tuesday 12:00 now returns ≈ 1.500, not integer `2`
- [x] Update `SC1.4` — Wednesday 12:00 now returns ≈ 2.500, not integer `3`
- [x] Update `SC1.5` — Thursday 09:00 now returns ≈ 3.375, not integer `4`
- [x] Update `SC1.9` — Monday 00:01 now returns ≈ 0.000694 (not integer `1`)
- [x] Update `SC1.10` — Monday 23:59:59 now returns ≈ 0.9999, not integer `1`
- [x] Add test: Monday 12:00 → ≈ 0.500 (±0.001)
- [x] Add test: Tuesday 07:00 → ≈ 1.292 (±0.001) — the original bug scenario
- [x] Add test: Wednesday 09:00 → ≈ 2.375 (±0.001)
- [x] Add test: Thursday 15:00 → ≈ 3.625 (±0.001)
- [x] Add test: Monday 00:00:00 → exactly 0.0 (preserved midnight edge case)
- [x] Verify: Friday (SC1.6) → still returns exactly 5.0 (no change)
- [x] Verify: Saturday (SC1.7) → still returns exactly 5.0 (no change)
- [x] Verify: Sunday (SC1.8) → still returns exactly 5.0 (no change)
- [x] Verify: no-argument call (SC1.11) → still returns number in [0, 5]

### FR2: `computePanelState` idle guard updated

- [x] Add test: `(0, 40, 0.333)` → `'idle'` (Monday 8am, nothing logged)
- [x] Add test: `(0, 40, 0.999)` → `'idle'` (Monday near-midnight, nothing logged)
- [x] Update test: `(0, 40, 0.0)` → `'idle'` (Monday midnight — was `daysElapsed=0`, same result)
- [x] Add test: `(5, 40, 0.0)` → `'onTrack'` (midnight with hours — zero-guard)
- [x] Add test: `(0, 40, 1.0)` → `'critical'` (Tuesday started, nothing logged)
- [x] Add test: `(0, 40, 1.292)` → `'critical'` (Tue 7am, nothing logged)
- [x] Add test: `(12, 40, 1.292)` → `'onTrack'` (116% — original bug case fixed)
- [x] Add test: `(8, 40, 1.292)` → `'behind'` (77% of 10.33h — spec comment was wrong, threshold math is authoritative)
- [x] Add test: `(5, 40, 1.292)` → `'critical'` (48% of 10.33h)
- [x] Update existing test: `'returns onTrack when daysElapsed=0 but some hours worked'` — passes via zero-guard

---

## Test Design Validation (MANDATORY)

WARNING: **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [x] Run `red-phase-test-validator` agent (manual gate check — tool unavailable)
- [x] All FR success criteria have test coverage
- [x] Assertions are specific (not just "exists" or "doesn't throw")
- [x] Fractional assertions use `toBeCloseTo` with appropriate precision (±0.001)
- [x] Updated integer tests correctly assert the new float values
- [x] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: `computeDaysElapsed` returns fractional 0.0–5.0

- [x] Remove Thursday branch (`if (day === 4) return 4`)
- [x] Remove Wednesday branch (`if (day === 3) return 3`)
- [x] Remove Tuesday branch (`if (day === 2) return 2`)
- [x] Remove Monday midnight special-case (`if (d.getHours() === 0 && ...)`)
- [x] Remove `return 1` (old Monday fallthrough)
- [x] Add Friday branch: `if (day === 5) return 5`
- [x] Add fractional formula for Mon–Thu: `dayIndex = day - 1; hourOfDay = hours + mins/60 + secs/3600; return dayIndex + hourOfDay/24`
- [x] Update `computeDaysElapsed` JSDoc: change "0–5" to "0.0–5.0", update param/return descriptions, remove integer examples, add fractional examples

### FR2: `computePanelState` idle guard updated

- [x] Replace `if (days === 0 && hours === 0) return 'idle'` with `if (days < 1 && hours === 0) return 'idle'`
- [x] Replace `if (days === 0) return 'onTrack'` with: move `expectedHours` computation up, add `if (expectedHours === 0) return 'onTrack'`
- [x] Ensure `const pacingRatio = hours / expectedHours` follows after the zero guard (no division by zero possible)
- [x] Update `computePanelState` JSDoc `@param daysElapsed` to note fractional values accepted

---

## Phase 1.2: Review (MANDATORY)

WARNING: **DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [x] Run `spec-implementation-alignment` agent (manual — tool unavailable, reviewed against spec directly)
- [x] All FR1 success criteria verified: fractional outputs match table in spec
- [x] All FR2 success criteria verified: idle/critical/onTrack states match table
- [x] No scope creep (no other functions modified)
- [x] Interface contracts match implementation (signature unchanged)

### Step 1: Comprehensive PR Review
- [x] Run `pr-review-toolkit:review-pr` skill (review-pr skill used; gh not available — manual multi-angle review performed)

### Step 2: Address Feedback
- [x] Fix HIGH severity issues (critical) — none found
- [x] Fix MEDIUM severity issues — FR2.8 test name/comment cleanup committed
- [x] Re-run tests after fixes — 52/52 passing
- [x] Commit fixes: `fix(01-fractional-days): clean up FR2.8 test name and comment`

### Step 3: Test Quality Optimization
- [x] Run `test-optimiser` agent on modified tests (manual review — tool unavailable)
- [x] Apply suggested improvements that strengthen confidence — no changes needed; tests are strong
- [x] Re-run tests to confirm passing — 52/52
- [x] Commit if changes made — no changes needed

### Final Verification
- [x] All tests passing
- [x] No regressions in existing tests
- [x] Code follows existing patterns in `panelState.ts`

---

## Session Notes

**2026-03-17**: Implementation complete.
- Phase 1.0: 1 test commit (test(FR1+FR2)) — 12 new/updated tests, 12 failing red phase
- Phase 1.1: 1 implementation commit (feat(FR1+FR2)) — all 52 tests green
- Phase 1.2: 1 fix commit — FR2.8 test name/comment cleanup; no logic issues found
- Spec note: spec-research FR2.8 comment said "onTrack" but 77% pace is correctly `'behind'` per thresholds; test asserts the correct value
- All tests passing (52/52).
