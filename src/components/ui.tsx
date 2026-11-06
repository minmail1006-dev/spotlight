import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/* ---------- Toasts ---------- */

const ToastContext = createContext<(msg: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const show = useCallback((m: string) => {
    setMsg(m)
    setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 3200)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg && (
        <div className="toast" role="status">
          {msg}
        </div>
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}

/* ---------- Small building blocks ---------- */

export function Avatar({ name, size = 32, ring }: { name: string; size?: number; ring?: boolean }) {
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)
  return (
    <span
      className={`avatar${ring ? ' avatar-ring' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${hue} 55% 42%)` }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max)
  return (
    <span className="avatar-stack">
      {shown.map((n, i) => (
        <Avatar key={i} name={n} size={26} ring />
      ))}
      {names.length > max && <span className="avatar-more">+{names.length - max}</span>}
    </span>
  )
}

export function TopBar({ title, back, right }: { title?: string; back?: boolean | string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="topbar">
      {back ? (
        <button
          className="icon-btn"
          aria-label="Back"
          onClick={() => (typeof back === 'string' ? nav(back) : window.history.length > 1 ? nav(-1) : nav('/'))}
        >
          ←
        </button>
      ) : (
        <Link to="/" className="brand" aria-label="Spotlight home">
          <span className="brand-mark" aria-hidden>
            ◆
          </span>
          Spotlight
        </Link>
      )}
      {title && <h1 className="topbar-title">{title}</h1>}
      <div className="topbar-right">{right}</div>
    </header>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children}
    </div>
  )
}

export function Spinner() {
  return <div className="spinner" aria-label="Loading" />
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
