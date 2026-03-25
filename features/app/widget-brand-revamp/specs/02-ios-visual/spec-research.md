# Spec Research: 02-ios-visual

## Problem Context

The iOS widget (`WIDGET_LAYOUT_JS` in `bridge.ts`) uses flat dark backgrounds (`#0D0C14`) and minimal layout hierarchy. The app has evolved orbital mesh gradients, glass card panels, pace state badges, manager urgency escalation, BrainLift progress bars, and week-over-week trend arrows — none of which are reflected in the widget.

This spec redesigns the full `WIDGET_LAYOUT_JS` string for all five display contexts:
- `systemSmall` (156×156pt)
- `systemMedium` (169×182pt)
- `systemLarge` (364×398pt)
- `accessoryRectangular` / `accessoryCircular` / `accessoryInline` (lock screen)

Blocked by `01-data-extensions` (needs `paceBadge`, `weekDeltaHours`, `weekDeltaEarnings`, `brainliftTarget`).

## Exploration Findings

### Rendering Environment
`WIDGET_LAYOUT_JS` is a JavaScript string evaluated inside the widget extension's JSContext provided by `expo-widgets`. Available SwiftUI-like JS globals:

**Layout containers:** `ZStack`, `VStack`, `HStack`, `Spacer`, `Group`
**Primitives:** `Text`, `Rectangle`, `Circle`, `Image`, `Capsule`, `RoundedRectangle`
**Styling:** `LinearGradient`, `RadialGradient`, `.foregroundColor()`, `.font()`, `.frame()`, `.padding()`, `.cornerRadius()`, `.opacity()`, `.blendMode()`
**WidgetKit:** `ContainerBackground` (iOS 17+), `widgetURL`, `Link`

**Not available:** Skia Canvas, BackdropFilter/blur, `@State` animations, Combine, UIKit

### Current Color Palette in WIDGET_LAYOUT_JS (to replace)
```javascript
var BG = '#0D0C14';
var GOLD = '#E8C97A';
var CYAN = '#00C2FF';
var VIOLET = '#A78BFA';
var WHITE = '#FFFFFF';
var LABEL = '#8B949E';
var MUTED = '#484F58';
var HOURS_COLOR = { none: '#10B981', low: '#10B981', high: '#F59E0B', critical: '#F43F5E', expired: '#484F58' };
var BADGE_COLORS = { MANUAL: '#00C2FF', OVERTIME: '#A78BFA', PENDING: '#F59E0B', APPROVED: '#10B981', REJECTED: '#F43F5E' };
```
Colors are correct; visual flatness comes from no depth treatment and minimal hierarchy.

### Brand Design System (from BRAND_GUIDELINES.md)
| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#0D0C14` | Widget base (deep eggplant) |
| `surface` | `#16151F` | Card panel fill |
| `border` | `#2F2E41` | Panel border (subtle) |
| `gold` | `#E8C97A` | Earnings hero, money values |
| `cyan` | `#00C2FF` | AI usage % only |
| `violet` | `#A78BFA` | BrainLift, deep-work |
| `success` | `#10B981` | On-track hours |
| `warning` | `#F59E0B` | Behind pace |
| `critical` | `#F43F5E` | Critical urgency, pulsing red in app |
| `textPrimary` | `#E0E0E0` | Hero numbers (NOT #FFFFFF) |
| `textSecondary` | `#A0A0A0` | Labels |
| `textMuted` | `#757575` | Timestamps, muted info |

### paceBadge display rules
| Badge | Color | Label |
|-------|-------|-------|
| `crushed_it` | `#FFDF89` (goldBright) | `CRUSHED IT` |
| `on_track` | `#10B981` (success) | `ON TRACK` |
| `behind` | `#F59E0B` (warning) | `BEHIND PACE` |
| `critical` | `#F43F5E` (critical) | `CRITICAL` |
| `none` | hidden | — |

### Mesh Background Simulation
No RadialGradient orbital animation in WidgetKit. Simulate with 3 overlapping `Circle()` shapes in a `ZStack`:
- Node A: `#A78BFA` violet, 120pt diameter, offset (-50, -40), opacity 0.12
- Node B: `#00C2FF` cyan, 100pt diameter, offset (+60, +30), opacity 0.10
- Node C: state color (urgency-driven), 90pt diameter, offset (0, +50), opacity 0.14
- Base: `Rectangle().fill(#0D0C14)` behind all nodes
- All nodes use `blendMode(.screen)` to prevent overly-bright intersection

When `urgency === 'critical'`: Node C color = `#F43F5E`, opacity 0.20 (intensified)
When `urgency === 'high'`: Node C color = `#F59E0B`, opacity 0.16
When `paceBadge === 'crushed_it'`: Node C color = `#FFDF89`, opacity 0.14

### Glass Panel Simulation
True backdrop blur not available. Simulate frosted glass with:
```javascript
// Panel: RoundedRectangle fill + gradient border overlay
ZStack {
  RoundedRectangle(cornerRadius: 12)
    .fill(LinearGradient(
      colors: ['#1A1928', '#131220'],  // surface with slight top highlight
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    ))
    .opacity(0.85)
  RoundedRectangle(cornerRadius: 12)
    .stroke(LinearGradient(
      colors: ['#3D3B54', '#1A1928'],  // border gradient
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    ), lineWidth: 1)
  // content
}
```

### Layout Wireframes

#### systemSmall (156×156pt)
```
┌─────────────────────┐
│ ░░ mesh bg ░░░░░░░  │
│                     │
│  32.5h              │
│  this week          │
│                     │
│  $1,300     [BADGE] │
│  earned             │
│  7.5h left          │
└─────────────────────┘
```
- hours: Space Grotesk 700 32pt, urgency color
- "this week": Inter 11pt textMuted
- earnings: Space Grotesk 700 20pt gold
- paceBadge: Capsule background + label 10pt, bottom-right
- hoursRemaining: Inter 12pt success/warning color

#### systemMedium (360×169pt)
```
┌─────────────────────────────────────────────┐
│ ░░ mesh bg ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ┌──────────────┐     ┌───────────────────┐  │
│ │ 32.5h        │     │ $1,300            │  │
│ │ this week    │     │ earned            │  │
│ └──────────────┘     └───────────────────┘  │
│ TODAY   8.5h  AI USAGE 71%–75%  [BADGE]     │
│ +2.1h vs last week   REMAINING  7.5h left   │
└─────────────────────────────────────────────┘
```
Hours mode. Action mode (items pending): mini hero + up to 2 item rows (same as current but with glass panel treatment and badge).

#### systemLarge (364×398pt)
```
┌─────────────────────────────────────────────┐
│ ░░ mesh bg ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ┌──────────────┐     ┌───────────────────┐  │
│ │ 32.5h        │     │ $1,300            │  │
│ │ this week    │     │ earned  +$84 ↑    │  │
│ └──────────────┘     └───────────────────┘  │
│                                             │
│ TODAY  8.5h    AI USAGE  71%–75%            │
│ +2.1h ↑        REMAINING  7.5h left         │
│                                             │
│ [BADGE: ON TRACK]                           │
│                                             │
│ Mon ██████████████████░░ 10.2h             │
│ Tue ████░░░░░░░░░░░░░░░░  2.7h             │
│                                             │
│ AI  ●━━━━━━━━━━━━━━━━━━━━ 71%–75%          │
│ BL  ━━━━━━━━━━━░░░░░░░░░░ 3.2h / 5h        │
└─────────────────────────────────────────────┘
```

#### Manager urgency mode (medium/large, urgency >= high)
- Mesh Node C shifts to amber/red (per urgency level)
- Hero element becomes countdown: "2 days 4h until deadline" in critical color, large
- Hours + earnings demoted to secondary row
- Approval items listed with glass panels
- Badge not shown (urgency banner replaces it)

### Action Mode (items pending)
Same as current but with glass panel treatment for each row.
- `approvalItems` (manager): name, hours, category badge, urgency tint background
- `myRequests` (contributor): date, hours, memo, status badge
- Background tint: `actionBg` from WidgetData (already computed in bridge)

### Accessory sizes (lock screen)
- `accessoryRectangular`: logo + hours + earnings in one line (keep compact, just update to brand colors: urgency color on hours, gold on earnings)
- `accessoryCircular`: hours in urgency color, small "h" suffix
- `accessoryInline`: "32.5h · $1,300 · AI 73%"

## Key Decisions

### Decision 1: WIDGET_LAYOUT_JS organization
Split into helper functions within the JS string: `buildMeshBg()`, `buildGlassPanel(content)`, `buildPaceBadge(badge)`, `buildProgressBar(fill, total, color)`, `buildSmall(props)`, `buildMedium(props)`, `buildLarge(props)`. This makes the ~600-line JS string maintainable.

### Decision 2: Trend delta arrows
Unicode arrows `↑` and `↓` — simpler than custom shapes; readable at widget scale.

### Decision 3: Progress bar for BrainLift (large only)
`Rectangle()` as filled bar inside a `ZStack` with a background pill shape — pure JS/SwiftUI, no custom views.
```javascript
function buildProgressBar(value, target, color) {
  var fillPct = Math.min(value / target, 1.0);
  return ZStack(alignment: .leading) {
    Capsule().fill('#2F2E41').frame(height: 6)
    Capsule().fill(color).frame(width: fillPct * BAR_WIDTH, height: 6)
  }
}
```

### Decision 4: paceBadge capsule shape
Use `Capsule` background with label text — mirrors the app's state badge treatment.

### Decision 5: Manager urgency layout switch
When `isManager && (urgency === 'high' || urgency === 'critical') && pendingCount > 0`:
- Large/Medium: swap hero to show countdown + approval items, not hours/AI
- Small: show `pendingCount` as hero + urgency countdown

## Interface Contracts

### Props consumed from WidgetData (new fields)
```typescript
// All fields from WidgetData — new ones from 01-data-extensions:
props.paceBadge: 'crushed_it' | 'on_track' | 'behind' | 'critical' | 'none'
props.weekDeltaHours: string   // "+2.1h" | "-3.4h" | ""
props.weekDeltaEarnings: string // "+$84" | ""
props.brainliftTarget: string  // "5h"
```

### WIDGET_LAYOUT_JS structure
```javascript
(function(props, env) {
  // 1. Color constants (brand palette)
  // 2. Helper: badgeColor(paceBadge)
  // 3. Helper: buildMeshBg(urgency, paceBadge)  → ZStack with 3 gradient circles
  // 4. Helper: buildGlassPanel(children)        → RoundedRectangle + border
  // 5. Helper: buildPaceBadge(badge)            → Capsule + Text or null
  // 6. Helper: buildProgressBar(val, target, color, width)
  // 7. Helper: buildDeltaText(delta)            → colored Text with arrow or null
  // 8. buildSmall(props)
  // 9. buildMedium(props)
  // 10. buildLarge(props)
  // 11. buildAccessory(props, family)
  // 12. Router: switch env.widgetFamily
})
```

## Test Plan

### Visual regression (manual + screenshot-based)
- [ ] systemSmall hours mode renders without crash
- [ ] systemSmall shows paceBadge capsule
- [ ] systemMedium hours mode shows today, AI%, remaining, weekDeltaHours
- [ ] systemMedium manager urgency mode shows countdown + approval items
- [ ] systemLarge hours mode shows daily bars, AI progress, BrainLift progress bar
- [ ] systemLarge shows weekDeltaEarnings with arrow
- [ ] accessory sizes render without overflow

### Unit tests (WIDGET_LAYOUT_JS parse safety)
- [ ] JS string parses without syntax error (eval in test environment)
- [ ] buildSmall/buildMedium/buildLarge invocable with mock props, no throw
- [ ] Missing new fields (undefined paceBadge) handled gracefully — no crash, badge hidden
- [ ] `props.weekDeltaHours = ""` — delta text not rendered (null guard)

### Brand compliance
- [ ] hours color follows urgency (none/low → success, high → warning, critical → critical color)
- [ ] earnings always gold `#E8C97A`
- [ ] AI usage always cyan `#00C2FF`
- [ ] BrainLift always violet `#A78BFA`
- [ ] NO pure white `#FFFFFF` in any Text element

## Files to Modify

| File | Change |
|------|--------|
| `src/widgets/bridge.ts` | Full rewrite of `WIDGET_LAYOUT_JS` constant (all sizes) |
| `src/widgets/bridge.ts` | `buildTimelineEntries` may need update if urgency display changes |

## Files to Reference

- `hourglassws/BRAND_GUIDELINES.md` — exact color tokens, typography rules, no-pure-white rule
- `src/lib/colors.ts` — color constants (verify hex values)
- `src/widgets/types.ts` — full WidgetData interface (post-01-data-extensions)
- `src/widgets/bridge.ts` — existing WIDGET_LAYOUT_JS structure to refactor
- `features/app/widget-brand-revamp/FEATURE.md` — iOS rendering constraints section
