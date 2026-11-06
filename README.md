# Spotlight

**Live app:** https://nicolaigarder.github.io/spotlight/

A venue-anchored platform where people post and join time-bound plans at places
like sports bars, pottery studios and museums in Copenhagen. When two or more
people on the same plan check in at the venue, a venue discount unlocks.
Student MVP for the course DM-BDP.

## Try it
1. Open the live app on your phone.
2. Tap a **Quick login** name (fictional test accounts, password `spotlight-test-2026`).
3. Join a plan, or post your own.
4. At the venue, check in with the venue code. In the test, the facilitator gives the code (admin page).
5. When a second person checks in, the discount ticket appears for both.

## What is real, simulated and planned

| Real (working) | Simulated | Planned (not built) |
|---|---|---|
| Browse venues and plans with filters | Partner venues and offers (fictional) | Real login providers (Google/Apple), email verification |
| Post a plan | Seed users and sample plans | Moderation workflow for reports |
| Join/leave with live RSVP count | Staff verification (via venue code) | Venue dashboard |
| Check in with a venue code | The discount itself (no payment) | Payments and commission per redeemed meetup |
| Discount unlocks at 2+ check-ins | | Push notifications |
| Report button, 18+ rule, event log, reset button | | |

## Documentation
- [docs/flow.md](docs/flow.md): numbered flow and screens
- [docs/data-model.md](docs/data-model.md): tables, functions, events
- [docs/decisions.md](docs/decisions.md): decision log (why each choice was made)
- [docs/test-guide.md](docs/test-guide.md): how to run the user test
- [AGENTS.md](AGENTS.md): context file for Codex / AI coding agents

## Run locally
```bash
npm install
npm run dev
```
The app talks to the hosted Supabase project in `src/config.ts`. The publishable key
there is meant to be public; Row Level Security protects the data.

## Deploy
Every push to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
Repository settings → Pages → Source must be **GitHub Actions**.

## Set up a new Supabase project (only if moving to a fresh project)
1. Create a project, then run `supabase/migrations/001_schema.sql` and `002_seed_venues.sql` in the SQL editor.
2. Authentication → Sign In / Providers → Email: turn **off** "Confirm email". Set the Site URL to the Pages URL.
3. Create accounts: `SUPABASE_URL=... SUPABASE_SECRET_KEY=... ADMIN_PASSWORD=... node scripts/create-accounts.mjs`
4. Run `003_mark_test_accounts.sql`.
5. Put the new project URL and publishable key in `src/config.ts`.

## Handing over to a new owner
- **GitHub:** Settings → General → Transfer ownership. Then Settings → Pages → Source: GitHub Actions. The URL becomes `https://<new-owner>.github.io/spotlight/`.
- **Supabase:** the project lives in its own organization ("Spotlight"). Invite the new owner as Owner under Organization settings → Team, then they can remove the old owner. URL and keys stay the same.
- After a transfer: update the Site URL and Redirect URLs under Authentication → URL Configuration to the new Pages URL, and update the link at the top of this README.

## Tech
React 19, TypeScript, Vite, react-router (HashRouter), Supabase (Postgres, Auth, Realtime), GitHub Pages.
