# Spec Research: 03-android-visual

## Problem Context

`src/widgets/android/HourglassWidget.tsx` renders the Android home screen widget using `react-native-android-widget`. Currently it uses basic brand colors but lacks the visual hierarchy, pace badge, trend deltas, and BrainLift progress bar that the revamped iOS widget will show.

Android widget constraints are tighter than iOS (no SwiftUI gradients), but we can still achieve significant brand alignment: correct color semantics, readable hierarchy, pace badge, progress bars via SVG, and trend text.

Blocked by `01-data-extensions` (needs `paceBadge`, `weekDeltaHours`, `weekDeltaEarnings`, `brainliftTarget`).

## Exploration Findings

### Android Widget Stack
| File | Role |
|------|------|
| `src/widgets/android/HourglassWidget.tsx` | React component rendered by `react-native-android-widget` |
| `src/widgets/android/widgetTaskHandler.ts` | Background task: reads AsyncStorage `'widget_data'`, triggers widget update |

### react-native-android-widget Available Primitives
- `FlexWidget` — layout container (flexbox)
- `TextWidget` — text with style props (color, fontSize, fontFamily, fontWeight)
- `ImageWidget` — asset images
- `SvgWidget` — inline SVG string (key for progress bars + gradient backgrounds)
- `RowWidget` / `ColumnWidget` — directional flex containers (sugar over FlexWidget)

**No BackdropFilter, no SwiftUI LinearGradient in layout, no animation.** Gradients achievable only via `SvgWidget` with SVG `<linearGradient>` or `<radialGradient>` fill.

### Current Android Widget Structure
The widget renders a `FlexWidget` root with:
- Background: `backgroundColor: '#0D0C14'`
- A hours hero `TextWidget` (urgency color, large font)
- Earnings `TextWidget` (gold)
- Stats row: today, remaining, AI%, BrainLift
- Manager action mode: approval item list

Typography uses `fontFamily: 'SpaceGrotesk-Bold'` for heroes, `Inter-Regular` for labels.

### Mesh Background (Android)
True mesh gradient not feasible with `FlexWidget`. Use `SvgWidget` as an absolute-positioned background layer with SVG radial gradients:
```xml
<svg width="360" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="va" cx="25%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#A78BFA" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#A78BFA" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cb" cx="75%" cy="60%" r="45%">
      <stop offset="0%" stop-color="#00C2FF" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#00C2FF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="sc" cx="50%" cy="80%" r="40%">
      <!-- Node C: dynamic color from urgency/paceBadge state -->
      <stop offset="0%" stop-color="{STATE_COLOR}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="{STATE_COLOR}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0D0C14"/>
  <ellipse cx="90" cy="60" rx="130" ry="100" fill="url(#va)"/>
  <ellipse cx="270" cy="120" rx="120" ry="90" fill="url(#cb)"/>
  <ellipse cx="180" cy="160" rx="110" ry="80" fill="url(#sc)"/>
</svg>
```
Generate SVG string dynamically from JS with urgency-driven `STATE_COLOR`.

### Glass Panel (Android)
Use `SvgWidget` or `FlexWidget` with:
- `backgroundColor: '#16151F'` (surface color)
- `borderRadius: 12`
- For the border effect: wrap in another `FlexWidget` with `backgroundColor: '#2F2E41'` (border color), `borderRadius: 13`, `padding: 1` (1pt border simulation)

### Layout Wireframes

#### Standard size (homescreen widget, approximate 4×2 cells)
```
┌──────────────────────────────────────┐
│ ░░ SVG mesh bg ░░░░░░░░░░░░░░░░░░░░ │
│ ┌──────────────┐  ┌────────────────┐ │
│ │ 32.5h        │  │ $1,300         │ │
│ │ this week    │  │ earned +$84 ↑  │ │
│ └──────────────┘  └────────────────┘ │
│ TODAY 8.5h  [ON TRACK]  +2.1h ↑     │
│ AI 71%–75%       REMAINING 7.5h left │
│ BL ██████░░░░░░░ 3.2h / 5h          │
└──────────────────────────────────────┘
```

#### Compact (2×2 cells)
```
┌──────────────┐
│ 32.5h        │
│ this week    │
│ $1,300       │
│ [ON TRACK]   │
└──────────────┘
```

### paceBadge Badge (Android)
`FlexWidget` with `backgroundColor` set to badge color, `borderRadius: 10`, containing `TextWidget` with badge label. Matches iOS capsule treatment.

### BrainLift Progress Bar (Android)
`SvgWidget` with inline SVG:
```xml
<svg width="200" height="6">
  <rect width="200" height="6" rx="3" fill="#2F2E41"/>
  <rect width="{FILL_PX}" height="6" rx="3" fill="#A78BFA"/>
</svg>
```
`FILL_PX = Math.min(value / 5, 1.0) * 200`

## Key Decisions

### Decision 1: SVG mesh as background layer
Use `SvgWidget` with `position: 'absolute'`, `top: 0, left: 0, right: 0, bottom: 0` — renders behind all other content. State color injected via string interpolation when generating the SVG at render time.

### Decision 2: Glass panel border via nested FlexWidget padding trick
Outer: `{ backgroundColor: '#2F2E41', borderRadius: 13, padding: 1 }`
Inner: `{ backgroundColor: '#16151F', borderRadius: 12, padding: 12 }`
No SVG needed; readable and performant.

### Decision 3: Trend delta text
Same as iOS — Unicode `↑` `↓` arrows, colored by positive/negative. Green for positive, critical/warning for negative.

### Decision 4: Manager urgency mode
When `isManager && urgency >= 'high' && pendingCount > 0`: swap hero to show countdown (large text, urgency color) + approval list. Hours/earnings move to secondary row. SVG mesh state color intensified to urgency color.

## Interface Contracts

### Props consumed from WidgetData (new fields — from 01-data-extensions)
```typescript
props.paceBadge: 'crushed_it' | 'on_track' | 'behind' | 'critical' | 'none'
props.weekDeltaHours: string
props.weekDeltaEarnings: string
props.brainliftTarget: string  // "5h"
```

### Helper functions in HourglassWidget.tsx
```typescript
function buildMeshSvg(urgency: WidgetUrgency, paceBadge: string): string
// Returns SVG string with state-color-driven Node C

function badgeColor(paceBadge: string): string
// Returns hex color for badge background

function badgeLabel(paceBadge: string): string
// Returns display label: "CRUSHED IT" | "ON TRACK" | "BEHIND PACE" | "CRITICAL"

function deltaColor(delta: string): string
// "+..." → success green; "-..." → warning/critical amber; "" → transparent

function blProgressBar(value: number, targetHours: number, fillColor: string, width: number): string
// Returns inline SVG string for BrainLift progress bar
```

### HourglassWidget component structure
```typescript
function HourglassWidget({ data }: { data: WidgetData }): JSX.Element {
  const meshSvg = buildMeshSvg(data.urgency, data.paceBadge);
  // ZStack approach: absolute SVG bg + FlexWidget content
  return (
    <FlexWidget style={{ position: 'relative', ...rootStyle }}>
      <SvgWidget svg={meshSvg} style={{ position: 'absolute', inset: 0 }} />
      {/* Content */}
      {renderHoursMode(data)}  {/* or renderActionMode(data) */}
    </FlexWidget>
  );
}
```

## Test Plan

### Unit tests (HourglassWidget rendering)
- [ ] renders without crash with full WidgetData
- [ ] renders without crash with minimal WidgetData (missing new fields default gracefully)
- [ ] paceBadge `'on_track'` → renders badge with correct label and color
- [ ] paceBadge `'none'` → no badge rendered
- [ ] weekDeltaHours `"+2.1h"` → renders delta text with `↑` and success color
- [ ] weekDeltaHours `""` → no delta text rendered
- [ ] weekDeltaEarnings `"-$84"` → renders with `↓` and warning color
- [ ] BrainLift progress bar fill correctly bounded at 100% when brainlift > target
- [ ] manager urgency mode: `isManager=true, urgency='critical', pendingCount=3` → countdown hero, not hours hero
- [ ] contributor mode: `isManager=false` → no approval items rendered

### Brand compliance
- [ ] earnings color is `#E8C97A` gold
- [ ] AI% color is `#00C2FF` cyan
- [ ] BrainLift bar fill is `#A78BFA` violet
- [ ] hours color follows urgency color map
- [ ] no pure `#FFFFFF` in any TextWidget

### widgetTaskHandler
- [ ] reads from AsyncStorage `'widget_data'`
- [ ] passes data to HourglassWidget including new fields
- [ ] handles missing new fields gracefully (old cached data without paceBadge etc.)

## Files to Modify

| File | Change |
|------|--------|
| `src/widgets/android/HourglassWidget.tsx` | Full visual redesign: mesh SVG bg, glass panels, pace badge, trend deltas, BrainLift bar |
| `src/widgets/android/widgetTaskHandler.ts` | Verify new WidgetData fields are passed through (likely no change needed) |

## Files to Reference

- `hourglassws/BRAND_GUIDELINES.md` — color tokens, typography
- `src/lib/colors.ts` — color constants
- `src/widgets/types.ts` — `WidgetData` interface (post-01-data-extensions)
- `src/widgets/android/HourglassWidget.tsx` — existing component structure
- `src/widgets/android/widgetTaskHandler.ts` — how data is passed to widget
- `features/app/widget-brand-revamp/FEATURE.md` — Android rendering constraints section
