import { useCallback, useEffect, useMemo, useState } from 'react'
import { Empty, Spinner, TopBar, useToast } from '../components/ui'
import { TEST_ACCOUNTS, TEST_PASSWORD } from '../config'
import { useAuth } from '../lib/auth'
import { errorMessage, supabase } from '../lib/supabase'
import { formatWhen } from '../lib/time'
import type { EventRow } from '../lib/types'

type ProfileLite = { id: string; display_name: string; is_admin: boolean; seed_key: string | null }
type ReportRow = { id: string; reason: string; details: string | null; created_at: string; plan: { title: string } | null; reporter: { display_name: string } | null }

function median(xs: number[]) {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const fmtMin = (ms: number | null) => (ms == null ? '–' : ms < 60_000 ? `${Math.round(ms / 1000)} s` : `${(ms / 60_000).toFixed(1)} min`)

export default function Admin() {
  const { profile } = useAuth()
  const toast = useToast()
  const [events, setEvents] = useState<EventRow[]>([])
  const [people, setPeople] = useState<Record<string, ProfileLite>>({})
  const [codes, setCodes] = useState<{ venue_name: string; code: string }[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [ev, pr, vc, rp] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: true }).limit(10000),
      supabase.from('profiles').select('id, display_name, is_admin, seed_key'),
      supabase.rpc('get_venue_codes'),
      supabase.from('reports').select('id, reason, details, created_at, plan:plans(title), reporter:profiles!reports_reporter_id_fkey(display_name)').order('created_at', { ascending: false }),
    ])
    setEvents((ev.data as EventRow[]) ?? [])
    setPeople(Object.fromEntries(((pr.data as ProfileLite[]) ?? []).map((p) => [p.id, p])))
    setCodes((vc.data as { venue_name: string; code: string }[]) ?? [])
    setReports((rp.data as unknown as ReportRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (profile?.is_admin) load()
  }, [profile, load])

  // Only count real test users (not the admin or the fictional seed hosts)
  const testEvents = useMemo(
    () => events.filter((e) => e.user_id && !people[e.user_id]?.is_admin && !people[e.user_id]?.seed_key),
    [events, people],
  )

  const stats = useMemo(() => {
    const count = (n: string) => testEvents.filter((e) => e.name === n).length
    const usersWith = (n: string) => new Set(testEvents.filter((e) => e.name === n).map((e) => e.user_id)).size
    const active = new Set(testEvents.map((e) => e.user_id)).size

    // Time from the start of the session to the discount unlocking
    const toUnlock: number[] = []
    for (const u of testEvents.filter((e) => e.name === 'discount_unlocked')) {
      const t = new Date(u.created_at).getTime()
      const start = [...testEvents].reverse().find((e) => e.user_id === u.user_id && e.name === 'session_start' && new Date(e.created_at).getTime() <= t)
      if (start) toUnlock.push(t - new Date(start.created_at).getTime())
    }
    // Time from joining/posting a plan to checking in
    const joinToCheckin: number[] = []
    for (const c of testEvents.filter((e) => e.name === 'checked_in')) {
      const j = testEvents.find((e) => e.user_id === c.user_id && e.plan_id === c.plan_id && (e.name === 'plan_joined' || e.name === 'plan_posted'))
      if (j) joinToCheckin.push(new Date(c.created_at).getTime() - new Date(j.created_at).getTime())
    }
    return {
      active,
      posted: count('plan_posted'),
      joined: count('plan_joined'),
      left: count('plan_left'),
      cancelled: count('plan_cancelled'),
      checkins: count('checked_in'),
      failed: count('checkin_failed'),
      unlocked: count('discount_unlocked'),
      reports: count('report_filed'),
      usersPostedOrJoined: new Set(testEvents.filter((e) => e.name === 'plan_joined' || e.name === 'plan_posted').map((e) => e.user_id)).size,
      usersCheckedIn: usersWith('checked_in'),
      usersUnlocked: usersWith('discount_unlocked'),
      medianToUnlock: median(toUnlock),
      medianJoinToCheckin: median(joinToCheckin),
      nUnlockTimes: toUnlock.length,
    }
  }, [testEvents])

  async function reset(clearEvents: boolean) {
    const msg = clearEvents
      ? 'Delete ALL plans, check-ins AND the event log, then add fresh sample plans? Download the CSV first if you need the data.'
      : 'Delete all plans, RSVPs and check-ins and add fresh sample plans? The event log is kept.'
    if (!confirm(msg)) return
    setBusy(true)
    const { data, error } = await supabase.rpc('reset_demo_data', { p_clear_events: clearEvents })
    setBusy(false)
    if (error) return toast(errorMessage(error))
    toast(`Reset done. ${(data as { seeded_plans: number }).seeded_plans} sample plans added.`)
    load()
  }

  function downloadCsv() {
    const header = ['time_utc', 'user', 'test_user', 'event', 'session', 'plan_id', 'venue_id', 'meta']
    const rows = events.map((e) => [
      e.created_at,
      e.user_id ? people[e.user_id]?.display_name ?? e.user_id : '',
      e.user_id && !people[e.user_id]?.is_admin && !people[e.user_id]?.seed_key ? 'yes' : 'no',
      e.name,
      e.session_id ?? '',
      e.plan_id ?? '',
      e.venue_id ?? '',
      JSON.stringify(e.meta ?? {}),
    ])
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `spotlight-events-${new Date().toISOString().slice(0, 16).replace(':', '')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!profile?.is_admin) return (<><TopBar back title="Admin" /><Empty title="Admins only" /></>)
  if (loading) return <Spinner />

  const pct = (a: number, b: number) => (b === 0 ? '–' : `${Math.round((a / b) * 100)}%`)

  return (
    <>
      <TopBar back title="Admin & test tools" right={<button className="btn btn-text" onClick={load}>Refresh</button>} />

      <section className="card">
        <h2 className="section-title">Test results</h2>
        <p className="muted small">Counts only include test users (not the admin or the fictional sample hosts).</p>
        <div className="kpis">
          <div><strong>{stats.active}</strong><span>active users</span></div>
          <div><strong>{stats.posted}</strong><span>plans posted</span></div>
          <div><strong>{stats.joined}</strong><span>joins</span></div>
          <div><strong>{stats.checkins}</strong><span>check-ins</span></div>
          <div><strong>{stats.failed}</strong><span>wrong codes</span></div>
          <div><strong>{stats.unlocked}</strong><span>discounts unlocked</span></div>
          <div><strong>{stats.left}</strong><span>left a plan</span></div>
          <div><strong>{stats.reports}</strong><span>reports</span></div>
        </div>
        <h3 className="sub-title">Funnel (users)</h3>
        <table className="table">
          <tbody>
            <tr><td>Opened the app</td><td>{stats.active}</td><td></td></tr>
            <tr><td>Posted or joined a plan</td><td>{stats.usersPostedOrJoined}</td><td>{pct(stats.usersPostedOrJoined, stats.active)}</td></tr>
            <tr><td>Checked in</td><td>{stats.usersCheckedIn}</td><td>{pct(stats.usersCheckedIn, stats.active)}</td></tr>
            <tr><td>Unlocked a discount</td><td>{stats.usersUnlocked}</td><td>{pct(stats.usersUnlocked, stats.active)}</td></tr>
          </tbody>
        </table>
        <h3 className="sub-title">Time</h3>
        <table className="table">
          <tbody>
            <tr><td>Median: open app → discount unlocked</td><td>{fmtMin(stats.medianToUnlock)}</td><td className="muted small">n={stats.nUnlockTimes}</td></tr>
            <tr><td>Median: join/post → check-in</td><td>{fmtMin(stats.medianJoinToCheckin)}</td><td></td></tr>
          </tbody>
        </table>
        <button className="btn btn-primary btn-block" onClick={downloadCsv}>Download event log (CSV)</button>
      </section>

      <section className="card">
        <h2 className="section-title">Reset test data</h2>
        <p className="muted small">Use between test sessions. Sample plans are re-created relative to the current time.</p>
        <div className="stack">
          <button className="btn btn-ghost btn-block" disabled={busy} onClick={() => reset(false)}>Reset plans (keep event log)</button>
          <button className="btn btn-ghost btn-block danger" disabled={busy} onClick={() => reset(true)}>Reset everything incl. event log</button>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Venue check-in codes</h2>
        <p className="muted small">In real life staff would give these out. In the test, the facilitator does.</p>
        <table className="table codes">
          <tbody>
            {codes.map((c) => (
              <tr key={c.venue_name}><td>{c.venue_name}</td><td><code>{c.code}</code></td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="section-title">Test accounts</h2>
        <p className="small">Password for all: <code>{TEST_PASSWORD}</code></p>
        <ul className="simple-list">
          {TEST_ACCOUNTS.map((a) => <li key={a.email}><span>{a.name}</span><span className="muted small">{a.email}</span></li>)}
        </ul>
      </section>

      <section className="card">
        <h2 className="section-title">Reports ({reports.length})</h2>
        {reports.length === 0 ? <p className="muted small">No reports.</p> : (
          <ul className="simple-list">
            {reports.map((r) => (
              <li key={r.id}>
                <span><strong>{r.reason}</strong> · {r.plan?.title ?? 'deleted plan'}{r.details && <> · “{r.details}”</>}</span>
                <span className="muted small">{r.reporter?.display_name} · {formatWhen(r.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">Latest events</h2>
        <ul className="event-log">
          {[...events].reverse().slice(0, 40).map((e) => (
            <li key={e.id}>
              <span className="muted small">{formatWhen(e.created_at)}</span>
              <span>{e.user_id ? people[e.user_id]?.display_name ?? '?' : '–'}</span>
              <code>{e.name}</code>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
