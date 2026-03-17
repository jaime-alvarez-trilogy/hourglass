# Checklist: 01-baseline-start

## Phase 1.0 — Tests (Red Phase)

### FR1: `computeHourlyPoints` baseline param
- [ ] test: `baselinePct=0` (default) → first point is `{ hoursX: 0, pctY: 0 }` — no regression
- [ ] test: `baselinePct=81` → first point is `{ hoursX: 0, pctY: 81 }`
- [ ] test: `baselinePct=75` → first point is `{ hoursX: 0, pctY: 75 }`
- [ ] test: `baselinePct` omitted → behaves same as `baselinePct=0`
- [ ] test: `baselinePct=0` with data → subsequent points reflect actual AI% (baseline only affects origin)
- [ ] test: `baselinePct=100` → first point is `{ hoursX: 0, pctY: 100 }`, subsequent points track actual

### FR2: `computeAICone` threads `baselinePct`
- [ ] test: `computeAICone(breakdown, 40, 81)` → `coneData.hourlyPoints[0].pctY === 81`
- [ ] test: `computeAICone(breakdown, 40)` → `coneData.hourlyPoints[0].pctY === 0` (default, no regression)
- [ ] test: `computeAICone(breakdown, 40, 0)` → `coneData.hourlyPoints[0].pctY === 0`
- [ ] test: `coneData.currentAIPct` is unchanged regardless of `baselinePct`
- [ ] test: `coneData.upperBound` is unchanged regardless of `baselinePct`
- [ ] test: `coneData.lowerBound` is unchanged regardless of `baselinePct`
- [ ] test: `coneData.targetPct === 75` regardless of `baselinePct`

### FR3: Call site threading (source-level verification)
- [ ] test: `index.tsx` passes `previousWeekPercent` as third arg to `computeAICone`
- [ ] test: `index.tsx` includes `previousWeekPercent` in `useMemo` deps array
- [ ] test: `ai.tsx` passes `previousWeekPercent` as third arg to `computeAICone`

## Phase 1.1 — Implementation

### FR1: `computeHourlyPoints` in `aiCone.ts`
- [ ] impl: add `baselinePct: number = 0` parameter to `computeHourlyPoints`
- [ ] impl: change `const points: ConePoint[] = [{ hoursX: 0, pctY: 0 }]` to `[{ hoursX: 0, pctY: baselinePct }]`
- [ ] impl: all FR1 tests pass

### FR2: `computeAICone` in `aiCone.ts`
- [ ] impl: add `baselinePct: number = 0` parameter to `computeAICone`
- [ ] impl: thread `baselinePct` through to `computeHourlyPoints` call
- [ ] impl: all FR2 tests pass

### FR3: Call sites
- [ ] impl: `index.tsx` — add `previousWeekPercent` to `useAIData()` destructure
- [ ] impl: `index.tsx` — pass `previousWeekPercent` as third arg to `computeAICone`
- [ ] impl: `index.tsx` — add `previousWeekPercent` to `useMemo` deps array
- [ ] impl: `ai.tsx` — add `previousWeekPercent` as third arg to `computeAICone` call
- [ ] impl: TypeScript compiles without errors (`npx tsc --noEmit` clean)
- [ ] impl: all existing tests still pass (full test suite green)

## Phase 1.2 — Review

- [ ] spec-implementation-alignment: run agent, confirm PASS
- [ ] pr-review-toolkit: run review-pr, address any feedback
- [ ] test-optimiser: run agent, apply any improvements
- [ ] docs: update checklist session notes
- [ ] docs: update FEATURE.md changelog
