import { RULES, TIME_ZONE } from '../config'
import type { Plan } from './types'

const MIN = 60_000

function parts(date: Date) {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  })
  const o: Record<string, number> = {}
  for (const p of f.formatToParts(date)) if (p.type !== 'literal') o[p.type] = Number(p.value)
  return o as { year: number; month: number; day: number; hour: number; minute: number; second: number }
}

/** "YYYY-MM-DD" for a date in Copenhagen time */
export function cphDateKey(date: Date): string {
  const p = parts(date)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** Converts a Copenhagen wall-clock time (date "YYYY-MM-DD", time "HH:MM") to a Date */
export function fromCph(dateKey: string, time: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const asUtc = Date.UTC(y, m - 1, d, hh, mm)
  let guess = asUtc
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(guess))
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
    guess += asUtc - shown
  }
  return new Date(guess)
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12))
  return dt.toISOString().slice(0, 10)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)
}

/** "Today 20:00", "Tomorrow 17:00", "Thu 12 Nov 21:00" */
export function formatWhen(iso: string): string {
  const date = new Date(iso)
  const today = cphDateKey(new Date())
  const key = cphDateKey(date)
  const t = formatTime(date)
  if (key === today) return `Today ${t}`
  if (key === addDays(today, 1)) return `Tomorrow ${t}`
  if (key === addDays(today, -1)) return `Yesterday ${t}`
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'short', day: 'numeric', month: 'short' }).format(date)
  return `${day} ${t}`
}

export function relative(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now
  const mins = Math.round(Math.abs(diff) / MIN)
  const label = mins < 60 ? `${mins} min` : mins < 60 * 24 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`
  return diff >= 0 ? `in ${label}` : `${label} ago`
}

export type PlanPhase = 'cancelled' | 'upcoming' | 'checkin' | 'live' | 'ended'

/** upcoming -> checkin (30 min before) -> live (started) -> ended (2 h after start) */
export function planPhase(plan: Pick<Plan, 'starts_at' | 'status'>, now = Date.now()): PlanPhase {
  if (plan.status === 'cancelled') return 'cancelled'
  const start = new Date(plan.starts_at).getTime()
  if (now > start + RULES.planLastsHours * 60 * MIN) return 'ended'
  if (now >= start) return 'live'
  if (now >= start - RULES.checkinOpensMinBefore * MIN) return 'checkin'
  return 'upcoming'
}

export function checkinOpensAt(plan: Pick<Plan, 'starts_at'>): Date {
  return new Date(new Date(plan.starts_at).getTime() - RULES.checkinOpensMinBefore * MIN)
}
