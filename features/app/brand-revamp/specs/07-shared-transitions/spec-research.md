# Spec Research: 07-shared-transitions

**Feature:** brand-revamp
**Spec:** 07-shared-transitions
**Complexity:** M

---

## Problem Context

Navigation between screens currently uses standard Expo Router stack transitions (slide/fade). The brand guidelines v2.0 mandate Shared Element Transitions (SET) — where a specific UI element on the source screen appears to physically detach and morph into the corresponding element on the destination screen. This eliminates jarring screen cuts and creates the spatial, z-axis navigation feel of premium apps.

---

## Exploration Findings

### Reanimated 4.2.1 Shared Element Transitions API

```typescript
// Enable in package.json:
// "ENABLE_SHARED_ELEMENT_TRANSITIONS": true

// Source screen: tag the element
<Animated.View sharedTransitionTag="earnings-card">
  <EarningsCard />
</Animated.View>

// Destination screen: same tag
<Animated.View sharedTransitionTag="earnings-card">
  <EarningsHeader />
</Animated.View>

// The engine:
// 1. Detects matching tags during navigation stack change
// 2. Creates a temporary overlay view
// 3. Morphs geometry (position, size, borderRadius) from source to destination
// 4. Runs entirely on native C++ thread (JS thread mounts new screen concurrently)
```

### Current navigation structure

Looking at the app:
- **Home (`index.tsx`)** → The earnings TrendSparkline card is a good SET candidate. When a user taps it, it could expand to the Overview screen's earnings sparkline card.
- **Home hero panel** → No detail screen exists yet (deferred per scope decisions)
- **AI compact chart** → Could transition to AI tab's full AIConeChart card

### Viable SET candidates (scoped to existing screens)

1. **Earnings card on Home → Earnings section on Overview**
   - Source: `TrendSparkline` card on `index.tsx`
   - Destination: Earnings sparkline card on `overview.tsx`
   - Navigation: User tapping the earnings card navigates to Overview tab

2. **AI compact card on Home → AI tab AIConeChart**
   - Source: Compact AIConeChart card on `index.tsx`
   - Destination: Full AIConeChart card on `ai.tsx`
   - Navigation: User tapping AI card navigates to AI tab

### Limitations of SET with Tab navigation

SET works best with stack navigation (push/pop). With Expo Router tab navigation, tapping a tab doesn't push a new stack entry — it switches tabs. This means:

- SET between tabs (home → overview tab) works if we use `router.push('/(tabs)/overview')` instead of tab bar press, OR navigate via stack
- The most natural SET use case is a dedicated detail screen pushed onto the stack (e.g., `/(tabs)/earnings-detail` pushed from home)

Since no dedicated detail screens exist yet, the pragmatic approach is:
1. Add SET tags on the key cards for visual continuity
2. Navigation remains tab-based (Reanimated 4.2.1 supports cross-tab SET in some configurations)
3. If cross-tab SET proves unstable, SET applies to modal sheets (approvals rejection sheet → card)

### `package.json` feature flag

```json
// The flag goes in the app's package.json under "extra"
// (actually in app.json per spec 06, not package.json — clarified below)
```

Per spec cross-reference with 06-native-tabs: Both feature flags go in `app.json` under `expo.extra`. The spec PDF referenced `package.json` but the correct Expo approach is `app.json`.

### SET fallback behavior

When `ENABLE_SHARED_ELEMENT_TRANSITIONS` is false or the tag pair doesn't match (e.g., destination screen not yet rendered), Reanimated falls back to the standard navigation transition silently. No crash risk.

---

## Key Decisions

1. **SET on earnings card and AI card** — These are the highest-value transitions where the card visually expands into the destination screen context.

2. **Tab navigation + SET**: Use Reanimated 4.2.1's cross-tab SET support. If the transition conflicts with tab animation, a `sharedTransitionStyle` override can disable the default tab transition and let SET drive the visual exclusively.

3. **Feature flag in `app.json`** — `ENABLE_SHARED_ELEMENT_TRANSITIONS: true` under `expo.extra`. The tag assignment in components is always present; only the feature flag affects whether Reanimated processes them.

4. **`sharedTransitionTag` naming convention** — Tags use kebab-case with screen prefix: `home-earnings-card`, `overview-earnings-card`. Avoids accidental collisions between unrelated elements with similar roles.

5. **Animated.View wrapper** — Each tagged element is wrapped in its own `Animated.View`. This is additive to the GlassCard (from spec 03) — the `Animated.View` wraps the `GlassCard` externally, keeping glass surface code clean.

6. **ApprovalCard SET** — Approval cards expand to rejection sheet modal. `sharedTransitionTag` on the card + the modal content provides a physical "open" feel.

---

## Interface Contracts

### Feature flag in `app.json`
```json
{
  "expo": {
    "extra": {
      "ENABLE_NATIVE_TABS": true,
      "ENABLE_SHARED_ELEMENT_TRANSITIONS": true
    }
  }
}
```

### Tagged elements

```typescript
// app/(tabs)/index.tsx — Earnings TrendSparkline card:
<Animated.View sharedTransitionTag="home-earnings-card">
  <GlassCard pressable onPress={() => router.push('/(tabs)/overview')}>
    <TrendSparkline ... />
  </GlassCard>
</Animated.View>

// app/(tabs)/overview.tsx — Earnings section:
<Animated.View sharedTransitionTag="home-earnings-card">
  {/* earnings sparkline card */}
</Animated.View>

// app/(tabs)/index.tsx — AI compact card:
<Animated.View sharedTransitionTag="home-ai-card">
  <GlassCard pressable onPress={() => router.push('/(tabs)/ai')}>
    <AIConeChart variant="compact" />
  </GlassCard>
</Animated.View>

// app/(tabs)/ai.tsx — AI full card:
<Animated.View sharedTransitionTag="home-ai-card">
  <GlassCard>
    <AIConeChart variant="full" />
  </GlassCard>
</Animated.View>
```

### `useSharedElementTransitions` helper (optional utility)

```typescript
// src/lib/sharedTransitions.ts
import Constants from 'expo-constants';

// Returns the sharedTransitionTag prop if SET is enabled, otherwise empty object
export function setTag(tag: string): { sharedTransitionTag?: string } {
  const enabled = Constants.expoConfig?.extra?.ENABLE_SHARED_ELEMENT_TRANSITIONS ?? false;
  return enabled ? { sharedTransitionTag: tag } : {};
}

// Usage:
<Animated.View {...setTag('home-earnings-card')}>
```

---

## Test Plan

### `setTagUtility`
**Signature:** `setTag(tag: string): { sharedTransitionTag?: string }`

- [ ] When `ENABLE_SHARED_ELEMENT_TRANSITIONS=true`, returns `{ sharedTransitionTag: tag }`
- [ ] When `ENABLE_SHARED_ELEMENT_TRANSITIONS=false`, returns `{}`
- [ ] When flag is missing from Constants, returns `{}` (safe default)
- [ ] Tag string is passed through unchanged

### `sharedTransitionTagPlacement`
- [ ] Home screen `index.tsx`: earnings card has `sharedTransitionTag="home-earnings-card"` applied
- [ ] Home screen `index.tsx`: AI compact card has `sharedTransitionTag="home-ai-card"` applied
- [ ] Overview screen `overview.tsx`: earnings section has matching `sharedTransitionTag="home-earnings-card"`
- [ ] AI screen `ai.tsx`: main chart card has matching `sharedTransitionTag="home-ai-card"`
- [ ] Each tagged element is wrapped in `Animated.View` (not just a regular View)

### `appJsonFlags`
- [ ] `app.json` contains `expo.extra.ENABLE_SHARED_ELEMENT_TRANSITIONS: true`
- [ ] `app.json` contains `expo.extra.ENABLE_NATIVE_TABS: true` (from spec 06)

### `setFallback`
- [ ] With flag disabled, home screen renders earnings card without sharedTransitionTag
- [ ] Navigation to overview/AI screens works correctly without SET (no crash)

**Mocks needed:**
- `expo-constants`: Constants.expoConfig.extra (mock with flag true/false)
- `react-native-reanimated`: Animated.View with sharedTransitionTag prop support

---

## Files to Reference

- `hourglassws/app/(tabs)/index.tsx` — source of earnings and AI card tagging
- `hourglassws/app/(tabs)/overview.tsx` — destination for earnings card SET
- `hourglassws/app/(tabs)/ai.tsx` — destination for AI card SET
- `hourglassws/app.json` — to add feature flags
- `hourglassws/src/components/GlassCard.tsx` — wrapped by Animated.View for SET (from spec 03)
- Reanimated 4.2.1 docs: sharedTransitionTag, sharedTransitionStyle
