// FR6: Approvals screen
import React from 'react';
import { create, act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
// FR6: Approvals screen
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

  it('FR6_shows_loading_spinner_when_isLoading_true', () => {
    mockUseApprovalItems.mockReturnValue(defaultHookReturn({ isLoading: true }));
    const tree = render();
    const text = JSON.stringify(tree.toJSON());
    // ActivityIndicator renders as 'ActivityIndicator' in native, 'progressbar' in web/jsdom
    expect(text.toLowerCase()).toMatch(/activityindicator|loading|progressbar/);
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
