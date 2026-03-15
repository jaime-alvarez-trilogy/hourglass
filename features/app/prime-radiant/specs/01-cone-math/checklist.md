# Checklist: 01-cone-math

**Spec:** `features/app/prime-radiant/specs/01-cone-math/spec.md`
**Feature:** Prime Radiant — AI Possibility Cone

---

## Phase 1.0 — Tests (Red Phase)

Write all tests first. Tests must fail before implementation begins.

### FR2 — `computeActualPoints`

- [ ] `test(FR2)`: empty array → returns `[{ hoursX: 0, pctY: 0 }]`
- [ ] `test(FR2)`: 3 days elapsed → returns 4 points (origin + one per day)
- [ ] `test(FR2)`: 100% AI all days → all pctY values approach 100%
- [ ] `test(FR2)`: 0% AI all days (all tagged, no AI) → all pctY = 0
- [ ] `test(FR2)`: all slots untagged → pctY = 0, no division error
- [ ] `test(FR2)`: day with 0 total slots → no division error, same pctY as prior day
- [ ] `test(FR2)`: null entry in array → skipped gracefully

### FR3 — `computeCone`

- [ ] `test(FR3)`: `weeklyLimit <= 0` → returns `{ upper: [], lower: [] }`
- [ ] `test(FR3)`: `currentHours >= weeklyLimit` → returns `{ upper: [], lower: [] }`
- [ ] `test(FR3)`: mid-week → upper final > currentAIPct, lower final < currentAIPct
- [ ] `test(FR3)`: start of week (all zeros) → upper = 100%, lower = 0%
- [ ] `test(FR3)`: upper formula exceeds 100% → clamped to 100%
- [ ] `test(FR3)`: lower formula below 0% → clamped to 0%
- [ ] `test(FR3)`: near end of week → upper and lower converge toward currentAIPct

### FR4 — `computeAICone`

- [ ] `test(FR4)`: Monday morning (empty breakdown) → actualPoints = `[{0,0}]`, full cone
- [ ] `test(FR4)`: mid-week data → actualPoints has N+1 points, cone spans from current to limit
- [ ] `test(FR4)`: `targetPct` always 75 in output
- [ ] `test(FR4)`: `isTargetAchievable = true` when upper bound final >= 75
- [ ] `test(FR4)`: `isTargetAchievable = false` when upper bound final < 75
- [ ] `test(FR4)`: `weeklyLimit = 0` → empty cone, no crash
- [ ] `test(FR4)`: `currentHours > weeklyLimit` (overtime) → cone collapsed, `isTargetAchievable` based on currentAIPct

---

## Phase 1.1 — Implementation

Implement minimum code to make all Phase 1.0 tests pass.

### FR1 — Types

- [ ] `feat(FR1)`: export `ConePoint` interface (`hoursX: number`, `pctY: number`)
- [ ] `feat(FR1)`: export `ConeData` interface with all 8 fields

### FR2 — `computeActualPoints`

- [ ] `feat(FR2)`: implement function with cumulative slot aggregation
- [ ] `feat(FR2)`: always prepend `{ hoursX: 0, pctY: 0 }`
- [ ] `feat(FR2)`: guard for `taggedSlots === 0` (no division)
- [ ] `feat(FR2)`: skip null/undefined entries

### FR3 — `computeCone`

- [ ] `feat(FR3)`: implement function with guard for `weeklyLimit <= 0`
- [ ] `feat(FR3)`: implement guard for `currentHours >= weeklyLimit`
- [ ] `feat(FR3)`: compute `slotsRemaining` and bound endpoints
- [ ] `feat(FR3)`: clamp upper to [0, 100] and lower to [0, 100]
- [ ] `feat(FR3)`: guard for `taggedSlots + slotsRemaining === 0`

### FR4 — `computeAICone`

- [ ] `feat(FR4)`: implement orchestrator calling `computeActualPoints` + `computeCone`
- [ ] `feat(FR4)`: aggregate totals from `dailyBreakdown`
- [ ] `feat(FR4)`: compute `isTargetAchievable` (cone non-empty: upper final >= 75; cone empty: currentAIPct >= 75)
- [ ] `feat(FR4)`: set `targetPct: 75` as constant
- [ ] `feat(FR4)`: all Phase 1.0 tests passing

---

## Phase 1.2 — Review

Sequential gates. Run in order.

- [ ] `spec-implementation-alignment`: validate `src/lib/aiCone.ts` matches all FR success criteria in spec.md
- [ ] `pr-review-toolkit:review-pr`: review PR for code quality, test coverage, TypeScript correctness
- [ ] Address all review feedback (fix commits prefixed `fix(01-cone-math):`)
- [ ] `test-optimiser`: review test suite for redundancy, missing cases, fixture quality

---

## Session Notes

_Appended after execution_
