# Implementation Checklist

Spec: `04-pill-chart`
Feature: `widget-visual-v3`

---

## Phase 1.0: Test Foundation

### FR1: StatusPill uses Capsule shape
- [ ] Write test: StatusPill renders Capsule nodes (not RoundedRectangle with cornerRadius=10)
- [ ] Write test: first Capsule fill ends with '1A' and has height=22
- [ ] Write test: second Capsule stroke equals full color (no suffix) and strokeWidth=0.5
- [ ] Write test: second Capsule has height=22
- [ ] Update widgetVisualIos.test.ts StatusPill.1 to assert Capsule fill ending '1A' (not RoundedRectangle '15')
- [ ] Update widgetVisualIos.test.ts StatusPill.2 to assert Capsule stroke without suffix and strokeWidth=0.5

### FR2: StatusPill text styling updated
- [ ] Write test: StatusPill Text font.weight === 'bold'
- [ ] Write test: StatusPill Text padding.leading === 10 and padding.trailing === 10

### FR3: IosBarChart bar corner radius is 6
- [ ] Write test: all bar RoundedRectangle nodes have cornerRadius === 6
- [ ] Write test: no RoundedRectangle with cornerRadius === 3 in IosBarChart output
- [ ] Write test: bar count and colors unchanged by cornerRadius change

### FR4: Capsule added to widgetVisualIos mock
- [ ] Add Capsule: makeComp('Capsule') to @expo/ui/swift-ui mock in widgetVisualIos.test.ts
- [ ] Verify no "Element type is invalid" or "Capsule is not a function" errors in test run

---

## Test Design Validation (MANDATORY)

- [ ] Run `red-phase-test-validator` agent
- [ ] All FR success criteria have test coverage
- [ ] Assertions are specific (not just "exists" or "doesn't throw")
- [ ] Mocks return realistic data matching interface contracts
- [ ] Fix any issues identified before proceeding

---

## Phase 1.1: Implementation

### FR1: StatusPill uses Capsule shape
- [ ] In HourglassWidget.tsx StatusPill: replace `<RoundedRectangle fill={color + '15'} cornerRadius={10} />` with `<Capsule fill={color + '1A'} height={22} />`
- [ ] In HourglassWidget.tsx StatusPill: replace `<RoundedRectangle cornerRadius={10} stroke={color + '80'} strokeWidth={1} />` with `<Capsule stroke={color} strokeWidth={0.5} height={22} />`

### FR2: StatusPill text styling updated
- [ ] In HourglassWidget.tsx StatusPill Text: change font weight from `'semibold'` to `'bold'`
- [ ] In HourglassWidget.tsx StatusPill Text: change padding from `6` to `{ leading: 10, trailing: 10 }`

### FR3: IosBarChart bar corner radius is 6
- [ ] In HourglassWidget.tsx IosBarChart: change `cornerRadius={3}` to `cornerRadius={6}` on bar RoundedRectangle (line ~219)

### FR4: Capsule added to widgetVisualIos mock
- [ ] In widgetVisualIos.test.ts: add `Capsule: makeComp('Capsule')` to the @expo/ui/swift-ui mock factory

---

## Phase 1.2: Review (MANDATORY)

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
- [ ] Commit fixes: `fix(04-pill-chart): {description}`

### Step 3: Test Quality Optimization
- [ ] Run `test-optimiser` agent on modified tests
- [ ] Apply suggested improvements that strengthen confidence
- [ ] Re-run tests to confirm passing
- [ ] Commit if changes made: `fix(04-pill-chart): strengthen test assertions`

### Final Verification
- [ ] All tests passing
- [ ] No regressions in existing tests
- [ ] Code follows existing patterns

---

## Session Notes

<!-- Add notes as you work -->
