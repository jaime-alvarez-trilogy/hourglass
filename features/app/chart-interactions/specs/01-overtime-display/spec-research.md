# Spec Research: 01-overtime-display

**Feature:** chart-interactions
**Spec:** 01-overtime-display
**Complexity:** S

---

## Problem Context

When a contractor logs more hours than their weekly limit, the app currently transitions to `crushedIt` panel state but doesn't distinguish "hit the limit" from "went over it." The user wants a dramatic visual celebration for overtime — a hero overtime number and a white-gold color shift that communicates "WOW, you're doing overtime."

---

## Exploration Findings

### Existing overtime data
`src/lib/hours.ts → calculateHours()` already computes:
```typescript
overtimeHours: Math.max(0, total - weeklyLimit)  // > 0 when over limit
```
This is returned in `HoursData` from `useHoursData`. **No new API calls needed.**

### Existing panel states
`src/lib/panelState.ts → computePanelState(hoursWorked, weeklyLimit, daysElapsed)`:
```typescript
type PanelState = 'idle' | 'onTrack' | 'behind' | 'critical' | 'crushedIt'
```
Priority order (highest first): idle → crushedIt → onTrack → behind → critical

`crushedIt` is triggered when `hours >= weeklyLimit`. This covers both "hit limit" and "over limit." We need a new `overtime` state with higher priority when `hours > weeklyLimit` (strictly over).

### Home tab hero panel (app/(tabs)/index.tsx)
Renders `MetricValue` for hero hours number. Sub-metrics row shows today/avg/remaining.
When overtime: hero should show OT hours (e.g. `1.5h`) with label "overtime this week".

### PanelGradient.tsx
Maps `PanelState` to a gradient color. Needs `overtime` color: `#FFF8E7` (warm white-gold, near-white — feels bright/celebratory).

### WeeklyBarChart.tsx
Currently colors bars: gold (today), muted (future), success/green (past). Needs a `weeklyLimit` prop so bars that push total beyond limit shift to `#FFF8E7` (same warm white-gold).

---

## Key Decisions

**Decision 1: New `overtime` PanelState vs. sub-state**
→ New state `'overtime'` added to the type union. Priority: `hours > weeklyLimit` → `overtime` (above crushedIt which fires on `>=`). Clean separation of "achieved" vs "exceeded."

**Decision 2: Overtime color**
→ `#FFF8E7` — warm white with a gold tint. Not the regular `colors.gold` (#E8C97A) which is used everywhere. A brighter, near-white version that feels like something extraordinary happened. Added as constant `OVERTIME_WHITE_GOLD`.

**Decision 3: Bar chart overtime coloring**
→ WeeklyBarChart receives `weeklyLimit?: number`. Bars where the running total crosses weeklyLimit shift to `OVERTIME_WHITE_GOLD`. This requires computing running totals per bar — straightforward since data is chronological.

**Decision 4: Hero display logic**
→ When `panelState === 'overtime'`:
  - Hero value = `hoursData.overtimeHours` (not total hours)
  - Hero unit = "h OT"
  - Sub-label = "overtime this week"
  - Regular sub-metrics (today / avg / remaining) hidden or replaced

---

## Interface Contracts

```typescript
// src/lib/panelState.ts — additive change
type PanelState = 'idle' | 'onTrack' | 'behind' | 'critical' | 'crushedIt' | 'overtime'

// computePanelState — priority change:
// if hours > weeklyLimit → return 'overtime'   ← NEW (highest priority after idle)
// if hours >= weeklyLimit → return 'crushedIt' ← unchanged (never hit if overtime fires)

// src/components/WeeklyBarChart.tsx — new prop
interface WeeklyBarChartProps {
  data: DailyHours[];
  maxHours?: number;
  width: number;
  height: number;
  weeklyLimit?: number;   // NEW: bars accumulating beyond this shift to white-gold
}

// src/components/PanelGradient.tsx — new state handled
// overtime → gradient color #FFF8E7 (OVERTIME_WHITE_GOLD) at 35% opacity top→transparent

// app/(tabs)/index.tsx — conditional hero display
// if panelState === 'overtime':
//   heroValue  = hoursData.overtimeHours
//   heroUnit   = "h OT"
//   heroColor  = 'text-[#FFF8E7]'
//   subLabel   = "overtime this week"
// else:
//   heroValue  = hoursData.total
//   heroUnit   = "h"
//   subLabel   = normal sub-metrics row
```

### Source Tracing

| Field | Source |
|-------|--------|
| `overtimeHours` | `useHoursData().data.overtimeHours` ← `calculateHours()` in hours.ts |
| `weeklyLimit` | `useConfig().config.weeklyLimit` (default 40) |
| `panelState` | `computePanelState(total, weeklyLimit, daysElapsed)` |
| `OVERTIME_WHITE_GOLD` | Constant `'#FFF8E7'` — defined in WeeklyBarChart + PanelGradient |

---

## Test Plan

### `computePanelState` — new overtime state

**Happy Path:**
- [ ] `hours=41, weeklyLimit=40` → `'overtime'`
- [ ] `hours=40, weeklyLimit=40` → `'crushedIt'` (still fires, not overtime)
- [ ] `hours=39, weeklyLimit=40` → not overtime (normal states)

**Edge Cases:**
- [ ] `hours=40.01, weeklyLimit=40` → `'overtime'` (strict >)
- [ ] `weeklyLimit=0, hours=0` → `'idle'` (weeklyLimit=0 guard preserved)
- [ ] `hours=0, weeklyLimit=40` → not overtime

### `WeeklyBarChart` — overtime bar coloring

**Happy Path:**
- [ ] With `weeklyLimit=40`, bars that push cumulative total beyond 40 → OVERTIME_WHITE_GOLD color
- [ ] Bars entirely within limit → existing color logic unchanged
- [ ] No `weeklyLimit` prop → all bars use existing color logic

**Edge Cases:**
- [ ] All hours within limit → no white-gold bars
- [ ] All hours over limit (e.g. logged 50h with 40h limit) → all past bars white-gold
- [ ] `weeklyLimit` exactly hit (cumulative = 40) → that day's bar is crushedIt gold, not white-gold

### Home tab overtime hero display (source-inspection / render test)

- [ ] When `panelState === 'overtime'`, hero renders overtime hours, not total
- [ ] When `panelState !== 'overtime'`, normal total hours displayed
- [ ] PanelGradient renders `overtime` state without crash

---

## Files to Reference

- `src/lib/panelState.ts` — computePanelState logic
- `src/components/WeeklyBarChart.tsx` — bar color logic, DailyHours type
- `src/components/PanelGradient.tsx` — state → gradient color mapping
- `app/(tabs)/index.tsx` — hero panel display, MetricValue usage
- `src/hooks/useHoursData.ts` — HoursData shape (overtimeHours field)
- `src/lib/hours.ts` — overtimeHours calculation
