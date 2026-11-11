import type { ReactNode } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import type { Risk } from '../lib/api'
import { RISK } from '../lib/format'

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx('card p-5', className)}>{children}</section>
}

export function CardHeader({
  title,
  subtitle,
  tag,
  right,
}: {
  title: string
  subtitle?: ReactNode
  tag?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-head-sm text-ink">{title}</h2>
          {tag}
        </div>
        {subtitle && <p className="mt-0.5 text-body-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'good' | 'bad' }) {
  const tones = {
    neutral: 'bg-subtle text-muted',
    brand: 'bg-brand-soft text-brand-text',
    good: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    bad: 'bg-rose-600/10 text-rose-700 dark:text-rose-400',
  }
  return <span className={cx('whitespace-nowrap rounded-full px-2 py-0.5 text-caps', tones[tone])}>{children}</span>
}

export function RiskBadge({ risk, short = false }: { risk: Risk; short?: boolean }) {
  const meta = RISK[risk]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-body-sm font-medium',
        meta.chip,
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {short ? meta.label.replace(' risk', '') : meta.label}
    </span>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('grid gap-1 rounded-lg border border-line bg-subtle p-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-body-md transition duration-150',
              active ? 'border border-line bg-card font-semibold text-ink shadow-card' : 'border border-transparent text-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-brand' : 'bg-line-strong',
      )}
    >
      <span
        className={cx(
          'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(.4,0,.2,1)]',
          checked && 'translate-x-4',
        )}
      />
    </button>
  )
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  label: string
}) {
  const fill = `${((value - min) / (max - min)) * 100}%`
  return (
    <input
      type="range"
      aria-label={label}
      className="range"
      style={{ ['--fill' as string]: fill }}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

export function Kpi({
  label,
  value,
  suffix,
  note,
  badge,
  bar,
  barClass = 'bg-brand',
  valueClass = 'text-ink',
}: {
  label: string
  value: ReactNode
  suffix?: ReactNode
  note?: ReactNode
  badge?: ReactNode
  bar?: number
  barClass?: string
  valueClass?: string
}) {
  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="label-caps">{label}</span>
        {badge}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <span className={cx('tnum text-metric', valueClass)}>{value}</span>
        {suffix && <span className="text-body-sm text-muted">{suffix}</span>}
      </div>
      {note && <p className="text-body-sm text-muted">{note}</p>}
      {bar !== undefined && (
        <div className="mt-auto h-1 w-full overflow-hidden rounded-full bg-subtle">
          <div className={cx('h-full rounded-full', barClass)} style={{ width: `${Math.min(100, Math.max(0, bar * 100))}%` }} />
        </div>
      )}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow: string
  title: string
  description: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="min-w-0">
        <p className="text-caps uppercase text-brand-text">{eyebrow}</p>
        <h1 className="mt-1 text-head-lg text-ink">{title}</h1>
        <p className="mt-1 max-w-3xl text-body-md text-muted">{description}</p>
      </div>
      {right}
    </div>
  )
}

export function Callout({ title, children, tone = 'info' }: { title: string; children: ReactNode; tone?: 'info' | 'error' }) {
  const Icon = tone === 'info' ? Info : AlertTriangle
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cx(
        'flex gap-3 rounded-xl border p-4',
        tone === 'info' ? 'border-brand/20 bg-brand-soft/60' : 'border-rose-600/25 bg-rose-600/[0.06]',
      )}
    >
      <span
        className={cx(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white',
          tone === 'info' ? 'bg-brand' : 'bg-rose-600',
        )}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className={cx('text-head-sm', tone === 'info' ? 'text-ink' : 'text-rose-700 dark:text-rose-400')}>{title}</p>
        <div className="mt-0.5 text-body-md text-body">{children}</div>
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-lg bg-subtle', className)} />
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-16 w-1/2" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}
