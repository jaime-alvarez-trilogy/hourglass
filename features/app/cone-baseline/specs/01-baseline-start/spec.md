# 01-baseline-start: Cone Chart Starts at Last Week's AI%

**Status:** Draft
**Created:** 2026-03-17
**Last Updated:** 2026-03-17
**Owner:** @trilogy

---

## Overview

### What Is Being Built

A minimal change to `computeAICone()` and `computeHourlyPoints()` in `hourglassws/src/lib/aiCone.ts` to accept an optional `baselinePct` parameter (default `0`). When provided, the trajectory's origin point shifts from `{ hoursX: 0, pctY: 0 }` to `{ hoursX: 0, pctY: baselinePct }`, so the cone chart starts from last week's final AI% rather than always resetting to zero.

Two call sites are updated to thread the existing `useAIData().previousWeekPercent` value into this new parameter:
- `hourglassws/app/(tabs)/index.tsx` — add `previousWeekPercent` to the `useAIData()` destructure and pass it to `computeAICone`
- `hourglassws/app/(tabs)/ai.tsx` — `previousWeekPercent` is already destructured; just add it as the third argument to the existing `computeAICone` call

### How It Works

`computeHourlyPoints()` currently initializes its trajectory array with a hardcoded zero-origin:

```typescript
const points: ConePoint[] = [{ hoursX: 0, pctY: 0 }];
```

After this change, the origin uses the caller-supplied baseline:

```typescript
const points: ConePoint[] = [{ hoursX: 0, pctY: baselinePct }];
```

All interpolation that follows remains unchanged. Cone bounds, target line, and `currentAIPct` are independent of `baselinePct` and are not affected.

When `previousWeekPercent` is `undefined` (first week of use, no history), the default of `0` is used, preserving existing behavior.

---

## Out of Scope

1. **TrendSparkline** — **Descoped.** The 12-week sparkline on the AI tab already plots completed-week values correctly. No change needed.

2. **Cone bounds and target line logic** — **Descoped.** Upper/lower bounds and the 75% target line represent achievable forward trajectories independent of the baseline. They must not shift with `baselinePct`.

3. **How `previousWeekPercent` is computed or stored** — **Descoped.** The `useAIData` hook already writes `(aiPctLow + aiPctHigh) / 2` to AsyncStorage on Monday. The storage mechanism, key name, and calculation are unchanged.

4. **Visual/chart redesign** — **Descoped.** The only visual change is the cone trajectory line starting at the baseline Y value rather than 0. No new chart elements, labels, or styles are added.

5. **Contributor-facing smoothing or blending** — **Descoped.** No interpolation between last week's value and the first tracked slot is introduced. The first point is the baseline; subsequent points track actual current-week AI%. Any visual blending is a future concern.

---

## Functional Requirements

### FR1: `computeHourlyPoints` accepts and applies `baselinePct`

Add optional `baselinePct: number = 0` parameter to `computeHourlyPoints`. Use it to initialize the trajectory origin.

**Change:**
```typescript
// Before
const points: ConePoint[] = [{ hoursX: 0, pctY: 0 }];

// After
const points: ConePoint[] = [{ hoursX: 0, pctY: baselinePct }];
```

**Success Criteria:**
- `computeHourlyPoints` signature includes `baselinePct: number = 0`
- When `baselinePct=0` (or omitted), first point is `{ hoursX: 0, pctY: 0 }` — no regression
- When `baselinePct=81`, first point is `{ hoursX: 0, pctY: 81 }`
- When `baselinePct=75`, first point is `{ hoursX: 0, pctY: 75 }`
- When `baselinePct=100`, first point is `{ hoursX: 0, pctY: 100 }`
- Subsequent points after the first continue to reflect actual accumulated AI% from the current week's data

---

### FR2: `computeAICone` accepts and threads `baselinePct`

Add optional `baselinePct: number = 0` parameter to `computeAICone`. Thread it through to `computeHourlyPoints`.

**Signature:**
```typescript
export function computeAICone(
  dailyBreakdown: DailyTagData[],
  weeklyLimit: number,
  baselinePct: number = 0,
): ConeData
```

**Success Criteria:**
- `computeAICone(breakdown, 40, 81)` → `coneData.hourlyPoints[0].pctY === 81`
- `computeAICone(breakdown, 40)` → `coneData.hourlyPoints[0].pctY === 0` (default, no regression)
- `computeAICone(breakdown, 40, 0)` → `coneData.hourlyPoints[0].pctY === 0`
- `coneData.currentAIPct` is unchanged regardless of `baselinePct`
- `coneData.upperBound` is unchanged regardless of `baselinePct`
- `coneData.lowerBound` is unchanged regardless of `baselinePct`
- `coneData.targetPct` is always 75 regardless of `baselinePct`

---

### FR3: Call sites thread `previousWeekPercent` as `baselinePct`

Update both `computeAICone` call sites to pass `previousWeekPercent` as the third argument.

**index.tsx:**
```typescript
// Before
const { data: aiData } = useAIData();
const coneData = useMemo(
  () => (aiData ? computeAICone(aiData.dailyBreakdown, weeklyLimit) : null),
  [aiData, weeklyLimit]
);

// After
const { data: aiData, previousWeekPercent } = useAIData();
const coneData = useMemo(
  () => (aiData ? computeAICone(aiData.dailyBreakdown, weeklyLimit, previousWeekPercent) : null),
  [aiData, weeklyLimit, previousWeekPercent]
);
```

**ai.tsx** (`previousWeekPercent` already destructured at line 69):
```typescript
// Before
const coneData = computeAICone(safeData.dailyBreakdown, weeklyLimit);

// After
const coneData = computeAICone(safeData.dailyBreakdown, weeklyLimit, previousWeekPercent);
```

**Success Criteria:**
- `index.tsx` destructures `previousWeekPercent` from `useAIData()`
- `index.tsx` passes `previousWeekPercent` as third arg to `computeAICone`
- `previousWeekPercent` is included in the `useMemo` deps array in `index.tsx`
- `ai.tsx` passes `previousWeekPercent` as third arg to `computeAICone` (no destructure change needed)
- TypeScript compiles without errors at both call sites

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/lib/aiCone.ts` | Contains `computeAICone()` and `computeHourlyPoints()` — only math file modified |
| `hourglassws/src/lib/__tests__/aiCone.test.ts` | Existing cone math tests — add baseline test cases here |
| `hourglassws/src/hooks/useAIData.ts` | Source of `previousWeekPercent?: number` field |
| `hourglassws/app/(tabs)/index.tsx` | Home screen — call site requiring destructure addition + 3rd arg |
| `hourglassws/app/(tabs)/ai.tsx` | AI tab — call site requiring only 3rd arg addition |

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/src/lib/aiCone.ts` | Add `baselinePct: number = 0` to `computeHourlyPoints` and `computeAICone`; change origin point initialization |
| `hourglassws/app/(tabs)/index.tsx` | Add `previousWeekPercent` to `useAIData()` destructure; pass as 3rd arg to `computeAICone`; add to `useMemo` deps |
| `hourglassws/app/(tabs)/ai.tsx` | Add `previousWeekPercent` as 3rd arg to `computeAICone` call (line ~168) |
| `hourglassws/src/lib/__tests__/aiCone.test.ts` | Add tests for FR1 and FR2 baseline behavior |

No new files are created.

### Data Flow

```
AsyncStorage['previousWeekAIPercent']
       │
       ▼
useAIData() → previousWeekPercent?: number
       │
       ├─ index.tsx: destructured, passed to computeAICone(breakdown, limit, previousWeekPercent)
       └─ ai.tsx:    already destructured, passed to computeAICone(breakdown, limit, previousWeekPercent)
                                                    │
                                                    ▼
                                          computeAICone(breakdown, limit, baselinePct)
                                                    │
                                                    ▼
                                          computeHourlyPoints(breakdown, limit, baselinePct)
                                                    │
                                          [{ hoursX: 0, pctY: baselinePct }, ...actualPoints]
                                                    │
                                                    ▼
                                          ConeData.hourlyPoints[0].pctY === baselinePct
```

### Edge Cases

| Case | Behavior |
|------|----------|
| `previousWeekPercent` is `undefined` | TypeScript allows `undefined` to satisfy `number = 0` default; first point is `{ pctY: 0 }` — same as before |
| First week of use (no AsyncStorage key) | `previousWeekPercent` is `undefined` → cone starts at 0 — no change from current behavior |
| `baselinePct = 0` explicitly | First point is `{ pctY: 0 }` — identical to current behavior |
| `baselinePct = 100` | First point is `{ pctY: 100 }`; subsequent points track actual AI% which may be lower — line descends |
| All slots on day 1 are tagged | `currentAIPct` reflects actual percentage; `hourlyPoints[0].pctY` is baseline, `hourlyPoints[1+]` are actual |

### Constraints

- `computeHourlyPoints` is not exported — it is an internal helper called only by `computeAICone`. The `baselinePct` parameter is threaded from `computeAICone` to `computeHourlyPoints` without any external API change beyond `computeAICone`'s optional third param.
- The `ConeData` return type is unchanged — no new fields are added.
- TypeScript: `baselinePct: number = 0` means the parameter accepts `number | undefined` at the call site (TypeScript allows `undefined` to trigger the default). Both `previousWeekPercent` (`number | undefined`) call sites are type-safe without a null coalescing operator.
