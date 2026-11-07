# AGENTS.md: context for coding agents (Codex, Claude, Copilot)

## Goal
Spotlight is a student MVP for the course DM-BDP (digital platforms). It is a
venue-anchored platform where people post and join time-bound plans at public
venues in Copenhagen ("Chelsea, 20:00, The Corner Pint, 4 going"). When 2+
users on the same plan check in at the venue, a venue discount unlocks.
The aim is to lower the threshold for meeting new people. Never use the word
"lonely" in the interface. Tone: warm, light, inviting.

## Stack
- React 19 + TypeScript + Vite, react-router (HashRouter, for GitHub Pages)
- Supabase: Postgres, Auth (email + password), Realtime
- Map: MapLibre GL JS with the OpenFreeMap "liberty" style (OpenStreetMap data, 3D buildings)
- Hosting: GitHub Pages, deployed by `.github/workflows/deploy.yml` on push to `main`
- No CSS framework: plain CSS in `src/index.css` (mobile-first, max width 560px)

## Where things are
- `src/config.ts`: Supabase URL, publishable key, test accounts, rule constants
- `src/pages/*`: one file per screen (see docs/flow.md)
- `src/pages/MapPage.tsx`: 3D map (MapLibre GL JS + OpenFreeMap tiles, no API key), lazy-loaded
- `src/lib/hooks.ts`: `usePlans` (live via Realtime), `useVenues`, `useNow`
- `src/lib/log.ts`: `logEvent()` for user-test logging
- `supabase/migrations/*.sql`: schema, RLS, business rules (RPC functions), seed data
- `docs/`: flow, data model, decisions, test guide

## Business rules (enforced in the database, never only in the UI)
- Check-in needs the venue's 4-character code (`venue_codes`, unreadable by clients).
- Check-in window: 30 min before start until 2 h after start.
- "Together" = 2+ distinct users checked in on the same plan inside the window.
- Discount % is set per venue (`venues.discount_pct`, 5–50, seed 15–20).
- Max one discount per user per venue per Copenhagen calendar day.
- Group size 2–8 (host picks). Host is auto-RSVP'd. Max 3 upcoming plans per host.
- Plans expire 2 h after start. Cancelled plans disappear from feeds.
- 18+ only (checked at sign-up, enforced by a trigger on `auth.users`).

Writes that involve rules go through RPC functions: `join_plan`, `leave_plan`,
`cancel_plan`, `check_in`, `reset_demo_data`, `get_venue_codes`.
Plans are inserted directly (a trigger validates them).

## What is simulated
Venues, addresses, offers and seed users are fictional. Staff verification is
simulated by the venue code. No payments. Login is real (Supabase), but email
confirmation is turned off for the test.

## Rules for changes
- Plan before coding; build one feature at a time; keep `npm run build` green.
- New tables need RLS policies. Never put the Supabase secret key in the repo.
- Database changes go in a NEW numbered file in `supabase/migrations/`.
- Log new user actions with `logEvent()` so the test data stays complete.
- Add a line to `docs/decisions.md` for every decision you make.
