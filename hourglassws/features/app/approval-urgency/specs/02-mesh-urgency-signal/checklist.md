# Implementation Checklist

Spec: `02-mesh-urgency-signal`
Feature: `approval-urgency`

---

## Phase X.0: Test Foundation

### FR1: getApprovalMeshState pure function
- [ ] Test: `getApprovalMeshState(0)` → null (any day)
- [ ] Test: `getApprovalMeshState(1, monday)` → 'behind'
- [ ] Test: `getApprovalMeshState(1, tuesday)` → 'behind'
- [ ] Test: `getApprovalMeshState(1, wednesday)` → 'behind'
- [ ] Test: `getApprovalMeshState(1, thursday)` → 'critical'
- [ ] Test: `getApprovalMeshState(1, friday)` → 'critical'
- [ ] Test: `getApprovalMeshState(1, saturday)` → 'critical'
- [ ] Test: `getApprovalMeshState(1, sunday)` → 'critical'
- [ ] Test: `getApprovalMeshState(5, friday)` → 'critical' (count > 1)
- [ ] Test: `getApprovalMeshState(0, thursday)` → null (zero count overrides day)

### FR2: Home screen mesh wiring
- [ ] Test (source): imports `getApprovalMeshState` from `@/src/lib/approvalMeshSignal`
- [ ] Test (source): derives `approvalMeshState` from `getApprovalMeshState(approvalItems.length)`
- [ ] Test (source): `AnimatedMeshBackground` receives `panelState`, `earningsPace` (conditional), `pendingApprovals`
- [ ] Test (source): `earningsPace` suppressed when `approvalMeshState !== null`
- [ ] Test (source): `useApprovalItems` not called a second time (spec 01 already added)

### FR3: Overview screen mesh wiring
- [ ] Test (source): imports `getApprovalMeshState` from `@/src/lib/approvalMeshSignal`
- [ ] Test (source): derives `approvalMeshState` from `getApprovalMeshState(approvalItems.length)`
- [ ] Test (source): `AnimatedMeshBackground` receives `panelState`, `earningsPace` (conditional), `pendingApprovals`
- [ ] Test (source): `earningsPace` propagated when `approvalMeshState === null`

### FR4: AnimatedMeshBackground floor glow node
- [ ] Test (render): floor glow Circle renders when `pendingApprovals > 0`
- [ ] Test (render): floor glow Circle does NOT render when `pendingApprovals=0`
- [ ] Test (render): floor glow Circle does NOT render when `pendingApprovals=null`
- [ ] Test (render): floor glow Circle does NOT render when `pendingApprovals` undefined
- [ ] Test (source): `pendingApprovals?: number | null` in `AnimatedMeshBackgroundProps`
- [ ] Test (source): `FLOOR_NODE_X_RATIO = 0.875`
- [ ] Test (source): `FLOOR_PULSE_DURATION = 2000`
- [ ] Test (source): `FLOOR_GLOW_ALPHA = 0.30`
- [ ] Test (source): floor pulse uses `withRepeat` with `true` (autoReverse)
- [ ] Test (source): floor node position is `cy={h}` (bottom of screen)

### FR5: resolveFloorGlowColor internal helper
- [ ] Test (source): Monday (UTC) → contains warnAmber `#FCD34D`
- [ ] Test (source): Thursday (UTC) → contains desatCoral `#F87171`
- [ ] Test (source): Sunday (UTC) → contains desatCoral `#F87171`
- [ ] Test (source): count=0 → null (no color)
- [ ] Test (source): function is NOT exported from `AnimatedMeshBackground`

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase X.1: Implementation

### FR1: getApprovalMeshState pure function
- [ ] Create `src/lib/approvalMeshSignal.ts`
- [ ] Export `getApprovalMeshState(pendingCount, now?)` with injectable `now`
- [ ] Implement: `pendingCount === 0` → `null`
- [ ] Implement: Mon-Wed UTC → `'behind'`, Thu-Sun UTC → `'critical'`
- [ ] Verify: all FR1 tests pass

### FR2: Home screen mesh wiring
- [ ] Add import: `import { getApprovalMeshState } from '@/src/lib/approvalMeshSignal'`
- [ ] Add derived value: `const approvalMeshState = getApprovalMeshState(approvalItems.length)`
- [ ] Update `AnimatedMeshBackground` call: add `panelState`, conditional `earningsPace`, `pendingApprovals`
- [ ] Verify: `useApprovalItems` not duplicated — spec 01 already added it
- [ ] Verify: all FR2 tests pass

### FR3: Overview screen mesh wiring
- [ ] Add import: `import { getApprovalMeshState } from '@/src/lib/approvalMeshSignal'`
- [ ] Add derived value: `const approvalMeshState = getApprovalMeshState(approvalItems.length)`
- [ ] Update `AnimatedMeshBackground` call (mirror of index.tsx changes)
- [ ] Verify: all FR3 tests pass

### FR4: AnimatedMeshBackground floor glow node
- [ ] Add `pendingApprovals?: number | null` to `AnimatedMeshBackgroundProps` interface
- [ ] Add internal constants: `FLOOR_NODE_X_RATIO`, `FLOOR_PULSE_MIN`, `FLOOR_PULSE_MAX`, `FLOOR_PULSE_DURATION`, `FLOOR_GLOW_ALPHA`
- [ ] Add `floorPulse = useSharedValue(0)` and `useEffect` with `withRepeat(withTiming(1, { duration: 2000 }), -1, true)`
- [ ] Add `floorRadius` and `floorCenter` derived values
- [ ] Add conditional floor glow Circle JSX after Node C inside Canvas
- [ ] Verify: Nodes A, B, C unaffected (no regressions)
- [ ] Verify: all FR4 tests pass

### FR5: resolveFloorGlowColor internal helper
- [ ] Add `resolveFloorGlowColor(pendingApprovals, now?)` internal function in AnimatedMeshBackground.tsx
- [ ] Implement: `pendingApprovals <= 0` or null/undefined → `null`
- [ ] Implement: Thu/Fri/Sat/Sun UTC → `colors.desatCoral`; Mon/Tue/Wed UTC → `colors.warnAmber`
- [ ] Wire into floor node: `floorHex = resolveFloorGlowColor(pendingApprovals)` → `floorColors`
- [ ] Confirm NOT exported (internal only)
- [ ] Verify: all FR5 tests pass

### Integration
- [ ] Run full test suite: `npx jest --testPathPattern="approvalMeshSignal|MeshUrgencySignal|AnimatedMeshBackground"`
- [ ] Confirm all existing `AnimatedMeshBackground` tests still pass

---

## Phase X.2: Review (MANDATORY)

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
- [ ] Commit fixes: `fix(02-mesh-urgency-signal): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(02-mesh-urgency-signal): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing AnimatedMeshBackground tests
- [ ] Code follows existing patterns (hexToRgba reused, useDerivedValue pattern, etc.)

---

## Session Notes

<!-- Add notes as you work -->
