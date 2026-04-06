 ## Option A

CODE score: 10/10
- Strictly adheres to available primitives (`size` on Circle/Rectangle, `offset` for positioning, `foregroundStyle` on Text, hex alpha for opacity)
- Excellent widget constraint handling with proper `padding`, `spacing`, and `alignment` on stack containers
- Clean TypeScript structure with centralized color constants and reusable component functions (GlassCard, StatusPill, BarChart)

UX score: 9/10
- Premium dark glass aesthetic with proper ZStack layering (fill → border → content) and `#A78BFA40` border tint
- Correct brand color semantics: dynamic accent for hours (pace-based), gold for earnings, cyan for AI, violet for brainlift
- Excellent typography hierarchy with hero fonts (28/32pt heavy) for hours and monospaced data fonts for metrics

Better: Implements fully functional bar charts for all widget sizes with proper height scaling; Uses precise ambient glow positioning with multiple overlapping circles (accent + violet + cyan)
Worse: Large widget layout is slightly crowded with too many data points in a single card; Ambient glow positioning is static and doesn't adapt intensity to widget size
Improvement: Add size-specific ambient glow intensity (larger blur radius for Large widgets, tighter for Small) like Option F's approach

---

## Option B

CODE score: 6/10
- **Critical API violations**: Uses invalid `frame` prop on Circle (should be `size`) and `opacity` prop (should use hex alpha like `#A78BFA20`)
- Missing bar chart implementation in Medium widget (only shows "AI" text)
- Good TypeScript interface definitions but implementation uses non-existent props

UX score: 7/10
- Clean visual hierarchy with proper glass card structure
- Correct color mapping for pace badges and earnings
- Status pill lacks proper padding container (text touches edges)

Better: Clean separation of concerns with dedicated GlassCard component; Good use of `Spacer` for pushing content to edges
Worse: Invalid primitive props will cause rendering failures; Weak ambient glow (single circle vs. layered); Missing activity visualization in Medium
Improvement: Replace `frame={{width, height}}` with `size={dimension}` on Circle, and add `BarChart` component to Medium widget showing 5-day activity

---

## Option C

CODE score: 8/10
- Uses `'widget'` directive correctly at top of file
- **Risk**: Uses `padding` on ZStack in GlassCard (invalid prop—only stacks have padding, ZStack does not in this API)
- **Risk**: `substring(0, 3)` on day labels could crash if data is malformed

UX score: 7/10
- Good glass card aesthetic with proper border `#2F2E41`
- Correct brand colors for earnings (gold) and AI (cyan)
- Ambient background uses Spacer-based positioning which is less precise than explicit offsets

Better: Clever inline calculation for avg/day; Safe data fallbacks with defaultDaily
Worse: Ambient glow positioning relies on HStack/VStack/Spacer layout rather than explicit `offset` coordinates; Status pill uses `+ '20'` string concat for alpha instead of hex constants
Improvement: Replace Spacer-based ambient positioning with explicit `Circle` components using `offset={{x, y}}` for precise glow placement behind content

---

## Option D

CODE score: 4/10
- **Critical**: Uses `width` and `height` props on Rectangle (invalid—should be `size={{width, height}}`)
- **Critical**: Uses `widgetData.size` instead of `widgetFamily` prop
- Missing proper ambient glow (circles are not positioned with offsets)
- No TypeScript types

UX score: 4/10
- No premium glass aesthetic (solid fills instead of translucent `#CC` alpha)
- Flat design lacks depth (no layered ZStack for glass effect)
- Typography is flat (no weight hierarchy between labels and values)

Better: Simple and minimal code structure is easy to read
Worse: Incorrect primitive props will fail to render; No bar chart height calculation (arbitrary scaling); Missing color semantics (earnings not gold?)
Improvement: Complete rewrite following Option A's GlassCard pattern with `RoundedRectangle` fill `#16151FCC` and stroke `#A78BFA40`, plus proper `size` props on shapes

---

## Option E

CODE score: 7/10
- **Critical**: Uses `color` prop on Text (should be `foregroundStyle`)
- **Critical**: Uses `x` and `y` props on Circle (should be `offset={{x, y}}`)
- **Critical**: Uses `height`/`width` on RoundedRectangle (should use `size` or container constraints)
- Excellent TypeScript with imported WidgetData types

UX score: 8/10
- Sophisticated design system with centralized COLORS and FONTS constants
- Smart BackgroundGlow logic that changes based on pace status
- StatusPill uses black text for "crushed_it" (gold background) for proper contrast—attention to detail

Better: Excellent component abstractions (MetricView, Bar); Dynamic glow color based on pace status
Worse: Invalid prop names will cause runtime errors; Missing urgency color handling in favor of pace only
Improvement: Replace all `color={...}` with `foregroundStyle={...}` on Text components, and change Circle positioning from `x={-50}` to `offset={{x: -50, y: -50}}`

---

## Option F

CODE score: 7/10
- **Critical**: Uses `frame` prop on Circle (should be `size`)
- **Critical**: Uses `opacity` prop (should use hex alpha like `#E8C97A0A`)
- Excellent organization with size-specific ambient backgrounds (small/medium/large)
- Good use of helper functions for color logic

UX score: 9/10
- **Best-in-class spatial design**: Size-specific ambient glows (Small has tight glow, Large has expansive mesh)
- Innovative Medium widget with progress-bar style status indicator (ZStack with rounded rectangles)
- Excellent Large widget layout with proper card grouping (Activity, AI Trajectory, BrainLift separated)

Better: Size-specific ambient glow positioning (adapts blur radius and circle count to widget size); Creative progress bar status pill in Medium
Worse: Invalid `frame` and `opacity` props will not render; Uses `C.pillBorderAlpha` string concat instead of hex constant
Improvement: Replace `frame={{width, height}}` with `size={dimension}` on Circle, and replace `opacity={0.12}` with fill color `#A78BFA20` (hex alpha)

---

## Option G

CODE score: 5/10
- **Critical API mismatches**: Uses `fill` on ZStack (invalid), `color` on Text (should be `foregroundStyle`), `frame` on Circle (should be `size`), `opacity` on Circle (should be hex alpha), `uppercase` prop on Text (should be `textTransform="uppercase"`), `lineLimit` on Text (not available)
- Uses different `createWidget` API signature (object with `getData`/`render` vs function)
- Valid glass card structure and bar chart implementation

UX score: 8/10
- **Best StatusBadge design**: Filled pill with high contrast text looks more premium than outlined pills in other options
- Good visual hierarchy with clear section labels
- Calculates avg/day dynamically (nice touch)
- Proper use of violet for BrainLift and gold for earnings

Better: Filled status pills provide better visual weight than outlines; Dynamic avg/day calculation shows attention to detail
Worse: Completely invalid primitive props throughout (will not render); Ambient glow uses generic positioning instead of pace-based dynamic colors
Improvement: **Full API migration**: Replace `color` with `foregroundStyle`, `frame` with `size`, remove `opacity` in favor of hex alpha (e.g., `#00C2FF12`), remove `fill` from ZStack, and change `uppercase` to `textTransform="uppercase"`
idget((props) => { ... })` pattern; Remove `fill` from ZStack; Simplify SmallWidget to single hero metric with status pill only; Make AmbientGlow adapt to paceBadge color like Option F
