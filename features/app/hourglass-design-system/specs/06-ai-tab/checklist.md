# Checklist: 06-ai-tab

## Phase 6.0 — Tests (Red Phase)

### FR1: AIRingChart Integration
- [x] test(FR1): AIRingChart rendered with correct aiPercent and brainliftPercent props
- [x] test(FR1): MetricValue overlay centered on ring with text-cyan and unit="%"
- [x] test(FR1): Inner ring not rendered when brainliftHours = 0 (brainliftPercent prop undefined or 0)
- [x] test(FR1): Ring container has testID="ai-ring-container" and correct dimensions (160×160)

### FR2: Hero Metric Section
- [x] test(FR2): AI% MetricValue rendered with value=aiPercent, colorClass="text-cyan", precision=0
- [x] test(FR2): BrainLift MetricValue rendered with value=brainliftHours, colorClass="text-violet", unit="h"
- [x] test(FR2): "/ 5h target" label rendered next to BrainLift MetricValue
- [x] test(FR2): SectionLabel "AI USAGE" and "BRAINLIFT" both present
- [x] test(FR2): No hardcoded hex colors in screen (static analysis check via source file read)

### FR3: BrainLift Progress Bar
- [x] test(FR3): ProgressBar rendered with progress=brainliftHours/5
- [x] test(FR3): ProgressBar colorClass="bg-violet" and height=6
- [x] test(FR3): Subtext label "Xh / 5h target" shows correct brainliftHours value
- [x] test(FR3): ProgressBar shows 0 fill when brainliftHours=0

### FR4: Delta Badge + useAIData extension
- [x] test(FR4): previousWeekPercent is undefined when AsyncStorage has no value
- [x] test(FR4): previousWeekPercent returns stored number when AsyncStorage has value
- [x] test(FR4): On Monday, successful fetch writes aiPercent midpoint to AsyncStorage
- [x] test(FR4): On non-Monday, successful fetch does NOT write to AsyncStorage
- [x] test(FR4): Delta badge shown with testID="delta-badge" when previousWeekPercent is available
- [x] test(FR4): Delta badge hidden when previousWeekPercent is undefined
- [x] test(FR4): Positive delta shows "+" prefix with text-success
- [x] test(FR4): Negative delta shows "-" prefix with text-error
- [x] test(FR4): Zero delta shows "+0.0%" with text-textSecondary
- [x] test(FR4): AsyncStorage read failure is caught silently (previousWeekPercent stays undefined)

### FR5: Daily Breakdown List (DailyAIRow)
- [x] test(FR5): DailyAIRow renders without crash with valid DailyTagData
- [x] test(FR5): DailyAIRow shows formatted date label
- [x] test(FR5): DailyAIRow shows AI% for day (or "—" when taggedSlots=0)
- [x] test(FR5): DailyAIRow today row has text-success class on date label
- [x] test(FR5): No StyleSheet.create in DailyAIRow.tsx (static analysis)
- [x] test(FR5): Daily breakdown card renders one DailyAIRow per breakdown item
- [x] test(FR5): Column headers "Day", "AI%", "BrainLift" rendered

### FR6: Loading / Skeleton States
- [x] test(FR6): skeleton-ring shown when isLoading=true and data=null
- [x] test(FR6): skeleton-metrics shown when isLoading=true and data=null
- [x] test(FR6): skeleton-breakdown shown when isLoading=true and data=null
- [x] test(FR6): No skeletons when isLoading=true but data exists (background refresh)
- [x] test(FR6): No skeletons when isLoading=false and data exists

### Error / Empty States
- [x] test: Auth error state renders testID="error-auth" with re-login button
- [x] test: Network error state renders testID="error-network" with retry button
- [x] test: Empty state renders testID="empty-state" when data=null and isLoading=false

---

## Phase 6.1 — Implementation

### FR4a: useAIData hook extension
- [x] feat(FR4): Add `previousWeekPercent?: number` to `UseAIDataResult` interface
- [x] feat(FR4): Add `useState<number | undefined>` for previousWeekPercent
- [x] feat(FR4): Add mount-time `useEffect` reading `AsyncStorage.getItem('previousWeekAIPercent')`
- [x] feat(FR4): Add Monday write logic in fetchData after successful aggregation
- [x] feat(FR4): Include `previousWeekPercent` in return value

### FR1 + FR2 + FR3 + FR6: ai.tsx rebuild
- [x] feat(FR1): Replace AIProgressBar with AIRingChart in ai.tsx
- [x] feat(FR1): Add RING_SIZE = 160 constant; ring container with relative positioning
- [x] feat(FR1): Add MetricValue overlay (absolute center) for AI%
- [x] feat(FR2): Replace hardcoded text with MetricValue components (cyan / violet)
- [x] feat(FR2): Add SectionLabel for "AI USAGE" and "BRAINLIFT"
- [x] feat(FR2): Remove all StyleSheet.create() from ai.tsx
- [x] feat(FR3): Replace AIProgressBar (BrainLift) with ProgressBar colorClass="bg-violet"
- [x] feat(FR3): Add subtext label for BrainLift hours / target
- [x] feat(FR4): Add delta badge rendering logic (conditional on previousWeekPercent)
- [x] feat(FR6): Add skeleton layout (ring + metrics + breakdown + progress bar) for isLoading+data=null
- [x] feat: Migrate error state and empty state to className (no hardcoded hex)
- [x] feat: Wrap cards in Card component; add Card for legend section

### FR5: DailyAIRow refactor
- [x] feat(FR5): Remove StyleSheet.create() from DailyAIRow.tsx
- [x] feat(FR5): Replace all StyleSheet references with className equivalents
- [x] feat(FR5): Verify DailyAIRow props interface unchanged

---

## Phase 6.2 — Review

- [x] Run full test suite: 73/73 passing
- [x] spec-implementation-alignment: all FR success criteria met
- [x] pr-review-toolkit:review-pr — 3 issues found and fixed
- [x] test-optimiser: tests provide genuine confidence, PASS
- [x] Confirm no hardcoded hex colors remain in ai.tsx or DailyAIRow.tsx
- [x] Confirm no StyleSheet.create() remains in ai.tsx or DailyAIRow.tsx

---

## Session Notes

**2026-03-14**: Implementation complete.
- Phase 6.0: 1 test commit (AITab.test.tsx + useAIData.test.ts, 73 tests)
- Phase 6.1: 3 implementation commits (feat FR4 hook, feat FR5 DailyAIRow, feat FR1-FR3/FR4b/FR6 ai.tsx rebuild)
- Phase 6.2: Review passed, 1 fix commit (delta guard + Monday write guard + contentContainerStyle extract)
- All 73 tests passing. No regressions in pre-existing test suites.
