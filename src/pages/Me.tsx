import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { PlanCard } from '../components/PlanCard'
import { Avatar, Empty, TopBar, useToast } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useNow, usePlans } from '../lib/hooks'
import { errorMessage, supabase } from '../lib/supabase'
import { formatWhen, planPhase } from '../lib/time'
import { AVATARS } from '../lib/avatars'

type MyRedemption = { id: string; code: string; discount_pct: number; created_at: string; plan_id: string; venue: { name: string } | null }

export default function Me() {
  const { profile, session, signOut, refreshProfile } = useAuth()
  const toast = useToast()
  const { plans } = usePlans({ includeEnded: true })
  const now = useNow()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.display_name ?? '')
  const [discounts, setDiscounts] = useState<MyRedemption[]>([])
  const [username, setUsername] = useState(profile?.username ?? '')
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

  useEffect(() => { setUsername(profile?.username ?? '') }, [profile?.username])



  const mine = plans.filter((p) => p.rsvps.some((r) => r.user_id === uid))
  const upcoming = mine.filter((p) => planPhase(p, now) !== 'ended')
  const past = mine.filter((p) => planPhase(p, now) === 'ended').reverse()
  const hosted = mine.filter((p) => p.host_id === uid).length

  async function saveName() {
    const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', uid!)
    if (error) return toast(errorMessage(error))
    await refreshProfile()
    setEditing(false)
    toast('Name saved')
  }

  return (
    <>
      <TopBar title="Me" />
      <section className="me-head">
        <Avatar name={profile?.display_name ?? '?'} size={56} avatarId={profile?.avatar_id} />
        {editing ? (
          <div className="row grow">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="Display name" />
            <button className="btn btn-primary btn-small" onClick={saveName} disabled={!name.trim()}>Save</button>
          </div>
        ) : (
          <div className="grow">
            <h1 className="display small-display">{profile?.display_name}</h1>
            {profile?.username && <p className="muted small">@{profile.username}</p>}
            <p className="muted small">{session?.user.email}{profile?.is_test_account && ' · test account'}</p>
          </div>
        )}
        {!editing && <button className="btn btn-text" onClick={() => { setName(profile?.display_name ?? ''); setEditing(true) }}>Edit</button>}
      </section>

      <section className="card profile-settings">
        <h2 className="section-title">Your username</h2>
        <p className="muted small">Your first name stays as it is. Your username is your unique @handle.</p>
        <div className="row">
          <input value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))} maxLength={20} aria-label="Username" />
          <button className="btn btn-primary btn-small" onClick={async () => {
            const { error } = await supabase.rpc('set_username', { p_username: username.trim().toLowerCase() })
            if (error) return toast(error.message.toLowerCase().includes('duplicate key') ? 'That username is already taken. Try another.' : errorMessage(error))
            await refreshProfile()
            toast('Username saved')
          }} disabled={!username.trim() || username.trim().toLowerCase() === profile?.username}>Save</button>
        </div>
        <p className="muted small">3–20 characters · letters, numbers and underscores. {profile?.username_change_count === 0 ? 'You can make your first change now.' : profile?.username_changed_at ? `Last changed ${formatWhen(profile.username_changed_at)}. Changes are limited to once every 30 days.` : ''}</p>
        <h2 className="section-title">Choose your avatar</h2>
        <p className="muted small">Pick a little Spotlight personality. You can change it whenever you like.</p>
        <div className="avatar-picker" aria-label="Choose your avatar">
          {AVATARS.map((avatar) => (
            <button key={avatar.id} type="button" className={`avatar-choice ${profile?.avatar_id === avatar.id ? "is-selected" : ""}`} style={{ "--avatar-bg": avatar.color } as CSSProperties} aria-label={avatar.name} aria-pressed={profile?.avatar_id === avatar.id} onClick={async () => {
              if (profile?.avatar_id === avatar.id) return
              const { error } = await supabase.rpc('set_avatar', { p_avatar_id: avatar.id })
              if (error) return toast(errorMessage(error))
              await refreshProfile()
              toast("Avatar updated!")
            }}>
              <span>{avatar.emoji}</span><small>{avatar.name}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="stats-row">
        <div><strong>{upcoming.length}</strong><span>upcoming</span></div>
        <div><strong>{hosted}</strong><span>hosted</span></div>
        <div><strong>{discounts.length}</strong><span>discounts</span></div>
      </section>

      <section>
        <h2 className="section-title">Coming up</h2>
        {upcoming.length === 0 ? (
          <Empty title="You haven’t joined a plan yet"><Link to="/" className="btn btn-primary">Browse plans</Link></Empty>
        ) : (
          <div className="list">{upcoming.map((p) => <PlanCard key={p.id} plan={p} now={now} />)}</div>
        )}
      </section>

      {discounts.length > 0 && (
        <section>
          <h2 className="section-title">Discounts you’ve unlocked</h2>
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
          <h2 className="section-title">Past plans</h2>
          <div className="list">{past.slice(0, 5).map((p) => <PlanCard key={p.id} plan={p} now={now} />)}</div>
        </section>
      )}

      <section className="menu">
        <Link to="/amigos">Amigos and profile settings</Link>
        <Link to="/safety">Safety &amp; privacy</Link>
        {profile?.is_admin && <Link to="/admin">Admin tools</Link>}
        <button className="btn btn-text danger" onClick={signOut}>Sign out</button>
      </section>
    </>
  )
}
