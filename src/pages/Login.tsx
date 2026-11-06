import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Spinner } from '../components/ui'
import { TEST_ACCOUNTS, TEST_PASSWORD } from '../config'
import { useAuth } from '../lib/auth'
import { errorMessage, supabase } from '../lib/supabase'

export default function Login() {
  const { session, loading } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from ?? '/'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [over18, setOver18] = useState(false)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <div className="center-screen"><Spinner /></div>
  if (session) return <Navigate to={from} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (mode === 'signup') {
      if (!over18) return setError('You need to be 18 or over to use Spotlight.')
      if (!consent) return setError('Please accept how test data is used.')
      if (name.trim().length < 1) return setError('Tell us what to call you.')
    }
    setBusy(true)
    const res =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { display_name: name.trim(), over18: true, consent: true } },
          })
    setBusy(false)
    if (res.error) return setError(errorMessage(res.error))
    if (mode === 'signup' && !res.data.session) {
      return setError('Account created. Check your email to confirm, then sign in.')
    }
    nav(from, { replace: true })
  }

  async function quickLogin(acc: { email: string }) {
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email: acc.email, password: TEST_PASSWORD })
    setBusy(false)
    if (err) setError(errorMessage(err))
    else nav(from, { replace: true })
  }

  return (
    <div className="login">
      <div className="login-hero">
        <div className="login-beam" aria-hidden />
        <h1 className="login-logo">Spotlight</h1>
        <p className="login-tagline">
          Spontaneous plans at great places in Copenhagen, with people who are up for it too.
        </p>
      </div>

      <div className="login-card">
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'on' : ''} onClick={() => setMode('signin')}>
            Sign in
          </button>
          <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="form">
          {mode === 'signup' && (
            <label className="field">
              <span>First name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="given-name" placeholder="What should people call you?" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
          </label>
          {mode === 'signup' && (
            <>
              <label className="check">
                <input type="checkbox" checked={over18} onChange={(e) => setOver18(e.target.checked)} />
                <span>I am 18 or older</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>
                  I understand Spotlight is a student prototype. My first name is shown to other users, and what I do in the app is logged to evaluate the test.{' '}
                  <Link to="/safety">Safety &amp; privacy</Link>
                </span>
              </label>
            </>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>

      <div className="login-card quick">
        <h2 className="section-title">Quick login for testing</h2>
        <p className="muted small">Fictional test accounts. Use a different one on each phone.</p>
        <div className="quick-grid">
          {TEST_ACCOUNTS.map((a) => (
            <button key={a.email} className="btn btn-ghost" onClick={() => quickLogin(a)} disabled={busy}>
              {a.name}
            </button>
          ))}
        </div>
      </div>

      <p className="login-foot">
        <Link to="/safety">Safety &amp; privacy</Link> · Student MVP · All venues are fictional
      </p>
    </div>
  )
}
