# Spec Research: 06-overview-history

**Feature:** chart-interactions
**Spec:** 06-overview-history
**Complexity:** M

---

## Problem Context

The overview tab needs 4 charts showing 4–12 week trends for: earnings, hours, AI%, BrainLift. Earnings history already exists (12-week rolling window in AsyncStorage). But AI%, BrainLift hours, and hours have no multi-week persistence — the app only remembers the current week for these metrics.

This spec builds the data layer that accumulates weekly snapshots so the overview charts have historical data to display.

---

## Exploration Findings

### Existing: earnings_history_v1
`useEarningsHistory.ts` stores a `trend: number[]` (12 weeks, oldest first) in AsyncStorage key `earnings_history_v1`. Updated by merging fetched Payment[] data with the persisted array. The snapshot for each week is the total `amount` from payments for that `periodStartDate` (YYYY-MM-DD Monday).

### Existing: ai_cache
`useAIData.ts` stores the current week's work diary data in AsyncStorage `ai_cache`. Shape: `{ [YYYY-MM-DD]: DailyTagData }`. This is current-week only and gets refreshed each week.

There is one historical field: `previousWeekAIPercent` stored in AsyncStorage as a single number. Only one week back.

### Existing: hours data
`useHoursData.ts` fetches current week's timesheet only. No historical hours persistence.

### What we need
A rolling 12-week array of snapshots, one per week:
```typescript
interface WeeklySnapshot {
  weekStart: string;       // YYYY-MM-DD (Monday)
  hours: number;           // Total hours that week
  aiPct: number;           // Midpoint AI% ((aiPctLow + aiPctHigh) / 2)
  brainliftHours: number;  // BrainLift hours
}
```

### Data sources for historical weeks
- **Earnings**: ✅ already in `earnings_history_v1` — the `trend` array
- **Hours**: Must compute from payments. `paidHours` from the payments API is available per week. When `useEarningsHistory` fetches payments, `paidHours` is available per `Payment` object. We can store hours alongside earnings.
- **AI%**: Available in `ai_cache` for current week. For past weeks, we need to save a snapshot when the week rolls over.
- **BrainLift**: Same as AI% — available from current week's `ai_cache`.

### Snapshot flush timing
The natural flush point is when `useAIData` detects it's a new week (Monday). It already does `getMondayOfWeek(today)` and compares to cached dates. On a new week, before purging the old cache, save the AI%+BrainLift snapshot.

### Hours per week from payments
`useEarningsHistory` already fetches `GET /api/v3/users/current/payments?from=...&to=...`. Each `Payment` object has `paidHours` field. We can extend `earnings_history_v1` → `weekly_history_v2` to store `{ earnings, hours }` per week, or maintain a separate `weekly_history_v2` store.

**Chosen approach**: New `weekly_history_v2` key. Stores `WeeklySnapshot[]`. `useEarningsHistory` writes earnings + paidHours. `useAIData` writes AI% + BrainLift on weekly flush. These writes merge into the same key by `weekStart`.

---

## Key Decisions

**Decision 1: Single AsyncStorage key `weekly_history_v2`**
→ All 4 metrics stored together per week. Two hooks write to it independently (merged by weekStart). Reader (`useWeeklyHistory`) just reads and returns the array.

**Decision 2: Merge-write pattern**
→ Both `useEarningsHistory` and `useAIData` write partial updates: earnings hook writes `{ weekStart, earnings, hours }`; AI hook writes `{ weekStart, aiPct, brainliftHours }`. A shared helper `mergeWeeklySnapshot(existing, partial)` merges fields by weekStart.

**Decision 3: Rolling 12-week window**
→ On every write, trim the array to the last 12 unique weekStart values. Sort by weekStart ascending.

**Decision 4: `useWeeklyHistory` hook**
→ Read-only hook. Loads from AsyncStorage on mount. Re-reads when a `refreshKey` changes (hooks that write to the store trigger refresh via a simple `useState` counter pattern or TanStack Query invalidation).

**Decision 5: Missing data handled gracefully**
→ Weeks where only partial data is available (e.g. AI% flushed but hours not yet) use 0 as fallback. The overview charts treat 0 as "no data" and render a flat segment or skip the bar.

**Decision 6: Current week included**
→ The snapshot array always includes the current (in-progress) week, derived from live data in `useAIData` and `useHoursData`. The hook combines persisted history + current week live data.

---

## Interface Contracts

```typescript
// src/lib/weeklyHistory.ts — NEW pure functions
interface WeeklySnapshot {
  weekStart: string;          // YYYY-MM-DD (Monday)
  hours: number;              // 0 if unknown
  earnings: number;           // 0 if unknown
  aiPct: number;              // 0 if unknown
  brainliftHours: number;     // 0 if unknown
}

const WEEKLY_HISTORY_KEY = 'weekly_history_v2';
const WEEKLY_HISTORY_MAX = 12;

function mergeWeeklySnapshot(
  history: WeeklySnapshot[],
  partial: Partial<WeeklySnapshot> & { weekStart: string },
): WeeklySnapshot[]
// Finds existing entry for weekStart, merges fields, appends if new,
// trims to WEEKLY_HISTORY_MAX weeks (oldest dropped), sorts ascending.

function loadWeeklyHistory(): Promise<WeeklySnapshot[]>
function saveWeeklyHistory(snapshots: WeeklySnapshot[]): Promise<void>

// src/hooks/useWeeklyHistory.ts — NEW hook
function useWeeklyHistory(): {
  snapshots: WeeklySnapshot[];   // Persisted history (up to 12 weeks)
  isLoading: boolean;
}
// Reads from AsyncStorage 'weekly_history_v2' on mount
// Does NOT include current in-progress week (caller combines with live data)

// Writes trigger (useEarningsHistory):
// After fetching Payment[], for each week found:
//   mergeWeeklySnapshot(history, { weekStart, earnings: amount, hours: paidHours })

// Writes trigger (useAIData):
// On new week detection (Monday flush), before clearing ai_cache:
//   const prevWeekStart = getMondayOfWeek(lastCacheDate)
//   mergeWeeklySnapshot(history, { weekStart: prevWeekStart, aiPct, brainliftHours })
```

### Source Tracing

| Field | Source |
|-------|--------|
| `hours` per week | `Payment.paidHours` via `/api/v3/users/current/payments` |
| `earnings` per week | `Payment.amount` aggregated by `periodStartDate` |
| `aiPct` per week | `aggregateAICache().aiPctLow + aiPctHigh) / 2` on weekly flush |
| `brainliftHours` per week | `aggregateAICache().brainliftHours` on weekly flush |
| `weekStart` | `getMondayOfWeek(date)` from `ai.ts` |

---

## Test Plan

### `mergeWeeklySnapshot`

**Happy Path:**
- [ ] New weekStart appended to empty history
- [ ] Existing weekStart merges fields (earnings updated, aiPct added)
- [ ] History trimmed to 12 entries when exceeding limit (oldest dropped)
- [ ] Result sorted ascending by weekStart

**Edge Cases:**
- [ ] Empty history + partial → `[{ weekStart, ...partial, rest: 0 }]`
- [ ] 13 entries → trim to 12 (oldest removed)
- [ ] Partial with only `aiPct` field → other fields unchanged for existing entry
- [ ] Same weekStart written twice → second write wins for written fields

### `loadWeeklyHistory` / `saveWeeklyHistory`

**Happy Path:**
- [ ] Save then load returns same data
- [ ] Load from empty AsyncStorage → `[]`

**Edge Cases:**
- [ ] Corrupted AsyncStorage value → returns `[]` gracefully (try/catch)

### `useWeeklyHistory` hook

**Happy Path:**
- [ ] Returns `{ snapshots: WeeklySnapshot[], isLoading: boolean }`
- [ ] `isLoading` is true before AsyncStorage resolves, false after
- [ ] Returns empty array on first-ever launch (no persisted data)

**Edge Cases:**
- [ ] Returns `[]` if AsyncStorage throws

---

## Files to Reference

- `src/hooks/useEarningsHistory.ts` — existing earnings history pattern (AsyncStorage + merge)
- `src/hooks/useAIData.ts` — ai_cache structure, weekly flush detection, getMondayOfWeek
- `src/lib/ai.ts` — aggregateAICache, DailyTagData
- `src/lib/hours.ts` — getWeekStartDate utility
- `src/lib/aiCone.ts` — not needed directly, but AIWeekData fields reference
