// Creates the test, seed and admin accounts in Supabase Auth.
// Only needed when setting up a NEW Supabase project.
//
// Usage (never commit the secret key):
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SECRET_KEY=sb_secret_... ADMIN_PASSWORD=... node scripts/create-accounts.mjs
// Then run supabase/migrations/003_mark_test_accounts.sql in the SQL editor.

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
const adminPassword = process.env.ADMIN_PASSWORD
if (!url || !key || !adminPassword) {
  console.error('Set SUPABASE_URL, SUPABASE_SECRET_KEY and ADMIN_PASSWORD')
  process.exit(1)
}

const TEST_PASSWORD = 'spotlight-test-2026' // same as src/config.ts
const random = () => crypto.randomUUID()

const accounts = [
  ...['Alex', 'Sam', 'Robin', 'Kim', 'Charlie', 'Jamie'].map((n) => ({ email: `${n.toLowerCase()}@spotlight.test`, name: n, password: TEST_PASSWORD })),
  ...['Maya', 'Oliver', 'Sofie', 'Lukas', 'Ida', 'Noah'].map((n) => ({ email: `seed.${n.toLowerCase()}@spotlight.test`, name: n, password: random() })),
  { email: 'admin@spotlight.test', name: 'Admin', password: adminPassword },
]

for (const a of accounts) {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: a.email, password: a.password, email_confirm: true, user_metadata: { display_name: a.name, over18: true } }),
  })
  console.log(a.email, res.status, res.ok ? 'created' : await res.text())
}
