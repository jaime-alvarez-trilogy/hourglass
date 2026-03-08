# 02-auth-onboarding

**Status:** Draft
**Created:** 2026-03-08
**Last Updated:** 2026-03-08
**Owner:** @trilogy

---

## Overview

### What Is Being Built

This spec covers the onboarding and authentication system for the Hourglass Expo app. It delivers a five-screen onboarding flow — Welcome → Credentials → Verifying → Setup → Success — plus an auth gate in the root layout and a background role refresh hook.

The **Welcome** screen lets the user choose their environment (Production or QA) and presents a "Get Started" call to action. **Credentials** collects email and password with inline form validation and per-field error messaging. **Verifying** is a non-interactive loading screen that runs while the app authenticates and fetches the user's full profile. **Setup** is a conditional fallback screen shown only when hourly rate auto-detection fails, presenting a manual entry form. **Success** displays a summary of the resolved configuration — name, role, team, and rate — confirming the user is ready to use the app.

Beyond the screens, the spec defines:

- An **auth gate** in `app/_layout.tsx` that reads `setupComplete` from persisted config and redirects unauthenticated users to `/(auth)/welcome` before they can reach the main tab navigator.
- A `useSetup` **hook** that owns the step-by-step orchestration: environment selection, credential submission, profile fetch, ID extraction, config assembly, and storage writes.
- A `useRoleRefresh` **hook** that silently re-checks the user's role on Monday mornings when the last role check is more than seven days old, keeping the `isManager` flag current without user intervention.

### Why It Exists

The Scriptable widget handled onboarding entirely through blocking native alert dialogs — sequential `await Alert.presentAlert()` calls that could not validate input, could not show loading state between steps, and had no per-step error recovery. If authentication failed, the user saw a raw error string with no path forward.

The Expo app needs a first-class onboarding experience: dedicated screens with keyboard-aware scroll views, real-time input validation, spinner states during network calls, and actionable error messages ("Invalid email or password — try again" rather than a raw HTTP status). It also needs to survive interruption — if the user backgrounds the app mid-onboarding, they return to the same step rather than starting over.

The auth gate replaces the Scriptable pattern of checking config at widget render time with an explicit redirect so unauthenticated users always land on the correct screen regardless of how the app was launched.

### How It Works at Runtime

**Initial launch (unauthenticated):**

1. `app/_layout.tsx` mounts and calls `useConfig()` to load config from AsyncStorage.
2. While loading, a splash/loading state is shown (no redirect yet).
3. Once config resolves, the layout checks `config.setupComplete`. If absent or `false`, Expo Router's `<Redirect>` pushes the user to `/(auth)/welcome`.

**Onboarding step flow:**

1. Welcome screen: user selects environment. `useSetup().setEnvironment(useQA)` stores the choice in hook state.
2. Credentials screen: user enters email and password. On submit, `useSetup().submitCredentials(username, password)` is called.
3. Navigation to Verifying screen happens immediately before the async call resolves.
4. Inside `submitCredentials`, `fetchAndBuildConfig(username, password, useQA)` runs:
   - `getAuthToken` → `POST /api/v3/token` with Basic auth
   - `GET /api/identity/users/current/detail` — returns `fullName`, `avatarTypes`, `assignment` with all IDs
   - `userId` extracted from `userAvatars[CANDIDATE].id` with fallback to nested `candidate.id`
   - `isManager` set from `avatarTypes.includes('MANAGER')`
   - `GET /api/v3/users/current/payments` attempted for rate detection; falls back to `assignment.salary` or 0
5. On success: credentials saved to SecureStore, config (with `setupComplete: true`) written to AsyncStorage, navigate to Success screen.
6. Success screen shows name, role, rate. "Go to Dashboard" navigates to `/(tabs)`.

**Error recovery:**
- `AuthError` (401): returns to Credentials with "Invalid email or password"
- `NetworkError`: retry option on Verifying screen
- `ApiError(403)` on detail endpoint: shows Setup screen for manual ID/rate entry

**Subsequent launches (authenticated):**
`useConfig()` loads config, `setupComplete: true` found → tab navigator renders. `useRoleRefresh()` checks on every foreground event and silently refreshes role data if it's Monday and >7 days since last check.

---

## Out of Scope

1. **Hours/earnings dashboard screens** — Onboarding stores the config fields needed (`userId`, `hourlyRate`, `weeklyLimit`, `primaryTeamId`, `managerId`) but does not render or fetch hours data. [Deferred to 03-hours-dashboard]

2. **AI% and BrainLift screens** — Onboarding stores `assignmentId` needed by this feature but does not fetch work diary data or parse tags. [Deferred to 04-ai-brainlift]

3. **Manager approval queue UI** — Onboarding detects and stores `isManager` as a config flag only; no manager-specific screens are rendered here. [Deferred to 05-manager-approvals]

4. **Home screen widget setup** — Onboarding writes the config that widgets will eventually read, but widget registration and rendering are out of scope. [Deferred to 06-widgets]

5. **Push notification token registration** — Onboarding does not request or store an Expo push token. Device token registration with the ping server is owned entirely by 07-ping-server. [Deferred to 07-ping-server]

6. **Password reset / forgot password flow** — Crossover does not expose a password reset API. Users who forget their password must use the Crossover web app. The credentials screen will include a note pointing users there, but no in-app reset flow will be built. [Descoped]

7. **Social login / OAuth** — Crossover authentication uses email + password only via `POST /api/v3/token`. No OAuth or SSO endpoints exist. [Descoped]

8. **Team selection UI** — The onboarding flow auto-selects the first (and typically only) team from the identity detail endpoint. A picker UI for multiple teams is not needed. [Descoped]

9. **Multi-account support** — Supporting more than one Crossover account requires a credential namespace redesign (SecureStore stores a single credential set). This is explicitly a post-v1 concern. [Descoped — not in scope for v1]

---

## Functional Requirements

### FR1: Auth Gate

The root layout (`app/_layout.tsx`) MUST check `setupComplete` from the persisted config before rendering any screen. While the config is loading, a loading state is shown. Once resolved, the layout redirects to `/(auth)/welcome` if `setupComplete` is false or absent, or proceeds to `/(tabs)` if `setupComplete` is true.

**Success Criteria:**
- SC1.1: When `setupComplete` is `false` or `null` in AsyncStorage, the root layout navigates to `/(auth)/welcome` before any tab screen renders.
- SC1.2: When `setupComplete` is `true`, the root layout navigates directly to `/(tabs)` without touching any auth screen.
- SC1.3: While `useConfig` is resolving, the root layout renders a loading indicator and does not render tabs or auth screens.
- SC1.4: The auth gate check runs on every cold app start; a user cannot bypass it by navigating directly to a tab route.
- SC1.5: Existing configs stored without an `isManager` field still pass the auth gate if `setupComplete` is `true` (backward compat).

---

### FR2: Welcome Screen

The welcome screen (`app/(auth)/welcome.tsx`) is the entry point of the onboarding flow. It presents an environment toggle (Production / QA) and a "Get Started" CTA. No credentials are entered here.

**Success Criteria:**
- SC2.1: The screen renders a toggle with exactly two options: "Production" (default) and "QA".
- SC2.2: Selecting "QA" calls `useSetup().setEnvironment(true)`; selecting "Production" calls `setEnvironment(false)`.
- SC2.3: The environment selection persists in `useSetup` state so subsequent steps use the correct base URL.
- SC2.4: Tapping "Get Started" advances step to `'credentials'` and navigates to `/(auth)/credentials`.
- SC2.5: The screen does not display any email, password, or token field.
- SC2.6: The screen is reachable only when `setupComplete` is false.

---

### FR3: Credentials Screen

The credentials screen (`app/(auth)/credentials.tsx`) collects email and password with validation. Both fields must be non-empty before submission. Errors are shown inline.

**Success Criteria:**
- SC3.1: The screen renders an email input (keyboard type `email-address`, auto-capitalize off) and a secure password input.
- SC3.2: Tapping "Sign In" when either field is empty shows an inline validation error and does not call `submitCredentials`.
- SC3.3: When both fields are non-empty, tapping "Sign In" calls `useSetup().submitCredentials(email, password)`.
- SC3.4: While `isLoading` is `true`, the submit button is disabled and shows a loading state; fields remain visible.
- SC3.5: When `error` is non-null, the error string is displayed in a visible error component; the form remains editable.
- SC3.6: A 401/403 response results in `error` being set to "Invalid email or password."
- SC3.7: A network failure results in `error` being set to a connection problem message (no stack trace shown).

---

### FR4: Verifying Screen

The verifying screen (`app/(auth)/verifying.tsx`) is a non-interactive loading screen displayed while `fetchAndBuildConfig` executes. It auto-advances on success or reverts to credentials on failure.

**Success Criteria:**
- SC4.1: The screen renders a centered loading indicator and status label "Verifying your account…" with no interactive controls.
- SC4.2: The screen is shown immediately after `submitCredentials` is called and `isLoading` becomes `true`.
- SC4.3: When `fetchAndBuildConfig` succeeds and rate was auto-detected, step transitions to `'success'` and app navigates to `/(auth)/success` automatically.
- SC4.4: When `fetchAndBuildConfig` succeeds but `hourlyRate === 0`, step transitions to `'setup'` and app navigates to `/(auth)/setup` automatically.
- SC4.5: When `fetchAndBuildConfig` throws, step reverts to `'credentials'`, error is set, and app navigates back to `/(auth)/credentials`.
- SC4.6: The back gesture/button is disabled while verification is running.

---

### FR5: fetchAndBuildConfig

`fetchAndBuildConfig(username, password, useQA)` performs auth, profile resolution, and rate detection, then returns a complete `CrossoverConfig`. It does NOT write to storage.

**Success Criteria:**
- SC5.1: Calls `getAuthToken(username, password, useQA)`. Throws `AuthError` on 401/403; throws `NetworkError` on timeout.
- SC5.2: Calls `GET /api/identity/users/current/detail` with the token. Throws `ApiError(403)` if response is not 200 or body is missing required fields.
- SC5.3: Extracts `userId` from `detail.userAvatars.find(a => a.avatarType === 'CANDIDATE').id`; falls back to `detail.assignment.selection.marketplaceMember.application.candidate.id` if userAvatars absent.
- SC5.4: Extracts `assignmentId` from `detail.assignment.id` (stored as string).
- SC5.5: Extracts `managerId` from `detail.assignment.manager.id` (stored as string).
- SC5.6: Extracts `primaryTeamId` from `detail.assignment.team.id` (stored as string).
- SC5.7: Extracts `hourlyRate` from `detail.assignment.salary`; if absent or zero, proceeds to payment history.
- SC5.8: Extracts `weeklyLimit` from `detail.assignment.weeklyLimit`; defaults to `40` if absent or falsy.
- SC5.9: Calls `GET /api/v3/users/current/payments?from=<3 months ago>&to=<today>` (dates as `YYYY-MM-DD` local time, NOT `toISOString()`). On failure or empty, sets `hourlyRate` to `0`.
- SC5.10: Sets `isManager` to `true` if `detail.avatarTypes.includes('MANAGER')`, otherwise `false`.
- SC5.11: Builds `teams` as `[{ id: String(detail.assignment.team.id), name: detail.assignment.team.name, company: '' }]`.
- SC5.12: Sets `useQA` from the parameter passed in.
- SC5.13: Sets `lastRoleCheck` to `new Date().toISOString()`.
- SC5.14: Sets `setupComplete: false` and `setupDate: new Date().toISOString()` — caller sets `setupComplete: true` when persisting.
- SC5.15: The returned `CrossoverConfig` has all required fields with correct types; no field is `undefined`.

---

### FR6: Setup Screen (Manual Rate Fallback)

The setup screen (`app/(auth)/setup.tsx`) is shown only when `fetchAndBuildConfig` completed but `hourlyRate === 0`. It collects a manual hourly rate and advances to success.

**Success Criteria:**
- SC6.1: The screen is only reachable when `useSetup` step is `'setup'`.
- SC6.2: The screen renders a numeric input (keyboard type `decimal-pad`) labeled as hourly rate.
- SC6.3: Tapping "Continue" when input is empty or zero shows an inline validation error; `submitRate` is not called.
- SC6.4: Tapping "Continue" with a valid positive number calls `useSetup().submitRate(rate)`, merges rate into pending config, advances step to `'success'`.
- SC6.5: While `isLoading` is `true`, the button is disabled.
- SC6.6: If `submitRate` throws, `error` is set and displayed on screen.
- SC6.7: The screen does not re-run any API calls.

---

### FR7: Success Screen

The success screen (`app/(auth)/success.tsx`) confirms onboarding is complete. It displays name, role, and rate. "Go to Dashboard" saves credentials + config and navigates to `/(tabs)`.

**Success Criteria:**
- SC7.1: The screen displays `config.fullName` as the primary heading.
- SC7.2: Displays "Contributor" if `isManager === false`, "Manager" if `isManager === true`.
- SC7.3: Displays the hourly rate formatted as a currency string (e.g., "$75 / hr").
- SC7.4: Tapping "Go to Dashboard": (a) calls `saveCredentials`, (b) calls `saveConfig` with `setupComplete: true`, (c) navigates to `/(tabs)`.
- SC7.5: Both storage writes (7.4a and 7.4b) must succeed before navigation. On failure, an error message is shown.
- SC7.6: After navigation to `/(tabs)`, the auth gate must resolve to `/(tabs)` on any subsequent cold start.
- SC7.7: The button shows a disabled/loading state while storage writes are in progress.

---

### FR8: useSetup Hook

`useSetup()` is the central state machine for the onboarding flow. It owns step transitions, environment selection, credential submission, rate submission, loading state, and error state.

**Success Criteria:**
- SC8.1: Exposes: `step` (`'welcome' | 'credentials' | 'verifying' | 'setup' | 'success'`), `setEnvironment`, `submitCredentials`, `submitRate`, `isLoading` (boolean), `error` (string | null).
- SC8.2: Initial state: `step = 'welcome'`, `isLoading = false`, `error = null`.
- SC8.3: `setEnvironment(useQA)` is synchronous and does not change `step`.
- SC8.4: `submitCredentials`: sets `isLoading = true`, `error = null`, transitions `step` to `'verifying'`, calls `fetchAndBuildConfig`, then on success transitions to `'setup'` or `'success'`; on error transitions `step` back to `'credentials'`, sets `error`.
- SC8.5: `submitRate(rate)`: sets `isLoading = true`, merges rate into pending config, transitions to `'success'`. On error: sets `error`, stays on `'setup'`.
- SC8.6: Calling `submitCredentials` while `isLoading` is `true` is a no-op.
- SC8.7: `error` is reset to `null` at the start of any new submission.
- SC8.8: The hook does not navigate imperatively; screens observe `step` and navigate themselves.

---

### FR9: useConfig Hook

`useConfig()` is a React Query wrapper that loads `CrossoverConfig` from AsyncStorage. Used by the auth gate and success screen.

**Success Criteria:**
- SC9.1: Returns `{ config: CrossoverConfig | null, isLoading: boolean, refetch: () => void }`.
- SC9.2: On mount with a valid stored config, `config` is populated and `isLoading` becomes `false`.
- SC9.3: On mount with no config or unparseable JSON, `config` is `null` and `isLoading` is `false`.
- SC9.4: `refetch()` triggers a fresh AsyncStorage read and updates `config`.
- SC9.5: Uses stable React Query key `['config']` so all consumers share the same cache entry.
- SC9.6: The hook does NOT write to AsyncStorage (read-only).
- SC9.7: Configs without `isManager` are returned as-is; consumers default to `true` when absent.

---

### FR10: useRoleRefresh Hook

`useRoleRefresh()` silently re-fetches the user's profile on app foreground, but only on Mondays and only if the last check was >7 days ago. Produces no UI.

**Success Criteria:**
- SC10.1: Listens to `AppState` `change` events to detect foreground transitions.
- SC10.2: On foreground, reads `config.lastRoleCheck`. If absent, treats the check as overdue.
- SC10.3: Does NOT run if today (local time) is not Monday (`new Date().getDay() !== 1`).
- SC10.4: Does NOT run if `lastRoleCheck` was set within the last 7 days.
- SC10.5: When it IS Monday AND last check was >7 days ago, calls `GET /api/identity/users/current/detail`.
- SC10.6: On success, updates `isManager`, `hourlyRate`, `weeklyLimit`, `teams`, and `lastRoleCheck` via `saveConfig`.
- SC10.7: Calls `queryClient.invalidateQueries(['config'])` after writing updated fields.
- SC10.8: On API failure, silently swallows the error; does NOT update `lastRoleCheck` (retry next eligible Monday).
- SC10.9: Produces no visible UI under any condition.
- SC10.10: Runs at most once per foreground event; does not start a second concurrent request if one is in flight.

---

## Technical Design

### Files to Reference
- `WS/hourglass.js` — `runOnboarding()`, `weeklyRefresh()`, `getAuthToken()`
- `WS/tools/crossover-setup.js` — full onboarding wizard logic
- `WS/memory/MEMORY.md` — Critical ID Mapping, User Detail endpoint schema
- `WS/hourglassws/src/api/client.ts` — `getAuthToken`, `apiGet` (already implemented)
- `WS/hourglassws/src/store/config.ts` — `saveConfig`, `saveCredentials`, `loadConfig`, `loadCredentials` (already implemented)

### Files to Create
```
app/(auth)/_layout.tsx          — Stack navigator for auth group
app/(auth)/welcome.tsx          — Environment selector + "Get Started" CTA
app/(auth)/credentials.tsx      — Email + password form with validation
app/(auth)/verifying.tsx        — Full-screen loading while auth + profile fetch runs
app/(auth)/setup.tsx            — Manual fallback: rate entry if auto-detect fails
app/(auth)/success.tsx          — "You're all set" summary screen

src/hooks/useAuth.ts            — useSetup hook (onboarding state machine)
src/hooks/useRoleRefresh.ts     — Background weekly role refresh
src/hooks/useConfig.ts          — React Query wrapper for loadConfig()
src/api/auth.ts                 — fetchAndBuildConfig, getProfileDetail
```

### Files to Modify
- `app/_layout.tsx` — add auth gate logic using `useConfig()`; add `useRoleRefresh()` call

### Data Flow

```
1. App launch
   └─ _layout.tsx → useConfig() → loadConfig() via React Query
       ├─ isLoading === true → render <ActivityIndicator> (no redirect)
       └─ isLoading === false
           ├─ config === null || !config.setupComplete → router.replace('/(auth)/welcome')
           └─ config.setupComplete === true → render <Stack> → (tabs)

2. /(auth)/welcome
   └─ setEnvironment(useQA) → router.push('/(auth)/credentials')

3. /(auth)/credentials
   └─ submitCredentials(email, password)
       └─ router.push('/(auth)/verifying')  [immediate, before async]
       └─ fetchAndBuildConfig(username, password, useQA)
           ├─ getAuthToken() → POST /api/v3/token
           ├─ apiGet('/api/identity/users/current/detail')
           ├─ extractConfigFromDetail(detail)
           └─ apiGet('/api/v3/users/current/payments') [try/catch, fallback]

4. On success
   └─ saveCredentials(username, password)  [SecureStore]
   └─ saveConfig({ ...config, setupComplete: true })  [AsyncStorage]
   └─ router.replace('/(auth)/success')

5. /(auth)/success
   └─ "Go to Dashboard" → router.replace('/(tabs)')
```

### ID Extraction Logic

```typescript
interface DetailResponse {
  fullName: string;
  avatarTypes: string[];
  assignment: {
    id: number;
    salary: number;
    weeklyLimit?: number;
    team: { id: number; name: string };
    manager: { id: number };
    selection?: {
      marketplaceMember?: {
        application?: { candidate?: { id: number } };
      };
    };
  };
  userAvatars?: Array<{ avatarType: string; id: number }>;
}

function extractConfigFromDetail(detail: DetailResponse) {
  const candidateAvatar = detail.userAvatars?.find(a => a.avatarType === 'CANDIDATE');
  const nestedCandidateId =
    detail.assignment.selection?.marketplaceMember?.application?.candidate?.id;
  const userId = String(candidateAvatar?.id ?? nestedCandidateId ?? 0);
  // ...
}
```

**Critical:** `userId` from `token.split(':')[0]` is the login/profile ID — must NOT be used for timesheet or work diary queries.

### Hook: useSetup (`src/hooks/useAuth.ts`)

```typescript
type OnboardingStep = 'welcome' | 'credentials' | 'verifying' | 'setup' | 'success';

function useSetup(): {
  step: OnboardingStep;
  setEnvironment: (useQA: boolean) => void;
  submitCredentials: (username: string, password: string) => Promise<void>;
  submitRate: (rate: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

State held in local `useState`. Force-quit during `verifying` leaves `setupComplete: false` → next launch restarts from welcome (clean state).

### Hook: useConfig (`src/hooks/useConfig.ts`)

```typescript
function useConfig(): { config: CrossoverConfig | null; isLoading: boolean; refetch: () => void }
```

Query key: `['config']`. `staleTime: Infinity` — callers invalidate manually after config mutations.

### Hook: useRoleRefresh (`src/hooks/useRoleRefresh.ts`)

Monday + >7-day guard. Reads from SecureStore (credentials) + AsyncStorage (config), calls `getProfileDetail`, patches config fields, invalidates `['config']` query. Silent on failure.

### Edge Cases

- **detail 403**: `fetchAndBuildConfig` catches `ApiError(403)`, transitions step to `'setup'`; Setup screen collects manual rate/team/manager IDs
- **payments failure**: caught inside `fetchAndBuildConfig`; `hourlyRate` falls back to `detail.assignment.salary ?? 0`; if 0, Setup screen is shown
- **slow config load**: `_layout.tsx` holds native splash (`SplashScreen.preventAutoHideAsync()`) until `isLoading` resolves; hides splash on completion
- **force-quit during verifying**: storage writes happen only after `fetchAndBuildConfig` succeeds; incomplete state leaves `setupComplete: false` → clean restart
- **weeklyLimit missing**: `detail.assignment.weeklyLimit ?? 40` defaults to 40

### Dependency Map

```
app/_layout.tsx → useConfig() → loadConfig() [01-foundation ✓]
                → useRoleRefresh() → getProfileDetail() [this spec]
                                   → saveConfig() [01-foundation ✓]

credentials.tsx / verifying.tsx → useSetup() → fetchAndBuildConfig()
                                                → getAuthToken() [01-foundation ✓]
                                                → apiGet() [01-foundation ✓]
                                               → saveCredentials() [01-foundation ✓]
                                               → saveConfig() [01-foundation ✓]
```

No new types or error classes needed — all defined in 01-foundation.
