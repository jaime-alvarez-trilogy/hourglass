# 07-shared-transitions

**Status:** Draft
**Created:** 2026-03-19
**Last Updated:** 2026-03-19
**Owner:** @trilogy

---

## Overview

**Spec 07-shared-transitions** adds Shared Element Transitions (SET) to the Hourglass app, using Reanimated 4.2.1's native `sharedTransitionTag` API. Two key card-to-screen transitions are wired:

1. **Earnings card (Home → Overview):** The TrendSparkline card on the Home screen morphs into the matching earnings section on the Overview screen, giving the user a spatial sense that they have "zoomed in" on the metric.
2. **AI compact card (Home → AI tab):** The compact AI chart card on Home expands into the full AIConeChart card on the AI screen.

A thin utility module `src/lib/sharedTransitions.ts` exports a single `setTag(tag)` helper. It reads the `ENABLE_SHARED_ELEMENT_TRANSITIONS` feature flag from `Constants.expoConfig.extra` and returns either `{ sharedTransitionTag: tag }` (when enabled) or `{}` (when disabled or missing). Every tagged `Animated.View` spreads the result of `setTag(...)`, so the feature can be toggled in `app.json` without touching component code.

The `ENABLE_SHARED_ELEMENT_TRANSITIONS: true` flag is already present in `app.json` (added by spec 06-native-tabs). No new npm packages are needed — Reanimated 4.2.1 ships SET support out of the box.

The implementation is purely additive: `Animated.View` wrappers are added around existing card content. No existing component internals are modified.

---

## Out of Scope

1. **Stack-push navigation for SET** — SET theoretically works best with push/pop stack navigation. This spec uses tab navigation with `sharedTransitionTag` directly; dedicated detail screens (e.g., `/(tabs)/earnings-detail`) that would make SET more reliable are **Deferred to a future screen-detail spec** (no screen-detail spec exists in this feature; tabs-only navigation is the current architecture).

2. **ApprovalCard → rejection sheet SET** — The spec-research.md mentions approval cards expanding to a rejection modal. This is **Deferred to 05-motion-system** where modal micro-interactions are handled.

3. **`sharedTransitionStyle` override** — Custom animation curve overrides (e.g., spring easing, custom duration) on the SET are **Descoped:** the default Reanimated SET curve is acceptable for this spec; customisation can be added later if QA flags it.

4. **Hero panel SET** — The Home hero panel is a SET candidate noted in research but no matching detail screen exists. **Descoped:** no destination exists.

5. **Android-specific SET verification** — Reanimated 4.2.1 SET on Android is in beta. Runtime behaviour on Android is **Descoped** (iOS is the primary target; Android falls back to default tab transition silently).

6. **AIConeChart variant prop** — The research notes a `variant="compact"` / `variant="full"` distinction. The existing `AIConeChart` component may not yet have this prop (it belongs to spec 04-victory-charts). The SET wrappers will be added regardless; the inner content is whatever is currently rendered on each screen. **Deferred to 04-victory-charts** for the variant prop itself.

---

## Functional Requirements

### FR1 — `setTag` utility in `src/lib/sharedTransitions.ts`

Create a new module `hourglassws/src/lib/sharedTransitions.ts` that exports:

```typescript
export function setTag(tag: string): { sharedTransitionTag?: string }
```

**Behaviour:**
- Import `Constants` from `expo-constants`.
- Read `Constants.expoConfig?.extra?.ENABLE_SHARED_ELEMENT_TRANSITIONS`.
- If the value is truthy, return `{ sharedTransitionTag: tag }`.
- If the value is falsy or the key is absent, return `{}`.
- The `tag` string is passed through unchanged (no transformation).

**Success Criteria:**
- `setTag('home-earnings-card')` with flag `true` → `{ sharedTransitionTag: 'home-earnings-card' }`
- `setTag('home-earnings-card')` with flag `false` → `{}`
- `setTag('home-earnings-card')` with `Constants.expoConfig` undefined → `{}`
- `setTag('home-earnings-card')` with `extra` object missing the key → `{}`
- Tag string containing special characters or spaces is returned unchanged.

---

### FR2 — Home screen (`index.tsx`) SET wrappers

In `hourglassws/app/(tabs)/index.tsx`, wrap the earnings TrendSparkline card section and the AI compact card section each in an `Animated.View` with the result of `setTag(...)` spread onto it.

**Earnings card wrapper:**
```tsx
import Animated from 'react-native-reanimated';
import { setTag } from '../../src/lib/sharedTransitions';

<Animated.View {...setTag('home-earnings-card')}>
  {/* existing earnings / TrendSparkline card content */}
</Animated.View>
```

**AI compact card wrapper:**
```tsx
<Animated.View {...setTag('home-ai-card')}>
  {/* existing AI compact card content */}
</Animated.View>
```

**Success Criteria:**
- Earnings card `Animated.View` has `sharedTransitionTag="home-earnings-card"` when flag is enabled.
- AI card `Animated.View` has `sharedTransitionTag="home-ai-card"` when flag is enabled.
- When flag is disabled, both wrappers render with no `sharedTransitionTag` prop (no crash).
- Existing card layout and press behaviour is unchanged.

---

### FR3 — Overview screen (`overview.tsx`) SET wrapper

In `hourglassws/app/(tabs)/overview.tsx`, wrap the earnings section (the container that holds the earnings sparkline/trend data) in an `Animated.View`:

```tsx
<Animated.View {...setTag('home-earnings-card')}>
  {/* earnings sparkline section */}
</Animated.View>
```

The tag `"home-earnings-card"` matches the Home screen source tag — Reanimated pairs them by identical tag string.

**Success Criteria:**
- Overview earnings section `Animated.View` has `sharedTransitionTag="home-earnings-card"` when flag is enabled.
- When flag is disabled, wrapper renders with no `sharedTransitionTag` (no crash).
- Overview screen layout is visually unchanged.

---

### FR4 — AI screen (`ai.tsx`) SET wrapper

In `hourglassws/app/(tabs)/ai.tsx`, wrap the main AI chart card in an `Animated.View`:

```tsx
<Animated.View {...setTag('home-ai-card')}>
  {/* AIConeChart / main chart card */}
</Animated.View>
```

Tag `"home-ai-card"` matches the Home screen source tag.

**Success Criteria:**
- AI screen chart `Animated.View` has `sharedTransitionTag="home-ai-card"` when flag is enabled.
- When flag is disabled, wrapper renders with no `sharedTransitionTag` (no crash).
- AI screen layout is visually unchanged.

---

### FR5 — `app.json` feature flag present

The `app.json` file must contain `ENABLE_SHARED_ELEMENT_TRANSITIONS: true` under `expo.extra`. This was added by spec 06-native-tabs. This spec verifies it is present and does not remove it.

**Success Criteria:**
- `app.json` contains `expo.extra.ENABLE_SHARED_ELEMENT_TRANSITIONS === true`.
- `app.json` also retains `expo.extra.ENABLE_NATIVE_TABS === true` (not disturbed).

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/app/(tabs)/index.tsx` | Home screen — add SET wrappers around earnings + AI cards |
| `hourglassws/app/(tabs)/overview.tsx` | Overview screen — add SET wrapper around earnings section |
| `hourglassws/app/(tabs)/ai.tsx` | AI screen — add SET wrapper around main chart card |
| `hourglassws/app.json` | Verify `ENABLE_SHARED_ELEMENT_TRANSITIONS: true` present |
| `hourglassws/src/components/GlassCard.tsx` | Glass card surface (from spec 03) — wrapped externally by Animated.View |
| Reanimated 4.2.1 docs | `sharedTransitionTag`, `sharedTransitionStyle` prop API |

### Files to Create

| File | Purpose |
|------|---------|
| `hourglassws/src/lib/sharedTransitions.ts` | `setTag(tag)` helper — feature-flag-aware SET prop factory |
| `hourglassws/src/lib/__tests__/sharedTransitions.test.ts` | Unit tests for `setTag` |

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/app/(tabs)/index.tsx` | Add `Animated.View` wrappers with `{...setTag(...)}` spread |
| `hourglassws/app/(tabs)/overview.tsx` | Add `Animated.View` wrapper on earnings section |
| `hourglassws/app/(tabs)/ai.tsx` | Add `Animated.View` wrapper on main chart card |

### Data Flow

```
app.json
  └── expo.extra.ENABLE_SHARED_ELEMENT_TRANSITIONS: true
        │
        ▼
Constants.expoConfig.extra  (expo-constants, read at runtime)
        │
        ▼
setTag(tag: string)  (src/lib/sharedTransitions.ts)
  ├── enabled → { sharedTransitionTag: tag }
  └── disabled → {}
        │
        ▼
<Animated.View {...setTag('home-earnings-card')}>
  (spread: either sets the prop, or spreads empty object = no prop)
        │
        ▼
Reanimated 4.2.1 native thread
  ├── detects matching sharedTransitionTag on source + destination
  ├── creates temporary overlay
  └── morphs geometry (position, size, borderRadius) during navigation
```

### Mock Requirements for Tests

```typescript
// jest mock for expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        ENABLE_SHARED_ELEMENT_TRANSITIONS: true, // toggle per test
      },
    },
  },
}));

// jest mock for react-native-reanimated (already configured in jest setup)
// Animated.View accepts sharedTransitionTag as a valid prop
```

### Tag Naming Convention

Tags use the pattern `{source-screen}-{element-role}`:

| Tag | Source | Destination |
|-----|--------|-------------|
| `home-earnings-card` | `index.tsx` earnings TrendSparkline card | `overview.tsx` earnings section |
| `home-ai-card` | `index.tsx` AI compact card | `ai.tsx` main AIConeChart card |

This convention prevents accidental collisions: if `overview.tsx` has its own internal cards, they would use `overview-*` prefix.

### Edge Cases

1. **Flag missing from Constants** — `Constants.expoConfig` may be `null` in test environments or if `app.json` is not loaded. The `?.` optional chain and `?? false` default in `setTag` handle this safely.

2. **Destination screen not yet mounted** — If the user navigates away before the destination screen mounts, Reanimated silently falls back to the default tab transition. No crash, no visible error.

3. **Duplicate tags** — Two elements on the same screen must NOT share the same `sharedTransitionTag`. The naming convention (screen prefix) prevents this by design.

4. **Tab navigation vs stack navigation** — Reanimated 4.2.1 supports SET across tab switches. If a future version breaks this, the fallback is to convert the navigation to `router.push()` which uses the stack and has guaranteed SET support.

5. **`Animated.View` layout impact** — By default, `Animated.View` passes layout constraints through to its child. The wrapper should not specify explicit width/height; it should let the child size itself naturally to avoid layout shifts.

### Implementation Notes

- `setTag` must be a plain function, not a hook (no `use` prefix, no React rules), as it's called at JSX render time without side effects.
- `expo-constants` is already in the dependency tree (used by other parts of the app); no new package install needed.
- `react-native-reanimated` is already at 4.2.1; `sharedTransitionTag` is a first-class prop on `Animated.View` at this version.
- The wrappers are purely structural additions; they do not introduce new styles, colours, or layout constraints.
