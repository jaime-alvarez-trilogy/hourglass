# Spec Research — 04-chart-polish

## Problem Context

Run-002 synthesis polish section: "Chart line thickness 3px + shadowColor glow." Run-001: "chart line drawing is smooth but could be more holographic." The `TrendSparkline` currently renders a 2.5px core line with a 10px outer glow at `BlurMask blur=8`. Run-002 explicitly calls for 3px thickness and stronger glow to achieve the "holographic data visualisation" aesthetic.

Additionally, the `WeeklyBarChart` uses a fixed `gold` colour for "today" regardless of whether that represents a critically low pace — the synthesis flagged a bar being shown in the wrong colour.

## Exploration Findings

### TrendSparkline current paint layers (lines 323–338)
```tsx
// Outer glow layer (already present)
<Paint color={color + '40'} style="stroke" strokeWidth={10} strokeCap="round">
  <BlurMask blur={8} style="solid" />
</Paint>

// Core line (already present)
// strokeWidth={2.5} (passed via prop default or parent)
```
The glow exists but is modest. To match the "emitting light through glass" target:
- Core: 2.5 → **3px**
- Outer glow strokeWidth: 10 → **14px**
- BlurMask blur: 8 → **12**
- Add a **mid-glow layer** between outer and core: `strokeWidth={7}`, `opacity=0.5`, `blur=4`

This creates a 3-layer glow matching the AIConeChart pattern (glow + mid + core).

### TrendSparkline props
```typescript
// strokeWidth prop defaults to 2 at line 142:
strokeWidth = 2,
// But parent callers may override.
// The "default" behaviour is called with strokeWidth={2.5} in some callers.
```
**Fix:** Change default from 2 to 3. Update the glow layers proportionally.

### WeeklyBarChart colour logic (from exploration agent)
- Completed days: `success` (#10B981)
- Today: `gold` (#E8C97A)  ← this is the issue
- Future days: `textMuted` (#484F58)
- Overtime cumulative: `overtimeWhiteGold`

**The synthesis concern:** A bar for "today" where hours are critically low shows as gold. Gold = money/earnings, not hours status. Today's bar should reflect status:
- If today's hours are critically behind pace: `critical`
- If behind pace: `warning`
- If on track or done: `success` (for completed days, unchanged)
- Today's in-progress bar: use the panel state colour (same logic as hero panel)

**However**: the bar chart is per-day, not per-week. "Today" is the in-progress bar. Using gold for "today" is a brand violation (gold = money). Today should use the panel's current state colour instead:
- `panelState === 'onTrack'` → `success`
- `panelState === 'behind'` → `warning`
- `panelState === 'critical'` → `critical`
- `panelState === 'crushedIt' / 'overtime'` → `overtimeWhiteGold`
- `panelState === 'idle'` → `textMuted`

The `WeeklyBarChart` needs a new prop `todayColor?: string` (defaults to `success`) and callers pass in the panel-state-derived colour.

### AIConeChart glow
Already has a 3-layer glow system (glow + mid + core) with `HOLO_CORE`, `HOLO_GLOW` colours and `BlurMask`. No changes needed here.

### TrendSparkline callers
- `app/(tabs)/index.tsx` (earnings sparkline) — passes `color={colors.gold}`, no explicit `strokeWidth`
- `app/(tabs)/overview.tsx` (4 sparklines) — likely no explicit `strokeWidth`
- `app/(tabs)/ai.tsx` (12-week trajectory) — likely no explicit `strokeWidth`

Changing the default strokeWidth from 2 → 3 applies everywhere automatically. No caller changes needed.

## Key Decisions

1. **TrendSparkline default strokeWidth: 2 → 3**: Applies globally to all 6+ sparkline instances.
2. **Three-layer glow**: Outer (14px, blur=12) → Mid (7px, blur=4, 50% opacity) → Core (3px, sharp). Matches AIConeChart's holographic pattern.
3. **WeeklyBarChart `todayColor` prop**: Callers provide the panel-state-derived colour. Default remains `success` to avoid breaking the chart in isolation.
4. **Home screen passes `todayColor`**: `index.tsx` computes `panelState` and passes the mapped colour to `WeeklyBarChart`.
5. **AIConeChart unchanged**: Already at the right holographic quality.

## Interface Contracts

### Updated `TrendSparkline` props
```typescript
interface TrendSparklineProps {
  // ... existing props unchanged ...
  strokeWidth?: number;  // default: 3 (was 2)
}
```
**Source:** `src/components/TrendSparkline.tsx`

### Updated glow layers in TrendSparkline
```typescript
// Layer 1 — outer glow
<Paint color={color + '40'} style="stroke" strokeWidth={14} strokeCap="round">
  <BlurMask blur={12} style="solid" />
</Paint>

// Layer 2 — mid glow (NEW)
<Paint color={color + '80'} style="stroke" strokeWidth={7} strokeCap="round">
  <BlurMask blur={4} style="solid" />
</Paint>

// Layer 3 — core line (strokeWidth from prop, default 3)
```
**Source:** AIConeChart.tsx glow pattern (existing reference)

### Updated `WeeklyBarChart` props
```typescript
interface WeeklyBarChartProps {
  // ... existing props unchanged ...
  todayColor?: string;  // hex color for today's in-progress bar. Default: colors.success
}
```
**Source:** `src/components/WeeklyBarChart.tsx`

### Panel state → today colour mapping (in index.tsx)
```typescript
const TODAY_BAR_COLORS: Record<PanelState, string> = {
  onTrack:   colors.success,
  behind:    colors.warning,
  critical:  colors.critical,
  crushedIt: colors.overtimeWhiteGold,
  overtime:  colors.overtimeWhiteGold,
  idle:      colors.textMuted,
};
// Usage: todayColor={TODAY_BAR_COLORS[panelState]}
```
**Source:** `src/lib/colors.ts`, `src/lib/panelState.ts`

## Test Plan

### TrendSparkline strokeWidth default
- [ ] Default `strokeWidth` is 3 (not 2)
- [ ] Outer glow Paint has `strokeWidth={14}`
- [ ] Mid glow Paint exists with `strokeWidth={7}` and `BlurMask blur={4}`
- [ ] Outer glow BlurMask has `blur={12}` (was 8)

### WeeklyBarChart todayColor prop
- [ ] `todayColor` prop accepted with default value
- [ ] When `todayColor` provided, today bar uses that color
- [ ] When `todayColor` omitted, today bar uses `colors.success` (backward compat)

### index.tsx TODAY_BAR_COLORS mapping
- [ ] `TODAY_BAR_COLORS` maps all 6 PanelState values
- [ ] `panelState === 'critical'` → `colors.critical`
- [ ] `panelState === 'behind'` → `colors.warning`
- [ ] WeeklyBarChart receives `todayColor={TODAY_BAR_COLORS[panelState]}`

## Files to Modify

| File | Change |
|------|--------|
| `src/components/TrendSparkline.tsx` | strokeWidth default 2→3, enhance glow layers |
| `src/components/WeeklyBarChart.tsx` | Add `todayColor` prop |
| `app/(tabs)/index.tsx` | Add TODAY_BAR_COLORS map, pass todayColor to WeeklyBarChart |

## Files to Reference

- `src/components/AIConeChart.tsx` — 3-layer glow pattern (reference implementation)
- `src/lib/colors.ts` — all hex values
- `src/lib/panelState.ts` — PanelState type
- `gauntlet-runs/video/run-002-2026-03-16/synthesis.md` — "chart line thickness 3px + shadowColor glow"
