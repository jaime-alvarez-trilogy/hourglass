# Checklist: 06-ai-tab

## Phase 6.0 — Tests (Red Phase)

### FR1: AIRingChart Integration
- [ ] test(FR1): AIRingChart rendered with correct aiPercent and brainliftPercent props
- [ ] test(FR1): MetricValue overlay centered on ring with text-cyan and unit="%"
- [ ] test(FR1): Inner ring not rendered when brainliftHours = 0 (brainliftPercent prop undefined or 0)
- [ ] test(FR1): Ring container has testID="ai-ring-container" and correct dimensions (160×160)

### FR2: Hero Metric Section
- [ ] test(FR2): AI% MetricValue rendered with value=aiPercent, colorClass="text-cyan", precision=0
- [ ] test(FR2): BrainLift MetricValue rendered with value=brainliftHours, colorClass="text-violet", unit="h"
- [ ] test(FR2): "/ 5h target" label rendered next to BrainLift MetricValue
- [ ] test(FR2): SectionLabel "AI USAGE" and "BRAINLIFT" both present
- [ ] test(FR2): No hardcoded hex colors in screen (static analysis check via source file read)

### FR3: BrainLift Progress Bar
- [ ] test(FR3): ProgressBar rendered with progress=brainliftHours/5
- [ ] test(FR3): ProgressBar colorClass="bg-violet" and height=6
- [ ] test(FR3): Subtext label "Xh / 5h target" shows correct brainliftHours value
- [ ] test(FR3): ProgressBar shows 0 fill when brainliftHours=0

### FR4: Delta Badge + useAIData extension
- [ ] test(FR4): previousWeekPercent is undefined when AsyncStorage has no value
- [ ] test(FR4): previousWeekPercent returns stored number when AsyncStorage has value
- [ ] test(FR4): On Monday, successful fetch writes aiPercent midpoint to AsyncStorage
- [ ] test(FR4): On non-Monday, successful fetch does NOT write to AsyncStorage
- [ ] test(FR4): Delta badge shown with testID="delta-badge" when previousWeekPercent is available
- [ ] test(FR4): Delta badge hidden when previousWeekPercent is undefined
- [ ] test(FR4): Positive delta shows "+" prefix with text-success
- [ ] test(FR4): Negative delta shows "-" prefix with text-error
- [ ] test(FR4): Zero delta shows "+0.0%" with text-textSecondary
- [ ] test(FR4): AsyncStorage read failure is caught silently (previousWeekPercent stays undefined)

### FR5: Daily Breakdown List (DailyAIRow)
- [ ] test(FR5): DailyAIRow renders without crash with valid DailyTagData
- [ ] test(FR5): DailyAIRow shows formatted date label
- [ ] test(FR5): DailyAIRow shows AI% for day (or "—" when taggedSlots=0)
- [ ] test(FR5): DailyAIRow today row has text-success class on date label
- [ ] test(FR5): No StyleSheet.create in DailyAIRow.tsx (static analysis)
- [ ] test(FR5): Daily breakdown card renders one DailyAIRow per breakdown item
- [ ] test(FR5): Column headers "Day", "AI%", "BrainLift" rendered

### FR6: Loading / Skeleton States
- [ ] test(FR6): skeleton-ring shown when isLoading=true and data=null
- [ ] test(FR6): skeleton-metrics shown when isLoading=true and data=null
- [ ] test(FR6): skeleton-breakdown shown when isLoading=true and data=null
- [ ] test(FR6): No skeletons when isLoading=true but data exists (background refresh)
- [ ] test(FR6): No skeletons when isLoading=false and data exists

### Error / Empty States
- [ ] test: Auth error state renders testID="error-auth" with re-login button
- [ ] test: Network error state renders testID="error-network" with retry button
- [ ] test: Empty state renders testID="empty-state" when data=null and isLoading=false

---

## Phase 6.1 — Implementation

### FR4a: useAIData hook extension
- [ ] feat(FR4): Add `previousWeekPercent?: number` to `UseAIDataResult` interface
- [ ] feat(FR4): Add `useState<number | undefined>` for previousWeekPercent
- [ ] feat(FR4): Add mount-time `useEffect` reading `AsyncStorage.getItem('previousWeekAIPercent')`
- [ ] feat(FR4): Add Monday write logic in fetchData after successful aggregation
- [ ] feat(FR4): Include `previousWeekPercent` in return value

### FR1 + FR2 + FR3 + FR6: ai.tsx rebuild
- [ ] feat(FR1): Replace AIProgressBar with AIRingChart in ai.tsx
- [ ] feat(FR1): Add RING_SIZE = 160 constant; ring container with relative positioning
- [ ] feat(FR1): Add MetricValue overlay (absolute center) for AI%
- [ ] feat(FR2): Replace hardcoded text with MetricValue components (cyan / violet)
- [ ] feat(FR2): Add SectionLabel for "AI USAGE" and "BRAINLIFT"
- [ ] feat(FR2): Remove all StyleSheet.create() from ai.tsx
- [ ] feat(FR3): Replace AIProgressBar (BrainLift) with ProgressBar colorClass="bg-violet"
- [ ] feat(FR3): Add subtext label for BrainLift hours / target
- [ ] feat(FR4): Add delta badge rendering logic (conditional on previousWeekPercent)
- [ ] feat(FR6): Add skeleton layout (ring + metrics + breakdown + progress bar) for isLoading+data=null
- [ ] feat: Migrate error state and empty state to className (no hardcoded hex)
- [ ] feat: Wrap cards in Card component; add Card for legend section

### FR5: DailyAIRow refactor
- [ ] feat(FR5): Remove StyleSheet.create() from DailyAIRow.tsx
- [ ] feat(FR5): Replace all StyleSheet references with className equivalents
- [ ] feat(FR5): Verify DailyAIRow props interface unchanged

---

## Phase 6.2 — Review

- [ ] Run full test suite: `cd hourglassws && npx jest src/components/__tests__/AITab.test.tsx src/hooks/__tests__/useAIData.test.ts --no-coverage`
- [ ] spec-implementation-alignment: verify all FR success criteria met
- [ ] pr-review-toolkit:review-pr — address any issues
- [ ] test-optimiser: review test quality and coverage
- [ ] Confirm no hardcoded hex colors remain in ai.tsx or DailyAIRow.tsx
- [ ] Confirm no StyleSheet.create() remains in ai.tsx or DailyAIRow.tsx
