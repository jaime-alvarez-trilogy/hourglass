# Spec Research: 03-overview-hero

## Problem Context

The Overview screen has no hero — it opens directly into 4 chart cards with a toggle. There is no primary signal. This spec adds a dual-metric hero card (total earnings + total hours with overtime badge) and wires the ambient layer to earnings pace, making the screen's glass cards react to earnings health.

## Scope

**FR1** — `OverviewHeroCard` component: dual metrics (earnings + hours) with period window
**FR2** — Overtime badge on hours: `42h +2h OT` in `overtimeWhiteGold` when overtime exists
**FR3** — `computeEarningsPace(earnings[], window)` → pace ratio → ambient signal
**FR4** — Wire `AmbientBackground` to overview screen using earnings pace color
**FR5** — Move 4W/12W toggle into the hero card (replaces standalone toggle row)

## Exploration Findings

### Current overview structure (`app/(tabs)/overview.tsx`)
```
<FadeInScreen>
  <SafeAreaView>
    <ScrollView>
      <View> title + 4W/12W toggle </View>   ← header row (to be absorbed into hero)
      <Animated.View> week snapshot panel </Animated.View>  ← scrub panel (stays)
      <ChartSection earnings />
      <ChartSection hours />
      <ChartSection aiPct />
      <ChartSection brainlift />
    </ScrollView>
  </SafeAreaView>
</FadeInScreen>
```

### Available data from `useOverviewData`
```typescript
interface UseOverviewDataResult {
  data: {
    earnings: number[];       // length = window (4 or 12 entries)
    hours: number[];          // same length
    aiPct: number[];          // same length
    brainliftHours: number[]; // same length
    weekLabels: string[];     // e.g. ["Mar 3", "Mar 10", ...]
  } | undefined;
  isLoading: boolean;
}
```
Total earnings = `earnings[earnings.length - 1]` is the CURRENT week. Sum of all = total for period.
Wait — actually `earnings[]` is one entry per week. `sum(earnings)` = total earnings over the window.
`hours[hours.length - 1]` = current week. `sum(hours)` = total hours over window.

### Overtime data
`useHoursData()` returns `hoursData` which includes:
- `hoursData.total` — total hours this week (may exceed weeklyLimit)
- From `calculateHours()` the `weeklyLimit` is available via `useConfig()`
The overtime amount = `Math.max(0, total - weeklyLimit)` for current week.
For historical overtime: `useWeeklyHistory()` snapshots don't currently include overtime per week. **Overtime badge is current-week only** (sufficient for the hero card).

### Earnings pace computation
No existing function. Need to create:
```typescript
computeEarningsPace(earnings: number[]): number
// ratio: currentPeriod earnings vs prior period average
// earnings[] is ordered oldest→newest
// For window=4: prior = avg(earnings[0..2]), current = earnings[3]
// For window=12: prior = avg(earnings[0..10]), current = earnings[11]
// Edge: length < 2 → return 1.0 (assume strong, no comparison possible)
```

### Period total formatting
- Total earnings: `$12,450` format (same as existing MetricValue earnings display)
- Total hours: `164h` format, with overtime badge: `164h +3h OT` (color: overtimeWhiteGold)
- Period label: "LAST 4 WEEKS" / "LAST 12 WEEKS" based on window

## Key Decisions

1. **Hero shows period TOTALS, not current week** — The overview tab's signal is the trend window. Total earnings and total hours over the selected window are the hero metrics.

2. **Overtime badge is current-week only** — Historical per-week overtime isn't in `useWeeklyHistory()` snapshots. Badge shows current week's overtime (`max(0, total - weeklyLimit)`) from `useHoursData()`. Simple and accurate.

3. **4W/12W toggle moves into hero card** — The toggle is the filter for the hero metrics. Placing it in the hero card is both more ergonomic and reinforces hierarchy.

4. **EarningsPace → ambient color** — `computeEarningsPace` returns a ratio (current/prior avg). `getAmbientColor({ type: 'earningsPace', ratio })` maps it to gold/warning/critical. No prior data → gold (assume strong).

5. **OverviewHeroCard is a new component** — Not a variant of PanelGradient. Uses `Card` as base (glass card with AmbientBackground behind it). Internal layout: period label | toggle | [earnings | hours] side by side.

6. **AmbientBackground placement** — Same pattern as home: absolute, outside ScrollView, inside SafeAreaView.

## Interface Contracts

```typescript
// New component: src/components/OverviewHeroCard.tsx
interface OverviewHeroCardProps {
  totalEarnings: number;      // sum of earnings[] for window
  totalHours: number;         // sum of hours[] for window
  overtimeHours: number;      // current week overtime (may be 0)
  window: 4 | 12;
  onWindowChange: (w: 4 | 12) => void;
}
export default function OverviewHeroCard(props: OverviewHeroCardProps): JSX.Element

// New pure function: src/lib/overviewUtils.ts (or inline in overview.tsx)
export function computeEarningsPace(earnings: number[]): number
// Returns ratio: last entry / avg(all prior entries). Edge: length < 2 → 1.0.

// overview.tsx changes:
// - Remove standalone toggle row
// - Add OverviewHeroCard before chart cards
// - Add AmbientBackground with getAmbientColor({ type: 'earningsPace', ratio: earningsPace })
// - overtimeHours = max(0, hoursData.total - (config.weeklyLimit ?? 0))
```

### Source Tracing

| Field | Source |
|-------|--------|
| `totalEarnings` | `sum(overviewData.data.earnings)` — from `useOverviewData()` |
| `totalHours` | `sum(overviewData.data.hours)` — from `useOverviewData()` |
| `overtimeHours` | `Math.max(0, hoursData.total - config.weeklyLimit)` — `useHoursData()` + `useConfig()` |
| `window` | existing state in overview.tsx |
| `earningsPace ratio` | `computeEarningsPace(overviewData.data.earnings)` |
| `getAmbientColor` | imported from `AmbientBackground` (01-ambient-layer) |

## Test Plan

### `computeEarningsPace`
**Signature:** `(earnings: number[]) => number`
- [ ] `[100, 100, 100, 100]` → `1.0` (current = prior avg)
- [ ] `[80, 80, 80, 120]` → `1.5` (strong — 120 vs 80 avg)
- [ ] `[100, 100, 100, 60]` → `0.6` (behind)
- [ ] `[100, 100, 100, 0]` → `0.0` (critical — no earnings this period)
- [ ] `[100]` (length 1) → `1.0` (no prior, assume strong)
- [ ] `[]` (empty) → `1.0` (no data, assume strong)

### `OverviewHeroCard`
- [ ] Renders total earnings with `$` prefix
- [ ] Renders total hours with `h` suffix
- [ ] Renders overtime badge when `overtimeHours > 0`
- [ ] Overtime badge uses `overtimeWhiteGold` color token
- [ ] Does NOT render overtime badge when `overtimeHours === 0`
- [ ] Renders 4W/12W toggle
- [ ] Toggle calls `onWindowChange` with correct value
- [ ] Period label shows "LAST 4 WEEKS" / "LAST 12 WEEKS"

### Overview screen ambient wiring
- [ ] `AmbientBackground` rendered outside ScrollView
- [ ] `computeEarningsPace` called with `overviewData.data.earnings`
- [ ] `getAmbientColor({ type: 'earningsPace', ... })` passed to `AmbientBackground`

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/OverviewHeroCard.tsx` | **Create** |
| `src/components/__tests__/OverviewHeroCard.test.tsx` | **Create** |
| `src/lib/overviewUtils.ts` | **Create** (computeEarningsPace) |
| `src/lib/__tests__/overviewUtils.test.ts` | **Create** |
| `app/(tabs)/overview.tsx` | **Modify** — add hero card + ambient, remove standalone toggle |
| `app/(tabs)/__tests__/overview.test.tsx` | **Modify** — add wiring assertions |

## Files to Reference

- `app/(tabs)/overview.tsx` — full current structure
- `src/hooks/useOverviewData.ts` — data shape
- `src/hooks/useHoursData.ts` — for overtimeHours
- `src/components/AmbientBackground.tsx` — from 01-ambient-layer (blocked by)
- `src/components/Card.tsx` — base for OverviewHeroCard
- `src/lib/colors.ts` — overtimeWhiteGold, gold, warning, critical
