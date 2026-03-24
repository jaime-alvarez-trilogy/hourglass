# 11-app-data-layer

**Status:** Draft
**Created:** 2026-03-23
**Last Updated:** 2026-03-23

---

## Overview

This spec builds the data layer for the AI App Breakdown feature. WorkSmart automatically classifies each 10-minute work diary slot as AI or non-AI based on tag heuristics. Each slot's raw `events[]` array includes `processName` (the OS process name), but the current codebase discards this data immediately after `countDiaryTags()` runs. This spec captures it before discard.

### What Is Being Built

**New library: `src/lib/aiAppBreakdown.ts`**
- `AppBreakdownEntry` interface (per-app aggregated slot counts)
- `extractAppBreakdown(slots)` — pure function, same input as `countDiaryTags`, returns per-app breakdown
- `mergeAppBreakdown(existing, additions)` — accumulates breakdown arrays by summing matching app names
- `loadAppHistory()` / `saveAppHistory()` — AsyncStorage helpers for the `ai_app_history` key
- `APP_HISTORY_KEY` constant and `AppHistoryCache` type

**New hook: `src/hooks/useAppBreakdown.ts`**
- `useAppBreakdown()` — reads the cache, exposes `currentWeek`, `aggregated12w`, `isReady`

**Type extension: `src/types/api.ts`**
- `WorkDiaryEvent` interface added
- `WorkDiarySlot.events?: WorkDiaryEvent[]` optional field added

**Hook modifications**
- `useAIData` — after fetching each day's slots, also calls `extractAppBreakdown` and writes current-week totals to `ai_app_history`
- `useHistoryBackfill` — after fetching each past week's slots, writes that week's app breakdown to `ai_app_history`

### How It Works

Both `useAIData` and `useHistoryBackfill` already fetch `WorkDiarySlot[]` from the API. The `events[]` array is present in the API response but never typed or used. This spec:
1. Adds the TypeScript type for `events[]`
2. Adds a new pure function that processes those events alongside the existing `countDiaryTags` call
3. Accumulates results per-week in a new `ai_app_history` AsyncStorage key
4. Exposes the data via a new read-only hook for the UI layer (spec 12)

**Zero new API calls** — freshness matches AI% freshness naturally.

### Storage Design

```
ai_app_history: Record<string, AppBreakdownEntry[]>
  key = Monday YYYY-MM-DD (week start)
  value = AppBreakdownEntry[] sorted by (aiSlots + nonAiSlots) descending
```

Stored separately from `weekly_history_v2` to avoid migrating the shared `WeeklySnapshot` type.

---

## Out of Scope

1. **Per-day app breakdown storage** — `ai_app_history` stores weekly aggregates only (keyed by Monday). Per-day would 7x the storage and add UI complexity with no clear benefit.
   - **Descoped:** Weekly granularity is sufficient for both current-week and 12-week aggregate views.

2. **`AppBreakdownCard` UI component** — Visual rendering of app breakdown bars, AI vs non-AI slots per app.
   - **Deferred to 12-app-breakdown-ui:** Spec `12-app-breakdown-ui` owns all UI components for this feature.

3. **Guidance chip generation** — Rule-based logic that produces 1–3 actionable text chips from the breakdown data.
   - **Deferred to 12-app-breakdown-ui:** `generateGuidance()` pure function is defined in spec `12-app-breakdown-ui`.

4. **Integration into `ai.tsx`** — Wiring `AppBreakdownCard` between the Daily Breakdown and Trajectory cards.
   - **Deferred to 12-app-breakdown-ui:** Screen-level integration is part of the UI spec.

5. **Sorting/filtering controls** — UI toggles to sort by AI slots, total slots, or app name.
   - **Descoped:** Initial version is sorted by total slots descending. No controls planned.

6. **Push notifications for AI% changes** — Alerting users when AI% drops below threshold.
   - **Descoped:** Not part of this feature.

7. **Modifying `WeeklySnapshot`** — Adding `appBreakdown` to the shared `WeeklySnapshot` type in `weeklyHistory.ts`.
   - **Descoped:** The separate `ai_app_history` key keeps concerns isolated and avoids migration risk to the shared type used by earnings history, AI backfill, and overview.

8. **`useAppBreakdown` real-time event subscription** — Live push updates when `ai_app_history` changes.
   - **Descoped:** The hook reads on mount. UI-layer refresh is sufficient; data is written only during fetch cycles that already trigger re-renders.

---

## Functional Requirements

### FR1: Extend WorkDiarySlot Type

Add `WorkDiaryEvent` interface and optional `events` field to `WorkDiarySlot`.

**Success Criteria:**
- `WorkDiaryEvent` interface exists in `src/types/api.ts` with fields: `processName: string`, `idle: boolean`, `activity: string`
- `WorkDiarySlot` has optional `events?: WorkDiaryEvent[]` field
- TypeScript compilation passes with no new errors
- Existing consumers of `WorkDiarySlot` are unaffected (optional field, no breaking change)

---

### FR2: extractAppBreakdown Pure Function

New exported function `extractAppBreakdown(slots: WorkDiarySlot[]): AppBreakdownEntry[]` in `src/lib/aiAppBreakdown.ts`.

**Logic:**
- For each slot: skip if `events` is absent or empty
- Collect unique `processName` values from `slot.events[]` (filter falsy/empty strings)
- Determine AI tag: `hasAi = slot.tags.includes('ai_usage') || slot.tags.includes('second_brain')`
- Determine BrainLift tag: `hasSb = slot.tags.includes('second_brain')`
- For each unique app in the slot:
  - If `hasAi`: increment `aiSlots`
  - If `hasSb`: increment `brainliftSlots`
  - If `!hasAi`: increment `nonAiSlots`
- Return array sorted by `(aiSlots + nonAiSlots)` descending
- Pure function — no side effects, no I/O

**Success Criteria:**
- Slots with `ai_usage` tag: apps increment `aiSlots`, not `nonAiSlots`
- Slots with `second_brain` tag: apps increment both `aiSlots` and `brainliftSlots`
- Slots with no AI tag: apps increment `nonAiSlots` only
- Multiple apps in one slot: each unique app gets +1 independently (no double-count within slot)
- Slot with absent `events` → skipped entirely
- Slot with empty `events` array → skipped entirely
- Event with empty/falsy `processName` → filtered out
- Same app appearing in both AI and non-AI slots → accumulates in both `aiSlots` and `nonAiSlots` correctly
- Output sorted by `aiSlots + nonAiSlots` descending
- Empty input → returns `[]`
- All slots without events → returns `[]`

---

### FR3: mergeAppBreakdown Pure Function

New exported function `mergeAppBreakdown(existing: AppBreakdownEntry[], additions: AppBreakdownEntry[]): AppBreakdownEntry[]` in `src/lib/aiAppBreakdown.ts`.

**Logic:**
- For each entry in `additions`: if `appName` found in `existing`, sum `aiSlots`, `brainliftSlots`, `nonAiSlots`; otherwise append as new entry
- Return sorted by `(aiSlots + nonAiSlots)` descending
- Does not mutate input arrays

**Success Criteria:**
- Matching `appName` entries are merged by summing all three slot counts
- New apps in `additions` not present in `existing` are appended
- Output sorted by total slots descending
- Empty `existing` + non-empty `additions` → returns `additions` sorted
- Non-empty `existing` + empty `additions` → returns `existing` sorted
- Both empty → returns `[]`
- Input arrays are not mutated

---

### FR4: AsyncStorage Helpers (loadAppHistory / saveAppHistory)

New exported functions and constants in `src/lib/aiAppBreakdown.ts`:

```typescript
export const APP_HISTORY_KEY = 'ai_app_history';
export type AppHistoryCache = Record<string, AppBreakdownEntry[]>;

export async function loadAppHistory(): Promise<AppHistoryCache>
export async function saveAppHistory(cache: AppHistoryCache): Promise<void>
```

**loadAppHistory logic:**
- Calls `AsyncStorage.getItem(APP_HISTORY_KEY)`
- Missing key → returns `{}`
- Valid JSON object → returns parsed value
- Invalid JSON → returns `{}`
- AsyncStorage error → returns `{}`
- Never throws

**saveAppHistory logic:**
- Calls `AsyncStorage.setItem(APP_HISTORY_KEY, JSON.stringify(cache))`
- Propagates AsyncStorage errors to caller

**Success Criteria:**
- Missing key returns `{}`
- Valid stored JSON is parsed and returned
- Invalid JSON returns `{}`
- AsyncStorage read error returns `{}`
- `saveAppHistory` writes JSON-serialized cache under `APP_HISTORY_KEY`
- `saveAppHistory` propagates write errors (does not swallow them)

---

### FR5: useAIData Integration

Modify `src/hooks/useAIData.ts` to write current-week app breakdown after each fetch cycle.

**Insert point:** In the `Promise.all` results processing (after `countDiaryTags(slots)` on line 213), also call `extractAppBreakdown(slots)` per day. After the loop, merge all per-day results and save to `ai_app_history`.

**Logic:**
- The `Promise.all` map must retain raw `slots` alongside `tagData` in the result shape
- For each fetched day's result, call `extractAppBreakdown(slots)`
- Reduce per-day results via `mergeAppBreakdown` into a single weekly batch
- Load existing `ai_app_history`, merge batch into `cache[currentMonday]`, save back
- Fire-and-forget — write failure must not affect AI% display state

**Success Criteria:**
- After fetching work diary for current week, `ai_app_history[currentMonday]` is populated
- Partial-week data is merged (not replaced) if the key already exists
- Write failure is silent (does not affect `data`, `isLoading`, or `error` state)
- No additional API calls made

---

### FR6: useHistoryBackfill Integration

Modify `src/hooks/useHistoryBackfill.ts` to write past-week app breakdown during backfill.

**Insert point:** In the `Promise.allSettled` result loop (after `countDiaryTags(result.value)` on line 138), also call `extractAppBreakdown(result.value)` per fulfilled day. After the full week is processed, merge and save to `ai_app_history`.

**Logic:**
- A parallel `slotsData: Record<string, WorkDiarySlot[]>` must be maintained alongside `dayData: Record<string, TagData>`
- For each fulfilled day, store raw slots in `slotsData[dates[i]]`
- After the week's `Promise.allSettled`, reduce `slotsData` via `extractAppBreakdown` + `mergeAppBreakdown`
- Load `ai_app_history`, update that week's entry, save back
- Fire-and-forget — write failure must not affect backfill of `weekly_history_v2`

**Success Criteria:**
- After backfilling a past week, `ai_app_history[weekMonday]` is populated
- Write failures are silent
- No additional API calls made
- Runs once per session (same guard as existing backfill logic)

---

### FR7: useAppBreakdown Hook

New exported hook in `src/hooks/useAppBreakdown.ts`.

```typescript
export interface AppBreakdownResult {
  currentWeek: AppBreakdownEntry[];
  aggregated12w: AppBreakdownEntry[];
  isReady: boolean;
}
export function useAppBreakdown(): AppBreakdownResult
```

**Logic:**
- On mount, loads `ai_app_history` via `loadAppHistory()`
- Derives `currentWeek` from `cache[currentMonday]` (empty array if not found)
- Derives `aggregated12w` by reducing all weeks in the cache with `mergeAppBreakdown`
- Sets `isReady = true` once AsyncStorage read completes (success or error)
- No API calls
- `currentMonday` computed in local timezone using `getMondayOfWeek` from `src/lib/ai`

**Success Criteria:**
- Returns `isReady: false` before AsyncStorage load completes
- Returns `isReady: true` after load (even if cache is empty)
- `currentWeek` reflects `cache[currentMonday]` or `[]`
- `aggregated12w` is the merge of all weeks in the cache
- Load error → `isReady: true`, both arrays empty (graceful degradation)
- No API calls made

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/types/api.ts` | `WorkDiarySlot` interface to extend |
| `hourglassws/src/lib/ai.ts` | `countDiaryTags` pattern — same input, parallel output |
| `hourglassws/src/hooks/useAIData.ts:204–219` | Insert point: `Promise.all` result loop |
| `hourglassws/src/hooks/useHistoryBackfill.ts:124–149` | Insert point: `Promise.allSettled` result loop |
| `hourglassws/src/lib/weeklyHistory.ts` | Pattern for `load/save/merge` AsyncStorage helpers |
| `tools/test-ai-tag-analysis.js:72–83` | Confirms `events[].processName` field shape in real API |

### Files to Create

| File | Contents |
|------|----------|
| `hourglassws/src/lib/aiAppBreakdown.ts` | `AppBreakdownEntry`, `extractAppBreakdown`, `mergeAppBreakdown`, `loadAppHistory`, `saveAppHistory`, `APP_HISTORY_KEY`, `AppHistoryCache` |
| `hourglassws/src/hooks/useAppBreakdown.ts` | `AppBreakdownResult`, `useAppBreakdown` |
| `hourglassws/src/lib/__tests__/aiAppBreakdown.test.ts` | Unit tests for all pure functions and AsyncStorage helpers |
| `hourglassws/src/hooks/__tests__/useAppBreakdown.test.ts` | Unit tests for the hook |

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/src/types/api.ts` | Add `WorkDiaryEvent` interface; add `events?: WorkDiaryEvent[]` to `WorkDiarySlot` |
| `hourglassws/src/hooks/useAIData.ts` | FR5: retain slots in Promise.all results, call `extractAppBreakdown`, write `ai_app_history` |
| `hourglassws/src/hooks/useHistoryBackfill.ts` | FR6: maintain parallel `slotsData` map, call `extractAppBreakdown`, write `ai_app_history` |

### Data Flow

```
GET /api/timetracking/workdiaries → WorkDiarySlot[]
        │
        ├─ countDiaryTags(slots) → TagData         [existing path]
        │        └─ stored in ai_cache
        │
        └─ extractAppBreakdown(slots) → AppBreakdownEntry[]   [new path]
                 │
                 ├─ useAIData: merge current week → save ai_app_history[currentMonday]
                 └─ useHistoryBackfill: merge past week → save ai_app_history[weekMonday]
                              │
                              ▼
                   loadAppHistory() → AppHistoryCache
                              │
                              ▼
                   useAppBreakdown() → { currentWeek, aggregated12w, isReady }
                              │
                              ▼
                   AppBreakdownCard (spec 12)
```

### Interface Contracts

#### WorkDiaryEvent
```typescript
// src/types/api.ts
export interface WorkDiaryEvent {
  processName: string;  // OS process name (e.g. "Cursor", "Slack")
  idle: boolean;
  activity: string;     // "AI" | "PURE_AI" | "OTHER"
}
```

#### WorkDiarySlot (extended)
```typescript
// src/types/api.ts — events field added
export interface WorkDiarySlot {
  tags: string[];
  autoTracker: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  memo: string;
  actions: Array<{
    actionType: string;
    comment: string;
    actionMadeBy: number;
    createdDate: string;
  }>;
  events?: WorkDiaryEvent[];  // NEW: absent on manual time entries
}
```

#### AppBreakdownEntry
```typescript
// src/lib/aiAppBreakdown.ts
export interface AppBreakdownEntry {
  appName: string;        // slot.events[n].processName
  aiSlots: number;        // slots with (ai_usage OR second_brain) containing this app
  brainliftSlots: number; // slots with second_brain tag (strict subset of aiSlots)
  nonAiSlots: number;     // slots without AI tag containing this app
}
```

#### AppHistoryCache
```typescript
export const APP_HISTORY_KEY = 'ai_app_history';
export type AppHistoryCache = Record<string, AppBreakdownEntry[]>;
// key = Monday YYYY-MM-DD
```

### Key Implementation Details

#### extractAppBreakdown: unique apps per slot
```typescript
// Inside the slot loop:
const uniqueApps = new Set(
  (slot.events ?? [])
    .map(e => e.processName)
    .filter(Boolean)
);
if (uniqueApps.size === 0) continue; // skip slot
```
Using a `Set` ensures that if the same app appears multiple times in one slot's events, it only gets one count per slot.

#### useAIData integration: retain raw slots in Promise.all

The existing map returns `{ date, tagData }`. It must be extended to also return `slots`:

```typescript
const results = await Promise.all(
  daysToFetch.map(async (date) => {
    const slots = await fetchWorkDiary(...);
    return { date, tagData: countDiaryTags(slots), slots };
  }),
);
```

After the existing merge loop, fire-and-forget app breakdown write:

```typescript
const weekBreakdown = results.reduce<AppBreakdownEntry[]>(
  (acc, { slots }) => mergeAppBreakdown(acc, extractAppBreakdown(slots)),
  [],
);
loadAppHistory().then(hist => {
  const existing = hist[currentMonday] ?? [];
  return saveAppHistory({
    ...hist,
    [currentMonday]: mergeAppBreakdown(existing, weekBreakdown),
  });
}).catch(() => {});
```

#### useHistoryBackfill integration: parallel slotsData map

Within the per-week loop, maintain a parallel `slotsData` map:

```typescript
const slotsData: Record<string, WorkDiarySlot[]> = {};

for (let i = 0; i < results.length; i++) {
  const result = results[i];
  if (result.status === 'fulfilled' && Array.isArray(result.value)) {
    dayData[dates[i]] = countDiaryTags(result.value);
    slotsData[dates[i]] = result.value;  // retain for app breakdown
  }
}

// After computeWeekAI(dayData) and saveWeeklyHistory:
const weekBreakdown = Object.values(slotsData).reduce<AppBreakdownEntry[]>(
  (acc, slots) => mergeAppBreakdown(acc, extractAppBreakdown(slots)),
  [],
);
loadAppHistory().then(hist => {
  const existing = hist[monday] ?? [];
  return saveAppHistory({
    ...hist,
    [monday]: mergeAppBreakdown(existing, weekBreakdown),
  });
}).catch(() => {});
```

### Edge Cases

| Case | Handling |
|------|---------|
| Manual time slot (no events) | `extractAppBreakdown` skips it (events absent/empty) |
| Event with empty processName | Filtered out via `.filter(Boolean)` |
| `ai_app_history` key missing | `loadAppHistory` returns `{}` gracefully |
| Corrupt JSON in `ai_app_history` | `loadAppHistory` returns `{}` |
| `saveAppHistory` throws | Caller catches silently (fire-and-forget) |
| `useAppBreakdown` load error | Returns `isReady: true`, both arrays empty |
| All slots in a week have no events | `ai_app_history[weekMonday]` = `[]` (valid empty state) |
| `aggregated12w` on empty cache | Returns `[]` (reduce identity) |

### Test Approach

**Pure functions** (`extractAppBreakdown`, `mergeAppBreakdown`): no mocks needed — plain TypeScript objects.

**AsyncStorage helpers** (`loadAppHistory`, `saveAppHistory`): use the existing `@react-native-async-storage/async-storage` mock (already present in `hourglassws/__mocks__/`).

**`useAppBreakdown`**: use `renderHook` from `@testing-library/react-native` with the AsyncStorage mock.

**Integration tests for `useAIData` and `useHistoryBackfill`**: mock `fetchWorkDiary`/`apiGet` to return slots with events, then assert `AsyncStorage.setItem` was called with the expected `ai_app_history` JSON payload.
