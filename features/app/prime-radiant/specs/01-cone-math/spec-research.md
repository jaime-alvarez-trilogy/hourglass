# Spec Research: Cone Math

**Date:** 2026-03-15
**Author:** @trilogy
**Spec:** `01-cone-math`

---

## Problem Context

The Prime Radiant visualization needs a pure mathematical model that takes the current week's work diary data and produces the data points needed to draw: (a) the actual AI% trajectory line, and (b) the forward-looking possibility cone. This spec isolates all math into a single testable function with no React dependencies.

---

## Exploration Findings

### Existing Patterns

| Pattern | Used In | Notes |
|---------|---------|-------|
| AI% formula | `src/lib/ai.ts`, MEMORY.md | `aiPct = aiUsage / (total - noTags)` — "tagged slots" as denominator |
| Per-day aggregation | `src/hooks/useAIData.ts` | `countDiaryTags()` per day → `aggregateAICache()` for weekly total |
| Cumulative computation | `src/lib/panelState.ts` | `computeDaysElapsed()` pattern for week progress |
| Pure lib functions | `src/lib/hours.ts`, `src/lib/ai.ts` | Business logic separated from hooks, exported as pure functions |

### Key Files

| File | Relevance |
|------|-----------|
| `src/lib/ai.ts` | AI% formula, `countDiaryTags`, `aggregateAICache` — foundational |
| `src/hooks/useAIData.ts` | Produces `DailyTagData[]` — the input to our cone math |
| `src/types/api.ts` | `DailyTagData` interface definition |
| `src/lib/panelState.ts` | Reference for pure computation functions style |

### Integration Points

- Input: `DailyTagData[]` from `useAIData().data.dailyBreakdown` — already available, no new API calls
- Input: `weeklyLimit` from `config.weeklyLimit` (hours)
- Output: `ConeData` consumed by `AIConeChart` component in spec 02

---

## Key Decisions

### Decision 1: Slot-Based vs Hours-Based Internal Math

**Options considered:**
1. Work in slots (1 slot = 10 min, 6 slots/hr) for everything — avoids floating point in partial conversions
2. Convert to hours early — matches the X-axis unit (hours) naturally

**Chosen:** Work in slots internally for AI ratio math; convert to hours only for X-axis coordinates.

**Rationale:** The AI% formula is slot-based (`aiUsage / taggedSlots`). Keeping it in slots avoids rounding errors. X-axis is in hours (matching weeklyLimit), so we convert at the boundary.

### Decision 2: Cone Lower Bound Definition

The worst-case scenario for the cone's lower bound:

**Options considered:**
1. **No more tagged work**: remaining slots are all untagged → denominator (taggedSlots) doesn't grow → AI% stays at current rate (flat lower bound)
2. **Tagged but no AI**: remaining slots are tagged but no AI tag → `lower(end) = aiSlots / (taggedSlots + slotsRemaining)` → AI% decreases as hours increase
3. **Zero AI from here**: all remaining hours log 0 AI → use option 2

**Chosen:** Option 2 — tagged but no AI (true worst case for productivity context).

**Rationale:** Option 1 (untagged) is unrealistic as a worst case — untagged slots don't count in the formula, so it wouldn't affect AI%. The realistic worst case is logging hours with some work tags but no AI usage. This creates a visually satisfying cone that narrows toward a floor.

### Decision 3: Actual Line Data Points

**Options considered:**
1. One point per day elapsed — simple, up to 7 points
2. Interpolate sub-day (per-hour) — complex, data not available at that granularity
3. Always start from (0, 0) — shows the week starting point

**Chosen:** Option 1 + always include (0, 0) as first point.

**Rationale:** We only have per-day data, so sub-day interpolation would be fabricated. Starting from (0, 0) anchors the line to week start and always looks correct even on Monday morning.

---

## Interface Contracts

### Types

```typescript
// src/lib/aiCone.ts

export interface ConePoint {
  hoursX: number;  // X-axis position in hours (0 → weeklyLimit)
  pctY: number;    // Y-axis AI% (0 → 100)
}

export interface ConeData {
  // Left side: actual trajectory (drawn as solid line)
  actualPoints: ConePoint[];      // [{ hoursX: 0, pctY: 0 }, ...one per day..., currentPoint]

  // Right side: possibility cone (filled area between upper + lower)
  upperBound: ConePoint[];        // from currentPoint → weeklyLimit: best-case AI%
  lowerBound: ConePoint[];        // from currentPoint → weeklyLimit: worst-case AI%

  // Derived values for chart rendering
  currentHours: number;           // hours logged so far this week
  currentAIPct: number;           // AI% at this moment
  weeklyLimit: number;            // from config (hours)
  targetPct: number;              // always 75
  isTargetAchievable: boolean;    // upperBound final pctY >= 75
}
```

### Function Contracts

| Function | Signature | Responsibility | Dependencies |
|----------|-----------|----------------|--------------|
| `computeAICone` | `(dailyBreakdown: DailyTagData[], weeklyLimit: number) => ConeData` | Full cone computation: actual points, upper bound, lower bound, derived values | `DailyTagData` from api types |
| `computeActualPoints` | `(dailyBreakdown: DailyTagData[]) => ConePoint[]` | Build actual trajectory from per-day cumulative data, always starts at (0,0) | `DailyTagData[]` |
| `computeCone` | `(currentHours: number, currentAIPct: number, aiSlots: number, taggedSlots: number, weeklyLimit: number) => { upper: ConePoint[], lower: ConePoint[] }` | Build forward-looking cone from current position | — |

---

## Test Plan

### `computeActualPoints`

**Signature:** `(dailyBreakdown: DailyTagData[]) => ConePoint[]`

**Happy Path:**
- 3 days elapsed with increasing AI%: returns 4 points (0,0 + one per day)
- 100% AI all week: all points near 100%
- 0% AI all week: all points at 0%

**Edge Cases:**
- Empty array (Monday morning, no data yet): returns `[{ hoursX: 0, pctY: 0 }]`
- Day with 0 total slots (holiday/no work): skip that day in cumulative (or include with same AI% as prior day)
- All slots untagged: `taggedSlots === 0` → `pctY: 0` without division error

**Error Cases:**
- `dailyBreakdown` contains null entries: skip gracefully

### `computeCone`

**Signature:** `(currentHours, currentAIPct, aiSlots, taggedSlots, weeklyLimit) => { upper, lower }`

**Happy Path:**
- Middle of week (20h logged, 40h limit): cone spans from current AI% to best/worst at 40h
- Upper bound > current AI% (since adding AI slots improves %)
- Lower bound < current AI% (since adding tagged non-AI slots dilutes %)
- Both bounds converge to a point when `currentHours === weeklyLimit`

**Edge Cases:**
- `currentHours === 0` (start of week): upper=100%, lower=0% (full open cone)
- `currentHours === weeklyLimit` (week complete): cone collapses to a single point (upper === lower === currentAIPct)
- `taggedSlots === 0` at start: lower bound = 0, upper bound = 100%
- Upper bound capped at 100%
- Lower bound floored at 0%

**Error Cases:**
- `weeklyLimit === 0`: return empty cone, guard against division by zero
- `currentHours > weeklyLimit` (overtime): treat as week complete

### `computeAICone`

**Signature:** `(dailyBreakdown: DailyTagData[], weeklyLimit: number) => ConeData`

**Happy Path:**
- Mid-week: returns actual points for days elapsed, cone from current position
- `isTargetAchievable === true` when upper bound final pctY >= 75
- `isTargetAchievable === false` when even best case can't reach 75%

**Edge Cases:**
- Monday morning no data: actualPoints = [(0,0)], full-width cone
- Friday EOD all hours logged: actualPoints = full week, cone collapsed to a point
- `targetPct` always 75 regardless of config

**Mocks Needed:**
- `DailyTagData` fixtures: vary `total`, `aiUsage`, `noTags` values

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/aiCone.ts` | create | `computeAICone`, `computeActualPoints`, `computeCone` + `ConeData`, `ConePoint` types |
| `src/lib/__tests__/aiCone.test.ts` | create | Unit tests for all three functions |

---

## Edge Cases to Handle

1. **Division by zero** — `taggedSlots === 0` → return 0% AI (guard before division)
2. **`currentHours > weeklyLimit`** — cap to weeklyLimit; user worked overtime
3. **Upper bound > 100%** — clamp to 100
4. **Lower bound < 0%** — clamp to 0
5. **All days have 0 hours** (no time tracked) — return minimal cone anchored at (0, 0)
6. **Floating point** — round to 2 decimal places for display; use full precision internally

---

## Open Questions

None remaining.
