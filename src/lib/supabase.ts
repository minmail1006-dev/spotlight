import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
})

/** Turns Supabase/Postgres errors into a short sentence for the UI. */
export function errorMessage(err: unknown): string {
  if (!err) return 'Something went wrong'
  if (typeof err === 'string') return err
  const e = err as { message?: string; error_description?: string }
  const msg = e.message || e.error_description || 'Something went wrong'
  if (msg.includes('Database error saving new user')) return 'Spotlight is for people aged 18 or over.'
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password.'
  return msg
}
