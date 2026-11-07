import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PlanCard } from '../components/PlanCard'
import { Empty, Spinner, TopBar } from '../components/ui'
import { useNow, usePlans, useVenues } from '../lib/hooks'
import { logEvent } from '../lib/log'
import { planPhase } from '../lib/time'

export default function VenuePage() {
  const { slug } = useParams()
  const { venues, loading } = useVenues()
  const venue = venues.find((v) => v.slug === slug)
  const { plans, loading: plansLoading } = usePlans({ venueId: venue?.id })
  const now = useNow()

  useEffect(() => {
    if (venue) logEvent('view_venue', { venue_id: venue.id })
  }, [venue])

  if (loading) return <Spinner />
  if (!venue) return <Empty title="Venue not found" />

  const upcoming = plans.filter((p) => planPhase(p, now) !== 'ended')

  return (
    <>
      <TopBar back="/venues" />
      <section className="venue-hero" style={{ background: venue.color }}>
        <span className="venue-hero-emoji" aria-hidden>{venue.emoji}</span>
        <div>
          <h1 className="display light">{venue.name}</h1>
          <p className="venue-hero-sub">
            {venue.category} · {venue.neighborhood}
          </p>
        </div>
      </section>

      <section className="offer card">
        <div className="offer-pct">−{venue.discount_pct}%</div>
        <div>
          <p className="offer-text">{venue.offer}</p>
          <p className="muted small">Unlocks when 2 or more Spotlight users on the same plan check in here.</p>
          {venue.quiet_hours && <p className="muted small">Best times: {venue.quiet_hours}</p>}
        </div>
      </section>

      <section>
        <p>{venue.description}</p>
        <p className="muted small">
          {venue.address}
          {venue.is_fictional && <span className="pill pill-demo">Fictional demo venue</span>}
        </p>
        {venue.lat != null && (
          <Link to={`/map?venue=${venue.slug}`} className="link">◎ Show on map</Link>
        )}
      </section>

      <section>
        <div className="section-head">
          <h2 className="section-title">Plans here</h2>
        </div>
        {plansLoading ? (
          <Spinner />
        ) : upcoming.length === 0 ? (
          <Empty title="No plans here yet">
            <p>Post one and others can join you.</p>
          </Empty>
        ) : (
          <div className="list">
            {upcoming.map((p) => (
              <PlanCard key={p.id} plan={p} now={now} showVenue={false} />
            ))}
          </div>
        )}
        <Link to={`/new?venue=${venue.slug}`} className="btn btn-primary btn-block">
          Post a plan at {venue.name}
        </Link>
      </section>
    </>
  )
}
