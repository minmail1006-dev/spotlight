import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, Empty, Sheet, Spinner, TopBar, useToast } from '../components/ui'
import { RULES } from '../config'
import { useAuth } from '../lib/auth'
import { useNow, usePlans } from '../lib/hooks'
import { logEvent } from '../lib/log'
import { errorMessage, supabase } from '../lib/supabase'
import { checkinOpensAt, formatTime, formatWhen, planPhase, relative } from '../lib/time'
import type { Plan, Redemption } from '../lib/types'

type CheckinResult = {
  ok: boolean
  error?: string
  checked_in?: number
  unlocked?: boolean
  discount_pct?: number
  redemption_code?: string
  daily_limit_reached?: boolean
}

export default function PlanPage() {
  const { id } = useParams()
  const { plans, loading } = usePlans({ planId: id })
  const plan = plans[0]

  useEffect(() => {
    if (id) logEvent('view_plan', { plan_id: id })
  }, [id])

  if (loading) return <Spinner />
  if (!plan) return (
    <>
      <TopBar back />
      <Empty title="Plan not found">
        <Link to="/" className="btn btn-primary">Back to plans</Link>
      </Empty>
    </>
  )
  return <PlanView plan={plan} />
}

function PlanView({ plan }: { plan: Plan }) {
  const { session } = useAuth()
  const uid = session!.user.id
  const toast = useToast()
  const now = useNow(10_000)
  const phase = planPhase(plan, now)
  const [busy, setBusy] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [redemption, setRedemption] = useState<Redemption | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  const isHost = plan.host_id === uid
  const going = plan.rsvps.some((r) => r.user_id === uid)
  const checkedIn = plan.checkins.some((c) => c.user_id === uid)
  const full = plan.rsvps.length >= plan.max_size
  const checkedInCount = plan.checkins.length

  const loadRedemption = useCallback(async () => {
    const { data } = await supabase.from('redemptions').select('*').eq('plan_id', plan.id).eq('user_id', uid).maybeSingle()
    setRedemption(data as Redemption | null)
  }, [plan.id, uid])

  // A new check-in by someone else can unlock my discount: refetch when the count changes
  useEffect(() => {
    loadRedemption()
  }, [loadRedemption, checkedInCount])

  async function rpc(fn: 'join_plan' | 'leave_plan' | 'cancel_plan', okMsg: string) {
    setBusy(true)
    const { error } = await supabase.rpc(fn, { p_plan: plan.id })
    setBusy(false)
    if (error) toast(errorMessage(error))
    else toast(okMsg)
  }

  const sortedRsvps = [...plan.rsvps].sort((a, b) => (a.user_id === plan.host_id ? -1 : b.user_id === plan.host_id ? 1 : a.created_at.localeCompare(b.created_at)))

  return (
    <>
      <TopBar back right={<button className="icon-btn small" onClick={() => setReportOpen(true)} aria-label="Report this plan">⚑</button>} />

      <Link to={`/venue/${plan.venue.slug}`} className="plan-venue" style={{ background: plan.venue.color }}>
        <span className="plan-venue-emoji" aria-hidden>{plan.venue.emoji}</span>
        <span>
          <strong>{plan.venue.name}</strong>
          <small>{plan.venue.neighborhood} · −{plan.venue.discount_pct}% together</small>
        </span>
        <span aria-hidden>›</span>
      </Link>

      <section className="plan-head">
        <p className={`when when-${phase}`}>
          {phase === 'cancelled' ? 'Cancelled' : phase === 'ended' ? 'Ended' : phase === 'live' ? `Happening now · started ${formatTime(new Date(plan.starts_at))}` : `${formatWhen(plan.starts_at)} · ${relative(plan.starts_at, now)}`}
        </p>
        <h1 className="display">{plan.title}</h1>
        <p className="muted">Hosted by {plan.host.display_name}{isHost && ' (you)'}</p>
        {plan.note && <p className="plan-note">“{plan.note}”</p>}
      </section>

      <section className="card going">
        <div className="going-head">
          <div className="going-count">
            <span className="big-num" aria-live="polite">{plan.rsvps.length}</span>
            <span>going<br /><small className="muted">of max {plan.max_size}</small></span>
          </div>
          <span className="live-dot" title="Updates live">LIVE</span>
        </div>
        <ul className="people">
          {sortedRsvps.map((r) => {
            const isIn = plan.checkins.some((c) => c.user_id === r.user_id)
            const name = r.profile?.display_name ?? 'Someone'
            return (
              <li key={r.user_id}>
                <Avatar name={name} />
                <span>
                  {name}
                  {r.user_id === uid && ' (you)'}
                  {r.user_id === plan.host_id && <small className="muted"> · host</small>}
                </span>
                {isIn && <span className="pill pill-in">✓ Here</span>}
              </li>
            )
          })}
        </ul>
      </section>

      {/* ---------- Main action area ---------- */}
      {phase === 'cancelled' && <div className="card notice">The host cancelled this plan.</div>}
      {phase === 'ended' && !redemption && <div className="card notice">This plan has ended.</div>}

      {!going && phase !== 'cancelled' && phase !== 'ended' && (
        <button className="btn btn-primary btn-block btn-big" disabled={busy || full} onClick={() => rpc('join_plan', "You're in! See you there")}>
          {full ? 'This plan is full' : `Join plan · ${plan.max_size - plan.rsvps.length} spot${plan.max_size - plan.rsvps.length === 1 ? '' : 's'} left`}
        </button>
      )}

      {going && phase === 'upcoming' && (
        <div className="card notice">
          <strong>You're going.</strong> Check-in opens at {formatTime(checkinOpensAt(plan))}
          {' '}({relative(checkinOpensAt(plan).toISOString(), now)}). Go to {plan.venue.name} and ask the staff for the Spotlight code.
        </div>
      )}

      {going && !checkedIn && (phase === 'checkin' || phase === 'live') && (
        <CheckinBox plan={plan} onResult={(r) => {
          if (r.daily_limit_reached) setLimitReached(true)
          loadRedemption()
        }} />
      )}

      {going && checkedIn && !redemption && phase !== 'cancelled' && (
        limitReached ? (
          <div className="card notice">
            You're checked in. You've already used a discount at {plan.venue.name} today (max one per venue per day), but enjoy the company!
          </div>
        ) : (
          <div className="card waiting">
            <div className="progress-dots" aria-hidden>
              {Array.from({ length: RULES.minPeopleForDiscount }, (_, i) => (
                <span key={i} className={i < checkedInCount ? 'on' : ''} />
              ))}
            </div>
            <p><strong>You're checked in!</strong></p>
            <p className="muted">
              The discount unlocks when {RULES.minPeopleForDiscount - checkedInCount} more {RULES.minPeopleForDiscount - checkedInCount === 1 ? 'person checks' : 'people check'} in. This page updates by itself.
            </p>
          </div>
        )
      )}

      {redemption && <Ticket plan={plan} redemption={redemption} />}

      {/* ---------- Secondary actions ---------- */}
      <div className="secondary-actions">
        {going && !isHost && !checkedIn && phase !== 'ended' && phase !== 'cancelled' && (
          <button className="btn btn-text" disabled={busy} onClick={() => rpc('leave_plan', 'You left the plan')}>Leave plan</button>
        )}
        {isHost && phase !== 'ended' && phase !== 'cancelled' && (
          <button className="btn btn-text danger" disabled={busy} onClick={() => {
            if (confirm('Cancel this plan for everyone?')) rpc('cancel_plan', 'Plan cancelled')
          }}>Cancel plan</button>
        )}
        <button className="btn btn-text" onClick={() => setReportOpen(true)}>Report</button>
      </div>
      <p className="muted small center safety-line">Meet inside the venue. <Link to="/safety">Safety tips</Link></p>

      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} plan={plan} />
    </>
  )
}

function CheckinBox({ plan, onResult }: { plan: Plan; onResult: (r: CheckinResult) => void }) {
  const toast = useToast()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error: err } = await supabase.rpc('check_in', { p_plan: plan.id, p_code: code })
    setBusy(false)
    if (err) return setError(errorMessage(err))
    const res = data as CheckinResult
    if (!res.ok) return setError(res.error ?? 'Check-in failed')
    toast(res.unlocked ? `Discount unlocked: −${res.discount_pct}%` : 'Checked in')
    onResult(res)
  }

  return (
    <form className="card checkin" onSubmit={submit}>
      <h2 className="section-title">At {plan.venue.name}? Check in</h2>
      <p className="muted small">Ask the staff for today's Spotlight code (or find it on the table card).</p>
      <div className="row">
        <input
          className="code-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
          placeholder="CODE"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          aria-label="Venue code"
        />
        <button className="btn btn-primary" disabled={busy || code.length < 4}>{busy ? '…' : 'Check in'}</button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </form>
  )
}

function Ticket({ plan, redemption }: { plan: Plan; redemption: Redemption }) {
  const now = useNow(1000)
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now)
  return (
    <section className="ticket" aria-live="polite">
      <p className="ticket-label">Discount unlocked</p>
      <p className="ticket-pct">−{redemption.discount_pct}%</p>
      <p className="ticket-venue">{plan.venue.name}</p>
      <p className="ticket-offer">{plan.venue.offer}</p>
      <div className="ticket-code">
        <span>Code</span>
        <strong>{redemption.code}</strong>
      </div>
      <p className="ticket-clock">
        <span className="pulse" aria-hidden /> Live · {clock}
      </p>
      <p className="ticket-foot">Show this screen to the staff. Valid today only.</p>
    </section>
  )
}

const REASONS = [
  { value: 'unsafe', label: 'Someone made me feel unsafe' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'no_show', label: 'Host or group did not show up' },
  { value: 'other', label: 'Something else' },
]

function ReportSheet({ open, onClose, plan }: { open: boolean; onClose: () => void; plan: Plan }) {
  const toast = useToast()
  const { session } = useAuth()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!reason) return
    setBusy(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: session!.user.id,
      plan_id: plan.id,
      reported_user_id: plan.host_id,
      reason,
      details: details.trim() || null,
    })
    setBusy(false)
    if (error) return toast(errorMessage(error))
    logEvent('report_filed', { plan_id: plan.id, meta: { reason } })
    toast('Thanks. Our team will look at this.')
    setReason('')
    setDetails('')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Report this plan">
      <form className="form" onSubmit={submit}>
        {REASONS.map((r) => (
          <label key={r.value} className="radio">
            <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
            <span>{r.label}</span>
          </label>
        ))}
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={500} placeholder="Anything we should know? (optional)" />
        <p className="muted small">If you are in danger, call 112.</p>
        <button className="btn btn-primary btn-block" disabled={!reason || busy}>Send report</button>
      </form>
    </Sheet>
  )
}
