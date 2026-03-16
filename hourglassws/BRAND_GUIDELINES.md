# Hourglass — Brand & Design System Guidelines

> **Version 1.1** · Last updated 2026-03-15
> *Changes from v1.0: hued base palette, Inter variable font consolidation, radial panel gradients, dark glass surface system, violet as interactive accent, cyan evolution*

---

## Mission Statement

Hourglass exists to answer one question in under three seconds: *where does my week stand, and where is it heading?*

Everything in the design — the dark glass canvas, the prominent numbers, the colour-coded panel states — serves that goal. Data is the product. The UI is the frame. The frame should never compete with the picture.

---

## App Identity

**Name:** Hourglass
**Category:** Work dashboard / productivity
**Audience:** Crossover contractors (contributors and managers)
**Tone:** Confident, precise, premium. The app of someone who takes their output seriously.
**Reference aesthetics:** Oura Ring app · Revolut · Linear · Arc Browser · Raycast
**One-sentence design brief:** Dark glass dashboard where numbers are the hero, panels radiate colour to telegraph week status at a glance, and every interaction feels satisfying and immediate.

---

## Colour System

### Philosophy

The palette is built around a deep, hued-black canvas that makes coloured data pop without visual fatigue. The background is not generic near-black — it has a subtle eggplant undertone that makes accents feel warmer and the whole app feel more owned. Semantic accent colours carry meaning — do not use them decoratively. Surface colours create depth through layering, supported by blur and noise.

### Base Palette

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0D0C14` | App background, screen fill — deep eggplant, not generic black |
| `surface` | `#16151F` | Default card background |
| `surfaceElevated` | `#1F1E29` | Modals, bottom sheets, popovers, active card state |
| `border` | `#2F2E41` | Card borders, dividers, input outlines |

> **Why eggplant, not black:** `#0A0A0F` is forgettable. `#0D0C14` has a barely-there violet undertone that makes it feel intentional and gives the accent colours — gold, cyan, violet — a warmer, richer surface to sit on. The difference is subtle on paper, dramatic in practice.

### Accent Colours

| Token | Hex | Semantic role |
|---|---|---|
| `gold` | `#E8C97A` | Earnings, salary, money values. Primary brand accent. |
| `goldBright` | `#FFDF89` | Hero earnings moments — use as gradient endpoint with `gold` |
| `cyan` | `#00C2FF` | AI usage percentage, AI-related metrics — slightly more electric than v1.0 |
| `violet` | `#A78BFA` | BrainLift hours, deep-work metrics. Also the primary interactive accent (buttons, focused states). |
| `success` | `#10B981` | On-track status, completed items, positive deltas |
| `warning` | `#F59E0B` | Behind-pace status, caution states, soft alerts |
| `critical` | `#F43F5E` | Critical behind-pace, overdue approvals, urgent alerts |
| `destructive` | `#F85149` | Destructive actions (delete, reject), irreversible operations |

### Text Colours

| Token | Hex | Usage |
|---|---|---|
| `textPrimary` | `#FFFFFF` | Hero numbers, headings, primary labels |
| `textSecondary` | `#8B949E` | Supporting labels, metadata, secondary values |
| `textMuted` | `#484F58` | Placeholder text, disabled states, fine print |

### Colour Usage Rules

1. **Gold is for money only.** `gold` and `goldBright` mean currency. When a user sees gold, they think earnings. The settings toggle, deadline banners, navigation — none of these are gold.
2. **Cyan is for AI only.** `cyan` = AI usage percentage. Not a general highlight colour.
3. **Violet is for BrainLift AND interactive UI.** `violet` doubles as the primary interactive accent for buttons, pressed states, and focused elements. This makes the whole app feel cohesive — the BrainLift accent and the interaction accent are the same family.
4. **Status colours carry meaning.** `success`, `warning`, `critical` map to week pace states. Using `success` green decoratively will confuse users.
5. **`destructive` vs `critical`:** `critical` is informational (this situation is urgent). `destructive` is action-driven (this button will permanently do something).
6. **Never use pure white for large text blocks.** `#FFFFFF` is reserved for hero numbers and key labels. Body text uses `textSecondary`.
7. **Borders should whisper.** `#2F2E41` is intentionally subtle. Cards are defined by their surface colour and content, not heavy outlines.

---

## Panel Gradient States

Panels shift their background gradient to signal week status. In v1.1, gradients are **radial** — they emanate from the center of the hero metric, pulling focus to the number while filling the panel with ambient colour. This makes the gradient feel data-connected rather than decorative.

| State | Condition | Gradient |
|---|---|---|
| **On Track** | Hours pace ≥ target | Radial `success` (`#10B981`) at 35% opacity from center → transparent |
| **Behind** | Hours pace 50–99% of target | Radial `warning` (`#F59E0B`) at 35% opacity from center → transparent |
| **Critical** | Hours pace < 50% of target | Radial `critical` (`#F43F5E`) at 35% opacity from center → transparent |
| **Crushed It** | Hours ≥ weekly target met | Radial `gold`→`goldBright` gradient at 35% opacity from center → transparent |
| **Idle** | No data yet / weekend / not started | Flat `surface` (`#16151F`), no gradient |

**Implementation note:** Use a radial gradient centered at the hero number position — roughly top-center of the panel. The gradient should reach 100% coverage at the card edges. Animate state transitions using `springPremium` (see Animation Philosophy). The `springPremium` stiffness should scale with the magnitude of the state change — a drop from On Track to Critical is faster and more dramatic than a slip from On Track to Behind.

---

## Typography System

### Single Variable Font

Hourglass uses **Inter** for everything. One font family, differentiated entirely by weight, size, and letter-spacing. This creates maximum cohesion — the app feels like one unified system, not a collection of parts.

> **Why Inter:** Linear built its entire iconic UI on Inter. It has exceptional legibility, robust `tabular-nums` support, extensive weight range (100–900), and precise number shapes. Three fonts created cognitive friction and inconsistency; Inter eliminates both.

### Type Roles

| Role | Weight | Letter-spacing | Purpose |
|---|---|---|---|
| **Display** | 700–800 | `-0.02em` | Hero numbers, large metric values |
| **Heading** | 600 | `-0.01em` | Card titles, section headers, key labels |
| **UI** | 500 | `0` | Navigation, buttons, active tab labels, form inputs |
| **Body** | 400 | `0` | Secondary labels, metadata, body copy |
| **Muted** | 400 | `0` | Captions, placeholder text, fine print |

### Type Scale

| Name | Size (px) | Line height | Role | Notes |
|---|---|---|---|---|
| `3xl` | 36 | 40 | Display 700–800 | Hero number (e.g., weekly hours) |
| `2xl` | 28 | 34 | Display 700 | Section hero metric |
| `xl` | 22 | 28 | Heading 600 | Card headline, large label |
| `lg` | 18 | 26 | Heading 600 | Subsection heading, prominent value |
| `md` | 16 | 24 | UI 500 | Primary UI label, body |
| `sm` | 14 | 20 | Body 400 | Secondary label, metadata |
| `xs` | 12 | 16 | Muted 400 | Caption, pill badge, fine print |

### Typography Rules

1. **Numeric values use Display weight (700–800) with `tabular-nums`.** Every metric, counter, and data value — hero cards, chart labels, earnings figures, percentages — uses Inter Display. No exceptions.
2. **`tabular-nums` on everything that changes.** `fontVariant: ['tabular-nums']` prevents horizontal jitter when values update. Apply it to all metric displays, not just animated ones.
3. **Button labels use UI weight (500–600).** Actionable, not decorative.
4. **AI insights and explanatory copy use Body weight (400)** with slightly increased line height (`1.6`) for readability.
5. **Letter-spacing tightens at large sizes.** Display gets `-0.02em`, Heading gets `-0.01em`, everything else is `0`.

---

## Spacing Philosophy

Hourglass uses the **Tailwind default 4px base scale** with no modifications.

**Key spacing habits:**

- Card internal padding: `p-5` (20px) or `p-6` (24px) — never less than `p-4`
- Gap between cards/sections: `gap-4` (16px) to `gap-6` (24px)
- Gap between a label and its value within a card: `gap-1` or `gap-2`
- Screen horizontal padding: `px-4` (16px) — consistent edge-to-edge breathing room
- Stack spacing within a list: `gap-3` (12px)

**The airy principle:** If a layout looks dense, add spacing before removing content. Premium apps breathe. Numbers need white space around them to feel authoritative.

---

## Border Radius Rules

| Context | Token | px value |
|---|---|---|
| Cards, panels, large containers | `rounded-2xl` | 16px |
| Buttons, inputs, small modals | `rounded-xl` | 12px |
| Pills, status badges, small chips | `rounded-full` | 9999px |
| Inner elements within cards | `rounded-lg` | 8px |

**Rule:** Do not use `rounded-md` (6px) or smaller — it reads as a browser default, not a design decision. The minimum intentional radius is `rounded-lg` (8px).

---

## Surface & Depth — The Dark Glass System

The design brief says "dark glass dashboard." This section defines how to deliver it. Glass is not just a dark background — it is layered, blurred, textured, and glowing.

### Layering

Depth is created through three surface tiers, not shadows:

| Layer | Token | Usage |
|---|---|---|
| Canvas | `background` `#0D0C14` | Screen fill. Never place content directly here without a card. |
| Card | `surface` `#16151F` | All data cards and primary content. |
| Elevated | `surfaceElevated` `#1F1E29` | Modals, bottom sheets, tooltips, active states. |

### Backdrop Blur (Glass Effect)

Modals, bottom sheets, and `surfaceElevated` panels should use **backdrop blur** to deliver the glass aesthetic:

```
background: hsla(248, 15%, 10%, 0.75)
backdrop-filter: blur(16px)
border: 1px solid rgba(255, 255, 255, 0.06)
```

This creates a translucent panel that reveals depth behind it. On React Native, use `BlurView` from `expo-blur` with `intensity={40}` and `tint="dark"`.

### Noise Texture

Apply a subtle static noise overlay over the entire app background to add tactile quality:

- Use a semi-transparent noise PNG at `opacity: 0.03–0.05`
- Alternatively use a shader-based noise at the same opacity
- This is the difference between "dark mode" and "dark glass" — Linear, Arc, and Raycast all use this technique

### Gradient Borders

For focused or active panels, replace the plain `border` with a gradient border:

```
border: 1px solid transparent
background-clip: padding-box
background-image: linear-gradient(surface, surface),
                  linear-gradient(135deg, violet 0%, transparent 60%)
```

The gradient border glows violet on focus, fades to invisible at rest. On React Native, achieve this with a wrapping `LinearGradient` at 1px padding.

### Coloured Glows

Elevated panels in status states should emit a coloured glow, not a hard shadow:

- **On Track panel:** Soft `success` green glow — `shadowColor: '#10B981'`, `shadowOpacity: 0.15`, `shadowRadius: 20`
- **Critical panel:** Deep `critical` red glow — `shadowColor: '#F43F5E'`, `shadowOpacity: 0.2`, `shadowRadius: 24`
- **Crushed It panel:** Warm `gold` glow — `shadowColor: '#E8C97A'`, `shadowOpacity: 0.2`, `shadowRadius: 24`

---

## Component Personality

### Card-First Layout

Every major data unit lives in a card. Cards are the atomic unit of the dashboard. They:
- Have a `surface` (`#16151F`) background
- Use `border` (`#2F2E41`) with 1px width
- Use `rounded-2xl` (16px) radius
- Have `p-5` or `p-6` internal padding
- May optionally carry a radial panel gradient overlay for status-driven panels
- May use a gradient border for focused/active states

### Airy Density

The layout is generous, not compact. Every card should feel like it has room to breathe.

### Number Hierarchy

Within any card:
1. **Hero value** — Display 700–800, `textPrimary`, `tabular-nums`
2. **Supporting metric** — Heading 600 or Display 700, `textSecondary`
3. **Label / caption** — Body 400, `textMuted`

The eye lands on the number first, then finds context from the label below.

### Interactive Elements

Buttons and tappable elements use `violet` as their primary interactive accent:
- Default state: `surface` background, `violet` text or border
- Pressed state: `scale(0.96)` via `timingInstant` + slight `violet` glow
- Active/selected: `violet` background at 15–20% opacity

This ties interactive states to the BrainLift accent, creating an analogous, cohesive palette across the whole app.

---

## Animation Philosophy

Animation serves communication, not entertainment. Every animated element should feel like it has physical weight and intention.

### Two Animation Personalities

**Springs → transitions, interactions, structure**
Cards appearing, panels opening, modals sliding in, navigation transitions. Springs feel alive because they simulate physics — the slight overshoot tells the user something arrived, not just appeared.

**Timing curves → data, charts, fills**
Progress bars filling, chart bars growing, percentage counters. These should feel precise — like a gauge settling to its reading. Springs on data fills feel uncontrolled.

### Personality Calibration

- **Snappy:** Fast, decisive. Navigation, small UI responses.
- **Bouncy:** Alive, confident, a touch of delight. Cards appearing, panel expansion.
- **Premium:** Unhurried, smooth, authoritative. Hero panels, modal sheets. The "Revolut card flip" feeling.

### Animation Rules

1. Never animate colour alone — pair colour transitions with a subtle scale or opacity shift.
2. Panel gradient state changes use `springPremium`. The spring stiffness scales with the magnitude of the state change — a drop from On Track to Critical is faster and more dramatic than a slip from On Track to Behind.
3. List items that enter staggered use `springBouncy` with a 50ms delay multiplied by index, capped at 300ms total stagger.
4. Button press feedback uses `timingInstant` scale (0.96) — immediate, tactile. Follow with a brief `violet` radial glow (opacity 0.15 → 0, 200ms).
5. Loading skeletons pulse with `timingSmooth` opacity — slow enough to be calm, not anxious.
6. Tab navigation transitions use `springSnappy` — decisive, not sluggish. Never use a plain cross-fade.
7. All animations must have a `useReducedMotion` fallback that shows the end state instantly.

---

## Do's and Don'ts

### Do
- Lead with the number, follow with the label
- Use status colours only for their designated semantic meaning
- Keep cards padded and spacious
- Use Inter Display weight for every metric value, with `tabular-nums`
- Animate with purpose — every animation communicates something
- Keep the background dark and hued; let accent colours guide attention
- Use backdrop-blur on modals and elevated panels
- Use `violet` for interactive states (buttons, focus, pressed)
- Use radial gradients on status panels, centered on the hero metric

### Don't
- Don't use `gold` for non-earnings elements — not toggles, not highlights, not decoration
- Don't put more than one hero number per card
- Don't use gradients decoratively — they have semantic meaning
- Don't use `rounded-md` or smaller — minimum is `rounded-lg`
- Don't spring-animate chart fills or progress bars — use timing curves
- Don't use light text on light surfaces
- Don't use the old three-font stack — Inter only
- Don't animate without a `useReducedMotion` fallback

---

## Panel State Reference Table

| State | Token | Hex | Gradient type | Opacity | Trigger condition |
|---|---|---|---|---|---|
| On Track | `success` | `#10B981` | Radial from hero metric center | 35% | Current pace ≥ weekly target pace |
| Behind | `warning` | `#F59E0B` | Radial from hero metric center | 35% | Current pace 50–99% of target |
| Critical | `critical` | `#F43F5E` | Radial from hero metric center | 35% | Current pace < 50% of target |
| Crushed It | `gold`→`goldBright` | `#E8C97A`→`#FFDF89` | Radial gold gradient from hero metric center | 35% | Weekly hour target fully met |
| Idle | — | — | None (flat `surface`) | 0% | No data, weekend, week not started |

---

*Hourglass Design System v1.1 — maintained alongside the codebase in `BRAND_GUIDELINES.md`*
*Previous version: v1.0 (2026-03-14) — archived at `docs/brand-guidelines-v1.0.md`*
