import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlanCard } from '../components/PlanCard'
import { Empty, Spinner, TopBar } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useNow, usePlans } from '../lib/hooks'
import { addDays, cphDateKey, planPhase } from '../lib/time'

type When = 'all' | 'now' | 'today' | 'week'

function readIntroSeen() {
  try {
    return localStorage.getItem('spotlight-intro-seen') === '1'
  } catch {
    return false
  }
}

export default function Discover() {
  const { profile, session } = useAuth()
  const { plans, loading, error } = usePlans()
  const now = useNow()
  const [when, setWhen] = useState<When>('all')
  const [category, setCategory] = useState<string>('All')
  const [area, setArea] = useState<string>('All areas')
  const [introSeen, setIntroSeen] = useState(readIntroSeen)

  const visible = useMemo(() => plans.filter((p) => planPhase(p, now) !== 'ended'), [plans, now])
  const categories = useMemo(() => ['All', ...new Set(visible.map((p) => p.venue.category))], [visible])
  const areas = useMemo(() => ['All areas', ...new Set(visible.map((p) => p.venue.neighborhood))].sort(), [visible])

  const filtered = visible.filter((p) => {
    const phase = planPhase(p, now)
    const today = cphDateKey(new Date(now))
    const key = cphDateKey(new Date(p.starts_at))
    if (when === 'now' && !(phase === 'live' || phase === 'checkin' || new Date(p.starts_at).getTime() - now < 2 * 3600_000)) return false
    if (when === 'today' && key !== today) return false
    if (when === 'week' && key > addDays(today, 7)) return false
    if (category !== 'All' && p.venue.category !== category) return false
    if (area !== 'All areas' && p.venue.neighborhood !== area) return false
    return true
  })

  const mine = visible.filter((p) => p.rsvps.some((r) => r.user_id === session?.user.id))

  function dismissIntro() {
    setIntroSeen(true)
    try {
      localStorage.setItem('spotlight-intro-seen', '1')
    } catch {
      /* private mode: fine */
    }
  }

  return (
    <>
      <TopBar right={profile?.is_admin ? <Link to="/admin" className="pill">Admin</Link> : null} />
      <section className="hello">
        <h1 className="display">Hi {profile?.display_name ?? 'there'}</h1>
        <p className="muted">Anything happening?</p>
      </section>

      {!introSeen && (
        <section className="intro card">
          <h2 className="section-title">A quick guide</h2>
          <ol className="steps">
            <li><strong>Pick a plan</strong> at a Spot, or put one up yourself.</li>
            <li>Join and see who else is going.</li>
            <li>Check in at the Spot with the code from the staff.</li>
            <li>The discount applies once at least two people have checked in.</li>
          </ol>
          <button className="btn btn-ghost btn-small" onClick={dismissIntro}>Makes sense</button>
        </section>
      )}

      {mine.length > 0 && (
        <section>
          <h2 className="section-title">You’re going to</h2>
          <div className="list">
            {mine.map((p) => (
              <PlanCard key={p.id} plan={p} now={now} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-head">
          <h2 className="section-title">Plans coming up</h2>
          <span className="row-links">
            <Link to="/map" className="link">◎ Map</Link>
            <Link to="/new" className="link">+ Put a plan up</Link>
          </span>
        </div>
        <div className="chips" role="group" aria-label="When">
          {(['all', 'now', 'today', 'week'] as When[]).map((w) => (
            <button key={w} className={`chip${when === w ? ' on' : ''}`} onClick={() => setWhen(w)}>
              {w === 'all' ? 'Whenever' : w === 'now' ? 'Soon' : w === 'today' ? 'Today' : 'Next 7 days'}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Category">
          {categories.map((c) => (
            <button key={c} className={`chip${category === c ? ' on' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
          <select className="chip-select" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Neighbourhood">
            {areas.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <Empty title="Plans aren’t loading">{error}</Empty>
        ) : filtered.length === 0 ? (
          <Empty title="Nothing here just now">
            <p>Nothing fits those filters. Try another time or area.</p>
            <Link to="/new" className="btn btn-primary">Put a plan up</Link>
          </Empty>
        ) : (
          <div className="list">
            {filtered.map((p) => (
              <PlanCard key={p.id} plan={p} now={now} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
