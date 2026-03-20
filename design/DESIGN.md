# NomMigo Design System — v1.0

## 1. Overview & Creative North Star

**Creative North Star: "The Playful Epicurean"**

NomMigo is a food companion, not a calorie counter. The design system reflects this by rejecting the clinical grids, circular progress rings, and sterile whites of traditional fitness apps. Instead, we build an interface that feels like a dinner party with your smartest friend — warm, social, opinionated, and fun.

The aesthetic is defined by **Soft Brutalism**: bold, oversized typography paired with hyper-rounded forms and generous whitespace. Elements should feel buoyant — floating on warm surfaces rather than locked into rigid grids. We use **intentional asymmetry** to break the template look: hero images that bleed off card edges, dramatic type scale jumps, and overlapping depth layers.

The goal is Duolingo energy refined through a lifestyle lens: playful enough to be a friend, polished enough to be a gourmet authority.

---

## 2. Color Palette

Our palette is rooted in appetite-stimulating warmth. We strictly avoid cool tones, purple tints, lavender, and clinical grays. If a screen feels "cold," you've used the wrong surface token.

### Core Tokens (Exact Values — Do Not Modify)

| Token | Hex | Usage |
|:---|:---|:---|
| **Signature** | `#FF6B6B` | Primary CTAs, logo, key actions, nav active states |
| **Accent** | `#FFA62B` | Highlights, badges, AI-powered features, discovery elements |
| **Background** | `#FFFAF5` | Base canvas for all screens |
| **Surface** | `#FFF0E5` | Cards, elevated sections, content containers |
| **Text** | `#1A1A2E` | All headings and body copy (deep navy, NOT black or brown) |
| **Success** | `#4ECDC4` | Confirmations, macro goals met, positive feedback, achievements |

### Derived Surface Tokens

| Token | Hex | Usage |
|:---|:---|:---|
| `surface` | `#FFFAF5` | Layer 0 — base canvas |
| `surface-container-low` | `#FFF5ED` | Layer 1 — large content sections |
| `surface-container` | `#FFF0E5` | Layer 2 — cards, interactive components |
| `surface-container-high` | `#FFE8D6` | Layer 3 — active/hover states, input backgrounds |
| `surface-container-highest` | `#FFDFC7` | Layer 4 — pressed states, chip backgrounds |
| `surface-container-lowest` | `#FFFFFF` | Layer 5 — high-priority floating cards that need max contrast |

### The "No-Line" Rule

**1px solid borders are strictly prohibited for sectioning content.** Visual boundaries must be defined exclusively through:

- **Background shifts**: Use `surface-container-low` for content areas sitting on the `surface` base
- **Tonal transitions**: A `surface-container-lowest` card on a `surface-container` background creates natural elevation through luminance delta alone
- **Ghost borders**: If accessibility absolutely requires an edge, use `#D4C4B0` at 15% opacity. It should be felt, not seen.

### The Gradient Rule

Primary CTAs should not use flat `#FF6B6B`. Apply a subtle linear gradient from `#FF6B6B` to `#FF8E8E` at 135 degrees for depth and "soul." For floating overlays and navigation, apply glassmorphism: `#FFFAF5` at 80% opacity with a 20px backdrop-blur.

---

## 3. Typography

We use **Plus Jakarta Sans** exclusively across all levels. Its modern, rounded letterforms match the brand's friendly personality while maintaining professional legibility.

### Type Scale

| Token | Size | Weight | Usage |
|:---|:---|:---|:---|
| `display-lg` | 3.5rem (56px) | 800 (ExtraBold) | Hero moments, milestone celebrations, large stats |
| `display-md` | 2.75rem (44px) | 800 (ExtraBold) | Secondary hero text, calorie counts |
| `headline-lg` | 2rem (32px) | 700 (Bold) | Screen titles |
| `headline-md` | 1.75rem (28px) | 700 (Bold) | Section headers |
| `title-lg` | 1.375rem (22px) | 600 (SemiBold) | Card headers, food names |
| `title-md` | 1rem (16px) | 600 (SemiBold) | Subsection titles |
| `body-lg` | 1rem (16px) | 500 (Medium) | Standard body text, descriptions |
| `body-md` | 0.875rem (14px) | 400 (Regular) | Secondary body text |
| `label-lg` | 0.875rem (14px) | 700 (Bold) | Button text, important labels |
| `label-md` | 0.75rem (12px) | 700 (Bold) | ALL-CAPS metadata, category tags, micro-copy |

### Typography Rules

- **Letter spacing**: Tighten display and headline sizes by -2% for a punchier look
- **Label treatment**: `label-md` should always be ALL-CAPS with +5% letter spacing for category tags (e.g., "BREAKFAST," "98% MATCH," "AI SUGGESTED")
- **Line height**: Body text must maintain 1.5 minimum for readability
- **Hierarchy pairing**: Always pair a large headline with a `body-lg` description. Avoid mid-sized layouts — go big or go functional.
- **Color usage**: Headlines use `#1A1A2E`, secondary text uses `#1A1A2E` at 60% opacity, never warm brown or gray

---

## 4. Elevation & Depth

We replace traditional drop shadows with **Tonal Layering** — depth is created by stacking surfaces of different luminance values.

### The Layering Principle

To make a card "pop," don't add a shadow. Place a `surface-container-lowest` (#FFFFFF) card on a `surface-container` (#FFF0E5) background. The luminance difference creates natural visual lift.

### Ambient Shadows

When a card must truly float (AI recommendation cards, the floating nav bar), use a warm-tinted shadow:

- **Standard float**: `0px 10px 40px rgba(255, 107, 107, 0.08)` — coral-tinted
- **Accent float**: `0px 10px 40px rgba(255, 166, 43, 0.08)` — mango-tinted
- **Heavy float** (nav bar): `0px 20px 50px rgba(255, 107, 107, 0.15)`

Never use gray or black shadows. They feel cold and break the warm palette.

### The Ghost Border

If accessibility requires a visible container edge, use `#D4C4B0` at 15% opacity. Anything more visible is considered "clinical" and must be removed.

---

## 5. Components

### Buttons

| Type | Shape | Background | Text | Notes |
|:---|:---|:---|:---|:---|
| Primary | `border-radius: 9999px` (pill) | Gradient `#FF6B6B` → `#FF8E8E` at 135° | `#FFFFFF` | Coral-tinted ambient shadow |
| Secondary | `border-radius: 9999px` (pill) | `#FFF0E5` | `#FF6B6B` | No border |
| Accent | `border-radius: 9999px` (pill) | `#FFA62B` | `#FFFFFF` | For discovery/social actions |
| Ghost | `border-radius: 9999px` (pill) | Transparent | `#1A1A2E` | Subtle hover fill `#FFF0E5` |

**Micro-interaction**: On press, scale to 0.95 and increase shadow spread. All buttons must feel "squishy."

### Cards

- **Corner radius**: `2rem` (32px) minimum. Featured cards can use `3rem` (48px).
- **No dividers**: Never use horizontal lines inside cards. Separate content groups with `1.5rem` vertical spacing.
- **Internal padding**: Minimum `2rem` (32px) on all sides
- **Food photography**: Images should use `1.5rem` corner radius and may bleed off card edges for depth

### Macro Data Display

- **Circular progress rings are strictly forbidden.**
- Display macros as bold number cards: large `display-md` numeral + small `label-md` unit label
- Use colored pill backgrounds: Protein on `#FF6B6B` background, Carbs on `#FFA62B` background, Fat on `#FFF0E5` background
- Progress indicators use horizontal bars only: `0.5rem` height, `surface-container-high` track, `#FF6B6B` fill

### Input Fields

- **Shape**: Pill-shaped (`border-radius: 9999px`)
- **Background**: `surface-container-high` (#FFE8D6)
- **Focus state**: Background shifts to `surface-container-lowest` (#FFFFFF) with a 2px ghost border in `#FF6B6B` at 40% opacity
- **Labels**: `label-md` in ALL-CAPS with +5% letter spacing above the input

### The NomMigo Bubble

A signature speech bubble component for AI recommendations and tips:

- Background: `#1A1A2E` (dark) for high-impact AI moments
- Text: `#FFFFFF`
- Corner radius: `2rem` with a small triangular tail
- Used for: "NomMigo thinks you'd love...", onboarding tips, achievement celebrations
- The smiley face icon accompanies the bubble as the AI avatar

### Navigation Bar

- **Structure**: 4 tabs — Home, Meal Log, Social, Profile — with a centered expandable action button
- **Action button**: Tapping reveals two options that fan out: "Scan Menu" (camera icon) and "Log Food" (plus icon)
- **Style**: Floating pill bar, `border-radius: 9999px`, glassmorphism background (`#FFFAF5` at 80% + 20px backdrop-blur)
- **Active state**: Signature coral `#FF6B6B` filled icon
- **Inactive state**: `#1A1A2E` at 40% opacity
- **Shadow**: `0px 20px 50px rgba(255, 107, 107, 0.15)`
- **Position**: Fixed, `bottom: 2rem`, centered, 90% max width

---

## 6. Iconography

- **Style**: Rounded terminals, 2.5px stroke weight minimum to match Plus Jakarta Sans
- **Default**: Material Symbols Outlined with `FILL: 0`
- **Active/selected**: Material Symbols Outlined with `FILL: 1`
- **NomMigo expressions**: The smiley face adapts to context:
  - **Happy** (coral `#FF6B6B`): Default state, greeting
  - **Nosh** (mango `#FFA62B`): Eating, logging food, scanning menus
  - **Achievement** (teal `#4ECDC4`): Goals met, streaks, milestones
  - **Social** (navy `#1A1A2E`): Friends, group dining, sharing

---

## 7. Spacing Scale

Base unit: `0.5rem` (8px)

| Token | Value | Usage |
|:---|:---|:---|
| `spacing-1` | 0.25rem (4px) | Tight gaps between inline elements |
| `spacing-2` | 0.5rem (8px) | Icon-to-text gaps |
| `spacing-3` | 1rem (16px) | Related content grouping |
| `spacing-4` | 1.5rem (24px) | Within-card content separation |
| `spacing-6` | 2rem (32px) | Card internal padding |
| `spacing-8` | 2.75rem (44px) | Between cards/components |
| `spacing-10` | 3.5rem (56px) | Between major sections |
| `spacing-16` | 5.5rem (88px) | Hero section breathing room |

**Rule**: If a layout feels crowded, double the spacing values. White space signals premium quality.

---

## 8. Do's and Don'ts

### Do

- **Do** use the NomMigo smiley as a subtle watermark at 5% opacity behind hero sections
- **Do** let food photography bleed off card edges and overlap with content for depth
- **Do** use `display-lg` for numbers that matter — calories, match percentages, macro counts
- **Do** lean into white space aggressively — it's the most premium design tool available
- **Do** use the `#4ECDC4` success teal for positive reinforcement moments
- **Do** make AI features feel like a smart friend, not a robot — use conversational copy ("NomMigo thinks you'd love..." not "AI Recommendation")

### Don't

- **Don't** use circular progress rings. Ever. Bold numbers with horizontal bars only.
- **Don't** use 1px solid borders. Background color shifts define boundaries.
- **Don't** use pure black (#000000) for text. Always `#1A1A2E` (deep navy).
- **Don't** use pure white (#FFFFFF) as a page background. Always `#FFFAF5` (warm cream).
- **Don't** use purple, lavender, cool gray, or any blue-tinted surface colors.
- **Don't** use gray drop shadows. Shadows must be warm-tinted (coral or mango).
- **Don't** use sharp corners. Minimum radius is `0.5rem`, most components use `2rem`+.
- **Don't** center-align everything. Left-aligned typography with wide margins feels more intentional.
- **Don't** use generic placeholder copy. Every label should have NomMigo's voice — playful, confident, food-obsessed.

---

## 9. Accessibility

- All text on `#FF6B6B` backgrounds must use `#FFFFFF` (passes 4.5:1 contrast)
- All text on `#FFA62B` backgrounds must use `#1A1A2E` (passes 4.5:1 contrast)
- All text on `#FFFAF5` backgrounds must use `#1A1A2E` (passes 4.5:1 contrast)
- All text on `#4ECDC4` backgrounds must use `#1A1A2E` (passes 4.5:1 contrast)
- Touch targets: minimum 48px height
- Interactive elements must have visible focus states
- Food photography must include descriptive alt text

---

**Director's Note:** Every screen should make someone want to show it to a friend. If it feels like a medical chart, a spreadsheet, or "just another tracker" — the typography isn't bold enough, the whitespace isn't generous enough, or the colors are too cold. Push it further.
