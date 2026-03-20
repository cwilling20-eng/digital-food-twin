# NomMigo — Claude Code Build Plan

## Project Context

**What this is:** A frontend reskin of the existing Digital Food Twin app, rebranded as NomMigo. The Supabase backend, n8n workflows, and core app logic remain untouched. We are replacing the UI layer — components, styles, layout, and branding — while preserving all data hooks and business logic.

**Current stack:** Vite + React SPA, Supabase (Postgres + Auth + RLS + RPC + Storage), n8n automations, deployed on Vercel at digital-food-twin.vercel.app

**Project location:** `C:\Users\willi\Claude Code Projects\digital-food-twin`

**Design assets available:**
- `DESIGN.md` — Complete design system with exact color tokens, typography, spacing, component specs, do's/don'ts
- Three Stitch reference screens (Home Dashboard, Menu Scanner Results, Social Feed) — HTML/CSS exports + screenshots
- Brand identity: NomMigo wordmark, smiley face icon (Material Symbols "mood" placeholder until custom icon is designed), NomMigo Expressions system
- Existing app screenshots showing all current pages and features

---

## Locked Design Decisions

### Color Palette (Exact Values)
| Token | Hex | Usage |
|:---|:---|:---|
| Signature | `#FF6B6B` | Primary CTAs, logo, active nav, key actions |
| Accent | `#FFA62B` | Highlights, badges, AI features, discovery |
| Background | `#FFFAF5` | Base canvas |
| Surface | `#FFF0E5` | Cards, elevated sections |
| Text | `#1A1A2E` | All headings and body copy |
| Success | `#4ECDC4` | Confirmations, goals met, positive states |

### Typography
- Font: Plus Jakarta Sans (all weights)
- Import: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap`

### Navigation
- 4 tabs: Home, Meal Log, Social, Profile
- Centered expandable action button between Meal Log and Social
- Action button fans out to: "Scan Menu" (camera icon) + "Log Food" (plus icon)
- Floating pill-style nav bar with glassmorphism (#FFFAF5 at 80% + 20px backdrop-blur)

### Key Design Rules
- NO circular progress rings — bold numbers + horizontal bars only
- NO 1px solid borders — background color shifts define boundaries
- NO pure black text — always #1A1A2E
- NO pure white backgrounds — always #FFFAF5
- NO purple, lavender, or cool gray surface colors
- NO gray drop shadows — warm coral or mango tinted only
- Minimum border-radius: 0.5rem, most components 2rem+

---

## Build Phases

### Phase 1: Foundation (Do First)

**1.1 — Global theme and design tokens**
- Create a theme config file that maps all DESIGN.md tokens to CSS custom properties and/or Tailwind config
- Update `tailwind.config.js` with exact NomMigo color tokens, border-radius scale, and font config
- Import Plus Jakarta Sans globally
- Remove all existing teal/mint color references
- Set base background to #FFFAF5

**1.2 — Shared components**
Build these reusable components first since every screen depends on them:

- `NavBar` — Floating pill nav with 4 tabs + expandable center action button (fan-out animation for Scan Menu / Log Food)
- `AppHeader` — NomMigo logo (smiley icon + wordmark in coral), notification bell, user avatar
- `MacroPills` — Bold number + label in colored pill (Protein=coral, Carbs=mango, Fat=surface)
- `ProgressBar` — Horizontal bar replacing all circular progress rings (surface-container-high track, coral fill)
- `NomMigoCard` — The AI recommendation card component (dark #1A1A2E background, white text, coral CTA)
- `MealCard` — Food photo + meal label + calorie count, used in horizontal scroll
- `FoodResultCard` — Menu scanner result card with TWO variants:
  - With image: photo + match badge + dish name + macros + explanation + log button
  - Without image: text-forward with bold dish name + match badge + macros + explanation + log button
  - Renders conditionally based on whether `image_url` exists for the menu item

**1.3 — Layout wrapper**
- Create a page layout component that applies the warm cream background, max-width constraints, and bottom padding for the floating nav
- All pages wrap in this layout

---

### Phase 2: Screen Redesigns

**2.1 — Home Dashboard**
Reference: Stitch Home Dashboard export

Components to render:
- Greeting section: "Hey [username]! Ready to nom?" with NomMigo smiley watermark at 5% opacity
- Calorie hero card: Big display-lg number, "consumed of X goal" subtitle, horizontal progress bar
- Macro pills row: Three MacroPill components (Protein, Carbs, Fat)
- AI recommendation: NomMigoCard with "NomMigo thinks you'd love..." header, food photo, dish name, reason, macro badges, "LOG THIS NOM" CTA
- Today's Meals: Horizontal scrolling row of MealCard components, "VIEW ALL" link
- Find a Restaurant: Accent mango card with "Tired of cooking?" copy and "EXPLORE PLACES" CTA

Data hooks: Connect to existing Supabase hooks for daily nutrition data, meal log entries, and user profile. The AI recommendation card can initially show static/placeholder content or pull from the existing AI chat suggestions.

**2.2 — Menu Scanner (Chat Interface with Rich Cards)**
This is NOT a dedicated page — results render inside the existing chat interface.

Changes needed:
- Restyle the chat container to match NomMigo design (warm backgrounds, rounded bubbles, Plus Jakarta Sans)
- Create `ChatResultCard` component that the AI chatbot response renders when returning menu scan results
- ChatResultCard contains:
  - Restaurant name as bold headline
  - "[X] items analyzed" badge
  - Goal Mode / Enjoyment Mode toggle (preserve existing functionality)
  - Ranked result cards (#1 as dominant, #2 and #3 as smaller)
  - Each result: FoodResultCard component (image if available, text-forward if not)
  - Match percentage badge
  - "Why NomMigo chose this" explanation
  - One-tap "Log this meal" button
- The chat flow continues below — user can ask follow-up questions naturally

Integration: The n8n workflow responses need to return structured data (JSON) that the ChatResultCard component can parse and render. If the workflow currently returns plain text, it will need to be updated to return structured recommendation objects.

**2.3 — Social Feed ("Dining Buddies")**
Reference: Stitch Social Feed export

Components to render:
- Header: "Dining Buddies" + "See what your flavor circle is devouring today"
- Group dinner card: Coral gradient, friend avatars, "Find the Perfect Spot" CTA
- Social post cards: Friend avatar + name, DNA match badge, food photo (user-uploaded), dish name + restaurant, caption text, reaction row (NomMigo smiley + comment count + bookmark)
- Floating NomMigo companion button (bottom right)

Data hooks: Connect to existing Supabase friends/social tables. Posts pull from friends' logged meals with photos.

**2.4 — Remaining Screens (Claude Code builds from DESIGN.md, no Stitch reference needed)**

These follow the design system patterns established in Phase 1 and 2:

- **Meal Log / Diary** — List of logged meals with date grouping, food photos (user uploaded), macro summaries. Style as vertical card list with MealCard components.
- **Food DNA / Flavor Profile** — Restyle existing sliders and preference selectors with NomMigo colors, pill-shaped inputs, warm surfaces. Keep all existing functionality.
- **Cuisine Expertise** — Restyle the cuisine grid with rounded cards, NomMigo colors, warm surfaces
- **My Goals** — Restyle body metrics, weight plan, macro targets with bold numbers, horizontal progress bars, NomMigo card styling
- **Profile** — User info, settings, account management in NomMigo styling
- **Friends / Dining Buddies list** — Restyle as warm card list with DNA match badges

---

### Phase 3: Data Model Prep (Future-Proofing)

**3.1 — Restaurant menu items table**

Create a `restaurant_menu_items` table in Supabase that supports optional images uploaded by restaurant owners:

```sql
CREATE TABLE restaurant_menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_name TEXT NOT NULL,
  restaurant_google_place_id TEXT,
  item_name TEXT NOT NULL,
  item_description TEXT,
  image_url TEXT,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  tags TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_items_restaurant ON restaurant_menu_items(restaurant_name);
CREATE INDEX idx_menu_items_place_id ON restaurant_menu_items(restaurant_google_place_id);
```

**3.2 — Image lookup in scanner results**

When the AI returns menu recommendations, the ChatResultCard component should:
1. Receive the restaurant name and recommended dish names from the AI response
2. Query `restaurant_menu_items` for matching items at that restaurant
3. If a match with `image_url` exists → render FoodResultCard with image variant
4. If no match or no image → render FoodResultCard text-forward variant

This lookup can be a simple Supabase RPC or a client-side query. It doesn't need to be perfect matching — fuzzy name matching or containment search is fine for v1.

**3.3 — Restaurant owner portal (Build Later)**

Not part of this build phase, but the data model above supports it. Future features:
- Restaurant owner signup and claim flow
- Menu item management (add/edit/delete items with photos)
- Analytics dashboard showing how often their dishes are recommended
- Supabase Storage bucket for menu item images with RLS policies

---

## Build Sequence (Recommended Order)

```
Phase 1.1  → Theme + design tokens + Tailwind config
Phase 1.2  → Shared components (NavBar, AppHeader, MacroPills, etc.)
Phase 1.3  → Layout wrapper
Phase 2.1  → Home Dashboard redesign
Phase 2.4a → Meal Log (quick win, uses MealCard from Phase 1)
Phase 2.2  → Chat interface restyle + ChatResultCard
Phase 2.3  → Social Feed
Phase 2.4b → Food DNA, Cuisine, Goals, Profile (batch these)
Phase 3.1  → Restaurant menu items table
Phase 3.2  → Image lookup integration
```

---

## Verification Checklist (After Each Phase)

- [ ] No teal/mint colors remaining anywhere
- [ ] Background is #FFFAF5 on all pages
- [ ] Cards use #FFF0E5, not pure white or lavender
- [ ] Text is #1A1A2E everywhere, no black or brown
- [ ] Primary CTAs are #FF6B6B, not dark red
- [ ] No circular progress rings — bold numbers + horizontal bars
- [ ] No 1px borders — background shifts only
- [ ] Plus Jakarta Sans loaded and applied globally
- [ ] Nav bar matches spec: 4 tabs + center expandable action
- [ ] NomMigo branding (smiley + wordmark) in header
- [ ] App still connects to Supabase and all data flows work
- [ ] Deployed to Vercel and functional

---

## Files to Have Ready in Project Folder

Before starting Claude Code, place these files in the project root or a `/design` folder:

1. `DESIGN.md` — The corrected design system (downloaded from Claude)
2. `home-dashboard.html` — Stitch HTML export of dashboard
3. `menu-scanner.html` — Stitch HTML export of scanner results (for card styling reference)
4. `social-feed.html` — Stitch HTML export of social feed
5. Screenshots of all three Stitch screens for visual reference

Claude Code reads the DESIGN.md for exact values and references the HTML exports for layout patterns. The screenshots serve as visual verification during build.
