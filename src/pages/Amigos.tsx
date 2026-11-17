import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Empty, Spinner, TopBar, useToast } from '../components/ui'
import { useAuth } from '../lib/auth'
import { errorMessage, supabase } from '../lib/supabase'

type Lighter = { user_id: string; display_name: string; username?: string; avatar_path?: string | null; avatar_url?: string | null }
type RequestRow = {
  request_id: string
  user_id: string
  display_name: string
  direction: 'received' | 'sent'
  created_at: string
  username?: string
  avatar_path?: string | null
}

export default function Amigos() {
  const { profile, session, refreshProfile } = useAuth()
  const toast = useToast()
  const [amigos, setAmigos] = useState<Lighter[]>([])
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [results, setResults] = useState<Lighter[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  const reload = useCallback(async () => {
    const [friendsResult, requestsResult] = await Promise.all([
      supabase.rpc('list_amigos'),
      supabase.rpc('list_amigo_requests'),
    ])
    if (friendsResult.error) toast(errorMessage(friendsResult.error))
    else setAmigos((friendsResult.data ?? []) as Lighter[])
    if (requestsResult.error) toast(errorMessage(requestsResult.error))
    else setRequests((requestsResult.data ?? []) as RequestRow[])
    const people = [...((friendsResult.data ?? []) as Lighter[]), ...((requestsResult.data ?? []) as RequestRow[])]
    const signed = await Promise.all(people.filter((p) => p.avatar_path).map(async (p) => {
      const { data } = await supabase.storage.from('profile-photos').createSignedUrl(p.avatar_path!, 3600)
      return [p.user_id, data?.signedUrl ?? ''] as const
    }))
    setPhotoUrls((old) => ({ ...old, ...Object.fromEntries(signed.filter(([, url]) => url)) }))
    setLoading(false)
  }, [toast])

  useEffect(() => { void reload() }, [reload])

  async function toggleDiscovery() {
    if (!session?.user.id) return
    const next = !profile?.discoverable
    const { error } = await supabase.from('profiles').update({ discoverable: next }).eq('id', session.user.id)
    if (error) return toast(errorMessage(error))
    await refreshProfile()
    toast(next ? 'Your profile now appears in search' : 'Your profile no longer appears in search')
  }

  async function search(e: FormEvent) {
    e.preventDefault()
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const { data, error } = await supabase.rpc('search_lighters', { p_query: query.trim() })
    setSearching(false)
    if (error) return toast(errorMessage(error))
    const found = ((data ?? []) as Lighter[]).filter((p) => !amigos.some((a) => a.user_id === p.user_id))
    setResults(found)
    const signed = await Promise.all(found.filter((p) => p.avatar_path).map(async (p) => {
      const { data: signedData } = await supabase.storage.from('profile-photos').createSignedUrl(p.avatar_path!, 3600)
      return [p.user_id, signedData?.signedUrl ?? ''] as const
    }))
    setPhotoUrls((old) => ({ ...old, ...Object.fromEntries(signed.filter(([, url]) => url)) }))
  }

  async function reportProfile(userId: string, contentType: 'username' | 'photo') {
    const reason = window.prompt(contentType === 'photo' ? 'Why are you reporting this profile photo?' : 'Why are you reporting this username?')
    if (!reason) return
    const { error } = await supabase.rpc('report_profile', { p_user: userId, p_content_type: contentType, p_reason: reason.trim() })
    if (error) return toast(errorMessage(error))
    toast('Report sent to the Spotlight team')
  }

  async function sendRequest(userId: string) {
    setBusyId(userId)
    const { error } = await supabase.rpc('send_amigo_request', { p_recipient: userId })
    setBusyId(null)
    if (error) return toast(errorMessage(error))
    setResults((old) => old.filter((p) => p.user_id !== userId))
    await reload()
    toast('Request sent')
  }

  async function respond(requestId: string, accept: boolean) {
    setBusyId(requestId)
    const { error } = await supabase.rpc('respond_amigo_request', { p_request: requestId, p_accept: accept })
    setBusyId(null)
    if (error) return toast(errorMessage(error))
    await reload()
    toast(accept ? 'You’re now Amigos' : 'Request declined')
  }

  async function removeAmigo(userId: string) {
    if (!window.confirm('Remove this person from your Amigos?')) return
    setBusyId(userId)
    const { error } = await supabase.rpc('remove_amigo', { p_user: userId })
    setBusyId(null)
    if (error) return toast(errorMessage(error))
    await reload()
    toast('Amigo removed')
  }

  const inviteText = encodeURIComponent('I’m trying Spotlight, an app for finding and making plans around Copenhagen. Have a look: https://minmail1006-dev.github.io/spotlight/')
  const inviteUrl = `https://wa.me/?text=${inviteText}`

  return (
    <>
      <TopBar title="Amigos" />
      <section className="amigos-intro">
        <p className="eyebrow">AMIGOS</p>
        <h1 className="display">Find people you know.</h1>
        <p className="muted">Search by name or username to send an Amigo request.</p>
      </section>

      <section className="card amigos-discovery">
        <div className="amigos-toggle-copy">
          <strong>Show up in search</strong>
          <p className="muted small">When this is on, other people can find you by your first name or username.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(profile?.discoverable)}
          className={`discovery-switch ${profile?.discoverable ? 'is-on' : ''}`}
          onClick={toggleDiscovery}
        >
          <span />
          <span className="sr-only">{profile?.discoverable ? 'Turn off discovery' : 'Turn on discovery'}</span>
        </button>
      </section>

      <section>
        <div className="section-head">
          <h2 className="section-title">Find people</h2>
        </div>
        <form className="amigos-search" onSubmit={search}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or username" aria-label="Search people" />
          <button className="btn btn-primary btn-small" disabled={searching || query.trim().length < 2}>{searching ? 'Searching…' : 'Search'}</button>
        </form>
        {results.length > 0 && <div className="amigos-list">
          {results.map((person) => <div className="amigo-row" key={person.user_id}>
            <Avatar name={person.display_name} src={photoUrls[person.user_id]} />
            <div className="grow"><strong>{person.display_name}</strong><p className="muted small">@{person.username}</p></div>
            <button className="btn btn-text btn-small" onClick={() => reportProfile(person.user_id, 'username')}>Report name</button>{person.avatar_path && <button className="btn btn-text btn-small" onClick={() => reportProfile(person.user_id, 'photo')}>Report photo</button>}
            <button className="btn btn-ghost btn-small" disabled={busyId === person.user_id} onClick={() => sendRequest(person.user_id)}>Add</button>
          </div>)}
        </div>}
        {query.trim().length >= 2 && !searching && results.length === 0 && <p className="muted small">No one found. Try a different name.</p>}
      </section>

      {requests.some((r) => r.direction === 'received') && <section>
        <h2 className="section-title">Received requests</h2>
        <div className="amigos-list">
          {requests.filter((r) => r.direction === 'received').map((request) => <div className="amigo-row request-row" key={request.request_id}>
            <Avatar name={request.display_name} src={photoUrls[request.user_id]} />
            <div className="grow"><strong>{request.display_name}</strong><p className="muted small">@{request.username}</p></div>
            <button className="btn btn-primary btn-small" disabled={busyId === request.request_id} onClick={() => respond(request.request_id, true)}>Accept</button>
            <button className="btn btn-text btn-small" disabled={busyId === request.request_id} onClick={() => respond(request.request_id, false)}>Decline</button>
          </div>)}
        </div>
      </section>}

      {requests.some((r) => r.direction === 'sent') && <section>
        <h2 className="section-title">Sent</h2>
        <div className="amigos-list">
          {requests.filter((r) => r.direction === 'sent').map((request) => <div className="amigo-row" key={request.request_id}>
            <Avatar name={request.display_name} />
            <span>{request.display_name}</span>
            <span className="muted small">Waiting for a reply</span>
          </div>)}
        </div>
      </section>}

      <section>
        <div className="section-head">
          <h2 className="section-title">Your Amigos</h2>
          <span className="muted small">{amigos.length}</span>
        </div>
        {loading ? <Spinner /> : amigos.length === 0 ? (
          <Empty title="No Amigos yet">Search for someone above, or send them an invite.</Empty>
        ) : <div className="amigos-list">
          {amigos.map((person) => <div className="amigo-row" key={person.user_id}>
            <Avatar name={person.display_name} src={photoUrls[person.user_id]} />
            <div className="grow"><strong>{person.display_name}</strong><p className="muted small">@{person.username}</p></div>
            <button className="btn btn-text btn-small" onClick={() => reportProfile(person.user_id, 'username')}>Report name</button>{person.avatar_path && <button className="btn btn-text btn-small" onClick={() => reportProfile(person.user_id, 'photo')}>Report photo</button>}
            <button className="btn btn-text btn-small danger" disabled={busyId === person.user_id} onClick={() => removeAmigo(person.user_id)}>Remove</button>
          </div>)}
        </div>}
      </section>

      <section className="card amigos-invite">
        <p className="eyebrow">INVITE SOMEONE</p>
        <h2 className="display small-display">Know someone who’d use this?</h2>
        <p className="muted small">Send them a link to Spotlight.</p>
        <div className="row">
          <a className="btn btn-primary btn-small" href={inviteUrl} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="btn btn-ghost btn-small" href="https://www.messenger.com/" target="_blank" rel="noreferrer">Messenger</a>
          <a className="btn btn-ghost btn-small" href={`sms:?&body=${inviteText}`}>Text message</a>
          <a className="btn btn-ghost btn-small" href={`mailto:?subject=Join%20me%20on%20Spotlight&body=${inviteText}`}>Email</a>
        </div>
      </section>
      <p className="muted small center">Amigos are people you’ve connected with. Being on the same Plan doesn’t add someone automatically.</p>
      <Link to="/safety" className="link small">Safety &amp; privacy</Link>
    </>
  )
}
