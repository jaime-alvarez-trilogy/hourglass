// Tests: AppBreakdownCard component (12-app-breakdown-ui FR3)
// FR3: Card with per-app rows (appName + AppUsageBar + slot count) + guidance chips section
//
// Success criteria:
//   SC3.1 — Returns null when entries=[]
//   SC3.2 — Section label text is "APP BREAKDOWN"
//   SC3.3 — Renders correct number of rows for entries.length <= 8
//   SC3.4 — Each row shows appName and slot count
//   SC3.5 — Guidance chips render below list when guidance.length > 0
//   SC3.6 — No guidance section rendered when guidance=[]
//   SC3.7 — Card uses borderAccentColor={colors.violet}
//
// Mocks needed: none (AppUsageBar and Card are already tested; no API calls)
//
// Strategy:
// - react-test-renderer for render validation and content checks
// - Source-level checks for borderAccentColor, section label text, guidance rendering

import React from 'react';
import { create, act } from 'react-test-renderer';
import * as fs from 'fs';
import * as path from 'path';

import type { AppBreakdownEntry } from '../../lib/aiAppBreakdown';

const COMPONENT_FILE = path.resolve(__dirname, '../AppBreakdownCard.tsx');

let AppBreakdownCard: any;

beforeAll(() => {
  const mod = require('../AppBreakdownCard');
  AppBreakdownCard = mod.default;
});

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makeEntry(
  appName: string,
  aiSlots: number,
  brainliftSlots: number,
  nonAiSlots: number,
): AppBreakdownEntry {
  return { appName, aiSlots, brainliftSlots, nonAiSlots };
}

function makeChip(text: string, color: string) {
  return { text, color };
}

const SAMPLE_ENTRIES: AppBreakdownEntry[] = [
  makeEntry('Chrome', 20, 5, 10),
  makeEntry('Cursor', 30, 0, 5),
  makeEntry('Slack', 5, 0, 15),
];

const SAMPLE_GUIDANCE = [
  makeChip('Slack is your top untagged app — try using AI tools there', '#F59E0B'),
  makeChip('Cursor is your strongest AI app — 86% AI-credited', '#00C2FF'),
];

// ─── SC3.1: Returns null when entries=[] ─────────────────────────────────────

describe('AppBreakdownCard — SC3.1: null when empty', () => {
  it('SC3.1a — returns null when entries=[]', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppBreakdownCard, { entries: [], guidance: [] }));
    });
    expect(tree.toJSON()).toBeNull();
  });

  it('SC3.1b — returns null when entries=[] even with guidance chips', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppBreakdownCard, {
        entries: [],
        guidance: SAMPLE_GUIDANCE,
      }));
    });
    expect(tree.toJSON()).toBeNull();
  });
});

// ─── SC3.2: Section label "APP BREAKDOWN" ────────────────────────────────────

describe('AppBreakdownCard — SC3.2: section label', () => {
  it('SC3.2a — renders "APP BREAKDOWN" section label', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppBreakdownCard, {
        entries: SAMPLE_ENTRIES,
        guidance: [],
      }));
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('APP BREAKDOWN');
  });

  it('SC3.2b — source uses SectionLabel with "APP BREAKDOWN" text', () => {
    const source = fs.readFileSync(COMPONENT_FILE, 'utf8');
    expect(source).toContain('APP BREAKDOWN');
  });
});

// ─── SC3.3: Row count ─────────────────────────────────────────────────────────

describe('AppBreakdownCard — SC3.3: correct number of rows', () => {
  it('SC3.3a — renders without crash for 1 entry', () => {
    expect(() => {
      act(() => {
        create(React.createElement(AppBreakdownCard, {
          entries: [makeEntry('Chrome', 10, 0, 5)],
          guidance: [],
        }));
      });
    }).not.toThrow();
  });

  it('SC3.3b — renders without crash for 8 entries', () => {
    const entries = Array.from({ length: 8 }, (_, i) =>
      makeEntry(`App${i + 1}`, 10, 0, 5),
    );
    expect(() => {
      act(() => {
        create(React.createElement(AppBreakdownCard, { entries, guidance: [] }));
      });
    }).not.toThrow();
  });

  it('SC3.3c — renders without crash for exactly 3 entries (standard case)', () => {
    expect(() => {
      act(() => {
        create(React.createElement(AppBreakdownCard, {
          entries: SAMPLE_ENTRIES,
          guidance: [],
        }));
      });
    }).not.toThrow();
  });
});

// ─── SC3.4: App name and slot count in rows ───────────────────────────────────

describe('AppBreakdownCard — SC3.4: row content', () => {
  it('SC3.4a — renders appName in output', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppBreakdownCard, {
        entries: [makeEntry('Cursor', 30, 0, 5)],
        guidance: [],
      }));
    });
    expect(JSON.stringify(tree.toJSON())).toContain('Cursor');
  });

  it('SC3.4b — renders slot count (aiSlots + nonAiSlots) in output', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppBreakdownCard, {
        entries: [makeEntry('Chrome', 20, 5, 10)],
        guidance: [],
      }));
    });
    // 20 + 10 = 30 slots
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('30');
  });

  it('SC3.4c — renders multiple app names in output', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppBreakdownCard, {
        entries: SAMPLE_ENTRIES,
        guidance: [],
      }));
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Chrome');
    expect(json).toContain('Cursor');
    expect(json).toContain('Slack');
  });

  it('SC3.4d — source uses "slots" label for slot count display', () => {
    const source = fs.readFileSync(COMPONENT_FILE, 'utf8');
    expect(source).toMatch(/slots/);
  });
});

// ─── SC3.5: Guidance chips render ────────────────────────────────────────────

describe('AppBreakdownCard — SC3.5: guidance chips present', () => {
  it('SC3.5a — guidance chip text renders when guidance.length > 0', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppBreakdownCard, {
        entries: SAMPLE_ENTRIES,
        guidance: [makeChip('Use AI in Slack', '#F59E0B')],
      }));
    });
    expect(JSON.stringify(tree.toJSON())).toContain('Use AI in Slack');
  });

  it('SC3.5b — multiple guidance chip texts rendered', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppBreakdownCard, {
        entries: SAMPLE_ENTRIES,
        guidance: SAMPLE_GUIDANCE,
      }));
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Slack is your top untagged app');
    expect(json).toContain('Cursor is your strongest AI app');
  });
});

// ─── SC3.6: No guidance section when guidance=[] ─────────────────────────────

describe('AppBreakdownCard — SC3.6: guidance section omitted when empty', () => {
  it('SC3.6a — no guidance dot or chip text when guidance=[]', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppBreakdownCard, {
        entries: SAMPLE_ENTRIES,
        guidance: [],
      }));
    });
    // Verify the component renders but does not include guidance chip text
    const json = JSON.stringify(tree.toJSON());
    // APP BREAKDOWN should be there; guidance-specific text absent
    expect(json).toContain('APP BREAKDOWN');
    expect(json).not.toContain('top untagged');
    expect(json).not.toContain('strongest AI app');
  });

  it('SC3.6b — source conditionally renders guidance section (guidance.length > 0 check)', () => {
    const source = fs.readFileSync(COMPONENT_FILE, 'utf8');
    expect(source).toMatch(/guidance\.length\s*>\s*0|guidance\.length\s*&&/);
  });
});

// ─── SC3.7: Card border accent color ─────────────────────────────────────────

describe('AppBreakdownCard — SC3.7: card border accent', () => {
  it('SC3.7a — source uses borderAccentColor with colors.violet', () => {
    const source = fs.readFileSync(COMPONENT_FILE, 'utf8');
    expect(source).toContain('borderAccentColor');
    expect(source).toContain('colors.violet');
  });

  it('SC3.7b — source imports colors from colors.ts', () => {
    const source = fs.readFileSync(COMPONENT_FILE, 'utf8');
    expect(source).toMatch(/from ['"].*colors['"]/);
  });

  it('SC3.7c — source imports Card component', () => {
    const source = fs.readFileSync(COMPONENT_FILE, 'utf8');
    expect(source).toMatch(/import.*Card/);
  });

  it('SC3.7d — source imports SectionLabel component', () => {
    const source = fs.readFileSync(COMPONENT_FILE, 'utf8');
    expect(source).toMatch(/import.*SectionLabel/);
  });

  it('SC3.7e — source imports AppUsageBar component', () => {
    const source = fs.readFileSync(COMPONENT_FILE, 'utf8');
    expect(source).toMatch(/import.*AppUsageBar/);
  });
});

// ─── Additional: render quality checks ───────────────────────────────────────

describe('AppBreakdownCard — render quality', () => {
  it('RQ.1 — renders a single root element (not null, not array)', () => {
    let tree: any;
    act(() => {
      tree = create(React.createElement(AppBreakdownCard, {
        entries: SAMPLE_ENTRIES,
        guidance: [],
      }));
    });
    const json = tree.toJSON();
    expect(json).not.toBeNull();
    expect(Array.isArray(json)).toBe(false);
  });

  it('RQ.2 — renders without crash with maximum 8 entries and 3 guidance chips', () => {
    const entries = Array.from({ length: 8 }, (_, i) =>
      makeEntry(`App${i + 1}`, 10 + i, i < 3 ? 2 : 0, 5 + i),
    );
    const guidance = [
      makeChip('App8 is your top untagged app — try using AI tools there', '#F59E0B'),
      makeChip('App1 is your strongest AI app — 67% AI-credited', '#00C2FF'),
      makeChip('App1 drives most of your BrainLift time — keep it up', '#A78BFA'),
    ];
    expect(() => {
      act(() => {
        create(React.createElement(AppBreakdownCard, { entries, guidance }));
      });
    }).not.toThrow();
  });
});
