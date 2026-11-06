import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { formatWhen, planPhase } from '../lib/time'
import type { Plan } from '../lib/types'
import { AvatarStack } from './ui'

export function PlanCard({ plan, now, showVenue = true }: { plan: Plan; now: number; showVenue?: boolean }) {
  const { session } = useAuth()
  const going = plan.rsvps.length
  const spots = Math.max(plan.max_size - going, 0)
  const phase = planPhase(plan, now)
  const mine = plan.rsvps.some((r) => r.user_id === session?.user.id)
  const names = plan.rsvps.map((r) => r.profile?.display_name ?? '?')

  return (
    <Link to={`/plan/${plan.id}`} className={`plan-card${phase === 'ended' ? ' is-ended' : ''}`}>
      <div className="plan-card-emoji" style={{ background: plan.venue.color }} aria-hidden>
        {plan.venue.emoji}
      </div>
      <div className="plan-card-body">
        <div className="plan-card-top">
          <span className={`when when-${phase}`}>
            {phase === 'live' ? 'Happening now' : phase === 'ended' ? 'Ended' : formatWhen(plan.starts_at)}
          </span>
          {mine && <span className="pill pill-going">You're going</span>}
        </div>
        <h3 className="plan-card-title">{plan.title}</h3>
        {showVenue && (
          <p className="plan-card-venue">
            {plan.venue.name} · {plan.venue.neighborhood}
          </p>
        )}
        <div className="plan-card-meta">
          <AvatarStack names={names} />
          <span>
            <strong>{going} going</strong>
            {phase !== 'ended' && <> · {spots === 0 ? 'Full' : `${spots} spot${spots === 1 ? '' : 's'} left`}</>}
          </span>
          <span className="discount-chip">−{plan.venue.discount_pct}%</span>
        </div>
      </div>
    </Link>
  )
}
