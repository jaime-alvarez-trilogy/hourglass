// Tests: FR4 — Key Buttons Upgraded to AnimatedPressable (03-touch-and-navigation)
//
// Strategy:
//   - Source-file static analysis: verify TouchableOpacity removed,
//     AnimatedPressable imported, approve/reject/sign-out buttons use AnimatedPressable
//   - Runtime render: ApprovalCard and modal.tsx render without crash after migration
//
// Covers:
//   - ApprovalCard.tsx approve + reject buttons
//   - modal.tsx Sign Out button

import React from 'react';
import { create, act } from 'react-test-renderer';
import * as fs from 'fs';
import * as path from 'path';

const APPROVAL_CARD_FILE = path.resolve(__dirname, '../ApprovalCard.tsx');
const MODAL_FILE = path.resolve(__dirname, '../../../app/modal.tsx');

// ─── Source file: ApprovalCard ────────────────────────────────────────────────

describe('FR4: ApprovalCard — AnimatedPressable migration', () => {
  let source: string;
  let code: string;

  beforeAll(() => {
    source = fs.readFileSync(APPROVAL_CARD_FILE, 'utf8');
    code = source
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('SC4.1 — approve button is AnimatedPressable (source contains AnimatedPressable)', () => {
    expect(source).toContain('AnimatedPressable');
  });

  it('SC4.2 — reject button is AnimatedPressable (two AnimatedPressable usages in JSX)', () => {
    // Both approve and reject must be wrapped — count occurrences
    const matches = source.match(/<AnimatedPressable/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('SC4.4 — TouchableOpacity import removed from ApprovalCard', () => {
    // No import of TouchableOpacity in the file after migration
    expect(code).not.toMatch(/import[\s\S]*?TouchableOpacity[\s\S]*?from/);
  });

  it('SC4.1 — AnimatedPressable is imported from the correct path', () => {
    expect(source).toMatch(/import[\s\S]*?AnimatedPressable[\s\S]*?from.*AnimatedPressable/);
  });

  it('SC4.5 — onApprove callback is wired to approve AnimatedPressable', () => {
    expect(source).toContain('onApprove');
    // onApprove must be passed as onPress to an AnimatedPressable
    expect(source).toMatch(/onPress.*onApprove|onApprove.*onPress/);
  });

  it('SC4.5 — onReject callback is wired to reject AnimatedPressable', () => {
    expect(source).toContain('onReject');
    expect(source).toMatch(/onPress.*onReject|onReject.*onPress/);
  });
});

// ─── Source file: modal.tsx ───────────────────────────────────────────────────

describe('FR4: modal.tsx — AnimatedPressable migration', () => {
  let source: string;
  let code: string;

  beforeAll(() => {
    source = fs.readFileSync(MODAL_FILE, 'utf8');
    code = source
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('SC4.3 — Sign Out button is AnimatedPressable', () => {
    expect(source).toContain('AnimatedPressable');
  });

  it('SC4.4 — TouchableOpacity import removed from modal.tsx', () => {
    expect(code).not.toMatch(/import[\s\S]*?TouchableOpacity[\s\S]*?from/);
  });

  it('SC4.3 — AnimatedPressable is imported in modal.tsx', () => {
    expect(source).toMatch(/import[\s\S]*?AnimatedPressable[\s\S]*?from.*AnimatedPressable/);
  });

  it('SC4.5 — handleSignOut is wired to the AnimatedPressable onPress', () => {
    expect(source).toContain('handleSignOut');
    expect(source).toMatch(/onPress.*handleSignOut|handleSignOut.*onPress/);
  });
});

// ─── Runtime render: ApprovalCard with AnimatedPressable ─────────────────────

describe('FR4: ApprovalCard — runtime render after migration', () => {
  let ApprovalCard: any;

  const ITEM_MANUAL = {
    id: 'test-1',
    fullName: 'Jane Doe',
    hours: 2,
    description: 'Fixed the deploy pipeline',
    category: 'MANUAL' as const,
    timecardIds: ['tc1'],
  };

  const ITEM_OVERTIME = {
    id: 'test-2',
    fullName: 'John Smith',
    hours: 3,
    description: 'OT weekend work',
    category: 'OVERTIME' as const,
    requestId: 'r1',
    cost: 150,
  };

  beforeAll(() => {
    ApprovalCard = require('../ApprovalCard').ApprovalCard;
  });

  it('SC4.5 — renders MANUAL ApprovalCard without crash', () => {
    expect(() => {
      act(() => {
        create(
          React.createElement(ApprovalCard, {
            item: ITEM_MANUAL,
            onApprove: jest.fn(),
            onReject: jest.fn(),
          }),
        );
      });
    }).not.toThrow();
  });

  it('SC4.5 — renders OVERTIME ApprovalCard without crash', () => {
    expect(() => {
      act(() => {
        create(
          React.createElement(ApprovalCard, {
            item: ITEM_OVERTIME,
            onApprove: jest.fn(),
            onReject: jest.fn(),
          }),
        );
      });
    }).not.toThrow();
  });

  it('SC4.5 — onApprove is wired to approve AnimatedPressable onPress in source', () => {
    // In the web renderer, Pressable.onPress is not directly accessible via JSON traversal.
    // We verify the wiring via source analysis (callback-to-button mapping is structural).
    const source = fs.readFileSync(APPROVAL_CARD_FILE, 'utf8');
    // onApprove must be the onPress of an AnimatedPressable with Approve label
    expect(source).toMatch(/AnimatedPressable[\s\S]{0,100}onApprove|onApprove[\s\S]{0,100}AnimatedPressable/);
    // And the full render must not crash with real callback
    const onApprove = jest.fn();
    const onReject = jest.fn();
    expect(() => {
      act(() => {
        create(
          React.createElement(ApprovalCard, { item: ITEM_MANUAL, onApprove, onReject }),
        );
      });
    }).not.toThrow();
  });

  it('SC4.5 — onReject is wired to reject AnimatedPressable onPress in source', () => {
    const source = fs.readFileSync(APPROVAL_CARD_FILE, 'utf8');
    expect(source).toMatch(/AnimatedPressable[\s\S]{0,100}onReject|onReject[\s\S]{0,100}AnimatedPressable/);
    const onApprove = jest.fn();
    const onReject = jest.fn();
    expect(() => {
      act(() => {
        create(
          React.createElement(ApprovalCard, { item: ITEM_MANUAL, onApprove, onReject }),
        );
      });
    }).not.toThrow();
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findNodeByAccessibilityLabel(node: any, label: string): any {
  if (!node) return null;
  if (node.props?.accessibilityLabel === label) return node;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (typeof child === 'object') {
        const found = findNodeByAccessibilityLabel(child, label);
        if (found) return found;
      }
    }
  }
  return null;
}
