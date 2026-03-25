# 03-android-visual

**Status:** Draft
**Created:** 2026-03-24
**Last Updated:** 2026-03-24
**Owner:** @trilogy

---

## Overview

### What Is Being Built

`03-android-visual` is a full visual redesign of `src/widgets/android/HourglassWidget.tsx` to align the Android home screen widget with the Hourglass brand system v2.0.

The current widget renders a flat dark background with basic urgency color theming. This spec replaces it with:

1. **SVG mesh background** — Three radial gradient ellipses (violet Node A, cyan Node B, urgency-colored Node C) rendered via `SvgWidget`, approximating the app's animated orbital mesh at widget quality.
2. **Glass panel cards** — `FlexWidget` border simulation (outer border wrapper + inner surface fill) for the hours and earnings hero panels.
3. **Pace badge** — A capsule `FlexWidget` with semantic color fill and uppercase text label derived from `paceBadge` field.
4. **Trend delta text** — Week-over-week hour and earnings deltas rendered with Unicode arrows (↑/↓), colored by positive/negative direction.
5. **BrainLift progress bar** — Inline SVG progress bar via `SvgWidget` showing brainlift hours vs. 5h target with violet fill.
6. **Manager urgency mode** — When `isManager && urgency >= 'high' && pendingCount > 0`, the hero switches to countdown display and approval list; hours/earnings move to secondary row.

### How It Works

The `HourglassWidget` component is refactored to:

- Extract five pure helper functions: `buildMeshSvg`, `badgeColor`, `badgeLabel`, `deltaColor`, `blProgressBar`
- Use a ZStack-like pattern: `FlexWidget` root with `position: 'relative'`, `SvgWidget` at `position: 'absolute'` as background, then content on top
- Consume the four new `WidgetData` fields (`paceBadge`, `weekDeltaHours`, `weekDeltaEarnings`, `brainliftTarget`) from `01-data-extensions`
- Maintain backward compatibility — missing new fields default gracefully (no crash on old cached data)

The `widgetTaskHandler.ts` requires no functional changes — it already reads from `AsyncStorage 'widget_data'` via `readWidgetData()` and the widget renders from the same data key. The new fields flow through automatically.

---

## Out of Scope

1. **Interactive widget buttons (approve/reject from widget)** — Descoped: interactive actions from the Android home screen widget are a separate product decision requiring a distinct UX/API pattern. No spec owns this yet; deferred post-revamp.

2. **Animated mesh (live orbital animation)** — Descoped: `react-native-android-widget` renders a static snapshot; no Reanimated worklets run in the Android widget process. The SVG mesh background is a static approximation only. True orbital animation is only achievable in the app itself.

3. **BackdropFilter glass blur** — Descoped: `react-native-android-widget` does not support `BackdropFilter`. The glass panel is simulated via background color + border padding trick. True frosted glass blur is not achievable in Android widgets.

4. **Large widget size (>4×2 cells)** — Descoped: only `small` (2×2) and `medium` (4×2) sizes are currently registered in the Android widget manifest. Large size is deferred to a future widget-enhancements spec.

5. **accessoryRectangular/Circular/Inline widget sizes** — Descoped: these are iOS-only lock screen complications. Covered by `02-ios-visual`.

6. **BrainLift progress bar in small widget** — Descoped: the small widget (2×2) has insufficient space. The BrainLift bar appears in medium only.

7. **Noise texture overlay** — Descoped: `react-native-android-widget` has no support for `BlendMode: overlay` on widget layers. The 0.03 opacity white noise texture from the brand guidelines cannot be rendered in Android widgets.

8. **Scriptable `hourglass.js`** — Descoped: separate codebase, separate effort. Not part of this feature.

---

## Functional Requirements

### FR1: Helper Functions

**What:** Extract five pure helper functions in `HourglassWidget.tsx` that encapsulate brand logic for SVG generation, badge styling, delta coloring, and progress bar generation.

**Functions:**

```typescript
function buildMeshSvg(urgency: WidgetUrgency, paceBadge: string): string
// Returns SVG string (360×200) with:
// - rect fill '#0D0C14' background
// - Node A: violet '#A78BFA' radial ellipse at cx=25% cy=30%
// - Node B: cyan '#00C2FF' radial ellipse at cx=75% cy=60%
// - Node C: state color from urgency/paceBadge at cx=50% cy=80%
// Node C color: critical='#F43F5E', high='#F59E0B', on_track='#10B981',
//               crushed_it='#FFDF89', behind='#F59E0B', none='#A78BFA'

function badgeColor(paceBadge: string): string
// Returns badge background hex:
// 'crushed_it' → '#FFDF89' (gold peak), 'on_track' → '#10B981',
// 'behind' → '#F59E0B', 'critical' → '#F43F5E', 'none' → '' (no badge)

function badgeLabel(paceBadge: string): string
// Returns display label:
// 'crushed_it' → 'CRUSHED IT', 'on_track' → 'ON TRACK',
// 'behind' → 'BEHIND PACE', 'critical' → 'CRITICAL', 'none' → ''

function deltaColor(delta: string): string
// '+...' → '#10B981' success green
// '-...' → '#F59E0B' warning amber
// '' or missing → 'transparent'

function blProgressBar(brainliftHours: number, targetHours: number, width: number): string
// Returns inline SVG string for BrainLift bar:
// Track: rect fill '#2F2E41', fill width=width, height=6, rx=3
// Fill: rect fill '#A78BFA', fill width=Math.min(brainliftHours/targetHours,1)*width, height=6, rx=3
```

**Success Criteria:**
- Each function is exported and independently unit-testable
- `buildMeshSvg` returns a valid SVG string containing `<svg`, `<defs`, `<radialGradient`
- `badgeColor('none')` returns `''`
- `badgeLabel('crushed_it')` returns `'CRUSHED IT'`
- `deltaColor('+2.1h')` returns `'#10B981'`
- `deltaColor('-$84')` returns `'#F59E0B'`
- `deltaColor('')` returns `'transparent'`
- `blProgressBar(5, 5, 200)` returns SVG with fill width = 200 (100%)
- `blProgressBar(10, 5, 200)` returns SVG with fill width = 200 (capped at 100%)
- `blProgressBar(2.5, 5, 200)` returns SVG with fill width = 100 (50%)

---

### FR2: SVG Mesh Background Layer

**What:** Replace flat `backgroundColor` on root `FlexWidget` with a two-layer approach: dark base color + absolute-positioned `SvgWidget` containing the radial gradient mesh.

**Implementation:**
- Root `FlexWidget` keeps `backgroundColor: '#0D0C14'` as fallback
- `SvgWidget` renders the `buildMeshSvg()` result at `position: 'absolute'`, `top: 0, left: 0, right: 0, bottom: 0`
- `buildMeshSvg` is called with current `data.urgency` and `data.paceBadge ?? 'none'`
- Applies to both `SmallWidget` and `MediumWidget`

**Success Criteria:**
- Both widget sizes render `SvgWidget` as the first child of root `FlexWidget`
- `SvgWidget` uses the string returned by `buildMeshSvg(data.urgency, data.paceBadge ?? 'none')`
- Old flat `URGENCY_BG` color map is removed from `SmallWidget` and `MediumWidget` backgrounds
- `FallbackWidget` retains its simple `backgroundColor: '#0D0C14'` (no mesh — no data available)
- The root `FlexWidget` `position` is set to `'relative'` to enable absolute child positioning

---

### FR3: Glass Panel Cards

**What:** Wrap the hours hero and earnings hero in glass panel `FlexWidget` containers using the nested-border trick: outer border layer + inner surface layer.

**Border trick:**
```
Outer FlexWidget: { backgroundColor: '#2F2E41', borderRadius: 13, padding: 1 }
Inner FlexWidget: { backgroundColor: '#16151F', borderRadius: 12, padding: 12 }
```

**Applies to:**
- Hours panel (hoursDisplay + "this week" label) — medium widget only
- Earnings panel (earnings + "earned {delta}" row) — medium widget only
- Small widget: single glass panel wrapping the entire content

**Success Criteria:**
- Hours panel renders with outer border `backgroundColor: '#2F2E41'` and inner `backgroundColor: '#16151F'`
- Earnings panel uses same border trick
- `borderRadius` outer=13, inner=12 on all panels
- No `#FFFFFF` background color on any panel
- Panels appear in hours mode (non-action mode)

---

### FR4: Pace Badge

**What:** Render a capsule-style badge showing the pace state when `paceBadge !== 'none'`.

**Implementation (medium widget, hours mode):**
```tsx
{data.paceBadge && data.paceBadge !== 'none' && (
  <FlexWidget style={{
    backgroundColor: badgeColor(data.paceBadge),
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  }}>
    <TextWidget
      text={badgeLabel(data.paceBadge)}
      style={{ color: '#0D0C14', fontSize: 11, fontWeight: 'bold' }}
    />
  </FlexWidget>
)}
```

**For small widget:** Badge rendered below hours hero, above hoursRemaining.

**Success Criteria:**
- `paceBadge === 'on_track'` → badge with `backgroundColor: '#10B981'`, text `'ON TRACK'`
- `paceBadge === 'crushed_it'` → badge with `backgroundColor: '#FFDF89'`, text `'CRUSHED IT'`
- `paceBadge === 'behind'` → badge with `backgroundColor: '#F59E0B'`, text `'BEHIND PACE'`
- `paceBadge === 'critical'` → badge with `backgroundColor: '#F43F5E'`, text `'CRITICAL'`
- `paceBadge === 'none'` → no badge rendered
- `paceBadge` undefined/missing → no badge rendered (backward compat)
- Badge text color is `'#0D0C14'` (dark, not white) for contrast on bright backgrounds

---

### FR5: Trend Delta Text

**What:** Render week-over-week delta strings with direction arrow and semantic color.

**Placement:**
- `weekDeltaHours`: rendered next to the hours hero in medium widget ("this week" row becomes delta row)
- `weekDeltaEarnings`: rendered next to earnings hero with arrow prefix

**Arrow logic:**
- `'+...'` → prefix `↑`, color `deltaColor(...)` = `'#10B981'`
- `'-...'` → prefix `↓`, color `deltaColor(...)` = `'#F59E0B'`
- `''` → nothing rendered

**Success Criteria:**
- `weekDeltaHours = '+2.1h'` → renders `TextWidget` with text containing `↑` and `2.1h`, color `#10B981`
- `weekDeltaHours = '-3.4h'` → renders `TextWidget` with text containing `↓` and `3.4h`, color `#F59E0B`
- `weekDeltaHours = ''` → no delta TextWidget rendered for hours
- `weekDeltaEarnings = '+$84'` → renders with `↑` and color `#10B981`
- `weekDeltaEarnings = '-$136'` → renders with `↓` and color `#F59E0B`
- `weekDeltaEarnings = ''` → no delta TextWidget rendered for earnings
- Missing fields (undefined) → treated as `''` (no crash)

---

### FR6: BrainLift Progress Bar

**What:** Render a BrainLift progress bar in the medium widget (hours mode only) showing brainlift hours vs. the `brainliftTarget` field.

**Placement:** Below the stats row (today, remaining, AI%), above the stale indicator.

**Data extraction:**
- `brainliftHours`: parse numeric from `data.brainlift` (e.g. `'3.2h'` → `3.2`)
- `targetHours`: parse numeric from `data.brainliftTarget ?? '5h'` (e.g. `'5h'` → `5`)

**Rendering:**
```tsx
<FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
  <TextWidget text="BL" style={{ color: '#A78BFA', fontSize: 11 }} />
  <SvgWidget svg={blProgressBar(brainliftHours, targetHours, 120)} style={{ width: 120, height: 6 }} />
  <TextWidget text={` ${data.brainlift} / ${data.brainliftTarget ?? '5h'}`}
    style={{ color: '#A78BFA', fontSize: 11 }} />
</FlexWidget>
```

**Success Criteria:**
- `brainlift = '3.2h'`, `brainliftTarget = '5h'` → `SvgWidget` renders with fill width ≈ 76px (Math.floor(3.2/5 * 120))
- `brainlift = '6h'`, `brainliftTarget = '5h'` → fill width capped at 120px (100%)
- `brainliftTarget` missing → defaults to `'5h'`
- `brainlift = '0h'` → fill width = 0px (empty track)
- Progress bar only appears in medium widget hours mode
- Label text color is `#A78BFA` violet
- No crash if `brainlift` or `brainliftTarget` is missing/malformed

---

### FR7: Manager Urgency Mode

**What:** When `data.isManager && data.urgency` is `'high'` or `'critical'` and `data.pendingCount > 0`, show urgency mode: countdown as hero, hours/earnings as secondary.

**Urgency mode layout (medium widget):**
```
[SVG mesh — intensified state color]
[deadline countdown — large, urgency color]    [N pending]
[hoursDisplay · earnings — small secondary row]
[up to 2 approval items]
```

**Countdown display:** Derive from `data.deadline` and current time:
- Hours until deadline: `Math.max(0, Math.floor((data.deadline - Date.now()) / 3600000))`
- Display: `'{N}h left'` or `'Due now'` if <= 0

**Success Criteria:**
- `isManager=true, urgency='critical', pendingCount=3` → countdown is the hero element (large font, urgency color), approval items shown
- `isManager=true, urgency='high', pendingCount=1` → same urgency mode trigger
- `isManager=true, urgency='low', pendingCount=5` → hours mode (not urgency mode; low urgency does not trigger)
- `isManager=false` → no approval items, always hours mode regardless of urgency/pendingCount
- `isManager=true, urgency='critical', pendingCount=0` → hours mode (no pending approvals to act on)
- Urgency mode mesh SVG uses urgency color for Node C (handled by `buildMeshSvg` receiving `data.urgency`)

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/widgets/android/HourglassWidget.tsx` | File being modified — current structure |
| `hourglassws/src/widgets/android/widgetTaskHandler.ts` | No change needed — verify new fields flow through |
| `hourglassws/src/widgets/types.ts` | `WidgetData` interface — all fields including 01-data-extensions |
| `hourglassws/BRAND_GUIDELINES.md` | Color tokens, typography scale |
| `hourglassws/src/lib/colors.ts` | Color constants (reference for hex values) |

### Files to Modify

| File | Change |
|------|--------|
| `hourglassws/src/widgets/android/HourglassWidget.tsx` | Full visual redesign — FR1 through FR7 |

### Files to Create

None.

### Files to Verify (No Change Expected)

| File | Verification |
|------|-------------|
| `hourglassws/src/widgets/android/widgetTaskHandler.ts` | Confirm `readWidgetData()` returns full `WidgetData` including new fields |

### Data Flow

```
AsyncStorage 'widget_data'
  ↓ readWidgetData() in widgetTaskHandler.ts
  ↓ WidgetData (includes paceBadge, weekDeltaHours, weekDeltaEarnings, brainliftTarget)
  ↓ HourglassWidget({ data })
      ↓ buildMeshSvg(data.urgency, data.paceBadge ?? 'none')  → SvgWidget bg
      ↓ badgeColor/badgeLabel(data.paceBadge ?? 'none')       → pace badge FlexWidget
      ↓ deltaColor(data.weekDeltaHours ?? '')                 → hours delta TextWidget
      ↓ deltaColor(data.weekDeltaEarnings ?? '')              → earnings delta TextWidget
      ↓ blProgressBar(parseFloat(data.brainlift), ...)        → BrainLift SvgWidget
      ↓ urgency mode check (isManager + urgency + pendingCount)
```

### Component Architecture (post-refactor)

```typescript
// Pure helper functions (exported for testing)
export function buildMeshSvg(urgency: WidgetUrgency, paceBadge: string): string
export function badgeColor(paceBadge: string): string
export function badgeLabel(paceBadge: string): string
export function deltaColor(delta: string): string
export function blProgressBar(brainliftHours: number, targetHours: number, width: number): string

// Internal rendering components (not exported)
function SmallWidget({ data }: { data: WidgetData })
function MediumWidget({ data }: { data: WidgetData })

// Exported components (unchanged API)
export function FallbackWidget()
export function HourglassWidget({ data, widgetFamily }: HourglassWidgetProps)
```

### SVG Mesh Background Detail

The mesh SVG is a 360×200 string generated at render time with `data.urgency` and `data.paceBadge` as inputs:

```
Node A (violet #A78BFA): ellipse cx=90 cy=60 rx=130 ry=100, radialGradient at 25%/30%, opacity 0.12→0
Node B (cyan #00C2FF):   ellipse cx=270 cy=120 rx=120 ry=90, radialGradient at 75%/60%, opacity 0.10→0
Node C (state color):    ellipse cx=180 cy=160 rx=110 ry=80, radialGradient at 50%/80%, opacity 0.14→0
```

State color selection for Node C:
```typescript
// Inside buildMeshSvg:
if (urgency === 'critical' || paceBadge === 'critical') → '#F43F5E'
if (urgency === 'high'     || paceBadge === 'behind')   → '#F59E0B'
if (paceBadge === 'crushed_it')                         → '#FFDF89'
if (paceBadge === 'on_track')                           → '#10B981'
default                                                 → '#A78BFA'  // idle/none
```

### Glass Panel Border Trick

```tsx
// Outer: border color as background + 1pt padding
<FlexWidget style={{ backgroundColor: '#2F2E41', borderRadius: 13, padding: 1, flex: 1 }}>
  {/* Inner: surface color */}
  <FlexWidget style={{ backgroundColor: '#16151F', borderRadius: 12, padding: 12 }}>
    {/* Panel content */}
  </FlexWidget>
</FlexWidget>
```

### Urgency Mode Switch Logic

```typescript
const isUrgencyMode =
  data.isManager &&
  (data.urgency === 'high' || data.urgency === 'critical') &&
  data.pendingCount > 0;
```

### Backward Compatibility

All new `WidgetData` fields accessed with nullish fallbacks:

```typescript
data.paceBadge ?? 'none'
data.weekDeltaHours ?? ''
data.weekDeltaEarnings ?? ''
data.brainliftTarget ?? '5h'
```

### Edge Cases

| Case | Handling |
|------|---------|
| `data` is null | `FallbackWidget` renders (unchanged behavior) |
| `brainlift` malformed (e.g. `''`) | `parseFloat('')` returns `NaN` → treated as 0 in `blProgressBar` |
| `brainliftTarget` missing | Defaults to `'5h'` via `?? '5h'` |
| `paceBadge` undefined | Treated as `'none'` via `?? 'none'` |
| `deadline` in past | Countdown shows `'Due now'` |
| `urgency = 'expired'` | Treated same as `'none'` for Node C color (violet) |
| `weekDeltaHours` is `'+0h'` | Renders with `↑` arrow and success green (acceptable) |

### Test File Location

```
hourglassws/src/widgets/android/__tests__/HourglassWidget.test.tsx
```
