import { Link } from 'react-router-dom'
import { Spinner, TopBar } from '../components/ui'
import { useNow, usePlans, useVenues } from '../lib/hooks'
import { planPhase } from '../lib/time'

export default function Venues() {
  const { venues, loading } = useVenues()
  const { plans } = usePlans()
  const now = useNow()

  return (
    <>
      <TopBar title="Venues" />
      <p className="muted lead">Partner venues give Spotlight users a discount when they show up together.</p>
      {loading ? (
        <Spinner />
      ) : (
        <div className="venue-grid">
          {venues.map((v) => {
            const count = plans.filter((p) => p.venue_id === v.id && planPhase(p, now) !== 'ended').length
            return (
              <Link key={v.id} to={`/venue/${v.slug}`} className="venue-card">
                <div className="venue-card-art" style={{ background: v.color }} aria-hidden>
                  <span>{v.emoji}</span>
                  <span className="discount-badge">−{v.discount_pct}%</span>
                </div>
                <div className="venue-card-body">
                  <h3>{v.name}</h3>
                  <p className="muted small">
                    {v.category} · {v.neighborhood}
                  </p>
                  <p className="small venue-card-plans">{count === 0 ? 'No plans yet' : `${count} open plan${count === 1 ? '' : 's'}`}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
      <p className="muted small center">All venues in this prototype are fictional.</p>
    </>
  )
}
