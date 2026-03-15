# 01-cone-math: AI Possibility Cone Math

**Status:** Draft
**Created:** 2026-03-15
**Last Updated:** 2026-03-15
**Owner:** @trilogy

---

## Overview

### What Is Being Built

A pure TypeScript module (`src/lib/aiCone.ts`) that performs all cone math for the Prime Radiant visualization. It takes the current week's per-day AI tag data and a weekly hours limit, and returns a `ConeData` object containing everything a chart component needs to render:

1. **Actual trajectory** — cumulative AI% points for each day elapsed so far (starting from `(0, 0)`)
2. **Possibility cone** — two forward-looking curves (upper/lower bounds) from the current position to the weekly limit
3. **Derived scalars** — `currentHours`, `currentAIPct`, `weeklyLimit`, `targetPct`, `isTargetAchievable`

### How It Works

The module exports three pure functions:

| Function | Role |
|----------|------|
| `computeActualPoints` | Builds the historical trajectory from `DailyTagData[]`, always starting at `(0, 0)` |
| `computeCone` | Computes forward-looking upper and lower bound curves from the current position |
| `computeAICone` | Orchestrates the above two and assembles the full `ConeData` output |

All math is done internally in slots (1 slot = 10 min, 6 slots/hour) to avoid floating-point errors in ratio calculations. Conversion to hours happens only when building X-axis coordinates for output.

**AI% Formula (from MEMORY.md, validated across 4 weeks):**

```
aiPct = aiSlots / taggedSlots   where taggedSlots = totalSlots - noTagSlots
```

**Cone bounds formula:**

```
slotsRemaining = (weeklyLimit - hoursLogged) × 6

upper(end) = (aiSlots + slotsRemaining) / (taggedSlots + slotsRemaining)   // all remaining tagged as AI
lower(end) = aiSlots / (taggedSlots + slotsRemaining)                       // no more AI tagged
```

Both bounds are linear interpolations from `currentAIPct` at `currentHours` to their respective endpoints at `weeklyLimit`.

### No External Dependencies

This module has no React, no hooks, no AsyncStorage, no API calls. It is a pure computation layer that can be fully unit-tested with plain TypeScript fixtures.

---

## Out of Scope

1. **Chart rendering** — Deferred to `02-cone-chart`: `ConeData` is consumed by `AIConeChart`; this spec produces only the data, not the Skia drawing code.

2. **Animation logic** — Deferred to `02-cone-chart`: Reanimated shared values, timing curves, and reduced-motion handling are chart concerns.

3. **Screen integration** — Deferred to `03-ai-tab-integration`: Wiring `AIConeChart` into `app/(tabs)/ai.tsx` and `app/(tabs)/index.tsx` is out of scope here.

4. **Fetching work diary data** — **Descoped**: `DailyTagData[]` is already produced by `useAIData()` / `aggregateAICache()` in `src/lib/ai.ts`. This spec consumes that output; it does not change how it is fetched.

5. **Historical week-over-week trends** — **Descoped**: Not part of the Prime Radiant feature. Future analytics feature.

6. **User-configurable AI% target** — **Descoped**: `targetPct` is a constant 75. No config plumbing is needed.

7. **Sub-day (per-hour) trajectory interpolation** — **Descoped**: Work diary data is only available per-day. Fabricating intra-day points is out of scope.

---

## Functional Requirements

### FR1 — Types: `ConePoint` and `ConeData`

Define and export the two output types used throughout the Prime Radiant feature.

**`ConePoint`:**
- `hoursX: number` — X-axis position in hours (0 → weeklyLimit)
- `pctY: number` — Y-axis AI percentage (0 → 100)

**`ConeData`:**
- `actualPoints: ConePoint[]` — historical trajectory; always starts with `{ hoursX: 0, pctY: 0 }`
- `upperBound: ConePoint[]` — best-case cone from current position to weeklyLimit
- `lowerBound: ConePoint[]` — worst-case cone from current position to weeklyLimit
- `currentHours: number` — hours logged so far this week
- `currentAIPct: number` — AI% at this moment
- `weeklyLimit: number` — max hours from config
- `targetPct: number` — always 75
- `isTargetAchievable: boolean` — whether `upperBound`'s final `pctY >= 75`

**Success Criteria:**
- Both types are exported from `src/lib/aiCone.ts`
- `ConePoint` has exactly `hoursX` and `pctY` fields (both `number`)
- `ConeData` has all 8 fields listed above with correct types
- Types are importable without error from other modules

---

### FR2 — `computeActualPoints(dailyBreakdown: DailyTagData[]): ConePoint[]`

Build the historical trajectory from cumulative per-day data.

**Algorithm:**
1. Always return `[{ hoursX: 0, pctY: 0 }]` as the first point
2. For each day in `dailyBreakdown` (in order):
   - Skip null/undefined entries
   - Accumulate `totalSlots`, `aiSlots`, `noTagSlots` cumulatively
   - Compute `taggedSlots = totalSlots - noTagSlots`
   - Compute `aiPct = taggedSlots > 0 ? (aiSlots / taggedSlots) * 100 : 0`
   - Compute `hoursX = totalSlots * 10 / 60`
   - Append `{ hoursX, pctY: aiPct }`
3. Return the array

**Success Criteria:**
- Empty input → returns exactly `[{ hoursX: 0, pctY: 0 }]`
- 3-day input → returns 4 points (origin + one per day)
- All AI-tagged days → pctY approaches 100% (exact per formula)
- All untagged days → pctY = 0 at every point (no division by zero)
- Day with 0 total slots → included as a point with the same cumulative AI% as the prior day (no division by zero)
- Null entries in array → skipped gracefully, cumulative state unchanged

---

### FR3 — `computeCone(currentHours, currentAIPct, aiSlots, taggedSlots, weeklyLimit): { upper: ConePoint[], lower: ConePoint[] }`

Build the forward-looking cone from the current position to the end of the week.

**Algorithm:**
1. Guard: if `weeklyLimit <= 0` or `currentHours >= weeklyLimit`, return `{ upper: [], lower: [] }`
2. Compute `slotsRemaining = (weeklyLimit - currentHours) × 6`
3. Compute upper bound final: `(aiSlots + slotsRemaining) / (taggedSlots + slotsRemaining) × 100`, clamped to [0, 100]
4. Compute lower bound final: `aiSlots / (taggedSlots + slotsRemaining) × 100`, clamped to [0, 100]
5. Guard: if `taggedSlots + slotsRemaining === 0`, upper = 100, lower = 0
6. Return two-point arrays:
   - `upper: [{ hoursX: currentHours, pctY: currentAIPct }, { hoursX: weeklyLimit, pctY: upperFinal }]`
   - `lower: [{ hoursX: currentHours, pctY: currentAIPct }, { hoursX: weeklyLimit, pctY: lowerFinal }]`

**Success Criteria:**
- `weeklyLimit <= 0` → returns `{ upper: [], lower: [] }`
- `currentHours >= weeklyLimit` → returns `{ upper: [], lower: [] }`
- Mid-week position → upper final > currentAIPct (if current is not 100%), lower final < currentAIPct (if current is not 0%)
- Start of week (`currentHours = 0`, `aiSlots = 0`, `taggedSlots = 0`) → upper = 100%, lower = 0%
- Upper final clamped to 100% even if formula exceeds it
- Lower final clamped to 0%
- `currentHours` close to `weeklyLimit` → upper and lower converge toward `currentAIPct`

---

### FR4 — `computeAICone(dailyBreakdown: DailyTagData[], weeklyLimit: number): ConeData`

Orchestrate `computeActualPoints` and `computeCone` into a full `ConeData` object.

**Algorithm:**
1. Aggregate totals from `dailyBreakdown`: `totalSlots`, `aiSlots`, `noTagSlots`
2. Compute `taggedSlots = totalSlots - noTagSlots`
3. Compute `currentHours = totalSlots * 10 / 60`
4. Compute `currentAIPct = taggedSlots > 0 ? (aiSlots / taggedSlots) * 100 : 0`
5. Call `computeActualPoints(dailyBreakdown)` → `actualPoints`
6. Call `computeCone(currentHours, currentAIPct, aiSlots, taggedSlots, weeklyLimit)` → `{ upper, lower }`
7. Compute `isTargetAchievable`:
   - If cone is non-empty: `upper[upper.length - 1].pctY >= 75`
   - If cone is empty (week complete or no limit): `currentAIPct >= 75`
8. Return assembled `ConeData` with all 8 fields

**Success Criteria:**
- Monday morning (empty array) → `actualPoints = [{ hoursX: 0, pctY: 0 }]`, full-width cone (upper ≈ 100%, lower = 0%)
- `targetPct` is always 75 in output regardless of input
- `isTargetAchievable = true` when upper bound final pctY >= 75
- `isTargetAchievable = false` when upper bound final pctY < 75
- `weeklyLimit = 0` → safe output with empty cone, `isTargetAchievable` based on `currentAIPct`
- Overtime (`currentHours > weeklyLimit`) → cone collapsed to empty arrays, `isTargetAchievable` based on `currentAIPct`

---

## Technical Design

### Files to Reference

| File | Why |
|------|-----|
| `src/lib/ai.ts` | `DailyTagData` type definition; `countDiaryTags` / `aggregateAICache` patterns to follow |
| `src/lib/panelState.ts` | Style reference for pure computation functions |
| `src/lib/__tests__/panelState.test.ts` | Test structure and describe/it organization to mirror |

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/aiCone.ts` | `ConePoint`, `ConeData` types; `computeActualPoints`, `computeCone`, `computeAICone` functions |
| `src/lib/__tests__/aiCone.test.ts` | Unit tests for all three functions and both types |

No existing files are modified by this spec.

### Type Import

`DailyTagData` is imported from `src/lib/ai.ts` (not from a `types/` folder):

```typescript
import type { DailyTagData } from './ai';
```

### Data Flow

```
useAIData()
  └── data.dailyBreakdown: DailyTagData[]   ← input
        ├── .total       (slots per day)
        ├── .aiUsage     (AI-tagged slots)
        └── .noTags      (untagged slots)

useConfig()
  └── config.weeklyLimit: number             ← input

computeAICone(dailyBreakdown, weeklyLimit)
  ├── computeActualPoints(dailyBreakdown)    ← internal call
  ├── computeCone(...)                       ← internal call
  └── ConeData                               ← output to AIConeChart
```

### Internal Slot Math

All ratios computed in slots (integers). Hours conversion (`× 10 / 60`) happens only when setting `hoursX` on `ConePoint`.

```
slotsPerHour = 6           (10-min slots)
hoursX = slots * 10 / 60  (or equivalently slots / 6)
```

### Edge Case Handling

| Case | Guard |
|------|-------|
| `taggedSlots === 0` | Return `pctY: 0` — no division |
| `weeklyLimit <= 0` | Return empty cone arrays |
| `currentHours >= weeklyLimit` | Return empty cone arrays (week done) |
| Upper > 100% | `Math.min(100, ...)` clamp |
| Lower < 0% | `Math.max(0, ...)` clamp |
| Null entry in `dailyBreakdown` | Skip with `if (!entry) continue` |

### Test Fixture Helper

```typescript
const makeDay = (
  date: string,
  total: number,
  aiUsage: number,
  noTags: number,
  isToday = false,
): DailyTagData => ({ date, total, aiUsage, secondBrain: 0, noTags, isToday });
```

### Running Tests

```bash
cd /Users/Trilogy/Documents/Claude Code/WS/hourglassws
npx jest src/lib/__tests__/aiCone.test.ts --no-coverage
```
