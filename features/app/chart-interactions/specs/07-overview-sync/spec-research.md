# Spec Research: 07-overview-sync

**Feature:** chart-interactions
**Spec:** 07-overview-sync
**Complexity:** L
**Blocked by:** 03-scrub-engine, 06-overview-history

---

## Problem Context

The overview tab (`app/(tabs)/overview.tsx`) currently shows 4 static sparklines (earnings, hours, AI%, BrainLift) covering 4 weeks. There's no time-range control, no touch interaction, and the 4 charts are completely independent.

The user wants:
1. A **4W/12W toggle** at the top
2. **Synchronized scrubbing** — touch any chart, all 4 show their value for that week simultaneously
3. All 4 metrics shown together in a "week snapshot" readout while scrubbing
4. Hours history, AI% history, and BrainLift history from the new weekly history store

This creates the "timelines converging" effect — drag back through your history and watch all metrics update together.

---

## Exploration Findings

### Current overview.tsx structure
`app/(tabs)/overview.tsx` renders 4 `TrendCard` internal mini-components, each containing:
- Section label
- Metric value (hero number)
- TrendSparkline (52px tall, full width)

Data comes from:
- Earnings: `useEarningsHistory().trend` (already 12-week)
- Hours: `trend.map(e => e / config.hourlyRate)` (derived from earnings — imprecise)
- AI%: static this-week value only
- BrainLift: static this-week value only

With 07 in place, all 4 have real historical data from `useWeeklyHistory`.

### TrendSparkline + scrub (from 05-earnings-scrub)
After 03 and 05, `TrendSparkline` accepts `onScrubChange?: (index: number | null) => void`. The overview sync reuses this same prop.

### Sync mechanism
The key insight: all 4 charts use the SAME data array length. `scrubWeekIndex: number | null` lives at the overview screen level. When any chart calls `onScrubChange(i)`, the screen sets `scrubWeekIndex = i`, and ALL 4 charts receive this index and render their cursor at that position.

However, TrendSparkline currently drives cursor rendering internally from its own gesture. For overview sync, we need to also accept an EXTERNAL cursor index that overrides / supplements the internal gesture state.

→ Add `externalCursorIndex?: number | null` prop to TrendSparkline. When provided and non-null, the cursor renders at that index regardless of internal gesture state. The chart that's being touched provides both external gestures to others AND its own internal cursor — they're the same index.

### 4W/12W toggle
Simple `useState<4 | 12>`. All data arrays are sliced to the last N values. The toggle sits in the overview header row.

### Week snapshot panel during scrub
While scrubbing, show a compact "snapshot" panel below the toggle:
```
Week of Mar 3
Earnings $1,840   Hours 38.5h   AI% 72   BrainLift 4.2h
```
This panel slides in when `scrubWeekIndex !== null` and out when null. Uses `Animated.View` with opacity/translateY spring.

### Current week live data
The most recent entry in the sparkline data is the current in-progress week. When scrubbing to the rightmost position, the snapshot panel shows live current-week data (from `useHoursData`, `useAIData`).

---

## Key Decisions

**Decision 1: externalCursorIndex prop on TrendSparkline**
→ When `externalCursorIndex !== null`, TrendSparkline renders cursor at that index. When null AND `isScrubbing`, renders cursor at internal scrubIndex. This lets overview drive all charts while still letting individual chart's own gesture work.

**Decision 2: Overview screen owns scrubWeekIndex**
→ Single `useState<number | null>` at screen level. Each chart's `onScrubChange` calls `setScrubWeekIndex`. The screen passes `externalCursorIndex={scrubWeekIndex}` back to all 4 charts.

**Decision 3: 4 charts rendered as a flat list, not TrendCard**
→ The current `TrendCard` internal component is a simple View wrapper. For the new design, each chart gets a section with: label, live metric value OR scrub-period value, TrendSparkline. The section header value updates dynamically during scrub.

**Decision 4: Data window slicing**
→ `window: 4 | 12` slices all arrays to `array.slice(-window)` before passing to charts. weekLabels array is also sliced to match. The scrubWeekIndex always refers to the sliced array's indices.

**Decision 5: Current week live values vs history**
→ `useWeeklyHistory` returns persisted history (does not include current in-progress week). The overview builds the display array by: `[...snapshots.slice(-window + 1), currentWeekSnapshot]` where `currentWeekSnapshot` is derived from `useHoursData` + `useAIData`. This ensures the rightmost point is always the live current week.

**Decision 6: Snapshot panel animation**
→ Panel uses `Reanimated.Animated.View` with `withSpring` opacity: 0 → 1 when `scrubWeekIndex` changes from null to non-null, and 0 when reset to null. Slides in from below (translateY: 8 → 0).

---

## Interface Contracts

```typescript
// TrendSparkline — new prop (built in 05, extended here)
interface TrendSparklineProps {
  // existing + onScrubChange from 05
  externalCursorIndex?: number | null;   // NEW in 07 — driven by parent for sync
}

// app/(tabs)/overview.tsx — screen state
const [window, setWindow] = useState<4 | 12>(4);
const [scrubWeekIndex, setScrubWeekIndex] = useState<number | null>(null);

// Data composition (current week always last)
interface OverviewData {
  earnings: number[];          // length = window
  hours: number[];             // length = window
  aiPct: number[];             // length = window
  brainliftHours: number[];    // length = window
  weekLabels: string[];        // length = window — "Mar 3" etc.
}

// Built from: useWeeklyHistory().snapshots + current week from live hooks
// Sliced to last `window` entries before rendering

// Snapshot panel (shown during scrub)
interface WeekSnapshotDisplay {
  label: string;               // "Week of Mar 3"
  earnings: number;
  hours: number;
  aiPct: number;
  brainliftHours: number;
}
// = overviewData values at scrubWeekIndex, OR live data when scrubWeekIndex === null
```

### Source Tracing

| Field | Source |
|-------|--------|
| `earnings[]` | `useWeeklyHistory().snapshots[i].earnings` + `useHoursData().data.weeklyEarnings` (current) |
| `hours[]` | `useWeeklyHistory().snapshots[i].hours` + `useHoursData().data.total` (current) |
| `aiPct[]` | `useWeeklyHistory().snapshots[i].aiPct` + `useAIData().data.aiPctHigh` (current) |
| `brainliftHours[]` | `useWeeklyHistory().snapshots[i].brainliftHours` + `useAIData().data.brainliftHours` (current) |
| `weekLabels[]` | `getWeekLabels(window)` — pure date math |
| `scrubWeekIndex` | `useState` at overview screen level — set by any chart's `onScrubChange` |
| `externalCursorIndex` | `scrubWeekIndex` passed to all 4 TrendSparkline instances |

---

## Test Plan

### Overview data composition

**Happy Path:**
- [ ] `window=4` → arrays sliced to length 4
- [ ] `window=12` → arrays sliced to length 12 (or full history if < 12)
- [ ] Current week always appended as last entry

**Edge Cases:**
- [ ] Empty history → arrays = [currentWeek] (length 1)
- [ ] History shorter than window → no padding, just all available + current

### Synchronized scrubbing

**Happy Path:**
- [ ] Scrubbing on chart A → `scrubWeekIndex` updates → all 4 charts show cursor at same index
- [ ] Lifting finger → `scrubWeekIndex` → null → all cursors hide

**Edge Cases:**
- [ ] Scrubbing chart A while chart B also receives `externalCursorIndex` — B renders correctly
- [ ] `externalCursorIndex = 0` on all charts → earliest week cursor shown on all

### Window toggle

**Happy Path:**
- [ ] Toggle 4W → 12W → data arrays extend to 12 entries
- [ ] Toggle 12W → 4W → data arrays shrink to 4 entries
- [ ] `scrubWeekIndex` reset to null on window change (avoids stale index)

### Snapshot panel

**Happy Path:**
- [ ] When `scrubWeekIndex !== null` → panel appears with correct week label + values
- [ ] When `scrubWeekIndex === null` → panel hidden
- [ ] Snapshot values match `overviewData[scrubWeekIndex]` for all 4 metrics

**Edge Cases:**
- [ ] `scrubWeekIndex = overviewData.earnings.length - 1` (current week) → shows live values

---

## Files to Reference

- `app/(tabs)/overview.tsx` — current structure, TrendCard internal component
- `src/components/TrendSparkline.tsx` — post-05 with onScrubChange
- `src/hooks/useWeeklyHistory.ts` — built in 06
- `src/hooks/useEarningsHistory.ts` — existing 12-week earnings (still used)
- `src/hooks/useHoursData.ts` — current week hours + earnings
- `src/hooks/useAIData.ts` — current week AI% + BrainLift
- `src/lib/hours.ts` — getWeekLabels utility (built in 05)
- `src/lib/reanimated-presets.ts` — springPremium for snapshot panel animation
