export type Profile = {
  id: string
  display_name: string
  is_admin: boolean
  is_test_account: boolean
  seed_key: string | null
}

export type Venue = {
  id: string
  slug: string
  name: string
  category: string
  neighborhood: string
  address: string
  description: string
  offer: string
  discount_pct: number
  quiet_hours: string | null
  emoji: string
  color: string
  is_fictional: boolean
  sort_order: number
}

export type Plan = {
  id: string
  venue_id: string
  host_id: string
  title: string
  note: string | null
  starts_at: string
  max_size: number
  status: 'open' | 'cancelled'
  created_at: string
  venue: Venue
  host: { id: string; display_name: string }
  rsvps: { user_id: string; created_at: string; profile: { display_name: string } | null }[]
  checkins: { user_id: string; created_at: string }[]
}

export type Redemption = {
  id: string
  plan_id: string
  user_id: string
  venue_id: string
  discount_pct: number
  code: string
  local_date: string
  created_at: string
}

export type EventRow = {
  id: number
  user_id: string | null
  session_id: string | null
  name: string
  plan_id: string | null
  venue_id: string | null
  meta: Record<string, unknown>
  created_at: string
}

export const PLAN_SELECT =
  '*, venue:venues(*), host:profiles!plans_host_id_fkey(id, display_name), rsvps(user_id, created_at, profile:profiles(display_name)), checkins(user_id, created_at)'
