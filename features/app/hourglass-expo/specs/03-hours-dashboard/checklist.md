# Checklist: 03-hours-dashboard

## Phase 3.0 — Tests (Red Phase)

### FR1: Business Logic (hours.ts)

- [x] `test(FR1)`: calculateHours returns payments.paidHours when > 0
- [x] `test(FR1)`: calculateHours falls back to timesheet.totalHours when paidHours === 0
- [x] `test(FR1)`: calculateHours falls back to timesheet.hourWorked when totalHours absent
- [x] `test(FR1)`: calculateHours defaults total to 0 when both timesheet and payments null
- [x] `test(FR1)`: calculateHours uses payments.amount for weeklyEarnings when > 0
- [x] `test(FR1)`: calculateHours falls back to total * hourlyRate when payments.amount === 0
- [x] `test(FR1)`: calculateHours computes todayEarnings = today * hourlyRate
- [x] `test(FR1)`: calculateHours computes hoursRemaining = max(0, weeklyLimit - total)
- [x] `test(FR1)`: calculateHours computes overtimeHours = max(0, total - weeklyLimit)
- [x] `test(FR1)`: calculateHours finds today from stats array by YYYY-MM-DD match
- [x] `test(FR1)`: calculateHours returns today = 0 when today not in stats
- [x] `test(FR1)`: calculateHours returns daily = [] when stats absent
- [x] `test(FR1)`: calculateHours sets isToday=true on today's DailyEntry
- [x] `test(FR1)`: getSundayMidnightGMT returns Sunday 23:59:59 UTC of current week
- [x] `test(FR1)`: getSundayMidnightGMT correct when called on Monday (6 days ahead)
- [x] `test(FR1)`: getSundayMidnightGMT correct when called on Sunday (end of today)
- [x] `test(FR1)`: getSundayMidnightGMT time component is 23:59:59 UTC
- [x] `test(FR1)`: getUrgencyLevel returns 'none' for ms > 12h
- [x] `test(FR1)`: getUrgencyLevel returns 'low' at exactly 12h
- [x] `test(FR1)`: getUrgencyLevel returns 'low' for 3h–12h range
- [x] `test(FR1)`: getUrgencyLevel returns 'high' for 1h–3h range
- [x] `test(FR1)`: getUrgencyLevel returns 'critical' for 0–1h range
- [x] `test(FR1)`: getUrgencyLevel returns 'expired' for negative ms
- [x] `test(FR1)`: formatTimeRemaining returns "Xd Xh" for > 24h
- [x] `test(FR1)`: formatTimeRemaining returns "Xh Xm" for 1h–24h
- [x] `test(FR1)`: formatTimeRemaining returns "Xm" for < 1h
- [x] `test(FR1)`: formatTimeRemaining returns "Expired" for negative ms
- [x] `test(FR1)`: getWeekStartDate(true) uses Date.UTC arithmetic (not toISOString)
- [x] `test(FR1)`: getWeekStartDate(false) uses local date arithmetic
- [x] `test(FR1)`: getWeekStartDate returns Monday of current week

### FR2: API Layer

- [x] `test(FR2)`: fetchTimesheet calls strategy 1 (full params) first
- [x] `test(FR2)`: fetchTimesheet falls back to strategy 2 (no teamId) on empty response
- [x] `test(FR2)`: fetchTimesheet falls back to strategy 3 (minimal) on empty response
- [x] `test(FR2)`: fetchTimesheet returns first non-empty array response
- [x] `test(FR2)`: fetchTimesheet uses getWeekStartDate(true) for date param
- [x] `test(FR2)`: fetchTimesheet throws on 401/403
- [x] `test(FR2)`: fetchPayments calls correct endpoint with from/to UTC dates
- [x] `test(FR2)`: fetchPayments formats dates using Date.UTC (not toISOString)
- [x] `test(FR2)`: fetchPayments throws on 401/403

### FR3: React Query Hooks

- [x] `test(FR3)`: useTimesheet queryKey includes current week Monday date
- [x] `test(FR3)`: usePayments queryKey includes current week Monday date
- [x] `test(FR3)`: useHoursData returns isLoading=true when no data and queries pending
- [x] `test(FR3)`: useHoursData writes to AsyncStorage hours_cache on success
- [x] `test(FR3)`: useHoursData reads hours_cache from AsyncStorage on total failure
- [x] `test(FR3)`: useHoursData returns isStale=true when serving cached data
- [x] `test(FR3)`: useHoursData returns cachedAt populated when serving cached data
- [x] `test(FR3)`: useHoursData refetch() triggers both underlying queries

### FR4: UI Components

- [x] `test(FR4)`: StatCard renders label and value
- [x] `test(FR4)`: StatCard renders subtitle when provided
- [x] `test(FR4)`: StatCard omits subtitle when not provided
- [x] `test(FR4)`: DailyBarChart renders 7 columns (Mon–Sun)
- [x] `test(FR4)`: DailyBarChart shows day-letter labels
- [x] `test(FR4)`: DailyBarChart shows hours above each bar (or "–" for 0)
- [x] `test(FR4)`: DailyBarChart applies accent color to today's bar
- [x] `test(FR4)`: UrgencyBanner renders null when urgency is 'none'
- [x] `test(FR4)`: UrgencyBanner renders countdown string when urgency != 'none'
- [x] `test(FR4)`: UrgencyBanner applies yellow background for 'low'
- [x] `test(FR4)`: UrgencyBanner applies orange background for 'high'
- [x] `test(FR4)`: UrgencyBanner applies red background for 'critical' and 'expired'

### FR5: Dashboard Screen

- [x] `test(FR5)`: Screen shows ActivityIndicator when isLoading and no data
- [x] `test(FR5)`: Screen shows error message and Retry button when error and no data
- [x] `test(FR5)`: Screen shows "Cached:" label when isStale=true
- [x] `test(FR5)`: Screen shows overtime label when overtimeHours > 0
- [x] `test(FR5)`: Screen shows remaining hours label when overtimeHours === 0
- [x] `test(FR5)`: Screen shows QA badge when config.useQA=true
- [x] `test(FR5)`: Screen hides QA badge when config.useQA=false

---

## Phase 3.1 — Implementation

### FR1: Business Logic

- [x] `feat(FR1)`: Create `src/lib/hours.ts` with calculateHours (all fields per spec)
- [x] `feat(FR1)`: Implement getSundayMidnightGMT using UTC arithmetic
- [x] `feat(FR1)`: Implement getUrgencyLevel with 5 levels
- [x] `feat(FR1)`: Implement formatTimeRemaining (days/hours/minutes/expired)
- [x] `feat(FR1)`: Implement getWeekStartDate(useUTC) with correct UTC/local branches
- [x] `feat(FR1)`: Export HoursData, DailyEntry, UrgencyLevel, TimesheetResponse, PaymentsResponse types

### FR2: API Layer

- [x] `feat(FR2)`: Create `src/api/timesheet.ts` with fetchTimesheet (3-strategy fallback)
- [x] `feat(FR2)`: Create `src/api/payments.ts` with fetchPayments (UTC date arithmetic)
- [x] `feat(FR2)`: Both functions accept CrossoverConfig and throw on auth error

### FR3: React Query Hooks

- [x] `feat(FR3)`: Create `src/hooks/useTimesheet.ts` (staleTime 15min, week-keyed)
- [x] `feat(FR3)`: Create `src/hooks/usePayments.ts` (staleTime 15min, week-keyed)
- [x] `feat(FR3)`: Create `src/hooks/useHoursData.ts` (compose + cache failover + AsyncStorage write)

### FR4: UI Components

- [x] `feat(FR4)`: Create `src/components/StatCard.tsx`
- [x] `feat(FR4)`: Create `src/components/DailyBarChart.tsx` (7 bars, proportional heights, today accent)
- [x] `feat(FR4)`: Create `src/components/UrgencyBanner.tsx` (null on 'none', colored otherwise)

### FR5: Dashboard Screen

- [x] `feat(FR5)`: Create `app/(tabs)/index.tsx` with full screen layout
- [x] `feat(FR5)`: Implement loading, error, and cached states
- [x] `feat(FR5)`: Implement pull-to-refresh with RefreshControl
- [x] `feat(FR5)`: Implement overtime vs remaining status bar logic
- [x] `feat(FR5)`: Add QA badge conditional on config.useQA
- [x] `feat(FR5)`: Add useConfig guard with redirect to auth flow

---

## Phase 3.2 — Review

- [x] Run spec-implementation-alignment check
- [x] Run pr-review-toolkit:review-pr
- [x] Address all review feedback
- [x] Run test-optimiser
- [x] All tests passing (no skips, no todos)
- [x] Commit documentation updates (checklist + FEATURE.md)

---

## Session Notes

**2026-03-08**: Spec execution complete.
- Phase 3.0: 4 test commits (FR1, FR2+FR4 combined, FR4/FR5 pattern fix, FR5)
- Phase 3.1: 5 implementation commits (FR1 business logic, FR2 API layer, FR4 UI components, FR3 hooks, FR5 dashboard screen)
- Phase 3.2: Alignment check PASS, all tests passing, no optimization needed.
- 94 tests passing across FR1–FR5. 9 pre-existing failures from other specs unaffected.
