

## Option A
CODE score: 7/10
- Correct use of all allowed primitives (VStack, HStack, ZStack, Text, Spacer, Rectangle, RoundedRectangle, Circle); well-structured component decomposition with AmbientGlow, GlassCard, StatusPill, BarChart as reusable pieces
- Uses `require` correctly for expo-widgets; `createWidget` entrypoint properly handles `widgetFamily` switching with fallback data — solid widget constraint handling
- TypeScript quality is weak: zero type annotations on any component props, `data` is untyped `any` throughout, `style={{ minWidth: 79 }}` on VStack is not a valid SwiftUI prop and would silently fail

UX score: 7/10
- Good visual hierarchy: hero hours at 28pt heavy with accent color, labels at 11pt semibold secondary — clear information density scaling across small/medium/large
- Correct brand color semantics: gold for earnings, cyan for AI, violet for brainlift, success-mapped accent for hours; GlassCard uses `#16151FCC` surface with `#A78BFA40` border stroke matching the spec
- Large widget is overly dense — cramming hours, today, avg/day, left, earnings, status pill, bar chart, AI score, brainlift, delta earnings, AND a footer timestamp creates visual noise; the bar chart uses `Rectangle` instead of `RoundedRectangle` which is inconsistent with the glass aesthetic

Better:
1. Most comprehensive large widget — includes AI score, brainlift, delta earnings, and footer timestamp that no other option provides
2. AmbientGlow component is cleanly parameterized with position offsets (x, y) and blur, allowing precise glow placement per widget size

Worse:
1. Zero TypeScript typing — all props are `any`, no interfaces defined, making this the least type-safe option
2. `style={{ minWidth: 79 }}` on VStack is invalid in expo-widgets/SwiftUI and would be silently ignored, causing layout breakage in the large widget's top summary row

Improvement: Define a `WidgetData` interface and type all component props; replace the invalid `style` prop with `frame={{ minWidth: 79 }}` or restructure the HStack to use `Spacer` for proportional layout.

---

## Option B
CODE score: 8/10
- Full TypeScript interfaces for `WidgetDailyEntry` and `WidgetData` with union types for paceBadge/urgency — strongest type safety of all options
- Correct primitive usage throughout; `GlassCard` accepts a `glowColor` prop to embed a small glow circle inside the card — clever compositional pattern
- Uses `frame={{ flex: 1 }}` on VStack/GlassCard which is **not a valid SwiftUI frame property** in expo-widgets — flex is a CSS concept, not SwiftUI; this would fail silently or be ignored

UX score: 7/10
- Clean two-column medium layout with hours and earnings in separate glass cards; status pill and AI/brainlift info below creates good scanability
- Hours display at 28-34pt heavy is appropriately sized; gold earnings color is correct; bar chart in large widget uses `RoundedRectangle` with cornerRadius for polished bars
- Small widget is too minimal — just hours, "THIS WEEK" label, a dot + status text; no earnings shown, no glass card, feels like a placeholder compared to the premium aesthetic; the hours are white (`#E0E0E0`) instead of accent-colored, breaking the status-tinted convention

Better:
1. Only option with proper TypeScript interfaces including union types for all enum fields — production-grade type safety
2. GlassCard's embedded `glowColor` circle creates a subtle per-card glow effect that's more refined than global ambient circles

Worse:
1. Small widget lacks earnings, glass card, and accent-colored hours — feels bare and doesn't match the premium dark glass aesthetic
2. `frame={{ flex: 1 }}` is invalid SwiftUI — used in both medium and large widgets, meaning layout proportions would break entirely on device

Improvement: Replace all `frame={{ flex: 1 }}` with proper SwiftUI layout (remove frame and let HStack distribute children equally, or use `frame={{ maxWidth: .infinity }}`), and color the small widget hours with the accent color.

---

## Option C
CODE score: 6/10
- Flat prop destructuring (`props.hoursDisplay`, `props.daily`) instead of a nested `data` object is inconsistent with the widget data contract all other options use — fragile if the data shape changes
- `AmbientBackground` uses `Spacer` inside `VStack`/`HStack` to position glow circles, which is a creative workaround but imprecise — circles won't have controlled offsets, just pushed to corners
- No TypeScript types at all — everything is implicitly `any`; the `'widget'` directive at the top of the file is non-standard (should be inside the createWidget callback)

UX score: 6/10
- Clean, minimal layouts across all three sizes; medium widget's status pill + AI + today delta in a single HStack is space-efficient
- GlassCard uses `#2F2E41` border instead of `#A78BFA40` — loses the signature violet-tinted glass border that defines the brand aesthetic
- Large widget is underwhelming: just two glass cards (hours + earnings), a status row, and an activity panel — no brainlift, no AI trajectory card, no delta earnings; wastes the large widget's real estate

Better:
1. `AmbientBackground` as a self-contained component with size-agnostic corner positioning via Spacer is the simplest ambient glow approach — zero magic numbers
2. `StatPill` is the most compact status pill implementation — single ZStack with no extra HStack wrapper

Worse:
1. GlassCard border is `#2F2E41` (plain border color) instead of `#A78BFA40` (violet-tinted) — fundamentally breaks the glass card brand identity
2. Large widget is the most feature-sparse of all options — missing brainlift, AI trajectory, delta earnings, manager approvals; doesn't justify the large size

Improvement: Change GlassCard stroke from `#2F2E41` to `#A78BFA40` and add brainlift (violet) + AI trajectory (cyan) metric rows to the large widget to utilize the available space.

---

## Option D
CODE score: 4/10
- Destructures `widgetData` from props but then checks `widgetData.size` for widget family — `size` is not a standard expo-widgets prop name (should be `widgetFamily`), meaning the size switching would never match
- `StatusPill` uses a solid `fill={color}` instead of a translucent background (`color + '20'`) — the pill becomes an opaque colored block with white-ish text, not a glass-style tinted pill
- `BarChart` calculates height as `(day.hours / 40) * 50` — dividing by 40 (weekly goal) instead of the daily max means bars will be tiny (e.g., 8h/40 = 10px), and uses `Rectangle` without `cornerRadius` on the bar itself

UX score: 3/10
- No background `Rectangle fill` for the dark background — the widget would show the system default background, completely breaking the dark glass aesthetic
- Small widget puts hours and "THIS WEEK" label in a horizontal `HStack` which is bizarre for a hero metric — the label should be above or below, not beside the number
- Large and medium widgets are nearly identical layouts — just VStack with hours, earnings, status pill, remaining text; the large widget adds a bar chart and a cramped single-line HStack with TODAY/AI/BRAINLIFT all on one line at size 12, which is unreadable

Better:
1. Includes both `paceColor` and `urgencyColor` mappings as separate objects — clean separation of concerns for the two color systems
2. Most concise implementation — minimal code, easy to read top to bottom

Worse:
1. Widget family detection via `widgetData.size` is fundamentally broken — no widget size would ever render correctly
2. No dark background fill, opaque status pills, and nearly identical medium/large layouts make this the lowest-quality visual implementation

Improvement: Fix the widget family detection to use `props.widgetFamily` (or the correct expo-widgets prop), add `<Rectangle fill="#0D0C14" />` as the first ZStack child in every widget, and change StatusPill fill to `color + '20'` with colored text.

---

## Option E
CODE score: 6/10
- Imports from `'./widget-data'` for types but those types don't exist in the file — would cause a build error unless the companion file is provided; mixing `import` (ESM) with `require` (CJS) in the same file is inconsistent
- Uses `color` prop on Text instead of `foregroundStyle` — `color` is not the documented expo-widgets SwiftUI Text prop; this would either fail or be silently ignored, meaning **all text would be invisible or default-colored**
- `BackgroundGlow` uses JSX fragments (`<>...</>`) which may not be supported in expo-widgets' SwiftUI JSX compiler; also uses `x`/`y` props on Circle instead of `offset` — non-standard prop names

UX score: 6/10
- Good design system organization with `FONTS` and `COLORS` constants; `MetricView` abstraction reduces repetition nicely
- `StatusPill` uses solid fill with dark/white text contrast — this is a valid design choice (opaque pill) but diverges from the glass-tinted pill aesthetic shown in the brand
- Large widget layout is well-structured: metrics top, glass-carded bar chart middle, brainlift + AI bottom, status footer — good information hierarchy; but the bar chart's `Spacer minLength` approach for height alignment is clever

Better:
1. `MetricView` abstraction is the most reusable metric display component — value + label with configurable color, font, and alignment in one call
2. `Bar` component uses `Spacer minLength` to push bars to bottom alignment — more semantically correct SwiftUI layout than fixed-height containers

Worse:
1. Uses `color` instead of `foregroundStyle` on all Text components — if this prop isn't supported, **every single text element would be broken**
2. External type import from `'./widget-data'` creates a hard dependency on an undefined file — won't compile standalone

Improvement: Replace all `color=` props on Text with `foregroundStyle=` and inline the `WidgetData`/`WidgetDailyEntry` type definitions instead of importing from an external file.

---

## Option F
CODE score: 8/10
- Cleanest helper function organization: `accentForPace`, `accentForUrgency`, `paceLabel`, `glowColorForPace` are pure functions with exhaustive switch statements — excellent maintainability
- `AmbientBackground` is parameterized by both `pace` and `size`, generating different glow configurations per widget size — most sophisticated ambient glow system of all options
- `GlassCard` accepts `borderColor` and `padding` props making it the most flexible glass card; uses `strokeWidth: 0.5` which is a nice subtle touch but may render as 1px on non-retina (minor)

UX score: 9/10
- Large widget has the best information architecture: hero hours card with goal context + status pill, earnings card, today + remaining mini-cards, activity bar chart, AI trajectory card with "weekly range" subtitle, brainlift card with "deep work" subtitle, conditional manager approvals panel, and footer with delta — comprehensive without feeling cluttered
- Color semantics are perfect: each glass card has a border tinted to its semantic color (accent for hours, gold for earnings, cyan for AI, violet for brainlift, warning for approvals) — this is the most brand-faithful implementation
- `SectionLabel` at 9pt is slightly too small — may fail Apple's accessibility guidelines and be hard to read on smaller devices; the medium widget's progress-bar-style status row is creative but adds complexity

Better:
1. Per-card semantic border coloring (`borderColor={C.cyan + '25'}`, `borderColor={C.violet + '25'}`) creates the most visually rich and brand-accurate glass card system
2. Only option that includes conditional manager approval panel in the large widget — most feature-complete implementation

Worse:
1. `SectionLabel` at 9pt font size is below Apple's recommended minimum (11pt) for widget text — accessibility concern
2. Medium widget's progress-bar-style status row (ZStack with multiple RoundedRectangles) is over-engineered for what's essentially a status pill — adds visual noise

Improvement: Increase `SectionLabel` font size from 9pt to 10-11pt for accessibility compliance, and simplify the medium widget's status row to use the same `StatusPill` component used in small/large.

---

## Option G
CODE score: 5/10
- Uses `import` syntax for `@expo/ui/swift-ui` instead of `require` — inconsistent with expo-widgets documentation and may not work in the widget compilation context
- `createWidget` is called with an object `{ name, getData, render }` API that **does not match expo-widgets' actual API** — expo-widgets uses `createWidget(callback)` not `createWidget({ render })`, so this would fail at runtime
- Uses `color` prop on Text (same issue as Option E) and non-existent props like `fill` on ZStack, `uppercase` as a boolean prop on Text, `lineLimit` — multiple prop API mismatches that would cause silent failures

UX score: 5/10
- Small widget tries to show two glass cards side by side + status bar + bar chart + footer — this is **way too much content for a systemSmall widget** (155×155pt); would overflow or compress to illegibility
- Medium widget is also overstuffed: a full glass card with hours/goal/status/today/avg/remaining, then a bar chart card, then brainlift + earnings cards — this is large widget content crammed into medium
- `AmbientGlow` is static (not pace-responsive) — uses fixed cyan/violet/success/gold circles regardless of status, so the ambient glow never reflects the user's current pace state

Better:
1. Full TypeScript types defined inline with proper union types for all fields including `ApprovalItem` — comprehensive type coverage without external dependencies
2. `HoursBarChart` excludes future hours from max calculation (`d.isFuture ? 0 : d.hours`) — smarter normalization that prevents future zeros from skewing the scale

Worse:
1. `createWidget({ name, getData, render })` API is completely wrong — this widget would not compile or render at all with expo-widgets
2. Small widget with two glass cards + status bar + bar chart + footer is physically impossible in 155×155pt — worst size-constraint awareness of all options

Improvement: Fix the `createWidget` call to use the callback pattern `createWidget((props) => { ... })`, replace all `color=` with `foregroundStyle=`, remove `fill`/`uppercase`/`lineLimit` non-existent props, and drastically reduce the small widget to just hero hours + status pill.
