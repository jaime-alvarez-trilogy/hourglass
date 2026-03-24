// Tests: AppUsageBar component (12-app-breakdown-ui FR1)
// FR1: Three-segment static bar (violet/cyan/grey) showing BrainLift, AI-only, non-AI proportions
//
// Strategy:
// - Source-level checks for segment logic, color tokens, clamping
// - react-test-renderer for render validation (no crash, renders output)
//
// Note: NativeWind className not used for segment colors — inline backgroundColor
// is the reliable path in this codebase (per ProgressBar.tsx pattern).

import React from 'react';
import { create, act } from 'react-test-renderer';
import * as fs from 'fs';
import * as path from 'path';

const COMPONENT_FILE = path.resolve(__dirname, '../AppUsageBar.tsx');

let AppUsageBar: any;

beforeAll(() => {
  const mod = require('../AppUsageBar');
  AppUsageBar = mod.default;
});

// ─── FR1: Happy path renders ──────────────────────────────────────────────────

describe('AppUsageBar — FR1: happy path renders', () => {
  it('FR1.1 — renders without crash with all three segments', () => {
    expect(() => {
      act(() => {
        create(React.createElement(AppUsageBar, { aiSlots: 60, brainliftSlots: 30, nonAiSlots: 10 }));
      });
    }).not.toThrow();
  });

  it('FR1.2 — renders without crash when brainliftSlots=0', () => {
    expect(() => {
      act(() => {
        create(React.createElement(AppUsageBar, { aiSlots: 50, brainliftSlots: 0, nonAiSlots: 20 }));
      });
    }).not.toThrow();
  });

  it('FR1.3 — renders without crash when all non-AI', () => {
    expect(() => {
      act(() => {
        create(React.createElement(AppUsageBar, { aiSlots: 0, brainliftSlots: 0, nonAiSlots: 40 }));
      });
    }).not.toThrow();
  });

  it('FR1.4 — renders without crash with all-zero inputs', () => {
    expect(() => {
      act(() => {
        create(React.createElement(AppUsageBar, { aiSlots: 0, brainliftSlots: 0, nonAiSlots: 0 }));
      });
    }).not.toThrow();
  });

  it('FR1.5 — renders a View element (not null)', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppUsageBar, { aiSlots: 30, brainliftSlots: 10, nonAiSlots: 20 }));
    });
    expect(tree.toJSON()).not.toBeNull();
  });
});

// ─── FR1: Source-level segment logic checks ───────────────────────────────────

describe('AppUsageBar — FR1: source-level segment logic', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(COMPONENT_FILE, 'utf8');
  });

  it('FR1.6 — source clamps aiOnlySlots using Math.max(0, aiSlots - brainliftSlots)', () => {
    // Defensive clamp prevents negative flex
    expect(source).toMatch(/Math\.max\s*\(\s*0\s*,\s*aiSlots\s*-\s*brainliftSlots\s*\)/);
  });

  it('FR1.7 — source omits violet segment when brainliftSlots=0 (conditional render)', () => {
    // Violet segment conditionally rendered
    expect(source).toMatch(/brainliftSlots\s*(>|===|!==)\s*0/);
  });

  it('FR1.8 — source uses colors.violet for brainlift segment', () => {
    expect(source).toContain('colors.violet');
  });

  it('FR1.9 — source uses colors.cyan for AI-only segment', () => {
    expect(source).toContain('colors.cyan');
  });

  it('FR1.10 — source uses colors.border for non-AI segment', () => {
    expect(source).toContain('colors.border');
  });

  it('FR1.11 — source uses inline backgroundColor (not only NativeWind className) for segment colors', () => {
    // Per codebase pattern (ProgressBar.tsx): NativeWind className is unreliable for Animated.View color;
    // inline style is required. For plain View, inline is also used here for consistency.
    expect(source).toContain('backgroundColor');
  });

  it('FR1.12 — source uses flexDirection row for outer container', () => {
    expect(source).toMatch(/flexDirection.*row|row.*flexDirection/);
  });

  it('FR1.13 — source uses default height of 4', () => {
    expect(source).toMatch(/height\s*=\s*4/);
  });

  it('FR1.14 — source handles all-zero case (empty bar fallback)', () => {
    // When all inputs are zero, a single grey segment should render
    // Look for the all-zero check or a fallback flex=1
    const hasAllZeroGuard = /aiSlots.*===.*0.*brainliftSlots.*===.*0.*nonAiSlots.*===.*0/.test(source) ||
                             /aiSlots \+ brainliftSlots \+ nonAiSlots/.test(source) ||
                             source.includes('flex: 1');
    expect(hasAllZeroGuard).toBe(true);
  });

  it('FR1.15 — source has borderRadius for pill shape', () => {
    expect(source).toContain('borderRadius');
  });

  it('FR1.16 — source imports colors from colors.ts', () => {
    expect(source).toMatch(/from ['"].*colors['"]/);
  });
});

// ─── FR1: Segment structure via test-renderer ─────────────────────────────────

describe('AppUsageBar — FR1: segment structure', () => {
  it('FR1.17 — with brainliftSlots=0, renders fewer children than with brainliftSlots>0', () => {
    let treeWith: any;
    let treeWithout: any;

    act(() => {
      treeWith = create(React.createElement(AppUsageBar, {
        aiSlots: 60, brainliftSlots: 30, nonAiSlots: 10,
      }));
    });

    act(() => {
      treeWithout = create(React.createElement(AppUsageBar, {
        aiSlots: 60, brainliftSlots: 0, nonAiSlots: 10,
      }));
    });

    const withStr = JSON.stringify(treeWith.toJSON());
    const withoutStr = JSON.stringify(treeWithout.toJSON());

    // With brainlift: violet segment present → more Views / more violet color
    expect(withStr).toContain('"#A78BFA"'); // colors.violet
    // Without brainlift: violet segment absent → no violet color
    expect(withoutStr).not.toContain('"#A78BFA"');
  });

  it('FR1.18 — all-AI bar (nonAiSlots=0) renders without grey segment being dominant', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppUsageBar, {
        aiSlots: 50, brainliftSlots: 0, nonAiSlots: 0,
      }));
    });
    // Renders without crash; cyan color present
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('"#00C2FF"'); // colors.cyan
  });

  it('FR1.19 — height prop accepted without crash', () => {
    expect(() => {
      act(() => {
        create(React.createElement(AppUsageBar, {
          aiSlots: 20, brainliftSlots: 0, nonAiSlots: 10, height: 8,
        }));
      });
    }).not.toThrow();
  });

  it('FR1.20 — brainliftSlots > aiSlots does not throw (defensive clamp)', () => {
    expect(() => {
      act(() => {
        create(React.createElement(AppUsageBar, {
          aiSlots: 5, brainliftSlots: 20, nonAiSlots: 10,
        }));
      });
    }).not.toThrow();
  });
});
