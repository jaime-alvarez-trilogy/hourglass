# 03-base-components

**Status:** Draft
**Created:** 2026-03-14
**Last Updated:** 2026-03-14
**Owner:** @trilogy

---

## Overview

### What is Being Built

A base component library of five design-system primitives for the Hourglass Expo app. All five components must use only NativeWind v4 `className` props for styling (no `StyleSheet.create`, no hardcoded hex values) and Reanimated v4 presets for animations (no core Animated API).

The five components:

1. **Card** (`src/components/Card.tsx`) — Standard surface container. Wraps children in a `rounded-2xl border border-border p-5` box. Accepts an `elevated` boolean to switch from `bg-surface` to `bg-surfaceElevated`, and an optional `className` prop for additions.

2. **MetricValue** (`src/components/MetricValue.tsx`) — Hero number display with a count-up animation from 0 on mount. Uses `useAnimatedProps` on a `TextInput` (editable=false) driven by `useSharedValue` + `withTiming(timingChartFill)`. Accepts `value`, `unit`, `precision`, `colorClass`, and `sizeClass` props.

3. **SectionLabel** (`src/components/SectionLabel.tsx`) — Uppercase section header with `text-textSecondary font-sans-semibold text-xs uppercase tracking-widest`. Accepts string children and optional `className` extension.

4. **PanelGradient** (`src/components/PanelGradient.tsx`) — 5-state hero panel background. Uses `expo-linear-gradient` for the gradient fill (top-to-bottom, status color at 35% opacity → transparent) and a Reanimated `springPremium` entrance animation. Exports a `PANEL_GRADIENTS` lookup table keyed by `PanelState`. The `idle` state renders flat `bg-surface` (no gradient).

5. **SkeletonLoader** (`src/components/SkeletonLoader.tsx`) — Pulsing shimmer placeholder. Uses `useSharedValue` + `withTiming(timingSmooth)` in a looping repeat animation cycling opacity 0.5 → 1.0. Base style: `bg-border rounded-lg`. Accepts `width`, `height`, `rounded`, and `className` props.

### How It Fits

These primitives are the foundation that blocks specs 05 (hours-dashboard), 06 (ai-tab), 07 (approvals-tab), and 08 (auth-screens). All four screen-rebuild specs will compose from these components. The `PanelGradient` component specifically depends on the `PanelState` type and `computePanelState` utility completed in spec 02.

---

## Out of Scope

1. **Chart components (WeeklyBarChart, TrendSparkline, AIRingChart, ProgressBar)** — **Deferred to 04-skia-charts.** Chart primitives require React Native Skia and are a separate complexity tier. Base components intentionally do not depend on Skia.

2. **Updating existing screens to use the new components** — **Deferred to 05-hours-dashboard, 06-ai-tab, 07-approvals-tab, 08-auth-screens.** Screen rebuilds are their own specs. This spec only creates the primitives.

3. **Replacing StatCard.tsx and AIProgressBar.tsx files** — **Deferred to 05-hours-dashboard and 06-ai-tab respectively.** The old files remain in `src/components/` until the screen specs that depend on them are rebuilt. Removal is handled in the screen spec.

4. **ApprovalCard.tsx and UrgencyBanner.tsx updates** — **Deferred to 07-approvals-tab.** These are screen-specific components that will be updated in context.

5. **Dark mode / light mode toggling** — **Descoped.** Hourglass is dark-only. All tokens are calibrated for the dark canvas. A light mode is not planned.

6. **Accessibility (a11y) props (accessibilityLabel, accessibilityRole)** — **Descoped.** Accessibility labelling is the responsibility of the screen specs that compose these primitives in context. Base primitives pass through children as-is.

7. **Reduced-motion fallback (useReducedMotion)** — **Descoped from this spec.** The BRAND_GUIDELINES.md calls for a reduced-motion fallback on all animations, but wiring up `useReducedMotion` across all components is addressed in a future hardening pass. Components will document this as a known gap.

8. **PanelGradient press/tap interaction** — **Descoped.** The panel is a display primitive; interactive affordances (expand/collapse) are added by the screen specs.

9. **MetricValue negative number display** — **Descoped.** All current metric values (hours, AI%, earnings) are non-negative. Negative formatting is not required by any current screen spec.

---

## Functional Requirements

### FR1: Card — NativeWind Surface Container

**Description:** A reusable surface container component that wraps content with design system tokens.

**Implementation:**
- Render a `View` with NativeWind classes: `bg-surface rounded-2xl border border-border p-5`
- When `elevated={true}`: replace `bg-surface` with `bg-surfaceElevated`
- When `className` prop provided: append to base classes (NativeWind's `className` merging handles conflicts)
- Render `children` inside the View

**Interface:**
```typescript
interface CardProps {
  elevated?: boolean;
  className?: string;
  children: React.ReactNode;
}
export default function Card({ elevated, className, children }: CardProps): JSX.Element
```

**Success Criteria:**
- SC1.1: Renders children without crash
- SC1.2: Default render: source includes `bg-surface`, `rounded-2xl`, `border-border` class strings
- SC1.3: `elevated={true}`: source includes `bg-surfaceElevated` (not `bg-surface` as default)
- SC1.4: `className="p-8"` prop: the additional class string is present in source
- SC1.5: No `StyleSheet.create` usage in the file
- SC1.6: No hardcoded hex color values in the file

---

### FR2: MetricValue — Count-Up Hero Number

**Description:** A hero number display that animates from 0 to the target value on mount using Reanimated v4 programmatic API.

**Implementation:**
- Use `useSharedValue(0)` and `withTiming(value, timingChartFill)` in `useEffect` on mount
- Use `useAnimatedProps` to drive a `TextInput`'s `value` prop (as a formatted string)
- Wrap in `Animated.View` with CSS animation for entrance fade: `style={{ animation: 'fadeIn 300ms ease-out' }}`
- Format: `value.toFixed(precision)` + `unit` (e.g. `"42.5h"`)
- TextInput is `editable={false}`, `caretHidden={true}`, `selectTextOnFocus={false}`
- Apply `font-display` (Space Grotesk), default `text-textPrimary`, default `text-4xl`

**Interface:**
```typescript
interface MetricValueProps {
  value: number;
  unit?: string;
  precision?: number;    // default: 1
  colorClass?: string;   // default: "text-textPrimary"
  sizeClass?: string;    // default: "text-4xl"
}
export default function MetricValue(props: MetricValueProps): JSX.Element
```

**Success Criteria:**
- SC2.1: Renders with `value=0` without crash; formatted output is `"0.0"` (precision 1)
- SC2.2: Renders with `value=42.5`: `useSharedValue` initialized to 0; `withTiming` called with 42.5
- SC2.3: `unit="h"`: formatted string appends `"h"` → `"42.5h"`
- SC2.4: `precision=0`: formatted string is `"43"` (no decimal)
- SC2.5: Source includes `font-display` class string
- SC2.6: `timingChartFill` imported and used as timing config
- SC2.7: No `StyleSheet.create` usage in the file
- SC2.8: Count-up animation starts from 0 (initial shared value is 0)

---

### FR3: SectionLabel — Uppercase Section Header

**Description:** A simple text component for section headings using the design system typography for metadata labels.

**Implementation:**
- Render a `Text` component
- Apply NativeWind classes: `text-textSecondary font-sans-semibold text-xs uppercase tracking-widest`
- Merge optional `className` prop
- Render `children` (string) as text

**Interface:**
```typescript
interface SectionLabelProps {
  children: string;
  className?: string;
}
export default function SectionLabel({ children, className }: SectionLabelProps): JSX.Element
```

**Success Criteria:**
- SC3.1: Renders string children without crash
- SC3.2: Source includes `text-textSecondary` class string
- SC3.3: Source includes `uppercase` and `tracking-widest` class strings
- SC3.4: Source includes `font-sans-semibold` class string
- SC3.5: `className="mb-2"` prop: the additional class string is present in source
- SC3.6: No `StyleSheet.create` usage in the file

---

### FR4: PanelGradient — 5-State Gradient Hero Panel

**Description:** A gradient hero panel background component that maps a `PanelState` to a gradient and animates on state changes.

**Implementation:**
- Import `PanelState` from `@/src/lib/panelState`
- Define and export `PANEL_GRADIENTS` lookup table with color arrays and start/end vectors:
  - `onTrack`: success green (`#10B981`) at 35% opacity → transparent
  - `behind`: warning amber (`#F59E0B`) at 35% opacity → transparent
  - `critical`: critical rose (`#F43F5E`) at 35% opacity → transparent
  - `crushedIt`: gold (`#E8C97A`) at 35% opacity → transparent
  - `idle`: flat surface (`#13131A` → `#13131A`), no gradient effect
- Use `expo-linear-gradient`'s `LinearGradient` for rendering
- Wrap `LinearGradient` in `Animated.View` for `springPremium` entrance animation
- When `state` prop changes, animate opacity/scale using `withSpring(..., springPremium)`
- Apply `flex-1` and any `className` prop to outer container

**Interface:**
```typescript
interface PanelGradientProps {
  state: PanelState;
  children: React.ReactNode;
  className?: string;
}
export default function PanelGradient({ state, children, className }: PanelGradientProps): JSX.Element
export const PANEL_GRADIENTS: Record<PanelState, { colors: string[]; start: object; end: object }>
```

**Success Criteria:**
- SC4.1: Renders without crash for all 5 states: `onTrack`, `behind`, `critical`, `crushedIt`, `idle`
- SC4.2: `PANEL_GRADIENTS` exported with all 5 state keys
- SC4.3: `state="idle"` render: `PANEL_GRADIENTS.idle.colors` used (flat surface)
- SC4.4: `state="crushedIt"`: `PANEL_GRADIENTS.crushedIt.colors` contains gold-toned values
- SC4.5: `state="critical"`: `PANEL_GRADIENTS.critical.colors` contains rose-toned values
- SC4.6: `springPremium` imported and used for animation config
- SC4.7: `expo-linear-gradient` imported (mocked in tests)
- SC4.8: No `StyleSheet.create` usage in the file
- SC4.9: No hardcoded hex values outside the `PANEL_GRADIENTS` constant definition

---

### FR5: SkeletonLoader — Pulsing Shimmer Placeholder

**Description:** A loading placeholder that pulses between 50% and 100% opacity in a looping animation using the `timingSmooth` preset.

**Implementation:**
- Use `useSharedValue(0.5)` for opacity
- In `useEffect` on mount, start a `withRepeat(withTiming(1, timingSmooth), -1, true)` loop (reverse=true for ping-pong)
- `useAnimatedStyle` returns `{ opacity }` driving an `Animated.View`
- Base NativeWind classes: `bg-border rounded-lg`
- When `rounded={true}`: use `rounded-full` instead of `rounded-lg`
- Apply `width` and `height` via inline `style` (numeric or string values)
- Default: `width='100%'`, `height=20`

**Interface:**
```typescript
interface SkeletonLoaderProps {
  width?: number | string;   // default: '100%'
  height?: number;           // default: 20
  rounded?: boolean;         // default: false
  className?: string;
}
export default function SkeletonLoader(props: SkeletonLoaderProps): JSX.Element
```

**Success Criteria:**
- SC5.1: Renders with default dimensions (`width='100%'`, `height=20`) without crash
- SC5.2: `timingSmooth` imported and used in the repeat animation
- SC5.3: `withRepeat` called with reverse=true (ping-pong effect)
- SC5.4: `rounded={true}`: source includes `rounded-full` class string
- SC5.5: `rounded={false}` (default): source includes `rounded-lg` class string (not `rounded-full`)
- SC5.6: Custom `width={120}` and `height={40}` applied via style prop
- SC5.7: Initial opacity shared value is 0.5
- SC5.8: No `StyleSheet.create` usage in the file

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/lib/reanimated-presets.ts` | `timingChartFill`, `timingSmooth`, `springPremium` presets |
| `hourglassws/src/lib/panelState.ts` | `PanelState` type export |
| `hourglassws/tailwind.config.js` | Token names: `bg-surface`, `bg-surfaceElevated`, `border-border`, `text-textSecondary`, `text-textPrimary`, `bg-border`, font classes |
| `hourglassws/BRAND_GUIDELINES.md` | Panel gradient colors and opacities; animation rules |
| `hourglassws/src/components/StatCard.tsx` | Existing pattern to understand before replacing |
| `hourglassws/__mocks__/` | Existing Reanimated mock location |
| `hourglassws/src/components/__tests__/NativeWindSmoke.test.tsx` | Pattern for testing NativeWind via source analysis (NOT rendered prop assertions) |

### Files to Create

| File | Description |
|------|-------------|
| `hourglassws/src/components/Card.tsx` | FR1 — Surface container |
| `hourglassws/src/components/MetricValue.tsx` | FR2 — Count-up hero number |
| `hourglassws/src/components/SectionLabel.tsx` | FR3 — Section header |
| `hourglassws/src/components/PanelGradient.tsx` | FR4 — 5-state gradient panel |
| `hourglassws/src/components/SkeletonLoader.tsx` | FR5 — Shimmer placeholder |
| `hourglassws/src/components/__tests__/Card.test.tsx` | Tests for FR1 |
| `hourglassws/src/components/__tests__/MetricValue.test.tsx` | Tests for FR2 |
| `hourglassws/src/components/__tests__/SectionLabel.test.tsx` | Tests for FR3 |
| `hourglassws/src/components/__tests__/PanelGradient.test.tsx` | Tests for FR4 |
| `hourglassws/src/components/__tests__/SkeletonLoader.test.tsx` | Tests for FR5 |

### Testing Pattern (Critical — From Dependency 01)

NativeWind v4 transforms `className` to hashed IDs in Jest/Node. Do NOT assert on rendered `className` or `style` props. Instead, assert on the **source file content** using `fs.readFileSync`.

**Pattern (from NativeWindSmoke.test.tsx):**
```typescript
import fs from 'fs';
import path from 'path';

const src = fs.readFileSync(
  path.resolve(__dirname, '../Card.tsx'),
  'utf-8'
);

it('uses bg-surface class', () => {
  expect(src).toContain('bg-surface');
});
```

All class-name-related tests MUST use this static analysis pattern.

### Mocks Required

**expo-linear-gradient** — Not yet in `__mocks__/`. Must be added as an inline mock in PanelGradient tests:

```typescript
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));
```

**react-native-reanimated** — Already mocked. The mock provides stub implementations of `useSharedValue`, `useAnimatedProps`, `useAnimatedStyle`, `withTiming`, `withRepeat`, `withSpring`. Verify `withRepeat` is included in the existing mock before writing FR5 tests.

### Data Flow

```
Parent screen
    │
    ├── computePanelState(hoursWorked, weeklyLimit, daysElapsed)
    │       └── returns PanelState ("onTrack" | "behind" | etc.)
    │
    ├── <PanelGradient state={panelState}>
    │       └── PANEL_GRADIENTS[state].colors → LinearGradient
    │
    ├── <Card elevated={false}>
    │       └── bg-surface + NativeWind classes
    │
    ├── <MetricValue value={hoursWorked} unit="h" />
    │       └── useSharedValue(0) → withTiming(hoursWorked, timingChartFill) → TextInput value
    │
    ├── <SectionLabel>WEEKLY HOURS</SectionLabel>
    │       └── Text with uppercase tracking NativeWind classes
    │
    └── <SkeletonLoader width="100%" height={20} />
            └── useSharedValue(0.5) → withRepeat(withTiming(1, timingSmooth), -1, true)
```

### PANEL_GRADIENTS Color Values

Based on BRAND_GUIDELINES.md (status color at 35% opacity = hex `59` alpha suffix):

```typescript
export const PANEL_GRADIENTS: Record<PanelState, { colors: string[]; start: object; end: object }> = {
  onTrack:   { colors: ['#10B98159', 'transparent'], start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  behind:    { colors: ['#F59E0B59', 'transparent'], start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  critical:  { colors: ['#F43F5E59', 'transparent'], start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  crushedIt: { colors: ['#E8C97A59', 'transparent'], start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  idle:      { colors: ['#13131A',   '#13131A'],     start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
};
```

35% opacity in hex ≈ `0x59` = 89/255 ≈ 35%. The `transparent` stop produces the fade-to-clear effect described in BRAND_GUIDELINES.md.

### Edge Cases

| Component | Edge Case | Handling |
|-----------|-----------|---------|
| MetricValue | `value` prop changes after mount | `useEffect` dependency includes `value`; re-triggers `withTiming` to new target |
| MetricValue | `precision=0` with `value=42.5` | `(42.5).toFixed(0)` = `"43"` — JavaScript standard rounding |
| MetricValue | `value=0` with `unit="h"` | Displays `"0.0h"` — no special zero handling needed |
| PanelGradient | `state` prop changes | `useEffect` with `state` dependency re-triggers animation |
| SkeletonLoader | `width` as string `'100%'` | Pass as `style={{ width: '100%', height }}` — React Native supports string percentage widths |
| SkeletonLoader | `width` as number | Pass as `style={{ width: 120, height }}` |
| Card | `className` conflicts with base classes | NativeWind last-write wins — document that `className` can override base tokens |

### Animation Implementation Notes

**MetricValue count-up:**
The `Animated.createAnimatedComponent(TextInput)` approach is the standard Reanimated v4 pattern for animating text. The `useAnimatedProps` hook sets the `value` prop formatted as a string.

Recommended pattern:
```typescript
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const animatedProps = useAnimatedProps(() => ({
  value: `${displayValue.value.toFixed(precision)}${unit ?? ''}`,
} as any));
```

**SkeletonLoader loop:**
`withRepeat(withTiming(1, timingSmooth), -1, true)` means: repeat infinitely (`-1`), reversing direction (`true`), creating a 0.5 → 1.0 → 0.5 ping-pong.

**PanelGradient entrance:**
Wrap the `LinearGradient` in an `Animated.View` with initial `opacity: 0`, then animate to `opacity: 1` using `withSpring(1, springPremium)` on mount via `useEffect`.
