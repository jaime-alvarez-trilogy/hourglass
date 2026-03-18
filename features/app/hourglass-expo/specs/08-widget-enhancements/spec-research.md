# Spec Research: 08-widget-enhancements

## Problem Context

Spec 06-widgets shipped the foundational home screen widget: hours, earnings, AI%, BrainLift, urgency
theming, and iOS timeline entries. Three capabilities that were deferred are now being added:

1. **Daily bar chart** — large widget shows Mon–Sun bar chart when no pending items exist,
   mirroring the Scriptable `worksmart.js` reference design.
2. **Manager approval mode** — when a manager has pending approvals, the widget switches from
   "hours view" to "approval list view" so pending items surface immediately without opening the app.
3. **Contributor request mode** — contributors with pending/recent manual time requests see
   their request status (PENDING / APPROVED / REJECTED) in the widget without opening the app.

The trigger for this spec was a design review of the live widget — the Scriptable version's
bar chart and manager cards were identified as meaningful value the Expo widget was missing.

---

## Exploration Findings

### Existing widget data pipeline

```
useWidgetSync (hook, called from (tabs)/_layout.tsx)
  └─ updateWidgetData(hoursData, aiData, pendingCount, config)  ← bridge.ts
        └─ buildWidgetData(...)                                  ← internal
              └─ WidgetData snapshot written to:
                    iOS: App Group UserDefaults via expo-widgets timeline
                    Android: AsyncStorage 'widget_data' key
```

Background path (silent push notification):
```
handler.ts → widgetBridge.updateWidgetData(CrossoverSnapshot)
                └─ _updateWidgetData(snapshot.hoursData, snapshot.aiData, snapshot.pendingCount, snapshot.config)
```

### Existing WidgetData type (`src/widgets/types.ts`)
```typescript
export interface WidgetData {
  hours: string;           // "32.5"
  hoursDisplay: string;    // "32.5h"
  earnings: string;        // "$1,300"
  earningsRaw: number;
  today: string;           // "6.2h"
  hoursRemaining: string;  // "7.5h left" | "2.5h OT"
  aiPct: string;           // "71%–75%" | "N/A"
  brainlift: string;       // "3.2h"
  deadline: number;        // Unix ms
  urgency: WidgetUrgency;
  pendingCount: number;    // 0 for contributors
  isManager: boolean;
  cachedAt: number;
  useQA: boolean;
}
```

### Daily breakdown already exists in HoursData (`src/lib/hours.ts`)
```typescript
export interface DailyEntry {
  date: string;    // "YYYY-MM-DD"
  hours: number;
  isToday: boolean;
}

export interface HoursData {
  // ...
  daily: DailyEntry[];   // up to 7 entries, Mon–Sun
}
```

### Approval items (`src/hooks/useApprovalItems.ts` + `src/lib/approvals.ts`)
```typescript
type ApprovalItem = ManualApprovalItem | OvertimeApprovalItem;

interface ManualApprovalItem {
  id: string;             // "mt-{timecardIds}"
  category: 'MANUAL';
  userId: number;
  fullName: string;
  durationMinutes: number;
  hours: string;          // pre-formatted "(min/60).toFixed(1)"
  description: string;
  startDateTime: string;
  type: 'WEB' | 'MOBILE';
  timecardIds: number[];
  weekStartDate: string;
}

interface OvertimeApprovalItem {
  id: string;             // "ot-{overtimeRequest.id}"
  category: 'OVERTIME';
  overtimeId: number;
  userId: number;
  fullName: string;
  jobTitle: string;
  durationMinutes: number;
  hours: string;
  cost: number;
  description: string;
  startDateTime: string;
  weekStartDate: string;
}
```

### My requests (`src/hooks/useMyRequests.ts` + `src/types/requests.ts`)
```typescript
interface ManualRequestEntry {
  id: string;              // "{date}|{memo}"
  date: string;            // "YYYY-MM-DD"
  durationMinutes: number;
  memo: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
}
```

### Integration points that call updateWidgetData

**Foreground:** `src/hooks/useWidgetSync.ts`
```typescript
export function useWidgetSync(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig | null
): void
```

**Background push:** `src/lib/widgetBridge.ts`
```typescript
export async function updateWidgetData(data: CrossoverSnapshot): Promise<void>
// CrossoverSnapshot defined in src/lib/crossoverData.ts
```

Both need new parameters to pass approval/request data through.

### Android widget (`src/widgets/android/HourglassWidget.tsx`)
- SmallWidget and MediumWidget only (large not used on Android)
- Uses `FlexWidget` + `TextWidget` from `react-native-android-widget`
- MediumWidget currently shows: hero hours/earnings + today/AI% + hours remaining
- Needs mode switch for manager/contributor view (same logic as iOS medium)

### iOS layout
- Implemented as `WIDGET_LAYOUT_JS` string in `src/widgets/bridge.ts`
- Self-contained function evaluated in JavaScriptCore; uses only globals:
  `VStack`, `HStack`, `Text`, `Spacer`, `background`, `padding`,
  `foregroundStyle`, `font`, `frame`, `cornerRadius`
- Array methods (`.map()`, `.slice()`, `.filter()`) work in the JSContext

---

## Key Decisions

### D1: Mode switch layout (confirmed with user)
When pending items exist (manager: approvalItems.length > 0 OR contributor: myRequests.length > 0),
the widget switches from "hours view" to "action view":
- **Compact mini-header**: single line — `"20.3h  ·  $1,017"` (smaller font)
- **Item list**: up to 3 items with name/memo, hours, category/status

When no pending items: normal hours view + bar chart (large only).

### D2: Bar chart day range (confirmed with user)
Always Mon–Sun, all 7 bars. Days with 0 hours show a minimal stub (width 3px). Today's bar
uses the urgency accent color; past/future use a muted surface color.

### D3: Max items in widget
- Small: no mode switch (too small — 158pt tall)
- Medium: up to 2 items in action view
- Large: up to 4 items in action view (with "+N more" if total exceeds 4)

### D4: Contributor requests filter
Show only the most recent week's requests, up to 3, sorted newest first.
If all requests are APPROVED and older than 7 days, show hours view (nothing urgent).

### D5: Android parity scope
Android MediumWidget gets mode switch (manager + contributor). Android does not get bar chart
(large not supported on Android). SmallWidget unchanged on both platforms.

### D6: widgetBridge / CrossoverSnapshot extension
`CrossoverSnapshot` (`src/lib/crossoverData.ts`) will gain optional `approvalItems` and
`myRequests` fields. Background push handler populates them from its fetched data.
`useWidgetSync` gets two new optional parameters (default `[]`).

---

## Interface Contracts

### New types to add to `src/widgets/types.ts`

```typescript
/** One day's bar chart entry — pre-computed from HoursData.daily */
export interface WidgetDailyEntry {
  day: string;      // "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
  hours: number;    // 0–24, rounded to 1 decimal
  isToday: boolean;
}

/** Pending approval item for manager widget view (max 3) */
export interface WidgetApprovalItem {
  id: string;
  name: string;              // fullName, max 18 chars (truncated with "…")
  hours: string;             // "2.5h"
  category: 'MANUAL' | 'OVERTIME';
}

/** Contributor's own manual time request for widget view (max 3) */
export interface WidgetMyRequest {
  id: string;
  date: string;              // "Mon Mar 18" formatted
  hours: string;             // "1.5h"
  memo: string;              // max 18 chars (truncated with "…")
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
```

### Extended WidgetData (additive — no breaking changes)

```typescript
export interface WidgetData {
  // ... existing fields unchanged ...

  // New in 08-widget-enhancements:
  daily: WidgetDailyEntry[];          // always 7 entries, Mon[0]–Sun[6]
                                      // ← computed from HoursData.daily
  approvalItems: WidgetApprovalItem[]; // max 3; [] for contributors
                                       // ← from ApprovalItem[] param
  myRequests: WidgetMyRequest[];       // max 3; [] for managers
                                       // ← from ManualRequestEntry[] param
}
```

### Updated `buildWidgetData` signature

```typescript
function buildWidgetData(
  hoursData: HoursData,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig,
  approvalItems: ApprovalItem[],         // new — [] if not manager
  myRequests: ManualRequestEntry[],      // new — [] if manager
  now?: number
): WidgetData
```

Sources:
- `daily` ← `buildDailyEntries(hoursData.daily)` (new internal helper)
- `approvalItems` ← `formatApprovalItems(approvalItems, 3)` (new internal helper)
- `myRequests` ← `formatMyRequests(myRequests, 3)` (new internal helper)
- `pendingCount` ← `config.isManager ? approvalItems.length : 0`

### Updated `updateWidgetData` signature

```typescript
export async function updateWidgetData(
  hoursData: HoursData,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig,
  approvalItems?: ApprovalItem[],        // new, default []
  myRequests?: ManualRequestEntry[]      // new, default []
): Promise<void>
```

Source: `src/widgets/bridge.ts`

### Updated `useWidgetSync` signature

```typescript
export function useWidgetSync(
  hoursData: HoursData | null,
  aiData: AIWeekData | null,
  pendingCount: number,
  config: CrossoverConfig | null,
  approvalItems?: ApprovalItem[],        // new, default []
  myRequests?: ManualRequestEntry[]      // new, default []
): void
```

Source: `src/hooks/useWidgetSync.ts`

### Updated `CrossoverSnapshot` (in `src/lib/crossoverData.ts`)

```typescript
export interface CrossoverSnapshot {
  // ... existing fields ...
  approvalItems?: ApprovalItem[];        // new optional
  myRequests?: ManualRequestEntry[];     // new optional
}
```

### Internal helper contracts

```typescript
// Maps HoursData.daily → exactly 7 WidgetDailyEntry (Mon–Sun)
// Missing days filled with { hours: 0, isToday: false }
function buildDailyEntries(daily: DailyEntry[]): WidgetDailyEntry[]

// Takes up to `maxCount` ApprovalItems, returns WidgetApprovalItem[]
// Truncates fullName to 18 chars with "…"
function formatApprovalItems(
  items: ApprovalItem[],
  maxCount: number
): WidgetApprovalItem[]

// Takes up to `maxCount` ManualRequestEntries, returns WidgetMyRequest[]
// Formats date as "Mon Mar 18", truncates memo to 18 chars with "…"
function formatMyRequests(
  entries: ManualRequestEntry[],
  maxCount: number
): WidgetMyRequest[]
```

---

## iOS Layout Spec (WIDGET_LAYOUT_JS)

### Mode-switch logic (applies to medium + large)
```
hasApprovals = props.approvalItems.length > 0
hasRequests  = props.myRequests.length > 0
actionMode   = hasApprovals || hasRequests
```

### systemSmall — unchanged
No mode switch. Too small for item lists.

### systemMedium — action mode
```
┌─────────────────────────────────────────┐
│ 20.3h  ·  $1,017               [QA?]   │  ← mini hero (16px bold · 14px gold)
│─────────────────────────────────────────│
│ J. Smith       2.5h    MANUAL          │  ← item row (12px)
│ A. Garcia      1.0h    OVERTIME        │
└─────────────────────────────────────────┘
```
- Up to 2 items
- Name: foregroundStyle(WHITE), 12px
- Hours: foregroundStyle(hoursColor), 12px semibold
- Category/status badge: foregroundStyle(CYAN for MANUAL, VIOLET for OVERTIME,
  WARNING for PENDING, SUCCESS for APPROVED, CRITICAL for REJECTED), 11px

### systemMedium — hours mode (unchanged from current)
```
┌─────────────────────────────────────────┐
│ 20.3h              $1,017              │
│ this week          earned              │
│                                        │
│ TODAY 3.2h  AI 89%–93%  19.7h left    │
└─────────────────────────────────────────┘
```

### systemLarge — action mode
```
┌─────────────────────────────────────────┐
│ 20.3h  ·  $1,017                       │  ← mini hero (18px bold · 16px gold)
│─────────────────────────────────────────│
│ J. Smith       2.5h    MANUAL          │
│ A. Garcia      1.0h    OVERTIME        │
│ M. Chen        3.0h    MANUAL          │
│ T. Nguyen      0.5h    MANUAL          │
│                         +3 more        │  ← if total > 4
└─────────────────────────────────────────┘
```
- Up to 4 items
- Same color coding as medium
- "+N more" line in MUTED if total exceeds 4

### systemLarge — hours mode (with bar chart)
```
┌─────────────────────────────────────────┐
│ 20.3h                 $1,017           │  ← full hero
│ this week             earned           │
│─────────────────────────────────────────│
│ Today  3.2h   Remaining  19.7h left    │
│ AI     89%–93%  BrainLift  3.0h        │
│─────────────────────────────────────────│
│ Mon ████████████████ 8.2h              │  ← bar chart
│ Tue ████████████     6.1h              │
│ Wed ████████         4.0h              │
│ Thu ██               2.0h              │
│ Fri ▏                0.0h              │
│ Sat ▏                0.0h              │
│ Sun ▏                0.0h              │
└─────────────────────────────────────────┘
```
Bar rendering:
- Max bar width: 160px (fits with day label + hours label)
- Bar width: `Math.max(3, Math.round((entry.hours / maxHours) * 160))`
- `maxHours = Math.max(...daily.map(d => d.hours), 8)` (min scale 8h)
- Today's bar: `background(hoursColor)`
- Past/future bars: `background('#2A2A3A')`
- Bar height: 8px, cornerRadius: 3
- Day label: 12px, MUTED, fixed frame width 30px
- Hours label: 11px, LABEL
- Zero-hour stub: width 3px, background '#2A2A3A'

---

## Android Layout Spec

### MediumWidget — action mode (new)
Mirrors iOS medium action mode using FlexWidget/TextWidget primitives:
- Top row: `"20.3h  ·  $1,017"` (compact hero)
- Item rows: name (left) · hours + category (right), up to 2 items

### MediumWidget — hours mode
Unchanged from current implementation.

### SmallWidget
Unchanged.

---

## Test Plan

### `buildDailyEntries`
**Signature:** `buildDailyEntries(daily: DailyEntry[]): WidgetDailyEntry[]`

**Happy Path:**
- [ ] Week with Mon–Wed filled, Thu–Sun empty → 7 entries, correct hours, Thu–Sun = 0
- [ ] All 7 days filled → 7 entries, all hours mapped correctly
- [ ] `isToday` set on exactly one entry matching today's date

**Edge Cases:**
- [ ] Empty `daily` array → 7 entries all `{ hours: 0, isToday: false }`
- [ ] `daily` has entries out of Mon–Sun order → still returns Mon[0]–Sun[6]
- [ ] Date is Sunday → Sun entry has `isToday: true`

**Mocks needed:**
- `Date.now()` / current date for `isToday` determination

---

### `formatApprovalItems`
**Signature:** `formatApprovalItems(items: ApprovalItem[], maxCount: number): WidgetApprovalItem[]`

**Happy Path:**
- [ ] 2 items, maxCount=3 → returns 2 items
- [ ] 5 items, maxCount=3 → returns first 3 items only
- [ ] ManualApprovalItem → category 'MANUAL', hours from item.hours
- [ ] OvertimeApprovalItem → category 'OVERTIME', hours from item.hours

**Edge Cases:**
- [ ] Empty array → returns `[]`
- [ ] fullName exactly 18 chars → no truncation
- [ ] fullName 19+ chars → truncated to 17 chars + "…"

---

### `formatMyRequests`
**Signature:** `formatMyRequests(entries: ManualRequestEntry[], maxCount: number): WidgetMyRequest[]`

**Happy Path:**
- [ ] 3 entries → maps all fields correctly
- [ ] date "2026-03-18" → formatted as "Tue Mar 18"
- [ ] status PENDING / APPROVED / REJECTED all map through unchanged
- [ ] memo ≤ 18 chars → no truncation

**Edge Cases:**
- [ ] Empty array → returns `[]`
- [ ] memo 19+ chars → truncated to 17 + "…"
- [ ] 5 entries, maxCount=3 → only first 3 returned

---

### `buildWidgetData` (extended)
**Happy Path:**
- [ ] Returns `daily` with 7 entries when `hoursData.daily` has data
- [ ] Returns `approvalItems` capped at 3 for manager
- [ ] Returns `myRequests` capped at 3 for contributor
- [ ] Manager config → `myRequests: []`; contributor config → `approvalItems: []`
- [ ] `pendingCount` equals `approvalItems.length` (derived, not passed separately)

**Edge Cases:**
- [ ] `approvalItems` omitted (undefined) → `approvalItems: []`, `pendingCount: 0`
- [ ] `myRequests` omitted (undefined) → `myRequests: []`

---

### `updateWidgetData` integration
- [ ] Calls `buildWidgetData` with new params forwarded
- [ ] Backward compat: calling without `approvalItems`/`myRequests` → defaults to `[]`

---

## Files to Modify

| File | Change |
|------|--------|
| `src/widgets/types.ts` | Add `WidgetDailyEntry`, `WidgetApprovalItem`, `WidgetMyRequest`; extend `WidgetData` |
| `src/widgets/bridge.ts` | `buildDailyEntries`, `formatApprovalItems`, `formatMyRequests` helpers; extend `buildWidgetData` + `updateWidgetData`; update `WIDGET_LAYOUT_JS` (all 3 sizes) |
| `src/widgets/android/HourglassWidget.tsx` | Add action mode to `MediumWidget`; update prop types |
| `src/hooks/useWidgetSync.ts` | Add `approvalItems?` + `myRequests?` params; forward to `updateWidgetData` |
| `src/lib/widgetBridge.ts` | Add `approvalItems?` + `myRequests?` to wrapper call |
| `src/lib/crossoverData.ts` | Add `approvalItems?` + `myRequests?` to `CrossoverSnapshot` |

---

## Out of Scope

- Lock screen / accessory widget variants (deferred to post-launch)
- Android large widget bar chart (large not supported on Android)
- Siri/widget intent actions (approve from widget) — future spec
- Web dashboard widget
- Historical data beyond current week
