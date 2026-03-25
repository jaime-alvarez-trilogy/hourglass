# Checklist: 01-widget-polish

## Phase 1.0 — Tests (Red Phase)

### FR1: Small Widget Content Triage

- [x] test(FR1): iOS SmallWidget — assert `$` earnings string absent from rendered output
- [x] test(FR1): iOS SmallWidget — assert `h left` / `h OT` hoursRemaining absent from rendered output
- [x] test(FR1): iOS SmallWidget — assert `hoursDisplay` value (e.g. `32.5h`) present in rendered output
- [x] test(FR1): iOS SmallWidget paceBadge='on_track' — assert pace label text present
- [x] test(FR1): iOS SmallWidget paceBadge='none' — assert no pace label text
- [x] test(FR1): iOS SmallWidget isManager=true, pendingCount=2 — assert manager badge present
- [x] test(FR1): iOS SmallWidget stale=true — assert stale indicator present
- [x] test(FR1): Android SmallWidget — assert earnings string absent
- [x] test(FR1): Android SmallWidget — assert hoursRemaining string absent
- [x] test(FR1): Android SmallWidget — assert hoursDisplay present

### FR2: iOS Large Padding

- [x] test(FR2): iOS LargeWidget — assert outer VStack padding prop equals 16 (not 14)

### FR3: Android SVG Background Replacement

- [x] test(FR3): `buildMeshSvg()` — assert contains `<linearGradient`
- [x] test(FR3): `buildMeshSvg()` — assert does NOT contain `<ellipse`
- [x] test(FR3): `buildMeshSvg()` — assert does NOT contain `<radialGradient`
- [x] test(FR3): `buildMeshSvg()` — assert state color hex present in output
- [x] test(FR3): urgency='critical' — assert `#F43F5E` in output
- [x] test(FR3): urgency='none', paceBadge='on_track' — assert `#10B981` in output
- [x] test(FR3): urgency='none', paceBadge='none' — assert `#A78BFA` in output
- [x] test(FR3): assert SVG dimensions 360×200 preserved

### FR4: `todayDelta` Data Field

- [x] test(FR4): `computeTodayDelta(6.2, 5.0)` === `'+1.2h'`
- [x] test(FR4): `computeTodayDelta(3.8, 5.0)` === `'-1.2h'`
- [x] test(FR4): `computeTodayDelta(5.0, 5.0)` === `'+0.0h'`
- [x] test(FR4): `computeTodayDelta(6.2, 0)` === `''`
- [x] test(FR4): `computeTodayDelta(0, 0)` === `''`
- [x] test(FR4): `buildWidgetData()` result includes `todayDelta` field
- [x] test(FR4): today > average → todayDelta starts with `"+"`
- [x] test(FR4): today < average → todayDelta starts with `"-"`
- [x] test(FR4): null-guard return includes `todayDelta: ''`
- [x] test(FR4): iOS LargeWidget source — hoursRemaining NOT used on Today row right side
- [x] test(FR4): iOS LargeWidget — todayDelta rendered when non-empty
- [x] test(FR4): iOS LargeWidget — right element absent when todayDelta === ''

### FR5: Progress Bar Height and Labels

- [x] test(FR5): `blProgressBar(3, 5, 120)` SVG contains `height="8"`
- [x] test(FR5): `blProgressBar(3, 5, 120)` SVG does NOT contain `height="6"`
- [x] test(FR5): Android MediumWidget Hours mode — contains text `"BrainLift"`
- [x] test(FR5): Android MediumWidget Hours mode — does NOT contain standalone label `"BL"`
- [x] test(FR5): Android MediumWidget Hours mode — stats row contains `"AI Usage:"`

---

## Phase 1.1 — Implementation

### FR1: Small Widget Content Triage

- [x] feat(FR1): `types.ts` — add `todayDelta: string` to `WidgetData` interface (prerequisite for FR4, but needed here to keep types consistent)
- [x] feat(FR1): iOS `HourglassWidget.tsx` SmallWidget — remove earnings `<Text>` element
- [x] feat(FR1): iOS `HourglassWidget.tsx` SmallWidget — remove hoursRemaining `<Text>` element
- [x] feat(FR1): iOS `HourglassWidget.tsx` — add `PACE_LABELS` constant near `URGENCY_COLORS`
- [x] feat(FR1): iOS `HourglassWidget.tsx` SmallWidget — add conditional pace status `<Text>` element
- [x] feat(FR1): Android `HourglassWidget.tsx` SmallWidget — remove earnings `TextWidget`
- [x] feat(FR1): Android `HourglassWidget.tsx` SmallWidget — remove hoursRemaining `TextWidget`

### FR2: iOS Large Padding

- [x] feat(FR2): iOS `HourglassWidget.tsx` LargeWidget — change `padding={14}` to `padding={16}`

### FR3: Android SVG Background Replacement

- [x] feat(FR3): Android `HourglassWidget.tsx` — replace `buildMeshSvg()` body with linearGradient + rect implementation

### FR4: `todayDelta` Data Field

- [x] feat(FR4): `bridge.ts` — add exported `computeTodayDelta(today, average)` helper
- [x] feat(FR4): `bridge.ts` — add `todayDelta: ''` to `buildWidgetData()` null-guard return
- [x] feat(FR4): `bridge.ts` — add `todayDelta: computeTodayDelta(hoursData.today, hoursData.average)` to main return
- [x] feat(FR4): iOS `HourglassWidget.tsx` LargeWidget — replace `hoursRemaining` with conditional `todayDelta` on Today row right side

### FR5: Progress Bar Height and Labels

- [x] feat(FR5): Android `HourglassWidget.tsx` — update `blProgressBar()` SVG height from 6 to 8
- [x] feat(FR5): Android `HourglassWidget.tsx` MediumWidget Hours mode — change `"BL"` label to `"BrainLift"`
- [x] feat(FR5): Android `HourglassWidget.tsx` MediumWidget Hours mode — change `SvgWidget` height style from 6 to 8
- [x] feat(FR5): Android `HourglassWidget.tsx` MediumWidget Hours mode — change `"AI:"` label to `"AI Usage:"`

---

## Phase 1.2 — Review

- [x] Run full test suite: 321/322 passing (1 pre-existing bridge.test.ts failure unrelated to this spec)
- [x] spec-implementation-alignment: all 25 success criteria verified manually — PASS
- [x] pr-review-toolkit:review-pr: N/A (no PR created; changes committed to main)
- [x] Address any review feedback: no issues found
- [x] test-optimiser: tests use source-read strategy appropriate for widget context; 36 tests covering all SCs

---

## Session Notes

**2026-03-25**: Spec execution complete.
- Phase 1.0: 1 test commit (36 tests, all red initially)
- Phase 1.1: 1 implementation commit (all 36 tests green; 6 pre-existing android tests updated to reflect new behavior)
- Phase 1.2: Alignment check passed; 321/322 widget tests passing (1 pre-existing bridge.test failure unrelated to spec)
- Pre-existing failure: `bridge.test.ts` "no pending items → actionBg === null" — existed before this spec; `deriveActionBg()` returns `""` not `null` when no items.
