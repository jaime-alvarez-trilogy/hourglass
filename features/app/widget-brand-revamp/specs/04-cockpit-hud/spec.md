# 04-cockpit-hud

**Status:** Draft
**Created:** 2026-03-25
**Last Updated:** 2026-03-25
**Owner:** @trilogy

---

## Overview

Spec 04-cockpit-hud is the final rendering-layer polish pass for the Hourglass widget brand revamp. Specs 01–03 delivered a functional design system: data fields, iOS mesh + glass layouts, and Android brand alignment. This spec adds three targeted refinements that complete the "cockpit HUD" feel:

1. **Desaturated dark glass color tokens (FR1)** — The existing `PACE_COLORS` constant (iOS) and `badgeColor()` function (Android) use the original saturated palette (`#FFDF89`, `#10B981`, `#F59E0B`, `#F43F5E`) which clash visually against the dark `#0D0C14` mesh background. The `colors.ts` design system already defines softer desaturated counterparts (`luxuryGold #CEA435`, `successGreen #4ADE80`, `warnAmber #FCD34D`, `desatCoral #F87171`). This FR updates both platforms to use these tokens; no new values are introduced.

2. **P2 stripped deficit layout (FR2 iOS, FR3 Android)** — When a contributor or non-urgent manager is behind pace (`paceBadge === 'behind' | 'critical'`) and there are no pending approval actions, the widget currently shows the full hours-mode layout with AI%, BrainLift bar, and daily chart. This creates visual noise that dilutes the urgency signal. The new P2 mode renders a stripped layout: warning badge + hero hours display + hours remaining + footer (earnings delta, today). The existing P1 (action mode) always wins over P2; on-track/crushed-it users always see the full P3 hours mode.

3. **iOS hero typography (FR4)** — Hero `Text` nodes in `WIDGET_LAYOUT_JS` (hours total, pending count, earnings hero) currently use the default SwiftUI system font. Adding `.font({ size: 32, weight: 'heavy', design: 'monospaced' })` aligns them with the app's technical aesthetic. Secondary metrics use `{ size: 13, weight: 'medium', design: 'monospaced' }`. This is iOS-only — Android's `TextWidget` has no `design` parameter.

4. **Priority ordering formalisation (FR5)** — Explicitly documents and enforces the P1 > P2 > P3 cascade so future layout additions can follow the same pattern.

### What Is Being Built

- Update `PACE_COLORS` in `bridge.ts` (iOS WIDGET_LAYOUT_JS) and `badgeColor()` in `HourglassWidget.tsx` (Android) to desaturated values
- Add `isPaceMode` detection in `buildMedium`, `buildLarge`, and `buildSmall` functions inside `WIDGET_LAYOUT_JS` (ES5 syntax only)
- Add P2 layout JSX branch in `MediumWidget` inside `HourglassWidget.tsx`
- Add `.font({ weight: 'heavy', design: 'monospaced' })` to iOS hero Text nodes
- Add test coverage for all 5 FRs in existing test files

### How It Works

The priority cascade evaluates three boolean flags in order:

```
actionMode   = approvalItems.length > 0 || myRequests.length > 0  // P1
isPaceMode   = !actionMode && (paceBadge === 'behind' || paceBadge === 'critical')  // P2
// P3 = everything else (on_track, crushed_it, none)
```

No new data fields are needed. All `WidgetData` fields required by the P2 layout (`hoursDisplay`, `hoursRemaining`, `weekDeltaEarnings`, `today`, `paceBadge`) were added in spec 01.

---

## Out of Scope

1. **`colors.ts` modification** — Descoped. The desaturated tokens (`luxuryGold`, `successGreen`, `warnAmber`, `desatCoral`) already exist in `colors.ts`. Widget files inline hex values directly; there is no import chain from widget JS/JSX into `colors.ts`. No change to that file is needed.

2. **Android typography (monospaced design param)** — Descoped. `TextWidget` in `react-native-android-widget` supports `fontFamily`, `fontSize`, and `fontWeight` but has no `design` parameter. Monospaced font design is iOS-only in this spec.

3. **Android SmallWidget P2 mode** — Descoped. The small Android widget already shows only hero + badge + remaining. The urgency-color shift from spec 03 is sufficient; a dedicated P2 layout adds no meaningful information density gain at small size.

4. **iOS lock screen accessories (accessoryRectangular/Circular/Inline) P2 mode** — Descoped. Complications have extremely limited space and only surface a single metric. The P2 stripped layout would be identical to what complications already show; adding a P2 branch provides no user value.

5. **New `WidgetData` fields** — Descoped. All fields required by P2 layout (`hoursDisplay`, `hoursRemaining`, `weekDeltaEarnings`, `today`, `paceBadge`) were added in spec 01-data-extensions. No new fields needed.

6. **Interactive widget actions (approve/reject from widget)** — Descoped. Deferred to a separate spec (not yet scheduled). The P2 layout is read-only.

7. **Widget configuration UI (size/role picker)** — Descoped. Deferred per FEATURE.md scope boundary.

8. **Scriptable `hourglass.js` updates** — Descoped. The Scriptable widget is a separate codebase and not part of the Expo app widget revamp effort.

9. **Android LargeWidget P2 mode** — Descoped. `HourglassWidget.tsx` only exports `SmallWidget` and `MediumWidget`; there is no large Android widget component. Medium is sufficient.

---

## Functional Requirements

### FR1 — Update pace badge color tokens to desaturated dark glass palette

Update `PACE_COLORS` in `WIDGET_LAYOUT_JS` (iOS, `bridge.ts`) and `badgeColor()` in `HourglassWidget.tsx` (Android) to use the desaturated dark glass values from `colors.ts`.

**New values:**

| Badge | Old | New | Token name |
|-------|-----|-----|------------|
| `crushed_it` | `#FFDF89` | `#CEA435` | `luxuryGold` |
| `on_track` | `#10B981` | `#4ADE80` | `successGreen` |
| `behind` | `#F59E0B` | `#FCD34D` | `warnAmber` |
| `critical` | `#F43F5E` | `#F87171` | `desatCoral` |

Note: `#10B981` may still appear in `HOURS_COLOR` for urgency-driven coloring on iOS — only the `PACE_COLORS` constant and the Android `badgeColor()` function are updated. `meshStateColor()` in `HourglassWidget.tsx` retains its existing saturated values (it drives mesh node color, not badge color).

**Success Criteria:**
- iOS `WIDGET_LAYOUT_JS` string contains `'#CEA435'` for `crushed_it`
- iOS `WIDGET_LAYOUT_JS` string contains `'#4ADE80'` for `on_track`
- iOS `WIDGET_LAYOUT_JS` string contains `'#FCD34D'` for `behind`
- iOS `WIDGET_LAYOUT_JS` string contains `'#F87171'` for `critical`
- Old values `#FFDF89`, `#F59E0B`, `#F43F5E` do NOT appear in `PACE_COLORS` (iOS)
- Old value `#10B981` does NOT appear in `PACE_COLORS` (iOS) — may still appear in `HOURS_COLOR`
- Android `badgeColor('crushed_it')` returns `'#CEA435'`
- Android `badgeColor('on_track')` returns `'#4ADE80'`
- Android `badgeColor('behind')` returns `'#FCD34D'`
- Android `badgeColor('critical')` returns `'#F87171'`
- Android `badgeColor('none')` still returns `''`

---

### FR2 — iOS P2 stripped deficit layout

Add a P2 rendering branch inside `buildMedium`, `buildLarge`, and `buildSmall` functions in `WIDGET_LAYOUT_JS`. P2 activates when `!actionMode && (p.paceBadge === 'behind' || p.paceBadge === 'critical')`.

**P2 layout structure (medium/large):**
```
ZStack (fillFrame, ContainerBackground #0D0C14)
  buildMeshBg(urgency, paceBadge)          // existing mesh — state color drives amber/coral node
  VStack (alignment: 'leading', spacing: 8)
    HStack
      Text("⚠ " + badgeLabel)             // .font({size:11, weight:'semibold'})
                                           // .foregroundStyle(paceColor)
    Text(p.hoursDisplay)                   // .font({size:32, weight:'heavy', design:'monospaced'})
                                           // .foregroundStyle(hoursColor)
    Text(p.hoursRemaining)                 // .font({size:13, weight:'medium'})
                                           // .foregroundStyle('#A0A0A0')
    Spacer()
    HStack
      Text(p.weekDeltaEarnings || "")      // .foregroundStyle(deltaColor)
      Spacer()
      Text("today " + p.today)             // .foregroundStyle('#A0A0A0')
```

**P2 layout structure (small):**
```
ZStack (fillFrame, ContainerBackground #0D0C14)
  buildMeshBg(urgency, paceBadge)
  VStack (alignment: 'leading', spacing: 4)
    Text("⚠ " + badgeLabel)               // .font({size:10, weight:'semibold'})
                                           // .foregroundStyle(paceColor)
    Text(p.hoursDisplay)                   // .font({size:28, weight:'heavy', design:'monospaced'})
                                           // .foregroundStyle(hoursColor)
    Text(p.hoursRemaining)                 // .font({size:12, weight:'medium'})
                                           // .foregroundStyle('#A0A0A0')
```

P2 does NOT show: `aiPct`, `brainlift`, daily chart, BrainLift progress bar, `weekDeltaHours`.

Implementation constraint: `WIDGET_LAYOUT_JS` is ES5. Use `var` and `function()` declarations only. No `const`, `let`, or arrow functions.

**Success Criteria:**
- `buildMedium` with `paceBadge='behind'`, `approvalItems=[]` → output contains `hoursDisplay` value and `hoursRemaining` value
- Same → output does NOT contain `aiPct` value or `brainlift` value
- `buildLarge` with `paceBadge='critical'`, `approvalItems=[]` → stripped layout, contains `hoursDisplay`/`hoursRemaining`, no `aiPct`/`brainlift`
- `paceBadge='behind'` AND `approvalItems.length > 0` → P1 wins, action item rows rendered (not P2 layout)
- `paceBadge='on_track'` AND no approvals → P3 hours mode, `aiPct` IS shown
- `paceBadge='none'` AND no approvals → P3 hours mode, `aiPct` IS shown
- `buildSmall` with `paceBadge='critical'`, no approvals → shows `hoursDisplay` + `hoursRemaining`, not `aiPct`

---

### FR3 — Android P2 stripped deficit layout

Add a P2 rendering branch inside `MediumWidget` in `HourglassWidget.tsx`. P2 activates when `!actionMode && !isUrgencyMode && (data.paceBadge === 'behind' || data.paceBadge === 'critical')`. The `isUrgencyMode` check ensures urgency mode (existing P1 sub-case for managers) always wins.

**P2 layout:**
```tsx
<FlexWidget style={{ backgroundColor: '#0D0C14', flex: 1, flexDirection: 'column',
                     position: 'relative', padding: 12 }}>
  <SvgWidget svg={meshSvg} style={{ position: 'absolute', top:0, left:0, right:0, bottom:0 }} />
  {/* Warning badge row */}
  <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
    <TextWidget text={`⚠ ${badgeLabel(data.paceBadge)}`}
      style={{ color: badgeColor(data.paceBadge), fontSize: 11, fontWeight: '600' }} />
  </FlexWidget>
  {/* Hero hours */}
  <TextWidget text={data.hoursDisplay}
    style={{ color: hoursColor, fontSize: 32, fontWeight: '700' }} />
  {/* Hours remaining */}
  <TextWidget text={data.hoursRemaining}
    style={{ color: '#A0A0A0', fontSize: 13 }} />
  {/* Flex spacer */}
  <FlexWidget style={{ flex: 1 }} />
  {/* Footer */}
  <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <TextWidget text={data.weekDeltaEarnings || ''}
      style={{ color: deltaColor(data.weekDeltaEarnings), fontSize: 12 }} />
    <TextWidget text={`today ${data.today}`}
      style={{ color: '#A0A0A0', fontSize: 12 }} />
  </FlexWidget>
</FlexWidget>
```

`hoursColor` uses the existing `accent` variable (`URGENCY_ACCENT[data.urgency]`).

**Success Criteria:**
- `MediumWidget` with `paceBadge='behind'`, `approvalItems=[]`, `isManager=false` → renders `⚠` text + `hoursDisplay` + `hoursRemaining`
- Same → does NOT render `aiPct` TextWidget or `brainlift` TextWidget
- `MediumWidget` with `paceBadge='critical'`, `approvalItems=[]` → P2 layout, badge color is `'#F87171'`
- `paceBadge='behind'` AND `isManager=true` AND `urgency='critical'` AND `pendingCount>0` → urgency mode wins, not P2
- `paceBadge='behind'` AND `approvalItems.length > 0` → action mode wins, not P2
- `paceBadge='on_track'` AND no approvals → P3 hours mode, `aiPct` rendered

---

### FR4 — iOS hero typography (monospaced heavy)

Add `.font({ size: 32, weight: 'heavy', design: 'monospaced' })` modifier to hero `Text` nodes throughout `WIDGET_LAYOUT_JS`. Secondary metric nodes use `.font({ size: 13, weight: 'medium', design: 'monospaced' })`.

Hero nodes (primary metric per layout):
- `buildSmall`: hours total Text
- `buildMedium` P3 hours mode: hours total Text (glass panel hero)
- `buildMedium` P2 mode: `hoursDisplay` Text
- `buildLarge` P3 hours mode: hours total Text
- `buildLarge` P2 mode: `hoursDisplay` Text
- Action mode (medium/large): pending count / hours Text (primary metric)

Implementation constraint: chained modifier syntax `.font(...)` as used by `expo-widgets` JSContext; ES5 only.

**Success Criteria:**
- `WIDGET_LAYOUT_JS` string contains `weight: 'heavy'`
- `WIDGET_LAYOUT_JS` string contains `design: 'monospaced'`
- `buildSmall` output (via `widgetLayoutJs.test.ts` evaluation) includes the font modifier on the hero Text node

---

### FR5 — Priority ordering P1 > P2 > P3

Formalise the three-priority cascade so all layout branches are evaluated in the correct order:

```
P1: actionMode (approvalItems.length > 0 || myRequests.length > 0)
    → action item rows (or urgency countdown for isUrgentMgr)
P2: !actionMode && (paceBadge === 'behind' || paceBadge === 'critical')
    → stripped deficit layout
P3: else (on_track / crushed_it / none, no pending actions)
    → full hours mode with AI%, BrainLift, chart
```

On Android the cascade also accounts for `isUrgencyMode` (manager + high/critical urgency + pendingCount > 0) as a P1 sub-case that is checked before `actionMode`.

**Success Criteria:**
- `isManager=true`, `pendingCount=3`, `paceBadge='critical'`, `urgency='critical'` → P1 urgency mode (countdown hero), not P2
- `isManager=false`, `paceBadge='critical'`, `myRequests=[]`, `approvalItems=[]` → P2 stripped layout
- `isManager=false`, `paceBadge='on_track'`, `myRequests=[]`, `approvalItems=[]` → P3 full hours mode
- iOS: `paceBadge='behind'` AND `approvalItems.length > 0` → P1 action rows, not P2

---

## Technical Design

### Files to Reference

| File | Purpose |
|------|---------|
| `hourglassws/src/widgets/bridge.ts` | Contains `WIDGET_LAYOUT_JS` ES5 string (iOS rendering) and `PACE_COLORS` constant |
| `hourglassws/src/widgets/android/HourglassWidget.tsx` | Android widget components; `badgeColor()`, `MediumWidget`, `SmallWidget` |
| `hourglassws/src/widgets/__tests__/widgetLayoutJs.test.ts` | Existing iOS widget test harness (SwiftUI stubs + JS eval) |
| `hourglassws/src/__tests__/widgets/android/HourglassWidget.test.tsx` | Existing Android widget unit tests |
| `hourglassws/src/widgets/types.ts` | `WidgetData` interface (all required fields already present) |

### Files to Modify

| File | Changes |
|------|---------|
| `hourglassws/src/widgets/bridge.ts` | 1) Update `PACE_COLORS` constant values (FR1) 2) Add `isPaceMode` var derivation in `buildMedium`, `buildLarge`, `buildSmall` (FR2) 3) Add P2 layout block in each builder (FR2) 4) Add `.font({weight:'heavy',design:'monospaced'})` to hero Text nodes (FR4) |
| `hourglassws/src/widgets/android/HourglassWidget.tsx` | 1) Update `badgeColor()` return values (FR1) 2) Add `isPaceMode` detection in `MediumWidget` (FR3) 3) Add P2 layout JSX branch in `MediumWidget` (FR3) |
| `hourglassws/src/widgets/__tests__/widgetLayoutJs.test.ts` | Add FR1, FR2, FR4, FR5 test cases in new `describe` blocks |
| `hourglassws/src/__tests__/widgets/android/HourglassWidget.test.tsx` | Add FR1, FR3, FR5 test cases in new `describe` blocks |

### No New Files

No new files are created. All changes are modifications to existing files.

### Data Flow

```
WidgetData (all fields already present from spec 01)
  ↓
bridge.ts WIDGET_LAYOUT_JS (iOS)
  - PACE_COLORS → updated hex values (FR1)
  - buildSmall/buildMedium/buildLarge
      → derive actionMode (existing)
      → derive isPaceMode = !actionMode && paceBadge in ['behind','critical'] (FR2 new)
      → P1 branch: action rows (existing)
      → P2 branch: stripped deficit layout (FR2 new)
      → P3 branch: full hours mode (existing)
      → hero Text nodes get .font({weight:'heavy',design:'monospaced'}) (FR4)

HourglassWidget.tsx (Android)
  - badgeColor() → updated hex values (FR1)
  - MediumWidget
      → isUrgencyMode (existing)
      → actionMode (existing)
      → isPaceMode = !actionMode && !isUrgencyMode && paceBadge in ['behind','critical'] (FR3 new)
      → isUrgencyMode branch (existing)
      → actionMode branch (existing)
      → isPaceMode branch: stripped deficit layout (FR3 new)
      → hours mode branch (existing, P3)
```

### iOS ES5 Constraint

`WIDGET_LAYOUT_JS` is a JavaScript string that runs inside a `JSContext` (JavaScriptCore). It must be ES5-compatible:
- Use `var` for variable declarations — no `const` or `let`
- Use `function() {}` declarations — no arrow functions `() =>`
- No template literals — use string concatenation

The P2 detection inside each builder function follows the existing pattern:
```javascript
// Inside buildMedium(p, family) — ES5
var actionMode = (p.approvalItems && p.approvalItems.length > 0) ||
                 (p.myRequests && p.myRequests.length > 0);
var isPaceMode = !actionMode &&
                 (p.paceBadge === 'behind' || p.paceBadge === 'critical');

if (actionMode) { /* P1 block */ }
else if (isPaceMode) { /* P2 block — new */ }
else { /* P3 hours mode */ }
```

### Android TypeScript Pattern

The P2 detection in `MediumWidget` follows the existing `isUrgencyMode`/`actionMode` pattern:
```typescript
const isUrgencyMode = data.isManager &&
  (data.urgency === 'high' || data.urgency === 'critical') &&
  data.pendingCount > 0;

const hasApprovals = data.approvalItems && data.approvalItems.length > 0;
const hasRequests = data.myRequests && data.myRequests.length > 0;
const actionMode = !isUrgencyMode && (hasApprovals || hasRequests);

// FR3: new
const isPaceMode = !actionMode && !isUrgencyMode &&
  (data.paceBadge === 'behind' || data.paceBadge === 'critical');

if (isUrgencyMode) { /* existing */ }
else if (actionMode) { /* existing */ }
else if (isPaceMode) { /* P2 new */ }
else { /* P3 hours mode */ }
```

### Font Modifier Syntax (iOS)

The `expo-widgets` JSContext exposes a chained modifier API on Text nodes. The `.font()` call accepts an object:
```javascript
Text(p.hoursDisplay)
  .font({ size: 32, weight: 'heavy', design: 'monospaced' })
  .foregroundStyle(hoursColor)
```
This is confirmed by spec-research.md: "Font modifiers via `.font({ size: N, weight: 'heavy', design: 'monospaced' })` — appended as chained modifier on Text elements".

### Edge Cases

| Case | Handling |
|------|----------|
| `paceBadge='behind'` + `approvalItems.length > 0` | `actionMode=true` → P1 wins; `isPaceMode` is not evaluated |
| `paceBadge='critical'` + manager urgency mode | Android: `isUrgencyMode=true` checked before `isPaceMode` → urgency wins; iOS: urgency is a sub-case within P1 (`isUrgentMgr` check), P2 not reached |
| `paceBadge='none'` | `isPaceMode=false` → P3 full hours mode |
| `paceBadge='on_track'` or `'crushed_it'` | `isPaceMode=false` → P3 full hours mode |
| `weekDeltaEarnings=''` | P2 footer: `Text(p.weekDeltaEarnings \|\| "")` renders empty string silently |
| `hoursRemaining` OT string (e.g. "2.5h OT") | Rendered as-is; no special P2 logic needed |

### Test Architecture

Tests extend the existing harnesses without creating new test files:

**`widgetLayoutJs.test.ts`** — existing pattern evaluates `WIDGET_LAYOUT_JS` in a mock environment with stubbed SwiftUI primitives, then calls `buildMedium(mockPayload, 'systemMedium')` and inspects the returned JSON tree. New test cases follow the same pattern with `paceBadge` set to `'behind'` or `'critical'` and `approvalItems: []`.

**`HourglassWidget.test.tsx`** — existing pattern uses `@testing-library/react-native` to render `<HourglassWidget data={mockData} widgetFamily="medium" />` and query by text or test ID. New cases render with `paceBadge='behind'`/`'critical'` and assert presence/absence of text nodes.
