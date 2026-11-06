import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { PLAN_SELECT, type Plan, type Venue } from './types'

/** Re-renders every `ms` so countdowns and phases stay current */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

let venueCache: Venue[] | null = null

export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>(venueCache ?? [])
  const [loading, setLoading] = useState(!venueCache)
  useEffect(() => {
    if (venueCache) return
    supabase
      .from('venues')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        venueCache = (data as Venue[]) ?? []
        setVenues(venueCache)
        setLoading(false)
      })
  }, [])
  return { venues, loading }
}

type PlanQuery = { venueId?: string; planId?: string; includeEnded?: boolean }

/**
 * Loads plans and keeps them live: any change to plans, RSVPs or
 * check-ins (from any user) triggers a quick refetch.
 */
export function usePlans(query: PlanQuery = {}) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { venueId, planId, includeEnded } = query

  const load = useCallback(async () => {
    let q = supabase.from('plans').select(PLAN_SELECT).order('starts_at')
    if (planId) q = q.eq('id', planId)
    else {
      q = q.eq('status', 'open')
      if (!includeEnded) q = q.gte('starts_at', new Date(Date.now() - 2 * 3600_000).toISOString())
    }
    if (venueId) q = q.eq('venue_id', venueId)
    const { data, error: err } = await q
    if (err) setError(err.message)
    else {
      setError(null)
      setPlans((data as unknown as Plan[]) ?? [])
    }
    setLoading(false)
  }, [venueId, planId, includeEnded])

  useEffect(() => {
    load()
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(load, 250)
    }
    const name = `plans-${venueId ?? ''}-${planId ?? ''}-${Math.random().toString(36).slice(2, 7)}`
    const channel = supabase
      .channel(name)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, refresh)
      .subscribe()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', onFocus)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [load, venueId, planId])

  return { plans, loading, error, reload: load }
}
