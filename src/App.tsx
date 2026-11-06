import { HashRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Spinner, ToastProvider } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import Admin from './pages/Admin'
import Discover from './pages/Discover'
import Login from './pages/Login'
import Me from './pages/Me'
import NewPlan from './pages/NewPlan'
import PlanPage from './pages/PlanPage'
import Safety from './pages/Safety'
import VenuePage from './pages/VenuePage'
import Venues from './pages/Venues'

function RequireAuth() {
  const { session, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="center-screen"><Spinner /></div>
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <Outlet />
}

function Layout() {
  return (
    <div className="app">
      <main className="page">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Main">
        <NavLink to="/" end className="tab">
          <span className="tab-icon" aria-hidden>✦</span>Discover
        </NavLink>
        <NavLink to="/venues" className="tab">
          <span className="tab-icon" aria-hidden>⌂</span>Venues
        </NavLink>
        <NavLink to="/new" className="tab tab-post">
          <span className="tab-post-btn" aria-hidden>+</span>Post plan
        </NavLink>
        <NavLink to="/me" className="tab">
          <span className="tab-icon" aria-hidden>☺</span>Me
        </NavLink>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/safety" element={<div className="app"><main className="page"><Safety /></main></div>} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Discover />} />
                <Route path="/venues" element={<Venues />} />
                <Route path="/venue/:slug" element={<VenuePage />} />
                <Route path="/new" element={<NewPlan />} />
                <Route path="/plan/:id" element={<PlanPage />} />
                <Route path="/me" element={<Me />} />
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
