# Spec Research: My Requests Data Layer

**Date:** 2026-03-15
**Author:** @trilogy
**Spec:** `01-my-requests-data`

---

## Problem Context

Contributors have no way to see the status of their own submitted manual time requests. The work diary API already returns status fields on manual slots (`autoTracker === false`, `status: PENDING | APPROVED | REJECTED`, `memo`, `actions`), but nothing currently fetches or exposes this data in a contributor-friendly shape.

This spec creates the data layer: a hook that fetches the current week's work diary, groups manual slots into logical request entries, and returns typed data ready for the UI.

---

## Exploration Findings

### Existing Patterns

| Pattern | Used In | Notes |
|---------|---------|-------|
| Per-day work diary fetch | `src/hooks/useAIData.ts` | Fetches Mon–today, one call per day, uses `fetchWorkDiary(assignmentId, date, credentials, useQA)` |
| TanStack Query hook | All data hooks | `useQuery` with `queryKey`, `queryFn`, `staleTime` |
| Credential loading | `useApprovalItems.ts`, `useAIData.ts` | Load from AsyncStorage + SecureStore via `loadConfig()` |
| Role guard in hook | `useApprovalItems.ts` | Returns empty if contributor (`if (!config.isManager) return []`) |

### Key Files

| File | Relevance |
|------|-----------|
| `src/hooks/useAIData.ts` | Exact pattern to follow: per-day work diary fetch, credential loading, TanStack Query |
| `src/api/workDiary.ts` | `fetchWorkDiary(assignmentId, date, credentials, useQA)` — returns `WorkDiarySlot[]` |
| `src/types/api.ts` | `WorkDiarySlot` type — has `autoTracker`, `status`, `memo`, `actions`, `tags` |
| `src/hooks/useApprovalItems.ts` | Pattern for loading credentials + calling multiple APIs |

### Integration Points

- Reads `assignmentId` from config (same as `useAIData`)
- Calls `fetchWorkDiary` per day for Mon–today of current week
- Filters `slot.autoTracker === false` to isolate manual entries
- Groups slots into request entries by `(date, memo)` — multiple 10-min slots belong to one submission

---

## Key Decisions

### Decision 1: Grouping Strategy for Manual Slots

Manual time is submitted as multiple 10-minute slots sharing the same `memo`. A contributor submitting "2h of infrastructure work" creates 12 slots all with `memo: "infrastructure work"` on the same date.

**Options considered:**
1. Group by `(date, memo)` — combines all slots for a given description on a given day into one entry
2. Show individual slots — too granular, confusing UX (user thinks of it as one submission)
3. Group by `actions[0].createdDate` (submission timestamp) — more precise but requires parsing nested arrays

**Chosen:** Group by `(date, memo)` — simple and matches user mental model.

**Rationale:** Users submit "2 hours on Monday with memo X" as a unit. Showing 12 separate 10-min slots would be confusing. If a user submits two different memos on the same day, they appear as two entries.

### Decision 2: Status Aggregation for Grouped Entries

When grouping slots, their statuses should agree. But in edge cases (partial approval), they may differ.

**Options considered:**
1. Use the status of the first slot in the group (simple, usually correct)
2. Use the "worst" status: if any slot is REJECTED, entry is REJECTED; if any PENDING, entry is PENDING; otherwise APPROVED
3. Show a mix indicator (complex, unnecessary for MVP)

**Chosen:** Option 2 — worst-case status.

**Rationale:** If any slot is rejected, the user needs to know. This prevents false "APPROVED" display.

### Decision 3: Date Range

**Options considered:**
1. Current week only (Mon–today)
2. Rolling 7 days
3. Last 2 weeks (to show older pending items)

**Chosen:** Current week (Mon–today), matching `useAIData` date range behavior.

**Rationale:** Manual time is submitted weekly and reviewed weekly. Older submissions are already resolved. Matches the user's mental context — "what did I submit this week?"

---

## Interface Contracts

### Types

```typescript
// src/types/requests.ts

export type ManualRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ManualRequestEntry {
  id: string;                    // "{date}|{memo}" — stable key for FlatList
  date: string;                  // YYYY-MM-DD
  durationMinutes: number;       // slot count × 10
  memo: string;                  // description submitted by contributor
  status: ManualRequestStatus;   // worst-case across grouped slots
  rejectionReason: string | null; // from actions array when status === REJECTED
}

export interface UseMyRequestsResult {
  entries: ManualRequestEntry[];  // sorted by date desc
  isLoading: boolean;
  error: string | null;           // 'auth' | 'network' | null
  refetch: () => void;
}
```

### Function Contracts

| Function | Signature | Responsibility | Dependencies |
|----------|-----------|----------------|--------------|
| `groupSlotsIntoEntries` | `(slots: WorkDiarySlot[], date: string) => ManualRequestEntry[]` | Filter autoTracker===false, group by memo, compute status + duration | `WorkDiarySlot` from `src/types/api.ts` |
| `extractRejectionReason` | `(actions: SlotAction[]) => string \| null` | Find REJECT_MANUAL_TIME action and return its comment | — |
| `useMyRequests` | `() => UseMyRequestsResult` | TanStack Query hook, fetches Mon–today work diary, returns typed entries | `fetchWorkDiary`, `loadConfig` |

---

## Test Plan

### `groupSlotsIntoEntries`

**Signature:** `(slots: WorkDiarySlot[], date: string) => ManualRequestEntry[]`

**Happy Path:**
- Two slots with same memo → grouped into one entry with combined duration
- Three distinct memos on same date → three separate entries
- Entry duration: 3 slots × 10min = 30 minutes

**Edge Cases:**
- Empty slots array: returns `[]`
- All slots are autoTracker=true: returns `[]` (filtered out)
- Memo is empty string: grouped under `""` memo
- Single slot: returns one entry with 10-min duration

**Error Cases:**
- Slot has undefined memo: treat as empty string, don't throw

**Mocks Needed:**
- `WorkDiarySlot`: construct test fixtures with varying `autoTracker`, `memo`, `status` values

### `extractRejectionReason`

**Signature:** `(actions: SlotAction[]) => string | null`

**Happy Path:**
- Action with `actionType === "REJECT_MANUAL_TIME"` → returns its `comment`
- No reject action → returns `null`

**Edge Cases:**
- Empty actions array: returns `null`
- Multiple actions, only one is rejection: returns rejection comment
- Comment is empty string: returns `null`

### `useMyRequests`

**Signature:** `() => UseMyRequestsResult`

**Happy Path:**
- Returns entries sorted by date descending
- Fetches Mon–today (correct date range for current week)
- Groups slots correctly across multiple days

**Edge Cases:**
- Start of week (Mon): fetches only 1 day
- No manual entries this week: returns `entries: []`
- All entries approved: all APPROVED status

**Error Cases:**
- Auth failure: `error: 'auth'`, `entries: []`
- Network failure: `error: 'network'`, `entries: []`
- Partial day failure: skip failed days, show available data

**Mocks Needed:**
- `fetchWorkDiary`: mock to return known slot arrays per date
- `loadConfig`: mock to return test config with `assignmentId`

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/types/requests.ts` | create | `ManualRequestEntry`, `ManualRequestStatus`, `UseMyRequestsResult` types |
| `src/lib/requestsUtils.ts` | create | `groupSlotsIntoEntries`, `extractRejectionReason` pure functions |
| `src/hooks/useMyRequests.ts` | create | TanStack Query hook, fetches work diary, returns typed entries |

---

## Edge Cases to Handle

1. **Week start on Monday** — `getWeekStartDate()` exists in codebase; use it for consistent Mon date
2. **Today is Monday** — only fetch 1 day, no prior days to include
3. **Slots with conflicting status in same group** — use worst-case: REJECTED > PENDING > APPROVED
4. **assignmentId missing** — guard in hook, return empty with no error (config not fully set up)
5. **Duplicate memo across different dates** — each date+memo combo is a separate entry (id includes date)

---

## Open Questions

None remaining.
