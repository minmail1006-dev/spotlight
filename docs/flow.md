# MVP flow and screens

The core interaction (Parker et al., 2016): a **host** posts a **plan** (the value
unit) at a venue, others find it through the **filter** (time, category, area),
join, check in together at the venue, and the discount unlocks.

## Numbered flow

| # | Step | Screen | File |
|---|------|--------|------|
| 0 | Sign in / create account (18+ and consent checkboxes) or quick test login | Login | `src/pages/Login.tsx` |
| 1 | Browse open plans, filter by *when*, *category* and *neighbourhood* | Discover | `src/pages/Discover.tsx` |
| 1b | Browse venues with discount and number of open plans | Venues | `src/pages/Venues.tsx` |
| 1c | 3D map: venue pins with discount and open plans, neighbourhood fly-to, 2D/3D toggle, "find me" | Map | `src/pages/MapPage.tsx` |
| 2 | Open a venue feed: offer, best times, plans at this venue | Venue | `src/pages/VenuePage.tsx` |
| 3 | Post a plan: venue, title, time, group size, note. Suggests joining an existing plan at the same place ±90 min (reduces "thin plans") | Post plan | `src/pages/NewPlan.tsx` |
| 4 | Open a plan: who is going (live count), join / leave / cancel, report | Plan | `src/pages/PlanPage.tsx` |
| 5 | Check in with the 4-character venue code (opens 30 min before start) | Plan → check-in box | `PlanPage.tsx` |
| 6 | Waiting state: "1 of 2 checked in", updates live | Plan → waiting | `PlanPage.tsx` |
| 7 | Discount unlocks: ticket with %, code and a live clock (prevents screenshots being reused) | Plan → ticket | `PlanPage.tsx` |
| – | My plans, discounts, edit name, sign out | Me | `src/pages/Me.tsx` |
| – | Safety rules and what data is stored | Safety & privacy | `src/pages/Safety.tsx` |
| – | Admin: test KPIs, CSV export, reset data, venue codes, reports | Admin | `src/pages/Admin.tsx` |

## Plan states

```
upcoming ──(30 min before start)──▶ check-in open ──(start)──▶ happening now ──(2 h after start)──▶ ended
    └──────────── host cancels at any time ────────────▶ cancelled
```

## Check-in rule (what counts as "together")

```
user enters code ─▶ correct venue code? ── no ─▶ "wrong code" (logged)
                         │ yes
                         ▼
                 inside window and joined? ── no ─▶ error message
                         │ yes
                         ▼
                 check-ins on this plan ≥ 2? ── no ─▶ waiting screen
                         │ yes
                         ▼
     for every checked-in user without a discount today at this venue:
                    create redemption (discount unlocked)
```
