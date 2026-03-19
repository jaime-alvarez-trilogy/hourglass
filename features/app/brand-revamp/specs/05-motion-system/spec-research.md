# Spec Research: 05-motion-system

**Feature:** brand-revamp
**Spec:** 05-motion-system
**Complexity:** M

---

## Problem Context

The current app has basic fade/spring animations on some components but lacks the choreographed, physics-based interaction system that makes a premium spatial UI feel "alive." Missing elements: staggered card entry animations on screen mount, PressIn tactile scale/shadow feedback on interactive cards, and cascading list item settle animations (AI daily rows, approval cards). The spec mandates digital elements behave with physical mass, momentum, and friction.

---

## Exploration Findings

### Existing animation primitives
- `timingChartFill`, `timingSmooth`, `springPremium`, `springBouncy` presets defined in `src/lib/animation.ts`
- MetricValue uses `timingChartFill` for hero number fade-in
- PanelGradient uses `springPremium` for status color transitions
- WeeklyBarChart uses `timingChartFill` for clip reveal
- No staggered entry system exists in the codebase

### Reanimated 4.2.1 patterns available
```typescript
// Spring animations on mount (entry):
withDelay(index * 150, withSpring(1, { mass: 1, stiffness: 100, damping: 15 }))

// PressIn scale:
withSpring(0.96, { stiffness: 300, damping: 20 })  // immediate, stiff

// List cascade (each item):
withDelay(index * 200, withSpring(1, { mass: 0.8, stiffness: 80, damping: 12 }))
```

### Screens requiring staggered card entry
1. **Home** (`index.tsx`): HeroPanel + WeeklyBarChart card + AI card + Earnings card = 4 cards
2. **Overview** (`overview.tsx`): OverviewHeroCard + 4 metric sparkline cards = 5 cards
3. **AI tab** (`ai.tsx`): AIArcHero card + AIConeChart card + Trajectory card = 3 cards

### Interactive elements requiring PressIn feedback
- Earnings card on home (navigates or expands)
- Approval cards (ApprovalCard swipe actions)
- The 4W/12W toggle in OverviewHeroCard (already has basic highlight)
- NativeTabs tabs (after spec 06 — platform handles this natively)

### List items requiring cascade animations
- Daily AI breakdown rows (`DailyAIRow` in `ai.tsx`) — typically 5–7 items
- Approval cards in `approvals.tsx` — typically 1–10 items

### Current `GlassCard` (spec 03) PressIn
Spec 03 adds `pressable` prop to `GlassCard` with basic scale animation. This spec extends that foundation by: (a) creating a reusable hook `useStaggeredEntry`, (b) applying it across all screens, (c) adding list cascade via a separate `useListCascade` hook.

---

## Key Decisions

1. **`useStaggeredEntry(count)` hook** — returns an array of `AnimatedStyle` objects, one per card. Each style animates `opacity`, `translateY`, and `scale` from 0/20px/0.95 to 1/0/1 on mount, with `index * 150ms` delay. Uses `useFocusEffect` (from expo-router) to re-trigger on tab navigation.

2. **`useListCascade(count)` hook** — similar to useStaggeredEntry but for list items. Delay `index * 100ms`, shorter duration. Re-triggers when `count` changes (new items loaded).

3. **PressIn feedback** — defined in `GlassCard` (spec 03), but this spec ensures it's applied to the right components: all top-level dashboard cards are wrapped with `pressable={true}` when they are navigable. Non-navigable cards (WeeklyBarChart card) get `pressable={false}`.

4. **`useFocusEffect` for re-entry** — when the user switches tabs, the animation replays (values reset to 0 before the screen focuses). This uses `useCallback` to avoid re-running on every render.

5. **No Moti dependency** — the spec mentions Moti but Reanimated 4.2.1 provides everything needed directly. Adding Moti would add a dependency for no measurable benefit.

---

## Interface Contracts

### `useStaggeredEntry(count, delayStep?)` hook

```typescript
// src/hooks/useStaggeredEntry.ts

function useStaggeredEntry(
  count: number,
  delayStep: number = 150    // ms between each card
): Animated.AnimatedStyleProp<ViewStyle>[]

// Returns: array of animated styles, one per card
// Each style: { opacity, transform: [{ translateY }, { scale }] }
// Animation: useFocusEffect triggers reset → spring entry on focus
// Card 0: delay=0, Card 1: delay=150ms, Card 2: delay=300ms, etc.

// Usage:
const cardStyles = useStaggeredEntry(4);
return (
  <>
    <Animated.View style={cardStyles[0]}><HeroPanel /></Animated.View>
    <Animated.View style={cardStyles[1]}><WeeklyBarChartCard /></Animated.View>
    <Animated.View style={cardStyles[2]}><AICard /></Animated.View>
    <Animated.View style={cardStyles[3]}><EarningsCard /></Animated.View>
  </>
);
```

### `useListCascade(count, delayStep?)` hook

```typescript
// src/hooks/useListCascade.ts

function useListCascade(
  count: number,
  delayStep: number = 100   // ms between each list item
): Animated.AnimatedStyleProp<ViewStyle>[]

// Similar to useStaggeredEntry but:
// - Lighter spring (stiffness=80, damping=12)
// - Re-triggers when count changes (data loading)
// - Faster per-item delay (100ms vs 150ms)

// Usage in DailyAIRow list:
const rowStyles = useListCascade(rows.length);
return rows.map((row, i) => (
  <Animated.View key={row.date} style={rowStyles[i]}>
    <DailyAIRow {...row} />
  </Animated.View>
));
```

### Spring configuration constants

```typescript
// src/lib/animation.ts — additions
export const springCardEntry = { mass: 1, stiffness: 100, damping: 15 };
export const springListItem = { mass: 0.8, stiffness: 80, damping: 12 };
export const springPressIn = { stiffness: 300, damping: 20 };  // already: springPremium

// Initial states for entry animations:
// opacity: 0 → 1
// translateY: 20 → 0  (cards float up into place)
// scale: 0.95 → 1     (slight zoom in)
```

---

## Test Plan

### `useStaggeredEntry`
**Signature:** `useStaggeredEntry(count: number, delayStep?: number)`

**Happy path:**
- [ ] Returns array of length `count`
- [ ] Each element is an animated style object
- [ ] On mount, each value starts at opacity=0, translateY=20, scale=0.95

**Animation timing:**
- [ ] Card at index 0 has no delay (delay=0)
- [ ] Card at index 1 has delay=150ms (default delayStep)
- [ ] Card at index 2 has delay=300ms
- [ ] Custom delayStep=100 → card 1 delay=100ms

**Focus re-trigger:**
- [ ] useFocusEffect is used to trigger animation reset on tab focus
- [ ] Values reset to initial state before re-animating (not starting from midpoint)

**Edge cases:**
- [ ] count=0 returns empty array
- [ ] count=1 returns single animated style

### `useListCascade`
- [ ] Returns array of length `count`
- [ ] Re-triggers animation when count increases (mock by calling hook with new count)
- [ ] Per-item delay is 100ms by default
- [ ] Uses lighter spring config (stiffness=80) vs card entry (stiffness=100)

### `motionSystemIntegration`
- [ ] Home screen `index.tsx` wraps 4 cards in useStaggeredEntry animated views
- [ ] Overview screen wraps 5 cards in useStaggeredEntry animated views
- [ ] AI tab wraps daily row list in useListCascade animated views
- [ ] Approval cards list in approvals.tsx wraps items in useListCascade

**Mocks needed:**
- `expo-router`: useFocusEffect (mock to call the callback immediately)
- `react-native-reanimated`: useSharedValue, withDelay, withSpring, useAnimatedStyle

---

## Files to Reference

- `hourglassws/src/lib/animation.ts` — existing spring/timing presets
- `hourglassws/app/(tabs)/index.tsx` — home screen to add staggered entry
- `hourglassws/app/(tabs)/overview.tsx` — overview screen to add staggered entry
- `hourglassws/app/(tabs)/ai.tsx` — AI tab to add list cascade
- `hourglassws/app/(tabs)/approvals.tsx` — approvals list to add cascade
- `hourglassws/src/components/GlassCard.tsx` — PressIn animation base (from spec 03)
