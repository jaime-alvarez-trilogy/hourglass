# 04-ai-brainlift

**Status:** Draft
**Created:** 2026-03-08
**Last Updated:** 2026-03-08
**Owner:** @trilogy

---

## Overview

This spec builds the AI & BrainLift feature for the HourglassWS Expo app. It covers fetching the Crossover work diary API by day, parsing slot tags to compute AI usage percentage and BrainLift session hours, caching results in AsyncStorage keyed by date, and rendering a dedicated AI tab screen with weekly summary cards and a daily breakdown list.

### What is being built

Three layers compose this feature:

1. **API layer** (`src/api/workDiary.ts`) — A single typed function `fetchWorkDiary(assignmentId, date, credentials, useQA)` that calls `GET /api/timetracking/workdiaries?assignmentId={assignmentId}&date=YYYY-MM-DD`. Uses the centralized `apiGet` client from the foundation spec. Returns a flat array of `WorkDiarySlot` objects.

2. **Business logic** (`src/lib/ai.ts`) — Three pure functions ported from `hourglass.js`:
   - `countDiaryTags(slots)` — counts AI-related tags for a single day's slots
   - `aggregateAICache(cache, today)` — aggregates Mon–today cache entries into weekly summary with AI% formula
   - `shouldRefetchDay(date, cached, isToday)` — determines whether a given day needs a fresh API call

3. **Data hook** (`src/hooks/useAIData.ts`) — A React Query hook that reads from AsyncStorage first (instant display), then background-fetches stale/missing days from the API, and updates the cache. Exposes `data`, `isLoading`, `lastFetchedAt`, `error`, and `refetch`.

4. **UI** (`app/(tabs)/ai.tsx`) — The AI & BrainLift screen with:
   - AI% summary card (XX%–YY% range, progress bar toward 75% target)
   - BrainLift card (X.Xh / 5h target with progress bar)
   - Daily breakdown list (Mon–today, per-day AI% and BL slot count)
   - Legend explaining tag meanings
   - Pull-to-refresh

### Why it exists

Crossover contributors are measured on AI tool adoption (target: 75% of tagged work diary slots) and BrainLift usage (target: 5h/week). The existing Scriptable widget computes these metrics but cannot display them in a rich UI with breakdowns or targets. This spec makes the metrics visible, browsable, and actionable on both iOS and Android.

### How it works

At runtime:

1. The `useAIData` hook loads `ai_cache` from AsyncStorage. If cached data exists, it calls `aggregateAICache` immediately, giving instant display without a loading spinner.
2. The hook then evaluates each day from Monday to today using `shouldRefetchDay`. Days that need refreshing (missing, total===0, or today) are fetched in parallel from the work diary API.
3. Fresh slot arrays are passed through `countDiaryTags` and stored back to AsyncStorage keyed by date (e.g., `{ '2026-03-03': { total: 31, aiUsage: 24, secondBrain: 3, noTags: 4 } }`).
4. After all fetches complete, `aggregateAICache` is called again on the merged cache to produce the final `AIWeekData`.
5. The cache is pruned to the current Mon–Sun window on each load to prevent stale pre-Monday entries from leaking into the aggregation.
6. `_lastFetchedAt` (ISO timestamp) is stored alongside the daily entries and surfaced in the UI as a subtle "last updated" indicator.

---

## Out of Scope

1. **Widget rendering of AI% and BrainLift data** — The native home screen widgets (iOS and Android) that surface AI% and BrainLift hours are out of scope here. This spec produces the data layer (`useAIData`, `ai_cache` in AsyncStorage) that the widget spec will consume. **Deferred to 06-widgets.**

2. **Historical data beyond the current week** — `aggregateAICache` only processes Mon–today of the current week. No multi-week history, trend charts, or week-over-week comparison is built in this spec. **Descoped:** Not part of v1 feature scope (noted in FEATURE.md Out of Scope).

3. **Writing or modifying work diary slots** — This spec fetches and reads slots only. Creating manual time entries, adding tags to slots, or editing existing entries via the API is not part of this screen. **Descoped:** No such capability exists in the contributor-facing Crossover app.

4. **Manager-only work diary operations** — The manager-facing manual time approval flow (approve/reject timecards) uses different API endpoints and belongs to the manager approvals spec. **Deferred to 05-manager-approvals.**

5. **Push notifications for AI% milestones** — Alerting the user when their AI% drops below target, or celebrating 75%+ achievement, is not included. **Descoped:** Notification infrastructure is post-v1; push setup is in 07-ping-server but notification logic for thresholds is unscheduled.

6. **Per-slot tag editing UI** — No screen for viewing individual 10-minute slots or editing their tags is built here. **Descoped:** The Crossover web app is the authoritative source for tagging; the mobile app is read-only for this data.

7. **Silent ping server integration** — Background refresh via silent push notifications is defined in spec 07-ping-server. This spec handles in-app refresh (pull-to-refresh and stale cache detection) only. **Deferred to 07-ping-server.**

8. **Earnings data on the AI screen** — Hourly rate, weekly earnings, and deadline countdown are dashboard-layer concerns. **Deferred to 03-hours-dashboard.**

---

## Functional Requirements

### FR1: WorkDiarySlot Type

The `WorkDiarySlot` interface must be defined and exported from `src/types/api.ts`. It represents a single 10-minute tracked slot returned by the Crossover work diary API.

```typescript
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
}
```

**Success Criteria:**
- `WorkDiarySlot` is exported from `src/types/api.ts`
- `tags` is typed as `string[]` (not `any[]`)
- `status` is a union type, not `string`
- TypeScript rejects a slot object with `status: 'UNKNOWN'` at compile time
- `memo` is typed as `string`

---

### FR2: TagData and AI Types

The following interfaces must be defined and exported from `src/lib/ai.ts`:

```typescript
export interface TagData {
  total: number;       // count of ALL slots that day
  aiUsage: number;     // slots with ai_usage OR second_brain (union)
  secondBrain: number; // slots with exact tag "second_brain"
  noTags: number;      // slots with empty tags array
}

export interface AIWeekData {
  aiPctLow: number;          // Math.max(0, Math.round(aiPct - 2))
  aiPctHigh: number;         // Math.min(100, Math.round(aiPct + 2))
  brainliftHours: number;    // totalSecondBrain * 10 / 60
  totalSlots: number;        // sum of all daily totals
  taggedSlots: number;       // totalSlots - totalNoTags
  workdaysElapsed: number;   // days with total > 0
  dailyBreakdown: DailyTagData[];
}

export interface DailyTagData {
  date: string;        // YYYY-MM-DD
  total: number;
  aiUsage: number;
  secondBrain: number;
  noTags: number;
  isToday: boolean;    // computed at aggregation time
}
```

**Success Criteria:**
- All three interfaces exported from `src/lib/ai.ts`
- `AIWeekData.dailyBreakdown` is typed as `DailyTagData[]`
- `aiPctLow` and `aiPctHigh` are `number`
- `brainliftHours` is `number` (fractional hours, e.g. `4.167`)
- TypeScript rejects assignment of `string` to `TagData.total`

---

### FR3: countDiaryTags

`countDiaryTags(slots: WorkDiarySlot[]): TagData` is exported from `src/lib/ai.ts`.

The function must:
1. Count every slot with `tags.includes('ai_usage') || tags.includes('second_brain')` into `aiUsage`
2. Count every slot with `tags.includes('second_brain')` (exact match) into `secondBrain`
3. Count every slot with `tags.length === 0` into `noTags`
4. Set `total` to `slots.length`
5. Return `{ total, aiUsage, secondBrain, noTags }`

**Critical rules:**
- Slot with BOTH `ai_usage` AND `second_brain` → counted once in `aiUsage` (union, not addition)
- `"not_second_brain"` must NOT increment `secondBrain` (exact tag match, not substring)
- `"not_second_brain"` must NOT increment `aiUsage`
- Case-sensitive: `"AI_USAGE"` does not match `"ai_usage"`
- Empty array input → returns `{ total: 0, aiUsage: 0, secondBrain: 0, noTags: 0 }`

**Success Criteria:**
- Given slots `[{tags:['ai_usage']}, {tags:['second_brain']}, {tags:[]}, {tags:['ai_usage','second_brain']}]`:
  - `total === 4`
  - `aiUsage === 3`
  - `secondBrain === 2`
  - `noTags === 1`
- Slot with `tags: ['not_second_brain']` → `aiUsage === 0`, `secondBrain === 0`, `noTags === 0`
- Slot with `tags: ['AI_USAGE']` → `aiUsage === 0`
- Empty array → all fields zero

---

### FR4: aggregateAICache

`aggregateAICache(cache: Record<string, TagData>, today: string): AIWeekData` is exported from `src/lib/ai.ts`.

The function must:
1. Determine Monday of the week containing `today`
2. Iterate only dates from Monday to `today` (inclusive), skipping future dates and pre-Monday dates
3. Compute:
   - `totalSlots` = sum of all `entry.total`
   - `totalAiUsage` = sum of all `entry.aiUsage`
   - `totalSecondBrain` = sum of all `entry.secondBrain`
   - `totalNoTags` = sum of all `entry.noTags`
   - `taggedSlots` = `totalSlots - totalNoTags`
   - `workdaysElapsed` = count of days where `entry.total > 0`
4. Apply AI% formula:
   - `aiPct = taggedSlots > 0 ? (totalAiUsage / taggedSlots) * 100 : 0`
   - `aiPctLow = Math.max(0, Math.round(aiPct - 2))`
   - `aiPctHigh = Math.min(100, Math.round(aiPct + 2))`
5. `brainliftHours = totalSecondBrain * 10 / 60`
6. Build `dailyBreakdown` with `isToday: date === today` for each entry

**Success Criteria:**
- Only processes Mon–today; pre-Monday and future dates excluded
- `taggedSlots = totalSlots - totalNoTags`
- `brainliftHours` for 30 second_brain slots = `5.0`
- `aiPctLow` clamped at 0 (not negative)
- `aiPctHigh` clamped at 100 (not over 100)
- Empty cache → all zeros, empty `dailyBreakdown`
- No division by zero when `taggedSlots === 0`
- `isToday` is `true` only for today's entry

---

### FR5: shouldRefetchDay

`shouldRefetchDay(date: string, cached: TagData | undefined, isToday: boolean): boolean` is exported from `src/lib/ai.ts`.

Returns `true` if ANY of:
- `cached === undefined`
- `cached.total === 0`
- `isToday === true`

Returns `false` only for past days with `cached.total > 0`.

**Success Criteria:**
- Returns `true` when `cached === undefined`
- Returns `true` when `cached.total === 0`
- Returns `true` when `isToday === true`, regardless of cached value
- Returns `false` when `isToday === false` and `cached.total > 0`
- Does not throw on `undefined` cached argument

---

### FR6: fetchWorkDiary

`fetchWorkDiary(assignmentId: string, date: string, credentials: Credentials, useQA: boolean): Promise<WorkDiarySlot[]>` is exported from `src/api/workDiary.ts`.

The function must:
1. Call `getAuthToken(credentials.username, credentials.password, useQA)` for a fresh token
2. Call `apiGet<WorkDiarySlot[]>('/api/timetracking/workdiaries', { assignmentId, date }, token, useQA)`
3. Return the typed response array
4. Propagate `AuthError` and `NetworkError` without catching them

**Success Criteria:**
- Uses `assignmentId` parameter (NOT `userId`)
- Date format is `YYYY-MM-DD` (passed through as-is, no conversion)
- Returns typed `WorkDiarySlot[]`
- `AuthError` from `getAuthToken` propagates to caller
- `AuthError` from `apiGet` propagates to caller
- Does not hardcode base URL — uses `useQA` flag via `apiGet`

---

### FR7: AI Cache — AsyncStorage

The `useAIData` hook must persist tag data in AsyncStorage under key `'ai_cache'`.

Cache schema:
```typescript
type AICache = Record<string, TagData> & { _lastFetchedAt?: string }
```

Rules:
- Load cache on mount: `AsyncStorage.getItem('ai_cache')`, parse JSON
- After each fetch batch: merge new `TagData` entries, set `_lastFetchedAt = new Date().toISOString()`
- Prune on load: remove entries for dates outside Mon–Sun of the current week
- Save with `AsyncStorage.setItem('ai_cache', JSON.stringify(cache))`

**Success Criteria:**
- Cache key is exactly `'ai_cache'`
- `_lastFetchedAt` updated after each successful fetch batch
- Entries outside current Mon–Sun window are pruned on load
- Cache survives app restart (read from AsyncStorage on mount)
- Merging new data does not overwrite un-fetched days

---

### FR8: useAIData Hook

`useAIData(): { data: AIWeekData | null, isLoading: boolean, lastFetchedAt: string | null, error: string | null, refetch: () => void }` is exported from `src/hooks/useAIData.ts`.

The hook must:
1. Read `config` from `useConfig()` to get `assignmentId`, `useQA`
2. Load AI cache from AsyncStorage; immediately call `aggregateAICache` on cached data for instant display
3. Evaluate Mon–today with `shouldRefetchDay`; fetch stale/missing days in parallel via `Promise.all`
4. Merge fresh data, save to AsyncStorage, re-aggregate
5. Surface `lastFetchedAt` from `cache._lastFetchedAt`
6. On `AuthError` → set `error` to `'auth'`
7. On `NetworkError` → set `error` to `'network'`
8. `refetch()` → forces re-fetch of today + any zero-total days

**Success Criteria:**
- `data` populated from cache before API calls complete
- `isLoading` is `false` after first render from cache
- `lastFetchedAt` reflects `cache._lastFetchedAt`
- `error` is `null` on success; `'auth'` on `AuthError`; `'network'` on `NetworkError`
- `refetch()` triggers a fresh data load
- Returns `{ data: null, isLoading: false, error: null, ... }` when `config` is `null`

---

### FR9: AI Screen

`app/(tabs)/ai.tsx` is the AI & BrainLift tab screen.

The screen must render:

1. **Header** — Title "AI & BrainLift"
2. **AI% card** — `{aiPctLow}%–{aiPctHigh}%` with progress bar toward 75% target
3. **BrainLift card** — `{brainliftHours.toFixed(1)}h / 5h` with progress bar
4. **Daily breakdown** — Scrollable list, Mon–today. Each row: date label, per-day AI% (or "—"), BL slots (or "—")
5. **Legend** — Explains AI% and BrainLift calculation
6. **Pull-to-refresh** — Calls `refetch()`
7. **Error state** — Auth error shows re-login prompt; network error shows retry message
8. **Empty state** — Shown when `data === null` and not loading

**Success Criteria:**
- Screen renders without crash when `data === null`
- AI% displayed as `"{low}%–{high}%"`
- BrainLift displayed as `"{hours.toFixed(1)}h / 5h"`
- Pull-to-refresh calls `refetch()`
- Daily rows show "—" when no tagged slots (no NaN in UI)
- Error states visible and actionable

---

### FR10: Tab Registration

The AI screen must be registered as a tab in `app/(tabs)/_layout.tsx`.

**Success Criteria:**
- Tab labeled "AI" with an appropriate icon
- Navigating to the tab renders `app/(tabs)/ai.tsx`
- No TypeScript errors in `_layout.tsx`
- Existing tabs continue to work

---

## Technical Design

### Files to Reference

- `/Users/Trilogy/Documents/Claude Code/WS/hourglass.js` — `countDiaryTags()`, `aggregateAICache()`, cache pruning, `shouldRefetchDay` logic
- `/Users/Trilogy/Documents/Claude Code/WS/memory/MEMORY.md` — "Work Diary Slot Tags" and "AI% Formula" sections
- `/Users/Trilogy/Documents/Claude Code/WS/docs/AI_VALIDATION.md` — formula validation results
- `/Users/Trilogy/Documents/Claude Code/WS/hourglassws/src/api/client.ts` — `apiGet`, `getAuthToken`
- `/Users/Trilogy/Documents/Claude Code/WS/hourglassws/src/store/config.ts` — `loadCredentials` import pattern
- `/Users/Trilogy/Documents/Claude Code/WS/hourglassws/src/hooks/useConfig.ts` — hook pattern to follow

### Files to Create/Modify

```
hourglassws/
  src/
    types/
      api.ts                  ← ADD WorkDiarySlot interface
    lib/
      ai.ts                   ← NEW: TagData, AIWeekData, DailyTagData types +
                                  countDiaryTags, aggregateAICache, shouldRefetchDay
    api/
      workDiary.ts            ← NEW: fetchWorkDiary
    hooks/
      useAIData.ts            ← NEW: useAIData hook
    components/
      AIProgressBar.tsx       ← NEW: progress bar with target marker
      DailyAIRow.tsx          ← NEW: daily breakdown row

  app/
    (tabs)/
      ai.tsx                  ← NEW: AI & BrainLift screen
      _layout.tsx             ← MODIFY: add AI tab

  __tests__/
    lib/
      ai.test.ts              ← NEW: tests for pure functions
    api/
      workDiary.test.ts       ← NEW: tests for fetchWorkDiary
    hooks/
      useAIData.test.ts       ← NEW: tests for hook
```

### Data Flow

```
App renders AI tab
       │
       ▼
useAIData() mounts
       │
       ├─ AsyncStorage.getItem('ai_cache') → parse → pruneToCurrentWeek()
       │         │
       │         ▼
       │   aggregateAICache(cache, today) → AIWeekData
       │   → set data (instant render, no spinner)
       │
       ▼
Evaluate Mon–today with shouldRefetchDay()
       │
       ├─ days needing fetch: [YYYY-MM-DD list]
       │
       ▼
Promise.all(days.map(date =>
  fetchWorkDiary(assignmentId, date, credentials, useQA)
    .then(slots => countDiaryTags(slots))
    .then(tagData => merge into cache)
))
       │
       ▼
cache._lastFetchedAt = new Date().toISOString()
AsyncStorage.setItem('ai_cache', JSON.stringify(cache))
       │
       ▼
aggregateAICache(mergedCache, today) → AIWeekData
→ set data (updated render)
→ isLoading = false
```

### Week Boundary Logic

The week boundary is **Mon–Sun**. Monday of the current week:

```typescript
function getMondayOfWeek(today: string): string {
  const d = new Date(today + 'T00:00:00'); // local time, not UTC
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
```

**Important:** Use `new Date(dateStr + 'T00:00:00')` (no Z suffix) to stay in local timezone. Never use `new Date(dateStr)` alone — spec parsing may interpret as UTC midnight, shifting the date by timezone offset.

### Cache Pruning Logic

```typescript
function pruneToCurrentWeek(
  raw: Record<string, TagData | string>,
  today: string
): Record<string, TagData> {
  const monday = getMondayOfWeek(today);
  const d = new Date(monday + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  const sunday = d.toISOString().slice(0, 10);
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([k]) => k !== '_lastFetchedAt' && k >= monday && k <= sunday)
  ) as Record<string, TagData>;
}
```

### Edge Cases

1. **All slots untagged** — `taggedSlots === 0`. `aggregateAICache` returns `aiPctLow: 0, aiPctHigh: 0`. No NaN.

2. **API returns empty array** — `countDiaryTags([])` returns all zeros. `shouldRefetchDay` returns `true` again next load (total === 0). Intentional: transient API errors shouldn't cache zero.

3. **`not_second_brain` exact match** — Always use `tags.includes('second_brain')`, never `tags.some(t => t.includes('second_brain'))`.

4. **Null config** — `useAIData` returns `{ data: null, isLoading: false, error: null, lastFetchedAt: null, refetch: () => {} }` when `config === null`.

5. **Date formatting** — All cache keys and API params use `YYYY-MM-DD` in local timezone. Never `toISOString()` for local date formatting.

6. **Concurrent refetch** — `refetch()` must not start a second fetch chain if one is already in-flight. Use a `isFetching` guard.
