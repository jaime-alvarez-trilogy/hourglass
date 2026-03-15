# Spec Research: Approvals Tab Redesign

**Date:** 2026-03-15
**Author:** @trilogy
**Spec:** `02-approvals-tab-redesign`

---

## Problem Context

The current approvals tab is manager-only and contributors see a redirect. This spec transforms it into a role-aware "Requests" tab that shows contributors their own submitted time requests, and gives managers both their team queue and their own submitted entries.

Depends on `01-my-requests-data` for the `useMyRequests` hook and `ManualRequestEntry` type.

---

## Exploration Findings

### Existing Patterns

| Pattern | Used In | Notes |
|---------|---------|-------|
| Role guard (tab visibility) | `app/(tabs)/_layout.tsx` | `showApprovals = config?.isManager === true \|\| config?.showApprovals === true` — gates entire tab |
| Role guard (screen content) | `app/(tabs)/approvals.tsx` | Renders "manager only" card if contributor, redirects after 1.5s |
| Section label + Card pattern | All tab screens | `SectionLabel` + `Card` for content grouping |
| Swipeable approval cards | `approvals.tsx` | `ApprovalCard` with swipe-to-approve/reject + fallback buttons |
| Loading skeletons | `index.tsx`, `ai.tsx` | `SkeletonLoader` during `isLoading && !data` |
| Pull-to-refresh | `index.tsx` | `RefreshControl` on `ScrollView` |
| FadeInScreen | All tab screens | Wraps screen content for tab-switch fade animation |

### Key Files

| File | Relevance |
|------|-----------|
| `app/(tabs)/approvals.tsx` | Modify: remove manager-only guard, add two-section layout |
| `app/(tabs)/_layout.tsx` | Modify: remove `showApprovals` gate, always show tab |
| `src/hooks/useApprovalItems.ts` | Existing manager hook — keep as-is, only used in manager section |
| `src/hooks/useMyRequests.ts` | New hook from spec 01 — drives "My Requests" section |
| `src/components/ApprovalCard.tsx` | Existing card for team queue — no changes needed |
| `src/components/SectionLabel.tsx` | Used for "TEAM REQUESTS" / "MY REQUESTS" headers |

### Integration Points

- `_layout.tsx`: remove `showApprovals` conditional, tab always renders
- `approvals.tsx`: read `config.isManager` to decide which sections to show
- `useMyRequests()` called unconditionally (works for both roles)
- `useApprovalItems()` called only when `config.isManager === true`

---

## Key Decisions

### Decision 1: Tab Always Visible vs Role-Gated

**Options considered:**
1. Always show tab, role determines content — contributors and managers both have it
2. Keep hidden for contributors, add a separate "My Time" screen somewhere else
3. Show tab only if user has either pending team items OR own requests

**Chosen:** Always show the tab (option 1).

**Rationale:** Every user — manager or not — has submitted manual time at some point. The tab should be discoverable and consistent. Hiding it creates confusion about where to find request status.

### Decision 2: Tab Label

**Options considered:**
1. Keep "Approvals" — implies manager-only action
2. "Requests" — neutral, works for both roles
3. "Time" — too generic

**Chosen:** "Requests" — neutral label that works for contributors (my requests) and managers (team requests + my requests).

**Rationale:** "Approvals" implies you're the approver. "Requests" fits both perspectives.

### Decision 3: Manager Layout — Two Sections vs Segmented Control

Previously scoped in user dialog: **two sections in one scroll view**.

Top section: "TEAM REQUESTS" — existing swipeable approval cards
Bottom section: "MY REQUESTS" — status cards for their own submissions

**Rationale:** Both sections visible at once without switching. Manager can scan team queue then see their own status below. Segmented control would hide one section entirely.

---

## Interface Contracts

### New Component: `MyRequestCard`

```typescript
// Inline in approvals.tsx or extracted to src/components/MyRequestCard.tsx

interface MyRequestCardProps {
  entry: ManualRequestEntry;  // from src/types/requests.ts
}
```

Visual design:
- Left: date + duration ("Mon Mar 17 · 2.5h")
- Center: memo description
- Right: status badge (PENDING=gold, APPROVED=success, REJECTED=critical)
- If REJECTED: rejection reason shown as secondary text below

### Updated `approvals.tsx` structure

```typescript
export default function ApprovalsScreen() {
  const { config } = useConfig();
  const isManager = config?.isManager === true;

  // Always fetch own requests
  const { entries, isLoading: myLoading, refetch: myRefetch } = useMyRequests();

  // Manager-only: team queue
  const { items, isLoading: teamLoading, approveItem, rejectItem, approveAll, refetch: teamRefetch } =
    isManager ? useApprovalItems() : { items: [], isLoading: false, ... };

  // ...render both sections
}
```

### Function Contracts

| Function | Signature | Responsibility | Dependencies |
|----------|-----------|----------------|--------------|
| `ApprovalsScreen` | `() => JSX.Element` | Role-aware screen: renders team section (managers) + my requests section (all) | `useApprovalItems`, `useMyRequests`, `useConfig` |
| `MyRequestCard` | `({ entry }: MyRequestCardProps) => JSX.Element` | Renders a single manual request entry with status badge | `ManualRequestEntry` |

---

## Test Plan

### `MyRequestCard`

**Signature:** `({ entry }: MyRequestCardProps) => JSX.Element`

**Happy Path:**
- PENDING entry: gold status badge, no rejection reason
- APPROVED entry: green badge
- REJECTED entry: red badge + rejection reason text visible

**Edge Cases:**
- Long memo text: wraps gracefully, doesn't overflow card
- Empty rejection reason on REJECTED: show "No reason provided"
- Zero duration (edge case): shows "0 min" without crashing

**Mocks Needed:**
- `ManualRequestEntry` fixtures for each status

### `ApprovalsScreen` (integration)

**Signature:** `() => JSX.Element`

**Happy Path:**
- Contributor: only "MY REQUESTS" section visible
- Manager: both "TEAM REQUESTS" and "MY REQUESTS" sections visible
- Empty own requests: shows empty state ("No requests this week")
- Manager with no team items: shows "All caught up" in team section

**Edge Cases:**
- isManager undefined (not yet set up): treat as contributor (show only own requests)
- Both sections loading: show skeletons in both
- Pull-to-refresh: triggers both `myRefetch` and `teamRefetch` (if manager)

**Mocks Needed:**
- `useConfig`: mock with `{ isManager: true }` and `{ isManager: false }` variants
- `useMyRequests`: mock returning entries in various states
- `useApprovalItems`: mock returning team items

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/(tabs)/_layout.tsx` | modify | Remove `showApprovals` gate; always render approvals tab; rename tab label to "Requests" |
| `app/(tabs)/approvals.tsx` | modify | Remove manager-only redirect; add `useMyRequests`; render two-section layout; add `MyRequestCard` |
| `src/components/MyRequestCard.tsx` | create | Reusable card for a single `ManualRequestEntry` with status badge |

---

## Edge Cases to Handle

1. **`isManager` not yet loaded** — show contributor view (safe default) until config loads
2. **Both sections empty** — show a single empty state: "No requests this week"
3. **Manager with 0 own requests** — "MY REQUESTS" section still shows with "None this week" message
4. **Swipe gesture conflict** — team section cards are swipeable; my requests section cards are static. No overlap.
5. **Tab relabel** — update tab icon/label in `_layout.tsx` from "Approvals" → "Requests"

---

## Open Questions

None remaining.
