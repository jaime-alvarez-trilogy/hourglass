# Spec Research: 01-data-extensions

## Problem Context

`WidgetData` (last extended in 08-widget-enhancements) lacks four fields the visual revamp needs:
- `paceBadge` — pace state for color-coding and badge label
- `weekDeltaHours` / `weekDeltaEarnings` — trend context vs last week
- `brainliftTarget` — weekly target denominator for BrainLift progress display

The call chain (from `_layout.tsx` through `useWidgetSync` → `bridge.updateWidgetData`) does not yet carry the previous week snapshot needed for deltas.

## Exploration Findings

### Key Files
| File | Role |
|------|------|
| `hourglassws/src/widgets/types.ts` | `WidgetData` interface, `WidgetUrgency`, `WidgetDailyEntry`, etc. |
| `hourglassws/src/widgets/bridge.ts` | `buildWidgetData()` + `updateWidgetData()` — core computation |
| `hourglassws/src/hooks/useWidgetSync.ts` | Foreground hook; calls `bridge.updateWidgetData` on data change |
| `hourglassws/src/lib/widgetBridge.ts` | Background path wrapper; translates `CrossoverSnapshot` → bridge args |
| `hourglassws/app/(tabs)/_layout.tsx:57` | Wire site — currently calls `useWidgetSync(hoursData, aiData, items.length, config, items)` |
| `hourglassws/src/lib/weeklyHistory.ts` | `WeeklySnapshot` type + `loadWeeklyHistory()` — confirmed has `hours` + `earnings` |
| `hourglassws/src/hooks/useWeeklyHistory.ts` | Hook that reads `weekly_history_v2` from AsyncStorage |

### WeeklySnapshot (confirmed in weeklyHistory.ts)
```typescript
interface WeeklySnapshot {
  weekStart: string;      // YYYY-MM-DD (Monday)
  hours: number;          // Total paid hours that week
  earnings: number;       // Total earnings that week
  aiPct: number;          // Midpoint AI%
  brainliftHours: number; // BrainLift hours
}
```
Stored ascending by weekStart; up to 12 weeks retained.

### Current useWidgetSync signature
```typescript
function useWidgetSync(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig | null,
  approvalItems?: ApprovalItem[],
  myRequests?: ManualRequestEntry[]
): void
```
Called from `_layout.tsx:57` — no history passed.

### Current bridge.updateWidgetData signature
```typescript
async function updateWidgetData(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig,
  approvalItems?: ApprovalItem[],
  myRequests?: ManualRequestEntry[]
): Promise<void>
```
Calls `buildWidgetData()` internally.

### HoursData (relevant fields for paceBadge)
```typescript
interface HoursData {
  total: number;          // weekly hours total
  overtimeHours: number;  // positive if over weeklyLimit
  deadline: Date;
  // weeklyLimit accessible via config.weeklyLimit (defaults to 40)
}
```

## Key Decisions

### Decision 1: prevWeekSnapshot type
Use `{ hours: number; earnings: number } | null` as a minimal interface rather than the full `WeeklySnapshot`. This keeps the bridge decoupled from the history store type.

**Rationale:** `buildWidgetData` only needs hours and earnings for delta computation. Using a narrow type avoids coupling bridge.ts to weeklyHistory.ts.

### Decision 2: prevWeekSnapshot source for background path
`lib/widgetBridge.ts` wraps `CrossoverSnapshot`. The background notification handler doesn't have AsyncStorage history available mid-execution. Leave `prevWeekSnapshot` as `undefined` on the background path — deltas show `""` (no history). The foreground `_layout.tsx` path provides the full data.

### Decision 3: paceBadge on weekends
Saturday/Sunday: compare `total` directly vs `weeklyLimit`. If `total >= weeklyLimit` → `'crushed_it'`. If `total >= weeklyLimit * 0.9` → `'on_track'`. Otherwise `'behind'`.

### Decision 4: weekdaysElapsed calculation
Count Mon–Fri only. Use `getDay()` on current date: 0=Sun, 1=Mon..5=Fri, 6=Sat. Elapsed workdays = `Math.min(Math.max(getDay() - 1, 0), 5)` with Sat/Sun both mapping to 5.

## Interface Contracts

### New WidgetData fields (types.ts)
```typescript
// added after existing fields:

/** Pace state derived from hours vs expected; drives badge label + color */
paceBadge: 'crushed_it' | 'on_track' | 'behind' | 'critical' | 'none';

/** Week-over-week hours delta: "+2.1h" | "-3.4h" | "" (no history) */
weekDeltaHours: string;

/** Week-over-week earnings delta: "+$84" | "-$136" | "" (no history) */
weekDeltaEarnings: string;

/** BrainLift weekly target label — always "5h" */
brainliftTarget: string;
```

### buildWidgetData new signature (bridge.ts)
```typescript
// Internal function — tested via updateWidgetData
function buildWidgetData(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig,
  approvalItems: ApprovalItem[],
  myRequests: ManualRequestEntry[],
  prevWeekSnapshot?: { hours: number; earnings: number } | null  // NEW
): WidgetData
```

**paceBadge computation:**
```
if !hoursData → 'none'
if hoursData.overtimeHours > 0 → 'crushed_it'
day = new Date().getDay()  // 0=Sun..6=Sat
workdaysElapsed:
  day === 0 || day === 6 → 5 (full week)
  else → Math.min(day - 1, 5)  // Mon=0..Fri=4 → clamp to 5 on Fri
expectedHours = (config.weeklyLimit ?? 40) * (workdaysElapsed / 5)
if expectedHours === 0 → 'none'
ratio = hoursData.total / expectedHours
ratio >= 0.9 → 'on_track'
ratio >= 0.7 → 'behind'
else → 'critical'
```

**weekDelta computation:**
```
if !prevWeekSnapshot || !hoursData → weekDeltaHours = "", weekDeltaEarnings = ""
else:
  dh = hoursData.total - prevWeekSnapshot.hours
  de = hoursData.weeklyEarnings - prevWeekSnapshot.earnings
  weekDeltaHours = (dh >= 0 ? '+' : '') + dh.toFixed(1) + 'h'
  weekDeltaEarnings = de >= 0
    ? '+$' + Math.round(de).toLocaleString()
    : '-$' + Math.abs(Math.round(de)).toLocaleString()
```

**brainliftTarget:** always `"5h"`.

### updateWidgetData new signature (bridge.ts)
```typescript
export async function updateWidgetData(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig,
  approvalItems?: ApprovalItem[],
  myRequests?: ManualRequestEntry[],
  prevWeekSnapshot?: { hours: number; earnings: number } | null  // NEW
): Promise<void>
```
Passes `prevWeekSnapshot` through to `buildWidgetData`.

### useWidgetSync new signature (hooks/useWidgetSync.ts)
```typescript
export function useWidgetSync(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig | null,
  approvalItems?: ApprovalItem[],
  myRequests?: ManualRequestEntry[],
  prevWeekSnapshot?: { hours: number; earnings: number } | null  // NEW
): void
```
Passes `prevWeekSnapshot` to `bridge.updateWidgetData`. Not added to `useEffect` deps (matches `myRequests` pattern — history changes don't need independent re-trigger; `hoursData` change is sufficient).

### _layout.tsx wiring
```typescript
// Add:
const { snapshots } = useWeeklyHistory();
// Previous week = last snapshot with weekStart < this Monday.
// getMondayOfWeek (src/lib/ai.ts) returns YYYY-MM-DD for the Mon of a given date string.
// todayLocal (src/lib/hours.ts or ai.ts) returns today's YYYY-MM-DD in local time.
const prevWeekSnapshot = useMemo(() => {
  const thisMonday = getMondayOfWeek(todayLocal()); // YYYY-MM-DD, e.g. "2026-03-23"
  const prev = [...snapshots].reverse().find(s => s.weekStart < thisMonday);
  return prev ? { hours: prev.hours, earnings: prev.earnings } : null;
}, [snapshots]);

// Update call:
useWidgetSync(hoursData, aiData, items.length, config, items, myRequests, prevWeekSnapshot);
```

**Source note:** `getMondayOfWeek(dateString: string): string` is exported from `src/lib/ai.ts`. `todayLocal(): string` returns today's date in `YYYY-MM-DD` local time — verify it exists in `src/lib/hours.ts` or `src/lib/ai.ts`; if not, use `new Date().toLocaleDateString('en-CA')` (ISO-format local date, no UTC shift).

### Field Sources Summary
| Field | Source |
|-------|--------|
| `paceBadge` | computed in `buildWidgetData` from `hoursData.total`, `hoursData.overtimeHours`, `config.weeklyLimit`, current `Date` |
| `weekDeltaHours` | computed from `hoursData.total` vs `prevWeekSnapshot.hours` |
| `weekDeltaEarnings` | computed from `hoursData.weeklyEarnings` vs `prevWeekSnapshot.earnings` |
| `brainliftTarget` | constant `"5h"` |
| `prevWeekSnapshot` | `useWeeklyHistory()` in `_layout.tsx` → find last snapshot with `weekStart < thisMonday` |

## Test Plan

### paceBadge (unit tests via updateWidgetData)

**Happy Path:**
- [ ] overtime (overtimeHours > 0) → `'crushed_it'`
- [ ] on track midweek (total/expected >= 0.9) → `'on_track'`
- [ ] behind midweek (0.7 <= ratio < 0.9) → `'behind'`
- [ ] critical midweek (ratio < 0.7) → `'critical'`

**Edge Cases:**
- [ ] hoursData null → `'none'`
- [ ] Monday morning (workdaysElapsed = 0, expected = 0) → `'none'`
- [ ] Saturday: use full-week comparison → correct badge
- [ ] weeklyLimit missing from config → defaults to 40

### weekDelta (unit tests via updateWidgetData)

**Happy Path:**
- [ ] prevWeekSnapshot provided, delta positive → `"+2.1h"` and `"+$84"`
- [ ] prevWeekSnapshot provided, delta negative → `"-3.4h"` and `"-$136"`
- [ ] delta exactly 0 → `"+0.0h"` and `"+$0"`

**Edge Cases:**
- [ ] prevWeekSnapshot null → `""` for both fields
- [ ] prevWeekSnapshot undefined → `""` for both fields
- [ ] hoursData null → `""` for both fields

### brainliftTarget
- [ ] always `"5h"` regardless of inputs

### Call chain (useWidgetSync)
- [ ] passes prevWeekSnapshot to bridge.updateWidgetData when provided
- [ ] passes null when prevWeekSnapshot is null
- [ ] omitting prevWeekSnapshot (7th arg) still works (backward compat)
- [ ] prevWeekSnapshot NOT in useEffect deps (no extra re-trigger on snapshot change alone)

### _layout.tsx wiring
- [ ] useWeeklyHistory imported and called
- [ ] prevWeekSnapshot passed as 7th arg to useWidgetSync

## Files to Modify

| File | Change |
|------|--------|
| `src/widgets/types.ts` | Add `paceBadge`, `weekDeltaHours`, `weekDeltaEarnings`, `brainliftTarget` to `WidgetData` |
| `src/widgets/bridge.ts` | Update `buildWidgetData()` and `updateWidgetData()` signatures + new computation |
| `src/hooks/useWidgetSync.ts` | Add optional `prevWeekSnapshot` 7th param; pass through to `bridge.updateWidgetData` |
| `app/(tabs)/_layout.tsx` | Add `useWeeklyHistory`, compute `prevWeekSnapshot`, pass as 7th arg to `useWidgetSync` |
| `src/lib/widgetBridge.ts` | **No signature change** — background path leaves `prevWeekSnapshot` as `undefined` per Decision 2. Verify call site passes no 7th arg; add a comment noting the intentional omission. |

## Files to Reference

- `src/lib/weeklyHistory.ts` — `WeeklySnapshot` type, sort order (ascending), `WEEKLY_HISTORY_KEY`
- `src/hooks/useWeeklyHistory.ts` — hook return type and shape
- `src/lib/hours.ts` — `HoursData` type (confirm `overtimeHours` field name)
- `src/types/config.ts` — `CrossoverConfig` type (confirm `weeklyLimit` field)
- `src/__tests__/widgets/bridge.test.ts` — existing test patterns to extend
