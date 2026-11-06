import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Spinner, TopBar, useToast } from '../components/ui'
import { RULES } from '../config'
import { useAuth } from '../lib/auth'
import { usePlans, useVenues } from '../lib/hooks'
import { logEvent } from '../lib/log'
import { errorMessage, supabase } from '../lib/supabase'
import { addDays, cphDateKey, formatTime, formatWhen, fromCph } from '../lib/time'

const IDEAS: Record<string, string[]> = {
  Sports: ['Watch the match together', 'Champions League night'],
  Games: ['Board games, beginners welcome', 'Pub quiz team'],
  Creative: ['First time on the pottery wheel', 'Try something new together'],
  Culture: ['Walk through the new exhibition', 'Museum, then coffee'],
  Music: ['Live jazz night', 'Listen to the jam session'],
  'Food & drinks': ['Dinner and good conversation', 'After-work bite'],
  Active: ['Try bouldering together', 'Sauna and a cold dip'],
}

function roundUp(date: Date, minutes = 15) {
  const ms = minutes * 60_000
  return new Date(Math.ceil(date.getTime() / ms) * ms)
}

export default function NewPlan() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const { session } = useAuth()
  const { venues, loading } = useVenues()
  const today = cphDateKey(new Date())
  const inOneHour = roundUp(new Date(Date.now() + 60 * 60_000))

  const [venueSlug, setVenueSlug] = useState(params.get('venue') ?? '')
  const [title, setTitle] = useState('')
  const [dateKey, setDateKey] = useState(cphDateKey(inOneHour))
  const [time, setTime] = useState(formatTime(inOneHour))
  const [size, setSize] = useState(6)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const venue = venues.find((v) => v.slug === venueSlug)
  const { plans } = usePlans({ venueId: venue?.id })
  const startsAt = useMemo(() => (dateKey && time ? fromCph(dateKey, time) : null), [dateKey, time])

  useEffect(() => {
    logEvent('open_new_plan')
  }, [])

  // Loop B1 (dilution): suggest joining an existing plan at the same place and time
  const similar = startsAt
    ? plans.filter(
        (p) =>
          Math.abs(new Date(p.starts_at).getTime() - startsAt.getTime()) <= 90 * 60_000 &&
          p.rsvps.length < p.max_size &&
          !p.rsvps.some((r) => r.user_id === session?.user.id),
      )
    : []

  const dayOptions = Array.from({ length: 14 }, (_, i) => {
    const key = addDays(today, i)
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatWhen(fromCph(key, '12:00').toISOString()).replace(' 12:00', '')
    return { key, label }
  })

  function quick(kind: 'hour' | 'tonight' | 'tomorrow') {
    if (kind === 'hour') {
      setDateKey(cphDateKey(inOneHour))
      setTime(formatTime(inOneHour))
    } else if (kind === 'tonight') {
      setDateKey(today)
      setTime('20:00')
    } else {
      setDateKey(addDays(today, 1))
      setTime('19:00')
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!venue) return setError('Pick a venue.')
    if (title.trim().length < 3) return setError('Give your plan a short title.')
    if (!startsAt || startsAt.getTime() < Date.now() - 5 * 60_000) return setError('Pick a time in the future.')
    setBusy(true)
    const { data, error: err } = await supabase
      .from('plans')
      .insert({
        venue_id: venue.id,
        host_id: session!.user.id,
        title: title.trim(),
        note: note.trim() || null,
        starts_at: startsAt.toISOString(),
        max_size: size,
      })
      .select('id')
      .single()
    setBusy(false)
    if (err) return setError(errorMessage(err))
    toast('Your plan is live')
    nav(`/plan/${data.id}`, { replace: true })
  }

  if (loading) return <Spinner />

  return (
    <>
      <TopBar back title="Post a plan" />
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Where</span>
          <select value={venueSlug} onChange={(e) => setVenueSlug(e.target.value)} required>
            <option value="">Choose a venue…</option>
            {venues.map((v) => (
              <option key={v.id} value={v.slug}>
                {v.emoji} {v.name} ({v.neighborhood}) −{v.discount_pct}%
              </option>
            ))}
          </select>
          <small className="muted">Plans are always at public partner venues.</small>
        </label>

        <label className="field">
          <span>What</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Watch Chelsea vs Arsenal" />
        </label>
        {venue && IDEAS[venue.category] && (
          <div className="chips">
            {IDEAS[venue.category].map((idea) => (
              <button type="button" key={idea} className="chip" onClick={() => setTitle(idea)}>
                {idea}
              </button>
            ))}
          </div>
        )}

        <div className="field">
          <span>When</span>
          <div className="chips">
            <button type="button" className="chip" onClick={() => quick('hour')}>In 1 hour</button>
            <button type="button" className="chip" onClick={() => quick('tonight')}>Tonight 20:00</button>
            <button type="button" className="chip" onClick={() => quick('tomorrow')}>Tomorrow 19:00</button>
          </div>
          <div className="row">
            <select value={dateKey} onChange={(e) => setDateKey(e.target.value)} aria-label="Day">
              {dayOptions.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" step={300} required />
          </div>
          <small className="muted">Copenhagen time. Check-in opens {RULES.checkinOpensMinBefore} min before.</small>
        </div>

        {similar.length > 0 && (
          <div className="card notice">
            <strong>There's already a plan here around then</strong>
            {similar.map((p) => (
              <Link key={p.id} to={`/plan/${p.id}`} className="link-row">
                {p.title} · {formatWhen(p.starts_at)} · {p.rsvps.length} going → Join instead
              </Link>
            ))}
          </div>
        )}

        <div className="field">
          <span>Group size (including you)</span>
          <div className="stepper">
            <button type="button" onClick={() => setSize((s) => Math.max(RULES.minGroupSize, s - 1))} aria-label="Fewer">−</button>
            <output>{size}</output>
            <button type="button" onClick={() => setSize((s) => Math.min(RULES.maxGroupSize, s + 1))} aria-label="More">+</button>
          </div>
        </div>

        <label className="field">
          <span>Note (optional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={3} placeholder="Where to find you, what to expect…" />
        </label>

        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Posting…' : 'Post plan'}
        </button>
        <p className="muted small center">Don't share phone numbers or addresses in plans. Meet inside the venue.</p>
      </form>
    </>
  )
}
