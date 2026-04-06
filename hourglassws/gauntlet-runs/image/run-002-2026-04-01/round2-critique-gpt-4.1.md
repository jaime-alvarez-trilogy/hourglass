## Option A
CODE score: 10/10
- Strictly uses only allowed expo-widgets primitives (VStack, HStack, ZStack, etc.) everywhere.
- Handles widget constraints and sizing for all widget families (small, medium, large), with careful spacing, padding, and fallback data.
- TypeScript: clear, modular, readable; color/font constants, helper mappings, and fallback data are robust.

UX score: 10/10
- Visual hierarchy is excellent: hero numbers, status pill, and bar chart are all correctly prioritized and spaced.
- Brand color semantics are perfect: gold for earnings, cyan for AI, violet for brainlift, green for success/hours, etc.
- Glass card, ambient glow, and typography all precisely match the premium dark glass/mesh aesthetic in the app screenshots.

Better:
1. Ambient glow circles are layered, colored, and positioned to match the app's mesh/glass look exactly.
2. GlassCard and StatusPill components are reusable, with correct border, fill, and blur, giving a true glassy effect.

Worse:
1. The only minor nit: some font sizes for "caption" and "label" could be a pixel off from Figma, but this is trivial.
2. Could add more explicit prop types for all subcomponents for stricter TS, but the code is already very robust.

Improvement:
- Add a subtle gold glow behind the earnings card for even more visual pop, especially in medium/large layouts.

---

## Option B
CODE score: 7/10
- Uses only allowed primitives, but some props (e.g., `frame`, `opacity`) may not be supported by expo-widgets or SwiftUI 1:1.
- Widget constraint handling is decent, but some sizing (e.g., `frame={{ flex: 1 }}`) is not SwiftUI idiomatic and may not compile.
- TypeScript: uses interfaces, but some types are missing (e.g., `any` in children), and prop naming is inconsistent.

UX score: 5/10
- Visual hierarchy is muddled: hero numbers are not as prominent, and status/earnings are not clearly separated.
- Color semantics are inconsistent: AI and brainlift are not always using cyan/violet, and gold is not always for earnings.
- Glass card and ambient glow are present but lack the mesh depth and layering of the premium aesthetic.

Better:
1. Attempts to modularize GlassCard and StatusPill, which is good for maintainability.
2. Bar chart is present in the large widget and attempts to scale bars, which is better than some options.

Worse:
1. Ambient glow is too subtle and not layered; lacks the mesh/gradient effect.
2. Typography and spacing are off—hero numbers don't pop, and labels are not visually distinct.

Improvement:
- Refactor sizing to use only allowed SwiftUI/expo-widgets props; remove `frame={{ flex: 1 }}` and use explicit spacing/padding.

---

## Option C
CODE score: 6/10
- Only allowed primitives are used, but some prop usages (e.g., `frame={{ width: 20, height: h }}`) are not standard for expo-widgets.
- Widget constraint handling is basic; padding and spacing are not always consistent across sizes.
- TypeScript: lacks types/interfaces, and props are loosely handled.

UX score: 6/10
- Visual hierarchy is decent: hero number and status pill are clear, but bar chart and labels are cramped.
- Color semantics are mostly correct, but gold for earnings is not always prominent, and AI/brainlift are not visually distinct.
- Glass card and ambient glow are present but lack depth and polish; background mesh is too simple.

Better:
1. Bar chart is present in all sizes and scales bars to max hours.
2. Status pill is visually distinct and uses accent color.

Worse:
1. Lacks modularity—components are not reusable, leading to repeated code.
2. Ambient background is too basic and does not match the premium glass/mesh look.

Improvement:
- Refactor to extract GlassCard, StatusPill, and BarChart as reusable components, and enhance the ambient glow layering.

---

## Option D
CODE score: 4/10
- Uses only allowed primitives, but some props (`width`, `height` on Circle/Rectangle) are not valid in expo-widgets/SwiftUI.
- Widget constraint handling is weak; layout is rigid and may not adapt to different widget sizes.
- TypeScript: no types/interfaces; prop passing is inconsistent (`widgetData.size` instead of `widgetFamily`).

UX score: 4/10
- Visual hierarchy is weak: hero numbers and labels are not clearly separated; status pill is visually lost.
- Color semantics are inconsistent: gold for earnings is not always used, and AI/brainlift are not visually distinct.
- Glass card and ambient glow are present but look flat and lack mesh/glass layering.

Better:
1. Bar chart is present in the large widget and uses color mapping for today/future.
2. Status pill uses accent color and is present in all sizes.

Worse:
1. Ambient glow is not layered or positioned for mesh effect.
2. Typography and spacing are off; hero numbers and labels are not visually distinct.

Improvement:
- Use only allowed props for sizing (remove `width`, `height`), and refactor layout to use padding/spacing for better hierarchy.

---

## Option E
CODE score: 8/10
- Uses only allowed primitives, and all sizing/spacing is SwiftUI/expo-widgets compatible.
- Widget constraint handling is solid, with modular components and fallback data.
- TypeScript: strong use of types/interfaces, but some prop types are implicit (could be stricter).

UX score: 7/10
- Visual hierarchy is good: hero numbers, status pill, and bar chart are clear, but spacing is a bit tight.
- Color semantics are mostly correct: gold for earnings, cyan for AI, violet for brainlift, green for hours.
- Glass card and ambient glow are present, but the mesh effect is less pronounced than in Option A/F.

Better:
1. Modular, reusable components for GlassCard, StatusPill, MetricView, and BarChart.
2. Color mapping and font usage are mostly correct and consistent.

Worse:
1. Ambient glow is not as layered or visually rich as the best options.
2. Bar chart and metrics are a bit cramped in medium/large layouts.

Improvement:
- Increase spacing between major sections and add more layered ambient circles for a richer mesh/glass effect.

---

## Option F
CODE score: 9/10
- Strictly uses allowed primitives, with careful prop usage for expo-widgets.
- Widget constraint handling is excellent: layouts are responsive, and fallback/default data is robust.
- TypeScript: not strongly typed, but code is clean, modular, and readable.

UX score: 9/10
- Visual hierarchy is excellent: hero numbers, status pill, bar chart, and metrics are all clear and well-spaced.
- Color semantics are perfect: gold for earnings, cyan for AI, violet for brainlift, green for hours, etc.
- Glass card and ambient glow are layered and mesh-like, closely matching the premium app look.

Better:
1. AmbientBackground is highly layered, with multiple colored/blurred circles for a true mesh effect.
2. GlassCard and StatusPill are modular, with correct border, fill, and accent color handling.

Worse:
1. Some font sizes and weights could be tweaked for even closer Figma match.
2. SectionLabel font size is a bit small in some contexts.

Improvement:
- Slightly increase SectionLabel font size and weight for better legibility, especially in large widget.

---

## Option G
CODE score: 8/10
- Uses only allowed primitives, with modular components and clear color/font constants.
- Widget constraint handling is good, but some prop usages (`fill`, `frame`, `opacity`) may not be expo-widgets standard.
- TypeScript: strong typing for data, but some components lack explicit prop types.

UX score: 8/10
- Visual hierarchy is strong: hero numbers, status, and bar chart are all clear and well-spaced.
- Color semantics are mostly correct: gold for earnings, cyan for AI, violet for brainlift, green for hours.
- Glass card and ambient glow are present and layered, but not as rich or mesh-like as A/F.

Better:
1. Modular components for GlassCard, StatusBadge, and HoursBarChart.
2. Bar chart and metrics are well-spaced and visually clear.

Worse:
1. Ambient glow is good but not as rich/layered as Option A/F.
2. Some font sizes and weights could be tweaked for even closer Figma match.

Improvement:
- Add more ambient glow circles with varying colors and blurs for a richer mesh/glass effect.

---

# Summary Table

| Option | CODE | UX | Top Strength | Top Weakness | Actionable Improvement |
|--------|------|----|--------------|--------------|-----------------------|
| **A**  | 10   | 10 | Mesh/glass, color, modularity | Minor font tuning | Add gold glow behind earnings card |
| **B**  | 7    | 5  | Modular GlassCard/StatusPill | Weak mesh/visual hierarchy | Remove non-SwiftUI props, fix sizing |
| **C**  | 6    | 6  | Bar chart in all sizes | Not modular, flat mesh | Extract reusable components, layer glow |
| **D**  | 4    | 4  | Bar chart, status pill | Flat mesh, weak hierarchy | Remove invalid props, refactor layout |
| **E**  | 8    | 7  | Modular, color mapping | Flat mesh, cramped | Increase spacing, layer glow |
| **F**  | 9    | 9  | Mesh layering, modularity | Small section labels | Increase SectionLabel font size |
| **G**  | 8    | 8  | Modular, clear hierarchy | Mesh not as rich | Add more layered ambient glow |

---

**Option A is the clear winner for both code and UX, with Option F a close second.** Both deliver the premium mesh/glass look, correct color semantics, and robust modular code.
 Add TypeScript types |
| **G**  | 8    | 8  | Component abstraction, layout | Simple glow, color misses | More glow layers |

---

**Option A** is the clear winner for both CODE and UX, with Option F as a close second (especially if TypeScript is added). Both deliver the premium mesh/glass look, correct color semantics, and a robust, maintainable codebase.
