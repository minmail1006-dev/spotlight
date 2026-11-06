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
        <p className="muted">What are you up for?</p>
      </section>

      {!introSeen && (
        <section className="intro card">
          <h2 className="section-title">How Spotlight works</h2>
          <ol className="steps">
            <li><strong>Find a plan</strong> at a venue, or post your own.</li>
            <li><strong>Join</strong> and see who else is going.</li>
            <li><strong>Check in</strong> at the venue with the code from the staff.</li>
            <li>When <strong>2 or more</strong> of you check in, the <strong>discount unlocks</strong>.</li>
          </ol>
          <button className="btn btn-ghost btn-small" onClick={dismissIntro}>Got it</button>
        </section>
      )}

      {mine.length > 0 && (
        <section>
          <h2 className="section-title">Your plans</h2>
          <div className="list">
            {mine.map((p) => (
              <PlanCard key={p.id} plan={p} now={now} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-head">
          <h2 className="section-title">Open plans</h2>
          <Link to="/new" className="link">+ Post a plan</Link>
        </div>
        <div className="chips" role="group" aria-label="When">
          {(['all', 'now', 'today', 'week'] as When[]).map((w) => (
            <button key={w} className={`chip${when === w ? ' on' : ''}`} onClick={() => setWhen(w)}>
              {w === 'all' ? 'Any time' : w === 'now' ? 'Soon' : w === 'today' ? 'Today' : 'This week'}
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
          <Empty title="Could not load plans">{error}</Empty>
        ) : filtered.length === 0 ? (
          <Empty title="No plans match yet">
            <p>Be the first. Someone nearby is probably thinking the same.</p>
            <Link to="/new" className="btn btn-primary">Post a plan</Link>
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
