// FR4: ApprovalCard component
import React from 'react';
import { create, act } from 'react-test-renderer';
import { ApprovalCard } from '../src/components/ApprovalCard';
import type { ManualApprovalItem, OvertimeApprovalItem } from '../src/lib/approvals';

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const RN = require('react-native');
  return {
    Swipeable: ({ children, renderRightActions, renderLeftActions, ...props }: any) =>
      React.createElement(RN.View, props, children),
    GestureHandlerRootView: ({ children, ...props }: any) =>
      React.createElement(RN.View, props, children),
    PanGestureHandler: ({ children, ...props }: any) =>
      React.createElement(RN.View, props, children),
  };
});

const MANUAL_ITEM: ManualApprovalItem = {
  id: 'mt-1-2',
  category: 'MANUAL',
  userId: 100,
  fullName: 'Alice Smith',
  durationMinutes: 90,
  hours: '1.5',
  description: 'Fix critical bug',
  startDateTime: '2026-03-10T09:00:00Z',
  type: 'WEB',
  timecardIds: [1, 2],
  weekStartDate: '2026-03-09',
};

const OVERTIME_ITEM: OvertimeApprovalItem = {
  id: 'ot-42',
  category: 'OVERTIME',
  overtimeId: 42,
  userId: 2362707,
  fullName: 'Bob Jones',
  jobTitle: 'Senior Engineer',
  durationMinutes: 120,
  hours: '2.0',
  cost: 100,
  description: 'Emergency deployment',
  startDateTime: '2026-03-10T18:00:00Z',
  weekStartDate: '2026-03-09',
};

// =============================================================================
// FR4: ApprovalCard rendering
// =============================================================================

describe('FR4: ApprovalCard', () => {
  it('FR4_renders_fullName_hours_description', () => {
    const onApprove = jest.fn();
    const onReject = jest.fn();
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(ApprovalCard, {
          item: MANUAL_ITEM,
          onApprove,
          onReject,
        })
      );
    });
    const json = tree.toJSON();
    const text = JSON.stringify(json);
    expect(text).toContain('Alice Smith');
    expect(text).toContain('1.5');
    expect(text).toContain('Fix critical bug');
  });

  it('FR4_renders_WEB_type_badge_for_MANUAL_WEB_item', () => {
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(ApprovalCard, {
          item: MANUAL_ITEM,
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })
      );
    });
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('WEB');
  });

  it('FR4_renders_MOBILE_type_badge_for_MANUAL_MOBILE_item', () => {
    const mobileItem: ManualApprovalItem = { ...MANUAL_ITEM, type: 'MOBILE' };
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(ApprovalCard, {
          item: mobileItem,
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })
      );
    });
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('MOBILE');
  });

  it('FR4_renders_formatted_cost_for_OVERTIME_item', () => {
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(ApprovalCard, {
          item: OVERTIME_ITEM,
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })
      );
    });
    const text = JSON.stringify(tree.toJSON());
    // Cost 100 should appear formatted as $100.00 (may be split as "$","100.00" in web env)
    expect(text).toMatch(/\$.*100/);
  });

  it('FR4_does_not_render_cost_for_MANUAL_item', () => {
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(ApprovalCard, {
          item: MANUAL_ITEM,
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })
      );
    });
    const text = JSON.stringify(tree.toJSON());
    // No cost field on manual items
    expect(text).not.toMatch(/\$\d+\.\d{2}/);
  });

  it('FR4_card_has_accessibilityLabel_prop', () => {
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(ApprovalCard, {
          item: MANUAL_ITEM,
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })
      );
    });
    const json = tree.toJSON();
    // In native env: "accessibilityLabel"; in web/jsdom env: "aria-label"
    const text = JSON.stringify(json);
    expect(text).toMatch(/accessibilityLabel|aria-label/);
  });
});
