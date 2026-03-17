# Spec Research: AI Tab Screen Rebuild

**Date:** 2026-03-16
**Author:** @trilogy
**Spec:** `04-ai-tab-screen`

---

## Problem Context

`ai.tsx` currently starts all animations at mount time regardless of whether data has arrived. On first navigation to the AI tab:

1. `useStaggeredEntry({ count: 5 })` fires **10 springs** simultaneously (opacity + translateY per card) — worklet pressure at mount
2. `FadeInScreen` fires an additional **2 animations** (opacity + translateY) — stacked on the same mount event
3. `AIArcHero` fires its arc animation (now fixed in spec 01 to be safe) but previously was the crash source
4. `AmbientBackground` fires its `withSpring(1)` opacity animation

All of this fires at `t=0`, before any API response arrives, before `data !== null`, during the highest-memory window (API connections in-flight, Hermes allocating JS promise chains).

**Goal**: Gate all animations behind `data !== null`. Show a minimal loading state (spinner, no Reanimated) while data is fetching. Once data arrives, render content and let `FadeInScreen` handle the screen entry — no additional `useStaggeredEntry` card stagger needed.

This reduces the mount-time animation burst from ~15 simultaneous animations to ~2 (FadeInScreen opacity + translateY) until data is ready.

---

## Exploration Findings

### Home Tab Loading Pattern (Stable Reference)

The home tab (`index.tsx`) shows individual skeletons per section with each section's hooks managing their own loading state. It uses `isLoading && !data` guards per section. The home tab is stable.

Key insight: the home tab has `PanelGradient` (1 BlurView + 1 spring) and `useStaggeredEntry` for 4 cards — similar animation count to AI tab. The home tab is FIRST (mounted at app launch), so its animation burst has no prior worklet state to collide with.

The AI tab is SECOND (mounted on tab navigation) — the worklet runtime is already warm from the home tab, and any new mount-time burst adds on top of existing state.

### Current Loading Strategy (Problem)

```typescript
// Current: animations start regardless of data
const showSkeleton = isLoading && !data;

// Content either shows skeleton OR real content — but useStaggeredEntry fires at mount
// regardless, pre-allocating 10 shared values on first render
```

### Proposed Loading Strategy

```typescript
// New: minimal loading screen until data != null
// No Reanimated involved while data === null

if (!data && isLoading) {
  return <LoadingScreen />;  // pure React Native, zero Reanimated
}

// After data arrives: FadeInScreen handles the entry animation
// No useStaggeredEntry — cards appear with the FadeInScreen fade
```

### FadeInScreen as the Entry Gate

`FadeInScreen` already provides:
- `opacity` 0→1 via `withTiming(1, timingSmooth)` (400ms ease-in-out)
- `translateY` 8→0 via `withSpring(0, springSnappy)` (fast settle)
- `useReducedMotion` support

This is sufficient for screen entry. The per-card stagger (`useStaggeredEntry`) was decorative — it added a 50ms cascade but each card's animation was independent. Removing it eliminates 10 springs worth of worklet objects on mount.

### Integration Points

- `ai.tsx` imports from spec 01 (rebuilt AIArcHero), spec 02 (fixed AIConeChart), spec 03 (no backfill call)
- `useAIData()` — data arrives ~5-15s on first load, instantly on subsequent visits (cache)
- `useWeeklyHistory()` — reads AsyncStorage asynchronously on mount (fast, ~50ms)
- `useFocusKey()` — returns stable key, no animation
- `computeAICone()` — pure function, no side effects

---

## Key Decisions

### Decision 1: Full Loading Screen vs. Skeleton-per-Section

**Options considered:**
1. **Full loading screen while `data === null`** — Single component, zero Reanimated during wait. Once data arrives, full content renders with FadeInScreen.
2. **Skeleton per section** — Keep current pattern but fix stagger timing. Each section shows a skeleton, skeletons have their own pulse animations.
3. **Progressive: show AIArcHero immediately (pct=0), rest deferred** — Partially gates animations.

**Chosen:** Option 1 — Full loading screen while `data === null`.

**Rationale:**
- Zero Reanimated worklet pressure while API fetches are in-flight
- Data arrives fast in practice: `useAIData` reads from `ai_cache` (AsyncStorage) instantly if cache is fresh, only re-fetches stale days. On revisit, cache exists → data !== null immediately → loading screen flashes for <100ms or skips entirely
- Full screen matches the "data-first, then animate" principle
- Simpler code: one loading branch, not per-section guards

### Decision 2: Remove `useStaggeredEntry`

**Options considered:**
1. **Remove `useStaggeredEntry` entirely** — Cards fade in together with FadeInScreen
2. **Keep `useStaggeredEntry` but gate it on data** — Only fire springs after `data !== null`
3. **Replace with a single opacity timing** — `useSharedValue(0)` → `withTiming(1)` for the content container

**Chosen:** Option 1 — Remove `useStaggeredEntry` from AI tab. FadeInScreen handles entry.

**Rationale:** `useStaggeredEntry` creates 10 shared values + 10 spring drivers even when called after data arrives. The fade-in via FadeInScreen is already animated. Per-card stagger is a cosmetic enhancement that was added before the crash issues; removing it reduces worklet object count at the most critical moment (data arrival triggers re-render which triggers all new Reanimated values).

If stagger is desired in the future, it can be added back as a separate non-spring approach (e.g., sequential `withDelay(withTiming(...))` on a single shared value).

### Decision 3: Loading Screen Design

**Options considered:**
1. **ActivityIndicator** — Native iOS/Android spinner, zero Reanimated
2. **SkeletonLoader** — Uses `withRepeat(withTiming(...))` pulse loop — still has Reanimated
3. **Static text** — "Loading..." text, truly zero animation

**Chosen:** Option 1 — `ActivityIndicator` from React Native core.

**Rationale:** Zero Reanimated. Native component, renders on the native thread. Brief display (< 1s in typical use since AI cache provides instant data on revisit). `ActivityIndicator` is the right UX signal for "fetching" vs "data exists but looks empty."

---

## Interface Contracts

### ai.tsx loading strategy

```typescript
// Loading gate (data-first):
const { data, isLoading, error, refetch, previousWeekPercent } = useAIData();

// Error handling first (unchanged):
if (error === 'auth') return <AuthErrorView />;
if (error === 'network') return <NetworkErrorView />;

// NEW: Loading gate — show spinner while waiting for first data
// isLoading=true, data=null means: no cache AND fetch in-flight
if (!data && isLoading) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.success} />
    </View>
  );
}

// Empty state (unchanged):
if (!data && !isLoading) return <EmptyStateView />;

// DATA IS AVAILABLE — render content
// FadeInScreen handles entry animation; no useStaggeredEntry
```

### Removed imports/hooks

```typescript
// REMOVE from ai.tsx:
import { useStaggeredEntry } from '@/src/hooks/useStaggeredEntry';
// Remove: const { getEntryStyle } = useStaggeredEntry({ count: 5 });
// Remove: all <Animated.View style={getEntryStyle(N)}> wrappers

// REMOVE (already done in previous spec):
// import { useHistoryBackfill } from '@/src/hooks/useHistoryBackfill';
```

### Content render (unchanged structure, new entry animation)

```typescript
// FadeInScreen wraps all content — provides opacity + translateY entry animation
return (
  <View style={{ flex: 1 }}>
    <AmbientBackground color={ambientColor} />
    <FadeInScreen>
      <ScrollView ...>
        {/* All cards render without Animated.View stagger wrappers */}
        <AIArcHero ... />
        <Card><AIConeChart ... /></Card>
        <Card><DailyAIRow list /></Card>
        {hasTrajectory && <Card><TrendSparkline ... /></Card>}
        <Card><LegendContent /></Card>
      </ScrollView>
    </FadeInScreen>
  </View>
);
```

### AIArcHero wiring (uses rebuilt component from spec 01)

```typescript
// aiPct: midpoint of aiPctLow/High
const aiPercent = (data.aiPctLow + data.aiPctHigh) / 2;
// ambientColor: always non-null for aiPct type
const ambientColor = getAmbientColor({ type: 'aiPct', pct: Math.round(aiPercent) }) as string;
// heroAIPct: scrub override or live value
const heroAIPct = scrubPoint !== null ? scrubPoint.pctY : aiPercent;
```

### Function Contracts

| Function | Signature | Responsibility | Change |
|----------|-----------|----------------|--------|
| `AIScreen` | `() => JSX.Element` | AI tab screen render | modify |
| `classifyAIPct` | `(avg: number) => AITier` | Tier label + color | unchanged |
| `trendDirection` | `(aiPct: number[]) => 'up'\|'down'\|'flat'` | Sparkline trend | unchanged |

---

## Test Plan

### AIScreen loading strategy

**Happy Path:**
- Shows `ActivityIndicator` when `data === null && isLoading === true`
- Renders full content when `data !== null`
- No `useStaggeredEntry` imports or usage in source
- No `Animated.View` wrappers around individual cards (content renders as plain `View` or direct children)

**Error States (unchanged):**
- `error === 'auth'` → auth error view with re-login button (testID="error-auth")
- `error === 'network'` → network error view with retry button (testID="error-network")
- `!data && !isLoading` → empty state (testID="empty-state")

**Loading State:**
- `ActivityIndicator` visible when `isLoading=true, data=null`
- `ActivityIndicator` uses `colors.success` tint color
- No skeletons rendered during initial load

**Data Display (structural):**
- AIArcHero renders with `aiPct` and `brainliftHours` from data
- `testID="daily-breakdown"` card renders when `data.dailyBreakdown.length > 0`
- 12-week trajectory card renders when `hasTrajectory === true` (nonZero past weeks ≥ 2)

**Source-Level Checks:**
- Source does NOT import `useStaggeredEntry`
- Source does NOT import `SkeletonLoader` (removed with skeleton approach)
- Source does NOT call `useHistoryBackfill`
- Source imports `ActivityIndicator` from `react-native`

**Mocks Needed:**
- `useAIData`: mock returning `{ data: null, isLoading: true, error: null, ... }` and `{ data: mockAIData, isLoading: false, ... }`
- `useConfig`: mock returning `{ config: { weeklyLimit: 40, ... } }`
- `useFocusKey`: mock returning `0`
- `useWeeklyHistory`: mock returning `{ snapshots: [], isLoading: false }`
- `AIConeChart`: passthrough mock
- `AIArcHero`: passthrough mock
- `TrendSparkline`: passthrough mock
- `computeAICone`: mock returning valid ConeData

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `hourglassws/app/(tabs)/ai.tsx` | modify | Data-gated loading; remove useStaggeredEntry; remove backfill call |
| `hourglassws/src/components/__tests__/AITabConeIntegration.test.tsx` | modify | Update for new loading strategy; remove skeleton/stagger tests |

---

## Edge Cases to Handle

1. **Cache hit on revisit** — `useAIData` returns cached data immediately (`data !== null` on first render). Loading screen never shown (renders for 0 frames). This is the common case after first visit.
2. **Refresh (pull-to-refresh)** — `isLoading=true` but `data !== null` (stale data visible). Loading screen does NOT show (condition is `!data && isLoading`). RefreshControl spinner in ScrollView shows instead.
3. **`data !== null` but all sections empty** — `dailyBreakdown=[]` and `snapshots=[]` → empty state is rendered from `!data && !isLoading` branch. If data exists but is all-zero, content renders (not loading screen). This is unchanged behavior.
4. **Error then data** — If `error='network'` is shown but user retries and succeeds, error view unmounts, loading view mounts briefly, then content view. FadeInScreen fires on each mount of the content view.
5. **`hasTrajectory` threshold** — `nonZeroCompleted.length >= 2` — sparkline only shows if at least 2 past weeks have non-zero AI%. This is unchanged from before.

---

## Open Questions

None remaining.
