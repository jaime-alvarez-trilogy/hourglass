# Spec Research: 05-earnings-scrub

**Feature:** chart-interactions
**Spec:** 05-earnings-scrub
**Complexity:** M
**Blocked by:** 03-scrub-engine

---

## Problem Context

The home tab shows earnings as a hero number (current week) plus a 4-week sparkline. The sparkline conveys trend direction but you can't inspect individual weeks. The user wants to drag the sparkline to see past weekly earnings — the hero number should update to show the earnings for that specific week.

---

## Exploration Findings

### TrendSparkline props
```typescript
interface TrendSparklineProps {
  data: number[];          // e.g. [1840, 1960, 2000, 1920] (oldest → newest)
  width: number;
  height: number;
  color?: string;          // Default: colors.gold
  strokeWidth?: number;
  maxValue?: number;
  showGuide?: boolean;
}
```
The sparkline just draws a smooth line through the values. No point labels.

### Earnings data flow (home tab)
```typescript
const { data: hoursData } = useHoursData();
const { trend } = useEarningsHistory();
// hoursData.weeklyEarnings = current week
// trend = number[] of 12 weeks, oldest first
```

The sparkline on home currently renders `trend.slice(-4)` (last 4 weeks). When scrubbing, the hero value should swap to `trend[scrubIndex]` instead of `hoursData.weeklyEarnings`.

### Week labels for tooltip context
When scrubbing, the hero sub-label should show the week (e.g. "Mar 3 – Mar 9"). This requires week start dates alongside the trend values.

`useEarningsHistory` returns just `trend: number[]` — no dates. The earnings history stores `{ [weekStart]: amount }` in AsyncStorage, so the hook could optionally return week labels.

**Approach**: Add `weekLabels?: string[]` to TrendSparkline props. Home tab computes these from the trend array length + current week start date (walk back N weeks). This is pure date math — no new API calls.

### Scrub on compact sparkline
The earnings sparkline on home is 60px tall, but full width (~340px). Horizontal scrubbing is natural even at this height. Scrub enabled.

### Hero earnings display
Currently:
```jsx
<MetricValue value={hoursData.weeklyEarnings} unit="$" />
// sub-label: "this week"
```
When scrubbing: `MetricValue` shows `trend[scrubIndex]` with sub-label showing the week date range. When finger lifted: returns to live `weeklyEarnings`.

---

## Key Decisions

**Decision 1: TrendSparkline gets onScrubChange + weekLabels**
→ Same pattern as AI chart. New props:
```typescript
onScrubChange?: (index: number | null) => void;
weekLabels?: string[];   // Optional human-readable labels for tooltip/sub-label
```

**Decision 2: Hero earnings source during scrub**
→ Home tab `index.tsx` holds `scrubEarningsIndex: number | null`. When non-null: hero value = `trend[scrubEarningsIndex]`, sub-label = `weekLabels[scrubEarningsIndex] ?? 'week of ...'`. When null: hero = `hoursData.weeklyEarnings`, sub-label = "this week".

**Decision 3: Week label computation**
→ A small utility `getWeekLabels(trendLength: number): string[]` in `src/lib/hours.ts` (or inline in the component). Returns labels like "Mar 3" for the Monday of each week, oldest first. Uses current Monday and counts back.

**Decision 4: Scrub works on both home AND overview sparklines**
→ This spec handles the home tab sparkline. The overview sparkline will be handled in 07-overview-sync (which shares the same TrendSparkline component with onScrubChange).

**Decision 5: Gesture on 60px height**
→ The sparkline is narrow vertically but wide horizontally. The pan gesture activates on horizontal movement (`activeOffsetX: [-5, 5]`). This prevents accidental activation during vertical scrolling of the home screen ScrollView.

---

## Interface Contracts

```typescript
// TrendSparkline — new props
interface TrendSparklineProps {
  // existing: data, width, height, color, strokeWidth, maxValue, showGuide, capLabel
  onScrubChange?: (index: number | null) => void;   // NEW
  weekLabels?: string[];    // NEW — length must match data.length if provided
}

// src/lib/hours.ts — new utility
function getWeekLabels(count: number): string[]
// Returns count strings, oldest first, format "Mar 3"
// e.g. for count=4: ["Feb 10", "Feb 17", "Feb 24", "Mar 3"]

// app/(tabs)/index.tsx — new state
const [scrubEarningsIndex, setScrubEarningsIndex] = useState<number | null>(null);
const weekLabels = useMemo(() => getWeekLabels(trend.length), [trend.length]);
// Hero earnings: trend[scrubEarningsIndex] ?? hoursData.weeklyEarnings
// Sub-label: scrubEarningsIndex !== null ? weekLabels[scrubEarningsIndex] : "this week"
```

### Source Tracing

| Field | Source |
|-------|--------|
| `trend` values | `useEarningsHistory().trend` (12 weeks, oldest first) |
| `weekLabels` | `getWeekLabels(trend.length)` — pure date math from current Monday |
| Hero earnings value | `trend[scrubIndex]` when scrubbing, `hoursData.weeklyEarnings` otherwise |
| `pixelXs` for gesture | `data.map((_, i) => toPixelX(i))` (computed in TrendSparkline) |

---

## Test Plan

### `getWeekLabels(count)` utility

**Happy Path:**
- [ ] `getWeekLabels(1)` → `["<current week Monday>"]` (single label)
- [ ] `getWeekLabels(4)` → 4 labels, oldest first, each a Monday
- [ ] Labels are 4 weeks apart (consecutive Mondays)
- [ ] Format matches "Mar 3" (abbreviated month + day, no year)

**Edge Cases:**
- [ ] `getWeekLabels(0)` → `[]` (empty array)
- [ ] `getWeekLabels(12)` → 12 labels, no crash

### TrendSparkline with onScrubChange

**Happy Path:**
- [ ] `onScrubChange` called with index 0..N-1 during pan
- [ ] `onScrubChange(null)` called on gesture end
- [ ] `weekLabels` prop accepted without crash

**Edge Cases:**
- [ ] `data = []` → no crash, no scrub events
- [ ] `data.length = 1` → scrub always returns index 0
- [ ] `onScrubChange` not provided → no crash

### Home tab hero update

**Happy Path:**
- [ ] When `scrubEarningsIndex !== null` → hero shows `trend[scrubEarningsIndex]`
- [ ] When `scrubEarningsIndex === null` → hero shows `hoursData.weeklyEarnings`
- [ ] Sub-label updates with week label during scrub

**Edge Cases:**
- [ ] `scrubEarningsIndex = 0` (oldest week) → shows first trend value
- [ ] Scrub on empty trend array → no crash, earnings hero unchanged

---

## Files to Reference

- `src/components/TrendSparkline.tsx` — data→pixel mapping, animation, Skia Canvas
- `src/hooks/useEarningsHistory.ts` — trend data shape (number[], 12 weeks oldest-first)
- `src/lib/hours.ts` — week start date utilities, getWeekStartDate
- `app/(tabs)/index.tsx` — earnings hero display, MetricValue, trend usage
- `src/hooks/useScrubGesture.ts` — built in 03-scrub-engine
