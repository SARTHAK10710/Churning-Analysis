import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, Github, Moon, Radar, Sun, Table2, TrendingUp, Zap } from 'lucide-react'
import { api, type Health } from '../lib/api'
import { num } from '../lib/format'
import { cx } from './ui'

const NAV = [
  { to: '/', label: 'Predict', short: 'Predict', icon: Radar },
  { to: '/batch', label: 'Batch Scoring', short: 'Batch', icon: Table2 },
  { to: '/models', label: 'Model Performance', short: 'Models', icon: TrendingUp },
  { to: '/insights', label: 'Data Insights', short: 'Insights', icon: BarChart3 },
]

const REPO_URL = 'https://github.com/SARTHAK10710/Churning-Analysis'

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('churnlens-theme', dark ? 'dark' : 'light')
    } catch {
      /* storage unavailable: theme still works for this visit */
    }
  }, [dark])
  return [dark, setDark] as const
}

function useHealth() {
  const [state, setState] = useState<{ health?: Health; ms?: number; error?: boolean }>({})
  useEffect(() => {
    const started = performance.now()
    api
      .health()
      .then((health) => setState({ health, ms: performance.now() - started }))
      .catch(() => setState({ error: true }))
  }, [])
  return state
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      <span className="text-head-md text-ink">ChurnLens</span>
    </div>
  )
}

export default function Layout() {
  const [dark, setDark] = useTheme()
  const { health, ms, error } = useHealth()
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col justify-between border-r border-line bg-card p-3 lg:flex">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-2 pt-1">
            <Logo />
            <span className="rounded-full bg-subtle px-2 py-0.5 text-caps text-muted">ML</span>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-head-sm transition duration-150',
                    isActive ? 'bg-brand text-white shadow-card' : 'text-muted hover:bg-subtle hover:text-ink',
                  )
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-subtle p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {!error && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
                <span className={cx('relative inline-flex h-2 w-2 rounded-full', error ? 'bg-rose-600' : 'bg-emerald-500')} />
              </span>
              <span className="label-caps text-ink">Model status</span>
            </div>
            <p className="mt-1 text-body-sm text-muted">
              {error
                ? 'API offline. Start the backend.'
                : health
                  ? `${health.model} · v${health.version} · ${num(health.n_customers)} customers`
                  : 'Connecting…'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-body-md text-muted hover:bg-subtle hover:text-ink"
            aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
          >
            <span className="flex items-center gap-2">
              {dark ? <Moon size={16} /> : <Sun size={16} />}
              {dark ? 'Dark' : 'Light'} theme
            </span>
            <span className={cx('relative h-5 w-9 rounded-full transition-colors', dark ? 'bg-brand' : 'bg-line-strong')}>
              <span className={cx('absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform', dark && 'translate-x-4')} />
            </span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <span className="text-head-sm text-ink">ChurnLens Analytics</span>
              <span className="truncate text-body-sm text-muted">| Churn prediction & risk intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cx(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-caps',
                error ? 'bg-rose-600/10 text-rose-700 dark:text-rose-400' : 'bg-subtle text-ink',
              )}
              title="Round-trip time to the FastAPI backend"
            >
              <Zap size={13} className={error ? '' : 'text-emerald-600'} />
              {error ? (
                'API offline'
              ) : (
                <>
                  <span className="hidden sm:inline">FastAPI ·</span> {ms !== undefined ? `${Math.round(ms)}ms` : '…'}
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => setDark(!dark)}
              className="btn-ghost p-2 lg:hidden"
              aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
            >
              {dark ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn-ghost p-2" aria-label="Source code on GitHub">
              <Github size={18} />
            </a>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 md:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Bottom tabs (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-card/95 backdrop-blur lg:hidden"
        aria-label="Main"
      >
        {NAV.map(({ to, short, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-brand-text' : 'text-muted')
            }
          >
            <Icon size={20} />
            {short}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
