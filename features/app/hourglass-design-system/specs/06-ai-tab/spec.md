# 06-ai-tab

**Status:** Draft
**Created:** 2026-03-14
**Last Updated:** 2026-03-14
**Owner:** @trilogy

---

## Overview

Rebuild `app/(tabs)/ai.tsx` from `StyleSheet.create()` + hardcoded hex to the full design system: NativeWind `className`, the `AIRingChart` (Oura-style two-ring Skia chart), `MetricValue` count-up, `Card`, `SectionLabel`, `ProgressBar`, and `SkeletonLoader` from the 03-base-components and 04-skia-charts deliverables.

**What is being built:**
- A rebuilt AI tab screen that replaces `AIProgressBar` (View-based) with the Skia `AIRingChart` showing two concentric rings: outer = AI% (cyan), inner = BrainLift % of 5h target (violet).
- Hero metrics rendered as `MetricValue` count-up: AI% in `text-cyan`, BrainLift hours in `text-violet`.
- A `ProgressBar` showing BrainLift progress toward 5h target in violet.
- A delta badge showing week-over-week AI% change, sourced from a cached `previousWeekAIPercent` in `AsyncStorage` — hidden if not yet available.
- `DailyAIRow` refactored to use `className` instead of `StyleSheet.create()`.
- Full `SkeletonLoader` coverage during the loading state.
- `useAIData()` hook extended to read/write `previousWeekAIPercent` in AsyncStorage.

**How it works:**
- `AIWeekData` from `useAIData()` exposes `aiPctLow`, `aiPctHigh`, `brainliftHours`, and `dailyBreakdown`.
- The screen derives `aiPercent` as midpoint (`(aiPctLow + aiPctHigh) / 2`) for ring display, and `brainliftPercent` as `(brainliftHours / 5) * 100` for the inner ring.
- `previousWeekPercent` is read from AsyncStorage on mount and written back on each successful fetch when the current day is Monday (week boundary).
- The screen is scroll-based (`ScrollView` with `RefreshControl`) — same as current. Error and empty states are preserved, migrated to `className`.
- All color comes from Tailwind tokens (`text-cyan`, `text-violet`, `bg-surface`, etc.) — no hardcoded hex.

---

## Out of Scope

1. **TrendSparkline historical data** — `useAIData()` does not yet return multi-week `weeklyHistory`. A placeholder comment is added in the screen; the `TrendSparkline` component is not rendered in this spec.
   - **Deferred:** Unassigned future analytics/history spec. No action in this spec.

2. **AI% formula changes** — The `countDiaryTags()` / `aggregateAICache()` logic in `src/lib/ai.ts` is correct and validated. This spec does NOT modify it.
   - **Descoped:** Not part of this spec.

3. **`AIProgressBar` component deletion** — `AIProgressBar.tsx` is no longer used by `ai.tsx` after this rebuild, but may still be referenced elsewhere. It will be deleted in a cleanup pass after all screen rebuilds are complete.
   - **Deferred to 08-auth-screens cleanup:** Final component pruning after all screens rebuilt.

4. **Multi-week API calls for AI% history** — Fetching prior weeks' work diary data is expensive. This spec stores only a single `previousWeekAIPercent` value from the prior week in AsyncStorage (written at week boundary). No multi-week API calls.
   - **Descoped:** Not part of this spec.

5. **Legend section redesign** — The "How it's calculated" legend card is retained as-is. It is migrated to `className` styling naturally as part of the screen rebuild.
   - **Descoped:** Covered naturally by the screen rebuild.

6. **`DailyBarChart` in AI tab** — The current `ai.tsx` does not render a bar chart. No weekly bar chart is added in this spec.
   - **Descoped:** Not in scope for AI tab.

---

## Functional Requirements

### FR1: AIRingChart Integration

Render an `AIRingChart` (from `src/components/AIRingChart.tsx`) as the hero visual of the AI tab.

**Success Criteria:**
- `AIRingChart` is rendered with `aiPercent` (midpoint of `aiPctLow`/`aiPctHigh`) and `brainliftPercent` (`brainliftHours / 5 * 100`, clamped 0–100).
- `size` is 160dp (defined as `RING_SIZE = 160` constant).
- Outer ring: AI% arc in `colors.cyan` on border track.
- Inner ring: BrainLift% arc in `colors.violet` on border track (only when `brainliftHours > 0`; pass `brainliftPercent` prop as undefined or 0 otherwise and let the chart handle it).
- A `MetricValue` is overlaid absolutely in the center of the ring showing `aiPercent` with `colorClass="text-cyan"`, `unit="%"`, `precision={0}`.
- The ring container uses `position: relative` with `width: RING_SIZE, height: RING_SIZE`; the `MetricValue` overlay uses `position: absolute, top/left/right/bottom: 0` with `alignItems: center, justifyContent: center`.
- The ring is centered horizontally in the AI Usage card.

### FR2: Hero Metric Section

Display the primary AI% and BrainLift hours as `MetricValue` count-up components with correct color tokens.

**Success Criteria:**
- AI% `MetricValue`: `value={aiPercent}`, `unit="%"`, `precision={0}`, `colorClass="text-cyan"`, `sizeClass="text-4xl"`.
- BrainLift `MetricValue`: `value={brainliftHours}`, `unit="h"`, `precision={1}`, `colorClass="text-violet"`, `sizeClass="text-3xl"`.
- A "/ 5h target" static label in `text-textSecondary` appears to the right of the BrainLift `MetricValue`.
- `SectionLabel` components label the "AI USAGE" and "BRAINLIFT" sections.
- No hardcoded hex colors anywhere in the screen.
- Color rule enforced: cyan tokens used ONLY for AI%, violet tokens used ONLY for BrainLift.

### FR3: BrainLift Progress Bar

Render a `ProgressBar` showing BrainLift weekly progress toward the 5h target.

**Success Criteria:**
- `ProgressBar` rendered with `progress={brainliftHours / 5}` (clamped by component to [0,1]).
- `colorClass="bg-violet"`.
- `height={6}`.
- Appears inside the BrainLift `Card`, below the `MetricValue` row.
- A subtext label shows `${brainliftHours.toFixed(1)}h / 5h target` in `text-textSecondary text-sm`.

### FR4: Delta Badge (Week-Over-Week)

Show a delta badge displaying the change in AI% versus last week, using a cached AsyncStorage value.

**Part A — useAIData hook extension:**
- `useAIData()` return type adds `previousWeekPercent?: number`.
- On mount: read `AsyncStorage.getItem('previousWeekAIPercent')`. If present, parse as number and set in state.
- On each successful data fetch: if today is Monday (`new Date().getDay() === 1`), write `AsyncStorage.setItem('previousWeekAIPercent', String(aiPercent))` where `aiPercent = (freshData.aiPctLow + freshData.aiPctHigh) / 2`.
- AsyncStorage read/write failures are caught silently — do not propagate as errors.

**Part B — Screen delta badge:**
- If `previousWeekPercent` is available: compute `delta = aiPercent - previousWeekPercent`.
- Show badge: `+{delta.toFixed(1)}%` if positive (color: `text-success`), `-{delta.toFixed(1)}%` if negative (`text-error`), `+0.0%` if zero (`text-textSecondary`).
- Badge pill style: `bg-surfaceElevated rounded-full px-2 py-0.5 text-xs font-semibold`.
- `testID="delta-badge"` on the badge container.
- If `previousWeekPercent` is undefined: badge is not rendered.

### FR5: Daily Breakdown List

Update `DailyAIRow` to use `className` NativeWind styling, removing `StyleSheet.create()`.

**Success Criteria:**
- `DailyAIRow` props interface unchanged: `{ item: DailyTagData }`.
- All `StyleSheet` references removed from `DailyAIRow.tsx`.
- Row layout replicated with `className`:
  - Row: `flex-row items-center py-2.5 px-1 border-b border-border`.
  - Today highlight: additional `bg-surface` class (slightly elevated vs default background).
  - Date label: `flex-1 text-sm text-textPrimary` (today: `text-success font-semibold`).
  - Metric columns: `w-[70px] text-right text-sm text-textSecondary`.
- AI tab screen renders daily breakdown in a `Card` with column headers in `text-textTertiary text-xs uppercase tracking-wider`.
- `FlatList` or mapped `View`s are both acceptable; mapped Views matching the existing pattern is preferred.

### FR6: Loading / Skeleton States

Show `SkeletonLoader` placeholders for all content sections while `isLoading=true` and `data===null`.

**Success Criteria:**
- When `isLoading=true` AND `data===null`: render skeleton layout:
  - Ring skeleton: `SkeletonLoader` `width={RING_SIZE}` `height={RING_SIZE}` `rounded={true}` `testID="skeleton-ring"`.
  - Hero metric skeletons: `SkeletonLoader` `height={40}` (AI%), `SkeletonLoader` `height={32}` (BrainLift) — wrapped in `testID="skeleton-metrics"` container.
  - Progress bar skeleton: `SkeletonLoader` `height={6}`.
  - Daily breakdown skeleton: 3 rows of `SkeletonLoader` `height={20}` — wrapped in `testID="skeleton-breakdown"` container.
- When `isLoading=true` AND `data` exists (background refresh): show real data; `RefreshControl` handles the spinner.
- When `isLoading=false` AND `data` exists: show real data, no skeletons.

---

## Technical Design

### Files to Reference

| File | Role |
|------|------|
| `hourglassws/app/(tabs)/ai.tsx` | Screen to rebuild (source of truth for existing structure) |
| `hourglassws/src/hooks/useAIData.ts` | Hook to extend with `previousWeekPercent` |
| `hourglassws/src/lib/ai.ts` | `AIWeekData` type, aggregation logic (read-only) |
| `hourglassws/src/components/AIRingChart.tsx` | Skia ring chart (from 04-skia-charts) |
| `hourglassws/src/components/MetricValue.tsx` | Count-up metric display |
| `hourglassws/src/components/Card.tsx` | Surface card container |
| `hourglassws/src/components/SectionLabel.tsx` | Section header text |
| `hourglassws/src/components/ProgressBar.tsx` | Animated fill bar |
| `hourglassws/src/components/SkeletonLoader.tsx` | Loading placeholder |
| `hourglassws/src/components/DailyAIRow.tsx` | Daily breakdown row (to refactor) |
| `hourglassws/src/lib/colors.ts` | Skia color constants (for reference only) |
| `hourglassws/tailwind.config.js` | Token definitions: cyan, violet, surface, etc. |
| `hourglassws/BRAND_GUIDELINES.md` | Color semantic rules |

### Files to Create / Modify

| File | Change |
|------|--------|
| `hourglassws/app/(tabs)/ai.tsx` | Full rebuild — replace StyleSheet + AIProgressBar with design system components |
| `hourglassws/src/hooks/useAIData.ts` | Add `previousWeekPercent?: number` to return type + AsyncStorage read/write logic |
| `hourglassws/src/components/DailyAIRow.tsx` | Remove `StyleSheet.create()`, replace with `className` |
| `hourglassws/src/components/__tests__/AITab.test.tsx` | New test file for the rebuilt AI tab screen |
| `hourglassws/src/hooks/__tests__/useAIData.test.ts` | Extend existing tests with `previousWeekPercent` cases |

### Data Flow

```
AsyncStorage('previousWeekAIPercent')
        │ read on mount
        ▼
useAIData()
  returns: { data: AIWeekData | null, isLoading, error, refetch, previousWeekPercent?: number }
        │
        ▼
  ai.tsx (AIScreen)
    ├─ aiPercent = (data.aiPctLow + data.aiPctHigh) / 2
    ├─ brainliftPercent = (data.brainliftHours / 5) * 100
    ├─ delta = previousWeekPercent != null ? aiPercent - previousWeekPercent : null
    │
    ├─ <Card> (AI Usage)
    │    ├─ <SectionLabel>AI USAGE</SectionLabel>
    │    ├─ ring container (position:relative, 160×160)
    │    │    ├─ <AIRingChart aiPercent brainliftPercent size={160} />
    │    │    └─ absolute center: <MetricValue value={aiPercent} unit="%" precision={0} colorClass="text-cyan" />
    │    └─ delta badge (if previousWeekPercent available)
    │
    ├─ <Card> (BrainLift)
    │    ├─ <SectionLabel>BRAINLIFT</SectionLabel>
    │    ├─ <MetricValue value={brainliftHours} unit="h" precision={1} colorClass="text-violet" sizeClass="text-3xl" />
    │    ├─ <ProgressBar progress={brainliftHours/5} colorClass="bg-violet" height={6} />
    │    └─ subtext "Xh / 5h target"
    │
    ├─ <Card> (Daily Breakdown)
    │    ├─ column headers
    │    └─ data.dailyBreakdown.map(day => <DailyAIRow item={day} />)
    │
    └─ <Card> (Legend)
         └─ static explanatory text

  On successful fetch + isMonday → AsyncStorage.setItem('previousWeekAIPercent', midpoint)
```

### Hook Extension Pattern

```typescript
// Additions to useAIData.ts:

const PREV_WEEK_KEY = 'previousWeekAIPercent';

// In UseAIDataResult interface:
previousWeekPercent?: number;

// In hook body (new state):
const [previousWeekPercent, setPreviousWeekPercent] = useState<number | undefined>(undefined);

// On mount (once, separate useEffect with [] deps):
useEffect(() => {
  AsyncStorage.getItem(PREV_WEEK_KEY)
    .then(val => { if (val !== null) setPreviousWeekPercent(Number(val)); })
    .catch(() => {}); // silent failure
}, []);

// After successful fetch in fetchData (after setData(freshData)):
const isMonday = new Date().getDay() === 1;
if (isMonday) {
  const midpoint = (freshData.aiPctLow + freshData.aiPctHigh) / 2;
  AsyncStorage.setItem(PREV_WEEK_KEY, String(midpoint)).catch(() => {});
  setPreviousWeekPercent(midpoint);
}

// Return:
return { data, isLoading, lastFetchedAt, error, refetch, previousWeekPercent };
```

### Key Constants

```typescript
const RING_SIZE = 160;          // dp — outer diameter of AIRingChart
const BRAINLIFT_TARGET = 5;     // hours per week
```

### Edge Cases

1. **`brainliftHours = 0`**: `brainliftPercent = 0`. Pass `brainliftPercent={0}` to `AIRingChart` — inner ring renders empty arc. `ProgressBar` shows empty bar.

2. **`aiPercent = 0` (no tagged slots)**: Ring shows empty outer arc. `MetricValue` animates to 0. Correct behavior.

3. **`previousWeekPercent` = same as current**: delta = 0.0 → badge shows "+0.0%" in `text-textSecondary`.

4. **Large brainliftHours (>5h)**: `brainliftPercent` can exceed 100. `AIRingChart` inner `Ring` clamps to 100. `ProgressBar` clamps to 1.0.

5. **`isLoading=true` with existing `data`**: Show real data with `RefreshControl` spinner — no skeleton overlay.

6. **`AsyncStorage` read failure on mount**: catch silently, `previousWeekPercent` stays `undefined`. Badge hidden.

7. **`AsyncStorage` write failure on Monday**: catch silently. Current week data still correct. Badge may be stale next week — acceptable.

8. **No config on mount**: `useAIData` guards `if (!config) return` — no fetch, `data=null`, `isLoading=false`. Screen shows empty state.

### Test File Locations

```
hourglassws/src/components/__tests__/AITab.test.tsx    — screen render tests (new)
hourglassws/src/hooks/__tests__/useAIData.test.ts      — hook unit tests (extend existing)
```

### Mock Strategy

- `useAIData` → Jest module mock returning controlled `AIWeekData` + `previousWeekPercent` values
- `@shopify/react-native-skia` → existing mock at `hourglassws/__mocks__/@shopify/react-native-skia.ts`
- `@react-native-async-storage/async-storage` → Jest mock (already configured in test setup)
- `react-native-reanimated` → existing mock (babel preset or manual)
- NativeWind `className` assertions: test component presence via `testID`, not `className` prop value (per 01-nativewind-verify spec notes)
