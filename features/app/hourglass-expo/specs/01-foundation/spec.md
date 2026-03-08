# 01-foundation

**Status:** Draft
**Created:** 2026-03-08
**Last Updated:** 2026-03-08
**Owner:** @trilogy

---

## Overview

This spec establishes the Expo app foundation for HourglassWS — the project skeleton, credentials layer, config storage, centralized API client, and shared TypeScript types that every other spec depends on. It produces no visible UI; its sole output is the infrastructure all subsequent features build on.

### What is being built

Four components make up this foundation:

1. **Project skeleton** — An Expo SDK 55 project using Expo CNG (Continuous Native Generation). No `ios/` or `android/` folders are committed; native projects are generated on demand via `npx expo prebuild`. The root layout wires up `QueryClientProvider` (TanStack Query v5) and an auth gate. TypeScript strict mode is enabled throughout.

2. **Credentials layer** (`src/store/config.ts`) — Email and password are stored in `expo-secure-store`, which provides hardware-backed encryption on both iOS and Android. This replaces the Scriptable iOS Keychain. Two keys are used: `crossover_username` and `crossover_password`.

3. **Config storage** (`src/store/config.ts`) — All non-sensitive settings are persisted as a JSON object in `@react-native-async-storage/async-storage` under the key `crossover_config`. This replaces `crossover-config.json`. The config schema is a direct port of the existing Scriptable config, preserving all field names and ID semantics (see Critical ID Mapping below).

4. **Centralized API client** (`src/api/client.ts`) — A single typed client wraps all Crossover API calls. It fetches a fresh auth token before each request (matching existing Scriptable behavior), attaches the `x-auth-token` header, serializes query parameters, and throws typed errors (`AuthError`, `NetworkError`, `ApiError`) on failure. The API base URL is derived at runtime from `config.useQA`, allowing environment switching without a rebuild.

### Why it exists

All other specs — auth/onboarding, hours dashboard, AI/BrainLift, manager approvals, widgets, and the ping server — share the same config schema, the same API client, and the same TypeScript types. Without this foundation in place first, each spec would duplicate storage logic, reinvent auth, and risk introducing the ID-mixing bugs that already exist in the Scriptable codebase. This spec makes those mistakes structurally impossible by centralizing the contracts before any screen is built.

### How it works

At runtime, the credential and config layers work as follows:

- On first launch, both `loadCredentials()` and `loadConfig()` return `null`. The auth gate in `_layout.tsx` redirects to the onboarding flow (implemented in spec 02).
- After onboarding, credentials are written to SecureStore and settings to AsyncStorage. Both persist across app restarts and OS-level app suspension.
- When any hook needs to call the Crossover API, it calls `apiGet` or `apiPut` from the centralized client. The client calls `getAuthToken` with the stored credentials, receives a short-lived session token, and attaches it as `x-auth-token` on the outgoing request.
- The `useQA` flag in config controls which base URL is used: `https://api-qa.crossover.com` (QA) or `https://api.crossover.com` (production). This can be toggled without rebuilding the app.
- TypeScript strict mode and the `CrossoverConfig` interface enforce correct ID usage at compile time. The critical mapping — `config.userId` for timesheet queries, `config.assignmentId` for work diary queries, and `config.managerId` for timesheet `managerId` — is encoded in the type definitions, not left to convention.

---

## Out of Scope

1. **Login and onboarding UI screens** — Foundation provides the config/credential storage layer and API client that auth screens depend on, but building the actual login form, onboarding wizard, and role-detection flow is not part of this spec. [Deferred to 02-auth-onboarding]

2. **Dashboard screens** — All visible UI for hours, earnings, and deadline countdown is out of scope here. Foundation only establishes the routing skeleton (`_layout.tsx`) and auth gate shell, not the screen content. [Deferred to 03-hours-dashboard]

3. **Hours and earnings data-fetching hooks** — `useTimesheet`, `usePayments`, and any React Query hooks that call the timesheet or payments endpoints are not built in this spec. Foundation defines `apiGet`/`apiPut` client primitives and shared API response types, but the domain hooks sit in the layer above. [Deferred to 03-hours-dashboard]

4. **AI% and BrainLift calculation logic** — Work diary fetching, tag parsing (`ai_usage`, `second_brain`), the AI% formula, and BrainLift hour aggregation are not part of infrastructure setup. [Deferred to 04-ai-brainlift]

5. **Manager approval UI and actions** — Fetching pending manual time and overtime, rendering approval queues, and calling approve/reject endpoints are all manager-feature work. Foundation does not build any of this. [Deferred to 05-manager-approvals]

6. **Native iOS and Android home screen widgets** — Widget definitions, the local-store data bridge, and timeline scheduling via `expo-widgets` and `react-native-android-widget` are post-foundation work that depends on all three dashboard specs being complete. [Deferred to 06-widgets]

7. **Silent push and ping server** — The Vercel cron function, device push token registration endpoint, and silent push dispatch are entirely separate infrastructure. Foundation does not configure push notification permissions or token storage. [Deferred to 07-ping-server]

8. **Jest configuration and test mocks** — Setting up the test runner, module name mapper, `__mocks__` for `expo-secure-store` and `@react-native-async-storage/async-storage`, and any CI test pipeline is included in this spec as FR12, since tests for the foundation layer must run as part of this spec's definition of done. [Included as FR12]

---

## Functional Requirements

### FR1: Project Structure
The Expo app must be initialized as a CNG (Continuous Native Generation) project using Expo SDK 55. No `ios/` or `android/` folders are committed to the repository — native projects are regenerated via `npx expo prebuild`. The project lives at `WS/hourglassws/` and uses Expo Router for navigation and TanStack Query v5 for server state management.

Required packages: `expo` (SDK 55), `expo-router`, `@tanstack/react-query`, `expo-secure-store`, `@react-native-async-storage/async-storage`.

TypeScript strict mode must be enabled in `tsconfig.json` (`"strict": true`). The folder layout must match:

```
hourglassws/
  app.json
  package.json
  tsconfig.json
  src/
    api/
      client.ts
      errors.ts
    store/
      config.ts
    types/
      config.ts
      api.ts
  app/
    _layout.tsx
    +not-found.tsx
```

**Success Criteria:**
- `npx expo prebuild` completes without errors, producing `ios/` and `android/` folders
- `tsc --noEmit` passes with zero errors under strict mode
- All required packages are listed in `package.json` dependencies
- `ios/` and `android/` directories are listed in `.gitignore`
- `src/api/client.ts`, `src/api/errors.ts`, `src/store/config.ts`, `src/types/config.ts`, and `app/_layout.tsx` all exist at the specified paths
- Running `npx expo start` launches without crashing

---

### FR2: Error Types
Three typed error classes must be defined in `src/api/errors.ts`:

- `AuthError extends Error` — thrown on 401 or 403 HTTP responses; carries a `statusCode` property typed as `401 | 403`
- `NetworkError extends Error` — thrown when `fetch` itself rejects (no response received)
- `ApiError extends Error` — thrown on all other non-2xx HTTP responses; carries a `statusCode: number` property

**Success Criteria:**
- `new AuthError(401)` is an `instanceof Error` and `instanceof AuthError`
- `authError.statusCode` is typed as `401 | 403` — TypeScript rejects assignment of any other number
- `new NetworkError('timeout')` is an `instanceof Error` and `instanceof NetworkError`
- `new ApiError(500)` is an `instanceof Error`; `apiError.statusCode === 500`
- All three classes are exported from `src/api/errors.ts`
- TypeScript assignment `const e: AuthError = new ApiError(500)` produces a compile-time error

---

### FR3: Auth Token Fetch
`getAuthToken(username: string, password: string, useQA: boolean): Promise<string>` is exported from `src/api/client.ts`.

The function must:
1. Build a Basic auth header: `Authorization: Basic base64(username:password)`
2. POST to `{getApiBase(useQA)}/api/v3/token` with no request body
3. Return the raw token string from the response body (text, not JSON)
4. Throw `AuthError` with `statusCode: 401` on a 401 response
5. Throw `AuthError` with `statusCode: 403` on a 403 response
6. Throw `NetworkError` if `fetch` rejects

**Success Criteria:**
- Given valid credentials and a mocked 200 response with body `"12345:abc"`, returns the string `"12345:abc"`
- The outgoing request `Authorization` header equals `"Basic " + btoa("user@example.com:pass")`
- The outgoing request method is `"POST"`
- When the mock returns 401, the function throws an `AuthError` with `statusCode === 401`
- When the mock returns 403, the function throws an `AuthError` with `statusCode === 403`
- When `fetch` rejects with a network error, the function throws a `NetworkError`
- When `useQA === true`, the request URL begins with `https://api-qa.crossover.com`
- When `useQA === false`, the request URL begins with `https://api.crossover.com`

---

### FR4: API Client — GET
`apiGet<T>(path: string, params: Record<string, string>, token: string, useQA: boolean): Promise<T>` is exported from `src/api/client.ts`.

The function must:
1. Append `params` as a URL query string to `{getApiBase(useQA)}{path}`
2. Make a GET request with header `x-auth-token: <token>`
3. Parse and return the response body as JSON typed as `T`
4. Throw `AuthError` on 401 or 403 response
5. Throw `ApiError` (with the response `statusCode`) on any other non-2xx response

**Success Criteria:**
- The outgoing request includes header `x-auth-token: <token-value>` with the exact value passed in
- Given `params: { date: "2026-01-01", teamId: "4584" }`, the request URL contains `?date=2026-01-01&teamId=4584` (both params present; order is not asserted)
- Given an empty `params` object, no `?` character appears in the request URL
- The return value is typed as `T` — callers receive the parsed JSON without any cast
- A mocked 401 response causes the function to throw `AuthError` with `statusCode === 401`
- A mocked 403 response causes the function to throw `AuthError` with `statusCode === 403`
- A mocked 500 response causes the function to throw `ApiError` with `statusCode === 500`
- The request method is `"GET"`

---

### FR5: API Client — PUT
`apiPut<T>(path: string, body: unknown, token: string, useQA: boolean): Promise<T>` is exported from `src/api/client.ts`.

The function must:
1. Make a PUT request to `{getApiBase(useQA)}{path}`
2. Set headers `x-auth-token: <token>` and `Content-Type: application/json`
3. Serialize `body` as JSON for the request body
4. Parse and return the response body as JSON typed as `T`
5. Throw `AuthError` on 401 or 403; throw `ApiError` on other non-2xx responses

**Success Criteria:**
- The outgoing request method is `"PUT"`
- The outgoing request includes header `x-auth-token: <token-value>`
- The outgoing request includes header `Content-Type: application/json`
- Given `body: { approverId: "123", timecardIds: [1, 2] }`, the serialized request body equals `JSON.stringify({ approverId: "123", timecardIds: [1, 2] })`
- The return value is typed as `T` and equals the parsed JSON of the mocked response body
- A mocked 403 response causes the function to throw `AuthError` with `statusCode === 403`
- A mocked 422 response causes the function to throw `ApiError` with `statusCode === 422`

---

### FR6: Config Types
Three TypeScript interfaces must be defined and exported from `src/types/config.ts`, matching the exact field names and types from the Scriptable config system:

```typescript
interface CrossoverConfig {
  userId: string;
  fullName: string;
  managerId: string;
  primaryTeamId: string;
  teams: Team[];
  hourlyRate: number;
  weeklyLimit: number;
  useQA: boolean;
  isManager: boolean;
  assignmentId: string;
  lastRoleCheck: string;
  debugMode: boolean;
  setupComplete: boolean;
  setupDate: string;
}

interface Team {
  id: string;
  name: string;
  company: string;
}

interface Credentials {
  username: string;
  password: string;
}
```

**Success Criteria:**
- All three interfaces are exported from `src/types/config.ts`
- `CrossoverConfig` has exactly the 14 fields listed above — no extras, none missing
- `teams` is typed as `Team[]`, not `any[]` or `object[]`
- `hourlyRate` and `weeklyLimit` are typed as `number`, not `string`
- `useQA`, `isManager`, `debugMode`, `setupComplete` are typed as `boolean`
- TypeScript rejects `const c: CrossoverConfig = { userId: 123 }` (number assigned to string field) at compile time
- `Credentials` contains only `username` and `password`, both typed as `string`

---

### FR7: Config Layer — AsyncStorage
`loadConfig` and `saveConfig` are exported from `src/store/config.ts` and operate on the AsyncStorage key `'crossover_config'`.

- `loadConfig(): Promise<CrossoverConfig | null>` — reads the key, parses JSON, returns typed object or `null` if absent or parse fails
- `saveConfig(config: CrossoverConfig): Promise<void>` — serializes to JSON and writes to the key

**Success Criteria:**
- `loadConfig()` returns `null` when the AsyncStorage key `'crossover_config'` is absent
- `loadConfig()` returns a correctly typed `CrossoverConfig` object when the key is present and contains valid JSON
- `saveConfig(config)` writes the JSON-serialized config to key `'crossover_config'`
- A round-trip (`saveConfig(obj)` then `loadConfig()`) returns an object deeply equal to the original
- `saveConfig` does not swallow errors — if AsyncStorage throws, the error propagates to the caller
- `loadConfig` returns `null` on invalid JSON (wraps parse in try/catch) rather than throwing

---

### FR8: Credentials Layer — SecureStore
`loadCredentials` and `saveCredentials` are exported from `src/store/config.ts` and operate on SecureStore keys `'crossover_username'` and `'crossover_password'`.

- `saveCredentials(username: string, password: string): Promise<void>` — writes both keys
- `loadCredentials(): Promise<Credentials | null>` — reads both keys; returns `null` if either is missing

**Success Criteria:**
- `saveCredentials("user@example.com", "pass123")` calls `SecureStore.setItemAsync('crossover_username', 'user@example.com')` and `SecureStore.setItemAsync('crossover_password', 'pass123')`
- `loadCredentials()` returns `null` when `'crossover_username'` is absent from SecureStore
- `loadCredentials()` returns `null` when `'crossover_password'` is absent from SecureStore
- `loadCredentials()` returns `{ username: "user@example.com", password: "pass123" }` when both keys are present with those values
- The return type is `Credentials | null`, not `any`

---

### FR9: Clear All
`clearAll(): Promise<void>` is exported from `src/store/config.ts`.

The function must remove the AsyncStorage config key and both SecureStore credential keys.

**Success Criteria:**
- After `clearAll()`, `loadConfig()` returns `null`
- After `clearAll()`, `loadCredentials()` returns `null`
- `clearAll()` calls `AsyncStorage.removeItem('crossover_config')`
- `clearAll()` calls `SecureStore.deleteItemAsync('crossover_username')`
- `clearAll()` calls `SecureStore.deleteItemAsync('crossover_password')`
- All three deletions are awaited — the promise does not resolve until all three complete
- If one deletion throws, the error propagates (no silent swallowing)

---

### FR10: Environment URLs
`getApiBase(useQA: boolean): string` and `getAppBase(useQA: boolean): string` are exported from `src/store/config.ts`.

**Success Criteria:**
- `getApiBase(false)` returns exactly `"https://api.crossover.com"`
- `getApiBase(true)` returns exactly `"https://api-qa.crossover.com"`
- `getAppBase(false)` returns exactly `"https://app.crossover.com"`
- `getAppBase(true)` returns exactly `"https://app-qa.crossover.com"`
- Both functions are pure (no side effects, no async)
- Return type is `string` — TypeScript infers this without explicit annotation required

---

### FR11: Root Layout
`app/_layout.tsx` must configure the root navigation shell for Expo Router and wrap the entire app in a `QueryClientProvider` from TanStack Query.

The layout must:
1. Create a `QueryClient` instance (created once, not on every render)
2. Wrap the `<Stack>` navigator in `<QueryClientProvider client={queryClient}>`
3. Export the layout as the default export

**Success Criteria:**
- `QueryClient` is instantiated outside the component function (or via `useState`/`useRef` to avoid re-creation on re-render)
- The component renders `<QueryClientProvider client={queryClient}><Stack /></QueryClientProvider>` (or equivalent Expo Router slot)
- Any screen rendered inside the layout can call `useQueryClient()` without throwing "No QueryClient set"
- The file has no TypeScript errors under strict mode
- `npx expo start` does not produce a "QueryClient not found" runtime error
- The file is the default export and Expo Router recognizes it as the root layout (no `ExpoRouter.Layout` warning in logs)

---

### FR12: Test Infrastructure
Jest is configured to run all tests in the `hourglassws/` project. Module name mapping handles React Native and Expo package aliases. Manual mocks exist for `expo-secure-store` and `@react-native-async-storage/async-storage`.

Required setup:
- `jest.config.js` (or `jest` field in `package.json`) configured with `jest-expo` preset
- `__mocks__/expo-secure-store.ts` — in-memory mock of `getItemAsync`, `setItemAsync`, `deleteItemAsync`
- `__mocks__/@react-native-async-storage/async-storage.ts` — in-memory mock of `getItem`, `setItem`, `removeItem`

**Success Criteria:**
- `npx jest` runs without configuration errors
- All FR3–FR10 unit tests pass using the mocks (no real device or SecureStore needed)
- Mock `SecureStore.getItemAsync` returns `null` by default (not found)
- Mock `AsyncStorage.getItem` returns `null` by default
- Mock state resets between tests (each test starts with empty storage)

---

## Technical Design

### Files to Reference

- `WS/hourglass.js` lines 1–150 — config loading, `initUrls`, `getAuthToken` patterns to port
- `WS/tools/crossover-setup.js` — `loadConfig`, `saveConfig`, `getApiBase` patterns to port
- `WS/memory/MEMORY.md` — Critical ID Mapping section (authoritative source of truth)

### Files to Create

```
hourglassws/
  app.json                    — Expo SDK 55, bundle ID, EAS project ID, plugins config
  package.json                — expo, expo-router, @tanstack/react-query,
                                expo-secure-store, @react-native-async-storage/async-storage
  tsconfig.json               — strict mode
  jest.config.js              — jest-expo preset
  src/
    api/
      client.ts               — getAuthToken, apiGet, apiPut
      errors.ts               — AuthError, NetworkError, ApiError
    store/
      config.ts               — loadConfig, saveConfig, loadCredentials,
                                saveCredentials, clearAll, getApiBase, getAppBase
    types/
      config.ts               — CrossoverConfig, Credentials, Team
      api.ts                  — shared API response types (populated in later specs)
  app/
    _layout.tsx               — Root layout, QueryClientProvider, auth gate shell
    +not-found.tsx
  __mocks__/
    expo-secure-store.ts      — in-memory SecureStore mock
    @react-native-async-storage/
      async-storage.ts        — in-memory AsyncStorage mock
```

### Data Flow

1. **App start: loadConfig() → AsyncStorage**
   - Reads key `crossover_config` from AsyncStorage
   - Parses JSON → `CrossoverConfig | null`
   - Returns `null` if key absent, value is `null`/`undefined`, or JSON is invalid
   - On `null`: auth gate in `_layout.tsx` redirects to onboarding (spec 02)

2. **App start: loadCredentials() → SecureStore**
   - Reads `crossover_username` and `crossover_password` from SecureStore independently
   - If either key returns `null`, returns `null` for the whole `Credentials` object
   - Both keys must be present for a valid credential pair

3. **Any API call: getAuthToken(username, password, useQA) → POST /api/v3/token → token**
   - Constructs `Authorization: Basic base64(username:password)` header
   - POSTs to `{getApiBase(useQA)}/api/v3/token`
   - On 200: returns raw token string (format `"userId:sessionToken"`)
   - On 401/403: throws `AuthError`
   - On network failure: throws `NetworkError`
   - Token is fetched fresh before each data load — never cached between calls

4. **API call: apiGet/apiPut(path, ..., token, useQA) → fetch with x-auth-token header**
   - Base URL: `getApiBase(useQA)` + path
   - All requests attach header `x-auth-token: <token>`
   - `apiGet`: appends params as URLSearchParams query string
   - `apiPut`: sets `Content-Type: application/json`, sends serialized body
   - On 401/403: throws `AuthError`; on other non-2xx: throws `ApiError` with statusCode

### Critical ID Mapping

This is the most important correctness constraint. Mixing these IDs is the primary source of bugs in the existing Scriptable codebase.

| Variable | Source | Used For |
|----------|--------|----------|
| `userId` (from token split) | `token.split(':')[0]` | Login only — NOT for API queries |
| `config.userId` | `userAvatars[CANDIDATE].id` OR `assignment.selection...candidate.id` | Timesheet API `userId` param |
| `config.assignmentId` | `assignment.id` | Work diary API `assignmentId` param |
| `config.managerId` | `assignment.manager.id` | Timesheet API `managerId` param |
| `config.primaryTeamId` | `assignment.team.id` | Timesheet API `teamId` param |

The token-derived `userId` is a login/profile ID (e.g. `1190137`) and must never be passed to timesheet or work diary endpoints.

### Package Dependencies

```json
{
  "expo": "~55.0.0",
  "expo-router": "~4.0.0",
  "@tanstack/react-query": "^5.0.0",
  "expo-secure-store": "~14.0.0",
  "@react-native-async-storage/async-storage": "^2.0.0",
  "react-native-safe-area-context": "<use expo install>",
  "react-native-screens": "<use expo install>",
  "typescript": "^5.0.0",
  "jest-expo": "~55.0.0"
}
```

Use `expo install` for Expo-managed packages to ensure peer compatibility with SDK 55 lockfile.

### Edge Cases

- **Token fetch failure during an API call** — `getAuthToken` throws `NetworkError` or `AuthError`. The calling hook must catch and surface: `AuthError` → redirect to onboarding; `NetworkError` → show "No connection" retry state.

- **AsyncStorage read returning null/undefined vs. empty** — `loadConfig` must treat `null`, `undefined`, and `""` returns as "not configured" and return `null`. Do not pass empty string to `JSON.parse`.

- **SecureStore returning null for one key but not the other** — `loadCredentials` reads both keys independently. If either returns `null`, return `null` for the whole credentials object. A partial credential pair must trigger re-onboarding.

- **Invalid JSON in AsyncStorage config** — `loadConfig` wraps `JSON.parse` in try/catch and returns `null` on failure. Caller (app startup) calls `clearAll()` and redirects to onboarding.
