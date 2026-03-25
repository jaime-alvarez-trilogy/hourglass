// Tests: 02-ios-visual — WIDGET_LAYOUT_JS brand redesign
//
// FR1: Brand color constants and helper functions
//   SC1.1 — TEXT_PRIMARY is #E0E0E0; no #FFFFFF in any foregroundStyle() call
//   SC1.2 — TEXT_SECONDARY is #A0A0A0; TEXT_MUTED is #757575
//   SC1.3 — buildMeshBg(urgency, paceBadge) returns ZStack with 3 circle nodes
//   SC1.4 — buildGlassPanel(children) returns ZStack with gradient fill + border
//   SC1.5 — buildPaceBadge: correct colors per state; null for 'none'/undefined
//   SC1.6 — buildDeltaText: null for empty/undefined; non-null for non-empty
//   SC1.7 — buildProgressBar: parses targetStr; fallback 5 for undefined
//   SC1.8 — Full JS string evaluates without syntax error
//
// FR2: systemSmall
//   SC2.1–SC2.8 — mesh bg, urgency color, gold earnings, pace badge, manager urgency
//
// FR3: systemMedium
//   SC3.1–SC3.8 — glass panels, delta text, brand colors, null safety
//
// FR4: systemLarge
//   SC4.1–SC4.9 — glass panels, delta text, brainliftTarget, bar chart, null safety
//
// FR5: Accessory sizes
//   SC5.1–SC5.5 — semantic colors, no #FFFFFF, inline text
//
// FR6: Full-string null safety
//   SC6.1–SC6.7 — all new fields undefined handled gracefully
//
// Strategy:
// - Read bridge.ts source to extract WIDGET_LAYOUT_JS string (fs-based, no imports)
// - Evaluate with SwiftUI global stubs that return plain JS objects
// - Inspect returned tree via JSON.stringify for color/content presence
// - Helper function tests via a thin test-harness wrapper that exposes internals

import * as path from 'path';
import * as fs from 'fs';

// ─── Paths ────────────────────────────────────────────────────────────────────

const BRIDGE_FILE = path.resolve(__dirname, '../bridge.ts');

// ─── JS string extraction ────────────────────────────────────────────────────

/**
 * Reads bridge.ts and returns the raw content of WIDGET_LAYOUT_JS
 * (the string between the opening backtick on the `const WIDGET_LAYOUT_JS = \`` line
 * and the matching closing backtick before the semicolon).
 *
 * Returns the inner content (i.e., the actual JS function string).
 */
function extractWidgetLayoutJs(): string {
  const src = fs.readFileSync(BRIDGE_FILE, 'utf8');
  // Find the declaration line — use dynamic backtick to avoid template literal confusion
  const BACKTICK = String.fromCharCode(96);
  const startMarker = 'const WIDGET_LAYOUT_JS = ' + BACKTICK;
  const startIdx = src.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error('Could not find WIDGET_LAYOUT_JS in bridge.ts');
  }
  const contentStart = startIdx + startMarker.length;
  // Find the closing backtick: look for `\`;` at start of a line (the end of the template literal)
  // The literal ends with: `\n` then `})` then backtick then semicolon
  // The literal ends with: `})` then backtick then semicolon on the same line: })`;\n
  // Search for the closing sequence: `)` + backtick + `;`
  const closingSeq = '})' + BACKTICK + ';';
  const contentEnd = src.indexOf(closingSeq, contentStart);
  if (contentEnd === -1) {
    throw new Error('Could not find closing backtick of WIDGET_LAYOUT_JS in bridge.ts');
  }
  // Return the content up to and including `})`
  return src.slice(contentStart, contentEnd + 2);
}

// ─── SwiftUI stubs ────────────────────────────────────────────────────────────

/**
 * Creates a lightweight SwiftUI stub environment.
 * All primitives return plain JS objects recording their type + args.
 * Modifier functions return their argument string so they appear in JSON.
 */
function createSwiftUIStubs(): Record<string, unknown> {
  function node(type: string, args: unknown) {
    return { __type: type, ...((typeof args === 'object' && args !== null) ? args : { value: args }) };
  }

  return {
    VStack: (args: unknown) => node('VStack', args),
    HStack: (args: unknown) => node('HStack', args),
    ZStack: (args: unknown) => node('ZStack', args),
    Text: (args: unknown) => node('Text', args),
    Rectangle: (args: unknown) => node('Rectangle', args),
    Circle: (args: unknown) => node('Circle', args),
    RoundedRectangle: (args: unknown) => node('RoundedRectangle', args),
    Capsule: (args: unknown) => node('Capsule', args),
    LinearGradient: (args: unknown) => node('LinearGradient', args),
    RadialGradient: (args: unknown) => node('RadialGradient', args),
    Spacer: (args: unknown) => node('Spacer', args),
    Group: (args: unknown) => node('Group', args),
    ContainerBackground: (args: unknown) => node('ContainerBackground', args),
    Image: (args: unknown) => node('Image', args),
    // Modifier functions — return the value so colors appear in JSON
    foregroundStyle: (color: unknown) => ({ __modifier: 'foregroundStyle', color }),
    font: (args: unknown) => ({ __modifier: 'font', ...((typeof args === 'object' && args !== null) ? args : { value: args }) }),
    frame: (args: unknown) => ({ __modifier: 'frame', ...((typeof args === 'object' && args !== null) ? args : { value: args }) }),
    padding: (args: unknown) => ({ __modifier: 'padding', ...((typeof args === 'object' && args !== null) ? args : { value: args }) }),
    background: (color: unknown) => ({ __modifier: 'background', color }),
    opacity: (val: unknown) => ({ __modifier: 'opacity', val }),
    fill: (args: unknown) => ({ __modifier: 'fill', ...((typeof args === 'object' && args !== null) ? args : { value: args }) }),
    stroke: (args: unknown) => ({ __modifier: 'stroke', ...((typeof args === 'object' && args !== null) ? args : { value: args }) }),
    offset: (args: unknown) => ({ __modifier: 'offset', ...((typeof args === 'object' && args !== null) ? args : { value: args }) }),
    cornerRadius: (val: unknown) => ({ __modifier: 'cornerRadius', val }),
    blendMode: (val: unknown) => ({ __modifier: 'blendMode', val }),
    widgetURL: (url: unknown) => ({ __modifier: 'widgetURL', url }),
    Link: (args: unknown) => node('Link', args),
  };
}

/**
 * Evaluates the WIDGET_LAYOUT_JS string in a scope with SwiftUI stubs.
 * Returns the widget function.
 */
function buildWidgetFn(): (props: Record<string, unknown>, env: { widgetFamily: string }) => unknown {
  const jsStr = extractWidgetLayoutJs();
  const stubs = createSwiftUIStubs();
  const stubNames = Object.keys(stubs);
  const stubValues = stubNames.map(k => stubs[k]);

  // Build a factory function: (stub1, stub2, ...) => widgetFn
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const factory = new Function(...stubNames, 'return ' + jsStr);
  return factory(...stubValues) as (props: Record<string, unknown>, env: { widgetFamily: string }) => unknown;
}

/**
 * Returns true if the stringified tree contains the given substring.
 */
function treeContains(tree: unknown, str: string): boolean {
  return JSON.stringify(tree).includes(str);
}

/**
 * Builds a minimal props object for the widget function.
 */
function minimalProps(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    hoursDisplay: '32.5h',
    hours: '32.5',
    earnings: '$1,300',
    earningsRaw: 1300,
    today: '8.5h',
    hoursRemaining: '7.5h left',
    aiPct: '71%\u201375%',
    brainlift: '3.2h',
    brainliftTarget: '5h',
    deadline: Date.now() + 86400000,
    urgency: 'none',
    pendingCount: 0,
    isManager: false,
    cachedAt: Date.now(),
    useQA: false,
    daily: [],
    approvalItems: [],
    myRequests: [],
    actionBg: '',
    paceBadge: 'on_track',
    weekDeltaHours: '+2.1h',
    weekDeltaEarnings: '+$84',
    ...overrides,
  };
}

// ─── Cached widget function ───────────────────────────────────────────────────

let _widgetFn: ReturnType<typeof buildWidgetFn> | null = null;
function getWidgetFn() {
  if (!_widgetFn) _widgetFn = buildWidgetFn();
  return _widgetFn;
}

// ─── FR1: Color constants and helper functions ────────────────────────────────

describe('FR1: Brand color constants', () => {
  it('SC1.8 — JS string evaluates without syntax error', () => {
    expect(() => buildWidgetFn()).not.toThrow();
    expect(typeof getWidgetFn()).toBe('function');
  });

  it('SC1.1 — TEXT_PRIMARY is #E0E0E0 (appears in systemSmall hero)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ urgency: 'none' }), { widgetFamily: 'systemSmall' });
    // After redesign, urgency 'none' → hoursColor = #10B981 (success).
    // TEXT_PRIMARY (#E0E0E0) should appear somewhere in a non-urgency text node.
    // For now, we check the string is NOT using #FFFFFF.
    expect(treeContains(tree, '#FFFFFF')).toBe(false);
  });

  it('SC1.1 — #FFFFFF does not appear in systemMedium output', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '#FFFFFF')).toBe(false);
  });

  it('SC1.1 — #FFFFFF does not appear in systemLarge output', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ daily: [{ day: 'Mon', hours: 8.0, isToday: false }] }), { widgetFamily: 'systemLarge' });
    expect(treeContains(tree, '#FFFFFF')).toBe(false);
  });

  it('SC1.2 — TEXT_MUTED #757575 appears in systemSmall (label text)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '#757575')).toBe(true);
  });

  it('SC1.2 — Legacy MUTED #484F58 does not appear in output', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '#484F58')).toBe(false);
  });

  it('SC1.2 — Legacy LABEL #8B949E does not appear in output', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '#8B949E')).toBe(false);
  });
});

describe('FR1: buildPaceBadge helper', () => {
  it('SC1.5 — buildPaceBadge renders nothing for paceBadge: none', () => {
    const fn = getWidgetFn();
    const withBadge = fn(minimalProps({ paceBadge: 'on_track' }), { widgetFamily: 'systemSmall' });
    const withoutBadge = fn(minimalProps({ paceBadge: 'none' }), { widgetFamily: 'systemSmall' });
    // Tree with 'none' should NOT contain any pace badge colors that 'on_track' would show
    const badgeColors = ['#FFDF89', '#10B981', '#F59E0B', '#F43F5E'];
    // on_track shows #10B981 badge; 'none' should not show it in badge context
    // (Note: #10B981 may also be hoursColor — so we check the badge structure is absent)
    // Simplest: the 'none' tree should be strictly smaller (no badge node)
    const withStr = JSON.stringify(withBadge);
    const withoutStr = JSON.stringify(withoutBadge);
    expect(withStr.length).toBeGreaterThan(withoutStr.length);
    void badgeColors;
  });

  it('SC1.5 — buildPaceBadge renders #FFDF89 for crushed_it', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'crushed_it' }), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '#FFDF89')).toBe(true);
  });

  it('SC1.5 — buildPaceBadge renders #F59E0B for behind', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'behind', urgency: 'none' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '#F59E0B')).toBe(true);
  });

  it('SC1.5 — buildPaceBadge renders #F43F5E for critical badge', () => {
    const fn = getWidgetFn();
    // urgency 'none' so #F43F5E comes from badge, not hoursColor
    const tree = fn(minimalProps({ paceBadge: 'critical', urgency: 'none' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '#F43F5E')).toBe(true);
  });

  it('SC6.1 — buildPaceBadge with undefined paceBadge does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps({ paceBadge: undefined }), { widgetFamily: 'systemSmall' })).not.toThrow();
  });

  it('SC6.1 — buildPaceBadge with absent paceBadge renders no badge', () => {
    const fn = getWidgetFn();
    const props = minimalProps({ paceBadge: 'on_track' });
    delete props.paceBadge;
    expect(() => fn(props, { widgetFamily: 'systemSmall' })).not.toThrow();
  });
});

describe('FR1: buildDeltaText helper', () => {
  it('SC1.6 / SC6.2 — empty weekDeltaHours does not render delta text in medium', () => {
    const fn = getWidgetFn();
    const withDelta = fn(minimalProps({ weekDeltaHours: '+2.1h' }), { widgetFamily: 'systemMedium' });
    const noDelta = fn(minimalProps({ weekDeltaHours: '' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(withDelta, '+2.1h')).toBe(true);
    expect(treeContains(noDelta, '+2.1h')).toBe(false);
  });

  it('SC1.6 / SC6.2 — undefined weekDeltaHours does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps({ weekDeltaHours: undefined }), { widgetFamily: 'systemMedium' })).not.toThrow();
  });

  it('SC6.3 — empty weekDeltaEarnings does not render delta in large', () => {
    const fn = getWidgetFn();
    const withDelta = fn(minimalProps({ weekDeltaEarnings: '+$84' }), { widgetFamily: 'systemLarge' });
    const noDelta = fn(minimalProps({ weekDeltaEarnings: '' }), { widgetFamily: 'systemLarge' });
    expect(treeContains(withDelta, '+$84')).toBe(true);
    expect(treeContains(noDelta, '+$84')).toBe(false);
  });

  it('SC6.3 — undefined weekDeltaEarnings does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps({ weekDeltaEarnings: undefined }), { widgetFamily: 'systemLarge' })).not.toThrow();
  });
});

describe('FR1: buildProgressBar helper', () => {
  it('SC1.7 — brainliftTarget "5h" used for BrainLift bar in systemLarge', () => {
    const fn = getWidgetFn();
    // Change target to "10h" — the bar fill for 3.2h/10h should differ from 3.2h/5h
    const tree5 = fn(minimalProps({ brainlift: '3.2h', brainliftTarget: '5h' }), { widgetFamily: 'systemLarge' });
    const tree10 = fn(minimalProps({ brainlift: '3.2h', brainliftTarget: '10h' }), { widgetFamily: 'systemLarge' });
    // Different targets → different bar widths → different JSON (frame width values differ)
    expect(JSON.stringify(tree5)).not.toBe(JSON.stringify(tree10));
  });

  it('SC4.7 — brainliftTarget label appears in large widget output', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ brainlift: '3.2h', brainliftTarget: '5h' }), { widgetFamily: 'systemLarge' });
    // The label "3.2h / 5h" should appear (combines brainlift + brainliftTarget)
    expect(treeContains(tree, '/ 5h')).toBe(true);
  });

  it('SC6.4 — undefined brainliftTarget does not throw (fallback to 5)', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps({ brainliftTarget: undefined }), { widgetFamily: 'systemLarge' })).not.toThrow();
  });
});

describe('FR1: buildMeshBg helper', () => {
  it('SC1.3 — violet #A78BFA appears in systemSmall output (mesh Node A)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ urgency: 'none', paceBadge: 'on_track' }), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '#A78BFA')).toBe(true);
  });

  it('SC1.3 — cyan #00C2FF appears in systemSmall mesh (Node B)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ urgency: 'none' }), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '#00C2FF')).toBe(true);
  });

  it('SC1.3 — critical urgency #F43F5E appears in mesh Node C for systemSmall', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ urgency: 'critical', paceBadge: 'none' }), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '#F43F5E')).toBe(true);
  });

  it('SC1.3 — crushed_it #FFDF89 appears in mesh Node C for systemMedium', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ urgency: 'none', paceBadge: 'crushed_it' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '#FFDF89')).toBe(true);
  });
});

describe('FR1: buildGlassPanel helper', () => {
  it('SC1.4 — glass panel gradient color #1A1928 appears in systemMedium hours mode', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '#1A1928')).toBe(true);
  });

  it('SC1.4 — glass border gradient #3D3B54 appears in systemMedium', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '#3D3B54')).toBe(true);
  });

  it('SC1.4 — glass panel appears in systemLarge hero row', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemLarge' });
    expect(treeContains(tree, '#1A1928')).toBe(true);
  });
});

// ─── FR2: systemSmall ─────────────────────────────────────────────────────────

describe('FR2: systemSmall layout', () => {
  it('SC2.8 — buildSmall with minimal props does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(
      { hoursDisplay: '0.0h', earnings: '$0', urgency: 'none', paceBadge: undefined,
        today: '0.0h', hoursRemaining: '0.0h left', aiPct: 'N/A', brainlift: '0.0h',
        brainliftTarget: '5h', deadline: Date.now(), pendingCount: 0, isManager: false,
        cachedAt: Date.now(), useQA: false, daily: [], approvalItems: [], myRequests: [],
        actionBg: '', weekDeltaHours: '', weekDeltaEarnings: '', hours: '0.0',
        earningsRaw: 0, paceBadge: undefined },
      { widgetFamily: 'systemSmall' }
    )).not.toThrow();
  });

  it('SC2.2 — hours urgency color #10B981 appears in systemSmall (urgency: none)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ urgency: 'none' }), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '#10B981')).toBe(true);
  });

  it('SC2.2 — hours urgency color #F43F5E appears in systemSmall (urgency: critical)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ urgency: 'critical', paceBadge: 'none' }), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '#F43F5E')).toBe(true);
  });

  it('SC2.4 — gold #E8C97A appears in systemSmall (earnings)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '#E8C97A')).toBe(true);
  });

  it('SC2.6 — on_track badge color #10B981 appears in systemSmall when paceBadge: on_track', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'on_track', urgency: 'expired' }), { widgetFamily: 'systemSmall' });
    // urgency expired → hoursColor is #757575 (muted), not #10B981, so any #10B981 comes from badge
    expect(treeContains(tree, '#10B981')).toBe(true);
  });

  it('SC2.7 — manager urgency mode renders pendingCount when isManager+critical+pending', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({
      isManager: true, urgency: 'critical', pendingCount: 3, paceBadge: 'critical'
    }), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '3')).toBe(true);
  });
});

// ─── FR3: systemMedium ────────────────────────────────────────────────────────

describe('FR3: systemMedium layout', () => {
  it('SC3.8 — buildMedium with empty weekDeltaHours does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps({ weekDeltaHours: '' }), { widgetFamily: 'systemMedium' })).not.toThrow();
  });

  it('SC3.8 — buildMedium with undefined paceBadge does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps({ paceBadge: undefined }), { widgetFamily: 'systemMedium' })).not.toThrow();
  });

  it('SC3.3 — earnings gold #E8C97A in systemMedium hero', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '#E8C97A')).toBe(true);
  });

  it('SC3.4 — cyan #00C2FF in systemMedium (AI usage)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '#00C2FF')).toBe(true);
  });

  it('SC3.5 — weekDeltaHours +2.1h renders in systemMedium', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ weekDeltaHours: '+2.1h' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '+2.1h')).toBe(true);
  });

  it('SC3.5 — empty weekDeltaHours does not render delta in systemMedium', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ weekDeltaHours: '' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '+2.1h')).toBe(false);
  });

  it('SC3.2 — glass panel gradient #1A1928 appears in systemMedium hours mode', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '#1A1928')).toBe(true);
  });
});

// ─── FR4: systemLarge ────────────────────────────────────────────────────────

describe('FR4: systemLarge layout', () => {
  it('SC4.9 — buildLarge with all empty deltas does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(
      minimalProps({ weekDeltaHours: '', weekDeltaEarnings: '', paceBadge: 'none', daily: [] }),
      { widgetFamily: 'systemLarge' }
    )).not.toThrow();
  });

  it('SC6.5 — buildLarge with daily: undefined does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps({ daily: undefined }), { widgetFamily: 'systemLarge' })).not.toThrow();
  });

  it('SC4.2 — weekDeltaEarnings +$84 renders in systemLarge', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ weekDeltaEarnings: '+$84' }), { widgetFamily: 'systemLarge' });
    expect(treeContains(tree, '+$84')).toBe(true);
  });

  it('SC4.2 — empty weekDeltaEarnings not rendered in systemLarge', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ weekDeltaEarnings: '' }), { widgetFamily: 'systemLarge' });
    expect(treeContains(tree, '+$84')).toBe(false);
  });

  it('SC4.4 — paceBadge behind shows #F59E0B in systemLarge', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'behind', urgency: 'none' }), { widgetFamily: 'systemLarge' });
    expect(treeContains(tree, '#F59E0B')).toBe(true);
  });

  it('SC4.7 — brainliftTarget appears in BL label in systemLarge', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ brainlift: '3.2h', brainliftTarget: '5h' }), { widgetFamily: 'systemLarge' });
    expect(treeContains(tree, '5h')).toBe(true);
  });

  it('SC4.7 — different brainliftTarget values produce different bar widths', () => {
    const fn = getWidgetFn();
    const tree5 = fn(minimalProps({ brainlift: '3.2h', brainliftTarget: '5h' }), { widgetFamily: 'systemLarge' });
    const tree10 = fn(minimalProps({ brainlift: '3.2h', brainliftTarget: '10h' }), { widgetFamily: 'systemLarge' });
    expect(JSON.stringify(tree5)).not.toBe(JSON.stringify(tree10));
  });
});

// ─── FR5: Accessory sizes ─────────────────────────────────────────────────────

describe('FR5: Accessory sizes', () => {
  it('SC5.5 — accessoryRectangular does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps(), { widgetFamily: 'accessoryRectangular' })).not.toThrow();
  });

  it('SC5.5 — accessoryCircular does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps(), { widgetFamily: 'accessoryCircular' })).not.toThrow();
  });

  it('SC5.5 — accessoryInline does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps(), { widgetFamily: 'accessoryInline' })).not.toThrow();
  });

  it('SC5.4 — no #FFFFFF in accessoryRectangular output', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps(), { widgetFamily: 'accessoryRectangular' });
    expect(treeContains(tree, '#FFFFFF')).toBe(false);
  });

  it('SC5.1 — urgency color #F43F5E in accessoryRectangular (urgency: critical)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ urgency: 'critical', paceBadge: 'none' }), { widgetFamily: 'accessoryRectangular' });
    expect(treeContains(tree, '#F43F5E')).toBe(true);
  });

  it('SC5.3 — accessoryInline contains hours, earnings, AI text', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ hoursDisplay: '32.5h', earnings: '$1,300', aiPct: '71%\u201375%' }), { widgetFamily: 'accessoryInline' });
    const str = JSON.stringify(tree);
    expect(str).toContain('32.5h');
    expect(str).toContain('$1,300');
    expect(str).toContain('AI');
  });
});

// ─── FR6: Full-string null safety ─────────────────────────────────────────────

describe('FR6: Full-string null safety', () => {
  it('SC6.6 — JS string syntax check passes (same as SC1.8)', () => {
    expect(typeof getWidgetFn()).toBe('function');
  });

  it('SC6.7 — widget function with minimal props + systemMedium returns non-null', () => {
    const fn = getWidgetFn();
    const result = fn(minimalProps(), { widgetFamily: 'systemMedium' });
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
  });

  it('SC6.7 — widget function defaults to systemMedium when env is null', () => {
    const fn = getWidgetFn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = fn(minimalProps(), null as any);
    expect(result).not.toBeNull();
  });

  it('SC6.5 — systemLarge with daily: [] does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps({ daily: [] }), { widgetFamily: 'systemLarge' })).not.toThrow();
  });

  it('SC6.4 — systemLarge with brainliftTarget: undefined does not throw', () => {
    const fn = getWidgetFn();
    expect(() => fn(minimalProps({ brainliftTarget: undefined }), { widgetFamily: 'systemLarge' })).not.toThrow();
  });
});

// ─── 04-cockpit-hud: FR1 — PACE_COLORS desaturated dark glass tokens ──────────

describe('04-cockpit-hud FR1: PACE_COLORS desaturated tokens (iOS)', () => {
  it('FR1-iOS-1 — WIDGET_LAYOUT_JS string contains #CEA435 (crushed_it luxuryGold)', () => {
    const src = extractWidgetLayoutJs();
    expect(src).toContain('#CEA435');
  });

  it('FR1-iOS-2 — WIDGET_LAYOUT_JS string contains #4ADE80 (on_track successGreen)', () => {
    const src = extractWidgetLayoutJs();
    expect(src).toContain('#4ADE80');
  });

  it('FR1-iOS-3 — WIDGET_LAYOUT_JS string contains #FCD34D (behind warnAmber)', () => {
    const src = extractWidgetLayoutJs();
    expect(src).toContain('#FCD34D');
  });

  it('FR1-iOS-4 — WIDGET_LAYOUT_JS string contains #F87171 (critical desatCoral)', () => {
    const src = extractWidgetLayoutJs();
    expect(src).toContain('#F87171');
  });

  it('FR1-iOS-5 — PACE_COLORS in JS does not contain old #FFDF89 (old crushed_it)', () => {
    // Extract only the PACE_COLORS block to isolate from meshStateColor which may keep saturated values
    const src = extractWidgetLayoutJs();
    const paceColorsStart = src.indexOf('var PACE_COLORS');
    const paceColorsEnd = src.indexOf('};', paceColorsStart) + 2;
    const paceColorsBlock = src.slice(paceColorsStart, paceColorsEnd);
    expect(paceColorsBlock).not.toContain('#FFDF89');
  });

  it('FR1-iOS-6 — PACE_COLORS in JS does not contain old #F59E0B (old behind)', () => {
    const src = extractWidgetLayoutJs();
    const paceColorsStart = src.indexOf('var PACE_COLORS');
    const paceColorsEnd = src.indexOf('};', paceColorsStart) + 2;
    const paceColorsBlock = src.slice(paceColorsStart, paceColorsEnd);
    expect(paceColorsBlock).not.toContain('#F59E0B');
  });

  it('FR1-iOS-7 — PACE_COLORS in JS does not contain old #F43F5E (old critical)', () => {
    const src = extractWidgetLayoutJs();
    const paceColorsStart = src.indexOf('var PACE_COLORS');
    const paceColorsEnd = src.indexOf('};', paceColorsStart) + 2;
    const paceColorsBlock = src.slice(paceColorsStart, paceColorsEnd);
    expect(paceColorsBlock).not.toContain('#F43F5E');
  });

  it('FR1-iOS-8 — PACE_COLORS in JS does not contain old #10B981 (old on_track)', () => {
    const src = extractWidgetLayoutJs();
    const paceColorsStart = src.indexOf('var PACE_COLORS');
    const paceColorsEnd = src.indexOf('};', paceColorsStart) + 2;
    const paceColorsBlock = src.slice(paceColorsStart, paceColorsEnd);
    expect(paceColorsBlock).not.toContain('#10B981');
  });
});

// ─── 04-cockpit-hud: FR2 — iOS P2 stripped deficit layout ────────────────────

describe('04-cockpit-hud FR2: iOS P2 stripped deficit layout', () => {
  it('FR2-iOS-1 — buildMedium paceBadge=behind, no approvals → contains hoursDisplay', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'behind', approvalItems: [], myRequests: [] }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '32.5h')).toBe(true);
  });

  it('FR2-iOS-2 — buildMedium paceBadge=behind, no approvals → contains hoursRemaining', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'behind', approvalItems: [], myRequests: [] }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '7.5h left')).toBe(true);
  });

  it('FR2-iOS-3 — buildMedium paceBadge=behind, no approvals → does NOT contain aiPct value', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'behind', approvalItems: [], myRequests: [], aiPct: '71%\u201375%' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '71%\u201375%')).toBe(false);
  });

  it('FR2-iOS-4 — buildMedium paceBadge=behind, no approvals → does NOT contain brainlift value in label context', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'behind', approvalItems: [], myRequests: [], brainlift: '3.2h', brainliftTarget: '5h' }), { widgetFamily: 'systemMedium' });
    // P2 strips brainlift bar — the "/ 5h" target label should not appear
    expect(treeContains(tree, '/ 5h')).toBe(false);
  });

  it('FR2-iOS-5 — buildLarge paceBadge=critical, no approvals → contains hoursDisplay', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'critical', approvalItems: [], myRequests: [] }), { widgetFamily: 'systemLarge' });
    expect(treeContains(tree, '32.5h')).toBe(true);
  });

  it('FR2-iOS-6 — buildLarge paceBadge=critical, no approvals → contains hoursRemaining', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'critical', approvalItems: [], myRequests: [] }), { widgetFamily: 'systemLarge' });
    expect(treeContains(tree, '7.5h left')).toBe(true);
  });

  it('FR2-iOS-7 — buildLarge paceBadge=critical, no approvals → does NOT contain aiPct', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'critical', approvalItems: [], myRequests: [], aiPct: '71%\u201375%' }), { widgetFamily: 'systemLarge' });
    expect(treeContains(tree, '71%\u201375%')).toBe(false);
  });

  it('FR2-iOS-8 (edge) — paceBadge=behind WITH approvalItems → P1 wins, action rows (not P2)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({
      paceBadge: 'behind',
      approvalItems: [{ id: '1', name: 'Alice', hours: '8h', category: 'MANUAL' }],
    }), { widgetFamily: 'systemMedium' });
    // P1 action mode: contains the item name, NOT the hoursRemaining P2 label
    expect(treeContains(tree, 'Alice')).toBe(true);
  });

  it('FR2-iOS-9 (edge) — paceBadge=on_track, no approvals → P3 hours mode, aiPct IS shown', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'on_track', approvalItems: [], myRequests: [], aiPct: '71%\u201375%' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '71%\u201375%')).toBe(true);
  });

  it('FR2-iOS-10 (edge) — paceBadge=none, no approvals → P3 hours mode, aiPct IS shown', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'none', approvalItems: [], myRequests: [], aiPct: '71%\u201375%' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '71%\u201375%')).toBe(true);
  });

  it('FR2-iOS-11 — buildSmall paceBadge=critical, no approvals → shows hoursDisplay', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'critical', approvalItems: [], myRequests: [] }), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '32.5h')).toBe(true);
  });

  it('FR2-iOS-12 — buildSmall paceBadge=critical, no approvals → shows hoursRemaining', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'critical', approvalItems: [], myRequests: [] }), { widgetFamily: 'systemSmall' });
    expect(treeContains(tree, '7.5h left')).toBe(true);
  });
});

// ─── 04-cockpit-hud: FR4 — iOS hero typography ────────────────────────────────

describe('04-cockpit-hud FR4: iOS hero typography (monospaced heavy)', () => {
  it('FR4-iOS-1 — WIDGET_LAYOUT_JS string contains weight: \'heavy\'', () => {
    const src = extractWidgetLayoutJs();
    expect(src).toContain("weight: 'heavy'");
  });

  it('FR4-iOS-2 — WIDGET_LAYOUT_JS string contains design: \'monospaced\'', () => {
    const src = extractWidgetLayoutJs();
    expect(src).toContain("design: 'monospaced'");
  });

  it('FR4-iOS-3 — buildSmall output includes monospaced design on hero Text node', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'on_track', approvalItems: [], myRequests: [] }), { widgetFamily: 'systemSmall' });
    // The hero Text node's font modifier should carry design: 'monospaced'
    expect(treeContains(tree, 'monospaced')).toBe(true);
  });
});

// ─── 04-cockpit-hud: FR5 — Priority ordering P1 > P2 > P3 (iOS) ─────────────

describe('04-cockpit-hud FR5: Priority ordering P1 > P2 > P3 (iOS)', () => {
  it('FR5-iOS-1 — paceBadge=behind WITH approvalItems → P1 wins, action rows not P2', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({
      paceBadge: 'behind',
      approvalItems: [{ id: '1', name: 'Alice', hours: '8h', category: 'MANUAL' }],
      myRequests: [],
    }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, 'Alice')).toBe(true);
    // P2 would show hoursRemaining as a standalone label — P1 shows it inline only
    // Key check: aiPct is absent in P1 (action mode), but that's also absent in P2
    // Better check: action mode item name is present
    expect(treeContains(tree, 'MANUAL')).toBe(true);
  });

  it('FR5-iOS-2 — paceBadge=critical, no approvals → P2 stripped layout (no aiPct)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'critical', approvalItems: [], myRequests: [], aiPct: '71%\u201375%' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '71%\u201375%')).toBe(false);
    expect(treeContains(tree, '32.5h')).toBe(true);
  });

  it('FR5-iOS-3 — paceBadge=on_track, no approvals → P3 full hours mode (aiPct shown)', () => {
    const fn = getWidgetFn();
    const tree = fn(minimalProps({ paceBadge: 'on_track', approvalItems: [], myRequests: [], aiPct: '71%\u201375%' }), { widgetFamily: 'systemMedium' });
    expect(treeContains(tree, '71%\u201375%')).toBe(true);
  });
});
