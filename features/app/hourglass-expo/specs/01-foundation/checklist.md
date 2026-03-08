# Implementation Checklist

Spec: `01-foundation`
Feature: `hourglass-expo`

---

## Phase 1.0: Test Foundation

### FR2: Error Types
- [ ] Write test: `new AuthError(401)` is `instanceof Error` and `instanceof AuthError`
- [ ] Write test: `authError.statusCode` equals 401 (and 403 variant)
- [ ] Write test: `new NetworkError('timeout')` is `instanceof Error` and `instanceof NetworkError`
- [ ] Write test: `new ApiError(500)` is `instanceof Error`; `apiError.statusCode === 500`

### FR3: Auth Token Fetch
- [ ] Write test: returns token string on mocked 200 response
- [ ] Write test: outgoing request uses `Authorization: Basic base64(user:pass)` header
- [ ] Write test: outgoing request method is POST
- [ ] Write test: throws `AuthError(401)` on 401 response
- [ ] Write test: throws `AuthError(403)` on 403 response
- [ ] Write test: throws `NetworkError` when fetch rejects
- [ ] Write test: uses QA base URL when `useQA === true`
- [ ] Write test: uses prod base URL when `useQA === false`

### FR4: API Client — GET
- [ ] Write test: outgoing request includes `x-auth-token` header with correct value
- [ ] Write test: query params serialized correctly into URL
- [ ] Write test: empty params → no `?` in URL
- [ ] Write test: throws `AuthError(401)` on 401 response
- [ ] Write test: throws `AuthError(403)` on 403 response
- [ ] Write test: throws `ApiError(500)` on 500 response
- [ ] Write test: request method is GET

### FR5: API Client — PUT
- [ ] Write test: outgoing request method is PUT
- [ ] Write test: `x-auth-token` header present
- [ ] Write test: `Content-Type: application/json` header present
- [ ] Write test: body serialized as JSON string
- [ ] Write test: throws `AuthError(403)` on 403 response
- [ ] Write test: throws `ApiError(422)` on 422 response

### FR7: Config Layer — AsyncStorage
- [ ] Write test: `loadConfig()` returns `null` when key absent
- [ ] Write test: `loadConfig()` returns typed object when key present
- [ ] Write test: round-trip (`saveConfig` then `loadConfig`) returns deeply equal object
- [ ] Write test: `loadConfig()` returns `null` on invalid JSON (not throw)
- [ ] Write test: `saveConfig` writes to key `'crossover_config'`

### FR8: Credentials Layer — SecureStore
- [ ] Write test: `saveCredentials` writes both SecureStore keys
- [ ] Write test: `loadCredentials()` returns `null` when username key absent
- [ ] Write test: `loadCredentials()` returns `null` when password key absent
- [ ] Write test: `loadCredentials()` returns `Credentials` object when both keys present

### FR9: Clear All
- [ ] Write test: after `clearAll()`, `loadConfig()` returns `null`
- [ ] Write test: after `clearAll()`, `loadCredentials()` returns `null`
- [ ] Write test: `AsyncStorage.removeItem('crossover_config')` called
- [ ] Write test: `SecureStore.deleteItemAsync('crossover_username')` called
- [ ] Write test: `SecureStore.deleteItemAsync('crossover_password')` called

### FR10: Environment URLs
- [ ] Write test: `getApiBase(false)` returns `"https://api.crossover.com"`
- [ ] Write test: `getApiBase(true)` returns `"https://api-qa.crossover.com"`
- [ ] Write test: `getAppBase(false)` returns `"https://app.crossover.com"`
- [ ] Write test: `getAppBase(true)` returns `"https://app-qa.crossover.com"`

---

## Test Design Validation (MANDATORY)

⚠️ **Validate test design BEFORE implementing.** Weak tests lead to weak implementation.

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: Project Structure
- [ ] Create `hourglassws/app.json` — Expo SDK 55, bundle ID `com.trilogy.hourglassws`, EAS project ID `4ad8a6bd-aec2-45a5-935f-5598d47b605d`
- [ ] Create `hourglassws/package.json` — all required dependencies
- [ ] Create `hourglassws/tsconfig.json` — `"strict": true`
- [ ] Add `ios/` and `android/` to `.gitignore`
- [ ] Verify `npx expo start` launches without crash

### FR12: Test Infrastructure
- [ ] Create `hourglassws/jest.config.js` — `jest-expo` preset
- [ ] Create `hourglassws/__mocks__/expo-secure-store.ts` — in-memory mock with state reset
- [ ] Create `hourglassws/__mocks__/@react-native-async-storage/async-storage.ts` — in-memory mock with state reset
- [ ] Verify `npx jest` runs without configuration errors

### FR2: Error Types
- [ ] Create `src/api/errors.ts` — `AuthError`, `NetworkError`, `ApiError` classes
- [ ] `AuthError.statusCode` typed as `401 | 403`
- [ ] `ApiError.statusCode` typed as `number`

### FR3: Auth Token Fetch
- [ ] Implement `getAuthToken` in `src/api/client.ts`
- [ ] Basic auth header construction: `"Basic " + btoa(username + ":" + password)`
- [ ] POST to `/api/v3/token`; return `response.text()`
- [ ] Map 401 → `AuthError(401)`, 403 → `AuthError(403)`, fetch rejection → `NetworkError`

### FR4: API Client — GET
- [ ] Implement `apiGet<T>` in `src/api/client.ts`
- [ ] `URLSearchParams` for query string; omit `?` when empty params
- [ ] `x-auth-token` header; JSON parse response
- [ ] Map 401/403 → `AuthError`, other non-2xx → `ApiError(statusCode)`

### FR5: API Client — PUT
- [ ] Implement `apiPut<T>` in `src/api/client.ts`
- [ ] `Content-Type: application/json`; `JSON.stringify(body)` as request body
- [ ] Same error mapping as `apiGet`

### FR6: Config Types
- [ ] Create `src/types/config.ts` — `CrossoverConfig` (14 fields), `Team`, `Credentials`
- [ ] Create `src/types/api.ts` — empty export (populated by later specs)
- [ ] Verify `tsc --noEmit` passes

### FR7: Config Layer — AsyncStorage
- [ ] Implement `loadConfig` / `saveConfig` in `src/store/config.ts`
- [ ] `loadConfig`: wrap `JSON.parse` in try/catch → return `null` on error
- [ ] `saveConfig`: `AsyncStorage.setItem('crossover_config', JSON.stringify(config))`

### FR8: Credentials Layer — SecureStore
- [ ] Implement `loadCredentials` / `saveCredentials` in `src/store/config.ts`
- [ ] `loadCredentials`: read both keys; return `null` if either is `null`

### FR9: Clear All
- [ ] Implement `clearAll` in `src/store/config.ts`
- [ ] `Promise.all([AsyncStorage.removeItem(...), SecureStore.deleteItemAsync(...), SecureStore.deleteItemAsync(...)])`

### FR10: Environment URLs
- [ ] Implement `getApiBase` / `getAppBase` in `src/store/config.ts`

### FR11: Root Layout
- [ ] Create `app/_layout.tsx` — `QueryClient` outside component, `QueryClientProvider` wrapping `<Stack />`
- [ ] Create `app/+not-found.tsx` — minimal 404 screen

---

## Phase 1.2: Review (MANDATORY)

⚠️ **DO NOT skip this phase.** All four steps are mandatory for every change.

### Step 0: Spec-Implementation Alignment
- [ ] Run `spec-implementation-alignment` agent
- [ ] All FR success criteria verified in code
- [ ] Interface contracts match implementation
- [ ] No scope creep or shortfall

### Step 1: Comprehensive PR Review
- [ ] Run `pr-review-toolkit:review-pr` skill (launches 6 specialized agents)

### Step 2: Address Feedback
- [ ] Fix HIGH severity issues (critical)
- [ ] Fix MEDIUM severity issues (or document why deferred)
- [ ] Re-run tests after fixes
- [ ] Commit fixes: `fix(01-foundation): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(01-foundation): strengthen test assertions`

### Final Verification
- [ ] All tests passing (`npx jest`)
- [ ] `tsc --noEmit` passes with zero errors
- [ ] `npx expo prebuild` completes without errors
- [ ] No regressions in existing tests

---

## Session Notes

<!-- Add notes as you work -->

**2026-03-08**: Spec created. Jest/test infrastructure assigned to FR12 (was ⚠️ Unassigned in draft).
