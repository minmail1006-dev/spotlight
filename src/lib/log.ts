import { supabase } from './supabase'

// One id per browser tab, so the admin page can measure how long a
// session took from opening the app to unlocking a discount.
function makeSessionId(): string {
  try {
    const existing = sessionStorage.getItem('spotlight-session')
    if (existing) return existing
    const id = Math.random().toString(36).slice(2, 10)
    sessionStorage.setItem('spotlight-session', id)
    return id
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

export const SESSION_ID = makeSessionId()

/**
 * Logs a UI event for the user test. Important actions (plan posted,
 * joined, checked in, discount unlocked) are logged by the database itself.
 */
export async function logEvent(
  name: string,
  data: { plan_id?: string; venue_id?: string; meta?: Record<string, unknown> } = {},
) {
  const { data: auth } = await supabase.auth.getSession()
  const userId = auth.session?.user.id
  if (!userId) return
  await supabase.from('events').insert({
    user_id: userId,
    session_id: SESSION_ID,
    name,
    plan_id: data.plan_id ?? null,
    venue_id: data.venue_id ?? null,
    meta: data.meta ?? {},
  })
}
