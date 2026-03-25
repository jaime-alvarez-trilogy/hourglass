# Checklist: 04-cockpit-hud

## Phase 4.0 — Tests (Red Phase)

### FR1 — Color token tests (iOS + Android)

- [ ] `widgetLayoutJs.test.ts`: add describe block "FR1 — PACE_COLORS desaturated tokens"
  - [ ] test: `WIDGET_LAYOUT_JS` contains `'#CEA435'` (crushed_it luxuryGold)
  - [ ] test: `WIDGET_LAYOUT_JS` contains `'#4ADE80'` (on_track successGreen)
  - [ ] test: `WIDGET_LAYOUT_JS` contains `'#FCD34D'` (behind warnAmber)
  - [ ] test: `WIDGET_LAYOUT_JS` contains `'#F87171'` (critical desatCoral)
  - [ ] test: `WIDGET_LAYOUT_JS` PACE_COLORS does NOT contain `'#FFDF89'` (old crushed_it)
  - [ ] test: `WIDGET_LAYOUT_JS` PACE_COLORS does NOT contain `'#F59E0B'` (old behind)
  - [ ] test: `WIDGET_LAYOUT_JS` PACE_COLORS does NOT contain `'#F43F5E'` (old critical)

- [ ] `HourglassWidget.test.tsx`: add describe block "FR1 — badgeColor desaturated tokens"
  - [ ] test: `badgeColor('crushed_it')` === `'#CEA435'`
  - [ ] test: `badgeColor('on_track')` === `'#4ADE80'`
  - [ ] test: `badgeColor('behind')` === `'#FCD34D'`
  - [ ] test: `badgeColor('critical')` === `'#F87171'`
  - [ ] test: `badgeColor('none')` === `''`

### FR2 — iOS P2 mode tests

- [ ] `widgetLayoutJs.test.ts`: add describe block "FR2 — iOS P2 stripped deficit layout"
  - [ ] test: `buildMedium` with `paceBadge='behind'`, `approvalItems=[]` → output contains `hoursDisplay` value
  - [ ] test: `buildMedium` with `paceBadge='behind'`, `approvalItems=[]` → output contains `hoursRemaining` value
  - [ ] test: `buildMedium` with `paceBadge='behind'`, `approvalItems=[]` → output does NOT contain `aiPct` value
  - [ ] test: `buildMedium` with `paceBadge='behind'`, `approvalItems=[]` → output does NOT contain `brainlift` value
  - [ ] test: `buildLarge` with `paceBadge='critical'`, `approvalItems=[]` → contains `hoursDisplay` + `hoursRemaining`
  - [ ] test: `buildLarge` with `paceBadge='critical'`, `approvalItems=[]` → no `aiPct` or `brainlift`
  - [ ] test: `buildSmall` with `paceBadge='critical'`, no approvals → shows `hoursDisplay` + `hoursRemaining`
  - [ ] test (edge): `paceBadge='behind'` AND `approvalItems.length > 0` → P1 wins, action item rows (not P2)
  - [ ] test (edge): `paceBadge='on_track'`, no approvals → P3 hours mode, `aiPct` IS shown
  - [ ] test (edge): `paceBadge='none'`, no approvals → P3 hours mode, `aiPct` IS shown

### FR3 — Android P2 mode tests

- [ ] `HourglassWidget.test.tsx`: add describe block "FR3 — Android P2 stripped deficit layout"
  - [ ] test: `MediumWidget` with `paceBadge='behind'`, `approvalItems=[]`, `isManager=false` → renders `⚠` text
  - [ ] test: same → renders `hoursDisplay` text
  - [ ] test: same → renders `hoursRemaining` text
  - [ ] test: same → does NOT render `aiPct` text
  - [ ] test: same → does NOT render `brainlift` text
  - [ ] test: `MediumWidget` with `paceBadge='critical'`, `approvalItems=[]` → `badgeColor('critical')` === `'#F87171'`
  - [ ] test (edge): `paceBadge='behind'`, `isManager=true`, `urgency='critical'`, `pendingCount=3` → urgency mode, not P2
  - [ ] test (edge): `paceBadge='behind'`, `approvalItems.length > 0` → action mode, not P2
  - [ ] test (edge): `paceBadge='on_track'`, no approvals → P3 hours mode, `aiPct` rendered

### FR4 — iOS hero typography tests

- [ ] `widgetLayoutJs.test.ts`: add describe block "FR4 — iOS hero typography"
  - [ ] test: `WIDGET_LAYOUT_JS` string contains `weight: 'heavy'`
  - [ ] test: `WIDGET_LAYOUT_JS` string contains `design: 'monospaced'`
  - [ ] test: `buildSmall` output includes font modifier `weight: 'heavy'` on hero Text node

### FR5 — Priority ordering tests

- [ ] `widgetLayoutJs.test.ts`: add describe block "FR5 — Priority ordering P1 > P2 > P3 (iOS)"
  - [ ] test: `paceBadge='behind'`, `approvalItems.length > 0` → P1 action rows (not P2)
  - [ ] test: `paceBadge='critical'`, `myRequests=[]`, `approvalItems=[]` → P2 stripped layout

- [ ] `HourglassWidget.test.tsx`: add describe block "FR5 — Priority ordering P1 > P2 > P3 (Android)"
  - [ ] test: `isManager=true`, `pendingCount=3`, `paceBadge='critical'`, `urgency='critical'` → P1 urgency mode (countdown hero)
  - [ ] test: `isManager=false`, `paceBadge='critical'`, `myRequests=[]`, `approvalItems=[]` → P2 stripped layout
  - [ ] test: `isManager=false`, `paceBadge='on_track'`, `myRequests=[]`, `approvalItems=[]` → P3 full hours mode

---

## Phase 4.1 — Implementation

### FR1 — Update color tokens

- [ ] `bridge.ts`: update `PACE_COLORS` constant in `WIDGET_LAYOUT_JS` string
  - [ ] `crushed_it: '#CEA435'` (was `'#FFDF89'`)
  - [ ] `on_track: '#4ADE80'` (was `'#10B981'`)
  - [ ] `behind: '#FCD34D'` (was `'#F59E0B'`)
  - [ ] `critical: '#F87171'` (was `'#F43F5E'`)
- [ ] `HourglassWidget.tsx`: update `badgeColor()` return values
  - [ ] `crushed_it` → `'#CEA435'`
  - [ ] `on_track` → `'#4ADE80'`
  - [ ] `behind` → `'#FCD34D'`
  - [ ] `critical` → `'#F87171'`

### FR2 — iOS P2 stripped deficit layout

- [ ] `bridge.ts` `WIDGET_LAYOUT_JS` — `buildMedium` function:
  - [ ] Add `var isPaceMode` derivation after existing `actionMode`
  - [ ] Add `else if (isPaceMode)` branch with P2 layout block (VStack: warning badge, hero hoursDisplay, hoursRemaining, spacer, footer row)
- [ ] `bridge.ts` `WIDGET_LAYOUT_JS` — `buildLarge` function:
  - [ ] Add `var isPaceMode` derivation after existing `actionMode`
  - [ ] Add `else if (isPaceMode)` branch with P2 layout block
- [ ] `bridge.ts` `WIDGET_LAYOUT_JS` — `buildSmall` function:
  - [ ] Add `var isPaceMode` derivation after existing `actionMode`
  - [ ] Add `else if (isPaceMode)` branch with compact P2 layout (badge, hoursDisplay, hoursRemaining)
- [ ] All P2 code uses ES5 only: `var`, `function()`, no arrow functions, no template literals

### FR3 — Android P2 stripped deficit layout

- [ ] `HourglassWidget.tsx` `MediumWidget`:
  - [ ] Add `isPaceMode` const after existing `actionMode`
  - [ ] Add `else if (isPaceMode)` branch returning P2 layout JSX
  - [ ] P2 JSX: mesh bg + warning badge row + hero hoursDisplay + hoursRemaining + flex spacer + footer row
  - [ ] Footer: `weekDeltaEarnings` (with `deltaColor`) + `today ${data.today}`

### FR4 — iOS hero typography

- [ ] `bridge.ts` `WIDGET_LAYOUT_JS` — add `.font({ size: 32, weight: 'heavy', design: 'monospaced' })` to:
  - [ ] `buildSmall` hours total hero Text
  - [ ] `buildMedium` P3 hours glass panel hero Text
  - [ ] `buildMedium` P2 `hoursDisplay` Text
  - [ ] `buildLarge` P3 hours total hero Text
  - [ ] `buildLarge` P2 `hoursDisplay` Text
  - [ ] Action mode primary metric Text (pending count / hours)

### FR5 — Priority ordering (implicit via FR2 + FR3 structure)

- [ ] Verify `bridge.ts`: `actionMode` check comes before `isPaceMode` check in all three builder functions
- [ ] Verify `HourglassWidget.tsx`: `isUrgencyMode` → `actionMode` → `isPaceMode` → default order preserved

---

## Phase 4.2 — Review

- [ ] Run full test suite: `cd hourglassws && npx jest`
- [ ] All Phase 4.0 tests pass (green)
- [ ] No regressions in existing tests (specs 01–03 tests still pass)
- [ ] spec-implementation-alignment: verify all FR success criteria met
- [ ] pr-review-toolkit: review-pr
- [ ] Address any feedback from review
- [ ] test-optimiser: review test quality, remove redundancy if flagged
