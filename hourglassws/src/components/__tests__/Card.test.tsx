// Tests: Card component (02-dark-glass + 01-ambient-layer)
// FR1: Card glass layer — base variant (BlurView intensity 60, semi-transparent bg)
// FR2: Card glass layer — elevated variant (BlurView intensity 80, brighter bg)
// FR3: Card glass={false} opt-out — flat legacy render
// FR3 (01-ambient-layer): GLASS_BASE opacity ≤ 0.15
// FR4 (01-ambient-layer): GLASS_ELEVATED opacity ≤ 0.20
// FR3/FR4 (01-ambient-layer): BLUR_INTENSITY_BASE ≥ 60, BLUR_INTENSITY_ELEVATED ≥ 80
//
// Retained from 03-base-components:
//   SC1.1 — runtime render checks (children, elevated, className)
//   SC1.2/SC1.3 — source file class strings (updated for glass implementation)
//
// NOTE on NativeWind v4 + test-renderer:
// NativeWind v4 transforms className to hashed IDs in Jest/node.
// className assertions are done via source-file static analysis (fs.readFileSync).
//
// NOTE on expo-blur mock:
// BlurView is mocked as a passthrough component so it renders in the test tree.

import React from 'react';
import { create, act } from 'react-test-renderer';
import * as fs from 'fs';
import * as path from 'path';

// Mock expo-blur — BlurView renders as passthrough in tests
jest.mock('expo-blur', () => {
  const mockReact = require('react');
  return {
    __esModule: true,
    BlurView: ({ children, intensity, tint, style }: any) =>
      mockReact.createElement('BlurView', { intensity, tint, style }, children ?? null),
  };
});

const CARD_FILE = path.resolve(__dirname, '../Card.tsx');

// ─── Module handle — load once after mock is registered ────────────────────────

let Card: any;
let GLASS_BASE: any;
let GLASS_ELEVATED: any;
let BLUR_INTENSITY_BASE: number;
let BLUR_INTENSITY_ELEVATED: number;

beforeAll(() => {
  const mod = require('../Card');
  Card = mod.default;
  GLASS_BASE = mod.GLASS_BASE;
  GLASS_ELEVATED = mod.GLASS_ELEVATED;
  BLUR_INTENSITY_BASE = mod.BLUR_INTENSITY_BASE;
  BLUR_INTENSITY_ELEVATED = mod.BLUR_INTENSITY_ELEVATED;
});

// ─── Runtime render checks (retained from 03-base-components) ─────────────────

describe('Card — runtime render (retained)', () => {
  it('SC1.1 — renders children without crash', () => {
    expect(() => {
      act(() => {
        create(React.createElement(Card, null, React.createElement('View' as any, null)));
      });
    }).not.toThrow();
  });

  it('SC1.1 — children are present in rendered output', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(Card, null, 'card content'));
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('card content');
  });

  it('SC1.1 — renders with elevated=true without crash', () => {
    expect(() => {
      act(() => {
        create(React.createElement(Card, { elevated: true }, 'elevated card'));
      });
    }).not.toThrow();
  });

  it('SC1.1 — renders with className prop without crash', () => {
    expect(() => {
      act(() => {
        create(React.createElement(Card, { className: 'p-8' }, 'custom padding'));
      });
    }).not.toThrow();
  });

  it('SC1.1 — renders exactly one root element (not fragment, not array)', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(Card, null, 'child'));
    });
    const json = tree.toJSON();
    expect(Array.isArray(json)).toBe(false);
    expect(json).not.toBeNull();
  });
});

// ─── FR1: GLASS_BASE constant ─────────────────────────────────────────────────

describe('Card — FR1: GLASS_BASE exported constant', () => {
  it('FR1.1 — GLASS_BASE is exported', () => {
    expect(GLASS_BASE).toBeDefined();
  });

  it('FR1.2 — GLASS_BASE.backgroundColor is semi-transparent (contains rgba)', () => {
    expect(GLASS_BASE.backgroundColor).toMatch(/rgba/i);
  });

  it('FR1.3 — GLASS_BASE.backgroundColor contains surface colour values (22, 21, 31)', () => {
    expect(GLASS_BASE.backgroundColor).toContain('22');
    expect(GLASS_BASE.backgroundColor).toContain('21');
    expect(GLASS_BASE.backgroundColor).toContain('31');
  });

  it('FR1.4 — GLASS_BASE.borderColor is an rgba white value', () => {
    // Normalise whitespace for comparison — value may be 0.06 or 0.10 per design iteration
    const normalised = GLASS_BASE.borderColor.replace(/\s/g, '');
    expect(normalised).toMatch(/^rgba\(255,255,255,/);
  });

  it('FR1.5 — GLASS_BASE.borderWidth is 1', () => {
    expect(GLASS_BASE.borderWidth).toBe(1);
  });

  it('FR1.6 — BLUR_INTENSITY_BASE is ≥ 60 (01-ambient-layer: increased for ambient sampling)', () => {
    expect(BLUR_INTENSITY_BASE).toBeGreaterThanOrEqual(60);
  });
});

// ─── FR1: Card base renders BlurView ─────────────────────────────────────────

describe('Card — FR1: base glass layer renders BlurView', () => {
  function findBlurViews(node: any): any[] {
    if (!node) return [];
    const results: any[] = [];
    if (node.type === 'BlurView') results.push(node);
    if (node.children) {
      for (const child of node.children) {
        results.push(...findBlurViews(child));
      }
    }
    return results;
  }

  it('FR1.7 — base Card renders at least one BlurView', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(Card, null, 'child'));
    });
    const blurViews = findBlurViews(tree.toJSON());
    expect(blurViews.length).toBeGreaterThan(0);
  });

  it('FR1.8 — base BlurView has intensity ≥ 60 (01-ambient-layer: increased for ambient sampling)', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(Card, null, 'child'));
    });
    const blurViews = findBlurViews(tree.toJSON());
    expect(blurViews[0].props.intensity).toBeGreaterThanOrEqual(60);
  });

  it('FR1.9 — source has overflow hidden in OUTER_STYLE (reliable source check)', () => {
    // Runtime style assertions are unreliable in this NativeWind test env —
    // style objects may be registered as numeric IDs. Use source analysis.
    const source = fs.readFileSync(CARD_FILE, 'utf8');
    expect(source).toContain("overflow: 'hidden'");
  });

  it('FR1.10 — source has borderRadius 16 in OUTER_STYLE (reliable source check)', () => {
    const source = fs.readFileSync(CARD_FILE, 'utf8');
    expect(source).toContain('borderRadius: 16');
  });
});

// ─── FR2: GLASS_ELEVATED constant ────────────────────────────────────────────

describe('Card — FR2: GLASS_ELEVATED exported constant', () => {
  it('FR2.1 — GLASS_ELEVATED is exported', () => {
    expect(GLASS_ELEVATED).toBeDefined();
  });

  it('FR2.2 — GLASS_ELEVATED.backgroundColor is semi-transparent (contains rgba)', () => {
    expect(GLASS_ELEVATED.backgroundColor).toMatch(/rgba/i);
  });

  it('FR2.3 — GLASS_ELEVATED.backgroundColor is different from GLASS_BASE', () => {
    expect(GLASS_ELEVATED.backgroundColor).not.toBe(GLASS_BASE.backgroundColor);
  });

  it('FR2.4 — GLASS_ELEVATED.borderColor matches GLASS_BASE borderColor', () => {
    expect(GLASS_ELEVATED.borderColor).toBe(GLASS_BASE.borderColor);
  });

  it('FR2.5 — BLUR_INTENSITY_ELEVATED is ≥ 80 (01-ambient-layer: increased for ambient sampling)', () => {
    expect(BLUR_INTENSITY_ELEVATED).toBeGreaterThanOrEqual(80);
  });
});

// ─── FR2: elevated BlurView intensity ────────────────────────────────────────

describe('Card — FR2: elevated variant uses intensity 60', () => {
  function findBlurViews(node: any): any[] {
    if (!node) return [];
    const results: any[] = [];
    if (node.type === 'BlurView') results.push(node);
    if (node.children) {
      for (const child of node.children) {
        results.push(...findBlurViews(child));
      }
    }
    return results;
  }

  it('FR2.6 — elevated Card renders BlurView with intensity ≥ 80 (01-ambient-layer)', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(Card, { elevated: true }, 'elevated child'));
    });
    const blurViews = findBlurViews(tree.toJSON());
    expect(blurViews.length).toBeGreaterThan(0);
    expect(blurViews[0].props.intensity).toBeGreaterThanOrEqual(80);
  });
});

// ─── FR3: glass={false} opt-out ──────────────────────────────────────────────

describe('Card — FR3: glass opt-out prop', () => {
  function findBlurViews(node: any): any[] {
    if (!node) return [];
    const results: any[] = [];
    if (node.type === 'BlurView') results.push(node);
    if (node.children) {
      for (const child of node.children) {
        results.push(...findBlurViews(child));
      }
    }
    return results;
  }

  it('FR3.1 — glass={false} renders no BlurView', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(Card, { glass: false }, 'flat child'));
    });
    const blurViews = findBlurViews(tree.toJSON());
    expect(blurViews.length).toBe(0);
  });

  it('FR3.2 — glass={false} still renders children', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(Card, { glass: false }, 'flat child'));
    });
    expect(JSON.stringify(tree.toJSON())).toContain('flat child');
  });

  it('FR3.3 — glass={true} (default) renders BlurView', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(Card, { glass: true }, 'glass child'));
    });
    const blurViews = findBlurViews(tree.toJSON());
    expect(blurViews.length).toBeGreaterThan(0);
  });

  it('FR3.4 — className prop is accepted without crash in both modes', () => {
    expect(() => {
      act(() => {
        create(React.createElement(Card, { glass: false, className: 'mt-4' }, 'child'));
      });
    }).not.toThrow();
    expect(() => {
      act(() => {
        create(React.createElement(Card, { glass: true, className: 'mt-4' }, 'child'));
      });
    }).not.toThrow();
  });
});

// ─── Source file static checks (updated for 02-dark-glass) ───────────────────

describe('Card — source file structure checks', () => {
  let source: string;
  let noComments: string;

  beforeAll(() => {
    source = fs.readFileSync(CARD_FILE, 'utf8');
    noComments = source
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  });

  it('SC1.2 — source contains bg-surface class string (for glass=false fallback)', () => {
    expect(source).toContain('bg-surface');
  });

  it('SC1.2 — source contains rounded-2xl class string', () => {
    expect(source).toContain('rounded-2xl');
  });

  it('SC1.3 — source contains bg-surfaceElevated class string (for elevated glass=false)', () => {
    expect(source).toContain('bg-surfaceElevated');
  });

  it('SC1.4 — source accepts className prop', () => {
    expect(source).toMatch(/className/);
  });

  it('SC1.5 — code does not use StyleSheet.create (outside comments)', () => {
    expect(noComments).not.toContain('StyleSheet.create');
  });

  it('SC2.1 — source exports GLASS_BASE constant', () => {
    expect(source).toContain('GLASS_BASE');
  });

  it('SC2.2 — source exports GLASS_ELEVATED constant', () => {
    expect(source).toContain('GLASS_ELEVATED');
  });

  it('SC2.3 — source imports BlurView from expo-blur', () => {
    expect(source).toContain('expo-blur');
    expect(source).toContain('BlurView');
  });

  it('SC2.4 — source uses rgba white border colour', () => {
    // Value may be 0.06 or 0.10 depending on design iteration — check pattern only
    expect(source).toMatch(/rgba\(255, 255, 255, 0\.\d+\)/);
  });

  it('SC2.5 — source uses StyleSheet.absoluteFill (for blur positioning)', () => {
    expect(source).toContain('StyleSheet.absoluteFill');
  });
});

// ─── FR3 (01-ambient-layer): GLASS_BASE opacity ───────────────────────────────

describe('Card — FR3 (01-ambient-layer): GLASS_BASE opacity reduction', () => {
  it('FR3-ambient.1 — GLASS_BASE.backgroundColor alpha is ≤ 0.15', () => {
    // Extract alpha value from rgba(r, g, b, alpha)
    const match = GLASS_BASE.backgroundColor.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
    expect(match).not.toBeNull();
    const alpha = parseFloat(match![1]);
    expect(alpha).toBeLessThanOrEqual(0.15);
  });

  it('FR3-ambient.2 — GLASS_ELEVATED.backgroundColor alpha is ≤ 0.20', () => {
    const match = GLASS_ELEVATED.backgroundColor.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
    expect(match).not.toBeNull();
    const alpha = parseFloat(match![1]);
    expect(alpha).toBeLessThanOrEqual(0.20);
  });
});
