# NomMigo — Project Context

## What This Is
NomMigo ("Nom" + "amigo") is an AI-powered food companion app. Vite + React + TypeScript + Supabase + Tailwind CSS, deployed on Vercel.

## CRITICAL: Design System
Before making ANY visual changes, read `design/DESIGN.md`. This is the single source of truth for all colors, typography, spacing, and components.

### Color Tokens (Never Deviate)
- Signature: #FF6B6B (primary CTAs, logo)
- Accent: #FFA62B (highlights, badges, AI features)
- Background: #FFFAF5 (base canvas — NOT white, NOT lavender)
- Surface: #FFF0E5 (cards — NOT pure white)
- Text: #1A1A2E (all text — NOT black, NOT brown)
- Success: #4ECDC4 (confirmations, goals met)

### Design Rules (Non-Negotiable)
- NO circular progress rings — bold numbers + horizontal bars only
- NO 1px solid borders — background color shifts define boundaries
- NO gray shadows — warm coral/mango tinted only
- NO sharp corners — minimum 0.5rem radius, most components 2rem+
- Font: Plus Jakarta Sans exclusively
- Nav: 4 tabs (Home, Meal Log, Social, Profile) + centered expandable action button

## Reference Files
- `design/DESIGN.md` — Complete design system
- `design/NOMMIGO_BUILD_PLAN.md` — Phased build plan
- `design/home-dashboard.html` — Stitch reference for dashboard
- `design/menu-scanner.html` — Stitch reference for scanner results
- `design/social-feed.html` — Stitch reference for social feed

## Architecture
- Data hooks in `src/hooks/` — DO NOT modify during reskin
- Routes in `src/routes/` — preserve all routing logic
- Shared UI components in `src/components/ui/`
- Supabase client in `src/lib/` — DO NOT modify
- n8n webhooks in `src/config/api.ts` — DO NOT modify

## Current Phase
Frontend reskin from "Digital Food Twin" to "NomMigo." Backend untouched.
