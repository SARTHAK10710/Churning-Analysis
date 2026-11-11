import type { Risk } from './api'

export const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`

export const pts = (value: number, digits = 1) =>
  `${value >= 0 ? '+' : '−'}${Math.abs(value * 100).toFixed(digits)} pts`

export const num = (value: number, digits = 0) =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const eur = (value: number, digits = 0) => `€${num(value, digits)}`

export const bytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`

export const RISK: Record<
  Risk,
  { label: string; dot: string; chip: string; bar: string; text: string; soft: string; stroke: string; priority: string }
> = {
  low: {
    label: 'Low risk',
    dot: 'bg-emerald-500',
    chip: 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    soft: 'bg-emerald-500/[0.07]',
    stroke: '#10B981',
    priority: 'Tier 3 · Monitor',
  },
  medium: {
    label: 'Medium risk',
    dot: 'bg-amber-500',
    chip: 'border-amber-500/25 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    soft: 'bg-amber-500/[0.08]',
    stroke: '#F59E0B',
    priority: 'Tier 2 · This month',
  },
  high: {
    label: 'High risk',
    dot: 'bg-rose-600',
    chip: 'border-rose-600/20 bg-rose-600/[0.06] text-rose-700 dark:text-rose-400',
    bar: 'bg-rose-600',
    text: 'text-rose-600 dark:text-rose-400',
    soft: 'bg-rose-600/[0.06]',
    stroke: '#E11D48',
    priority: 'Tier 1 · Immediate',
  },
}

export const FEATURE_NAMES: Record<string, string> = {
  CreditScore: 'Credit score',
  Geography: 'Country',
  Gender: 'Gender',
  Age: 'Age',
  Tenure: 'Tenure',
  Balance: 'Balance',
  NumOfProducts: 'Number of products',
  HasCrCard: 'Has credit card',
  IsActiveMember: 'Active member',
  EstimatedSalary: 'Estimated salary',
}
