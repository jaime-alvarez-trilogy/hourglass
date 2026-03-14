// FR1, FR4, FR5: Approvals screen
import React from 'react';
import { create, act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as fs from 'fs';
import * as path from 'path';
import type { ManualApprovalItem, OvertimeApprovalItem } from '../src/lib/approvals';

// --- Mock expo-router ---
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

// --- Mock useApprovalItems hook ---
jest.mock('../src/hooks/useApprovalItems', () => ({
  useApprovalItems: jest.fn(),
}));

// --- Mock useConfig hook ---
jest.mock('../src/hooks/useConfig', () => ({
  useConfig: jest.fn(),
}));

import ApprovalsScreen from '../app/(tabs)/approvals';
import { useApprovalItems } from '../src/hooks/useApprovalItems';
import { useConfig } from '../src/hooks/useConfig';
import type { CrossoverConfig } from '../src/types/config';

const mockUseApprovalItems = useApprovalItems as jest.Mock;
const mockUseConfig = useConfig as jest.Mock;

const APPROVALS_FILE = path.resolve(__dirname, '../app/(tabs)/approvals.tsx');

const MANAGER_CONFIG: CrossoverConfig = {
  userId: '2362707',
  fullName: 'Manager Name',
  managerId: '2372227',
  primaryTeamId: '4584',
  assignmentId: '79996',
  hourlyRate: 50,
  weeklyLimit: 40,
  useQA: false,
  isManager: true,
  teams: [],
  lastRoleCheck: '2026-01-01T00:00:00.000Z',
  setupComplete: true,
  setupDate: '2026-01-01T00:00:00.000Z',
  debugMode: false,
};

const CONTRIBUTOR_CONFIG: CrossoverConfig = { ...MANAGER_CONFIG, isManager: false };

const MANUAL_ITEM: ManualApprovalItem = {
  id: 'mt-1',
  category: 'MANUAL',
  userId: 100,
  fullName: 'Alice Smith',
  durationMinutes: 90,
  hours: '1.5',
  description: 'Fix bug',
  startDateTime: '2026-03-10T09:00:00Z',
  type: 'WEB',
  timecardIds: [1],
  weekStartDate: '2026-03-09',
};

const OVERTIME_ITEM: OvertimeApprovalItem = {
  id: 'ot-42',
  category: 'OVERTIME',
  overtimeId: 42,
  userId: 200,
  fullName: 'Bob Jones',
  jobTitle: 'Engineer',
  durationMinutes: 120,
  hours: '2.0',
  cost: 100,
  description: 'Emergency',
  startDateTime: '2026-03-09T18:00:00Z',
  weekStartDate: '2026-03-09',
};

function defaultHookReturn(overrides = {}) {
  return {
    items: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    approveItem: jest.fn(),
    rejectItem: jest.fn(),
    approveAll: jest.fn(),
    ...overrides,
  };
}

function render() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  let tree: any;
  act(() => {
    tree = create(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(ApprovalsScreen)
      )
    );
  });
  return tree;
}

beforeEach(() => {
  mockReplace.mockReset();
  mockUseConfig.mockReturnValue({ config: MANAGER_CONFIG, isLoading: false });
  mockUseApprovalItems.mockReturnValue(defaultHookReturn());
});

// =============================================================================
// FR6 (old): Approvals screen — runtime behavior (retained from original tests)
// =============================================================================

describe('FR6: Approvals screen', () => {
  it('FR6_redirects_to_hours_when_isManager_false', async () => {
    mockUseConfig.mockReturnValue({ config: CONTRIBUTOR_CONFIG, isLoading: false });
    render();
    await act(async () => { await new Promise<void>((res) => setTimeout(res, 0)); });
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('FR6_does_not_redirect_when_isManager_true', async () => {
    mockUseConfig.mockReturnValue({ config: MANAGER_CONFIG, isLoading: false });
    render();
    await act(async () => { await new Promise<void>((res) => setTimeout(res, 0)); });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('FR6_shows_count_badge_with_number_of_pending_items', () => {
    mockUseApprovalItems.mockReturnValue(
      defaultHookReturn({ items: [MANUAL_ITEM, OVERTIME_ITEM] })
    );
    const tree = render();
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('2');
  });

  it('FR6_shows_Approve_All_button_when_items_exist', () => {
    mockUseApprovalItems.mockReturnValue(
      defaultHookReturn({ items: [MANUAL_ITEM] })
    );
    const tree = render();
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('Approve All');
  });

  it('FR6_hides_Approve_All_button_when_items_empty', () => {
    mockUseApprovalItems.mockReturnValue(defaultHookReturn({ items: [] }));
    const tree = render();
    const text = JSON.stringify(tree.toJSON());
    expect(text).not.toContain('Approve All');
  });

  it('FR6_shows_all_caught_up_when_items_empty_and_not_loading', () => {
    mockUseApprovalItems.mockReturnValue(defaultHookReturn({ items: [], isLoading: false }));
    const tree = render();
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('All caught up');
  });

  it('FR6_does_not_show_all_caught_up_when_items_exist', () => {
    mockUseApprovalItems.mockReturnValue(
      defaultHookReturn({ items: [MANUAL_ITEM] })
    );
    const tree = render();
    const text = JSON.stringify(tree.toJSON());
    expect(text).not.toContain('All caught up');
  });
});

// =============================================================================
// FR1: Approvals screen — NativeWind layout (source analysis)
// =============================================================================

describe('FR1: Approvals screen — NativeWind layout (source analysis)', () => {
  let source: string;
  let code: string;

  beforeAll(() => {
    source = fs.readFileSync(APPROVALS_FILE, 'utf8');
    code = source
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('FR1 — no StyleSheet.create in source (comments stripped)', () => {
    expect(code).not.toContain('StyleSheet.create');
  });

  it('FR1 — no hardcoded hex color values in source (comments stripped)', () => {
    // Allow rgba() and tintColor string literals — only block #RRGGBB patterns
    const codeWithoutStrings = code.replace(/'rgba\([^']*\)'/g, '').replace(/"rgba\([^"]*\)"/g, '');
    expect(codeWithoutStrings).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
  });

  it('FR1 — source uses bg-background for screen container', () => {
    expect(source).toContain('bg-background');
  });

  it('FR1 — source uses bg-surface for header', () => {
    expect(source).toContain('bg-surface');
  });

  it('FR1 — source uses border-border for header separator', () => {
    expect(source).toContain('border-border');
  });

  it('FR1 — source uses text-textPrimary for header title', () => {
    expect(source).toContain('text-textPrimary');
  });

  it('FR1 — source uses bg-success for Approve All button', () => {
    expect(source).toContain('bg-success');
  });

  it('FR1 — source uses bg-critical for error banner', () => {
    expect(source).toContain('bg-critical');
  });
});

// =============================================================================
// FR4: Empty states (runtime render)
// =============================================================================

describe('FR4: Empty states', () => {
  it('FR4_manager_empty_shows_all_caught_up_title', () => {
    mockUseApprovalItems.mockReturnValue(defaultHookReturn({ items: [], isLoading: false }));
    const tree = render();
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('All caught up');
  });

  it('FR4_manager_empty_shows_no_pending_approvals_subtitle', () => {
    mockUseApprovalItems.mockReturnValue(defaultHookReturn({ items: [], isLoading: false }));
    const tree = render();
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('No pending approvals');
  });

  it('FR4_contributor_state_shows_manager_message', () => {
    mockUseConfig.mockReturnValue({ config: CONTRIBUTOR_CONFIG, isLoading: false });
    mockUseApprovalItems.mockReturnValue(defaultHookReturn({ items: [] }));
    const tree = render();
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('managers');
  });
});

// =============================================================================
// FR5: Loading state — SkeletonLoader cards (runtime render + source analysis)
// =============================================================================

describe('FR5: Loading state — SkeletonLoader', () => {
  it('FR5_loading_initial_does_not_show_all_caught_up', () => {
    mockUseApprovalItems.mockReturnValue(defaultHookReturn({ isLoading: true, items: [] }));
    const tree = render();
    const text = JSON.stringify(tree.toJSON());
    expect(text).not.toContain('All caught up');
  });

  it('FR5_source_imports_SkeletonLoader', () => {
    const source = fs.readFileSync(APPROVALS_FILE, 'utf8');
    expect(source).toContain('SkeletonLoader');
  });

  it('FR5_source_uses_SkeletonLoader_in_loading_branch', () => {
    const source = fs.readFileSync(APPROVALS_FILE, 'utf8');
    // SkeletonLoader must appear in loading context
    expect(source).toMatch(/isLoading[\s\S]{0,300}SkeletonLoader|SkeletonLoader[\s\S]{0,300}isLoading/);
  });

  it('FR5_source_does_not_use_ActivityIndicator_for_loading_state', () => {
    const source = fs.readFileSync(APPROVALS_FILE, 'utf8');
    // ActivityIndicator may be present for approveAll spinner but should NOT be the main loading state
    // The loading branch should reference SkeletonLoader, not ActivityIndicator
    const loadingSection = source.match(/isLoading[\s\S]{0,400}/);
    if (loadingSection) {
      // If ActivityIndicator appears in loading context, SkeletonLoader must too
      if (loadingSection[0].includes('ActivityIndicator')) {
        expect(loadingSection[0]).toContain('SkeletonLoader');
      }
    }
    // Source must contain SkeletonLoader
    expect(source).toContain('SkeletonLoader');
  });
});
