// Public configuration. The publishable key is designed to be public:
// all data access is protected by Row Level Security in the database.
export const SUPABASE_URL = 'https://talchwzgyseaoyrhkyad.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rnqzi6Pi8lPTV7Jly9BNmA_hJRPgRxl'

export const TIME_ZONE = 'Europe/Copenhagen'

// Shared test accounts for user tests (fictional people, no real data).
export const TEST_PASSWORD = 'spotlight-test-2026'
export const TEST_ACCOUNTS = [
  { name: 'Alex', email: 'alex@spotlight.test' },
  { name: 'Sam', email: 'sam@spotlight.test' },
  { name: 'Robin', email: 'robin@spotlight.test' },
  { name: 'Kim', email: 'kim@spotlight.test' },
  { name: 'Charlie', email: 'charlie@spotlight.test' },
  { name: 'Jamie', email: 'jamie@spotlight.test' },
]

// Business rules (mirrored from the database, used for display only)
export const RULES = {
  checkinOpensMinBefore: 30,
  planLastsHours: 2,
  minPeopleForDiscount: 2,
  maxGroupSize: 8,
  minGroupSize: 2,
  maxUpcomingPlansPerHost: 3,
}
