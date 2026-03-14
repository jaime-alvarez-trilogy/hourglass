# 02-panel-state

**Status:** Draft
**Created:** 2026-03-14
**Last Updated:** 2026-03-14
**Owner:** @trilogy

---

## Overview

### What Is Being Built

A pure TypeScript utility function `computePanelState` that maps a contractor's current week progress (hours worked, weekly limit, days elapsed) to one of five Hourglass panel states: `onTrack`, `behind`, `critical`, `crushedIt`, or `idle`.

### Why It Exists

The design system's `PanelGradient` component (spec 03) and the Hours Dashboard (spec 05) both need to know which visual state to render. Without a canonical source of truth for this logic, each consumer would re-implement its own threshold checks — leading to divergence. This spec centralises that logic in `src/lib/panelState.ts`.

### How It Works

The function applies a pacing formula:

```
expectedHours = (clamp(daysElapsed, 0, 5) / 5) × weeklyLimit
pacingRatio   = hoursWorked / expectedHours
```

States are assigned in priority order:

1. **idle** — `weeklyLimit <= 0` OR `(daysElapsed === 0 && hoursWorked === 0)`
2. **crushedIt** — `hoursWorked >= weeklyLimit`
3. **onTrack** — `daysElapsed === 0 && hoursWorked > 0` (early work counts as ahead), OR `pacingRatio >= PACING_ON_TRACK_THRESHOLD` (0.85)
4. **behind** — `pacingRatio >= PACING_BEHIND_THRESHOLD` (0.60)
5. **critical** — all other cases

The function is a pure function with no side effects and no external dependencies.

### Scope

This spec covers only the utility function and its unit tests. It does NOT implement any UI, animation, or component. Consumers (PanelGradient, Hours Dashboard) are covered in specs 03 and 05.

---

## Out of Scope

1. **PanelGradient UI component** — Deferred to 03-base-components: the visual rendering of panel states is covered in spec 03-base-components, which consumes `computePanelState` as an input.

2. **Hours Dashboard integration** — Deferred to 05-hours-dashboard: wiring `computePanelState` into the dashboard screen is covered in spec 05-hours-dashboard.

3. **UrgencyLevel / deadline countdown logic** — Descoped: `UrgencyLevel` already exists in `src/lib/hours.ts` and serves a different purpose (deadline proximity styling). This spec does not modify or replace it.

4. **daysElapsed computation from the system clock** — Descoped: the caller is responsible for computing `daysElapsed` from the current date. This spec only defines the pure mapping function. A helper for date→daysElapsed may be added in spec 05-hours-dashboard if needed.

5. **Persistence or caching of panel state** — Descoped: `computePanelState` is a pure function. Caching or memoisation is the responsibility of the calling component.

6. **Manager-side panel states** — Descoped: the panel state system is for contributor weekly pacing only. Manager approval views have their own visual logic not covered here.

---

## Functional Requirements

### FR1: Implement `computePanelState` with 5 state outputs

**Description:** Create `src/lib/panelState.ts` exporting `computePanelState(hoursWorked, weeklyLimit, daysElapsed): PanelState`. The function must return one of the five states based on the pacing formula.

**Logic (in priority order):**
1. If `weeklyLimit <= 0` → return `"idle"`
2. Clamp `daysElapsed` to `[0, 5]`
3. Clamp `hoursWorked` to `[0, ∞)` (guard against negatives)
4. If `hoursWorked >= weeklyLimit` → return `"crushedIt"`
5. If `daysElapsed === 0 && hoursWorked === 0` → return `"idle"`
6. If `daysElapsed === 0 && hoursWorked > 0` → return `"onTrack"` (early work is positive)
7. Compute `expectedHours = (daysElapsed / 5) × weeklyLimit`
8. Compute `pacingRatio = hoursWorked / expectedHours`
9. If `pacingRatio >= PACING_ON_TRACK_THRESHOLD` → return `"onTrack"`
10. If `pacingRatio >= PACING_BEHIND_THRESHOLD` → return `"behind"`
11. Otherwise → return `"critical"`

**Success Criteria:**
- `computePanelState(0, 40, 0)` returns `"idle"`
- `computePanelState(20, 40, 2)` returns `"onTrack"` (2/5×40=16, 20/16=1.25 ≥ 0.85)
- `computePanelState(20, 40, 3)` returns `"behind"` (3/5×40=24, 20/24=0.833 < 0.85, ≥ 0.60)
- `computePanelState(30, 40, 4)` returns `"onTrack"` (4/5×40=32, 30/32=0.9375 ≥ 0.85)
- `computePanelState(40, 40, 5)` returns `"crushedIt"`
- `computePanelState(42, 40, 5)` returns `"crushedIt"`
- `computePanelState(10, 40, 2)` returns `"behind"` (10/16=0.625 ≥ 0.60)
- `computePanelState(5, 40, 2)` returns `"critical"` (5/16=0.3125 < 0.60)
- Function is exported from `src/lib/panelState.ts`

---

### FR2: Export `PACING_ON_TRACK_THRESHOLD` and `PACING_BEHIND_THRESHOLD` constants

**Description:** Export two named numeric constants from `panelState.ts` so callers can reference the thresholds (e.g. for progress bar rendering) without hardcoding magic numbers.

```typescript
export const PACING_ON_TRACK_THRESHOLD = 0.85;
export const PACING_BEHIND_THRESHOLD = 0.60;
```

**Success Criteria:**
- Both constants exported as named exports from `src/lib/panelState.ts`
- `computePanelState` uses these constants internally (not inline literals)
- Boundary: `pacingRatio === 0.85` → `"onTrack"` (inclusive)
- Boundary: `pacingRatio === 0.60` → `"behind"` (inclusive)
- Boundary: `pacingRatio === 0.84` → `"behind"`
- Boundary: `pacingRatio === 0.59` → `"critical"`

---

### FR3: Handle edge cases — zero limit, zero days, over-limit hours, daysElapsed > 5

**Description:** The function must not throw or return unexpected values for any numeric input combination.

**Edge cases handled:**
- `weeklyLimit = 0` → `"idle"` (avoids division by zero)
- `weeklyLimit < 0` → `"idle"` (treat same as zero)
- `daysElapsed = 0, hoursWorked = 0` → `"idle"`
- `daysElapsed = 0, hoursWorked > 0` → `"onTrack"` (early work is positive)
- `daysElapsed > 5` → clamp to 5
- `daysElapsed < 0` → clamp to 0 (treat as Monday morning)
- `hoursWorked < 0` → treat as 0

**Success Criteria:**
- `computePanelState(0, 0, 3)` returns `"idle"`
- `computePanelState(5, 40, 0)` returns `"onTrack"`
- `computePanelState(40, 40, 7)` returns `"crushedIt"` (daysElapsed clamped to 5)
- `computePanelState(-1, 40, 3)` returns `"critical"` (hoursWorked treated as 0, 0/24=0 < 0.60)
- No runtime exceptions for any numeric input

---

### FR4: Unit tests covering all 5 states + boundary + edge cases

**Description:** Create `src/lib/__tests__/panelState.test.ts` with Jest tests covering every case from the test plan in spec-research.md.

**Test file location:** `hourglassws/src/lib/__tests__/panelState.test.ts`

**Success Criteria:**
- All happy path cases from spec-research.md covered (7 cases mapping to all 5 states)
- All edge cases covered (5 cases)
- All threshold boundary cases covered (4 cases)
- Tests run with `npx jest panelState` from `hourglassws/` and pass
- No mocks required (pure function)
- Tests are grouped in `describe` blocks by category: `'happy path'`, `'edge cases'`, `'threshold boundaries'`

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/lib/reanimated-presets.ts` | Source of `PanelState` type (line 170) — import from here |
| `hourglassws/src/lib/hours.ts` | Pattern to follow for pure lib functions + `UrgencyLevel` precedent |
| `hourglassws/BRAND_GUIDELINES.md` | Canonical definitions of the five panel states |

### Files to Create

| File | Description |
|------|-------------|
| `hourglassws/src/lib/panelState.ts` | New file — exports `computePanelState`, `PACING_ON_TRACK_THRESHOLD`, `PACING_BEHIND_THRESHOLD`, re-exports `PanelState` |
| `hourglassws/src/lib/__tests__/panelState.test.ts` | Unit tests — pure Jest, no mocks |

### Files to Modify

None. This spec introduces new files only. `reanimated-presets.ts` and `hours.ts` are read-only for this spec.

### Data Flow

```
Caller (spec 03 PanelGradient / spec 05 Hours Dashboard)
  │
  ├── hoursWorked  ← calculateHours().total  (src/lib/hours.ts)
  ├── weeklyLimit  ← config.weeklyHours      (AsyncStorage config store)
  └── daysElapsed  ← derived from new Date() by caller
         │
         ▼
computePanelState(hoursWorked, weeklyLimit, daysElapsed)
         │
         ▼
PanelState: "onTrack" | "behind" | "critical" | "crushedIt" | "idle"
         │
         ▼
PanelGradient renders gradient color (spec 03)
Hours Dashboard renders hero panel (spec 05)
```

### Implementation Sketch

```typescript
// src/lib/panelState.ts

import type { PanelState } from './reanimated-presets';
export type { PanelState };

/** Fraction of expected pace considered "on track" (within 15% of pace) */
export const PACING_ON_TRACK_THRESHOLD = 0.85;
/** Fraction of expected pace considered "recoverable behind" */
export const PACING_BEHIND_THRESHOLD = 0.60;

/**
 * Computes which of the 5 Hourglass panel states applies to the current week.
 *
 * @param hoursWorked  - Hours logged so far this week (e.g. 28.5)
 * @param weeklyLimit  - Contractual weekly hour target (e.g. 40)
 * @param daysElapsed  - Work days elapsed Mon–Fri (0=Monday morning, 5=Friday EOD+)
 *
 * @returns PanelState — one of onTrack | behind | critical | crushedIt | idle
 */
export function computePanelState(
  hoursWorked: number,
  weeklyLimit: number,
  daysElapsed: number
): PanelState {
  // Guard: invalid limit
  if (weeklyLimit <= 0) return 'idle';

  // Clamp inputs
  const days = Math.max(0, Math.min(5, daysElapsed));
  const hours = Math.max(0, hoursWorked);

  // Already hit the target
  if (hours >= weeklyLimit) return 'crushedIt';

  // No hours and no days elapsed → fresh week
  if (days === 0 && hours === 0) return 'idle';

  // Hours worked before first day completed → ahead of pace
  if (days === 0) return 'onTrack';

  const expectedHours = (days / 5) * weeklyLimit;
  const pacingRatio = hours / expectedHours;

  if (pacingRatio >= PACING_ON_TRACK_THRESHOLD) return 'onTrack';
  if (pacingRatio >= PACING_BEHIND_THRESHOLD) return 'behind';
  return 'critical';
}
```

Estimated size: ~50 lines including JSDoc.

### Edge Cases Summary

| Input | Reason | Expected Output |
|-------|--------|-----------------|
| `weeklyLimit = 0` | Division by zero risk | `"idle"` |
| `daysElapsed = 0, hours = 0` | Monday morning, clean slate | `"idle"` |
| `daysElapsed = 0, hours > 0` | Pre-Monday overtime; treat as ahead | `"onTrack"` |
| `daysElapsed > 5` | Weekend / data anomaly | Clamped to 5 |
| `hoursWorked < 0` | API data error | Clamped to 0 |
| `hoursWorked >= weeklyLimit` | Goal reached early | `"crushedIt"` |

### TypeScript Notes

- Import `PanelState` from `./reanimated-presets` using `import type` (type-only import, no runtime overhead).
- Re-export `PanelState` from `panelState.ts` so consumers can import type + function from one module.
- No `any` types. All parameters are `number`, return is `PanelState`.
- File must pass strict TypeScript (`"strict": true` in `tsconfig.json`).

### Test Structure

```
describe('computePanelState', () => {
  describe('happy path — five states', () => { ... })
  describe('edge cases', () => { ... })
  describe('threshold boundaries', () => { ... })
})
```

No external mocks. Jest config already present in `hourglassws/package.json`.
