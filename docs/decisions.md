# Decision log

The course requires that the build can be explained and justified. Each line: decision, reason.

| # | Decision | Why |
|---|----------|-----|
| 1 | Mobile-first web app (not a native app) | Easiest to demo and test: testers open a link on their own phone, no install. |
| 2 | React + TypeScript + Vite | Widely used, fast to build, type checking catches mistakes early. |
| 3 | Supabase (Postgres + Auth + Realtime) as backend | Real multi-user data so testers on different phones see each other's plans; free tier; no server to run. |
| 4 | GitHub Pages hosting via GitHub Actions | Free, deploys automatically on every push. Hash-based URLs (`#/plan/...`) because Pages has no server-side routing. |
| 5 | Business rules in the database (RPC functions + RLS), not only in the UI | A user cannot cheat by calling the API directly (e.g. check in without the code). |
| 6 | Check-in verified with a 4-character venue code | Simplest realistic verification: staff show the code or it is on a table card. QR would need a camera flow. Simulated in the test (the facilitator gives the code). |
| 7 | "Together" = 2+ distinct users checked in on the same plan, from 30 min before to 2 h after start | Matches the platform's purpose (real meetups) and filters out solo discount hunters. |
| 8 | Discount set per venue (seed 15–20 %, default 20 %) | Addresses loop B2 (margin pressure): venues choose what they can afford. |
| 9 | Max one discount per user per venue per day | Limits discount hunting and protects venue margins. |
| 10 | Host picks group size 2–8, max 3 upcoming plans per host | Keeps plans small and safe; limits "thin plans" (loop B1). |
| 11 | "Join instead?" suggestion when posting a plan at the same venue ±90 min | Directly targets B1 dilution: fewer, fuller plans. |
| 12 | Discount ticket shows a live clock and a code | Staff can see it is live and not an old screenshot. |
| 13 | Email + password login, email confirmation turned off; 6 shared test accounts with quick login | Fast for user tests. Must be stated in the report as a simplification. |
| 14 | 18+ checkbox enforced by a database trigger | Basic safety requirement; cannot be skipped from the UI. |
| 15 | Report button on every plan; reports visible to admin | Governance for loop B3 (safety). |
| 16 | Plans only at listed public venues; no free-text addresses | Safety: meetups always happen in public places. |
| 17 | Only first name shown to other users; email hidden | Data minimisation (GDPR). |
| 18 | Event log + admin page with funnel, median times and CSV export | The course requires testing and reporting what was observed. |
| 19 | Reset button (admin only) re-creates 10 sample plans relative to now | Every test session starts from the same state. |
| 20 | All venues and seed users are fictional and labelled as such | No real business has agreed to the offers. |
| 21 | The word "lonely" is never used in the interface | Stigma is one of the root causes; the app frames it as spontaneous fun. |
