/**
 * @jest-environment jsdom
 */
// FR5: RejectionSheet component
import React from 'react';
import { create, act } from 'react-test-renderer';
import { RejectionSheet } from '../src/components/RejectionSheet';


// =============================================================================
// FR5: RejectionSheet rendering and behavior
// =============================================================================

describe('FR5: RejectionSheet', () => {
  it('FR5_renders_with_prefilled_Not_approved_text', () => {
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(RejectionSheet, {
          visible: true,
          onConfirm: jest.fn(),
          onCancel: jest.fn(),
        })
      );
    });
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('Not approved');
  });

  it('FR5_renders_Confirm_Reject_button', () => {
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(RejectionSheet, {
          visible: true,
          onConfirm: jest.fn(),
          onCancel: jest.fn(),
        })
      );
    });
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('Confirm');
  });

  it('FR5_renders_Cancel_button', () => {
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(RejectionSheet, {
          visible: true,
          onConfirm: jest.fn(),
          onCancel: jest.fn(),
        })
      );
    });
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('Cancel');
  });

  it('FR5_Confirm_button_disabled_when_input_is_empty', () => {
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(RejectionSheet, {
          visible: true,
          onConfirm: jest.fn(),
          onCancel: jest.fn(),
          initialReason: '',
        })
      );
    });
    // Find the Confirm button and check its disabled prop
    // TouchableOpacity renders as div with aria-disabled in web/jsdom environment
    const json = tree.toJSON();
    const text = JSON.stringify(json);
    expect(text).toMatch(/"disabled":true|"aria-disabled":true/);
  });

  it('FR5_Confirm_button_disabled_when_input_is_whitespace_only', () => {
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(RejectionSheet, {
          visible: true,
          onConfirm: jest.fn(),
          onCancel: jest.fn(),
          initialReason: '   ',
        })
      );
    });
    const text = JSON.stringify(tree.toJSON());
    expect(text).toMatch(/"disabled":true|"aria-disabled":true/);
  });

  it('FR5_onCancel_called_when_Cancel_pressed', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(RejectionSheet, {
          visible: true,
          onConfirm,
          onCancel,
        })
      );
    });

    // Find Cancel button by accessibilityLabel and press it
    const instance = tree.root;
    const cancelBtn = instance.findAll(
      (node: any) =>
        node.props?.onPress !== undefined &&
        node.props?.accessibilityLabel === 'Cancel rejection'
    )[0];
    if (cancelBtn) act(() => cancelBtn.props.onPress());

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('FR5_onConfirm_not_called_when_Cancel_pressed', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    let tree: any;
    act(() => {
      tree = create(
        React.createElement(RejectionSheet, {
          visible: true,
          onConfirm,
          onCancel,
        })
      );
    });

    const instance = tree.root;
    const cancelBtn = instance.findAll(
      (node: any) =>
        node.props?.onPress !== undefined &&
        node.props?.accessibilityLabel === 'Cancel rejection'
    )[0];
    if (cancelBtn) act(() => cancelBtn.props.onPress());

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
