import type { ReactNode } from 'react'
import { cx } from './ui'

/** Semicircle gauge (0–1). */
export function Gauge({ value, color, label }: { value: number; color: string; label: string }) {
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <div className="relative h-32 w-56" role="img" aria-label={`${label}: ${(clamped * 100).toFixed(1)}%`}>
      <svg viewBox="0 0 200 110" className="h-full w-full overflow-visible">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className="stroke-subtle" strokeWidth="18" strokeLinecap="round" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="18"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - clamped * 100}
          style={{ transition: 'stroke-dashoffset 700ms ease-out, stroke 300ms' }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="label-caps">{label}</span>
        <span className="tnum text-[34px] font-bold leading-tight tracking-tight text-ink">
          {(clamped * 100).toFixed(1)}
          <span className="text-head-md font-semibold">%</span>
        </span>
      </div>
    </div>
  )
}

/** Donut with two segments. */
export function Donut({
  value,
  color = '#E11D48',
  rest = '#A5B4FC',
  children,
}: {
  value: number
  color?: string
  rest?: string
  children?: ReactNode
}) {
  const r = 70
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke={rest} strokeWidth="22" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="22"
          strokeDasharray={`${value * c} ${c}`}
          style={{ transition: 'stroke-dasharray 600ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

/** Horizontal bar: label on the left, value on the right. */
export function BarRow({
  label,
  sub,
  value,
  max = 1,
  display,
  barClass = 'bg-brand',
  highlight = false,
  aside,
}: {
  label: ReactNode
  sub?: ReactNode
  value: number
  max?: number
  display: ReactNode
  barClass?: string
  highlight?: boolean
  aside?: ReactNode
}) {
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3">
      <div className="min-w-0">
        <p className={cx('truncate text-body-md', highlight ? 'font-semibold text-ink' : 'text-body')}>{label}</p>
        {sub && <p className="truncate text-body-sm text-muted">{sub}</p>}
      </div>
      <div className="relative h-2.5 rounded-full bg-subtle" title={typeof display === 'string' ? display : undefined}>
        <div
          className={cx('h-full rounded-full transition-all duration-500', barClass)}
          style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }}
        />
        {aside}
      </div>
      <span className={cx('tnum w-14 text-right text-body-md', highlight ? 'font-semibold text-ink' : 'text-body')}>{display}</span>
    </div>
  )
}

/** Bar that grows left (negative, emerald) or right (positive, rose) from a centre axis. */
export function DivergingBar({
  value,
  max,
  display,
  goodWhenNegative = true,
}: {
  value: number
  max: number
  display: string
  goodWhenNegative?: boolean
}) {
  const width = max ? Math.min(100, (Math.abs(value) / max) * 100) : 0
  const positive = value >= 0
  const color = positive === goodWhenNegative ? 'bg-rose-600' : 'bg-emerald-600'
  return (
    <div className="relative grid h-7 grid-cols-2 items-center rounded-lg bg-subtle/70 px-2" title={display}>
      <div className="flex h-full items-center justify-end pr-px">
        {!positive && (
          <div
            className={cx('flex h-4 min-w-[2.75rem] items-center justify-start rounded-l px-1.5 transition-all duration-500', color)}
            style={{ width: `${width}%` }}
          >
            <span className="tnum whitespace-nowrap text-[11px] font-bold text-white">{display}</span>
          </div>
        )}
      </div>
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-line-strong" />
      <div className="flex h-full items-center pl-px">
        {positive && (
          <div
            className={cx('flex h-4 min-w-[2.75rem] items-center justify-end rounded-r px-1.5 transition-all duration-500', color)}
            style={{ width: `${width}%` }}
          >
            <span className="tnum whitespace-nowrap text-[11px] font-bold text-white">{display}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function Legend({ items }: { items: { label: string; className: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-body-sm text-muted">
          <span className={cx('h-2.5 w-2.5 rounded-sm', i.className)} />
          {i.label}
        </span>
      ))}
    </div>
  )
}
