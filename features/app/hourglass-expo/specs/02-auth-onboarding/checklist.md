# Implementation Checklist

Spec: `02-auth-onboarding`
Feature: `hourglass-expo`

---

## Phase 2.0: Test Foundation

### FR5: fetchAndBuildConfig — ID Extraction
- [ ] Write test: extracts `userId` from `userAvatars[CANDIDATE].id` path
- [ ] Write test: falls back to nested `assignment.selection.marketplaceMember.application.candidate.id` when `userAvatars` absent
- [ ] Write test: falls back to `'0'` when both paths absent
- [ ] Write test: sets `isManager: true` when `avatarTypes` includes `'MANAGER'`
- [ ] Write test: sets `isManager: false` when `avatarTypes` does not include `'MANAGER'`
- [ ] Write test: extracts `assignmentId` as string from `detail.assignment.id`
- [ ] Write test: extracts `managerId` as string from `detail.assignment.manager.id`
- [ ] Write test: extracts `primaryTeamId` as string from `detail.assignment.team.id`
- [ ] Write test: uses `assignment.salary` for `hourlyRate`
- [ ] Write test: defaults `weeklyLimit` to `40` when absent from response
- [ ] Write test: builds `teams` array with `id`, `name`, `company: ''`

### FR5: fetchAndBuildConfig — Happy Path
- [ ] Write test: calls `getAuthToken` with the provided username and password
- [ ] Write test: calls `apiGet` for detail endpoint with returned token
- [ ] Write test: calls payments endpoint with 3-month date range (local `YYYY-MM-DD`, not ISO)
- [ ] Write test: returns `CrossoverConfig` with `setupComplete: false`
- [ ] Write test: returned config has no `undefined` fields

### FR5: fetchAndBuildConfig — Error Cases
- [ ] Write test: throws `AuthError` when `getAuthToken` throws `AuthError(401)`
- [ ] Write test: throws `AuthError` when `getAuthToken` throws `AuthError(403)`
- [ ] Write test: throws `NetworkError` when `getAuthToken` throws `NetworkError`
- [ ] Write test: sets `hourlyRate: 0` when payments call fails (does not throw)
- [ ] Write test: sets `hourlyRate: 0` when payments call returns empty array

### FR8: useSetup Hook
- [ ] Write test: initial state — `step = 'welcome'`, `isLoading = false`, `error = null`
- [ ] Write test: `setEnvironment(true)` updates env flag without changing step
- [ ] Write test: `submitCredentials` transitions `step` to `'verifying'` synchronously
- [ ] Write test: `submitCredentials` sets `isLoading = true` before async work
- [ ] Write test: on success with rate, `step` transitions to `'success'`
- [ ] Write test: on success without rate (`hourlyRate === 0`), `step` transitions to `'setup'`
- [ ] Write test: on `AuthError`, `step` reverts to `'credentials'` and `error` is set
- [ ] Write test: on `NetworkError`, `step` reverts to `'credentials'` and `error` is set
- [ ] Write test: `submitCredentials` while `isLoading = true` is a no-op
- [ ] Write test: `error` is reset to `null` at start of new submission
- [ ] Write test: `submitRate(50)` merges rate into config and transitions to `'success'`

### FR9: useConfig Hook
- [ ] Write test: returns `{ config: null, isLoading: false }` when AsyncStorage is empty
- [ ] Write test: returns populated config when AsyncStorage has valid JSON
- [ ] Write test: returns `null` (no throw) when AsyncStorage has invalid JSON
- [ ] Write test: `refetch()` triggers a fresh AsyncStorage read

### FR10: useRoleRefresh Hook
- [ ] Write test: does NOT call detail endpoint when today is not Monday
- [ ] Write test: does NOT call detail endpoint when `lastRoleCheck` was <7 days ago
- [ ] Write test: calls detail endpoint when it IS Monday AND `lastRoleCheck` is >7 days ago
- [ ] Write test: treats absent `lastRoleCheck` as overdue (triggers refresh on Monday)
- [ ] Write test: updates `isManager`, `hourlyRate`, `weeklyLimit`, `lastRoleCheck` in config on success
- [ ] Write test: silently swallows errors (does not update `lastRoleCheck` on failure)
- [ ] Write test: does not start a second request if one is already in flight

### FR2: Welcome Screen
- [ ] Write test: renders "Production" and "QA" toggle options
- [ ] Write test: "Production" is selected by default
- [ ] Write test: selecting "QA" calls `setEnvironment(true)`
- [ ] Write test: selecting "Production" calls `setEnvironment(false)`
- [ ] Write test: tapping "Get Started" navigates to `/(auth)/credentials`
- [ ] Write test: no email, password, or token input fields present

### FR3: Credentials Screen
- [ ] Write test: email input has `keyboardType="email-address"` and `autoCapitalize="none"`
- [ ] Write test: password input has `secureTextEntry`
- [ ] Write test: empty email field → shows "Email is required", does not call `submitCredentials`
- [ ] Write test: empty password field → shows "Password is required", does not call `submitCredentials`
- [ ] Write test: both fields filled → tapping "Sign In" calls `submitCredentials(email, password)`
- [ ] Write test: while `isLoading`: submit button is disabled
- [ ] Write test: when `error` non-null: error string is displayed in visible component

### FR4: Verifying Screen
- [ ] Write test: renders `ActivityIndicator` and "Verifying your account…" label
- [ ] Write test: no interactive controls present
- [ ] Write test: back gesture is disabled (`gestureEnabled: false`)
- [ ] Write test: when `step` changes to `'success'`, navigates to `/(auth)/success`
- [ ] Write test: when `step` changes to `'setup'`, navigates to `/(auth)/setup`
- [ ] Write test: when `step` changes to `'credentials'`, navigates to `/(auth)/credentials`

### FR6: Setup Screen
- [ ] Write test: renders numeric input with `keyboardType="decimal-pad"`
- [ ] Write test: empty input shows inline validation error; `submitRate` not called
- [ ] Write test: zero input shows inline validation error; `submitRate` not called
- [ ] Write test: positive number → tapping "Continue" calls `submitRate(rate)`
- [ ] Write test: while `isLoading`: button is disabled
- [ ] Write test: when `error` non-null: error string is displayed on screen

### FR7: Success Screen
- [ ] Write test: displays `config.fullName` as primary heading
- [ ] Write test: shows "Contributor" when `isManager === false`
- [ ] Write test: shows "Manager" when `isManager === true`
- [ ] Write test: displays hourly rate formatted as `$N / hr`
- [ ] Write test: tapping "Go to Dashboard" calls `saveCredentials`
- [ ] Write test: tapping "Go to Dashboard" calls `saveConfig` with `setupComplete: true`
- [ ] Write test: navigates to `/(tabs)` only after both writes succeed
- [ ] Write test: shows error message when storage write fails
- [ ] Write test: button is disabled while writes are in progress

### FR1: Auth Gate (integration)
- [ ] Write test: `useConfig` returns `null` → auth gate renders loading state
- [ ] Write test: `setupComplete: false` → layout redirects to `/(auth)/welcome`
- [ ] Write test: `setupComplete: true` → layout proceeds to tabs (no redirect)

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts (DetailResponse shape)
- [ ] Date handling tests verify local `YYYY-MM-DD` format (not `toISOString()`)
- [ ] Fix any issues identified before proceeding

---

## Phase 2.1: Implementation

### FR5 + src/api/auth.ts
- [ ] Create `src/api/auth.ts`
- [ ] Implement `getProfileDetail(token, useQA)` — `GET /api/identity/users/current/detail`
- [ ] Implement `extractConfigFromDetail(detail)` — userId two-path fallback, all field extraction
- [ ] Implement `fetchAndBuildConfig(username, password, useQA)` — full pipeline
- [ ] Payments date formatting: use local `YYYY-MM-DD` (not `toISOString()`)
- [ ] Payments failure caught in `try/catch`; falls back to `detail.assignment.salary ?? 0`
- [ ] `setupComplete: false` in returned config (caller sets `true` when persisting)

### FR9: src/hooks/useConfig.ts
- [ ] Create `src/hooks/useConfig.ts`
- [ ] React Query wrapper around `loadConfig()`; query key `['config']`
- [ ] `staleTime: Infinity`
- [ ] Returns `{ config, isLoading, refetch }`

### FR8: src/hooks/useAuth.ts
- [ ] Create `src/hooks/useAuth.ts`
- [ ] `useSetup` hook: all state in `useState` (step, env flag, pending config, isLoading, error)
- [ ] `setEnvironment`: synchronous, no step change
- [ ] `submitCredentials`: guard for in-flight (`isLoading`), sets step to `'verifying'` synchronously, then async
- [ ] Success routing: `hourlyRate === 0` → `'setup'`; else → `'success'`
- [ ] Error routing: `AuthError`/`NetworkError` → `'credentials'`, set `error`
- [ ] `submitRate`: merges rate into pending config, transitions to `'success'`
- [ ] Hook does NOT navigate — screens observe `step`

### FR10: src/hooks/useRoleRefresh.ts
- [ ] Create `src/hooks/useRoleRefresh.ts`
- [ ] Subscribe to `AppState` `change` events
- [ ] Guard: `new Date().getDay() === 1` (Monday in local time)
- [ ] Guard: `Date.now() - new Date(lastRoleCheck).getTime() > 7 * 24 * 60 * 60 * 1000`
- [ ] Load credentials from SecureStore; exit if missing
- [ ] Call `getProfileDetail`; patch config fields via `saveConfig`
- [ ] Call `queryClient.invalidateQueries(['config'])` after write
- [ ] Swallow errors silently; do NOT update `lastRoleCheck` on failure
- [ ] In-flight guard: one request at a time

### FR1 + app/_layout.tsx (auth gate)
- [ ] Add `useConfig()` call in `RootLayout`
- [ ] Add `useRoleRefresh()` call in `RootLayout`
- [ ] `SplashScreen.preventAutoHideAsync()` on mount; hide once `isLoading` resolves
- [ ] While `isLoading`: render `<ActivityIndicator>` (no Stack, no redirect)
- [ ] `!config || !config.setupComplete` → `<Redirect href="/(auth)/welcome" />`
- [ ] `setupComplete: true` → render `<Stack>` normally

### FR2: app/(auth)/_layout.tsx + welcome.tsx
- [ ] Create `app/(auth)/_layout.tsx` — Stack navigator for auth group
- [ ] Create `app/(auth)/welcome.tsx`
- [ ] Environment toggle: "Production" (default) / "QA"
- [ ] Toggle calls `setEnvironment(false)` / `setEnvironment(true)`
- [ ] "Get Started" button: advance step, push to `/(auth)/credentials`
- [ ] No credential fields on screen

### FR3: app/(auth)/credentials.tsx
- [ ] Create `app/(auth)/credentials.tsx`
- [ ] Email input: `keyboardType="email-address"`, `autoCapitalize="none"`
- [ ] Password input: `secureTextEntry`
- [ ] Inline validation: empty field → show "Email is required" / "Password is required"
- [ ] Empty validation prevents `submitCredentials` call
- [ ] While `isLoading`: button disabled + loading state; fields visible
- [ ] When `error` non-null: display error string in visible component
- [ ] Form remains editable after error

### FR4: app/(auth)/verifying.tsx
- [ ] Create `app/(auth)/verifying.tsx`
- [ ] Centered `ActivityIndicator` + label "Verifying your account…"
- [ ] No interactive controls
- [ ] Back gesture disabled (`gestureEnabled: false` in layout)
- [ ] `useEffect` on `step`: when step leaves `'verifying'`, navigate accordingly
  - `'success'` → `router.replace('/(auth)/success')`
  - `'setup'` → `router.replace('/(auth)/setup')`
  - `'credentials'` → `router.replace('/(auth)/credentials')`

### FR6: app/(auth)/setup.tsx
- [ ] Create `app/(auth)/setup.tsx`
- [ ] Numeric input: `keyboardType="decimal-pad"`, labeled as hourly rate
- [ ] Validation: empty or zero → show inline error, prevent `submitRate` call
- [ ] "Continue" calls `submitRate(rate)` with parsed number
- [ ] Button disabled while `isLoading`
- [ ] If `error` non-null: display on screen
- [ ] No API calls on this screen

### FR7: app/(auth)/success.tsx
- [ ] Create `app/(auth)/success.tsx`
- [ ] Display `fullName` as heading
- [ ] Display "Contributor" / "Manager" based on `isManager`
- [ ] Display hourly rate formatted as `$N / hr`
- [ ] "Go to Dashboard": calls `saveCredentials`, then `saveConfig({ ...config, setupComplete: true })`
- [ ] Both writes must succeed before navigating to `/(tabs)`
- [ ] On write failure: show error, button returns to default state
- [ ] Button disabled while writes in progress

---

## Phase 2.2: Review (MANDATORY)

⚠️ **DO NOT skip this phase.** All four steps are mandatory.

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation
- [ ] Fix any HIGH issues before continuing

### Step 1: Comprehensive PR Review
- [ ] Run `review-pr` skill (launches specialized review agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(02-auth-onboarding): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(02-auth-onboarding): strengthen test assertions`

### Step 4: Simulator Smoke Test
- [ ] Run `npx expo start --port 8082` and launch on iOS Simulator
- [ ] App launches without crash (no red screen)
- [ ] Auth gate redirects to Welcome screen (no `setupComplete` in AsyncStorage)
- [ ] Welcome screen renders with Production/QA toggle
- [ ] Tap "Get Started" navigates to Credentials screen
- [ ] Credentials screen shows email + password inputs
- [ ] Tap "Sign In" with empty fields shows validation errors
- [ ] Capture screenshots at each step

### Final Verification
- [ ] All tests passing (`npx jest`)
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No regressions in 01-foundation tests (54 tests still pass)

---

## Session Notes

**2026-03-08**: Spec created. Coherence check PASSED.
