import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlanCard } from '../components/PlanCard'
import { Avatar, Empty, TopBar, useToast } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useNow, usePlans } from '../lib/hooks'
import { errorMessage, supabase } from '../lib/supabase'
import { formatWhen, planPhase } from '../lib/time'

type MyRedemption = { id: string; code: string; discount_pct: number; created_at: string; plan_id: string; venue: { name: string } | null }

export default function Me() {
  const { profile, session, signOut, refreshProfile } = useAuth()
  const toast = useToast()
  const { plans } = usePlans({ includeEnded: true })
  const now = useNow()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.display_name ?? '')
  const [discounts, setDiscounts] = useState<MyRedemption[]>([])
  const uid = session?.user.id

  useEffect(() => {
    if (!uid) return
    supabase
      .from('redemptions')
      .select('id, code, discount_pct, created_at, plan_id, venue:venues(name)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .then(({ data }) => setDiscounts((data as unknown as MyRedemption[]) ?? []))
  }, [uid])

  const mine = plans.filter((p) => p.rsvps.some((r) => r.user_id === uid))
  const upcoming = mine.filter((p) => planPhase(p, now) !== 'ended')
  const past = mine.filter((p) => planPhase(p, now) === 'ended').reverse()
  const hosted = mine.filter((p) => p.host_id === uid).length

  async function saveName() {
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', uid!)
    if (error) return toast(errorMessage(error))
    await refreshProfile()
    setEditing(false)
    toast('Name updated')
  }

  return (
    <>
      <TopBar title="Me" />
      <section className="me-head">
        <Avatar name={profile?.display_name ?? '?'} size={56} />
        {editing ? (
          <div className="row grow">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="Display name" />
            <button className="btn btn-primary btn-small" onClick={saveName} disabled={!name.trim()}>Save</button>
          </div>
        ) : (
          <div className="grow">
            <h1 className="display small-display">{profile?.display_name}</h1>
            <p className="muted small">{session?.user.email}{profile?.is_test_account && ' · test account'}</p>
          </div>
        )}
        {!editing && <button className="btn btn-text" onClick={() => { setName(profile?.display_name ?? ''); setEditing(true) }}>Edit</button>}
      </section>

      <section className="stats-row">
        <div><strong>{upcoming.length}</strong><span>upcoming</span></div>
        <div><strong>{hosted}</strong><span>hosted</span></div>
        <div><strong>{discounts.length}</strong><span>discounts</span></div>
      </section>

      <section>
        <h2 className="section-title">Upcoming</h2>
        {upcoming.length === 0 ? (
          <Empty title="Nothing planned yet"><Link to="/" className="btn btn-primary">Find a plan</Link></Empty>
        ) : (
          <div className="list">{upcoming.map((p) => <PlanCard key={p.id} plan={p} now={now} />)}</div>
        )}
      </section>

      {discounts.length > 0 && (
        <section>
          <h2 className="section-title">Your discounts</h2>
          <ul className="simple-list">
            {discounts.map((d) => (
              <li key={d.id}>
                <Link to={`/plan/${d.plan_id}`}>−{d.discount_pct}% at {d.venue?.name}</Link>
                <span className="muted small">{formatWhen(d.created_at)} · {d.code}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="section-title">Past</h2>
          <div className="list">{past.slice(0, 5).map((p) => <PlanCard key={p.id} plan={p} now={now} />)}</div>
        </section>
      )}

      <section className="menu">
        <Link to="/safety">Safety &amp; privacy</Link>
        {profile?.is_admin && <Link to="/admin">Admin &amp; test tools</Link>}
        <button className="btn btn-text danger" onClick={signOut}>Sign out</button>
      </section>
    </>
  )
}
