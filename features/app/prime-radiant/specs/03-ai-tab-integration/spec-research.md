# Spec Research: AI Tab Integration

**Date:** 2026-03-15
**Author:** @trilogy
**Spec:** `03-ai-tab-integration`

---

## Problem Context

Wire the `AIConeChart` component (from spec 02) into two places: the AI tab as a full prominent visualization, and the home tab as a compact card. This spec handles placement, data wiring, layout measurement, and the `useFocusKey` pattern to re-animate on tab re-focus.

Depends on `01-cone-math` for `computeAICone` and `02-cone-chart` for `AIConeChart`.

---

## Exploration Findings

### Existing Patterns

| Pattern | Used In | Notes |
|---------|---------|-------|
| `useFocusKey` for chart re-animation | `index.tsx`, `overview.tsx` | Key increments on tab re-focus → chart remounts → re-animates |
| `onLayout` for chart dimensions | All chart usages | `useState({ width: 0, height: 0 })` + `<View onLayout={...}>` |
| `useAIData()` | `app/(tabs)/ai.tsx` | Returns `AIWeekData` with `dailyBreakdown`, `totalSlots`, aggregate AI% |
| `useConfig()` | All tab screens | `config.weeklyLimit` for hours ceiling |
| Card + SectionLabel pattern | All tab screens | `<Card><SectionLabel>PRIME RADIANT</SectionLabel>...</Card>` |
| `FadeInScreen` wrapper | All tab screens | Outermost wrapper — already in ai.tsx |

### Key Files

| File | Relevance |
|------|-----------|
| `app/(tabs)/ai.tsx` | Modify: add full AIConeChart as a prominent card |
| `app/(tabs)/index.tsx` | Modify: add compact AIConeChart card between weekly chart and earnings |
| `src/hooks/useAIData.ts` | Existing source for `dailyBreakdown`, `totalSlots`, `taggedSlots` |
| `src/hooks/useFocusKey.ts` | Key-based remount for re-animation on tab switch |
| `src/lib/aiCone.ts` | `computeAICone()` — called during render |
| `src/components/AIConeChart.tsx` | The chart component being wired |

### Integration Points

**AI tab:**
- `useAIData().data` provides `dailyBreakdown` and aggregate counts
- `useConfig().config.weeklyLimit` provides the X-axis ceiling
- `computeAICone(data.dailyBreakdown, weeklyLimit)` called in the render body
- `AIConeChart` placed inside a `Card` below the existing ring chart + stats

**Home tab:**
- Same data sources (`useAIData`, `useConfig`) — both already imported in `index.tsx`? No — `useAIData` is not yet imported in `index.tsx`. Need to add it.
- Compact card placed between "THIS WEEK" bar chart card and "EARNINGS" card
- `size="compact"`, height ~100px

---

## Key Decisions

### Decision 1: Where in AI Tab Layout

Current AI tab sections from top to bottom:
1. Ring chart (AIRingChart) + delta badge + MetricValue overlay
2. BrainLift card (hours + progress bar)
3. Daily breakdown table
4. Legend card

**Options considered:**
1. Replace the ring chart with the cone — the cone IS the main AI visualization
2. Add cone as a new card between BrainLift card and daily breakdown
3. Add cone as the first card, push ring chart below

**Chosen:** Add as a new card between BrainLift card (section 2) and daily breakdown table (section 3).

**Rationale:** The ring chart gives the current snapshot (your % right now). The cone gives the trajectory (where you're heading). Both are valuable and complementary. The cone is more complex — placing it below the snapshot lets users absorb the summary first, then dive into the trajectory.

### Decision 2: Section Label

**Options considered:**
1. "AI TRAJECTORY"
2. "PRIME RADIANT"
3. "POSSIBILITY CONE"
4. "WHERE YOU'RE HEADING"

**Chosen:** "PRIME RADIANT" for the AI tab (thematic, distinctive), "AI TRAJECTORY" as fallback if it feels too jargon-y.

**Rationale:** The user named this feature "Prime Radiant" — it should be called that. It's distinctive and memorable. Adds personality to the app.

### Decision 3: Home Tab Placement

**Options considered:**
1. Between bar chart (Zone 2) and earnings (Zone 3) — sandwiches between two existing charts
2. After earnings card — bottom of scroll, easy to miss
3. Before bar chart — prominent but pushes weekly bars down

**Chosen:** Between bar chart and earnings (option 1).

**Rationale:** Keeps all data visualization cards together. User sees: today's bars → AI trajectory → earnings trend as they scroll. Natural progression from granular (daily) → forward-looking (cone) → historical (trend).

### Decision 4: Compact Card Height

**Options considered:**
1. 80px — very compact, almost icon-like
2. 100px — readable, clear cone shape visible
3. 140px — starting to feel like a full chart, not compact

**Chosen:** 100px internal chart height, similar to earnings sparkline (60px) but taller given the 2D nature of the cone.

**Rationale:** The cone needs more vertical space than a sparkline because it communicates a 2D space. 100px is enough to see the cone shape clearly without dominating the home tab.

---

## Interface Contracts

### AI Tab Addition

```typescript
// In app/(tabs)/ai.tsx, new card inserted after BrainLift card:

const coneData = useMemo(
  () => data ? computeAICone(data.dailyBreakdown, weeklyLimit) : null,
  [data, weeklyLimit]
);

// Render (inside ScrollView, after BrainLift card):
<Card>
  <SectionLabel className="mb-3">PRIME RADIANT</SectionLabel>
  {isLoading && !data ? (
    <SkeletonLoader height={240} />
  ) : coneData ? (
    <View
      style={{ height: 240 }}
      onLayout={e => setConeDims({ width: e.nativeEvent.layout.width, height: 240 })}
    >
      <AIConeChart
        key={chartKey}
        data={coneData}
        width={coneDims.width}
        height={coneDims.height}
        size="full"
      />
    </View>
  ) : null}
</Card>
```

### Home Tab Addition

```typescript
// In app/(tabs)/index.tsx, new compact card between Zone 2 (bar chart) and Zone 3 (earnings):

const { data: aiData } = useAIData();
const coneData = useMemo(
  () => aiData ? computeAICone(aiData.dailyBreakdown, weeklyLimit) : null,
  [aiData, weeklyLimit]
);

// Render:
{coneData && (
  <Card>
    <SectionLabel className="mb-2">AI TRAJECTORY</SectionLabel>
    <View
      style={{ height: 100 }}
      onLayout={e => setCompactConeDims({ width: e.nativeEvent.layout.width, height: 100 })}
    >
      <AIConeChart
        key={chartKey}
        data={coneData}
        width={compactConeDims.width}
        height={100}
        size="compact"
      />
    </View>
  </Card>
)}
```

### Function Contracts

| Function | Signature | Responsibility | Dependencies |
|----------|-----------|----------------|--------------|
| `AIScreen` (updated) | `() => JSX.Element` | Adds Prime Radiant card with `useMemo`-computed `ConeData` | `useAIData`, `useConfig`, `computeAICone`, `AIConeChart` |
| `HoursDashboard` (updated) | `() => JSX.Element` | Adds compact AI trajectory card | `useAIData`, `computeAICone`, `AIConeChart` |

---

## Test Plan

### AI Tab — Prime Radiant card (integration)

**Happy Path:**
- Card renders with cone chart when data is available
- Skeleton shown during initial load
- Chart re-animates on tab re-focus (chartKey increments)

**Edge Cases:**
- `data === null` (initial state before first fetch): card shows skeleton, not error
- `weeklyLimit === 0` (not configured): `computeAICone` guards this, card not rendered

**Mocks Needed:**
- `useAIData`: mock returning `AIWeekData` with `dailyBreakdown`
- `useConfig`: mock with `weeklyLimit: 40`

### Home Tab — Compact AI trajectory card (integration)

**Happy Path:**
- Card appears between bar chart and earnings card
- `size="compact"` renders without axis labels
- Re-animates on tab switch with `chartKey`

**Edge Cases:**
- `coneData === null` (aiData not yet loaded): card not rendered (conditional render), no layout shift
- Very narrow container: chart fills available width correctly

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/(tabs)/ai.tsx` | modify | Add `coneData` via `useMemo`, add Prime Radiant `Card` with `AIConeChart size="full"`, new `coneDims` state |
| `app/(tabs)/index.tsx` | modify | Import `useAIData` + `computeAICone` + `AIConeChart`, add compact card, new `compactConeDims` state |

---

## Edge Cases to Handle

1. **`data` null guard** — wrap cone card in `coneData ? (...) : null` to avoid showing empty card
2. **Layout width = 0 on first render** — `AIConeChart` returns null when width=0 (handled in component)
3. **`weeklyLimit = 0`** — guard in `computeAICone`, return null `ConeData`; home/AI tabs skip rendering
4. **useMemo dependencies** — include both `data`/`aiData` AND `weeklyLimit` as deps to recompute when config changes
5. **chartKey on home tab** — `useFocusKey()` already used in `index.tsx` for bar chart; reuse same `chartKey` for compact cone too

---

## Open Questions

None remaining.
