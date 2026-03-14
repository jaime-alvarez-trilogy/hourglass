// FR2, FR6: ApprovalCard component — visual migration + type badges
import React from 'react';
import { create, act } from 'react-test-renderer';
import * as fs from 'fs';
import * as path from 'path';
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

const APPROVAL_CARD_FILE = path.resolve(__dirname, '../src/components/ApprovalCard.tsx');

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
// FR4 (old tests renamed to FR2 for new spec numbering)
// Runtime render: name, hours, description, actions
// =============================================================================

describe('FR2: ApprovalCard — runtime render', () => {
  it('FR2_renders_fullName_hours_description', () => {
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

  it('FR2_renders_formatted_cost_for_OVERTIME_item', () => {
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
    // Cost 100 should appear formatted as $100.00
    expect(text).toMatch(/\$.*100/);
  });

  it('FR2_does_not_render_cost_for_MANUAL_item', () => {
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

  it('FR2_card_has_accessibilityLabel_prop', () => {
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
    expect(text).toMatch(/accessibilityLabel|aria-label/);
  });

  it('FR2_approve_button_calls_onApprove_when_pressed', () => {
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
    const instance = tree.root;
    const approveBtn = instance.findAll(
      (node: any) =>
        node.props?.onPress !== undefined &&
        (node.props?.accessibilityLabel ?? '').includes('Approve')
    )[0];
    if (approveBtn) act(() => approveBtn.props.onPress());
    expect(onApprove).toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
  });

  it('FR2_reject_button_calls_onReject_when_pressed', () => {
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
    const instance = tree.root;
    const rejectBtn = instance.findAll(
      (node: any) =>
        node.props?.onPress !== undefined &&
        (node.props?.accessibilityLabel ?? '').includes('Reject')
    )[0];
    if (rejectBtn) act(() => rejectBtn.props.onPress());
    expect(onReject).toHaveBeenCalled();
    expect(onApprove).not.toHaveBeenCalled();
  });
});

// =============================================================================
// FR2: ApprovalCard — source file: NativeWind migration (no StyleSheet)
// =============================================================================

describe('FR2: ApprovalCard — source file: NativeWind migration', () => {
  let source: string;
  let code: string;

  beforeAll(() => {
    source = fs.readFileSync(APPROVAL_CARD_FILE, 'utf8');
    code = source
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('FR2 — no StyleSheet.create in source (comments stripped)', () => {
    expect(code).not.toContain('StyleSheet.create');
  });

  it('FR2 — no hardcoded hex color values in source (comments stripped)', () => {
    expect(code).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
  });

  it('FR2 — gesture comment present: PanResponder retained', () => {
    // Must have a comment noting PanResponder is kept intentionally
    expect(source).toMatch(/PanResponder retained/i);
  });

  it('FR2 — PanResponder import still present (gesture layer kept)', () => {
    expect(source).toContain('PanResponder');
  });

  it('FR2 — Animated import still present (gesture layer kept)', () => {
    expect(source).toContain('Animated');
  });

  it('FR2 — source uses bg-surface for card background', () => {
    expect(source).toContain('bg-surface');
  });

  it('FR2 — source uses bg-success for approve swipe background', () => {
    expect(source).toContain('bg-success');
  });

  it('FR2 — source uses bg-destructive for reject swipe background', () => {
    expect(source).toContain('bg-destructive');
  });

  it('FR2 — source uses text-textPrimary for employee name', () => {
    expect(source).toContain('text-textPrimary');
  });

  it('FR2 — source uses text-textSecondary for hours and description', () => {
    expect(source).toContain('text-textSecondary');
  });

  it('FR2 — Animated.View retains style transform prop (not className)', () => {
    // transform must be in style prop, not className
    expect(source).toContain('translateX');
    expect(source).toMatch(/style=\{[\s\S]{0,60}transform/);
  });
});

// =============================================================================
// FR6: Type badges — gold (Manual) and warning (Overtime) pills
// =============================================================================

describe('FR6: Type badges — runtime render', () => {
  it('FR6_MANUAL_item_renders_Manual_badge_text', () => {
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
    expect(text).toContain('Manual');
  });

  it('FR6_OVERTIME_item_renders_Overtime_badge_text', () => {
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
    expect(text).toContain('Overtime');
  });

  it('FR6_MANUAL_item_does_not_render_Overtime_badge', () => {
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
    expect(text).not.toContain('Overtime');
  });

  it('FR6_OVERTIME_item_does_not_render_Manual_badge', () => {
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
    expect(text).not.toContain('"Manual"');
  });

  it('FR6_OVERTIME_item_renders_cost_value', () => {
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
    expect(text).toMatch(/\$.*100/);
  });
});

describe('FR6: Type badges — source analysis', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(APPROVAL_CARD_FILE, 'utf8');
  });

  it('FR6 — source uses bg-gold token for manual badge', () => {
    expect(source).toContain('bg-gold');
  });

  it('FR6 — source uses text-gold token for manual badge text', () => {
    expect(source).toContain('text-gold');
  });

  it('FR6 — source uses bg-warning token for overtime badge', () => {
    expect(source).toContain('bg-warning');
  });

  it('FR6 — source uses text-warning token for overtime badge text', () => {
    expect(source).toContain('text-warning');
  });

  it('FR6 — source uses item.category as discriminant (not item.type)', () => {
    // Must reference .category for badge logic
    expect(source).toMatch(/item\.category|category.*MANUAL|category.*OVERTIME/);
  });

  it('FR6 — source uses text-success for overtime cost display', () => {
    expect(source).toContain('text-success');
  });
});
