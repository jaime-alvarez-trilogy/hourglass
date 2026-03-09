# Implementation Checklist

Spec: `06-widgets`
Feature: `hourglass-expo`

---

## Phase 6.0: Test Foundation

### FR1: WidgetData Type and Bridge Core
- [x] Write tests: `updateWidgetData` builds correct `WidgetData` from `HoursData` + `AIWeekData`
- [x] Write tests: hours formatted as string with 1 decimal (`"32.5"`)
- [x] Write tests: earnings formatted with $ and comma (`"$1,300"`)
- [x] Write tests: `urgency` derived from `getUrgencyLevel(deadline - now)`
- [x] Write tests: `pendingCount` set to 0 when `config.isManager === false`
- [x] Write tests: `cachedAt` set to `Date.now()` on each call
- [x] Write tests: `AsyncStorage.setItem('widget_data', ...)` called with JSON string
- [x] Write tests: `aiPct: 'N/A'` and `brainlift: '0.0h'` when `aiData` is null

### FR2: iOS Timeline Entry Generation
- [x] Write tests: returns exactly `count` entries (default 60)
- [x] Write tests: first entry date >= `new Date()`
- [x] Write tests: each subsequent entry is `intervalMinutes` after previous (default 15)
- [x] Write tests: non-time-dependent fields identical across all entries
- [x] Write tests: `urgency` recomputed per entry as deadline approaches
- [x] Write tests: entries past deadline have `urgency: 'expired'`

### FR3: Android AsyncStorage Read
- [x] Write tests: returns `null` when key absent
- [x] Write tests: returns parsed `WidgetData` when key present and JSON valid
- [x] Write tests: returns `null` (no throw) when JSON is malformed
- [x] Write tests: returns `null` (no throw) when AsyncStorage.getItem throws

### FR5: Android Task Handler
- [x] Write tests: task handler calls `readWidgetData()` for `'HourglassWidget'` widget name
- [x] Write tests: renders fallback state when `readWidgetData()` returns null
- [x] Write tests: passes data to widget component when data is present

---

## Test Design Validation (MANDATORY)

> **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [x] Run `red-phase-test-validator` agent
- [x] All FR success criteria have test coverage
- [x] Assertions are specific (not just "exists" or "doesn't throw")
- [x] Mocks return realistic data matching interface contracts
- [x] Fix any issues identified before proceeding

---

## Phase 6.1: Implementation

### FR1: WidgetData Type and Bridge Core
- [x] Create `src/widgets/types.ts` — `WidgetData` interface with all fields
- [x] Create `src/widgets/bridge.ts` — implement `updateWidgetData(hoursData, aiData, pendingCount, config)`
- [x] Format hours: `hoursData.total.toFixed(1)`
- [x] Format earnings: `$` prefix + comma formatting
- [x] Derive `urgency` via imported `getUrgencyLevel()` from `src/lib/hours.ts`
- [x] Zero out `pendingCount` for non-managers
- [x] Set `cachedAt: Date.now()`
- [x] Write to `AsyncStorage` key `'widget_data'`
- [x] On iOS: call `buildTimelineEntries()` then `HourglassWidget.updateTimeline()`

### FR2: iOS Timeline Entry Generation
- [x] Implement `buildTimelineEntries(baseData, count = 60, intervalMinutes = 15)` in `bridge.ts`
- [x] Generate entries starting from `new Date()`
- [x] Increment each entry by `intervalMinutes * 60 * 1000`
- [x] Recompute `urgency` per entry: `getUrgencyLevel(baseData.deadline - entryDate.getTime())`
- [x] Recompute `hoursRemaining` string per entry (shows "0h left" past deadline)

### FR3: Android AsyncStorage Read
- [x] Implement `readWidgetData()` in `bridge.ts`
- [x] Wrap `AsyncStorage.getItem('widget_data')` in try/catch
- [x] Return `null` for missing key or parse failure
- [x] Return `JSON.parse(raw)` as `WidgetData` when successful

### FR4: iOS Widget Component
- [x] Create `src/widgets/ios/HourglassWidget.tsx`
- [x] Add `'widget'` directive at top of file
- [x] Implement small size: hours total + earnings + hours remaining
- [x] Implement medium size: hero hours + hero earnings + today + AI%
- [x] Implement large size: medium content + BrainLift
- [x] Add manager badge for `pendingCount > 0` when `isManager === true`
- [x] Add stale indicator when `Date.now() - cachedAt > 7200000`
- [x] Apply urgency color theming to background/accent
- [x] Export as default, register as `'HourglassWidget'`

### FR5: Android Widget Component and Task Handler
- [x] Create `src/widgets/android/widgetTaskHandler.ts`
- [x] Handle `widgetInfo.widgetName === 'HourglassWidget'`
- [x] Call `readWidgetData()` in task handler
- [x] Render fallback "Tap to refresh" when data is null
- [x] Create `src/widgets/android/HourglassWidget.tsx` using `FlexWidget` + `TextWidget`
- [x] Implement small size: hours + earnings + remaining
- [x] Implement medium size: hero hours + earnings + today + AI%
- [x] Add manager pending badge
- [x] Add stale indicator when `cachedAt` > 2h ago
- [x] Export task handler as default

### FR6: app.json Plugin Configuration
- [x] Add `expo-widgets` plugin entry to `app.json` plugins array
- [x] Configure iOS App Group identifier for widget data sharing
- [x] Add `react-native-android-widget` plugin entry with `HourglassWidget` in widgets array
- [x] Register `widgetTaskHandler` for Android background tasks
- [x] Verify existing Expo Router and EAS config is not broken

---

## Phase 6.2: Review (MANDATORY)

> **DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [x] Run `spec-implementation-alignment` agent
- [x] All FR success criteria verified in code
- [x] Interface contracts match implementation
- [x] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [x] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [x] Fix HIGH severity issues (critical)
- [x] Fix MEDIUM severity issues (or document why deferred)
- [x] Re-run tests after fixes
- [x] Commit fixes: `fix(06-widgets): add module declarations and fix test imports`

### Step 3: Test Quality Optimization
- [x] Run `test-optimiser` agent on modified tests
- [x] Apply suggested improvements that strengthen confidence
- [x] Re-run tests to confirm passing
- [x] Commit if changes made: `fix(06-widgets): strengthen test assertions`

### Final Verification
- [x] All tests passing (427 tests, 27 suites)
- [x] No regressions in existing tests
- [x] Code follows existing patterns

---

## Session Notes

**2026-03-08**: Spec created. 6 FRs: bridge core (FR1), iOS timeline entries (FR2), Android read (FR3), iOS widget component (FR4), Android widget + task handler (FR5), app.json config (FR6).

**2026-03-08**: Spec execution complete.
- Phase 6.0: 2 test commits (bridge.test.ts: FR1/FR2/FR3, widgetTaskHandler.test.ts: FR5)
- Phase 6.1: 1 implementation commit (types.ts, bridge.ts, iOS widget, Android widget, widgetTaskHandler, app.json)
- Phase 6.2: 1 fix commit (module declarations, static import fixes); alignment PASS; 427 tests passing
