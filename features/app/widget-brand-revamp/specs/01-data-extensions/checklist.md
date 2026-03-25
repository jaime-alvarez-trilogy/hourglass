# Checklist: 01-data-extensions

## Phase 1.0 — Tests (Write First, Must Fail Red)

### FR1: WidgetData type fields
- [ ] Test: `WidgetData` has `paceBadge` field of correct union type
- [ ] Test: `WidgetData` has `weekDeltaHours: string` field
- [ ] Test: `WidgetData` has `weekDeltaEarnings: string` field
- [ ] Test: `WidgetData` has `brainliftTarget: string` field

### FR2: paceBadge computation (bridge.test.ts)
- [ ] Test: `overtimeHours > 0` → `paceBadge === 'crushed_it'`
- [ ] Test: `hoursData === null` → `paceBadge === 'none'`
- [ ] Test: Monday morning (`workdaysElapsed = 0`, `expectedHours = 0`) → `paceBadge === 'none'`
- [ ] Test: midweek, `ratio >= 0.9` → `paceBadge === 'on_track'`
- [ ] Test: midweek, `0.7 <= ratio < 0.9` → `paceBadge === 'behind'`
- [ ] Test: midweek, `ratio < 0.7` → `paceBadge === 'critical'`
- [ ] Test: Saturday (`day === 6`) uses `workdaysElapsed = 5`
- [ ] Test: Sunday (`day === 0`) uses `workdaysElapsed = 5`
- [ ] Test: `config.weeklyLimit` missing → defaults to 40

### FR3: weekDelta computation (bridge.test.ts)
- [ ] Test: positive delta → `"+2.1h"` and `"+$84"`
- [ ] Test: negative delta → `"-3.4h"` and `"-$136"`
- [ ] Test: zero delta → `"+0.0h"` and `"+$0"`
- [ ] Test: `prevWeekSnapshot === null` → `""` for both
- [ ] Test: `prevWeekSnapshot === undefined` → `""` for both
- [ ] Test: `hoursData === null` → `""` for both

### FR4: brainliftTarget constant
- [ ] Test: `brainliftTarget === "5h"` regardless of inputs

### FR5: updateWidgetData signature (bridge.test.ts)
- [ ] Test: existing 6-arg callers still work (backward compat)
- [ ] Test: `prevWeekSnapshot` forwarded to `buildWidgetData` when provided
- [ ] Test: when `prevWeekSnapshot` omitted → delta fields are `""`

### FR6: useWidgetSync hook (useWidgetSync.test.ts or bridge.test.ts)
- [ ] Test: `prevWeekSnapshot` forwarded to `bridge.updateWidgetData` when provided
- [ ] Test: `null` passed through when `null` provided
- [ ] Test: existing 5-arg callers still work (backward compat)
- [ ] Test: `prevWeekSnapshot` NOT in `useEffect` deps (verify no extra re-trigger)

### FR7: _layout.tsx wiring
- [ ] Test: `useWeeklyHistory` imported and called
- [ ] Test: `prevWeekSnapshot` passed as 7th arg to `useWidgetSync`

---

## Phase 1.1 — Implementation

### FR1: Extend WidgetData interface
- [ ] Add `paceBadge: 'crushed_it' | 'on_track' | 'behind' | 'critical' | 'none'` to `src/widgets/types.ts`
- [ ] Add `weekDeltaHours: string` to `src/widgets/types.ts`
- [ ] Add `weekDeltaEarnings: string` to `src/widgets/types.ts`
- [ ] Add `brainliftTarget: string` to `src/widgets/types.ts`
- [ ] Verify TypeScript compiles with no errors

### FR2: Implement paceBadge in buildWidgetData
- [ ] Update `buildWidgetData` in `src/widgets/bridge.ts` to accept `HoursData | null`
- [ ] Implement `workdaysElapsed` logic (Mon=0..Fri=4; Sat/Sun=5)
- [ ] Implement `expectedHours` calculation using `config.weeklyLimit ?? 40`
- [ ] Implement ratio-based badge assignment
- [ ] Return `'none'` for null hoursData and zero expectedHours cases
- [ ] Populate `paceBadge` in `buildWidgetData` return object

### FR3: Implement weekDelta in buildWidgetData
- [ ] Accept `prevWeekSnapshot?: { hours: number; earnings: number } | null` as 8th param of `buildWidgetData`
- [ ] Implement delta computation for hours: `dh.toFixed(1) + 'h'` with sign prefix
- [ ] Implement delta computation for earnings: `'$' + Math.round(de).toLocaleString()` with sign prefix
- [ ] Return `""` for both when snapshot or hoursData is null/undefined
- [ ] Populate `weekDeltaHours` and `weekDeltaEarnings` in return object

### FR4: Implement brainliftTarget constant
- [ ] Set `brainliftTarget: '5h'` in `buildWidgetData` return object

### FR5: Extend updateWidgetData
- [ ] Add `prevWeekSnapshot?: { hours: number; earnings: number } | null` as 7th param to `updateWidgetData`
- [ ] Pass `prevWeekSnapshot` through to `buildWidgetData` call
- [ ] Handle `hoursData === null` guard (skip or pass null to `buildWidgetData`)

### FR6: Extend useWidgetSync
- [ ] Add `prevWeekSnapshot?: { hours: number; earnings: number } | null` as 7th param to `useWidgetSync`
- [ ] Pass `prevWeekSnapshot` to `bridge.updateWidgetData()` call
- [ ] Verify `prevWeekSnapshot` is NOT in the `useEffect` dependency array

### FR7: Wire _layout.tsx
- [ ] Import `useWeeklyHistory` from `@/src/hooks/useWeeklyHistory`
- [ ] Import `getMondayOfWeek` from `@/src/lib/ai`
- [ ] Import `useMemo` from `react`
- [ ] Call `useWeeklyHistory()` and destructure `snapshots`
- [ ] Compute `prevWeekSnapshot` via `useMemo` (last snapshot with `weekStart < thisMonday`)
- [ ] Update `useWidgetSync` call to pass `prevWeekSnapshot` as 7th arg

### FR8: Annotate widgetBridge.ts
- [ ] Add comment to `src/lib/widgetBridge.ts` at the `_updateWidgetData(...)` call explaining intentional omission of `prevWeekSnapshot`

---

## Phase 1.2 — Review

- [ ] Run spec-implementation-alignment check
- [ ] Run pr-review-toolkit:review-pr
- [ ] Address any feedback from review
- [ ] Run test-optimiser on test file
- [ ] All tests passing (`cd hourglassws && npx jest src/__tests__/widgets/bridge.test.ts`)
- [ ] TypeScript compiles clean (`cd hourglassws && npx tsc --noEmit`)
