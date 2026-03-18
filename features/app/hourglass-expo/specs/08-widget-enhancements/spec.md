# 08-widget-enhancements

**Status:** Draft
**Created:** 2026-03-18
**Last Updated:** 2026-03-18
**Owner:** @trilogy

---

## Overview

### What Is Being Built

Three capabilities are being added to the existing Hourglass home screen widget system, which was established in spec 06-widgets:

1. **Daily bar chart** — the iOS large widget (`systemLarge`) gains a Mon–Sun bar chart in hours mode, mirroring the data already shown on the dashboard screen. Each day's bar is proportional to hours worked; today's bar uses the urgency accent color.

2. **Manager approval mode-switch** — when a manager has pending approvals (manual time or overtime), the widget replaces the hours layout with a compact action view: a mini hero line showing total hours and earnings, followed by up to 2 (medium) or 4 (large) approval items. The widget background shifts to a dark amber tint to signal urgency.

3. **Contributor request status mode-switch** — contributors with pending or recent manual time requests see their request status (PENDING / APPROVED / REJECTED) in a compact list. Background tint is dark violet for pending or dark crimson for rejected.

4. **Action-mode background tint** — the widget background color changes based on the current mode and role. Hours mode always uses the standard dark brand background `#0D0C14`. This is computed in `buildWidgetData` and stored as `actionBg` in `WidgetData`.

### How It Works

The existing widget data pipeline runs:

```
HoursData + AIData + pendingCount + config
  → buildWidgetData()   [bridge.ts]
  → WidgetData snapshot
  → iOS timeline entries OR Android AsyncStorage
```

This spec extends the pipeline in two places:

- **Data layer (`bridge.ts`)**: `buildWidgetData` gains two new parameters (`approvalItems`, `myRequests`) and produces three new output fields (`daily`, `approvalItems`, `myRequests`) plus `actionBg`. Three internal helper functions are added: `buildDailyEntries`, `formatApprovalItems`, `formatMyRequests`.

- **Widget layout layer**: The `WIDGET_LAYOUT_JS` string (iOS) and `MediumWidget` React component (Android) are updated to read the new fields and branch between hours mode and action mode.

The `useWidgetSync` hook, `widgetBridge.ts` wrapper, and `CrossoverSnapshot` type each gain two optional parameters (`approvalItems?`, `myRequests?`) that default to `[]`, preserving backward compatibility with all existing call sites.

### Scope

- iOS: small (unchanged), medium (mode-switch), large (mode-switch + bar chart)
- Android: small (unchanged), medium (mode-switch)
- No new screens, no new API endpoints, no lock screen variants

---

## Out of Scope

1. **Lock screen / accessory widget variants** — Descoped: lock screen variants (accessoryRectangular, accessoryCircular, accessoryInline) are not in scope for this enhancement. The existing implementations in bridge.ts are not modified.

2. **Android large widget bar chart** — Descoped: `react-native-android-widget` does not support a large widget size. Android medium gets the mode-switch only.

3. **Siri / widget intent actions (approve from widget)** — Descoped: approving or rejecting from the widget surface requires iOS App Intents integration, which is a separate non-trivial effort with no assigned spec.

4. **Web dashboard widget** — Descoped: not part of the Expo app scope in v1 (per FEATURE.md).

5. **Historical data beyond the current week** — Descoped: `HoursData.daily` covers Mon–Sun of the current week only. Multi-week trend views are out of scope per FEATURE.md.

6. **Team-level analytics** — Descoped: per-team breakdowns are out of scope for v1.

7. **Android small widget mode-switch** — Descoped: the small widget on both platforms is intentionally left unchanged. At ~158pt tall it cannot accommodate the compact action view.

8. **Contributor approved requests older than 7 days** — Descoped: if all requests are APPROVED and older than 7 days the widget shows hours view (nothing urgent). This filter is applied in `formatMyRequests` / `buildWidgetData`; the app does not surface old approved items.

---

## Functional Requirements

---

### FR1: Extend WidgetData type with new fields

**File:** `src/widgets/types.ts`

Add three new widget-specific types and extend the `WidgetData` interface with four new fields.

**New types:**

```typescript
export interface WidgetDailyEntry {
  day: string;      // "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
  hours: number;    // 0–24, rounded to 1 decimal
  isToday: boolean;
}

export interface WidgetApprovalItem {
  id: string;
  name: string;              // fullName, max 18 chars (truncated with "…")
  hours: string;             // "2.5h"
  category: 'MANUAL' | 'OVERTIME';
}

export interface WidgetMyRequest {
  id: string;
  date: string;              // "Mon Mar 18" formatted
  hours: string;             // "1.5h"
  memo: string;              // max 18 chars (truncated with "…")
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
```

**Extended WidgetData (additive — no breaking changes to existing fields):**

```typescript
// Added to existing WidgetData interface:
daily: WidgetDailyEntry[];           // always 7 entries, Mon[0]–Sun[6]
approvalItems: WidgetApprovalItem[]; // max 3; [] for contributors
myRequests: WidgetMyRequest[];       // max 3; [] for managers
actionBg: string | null;            // hex tint or null (hours mode)
```

**Success Criteria:**
- `WidgetDailyEntry`, `WidgetApprovalItem`, `WidgetMyRequest` are exported from `types.ts`
- `WidgetData` interface compiles without error after adding the four new fields
- No existing fields are modified or removed
- TypeScript strict mode passes

---

### FR2: Add data-transformation helpers to bridge.ts

**File:** `src/widgets/bridge.ts`

Three new internal helper functions transform app data into widget-ready shapes.

#### `buildDailyEntries(daily: DailyEntry[]): WidgetDailyEntry[]`

- Returns exactly 7 entries in Mon[0]–Sun[6] order
- For each day Mon–Sun: finds matching entry in `daily` by day-of-week; uses 0 if absent
- `day` label: `['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][dayIndex]`
- `hours`: `entry.hours` rounded to 1 decimal, or 0
- `isToday`: true if `entry.isToday` is true (propagated from HoursData)
- Missing days (no entry) → `{ day, hours: 0, isToday: false }`

**Success Criteria:**
- Empty `daily` array → all 7 entries have `hours: 0, isToday: false`
- Week with Mon–Wed filled → Mon/Tue/Wed have correct hours, Thu–Sun are 0
- `isToday` is true on exactly one entry (or zero if today is outside the week)
- Out-of-order input returns entries in Mon[0]–Sun[6] order
- Sunday entry is at index 6

#### `formatApprovalItems(items: ApprovalItem[], maxCount: number): WidgetApprovalItem[]`

- Returns at most `maxCount` items from the start of `items`
- Maps `ManualApprovalItem` → category `'MANUAL'`, name from `fullName`, hours from `item.hours`
- Maps `OvertimeApprovalItem` → category `'OVERTIME'`, name from `fullName`, hours from `item.hours`
- Truncates `name` to 18 chars: if `fullName.length > 18`, use `fullName.slice(0, 17) + '…'`
- Preserves `id` from original item

**Success Criteria:**
- 5 items, maxCount=3 → returns first 3 items only
- Empty array → returns `[]`
- `fullName` exactly 18 chars → no truncation
- `fullName` 19+ chars → truncated to 17 + '…' (18 chars total)
- ManualApprovalItem → `category: 'MANUAL'`
- OvertimeApprovalItem → `category: 'OVERTIME'`

#### `formatMyRequests(entries: ManualRequestEntry[], maxCount: number): WidgetMyRequest[]`

- Returns at most `maxCount` entries from the start of `entries`
- Maps `date` ("YYYY-MM-DD") → `"Ddd Mmm D"` format (e.g. "Tue Mar 18")
- Maps `durationMinutes` → `hours` string: `(durationMinutes / 60).toFixed(1) + 'h'`
- Truncates `memo` to 18 chars: if `memo.length > 18`, use `memo.slice(0, 17) + '…'`
- `status` passed through unchanged
- Preserves `id` from original entry

**Success Criteria:**
- "2026-03-18" → "Tue Mar 18"
- Empty array → returns `[]`
- `memo` exactly 18 chars → no truncation
- `memo` 19+ chars → truncated to 17 + '…'
- 5 entries, maxCount=3 → first 3 returned
- status PENDING / APPROVED / REJECTED all pass through

---

### FR3: Extend buildWidgetData with new parameters

**File:** `src/widgets/bridge.ts`

Update the `buildWidgetData` function signature and return value.

**New signature:**

```typescript
function buildWidgetData(
  hoursData: HoursData,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig,
  approvalItems: ApprovalItem[],
  myRequests: ManualRequestEntry[],
  now?: number
): WidgetData
```

**New fields in returned WidgetData:**

- `daily` ← `buildDailyEntries(hoursData.daily)`
- `approvalItems` ← `formatApprovalItems(approvalItems, 3)` if `config.isManager`, else `[]`
- `myRequests` ← `formatMyRequests(myRequests, 3)` if not `config.isManager`, else `[]`
- `pendingCount` ← `config.isManager ? approvalItems.length : 0` (derived, replaces passed-in value)
- `actionBg` ← derived from role + item states:
  - manager + `approvalItems.length > 0` → `'#1C1400'`
  - contributor + any request has `status === 'REJECTED'` → `'#1C0A0E'`
  - contributor + any request has `status === 'PENDING'` (no rejected) → `'#120E1A'`
  - otherwise → `null`

**Success Criteria:**
- Returns `daily` with 7 entries when `hoursData.daily` has data
- Manager: `approvalItems` capped at 3, `myRequests` is `[]`
- Contributor: `myRequests` capped at 3, `approvalItems` is `[]`
- `pendingCount` derived from `approvalItems.length`, not the passed-in `pendingCount` parameter
- Manager with approvals → `actionBg === '#1C1400'`
- Contributor with REJECTED request → `actionBg === '#1C0A0E'`
- Contributor with PENDING request (no rejected) → `actionBg === '#120E1A'`
- No pending items → `actionBg === null`

---

### FR4: Update updateWidgetData signature (bridge.ts)

**File:** `src/widgets/bridge.ts`

Extend `updateWidgetData` to accept and forward the two new optional parameters.

**New signature:**

```typescript
export async function updateWidgetData(
  hoursData: HoursData,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig,
  approvalItems?: ApprovalItem[],
  myRequests?: ManualRequestEntry[]
): Promise<void>
```

- Forwards `approvalItems ?? []` and `myRequests ?? []` to `buildWidgetData`
- All existing behavior unchanged (AsyncStorage write + iOS timeline update)

**Success Criteria:**
- Calling without `approvalItems`/`myRequests` defaults both to `[]`
- All new fields (`daily`, `approvalItems`, `myRequests`, `actionBg`) are included in the written WidgetData
- iOS: `buildTimelineEntries` still called with resulting data
- Android: JSON snapshot still written to AsyncStorage `widget_data`

---

### FR5: Update useWidgetSync hook

**File:** `src/hooks/useWidgetSync.ts`

Add two optional parameters and forward them to `updateWidgetData`.

**New signature:**

```typescript
export function useWidgetSync(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig | null,
  approvalItems?: ApprovalItem[],
  myRequests?: ManualRequestEntry[]
): void
```

- Passes `approvalItems ?? []` and `myRequests ?? []` to `updateWidgetData` call
- `approvalItems` added to `useEffect` dependency array (managers need re-sync when approvals change)
- `myRequests` intentionally omitted from deps (same rationale as aiData — contributor data changes don't need independent re-trigger)

**Success Criteria:**
- Existing call sites with 4 arguments continue to compile (optional params)
- `approvalItems` in dependency array triggers re-sync when manager approvals change
- `myRequests` not in dependency array

---

### FR6: Update widgetBridge.ts wrapper

**File:** `src/lib/widgetBridge.ts`

Pass `approvalItems` and `myRequests` from `CrossoverSnapshot` through to `updateWidgetData`.

**Updated call:**

```typescript
await _updateWidgetData(
  data.hoursData,
  data.aiData,
  data.pendingCount,
  data.config,
  data.approvalItems ?? [],
  data.myRequests ?? []
);
```

**Success Criteria:**
- Compiles without error
- When `CrossoverSnapshot` contains `approvalItems`/`myRequests`, they are forwarded
- When absent (undefined), defaults to `[]`

---

### FR7: Extend CrossoverSnapshot type

**File:** `src/lib/crossoverData.ts`

Add two optional fields to `CrossoverSnapshot` and populate `approvalItems` in `fetchFreshData`.

**Extended type:**

```typescript
export interface CrossoverSnapshot {
  hoursData: HoursData;
  aiData: AIWeekData | null;
  pendingCount: number;
  config: CrossoverConfig;
  approvalItems?: ApprovalItem[];       // new optional
  myRequests?: ManualRequestEntry[];    // new optional
}
```

**In `fetchFreshData()`:**
- Manager path: populate `approvalItems` from `[...manualItems, ...overtimeItems]`
- Contributor path: `myRequests` is not fetched in the background path (contributor request status is a foreground-only concern in v1)
- `pendingCount` continues to be derived as `manualItems.length + overtimeItems.length`

**Success Criteria:**
- `CrossoverSnapshot` compiles with new optional fields
- `fetchFreshData()` returns `approvalItems` for managers
- `fetchFreshData()` does not set `myRequests` (foreground only)
- `pendingCount` still correct

---

### FR8: Update iOS WIDGET_LAYOUT_JS for mode-switch and bar chart

**File:** `src/widgets/bridge.ts`

Update the `WIDGET_LAYOUT_JS` string to support the action-mode layout for medium and large, and add the bar chart to the large hours-mode layout.

#### Mode-switch logic (applies to medium + large)

```javascript
var hasApprovals = props.approvalItems && props.approvalItems.length > 0;
var hasRequests  = props.myRequests  && props.myRequests.length > 0;
var actionMode   = hasApprovals || hasRequests;
var bg = props.actionBg || '#0D0C14';
```

#### Category/status badge colors

```javascript
var BADGE_COLORS = {
  MANUAL:   '#00C2FF',  // CYAN
  OVERTIME: '#A78BFA',  // VIOLET
  PENDING:  '#F59E0B',  // WARNING amber
  APPROVED: '#10B981',  // SUCCESS green
  REJECTED: '#F43F5E',  // CRITICAL red
};
```

#### systemSmall — unchanged
No mode-switch. Small widget is unaffected.

#### systemMedium — action mode branch

When `actionMode` is true:

```
┌─────────────────────────────────────────┐
│ 20.3h  ·  $1,017               [QA?]   │  mini hero (16px bold · 14px gold)
│ ─────────────────────────────────────── │
│ J. Smith       2.5h    MANUAL          │  item row (12px)
│ A. Garcia      1.0h    OVERTIME        │
└─────────────────────────────────────────┘
```

- Background: `bg` (tinted or standard)
- Mini hero: hours in hoursColor (16px bold) + " · " + earnings in GOLD (14px)
- Up to 2 items from `props.approvalItems` or `props.myRequests`
- Item row: name (WHITE 12px) · hours (hoursColor 12px semibold) · badge (11px, BADGE_COLORS)

When `actionMode` is false: existing medium hours layout unchanged.

#### systemLarge — action mode branch

When `actionMode` is true:

```
┌─────────────────────────────────────────┐
│ 20.3h  ·  $1,017                       │  mini hero (18px bold · 16px gold)
│ ─────────────────────────────────────── │
│ J. Smith       2.5h    MANUAL          │
│ A. Garcia      1.0h    OVERTIME        │
│ M. Chen        3.0h    MANUAL          │
│ T. Nguyen      0.5h    MANUAL          │
│                         +3 more        │  if pendingCount > 4
└─────────────────────────────────────────┘
```

- Up to 4 items shown
- "+N more" in MUTED if `props.pendingCount > 4`
- Background: `bg`

#### systemLarge — hours mode with bar chart

When `actionMode` is false, render existing large hours layout followed by a bar chart section:

```
Mon ████████████████ 8.2h
Tue ████████████     6.1h
...
Sun ▏                0.0h
```

Bar rendering:
- `maxHours = Math.max.apply(null, props.daily.map(...).concat([8]))` (floor 8h)
- Bar width: `Math.max(3, Math.round((entry.hours / maxHours) * 160))`
- Today's bar: urgency `hoursColor`; other bars: `#2A2A3A`
- Bar height: 8px, cornerRadius: 3
- Day label: 12px MUTED, fixed frame width 30px
- Hours label: 11px LABEL

**Success Criteria:**
- `actionMode` check gates layout branch correctly
- systemSmall: layout unchanged, no reference to new fields
- systemMedium + systemLarge: render action layout when `actionMode === true`
- systemLarge hours mode: bar chart section present, 7 rows rendered
- Bar width uses `maxHours` with min floor of 8
- Today's bar uses urgency `hoursColor`; other bars `#2A2A3A`
- Zero-hour days show stub bar of width 3px
- Badge color correct for MANUAL, OVERTIME, PENDING, APPROVED, REJECTED
- Old widget data without `daily`/`approvalItems` falls through to hours mode

---

### FR9: Update Android MediumWidget for mode-switch

**File:** `src/widgets/android/HourglassWidget.tsx`

Add action mode branching to the `MediumWidget` component.

**Logic:**

```typescript
const hasApprovals = data.approvalItems && data.approvalItems.length > 0;
const hasRequests  = data.myRequests  && data.myRequests.length > 0;
const actionMode   = hasApprovals || hasRequests;
const bg           = data.actionBg ?? URGENCY_BG[data.urgency] ?? URGENCY_BG.none;
```

**Action mode layout:**

- Background: `bg` (from WidgetData.actionBg or urgency fallback)
- Compact hero: `"{hoursDisplay}  ·  {earnings}"` in one row
- Up to 2 item rows (name · hours · category/status)
- Name: WHITE 12px; Hours: accent color 12px; Badge: 11px

**Hours mode:** unchanged from current implementation.

**Success Criteria:**
- `actionMode` check gates layout correctly
- Action layout renders with tinted background
- Up to 2 items shown
- Hours mode renders existing layout unchanged
- TypeScript compiles without error

---

## Technical Design

### Files to Reference (read-only)

| File | Purpose |
|------|---------|
| `src/widgets/types.ts` | Current `WidgetData` interface — extend in FR1 |
| `src/widgets/bridge.ts` | `buildWidgetData`, `updateWidgetData`, `WIDGET_LAYOUT_JS` — modify in FR2/FR3/FR4/FR8 |
| `src/hooks/useWidgetSync.ts` | Foreground sync hook — extend in FR5 |
| `src/lib/widgetBridge.ts` | Background bridge wrapper — extend in FR6 |
| `src/lib/crossoverData.ts` | `CrossoverSnapshot` type + `fetchFreshData` — extend in FR7 |
| `src/widgets/android/HourglassWidget.tsx` | Android widget components — extend in FR9 |
| `src/hooks/useApprovalItems.ts` | Source of `ApprovalItem[]` type used by managers |
| `src/hooks/useMyRequests.ts` | Source of `ManualRequestEntry[]` type used by contributors |
| `src/lib/hours.ts` | `HoursData.daily: DailyEntry[]` — source for `buildDailyEntries` |
| `src/lib/approvals.ts` | `parseManualItems`, `parseOvertimeItems` — return `ApprovalItem[]` |

### Files to Modify

| File | FR | Change |
|------|-----|--------|
| `src/widgets/types.ts` | FR1 | Add `WidgetDailyEntry`, `WidgetApprovalItem`, `WidgetMyRequest`; extend `WidgetData` |
| `src/widgets/bridge.ts` | FR2, FR3, FR4, FR8 | Add 3 helpers; extend `buildWidgetData` + `updateWidgetData`; update `WIDGET_LAYOUT_JS` |
| `src/hooks/useWidgetSync.ts` | FR5 | Add 2 optional params; update `useEffect` deps |
| `src/lib/widgetBridge.ts` | FR6 | Forward `approvalItems`/`myRequests` from snapshot |
| `src/lib/crossoverData.ts` | FR7 | Extend `CrossoverSnapshot`; populate `approvalItems` in manager path |
| `src/widgets/android/HourglassWidget.tsx` | FR9 | Add action mode to `MediumWidget` |

No new files are created. All changes are additive.

### Data Flow

#### Foreground path (useWidgetSync)

```
(tabs)/_layout.tsx
  useApprovalItems()  → ApprovalItem[]
  useMyRequests()     → ManualRequestEntry[]
  useWidgetSync(hoursData, aiData, pendingCount, config, approvalItems, myRequests)
    → updateWidgetData(hoursData, aiData, pendingCount, config, approvalItems, myRequests)
       → buildWidgetData(...)
          → buildDailyEntries(hoursData.daily)
          → formatApprovalItems(approvalItems, 3)
          → formatMyRequests(myRequests, 3)
          → derive pendingCount, actionBg
       → Android: AsyncStorage.setItem('widget_data', JSON.stringify(data))
       → iOS: buildTimelineEntries(data, 60, 15) → widget.updateTimeline(entries)
```

#### Background path (push handler)

```
handler.ts
  → fetchFreshData()
       → approvalItems from parseManualItems + parseOvertimeItems (manager path)
       → returns CrossoverSnapshot { ..., approvalItems }
  → widgetBridge.updateWidgetData(snapshot)
       → _updateWidgetData(..., approvalItems ?? [], [])
```

Note: `myRequests` is not populated in the background path (foreground-only in v1).

### Import Requirements

`bridge.ts` needs to add:

```typescript
import type { ApprovalItem } from '../hooks/useApprovalItems';
import type { ManualRequestEntry } from '../hooks/useMyRequests';
```

`useWidgetSync.ts` needs to add:

```typescript
import type { ApprovalItem } from './useApprovalItems';
import type { ManualRequestEntry } from './useMyRequests';
```

### WIDGET_LAYOUT_JS Constraints

The iOS layout string runs inside a JavaScriptCore context with no module system:
- No imports, no require()
- Available globals: `VStack`, `HStack`, `Text`, `Spacer`, `ZStack` + modifier functions
- Use `function` keyword (not arrow functions) for broader JSC compatibility
- No optional chaining (`?.`) — use `&&` guards
- Guard all new props: `props.daily && props.daily.length > 0` before iterating

### Bar Chart Rendering

```javascript
// Each bar row uses frame modifier for bar width:
HStack({
  modifiers: [background(color), frame({width: barWidth, height: 8}), cornerRadius(3)],
  children: []
})
```

`maxHours = Math.max.apply(null, props.daily.map(function(d){ return d.hours; }).concat([8]))`
`barWidth = Math.max(3, Math.round((entry.hours / maxHours) * 160))`

### Edge Cases

| Scenario | Handling |
|----------|---------|
| `props.daily` absent (old widget data) | Guard check → fall through to hours mode without chart |
| `props.approvalItems` absent (old data) | Guard → `actionMode = false` |
| All daily hours are 0 (new week) | `maxHours` floor = 8; all bars are stub width 3px |
| `approvalItems.length > 4` (large) | Show first 4, show "+N more" text |
| `approvalItems.length > 2` (medium) | Show first 2 only (no "+N more" for medium) |
| Manager with 0 approvals | `actionMode = false`, hours view, `actionBg = null` |

### Backward Compatibility

All changes are additive:
- `WidgetData` gains 4 new fields
- `updateWidgetData` gains 2 optional params — existing 4-arg call sites continue to compile
- `useWidgetSync` gains 2 optional params — existing call in `(tabs)/_layout.tsx` continues to compile
- `CrossoverSnapshot` gains 2 optional fields — existing destructuring unaffected
- `WIDGET_LAYOUT_JS` adds conditional branches — old data without new fields falls through to hours mode via guards
