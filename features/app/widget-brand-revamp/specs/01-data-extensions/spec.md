# 01-data-extensions

**Status:** Draft
**Created:** 2026-03-24
**Last Updated:** 2026-03-24
**Owner:** @trilogy

---

## Overview

This spec extends the `WidgetData` interface and its computation pipeline to carry four new fields required by the widget visual revamp:

- **`paceBadge`** — a pace state enum (`'crushed_it' | 'on_track' | 'behind' | 'critical' | 'none'`) computed from the contributor's hours progress relative to the weekly limit and elapsed workdays. Used by all widget sizes to render a color-coded badge.
- **`weekDeltaHours`** — formatted string (e.g. `"+2.1h"` or `"-3.4h"`) representing week-over-week hours change versus the previous week's snapshot. Empty string when no history is available.
- **`weekDeltaEarnings`** — formatted string (e.g. `"+$84"` or `"-$136"`) representing week-over-week earnings change. Empty string when no history is available.
- **`brainliftTarget`** — constant string `"5h"` representing the weekly BrainLift session target used as a denominator in progress displays.

### What Is Being Built

1. **Type extension** (`src/widgets/types.ts`): Four new fields added to `WidgetData`.
2. **Computation** (`src/widgets/bridge.ts`): `buildWidgetData()` computes the four new fields from `hoursData`, `config.weeklyLimit`, current date, and an optional `prevWeekSnapshot`. `updateWidgetData()` signature extended with an optional `prevWeekSnapshot` parameter.
3. **Hook wiring** (`src/hooks/useWidgetSync.ts`): Optional 7th parameter `prevWeekSnapshot` accepted and forwarded to the bridge.
4. **Call-site wiring** (`app/(tabs)/_layout.tsx`): `useWeeklyHistory()` hook called, previous week's snapshot derived, and passed as the 7th arg to `useWidgetSync`.
5. **Background path** (`src/lib/widgetBridge.ts`): No signature change — background path intentionally omits `prevWeekSnapshot` (delta shows `""` on background refresh).

### How It Works

The foreground path:
```
_layout.tsx
  useWeeklyHistory() → snapshots[]
  prevWeekSnapshot = last snapshot with weekStart < thisMonday
  useWidgetSync(hoursData, aiData, pendingCount, config, items, myRequests, prevWeekSnapshot)
    → bridge.updateWidgetData(..., prevWeekSnapshot)
      → buildWidgetData() — computes paceBadge, weekDeltaHours, weekDeltaEarnings, brainliftTarget
        → WidgetData written to iOS UserDefaults / Android AsyncStorage
```

The background path (silent push via `lib/widgetBridge.ts`) leaves `prevWeekSnapshot` as `undefined`; delta fields render as empty strings.

---

## Out of Scope

1. **iOS `WIDGET_LAYOUT_JS` visual redesign** — Deferred to [02-ios-visual](../02-ios-visual/spec.md). This spec only adds the data fields; rendering them is 02's responsibility.

2. **Android `HourglassWidget.tsx` visual redesign** — Deferred to [03-android-visual](../03-android-visual/spec.md). Android rendering of the new fields is 03's responsibility.

3. **Interactive widget actions (approve/reject from widget)** — **Descoped.** Not part of the brand revamp; deferred to a future separate spec.

4. **Lock screen complication redesign** — **Descoped.** Beyond cosmetic color fixes, lock screen complications are deferred.

5. **Widget configuration UI** — **Descoped.** A size/role picker is out of scope for this entire feature.

6. **`brainliftTarget` being user-configurable** — **Descoped.** The target is a constant `"5h"` for now; making it configurable via app settings is a future enhancement.

7. **Background path delta computation** — **Descoped per Decision 2.** `lib/widgetBridge.ts` will not fetch historical data during background refresh. Delta fields will render as `""` on background-triggered widget updates. This is an accepted trade-off.

8. **Full `WeeklySnapshot` type in bridge** — **Descoped per Decision 1.** Bridge uses a minimal `{ hours: number; earnings: number }` type instead of importing `WeeklySnapshot` from `weeklyHistory.ts`, keeping bridge decoupled from the history store.

9. **Scriptable `hourglass.js`** — **Descoped.** Separate codebase, separate effort.

---

## Functional Requirements

### FR1: Extend WidgetData Interface

**Description:** Add four new fields to the `WidgetData` interface in `src/widgets/types.ts`.

**Success Criteria:**
- `paceBadge: 'crushed_it' | 'on_track' | 'behind' | 'critical' | 'none'` is present on `WidgetData`
- `weekDeltaHours: string` is present on `WidgetData`
- `weekDeltaEarnings: string` is present on `WidgetData`
- `brainliftTarget: string` is present on `WidgetData`
- TypeScript compiles without errors across all files that construct or consume `WidgetData`
- Existing tests continue to pass (no regression in `bridge.test.ts` tests requiring these fields)

---

### FR2: Compute paceBadge in buildWidgetData

**Description:** `buildWidgetData()` in `src/widgets/bridge.ts` computes `paceBadge` using the logic specified in spec-research.md.

**Logic:**
```
if !hoursData → 'none'
if hoursData.overtimeHours > 0 → 'crushed_it'
day = new Date().getDay()  // 0=Sun..6=Sat
workdaysElapsed:
  day === 0 (Sun) → 5
  day === 6 (Sat) → 5
  else → Math.min(day - 1, 5)   // Mon(1)→0 … Fri(5)→4 … clamp to 5 on Fri+
expectedHours = (config.weeklyLimit ?? 40) * (workdaysElapsed / 5)
if expectedHours === 0 → 'none'
ratio = hoursData.total / expectedHours
ratio >= 0.9 → 'on_track'
ratio >= 0.7 → 'behind'
else → 'critical'
```

**Success Criteria:**
- `overtimeHours > 0` always returns `'crushed_it'` regardless of day
- `hoursData === null` returns `'none'`
- Monday morning (`workdaysElapsed === 0`, `expectedHours === 0`) returns `'none'`
- On a weekday with sufficient hours (`ratio >= 0.9`) returns `'on_track'`
- On a weekday with 0.7 ≤ ratio < 0.9 returns `'behind'`
- On a weekday with ratio < 0.7 returns `'critical'`
- Saturday/Sunday (`day === 0` or `day === 6`) uses `workdaysElapsed = 5` (full-week comparison)
- Missing `config.weeklyLimit` defaults to 40

---

### FR3: Compute weekDeltaHours and weekDeltaEarnings in buildWidgetData

**Description:** `buildWidgetData()` computes `weekDeltaHours` and `weekDeltaEarnings` from `hoursData` and an optional `prevWeekSnapshot`.

**Logic:**
```
if !prevWeekSnapshot || !hoursData:
  weekDeltaHours = ""
  weekDeltaEarnings = ""
else:
  dh = hoursData.total - prevWeekSnapshot.hours
  de = hoursData.weeklyEarnings - prevWeekSnapshot.earnings
  weekDeltaHours = (dh >= 0 ? '+' : '') + dh.toFixed(1) + 'h'
  weekDeltaEarnings = de >= 0
    ? '+$' + Math.round(de).toLocaleString()
    : '-$' + Math.abs(Math.round(de)).toLocaleString()
```

**Success Criteria:**
- Positive delta produces `"+2.1h"` and `"+$84"` format strings
- Negative delta produces `"-3.4h"` and `"-$136"` format strings
- Zero delta produces `"+0.0h"` and `"+$0"`
- `prevWeekSnapshot === null` produces `""` for both fields
- `prevWeekSnapshot === undefined` produces `""` for both fields
- `hoursData === null` produces `""` for both fields

---

### FR4: Compute brainliftTarget in buildWidgetData

**Description:** `buildWidgetData()` sets `brainliftTarget` to the constant string `"5h"`.

**Success Criteria:**
- `brainliftTarget === "5h"` regardless of any input values
- Field is always populated (never `undefined` or `null`)

---

### FR5: Extend updateWidgetData Signature

**Description:** `updateWidgetData()` in `src/widgets/bridge.ts` accepts an optional `prevWeekSnapshot` parameter and passes it through to `buildWidgetData()`.

**New Signature:**
```typescript
export async function updateWidgetData(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig,
  approvalItems?: ApprovalItem[],
  myRequests?: ManualRequestEntry[],
  prevWeekSnapshot?: { hours: number; earnings: number } | null
): Promise<void>
```

**Success Criteria:**
- Existing callers with 6 args or fewer continue to work (backward compat)
- `prevWeekSnapshot` is forwarded to `buildWidgetData()`
- When `prevWeekSnapshot` is omitted, `buildWidgetData()` receives `undefined`

---

### FR6: Extend useWidgetSync Signature

**Description:** `useWidgetSync()` in `src/hooks/useWidgetSync.ts` accepts an optional 7th parameter `prevWeekSnapshot` and passes it through to `bridge.updateWidgetData()`.

**New Signature:**
```typescript
export function useWidgetSync(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig | null,
  approvalItems?: ApprovalItem[],
  myRequests?: ManualRequestEntry[],
  prevWeekSnapshot?: { hours: number; earnings: number } | null
): void
```

**Success Criteria:**
- `prevWeekSnapshot` is forwarded to `bridge.updateWidgetData()` when provided
- `null` is forwarded when `null` is passed
- Existing callers with 6 args continue to work (backward compat)
- `prevWeekSnapshot` is NOT added to `useEffect` dependency array

---

### FR7: Wire prevWeekSnapshot in _layout.tsx

**Description:** `app/(tabs)/_layout.tsx` calls `useWeeklyHistory()`, derives the previous week's snapshot, and passes it as the 7th argument to `useWidgetSync()`.

**Logic:**
```typescript
const { snapshots } = useWeeklyHistory();
const prevWeekSnapshot = useMemo(() => {
  const thisMonday = getMondayOfWeek(new Date().toLocaleDateString('en-CA'));
  const prev = [...snapshots].reverse().find(s => s.weekStart < thisMonday);
  return prev ? { hours: prev.hours, earnings: prev.earnings } : null;
}, [snapshots]);

useWidgetSync(hoursData, aiData, items.length, config, items, myRequests, prevWeekSnapshot);
```

Note: `todayLocal()` is not exported from `src/lib/hours.ts` or `src/lib/ai.ts`. Use `new Date().toLocaleDateString('en-CA')` inline (returns `YYYY-MM-DD` in local timezone without UTC shift). `getMondayOfWeek` is exported from `src/lib/ai.ts`.

**Success Criteria:**
- `useWeeklyHistory` is imported and called in `_layout.tsx`
- `getMondayOfWeek` is imported from `src/lib/ai`
- `prevWeekSnapshot` is derived via `useMemo` keyed on `snapshots`
- `prevWeekSnapshot` is passed as the 7th arg to `useWidgetSync`
- When `snapshots` is empty, `prevWeekSnapshot` is `null`

---

### FR8: Annotate widgetBridge.ts Background Path

**Description:** `src/lib/widgetBridge.ts` is not changed functionally but receives a comment at the `bridge.updateWidgetData()` call site clarifying that `prevWeekSnapshot` is intentionally omitted on the background path.

**Success Criteria:**
- No signature change to `widgetBridge.ts`
- A comment is added noting the intentional omission of `prevWeekSnapshot` and that delta fields will be `""` on background refresh
- TypeScript compiles without errors (the 7th arg remains optional in `updateWidgetData`)

---

## Technical Design

### Files to Reference

| File | Why |
|------|-----|
| `hourglassws/src/widgets/types.ts` | `WidgetData` interface to extend |
| `hourglassws/src/widgets/bridge.ts` | `buildWidgetData()`, `updateWidgetData()` — computation site |
| `hourglassws/src/hooks/useWidgetSync.ts` | Foreground hook to extend with 7th param |
| `hourglassws/src/lib/widgetBridge.ts` | Background path wrapper — annotate only |
| `hourglassws/src/lib/weeklyHistory.ts` | `WeeklySnapshot` type, key `weekly_history_v2`, sort order |
| `hourglassws/src/hooks/useWeeklyHistory.ts` | Hook return shape `{ snapshots: WeeklySnapshot[] }` |
| `hourglassws/src/lib/hours.ts` | `HoursData` type; `overtimeHours`, `weeklyEarnings` fields |
| `hourglassws/src/types/config.ts` | `CrossoverConfig`; `weeklyLimit`, `isManager` fields |
| `hourglassws/src/lib/ai.ts` | `getMondayOfWeek(dateString): string` — exported function |
| `hourglassws/src/__tests__/widgets/bridge.test.ts` | Existing test patterns, fixtures, mock setup |
| `hourglassws/app/(tabs)/_layout.tsx` | Call site; currently calls `useWidgetSync` with 5 args |

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/src/widgets/types.ts` | Add 4 fields to `WidgetData` interface (FR1) |
| `hourglassws/src/widgets/bridge.ts` | Extend `buildWidgetData()` + `updateWidgetData()` (FR2, FR3, FR4, FR5) |
| `hourglassws/src/hooks/useWidgetSync.ts` | Add optional 7th param; pass through to bridge (FR6) |
| `hourglassws/app/(tabs)/_layout.tsx` | Wire `useWeeklyHistory`, compute `prevWeekSnapshot`, pass as 7th arg (FR7) |
| `hourglassws/src/lib/widgetBridge.ts` | Add comment only — no functional change (FR8) |

### Test File to Modify

| File | Change |
|------|--------|
| `hourglassws/src/__tests__/widgets/bridge.test.ts` | Add test cases for FR2–FR7 per spec-research.md Test Plan |

### Data Flow

**Foreground path (widget updates while app is open):**
```
_layout.tsx
  useWeeklyHistory()              → { snapshots: WeeklySnapshot[] }
  useMemo([snapshots])            → prevWeekSnapshot: { hours, earnings } | null
  useWidgetSync(..., prevWeekSnapshot)
    → bridge.updateWidgetData(..., prevWeekSnapshot?)
      → buildWidgetData(..., prevWeekSnapshot?)
          paceBadge     ← hoursData.total, hoursData.overtimeHours, config.weeklyLimit, new Date()
          weekDeltaHours ← hoursData.total vs prevWeekSnapshot.hours
          weekDeltaEarnings ← hoursData.weeklyEarnings vs prevWeekSnapshot.earnings
          brainliftTarget ← constant "5h"
        → WidgetData → AsyncStorage 'widget_data' (Android)
                      → iOS UserDefaults + WidgetKit timeline reload
```

**Background path (silent push refresh):**
```
lib/widgetBridge.ts
  updateWidgetData(snapshot)
    → bridge.updateWidgetData(hoursData, aiData, pendingCount, config, approvalItems, myRequests)
         ← no prevWeekSnapshot (7th arg omitted intentionally per Decision 2)
         ← weekDeltaHours = "", weekDeltaEarnings = "" (acceptable on background refresh)
```

### Key Implementation Notes

**1. `buildWidgetData` current signature has `hoursData: HoursData` (non-nullable)**

The current `buildWidgetData` takes `hoursData: HoursData`. The `updateWidgetData` public surface should accept `HoursData | null` and guard before calling `buildWidgetData`. New `paceBadge`/delta null-handling logic lives in `buildWidgetData` (it needs to produce `paceBadge: 'none'` and empty deltas when hoursData is null). Accept `HoursData | null` in `buildWidgetData` as well to keep the null-handling collocated with the computation.

**2. `todayLocal()` is not exported**

`todayLocal` is defined inline in `src/lib/hours.ts` but not exported. In `_layout.tsx`, use `new Date().toLocaleDateString('en-CA')` which returns `YYYY-MM-DD` in local timezone without UTC shift.

**3. `getMondayOfWeek` is exported from `src/lib/ai.ts`**

Confirmed: `export function getMondayOfWeek(today: string): string` at line 40 of `src/lib/ai.ts`. Import directly from `@/src/lib/ai`.

**4. `buildWidgetData` has `now: number = Date.now()` as existing 7th param**

Add `prevWeekSnapshot` as an 8th param: `buildWidgetData(hoursData, aiData, pendingCount, config, approvalItems, myRequests, now, prevWeekSnapshot?)`. This preserves the existing `now` injection pattern used in tests.

**5. `_layout.tsx` currently passes 5 args to `useWidgetSync`**

Current call: `useWidgetSync(hoursData, aiData, items.length, config, items)`. The 6th arg (`myRequests`) is not yet wired. FR7 adds `prevWeekSnapshot` as the 7th arg. The 6th arg position (`myRequests`) can remain `undefined` (not in scope for this spec). The updated call becomes: `useWidgetSync(hoursData, aiData, items.length, config, items, undefined, prevWeekSnapshot)`.

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| `hoursData === null` in `updateWidgetData` | Guard: skip `buildWidgetData`; or pass null and return `paceBadge='none'`, deltas `""` |
| Monday 00:00 local time | `workdaysElapsed = 0`, `expectedHours = 0` → `paceBadge = 'none'` |
| Saturday or Sunday | `workdaysElapsed = 5`, full week comparison |
| `config.weeklyLimit` missing | Defaults to 40 |
| `snapshots` empty | `prevWeekSnapshot = null` → delta `""` |
| `snapshots` has only current week | `.find(s => s.weekStart < thisMonday)` → `undefined` → `null` |
| delta of exactly 0 | `"+0.0h"` and `"+$0"` |
| Very large earnings delta | `toLocaleString()` formats with commas: `"+$1,200"` |
