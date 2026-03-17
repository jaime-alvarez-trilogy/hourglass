# Spec Research: 01-widget-activation

## Problem Context

The `06-widgets` spec implemented all widget UI code (`src/widgets/bridge.ts`, `types.ts`, iOS/Android widgets). But widgets never receive data because:

1. npm packages (`expo-widgets`, `react-native-android-widget`) are not installed — widgets cannot compile
2. `app.json` plugin config was stripped (commit `b0106ee`) after packages failed to resolve
3. `src/lib/crossoverData.ts` → `fetchFreshData()` is a stub that throws
4. `src/lib/widgetBridge.ts` is a stub with the wrong signature — takes `CrossoverSnapshot` (stub type) but the real bridge needs `(HoursData, AIWeekData | null, pendingCount, CrossoverConfig)`
5. No foreground update path exists — widgets only update via background push (which is also broken)

## Exploration Findings

### What Already Exists (do not re-implement)

- `src/widgets/bridge.ts` — real `updateWidgetData(hoursData, aiData, pendingCount, config)`, `buildTimelineEntries()`, `readWidgetData()` ✅
- `src/widgets/types.ts` — `WidgetData` interface ✅
- `src/widgets/ios/HourglassWidget.tsx` — expo-widgets JSX (small/medium/large) ✅
- `src/widgets/android/HourglassWidget.tsx` + `widgetTaskHandler.ts` ✅
- `src/notifications/handler.ts` — background push handler, calls `fetchFreshData()` → `updateWidgetData()` ✅ (wiring is correct; stubs need replacement)
- `server/` — Railway ping server, dispatches silent push every 15min ✅

### app.json State

Current `app.json` has:
- iOS App Group entitlement already set: `"group.com.jalvarez0907.hourglass.widgets"` ✅
- `UIBackgroundModes: ["remote-notification", "fetch"]` ✅
- Missing: `expo-widgets` plugin entry
- Missing: `react-native-android-widget` plugin entry

The plugin config that was removed (from git history) was:
```json
["expo-widgets", {
  "ios": {
    "widgets": [{ "name": "HourglassWidget", "file": "src/widgets/ios/HourglassWidget" }]
  }
}],
["react-native-android-widget", {
  "widgets": [{ "name": "HourglassWidget", "label": "Hourglass" }],
  "widgetTaskHandler": "./src/widgets/android/widgetTaskHandler"
}]
```
(Verify exact plugin options against package docs before using — these may have changed.)

### API Client Layer (all pure async, no React)

- `src/api/client.ts` — `getAuthToken(username, password, useQA)`, `apiGet<T>()`, `apiPut<T>()`
- `src/api/timesheet.ts` — `fetchTimesheet(config, token)` → `TimesheetResponse | null` (3-strategy fallback)
- `src/api/payments.ts` — `fetchPayments(config, token)` → `PaymentsResponse | null` (UTC week boundaries)
- `src/api/workDiary.ts` — `fetchWorkDiary(assignmentId, date, credentials, useQA)` → `WorkDiarySlot[]` (calls getAuthToken internally)
- `src/api/approvals.ts` — `fetchPendingManual(token, useQA, weekStartDate)`, `fetchPendingOvertime(token, useQA, weekStartDate)` (manager-only, 403 for contributors)

### Config/Credentials Layer (all pure async)

- `src/store/config.ts` — `loadConfig()`, `loadCredentials()`, `saveConfig()`, `saveCredentials()`
- Credentials stored in SecureStore (keys: `crossover_username`, `crossover_password`)
- Config stored in AsyncStorage (key: `crossover_config`)

### Pure Calculation Functions

- `src/lib/hours.ts` — `calculateHours(timesheetData, paymentsData, hourlyRate, weeklyLimit) → HoursData`
- `src/lib/hours.ts` — `getWeekStartDate(useUTC: boolean) → string` (use `true` for API calls — never `toISOString()` on local dates)
- `src/lib/ai.ts` — `countDiaryTags(slots: WorkDiarySlot[]) → TagData`
- `src/lib/ai.ts` — `aggregateAICache(cache: Record<string, TagData>, today: string) → AIWeekData`
- `src/lib/approvals.ts` — `parseManualItems(raw, weekStartDate)`, `parseOvertimeItems(raw)`

### Critical ID Mapping

| Field | Source | Used For |
|-------|--------|----------|
| `config.userId` | userAvatars[CANDIDATE].id | Timesheet API |
| `config.assignmentId` | assignment.id | Work diary API |
| `config.managerId` | assignment.manager.id | Timesheet API (manager) |
| `config.primaryTeamId` | assignment.team.id | Timesheet API (manager) |
| `config.hourlyRate` | assignment.salary | earnings fallback |
| `config.isManager` | avatarTypes.includes("MANAGER") | guard approval calls |

### AI Cache Strategy for fetchFreshData

The `ai_cache` AsyncStorage key stores `Record<YYYY-MM-DD, TagData>` — one TagData per workday. `fetchFreshData()` should:
1. Read existing `ai_cache` from AsyncStorage (has Mon–yesterday data, already computed by React hooks)
2. Fetch today's work diary fresh via `fetchWorkDiary(config.assignmentId, today, credentials, useQA)`
3. Merge today's fresh tags into the cache snapshot
4. Call `aggregateAICache(mergedCache, today)` → `AIWeekData`

This gives accurate weekly AI% (using cached past days + fresh today) without fetching the full week. `fetchFreshData()` does NOT write back to `ai_cache` — the React hooks own that key.

### CrossoverSnapshot Redesign

The current stub has an unusable simple type. Replace with:

```typescript
// src/lib/crossoverData.ts
export interface CrossoverSnapshot {
  hoursData: HoursData;
  aiData: AIWeekData | null;
  pendingCount: number;      // pending approvals count (0 for contributors)
  config: CrossoverConfig;
}
```

`handler.ts` already calls `updateWidgetData(freshData)` — this continues to work.

### widgetBridge.ts Fix

Replace stub body:
```typescript
// src/lib/widgetBridge.ts
import { updateWidgetData as _updateWidgetData } from '../widgets/bridge';
import type { CrossoverSnapshot } from './crossoverData';

export async function updateWidgetData(data: CrossoverSnapshot): Promise<void> {
  await _updateWidgetData(data.hoursData, data.aiData, data.pendingCount, data.config);
}
```

### useWidgetSync Hook Design

```typescript
// src/hooks/useWidgetSync.ts
export function useWidgetSync(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig | null
): void
```

- `useEffect` with deps `[hoursData, pendingCount, config]`
- Only fires when `hoursData !== null && config !== null`
- Calls `updateWidgetData(hoursData, aiData, pendingCount, config)` from `src/widgets/bridge.ts` directly (not via stub)
- Errors are swallowed with `console.error` — widget sync failure must never crash the app

Wire in `app/(tabs)/_layout.tsx`:
- Already has access to `useConfig()`
- Add `useHoursData()`, `useAIData()`, `useApprovalItems()`, then `useWidgetSync()`

## Key Decisions

1. **`fetchFreshData` reads ai_cache but does not write it** — keeps separation of concerns; React hooks own cache writes
2. **`widgetBridge.ts` becomes a thin wrapper** — `handler.ts` doesn't change at all; only the stub body is replaced
3. **`useWidgetSync` calls `widgets/bridge` directly** — bypasses the `lib/widgetBridge.ts` wrapper (which uses `CrossoverSnapshot`); the hook has the individual pieces already
4. **Errors in `useWidgetSync` are swallowed** — widget sync failure must not crash or disrupt the UI
5. **No AI data for background fetch if cache is cold** — if `ai_cache` is empty (first launch), `fetchFreshData` fetches today only; `aggregateAICache` will have 1 day of data; widget shows a rough AI% which is fine
6. **Foreground hook wired at tab layout level** — `(tabs)/_layout.tsx` is always mounted when in main app; better than per-screen wiring

## Interface Contracts

### `src/lib/crossoverData.ts`

```typescript
export interface CrossoverSnapshot {
  hoursData: HoursData;           // ← calculateHours(timesheetData, paymentsData, rate, limit)
  aiData: AIWeekData | null;      // ← aggregateAICache(cache + today, today); null if fetch fails
  pendingCount: number;           // ← manualItems.length + overtimeItems.length; 0 if !isManager
  config: CrossoverConfig;        // ← loadConfig() result
}

export async function fetchFreshData(): Promise<CrossoverSnapshot>
// throws if loadConfig() → null
// throws if loadCredentials() → null
// throws AuthError if token fetch fails
// fetchTimesheet/fetchPayments failures are caught; calculateHours(null, null, ...) returns zeros
// work diary fetch failure → aiData: null
// approval fetch failure → pendingCount: 0 (non-fatal for managers)
```

### `src/lib/widgetBridge.ts`

```typescript
import type { CrossoverSnapshot } from './crossoverData';

export async function updateWidgetData(data: CrossoverSnapshot): Promise<void>
// delegates to widgets/bridge.updateWidgetData(data.hoursData, data.aiData, data.pendingCount, data.config)
```

### `src/hooks/useWidgetSync.ts`

```typescript
import type { HoursData } from '../lib/hours';
import type { AIWeekData } from '../lib/ai';
import type { CrossoverConfig } from '../types/config';

export function useWidgetSync(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,     // ← from useAIData().data (ok if null)
  pendingCount: number,
  config: CrossoverConfig | null
): void
// useEffect deps: [hoursData, pendingCount, config]
// guard: hoursData === null || config === null → no-op
// calls updateWidgetData(hoursData, aiData, pendingCount, config) from src/widgets/bridge
// catches and console.errors any thrown error
```

## Test Plan

### FR1: Package installation + app.json config

No unit tests. Verified by `expo config --type introspect` showing both plugins, and `npx expo prebuild` succeeding without errors.

### FR2: `fetchFreshData()`

**File:** `src/__tests__/lib/crossoverData.test.ts`

**Mocks needed:**
- `../../store/config` → `loadConfig`, `loadCredentials`
- `../../api/client` → `getAuthToken`
- `../../api/timesheet` → `fetchTimesheet`
- `../../api/payments` → `fetchPayments`
- `../../api/workDiary` → `fetchWorkDiary`
- `../../api/approvals` → `fetchPendingManual`, `fetchPendingOvertime`
- `@react-native-async-storage/async-storage` → `getItem`
- `../../lib/hours` → `calculateHours`, `getWeekStartDate`
- `../../lib/ai` → `countDiaryTags`, `aggregateAICache`
- `../../lib/approvals` → `parseManualItems`, `parseOvertimeItems`

**Happy path:**
- [ ] Returns `CrossoverSnapshot` with `hoursData`, `aiData`, `pendingCount`, `config`
- [ ] Calls `getAuthToken` with credentials from `loadCredentials()`
- [ ] Fetches timesheet and payments in parallel (both `Promise.all` calls)
- [ ] Calls `calculateHours` with timesheet + payments data
- [ ] Reads `ai_cache` from AsyncStorage, merges with today's fresh work diary slots
- [ ] Calls `aggregateAICache` with merged cache
- [ ] Manager: calls `fetchPendingManual` + `fetchPendingOvertime`, returns sum as `pendingCount`
- [ ] Non-manager (`config.isManager = false`): skips approval fetch, `pendingCount = 0`

**Edge cases:**
- [ ] `loadConfig()` returns null → throws with a known error message
- [ ] `loadCredentials()` returns null → throws with a known error message
- [ ] `fetchTimesheet` throws → `calculateHours` called with `null` timesheet (partial data, no total throw)
- [ ] `fetchPayments` throws → `calculateHours` called with `null` payments (partial data, no total throw)
- [ ] `fetchWorkDiary` throws → `aiData` is `null` in snapshot (non-fatal)
- [ ] `AsyncStorage.getItem('ai_cache')` returns null → empty cache; aggregates today's fresh data only
- [ ] `fetchPendingManual` throws (manager) → `pendingCount = 0`, no throw from `fetchFreshData`

### FR3: `widgetBridge.ts` stub replacement

**File:** `src/__tests__/lib/widgetBridge.test.ts`

**Mocks needed:**
- `../../widgets/bridge` → `updateWidgetData` (the real one)

**Tests:**
- [ ] Calls `widgets/bridge.updateWidgetData` with `data.hoursData`, `data.aiData`, `data.pendingCount`, `data.config`
- [ ] Awaits and resolves when real bridge resolves
- [ ] Rejects when real bridge rejects (propagates error)

### FR4: `useWidgetSync` hook

**File:** `src/__tests__/hooks/useWidgetSync.test.ts`

**Mocks needed:**
- `../../widgets/bridge` → `updateWidgetData`
- `renderHook` from `@testing-library/react-native`

**Tests:**
- [ ] Calls `updateWidgetData` on first render when `hoursData` and `config` are non-null
- [ ] Does NOT call `updateWidgetData` when `hoursData` is null
- [ ] Does NOT call `updateWidgetData` when `config` is null
- [ ] Calls `updateWidgetData` again when `hoursData` changes (new reference)
- [ ] Calls `updateWidgetData` again when `pendingCount` changes
- [ ] Passes `aiData = null` to `updateWidgetData` when `aiData` is null (not blocked)
- [ ] Does not throw when `updateWidgetData` rejects (error is swallowed)

### FR5: Wire `useWidgetSync` into `(tabs)/_layout.tsx`

No dedicated unit tests (wiring is thin). Verified by:
- [ ] Smoke: open app in Expo Go → widget AsyncStorage key `widget_data` is written within 5s of data loading

## Files to Reference

- `hourglassws/src/widgets/bridge.ts` — real updateWidgetData signature
- `hourglassws/src/widgets/types.ts` — WidgetData interface
- `hourglassws/src/lib/crossoverData.ts` — current stub to replace
- `hourglassws/src/lib/widgetBridge.ts` — current stub to replace
- `hourglassws/src/notifications/handler.ts` — consumes fetchFreshData + updateWidgetData (do not change)
- `hourglassws/src/api/client.ts` — getAuthToken, apiGet
- `hourglassws/src/api/timesheet.ts` — fetchTimesheet
- `hourglassws/src/api/payments.ts` — fetchPayments
- `hourglassws/src/api/workDiary.ts` — fetchWorkDiary
- `hourglassws/src/api/approvals.ts` — fetchPendingManual, fetchPendingOvertime
- `hourglassws/src/store/config.ts` — loadConfig, loadCredentials
- `hourglassws/src/lib/hours.ts` — calculateHours, getWeekStartDate, HoursData type
- `hourglassws/src/lib/ai.ts` — countDiaryTags, aggregateAICache, AIWeekData type, TagData type
- `hourglassws/src/lib/approvals.ts` — parseManualItems, parseOvertimeItems
- `hourglassws/src/types/config.ts` — CrossoverConfig type
- `hourglassws/app/(tabs)/_layout.tsx` — where useWidgetSync is wired
- `hourglassws/src/hooks/useHoursData.ts` — reference for HoursData usage pattern
- `hourglassws/src/hooks/useAIData.ts` — reference for AIWeekData usage pattern
- `hourglassws/src/hooks/useApprovalItems.ts` — reference for pendingCount derivation
- `WS/features/app/hourglass-expo/specs/06-widgets/spec.md` — original widget spec (for context)

## Session Notes

**2026-03-17**: Research complete.
- All widget code exists in `src/widgets/` (bridge.ts, types.ts, iOS, Android, task handler)
- Ping server exists in `server/`
- Two stubs block the background path: `crossoverData.ts` and `widgetBridge.ts`
- No foreground update hook exists
- Packages not installed (expo-widgets, react-native-android-widget)
- app.json App Group entitlement already present; only plugin entries missing
- All API functions needed for fetchFreshData are pure async (no React) — ready to use
