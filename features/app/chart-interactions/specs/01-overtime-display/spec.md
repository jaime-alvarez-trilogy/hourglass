# 01-overtime-display

**Status:** Draft
**Created:** 2026-03-15
**Last Updated:** 2026-03-15
**Owner:** @trilogy

---

## Overview

This spec adds a dedicated `overtime` panel state and visual treatment for when a contractor exceeds their weekly hour limit. Currently, `crushedIt` covers both "hit the limit" and "went over it" — there is no visual distinction between the two.

### What is being built

1. **New `overtime` PanelState** — The type union gains an `'overtime'` value with higher priority than `crushedIt`. It fires when `hours > weeklyLimit` (strictly greater), while `crushedIt` continues to fire when `hours === weeklyLimit`.

2. **Overtime hero display on the Home tab** — When `panelState === 'overtime'`, the hero panel shows overtime hours (not total), with the unit "h OT" and the sub-label "overtime this week". The regular today/avg/remaining sub-metrics row is replaced with a single centered overtime call-out.

3. **White-gold bar chart coloring** — `WeeklyBarChart` gains a `weeklyLimit` prop. Bars whose running cumulative total pushes beyond the limit shift to `OVERTIME_WHITE_GOLD` (`#FFF8E7`), a warm near-white that signals "extraordinary achievement".

4. **PanelGradient overtime entry** — `PANEL_GRADIENTS` gains an `overtime` key using `#FFF8E7` at 35% opacity, consistent with the design system rule (status color at 35% opacity top → transparent).

5. **StateBadge + STATE_COLORS/LABELS in index.tsx** — Two record maps must include `overtime` so TypeScript exhaustiveness checks pass and the badge renders "OVERTIME" in the white-gold color.

### How it works

The data is already present: `HoursData.overtimeHours = Math.max(0, total - weeklyLimit)`. No new API calls are required. The change is purely presentational — routing existing data through a new visual path when the overtime condition is met.

The `PanelState` type is defined in `src/lib/reanimated-presets.ts` and re-exported from `src/lib/panelState.ts`. Both files need updating.

---

## Out of Scope

1. **Push notifications for overtime milestone** — **Descoped:** Explicitly excluded in FEATURE.md. No notification system changes in this spec.

2. **Server-side recording of overtime** — **Descoped:** The Crossover API has no overtime-recording endpoint for contributors. The overtime value is computed client-side only.

3. **Animated transition between crushedIt and overtime** — **Deferred to 03-scrub-engine:** The springPremium transition in `PanelGradient` already handles state changes generically. No special two-step animation for the crushedIt→overtime shift is needed here; future scrub work may revisit.

4. **WeeklyBarChart scrubbing** — **Descoped:** FEATURE.md explicitly descopes "Scrubbing the WeeklyBarChart on the home screen (7 days only, simple enough as-is)."

5. **Editing past data via overtime interaction** — **Descoped:** Read-only display only. No tap-to-edit or adjustment workflow.

6. **Overtime watermark text in the bar chart** — **Deferred to 02-watermarks:** Overlay text on the chart is handled in the next spec.

7. **Lock screen / home screen widget overtime display** — **Descoped:** The Expo widget layer is a separate feature track (`#6 widgets`). Widget rendering is not in scope for chart-interactions.

---

## Functional Requirements

### FR1 — Add `overtime` PanelState

Extend the `PanelState` type and `computePanelState()` logic so that exceeding the weekly limit produces a dedicated state.

**Changes:**
- `src/lib/reanimated-presets.ts`: Add `'overtime'` to the `PanelState` type union.
- `src/lib/panelState.ts`: Insert an `overtime` check before the `crushedIt` check in `computePanelState()`.

**Logic:**
```
if (hours > weeklyLimit) return 'overtime';   // NEW — strictly over
if (hours >= weeklyLimit) return 'crushedIt'; // unchanged — hit exactly
```

The `weeklyLimit <= 0` guard remains at the top (returns `'idle'`), so no division-by-zero risk.

**Success Criteria:**
- `computePanelState(41, 40, 3)` returns `'overtime'`
- `computePanelState(40, 40, 5)` returns `'crushedIt'`
- `computePanelState(40.01, 40, 3)` returns `'overtime'`
- `computePanelState(39.9, 40, 3)` returns `'onTrack'` or `'behind'` (not overtime)
- `computePanelState(0, 0, 0)` returns `'idle'` (zero-limit guard unchanged)
- `computePanelState(0, 40, 0)` returns `'idle'` (no hours, no days)

---

### FR2 — WeeklyBarChart overtime bar coloring

Add a `weeklyLimit?: number` prop to `WeeklyBarChart`. Bars whose running cumulative total pushes beyond the limit render in `OVERTIME_WHITE_GOLD` (`#FFF8E7`).

**Logic:**
- Compute a running total across bars in chronological order (index 0 → 6).
- For each bar: if `runningTotal > weeklyLimit` (after adding this bar's hours), use `OVERTIME_WHITE_GOLD`.
- If `weeklyLimit` is not provided, all bars use existing color logic unchanged.
- Future bars (`isFuture === true`) always use `colors.textMuted` regardless of limit.
- The today bar uses `colors.gold` unless it pushes into overtime, in which case it uses `OVERTIME_WHITE_GOLD`.

**Constant:**
```typescript
const OVERTIME_WHITE_GOLD = '#FFF8E7';
```

**Success Criteria:**
- With `weeklyLimit=40` and cumulative data reaching 41h on day 5, day-5 bar color is `#FFF8E7`.
- Bars where cumulative total is ≤ 40h use existing color (gold/muted/success).
- Without `weeklyLimit` prop, existing color logic is fully preserved.
- If all hours are over limit (e.g. 50h total, 40h limit), all non-future past bars are `#FFF8E7`.
- When cumulative total hits exactly `weeklyLimit` (not over), that bar remains `colors.gold` or `colors.success` (not white-gold).

---

### FR3 — PanelGradient overtime entry

Add `overtime` to the `PANEL_GRADIENTS` constant in `PanelGradient.tsx`.

**Entry:**
```typescript
overtime: {
  colors: ['#FFF8E759', 'transparent'],  // #FFF8E7 at 35% opacity (0x59 = 89)
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
},
```

The `PANEL_GRADIENTS` type is `Record<PanelState, ...>`, so adding `'overtime'` to the type union (FR1) will make TypeScript require this entry — the build fails until it is added.

**Success Criteria:**
- `PANEL_GRADIENTS['overtime']` exists and has a `colors` array.
- `PanelGradient` renders without crash when `state='overtime'` is passed.
- The gradient color hex is `#FFF8E759` (warm white-gold at 35% opacity).

---

### FR4 — Home tab overtime hero display

Update `app/(tabs)/index.tsx` to handle the `overtime` panel state.

**Changes:**

1. `STATE_LABELS` — add `overtime: 'OVERTIME'`
2. `STATE_COLORS` — add `overtime: 'text-[#FFF8E7]'` (inline Tailwind for custom color)
3. Hero panel conditional logic — when `panelState === 'overtime'`:
   - `MetricValue` shows `data.overtimeHours` (not `data.total`)
   - Unit is `"h OT"`
   - Sub-label reads `"overtime this week"` (replaces `"of {weeklyLimit}h goal"`)
   - Sub-metrics row (today/avg/remaining) is **hidden** and replaced with a single centered overtime line
4. Pass `weeklyLimit` prop to `WeeklyBarChart` so bar coloring activates.

**Overtime hero block (pseudocode):**
```
if panelState === 'overtime':
  <MetricValue value={data.overtimeHours} unit="h OT" colorClass="text-[#FFF8E7]" />
  <Text>"overtime this week"</Text>
  <StateBadge state="overtime" />   // renders "OVERTIME" in white-gold
else:
  <MetricValue value={data.total} unit="h" />
  <Text>"of {weeklyLimit}h goal"</Text>
  <StateBadge state={panelState} />
  <SubMetrics row />
```

**Success Criteria:**
- When `panelState === 'overtime'`, hero value is `overtimeHours`, unit is "h OT".
- When `panelState === 'overtime'`, sub-label is "overtime this week" and the today/avg/remaining row is not rendered.
- When `panelState !== 'overtime'`, the existing display is fully preserved.
- `WeeklyBarChart` receives `weeklyLimit` prop in all cases.
- TypeScript compiles without error (all `Record<PanelState, ...>` maps include `overtime`).

---

## Technical Design

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/src/lib/reanimated-presets.ts` | Add `'overtime'` to `PanelState` type union (line 170) |
| `hourglassws/src/lib/panelState.ts` | Add `hours > weeklyLimit` → `'overtime'` check before `crushedIt` |
| `hourglassws/src/components/WeeklyBarChart.tsx` | Add `weeklyLimit?: number` prop, `OVERTIME_WHITE_GOLD` constant, running-total color logic |
| `hourglassws/src/components/PanelGradient.tsx` | Add `overtime` key to `PANEL_GRADIENTS` |
| `hourglassws/app/(tabs)/index.tsx` | Add `overtime` to `STATE_LABELS` / `STATE_COLORS`; add conditional overtime hero block; pass `weeklyLimit` to `WeeklyBarChart` |

### Files to Create

| File | Purpose |
|------|---------|
| `hourglassws/src/components/__tests__/WeeklyBarChart.test.tsx` | New test file for bar chart overtime coloring |

### Data Flow

```
useHoursData() → HoursData { total, overtimeHours, ... }
useConfig()    → { weeklyLimit }

computePanelState(total, weeklyLimit, daysElapsed)
  → PanelState ('overtime' | 'crushedIt' | ...)

index.tsx hero panel:
  panelState === 'overtime'
    → MetricValue(overtimeHours, "h OT")
    → "overtime this week"
  else
    → MetricValue(total, "h")
    → "of {weeklyLimit}h goal"
    → SubMetrics row

PanelGradient(state='overtime')
  → PANEL_GRADIENTS['overtime'].colors = ['#FFF8E759', 'transparent']

WeeklyBarChart(data, weeklyLimit)
  → running cumulative total per bar
  → bar color = OVERTIME_WHITE_GOLD if runningTotal > weeklyLimit
```

### Bar Chart Color Algorithm

```typescript
const OVERTIME_WHITE_GOLD = '#FFF8E7';

// Compute running total before the JSX map:
let runningTotal = 0;

data.map((entry, index) => {
  if (!entry.isFuture) {
    runningTotal += entry.hours;
  }

  let barColor: string;
  if (entry.isFuture) {
    barColor = colors.textMuted;
  } else if (weeklyLimit !== undefined && runningTotal > weeklyLimit) {
    barColor = OVERTIME_WHITE_GOLD;
  } else if (entry.isToday) {
    barColor = colors.gold;
  } else {
    barColor = colors.success;
  }
  // ...render bar with barColor
})
```

Note: `runningTotal` must be computed outside the JSX expression (in a `let` before `data.map()`), since JSX map callbacks should not carry mutable state between iterations. The running total accumulates as bars are processed left-to-right.

### PanelState Type Location

`PanelState` is defined in `src/lib/reanimated-presets.ts` (line 170), not `panelState.ts`. The latter only re-exports it. The type union must be updated in `reanimated-presets.ts`.

### Edge Cases

| Case | Expected Behaviour |
|------|--------------------|
| `weeklyLimit = 0` | `computePanelState` returns `'idle'` immediately — overtime check never reached |
| `overtimeHours = 0` when showing overtime hero | Should not happen (overtime state requires `hours > weeklyLimit` which implies `overtimeHours > 0`), but MetricValue handles 0 gracefully |
| `data` is null/loading | Hero panel shows skeleton loader; `panelState` is computed with `data?.total ?? 0` which cannot trigger overtime if data is absent |
| Exactly `weeklyLimit` hours | `hours === weeklyLimit` → `crushedIt`, not `overtime`; bar at exactly limit does NOT get white-gold color |
| All bars over limit | Every non-future bar's running total exceeds limit → all non-future bars white-gold |
| `weeklyLimit` not passed to WeeklyBarChart | `weeklyLimit === undefined`, running-total check short-circuits → existing color logic |

### TypeScript Exhaustiveness

Adding `'overtime'` to the `PanelState` union will cause TypeScript compile errors in any `Record<PanelState, ...>` that lacks an `overtime` key. This spec touches all such records:
- `PANEL_GRADIENTS` in `PanelGradient.tsx`
- `STATE_LABELS` in `index.tsx`
- `STATE_COLORS` in `index.tsx`

### Test File Locations

- `hourglassws/src/lib/__tests__/panelState.test.ts` — add overtime cases to existing test suite
- `hourglassws/src/components/__tests__/WeeklyBarChart.test.tsx` — new file for overtime coloring cases
- `hourglassws/app/(tabs)/__tests__/index.test.tsx` — add overtime hero render cases to existing test suite
