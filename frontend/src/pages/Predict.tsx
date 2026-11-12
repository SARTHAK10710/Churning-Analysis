import { useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  Radar,
  SearchCheck,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { api, type CustomerInput, type Prediction } from '../lib/api'
import { RISK, num, pct, pts } from '../lib/format'
import { CardHeader, Callout, Segmented, Skeleton, Slider, Tag, Toggle, cx } from '../components/ui'
import { DivergingBar, Gauge, Legend } from '../components/charts'

const DEFAULTS: CustomerInput = {
  CreditScore: 650,
  Geography: 'France',
  Gender: 'Female',
  Age: 40,
  Tenure: 5,
  Balance: 75000,
  NumOfProducts: 2,
  HasCrCard: 1,
  IsActiveMember: 1,
  EstimatedSalary: 100000,
}

const HIGH_RISK: CustomerInput = {
  CreditScore: 510,
  Geography: 'Germany',
  Gender: 'Female',
  Age: 52,
  Tenure: 2,
  Balance: 124500,
  NumOfProducts: 3,
  HasCrCard: 1,
  IsActiveMember: 0,
  EstimatedSalary: 100000,
}

const creditBand = (score: number) =>
  score >= 750 ? 'Excellent' : score >= 670 ? 'Very good' : score >= 580 ? 'Good' : score >= 500 ? 'Fair' : 'Poor'

function Field({ label, aside, children }: { label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-body-sm font-medium text-ink">{label}</span>
        {aside}
      </div>
      {children}
    </div>
  )
}

function MoneyInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [text, setText] = useState(num(value, 2))
  const [focused, setFocused] = useState(false)
  const shown = focused ? text : num(value, 2)
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-head-sm text-muted">€</span>
      <input
        aria-label={label}
        inputMode="decimal"
        className="input tnum h-10 pl-8 text-head-sm font-medium"
        value={shown}
        onFocus={() => {
          setFocused(true)
          setText(String(value))
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value)
          const parsed = parseFloat(e.target.value.replace(/[^0-9.]/g, ''))
          onChange(Number.isFinite(parsed) ? parsed : 0)
        }}
      />
    </div>
  )
}

function SwitchTile({
  title,
  status,
  good,
  checked,
  onChange,
}: {
  title: string
  status: string
  good: boolean
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2">
      <div className="min-w-0">
        <p className="text-body-sm font-medium text-ink">{title}</p>
        <p className={cx('text-body-sm', good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
          {status}
        </p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  )
}

function ResultSkeleton() {
  return (
    <div className="card space-y-4 p-5" aria-busy="true" aria-label="Running prediction">
      <Skeleton className="h-4 w-1/3" />
      <div className="flex flex-col items-center gap-6 md:flex-row">
        <Skeleton className="h-28 w-52 rounded-t-full" />
        <div className="w-full flex-1 space-y-2">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-16" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyResult({ onExample }: { onExample: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-muted">
        <SearchCheck size={24} />
      </span>
      <h2 className="text-head-md text-ink">Fill in a customer profile to predict</h2>
      <p className="max-w-sm text-body-md text-muted">
        Set the customer's details on the left and click <strong className="text-ink">Predict churn</strong>, or load a
        high-risk example to see the full explanation.
      </p>
      <button type="button" className="btn-secondary mt-1" onClick={onExample}>
        <Wand2 size={15} /> Load high-risk example
      </button>
    </div>
  )
}

function summaryFor(result: Prediction) {
  const drivers = result.factors.filter((f) => f.impact > 0.005).slice(0, 2)
  const headline = {
    high: 'This customer is likely to leave.',
    medium: 'This customer is at moderate risk of leaving.',
    low: 'This customer is likely to stay.',
  }[result.risk]
  const detail = drivers.length
    ? `Main risk drivers: ${drivers.map((d) => d.label.toLowerCase()).join(' and ')}.`
    : 'No feature is pushing this customer strongly toward leaving.'
  return { headline, detail }
}

function ResultView({ result }: { result: Prediction }) {
  const meta = RISK[result.risk]
  const { headline, detail } = summaryFor(result)
  const maxImpact = Math.max(...result.factors.map((f) => Math.abs(f.impact)), 0.01)
  const rest = result.total_impact - result.factors.reduce((s, f) => s + f.impact, 0)
  const [done, setDone] = useState<Record<number, boolean>>({})

  return (
    <>
      <section className="card p-5" aria-live="polite">
        <CardHeader
          title="Prediction result"
          tag={
            <Tag tone="good">
              <span className="inline-flex items-center gap-1">
                <Radar size={11} /> {Math.round(result.latency_ms)}ms
              </span>
            </Tag>
          }
          right={<span className="text-body-sm text-muted">Decision threshold: {pct(result.threshold, 0)}</span>}
        />
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
          <Gauge value={result.probability} color={meta.stroke} label="Churn risk" />
          <div className="flex w-full flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caps uppercase', meta.chip)}>
                <span className={cx('h-2 w-2 rounded-full', meta.dot, result.risk === 'high' && 'animate-pulse')} />
                {meta.label}
              </span>
              <span className="text-body-sm text-muted">Bands: low &lt; 30% · medium 30–60% · high ≥ 60%</span>
            </div>
            <div className={cx('flex gap-2 rounded-lg p-3', meta.soft)}>
              {result.risk === 'low' ? (
                <CheckCircle2 size={18} className={cx('mt-0.5 shrink-0', meta.text)} />
              ) : (
                <AlertTriangle size={18} className={cx('mt-0.5 shrink-0', meta.text)} />
              )}
              <div>
                <p className={cx('text-head-sm', meta.text)}>{headline}</p>
                <p className="mt-0.5 text-body-sm text-body">{detail}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-subtle px-3 py-2">
                <p className="label-caps">Vs. average customer</p>
                <p className="tnum text-head-md text-ink">
                  {result.relative_risk.toFixed(1)}× <span className="text-body-sm font-normal text-muted">({pct(result.baseline_rate)} avg)</span>
                </p>
              </div>
              <div className="rounded-lg bg-subtle px-3 py-2">
                <p className="label-caps">Intervention priority</p>
                <p className={cx('text-head-md', meta.text)}>{meta.priority}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <CardHeader
          title="Why this prediction"
          tag={<Tag>Exact SHAP values</Tag>}
          subtitle="Top 5 drivers, in percentage points of churn probability"
          right={
            <Legend
              items={[
                { label: 'Increases risk', className: 'bg-rose-600' },
                { label: 'Decreases risk', className: 'bg-emerald-600' },
              ]}
            />
          }
        />
        <div className="mb-2 grid grid-cols-12 gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
          <span className="col-span-5 sm:col-span-4">Feature & value</span>
          <span className="col-span-7 grid grid-cols-2 sm:col-span-8">
            <span className="pr-2 text-right">Decreases (−)</span>
            <span className="pl-2">Increases (+)</span>
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {result.factors.map((f) => (
            <div key={f.feature} className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-5 min-w-0 sm:col-span-4">
                <p className="truncate text-body-md font-medium text-ink">{f.label}</p>
                <p className="truncate text-[11px] text-muted" title={f.note}>
                  {f.note}
                </p>
              </div>
              <div className="col-span-7 sm:col-span-8">
                <DivergingBar value={f.impact} max={maxImpact} display={pts(f.impact).replace(' pts', '')} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-subtle/60 px-3 py-2 text-body-sm text-muted">
          <span>
            Model average <strong className="text-ink">{pct(result.base_value)}</strong>
            {' + '}top 5 <strong className="text-ink">{pts(result.total_impact - rest)}</strong>
            {' + '}other 5 <strong className="text-ink">{pts(rest)}</strong>
          </span>
          <span>
            = this customer <strong className={RISK[result.risk].text}>{pct(result.probability)}</strong>
          </span>
        </div>
        <p className="mt-2 text-[11px] text-faint">
          Shapley values computed exactly over all 1,024 feature combinations against 100 real customers, so the impacts add
          up to the prediction.
        </p>
      </section>

      <section className="card p-5">
        <CardHeader
          title="Suggested retention actions"
          tag={<Tag tone="brand">Rule-based playbook</Tag>}
          subtitle="Triggered by the features that raise this customer's risk"
        />
        <div className="flex flex-col gap-2">
          {result.actions.map((a, i) => (
            <div
              key={a.title}
              className="flex flex-col justify-between gap-3 rounded-lg bg-subtle p-3 transition hover:bg-subtle/70 md:flex-row md:items-center"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cx(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-white',
                    done[i] ? 'bg-emerald-600' : 'bg-brand',
                  )}
                >
                  <Check size={13} />
                </span>
                <div>
                  <p className="text-head-sm text-ink">{a.title}</p>
                  <p className="text-body-sm text-muted">{a.detail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                className={cx(
                  'shrink-0',
                  done[i] ? 'btn bg-emerald-600 text-white' : i === 0 ? 'btn-primary' : 'btn-secondary',
                )}
              >
                {done[i] ? 'Done ✓' : a.cta}
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default function Predict() {
  const [form, setForm] = useState<CustomerInput>(DEFAULTS)
  const [result, setResult] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPayload, setShowPayload] = useState(false)
  const set = <K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function run(input: CustomerInput = form) {
    setLoading(true)
    setError(null)
    try {
      setResult(await api.predict(input))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const loadExample = () => {
    setForm(HIGH_RISK)
    run(HIGH_RISK)
  }
  const reset = () => {
    setForm(DEFAULTS)
    setResult(null)
    setError(null)
  }

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl bg-brand-soft/40 p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
            <Radar size={18} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-head-md text-ink">Predict churn</h1>
              <Tag tone="brand">Gradient Boosting v1</Tag>
            </div>
            <p className="text-body-sm text-muted">Score one customer and see why the model thinks they will stay or leave.</p>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <section className="card flex flex-col gap-4 p-5 xl:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-head-sm text-ink">Customer profile</h2>
              <Tag>10 features</Tag>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={loadExample} className="btn px-2 text-brand-text hover:bg-brand-soft">
                <Wand2 size={14} /> Load high-risk
              </button>
              <span className="text-faint">·</span>
              <button type="button" onClick={reset} className="btn-ghost px-2">
                Reset
              </button>
            </div>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              run()
            }}
          >
            <Field
              label="Credit score"
              aside={
                <span className="flex items-center gap-2">
                  <Tag>{creditBand(form.CreditScore)}</Tag>
                  <input
                    type="number"
                    aria-label="Credit score value"
                    min={350}
                    max={850}
                    value={form.CreditScore}
                    onChange={(e) => set('CreditScore', Math.min(850, Math.max(350, Number(e.target.value) || 350)))}
                    className="input tnum h-7 w-16 px-1.5 text-right font-medium"
                  />
                </span>
              }
            >
              <Slider label="Credit score" min={350} max={850} value={form.CreditScore} onChange={(v) => set('CreditScore', v)} />
              <div className="flex justify-between text-[10px] text-muted">
                <span>350 Poor</span>
                <span>600</span>
                <span>850 Excellent</span>
              </div>
            </Field>

            <Field label="Country">
              <Segmented
                label="Country"
                value={form.Geography}
                onChange={(v) => set('Geography', v)}
                options={[
                  { value: 'France', label: 'France' },
                  { value: 'Germany', label: 'Germany' },
                  { value: 'Spain', label: 'Spain' },
                ]}
              />
            </Field>

            <Field label="Gender">
              <Segmented
                label="Gender"
                value={form.Gender}
                onChange={(v) => set('Gender', v)}
                options={[
                  { value: 'Female', label: 'Female' },
                  { value: 'Male', label: 'Male' },
                ]}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Age" aside={<span className="tnum text-head-sm text-brand-text">{form.Age} yrs</span>}>
                <Slider label="Age" min={18} max={92} value={form.Age} onChange={(v) => set('Age', v)} />
                <div className="flex justify-between text-[10px] text-muted">
                  <span>18</span>
                  <span>92</span>
                </div>
              </Field>
              <Field label="Tenure" aside={<span className="tnum text-head-sm text-brand-text">{form.Tenure} yrs</span>}>
                <Slider label="Tenure" min={0} max={10} value={form.Tenure} onChange={(v) => set('Tenure', v)} />
                <div className="flex justify-between text-[10px] text-muted">
                  <span>0</span>
                  <span>10 yrs</span>
                </div>
              </Field>
            </div>

            <Field label="Account balance">
              <MoneyInput label="Account balance in euros" value={form.Balance} onChange={(v) => set('Balance', v)} />
            </Field>

            <div className="flex items-center justify-between rounded-lg bg-subtle px-3 py-2">
              <div>
                <p className="text-body-sm font-medium text-ink">Number of products</p>
                <p className="text-body-sm text-muted">Accounts, savings, loans or cards</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1 shadow-card">
                <button
                  type="button"
                  aria-label="Fewer products"
                  disabled={form.NumOfProducts <= 1}
                  onClick={() => set('NumOfProducts', form.NumOfProducts - 1)}
                  className="btn-ghost h-7 w-7 p-0"
                >
                  <Minus size={14} />
                </button>
                <span className="tnum w-7 text-center text-head-md text-ink" aria-live="polite">
                  {form.NumOfProducts}
                </span>
                <button
                  type="button"
                  aria-label="More products"
                  disabled={form.NumOfProducts >= 4}
                  onClick={() => set('NumOfProducts', form.NumOfProducts + 1)}
                  className="btn-ghost h-7 w-7 p-0"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <SwitchTile
                title="Has credit card"
                status={form.HasCrCard ? 'Yes' : 'No card'}
                good={!!form.HasCrCard}
                checked={!!form.HasCrCard}
                onChange={(v) => set('HasCrCard', v ? 1 : 0)}
              />
              <SwitchTile
                title="Active member"
                status={form.IsActiveMember ? 'Engaged' : 'Inactive'}
                good={!!form.IsActiveMember}
                checked={!!form.IsActiveMember}
                onChange={(v) => set('IsActiveMember', v ? 1 : 0)}
              />
            </div>

            <Field label="Estimated annual salary">
              <MoneyInput label="Estimated salary in euros" value={form.EstimatedSalary} onChange={(v) => set('EstimatedSalary', v)} />
            </Field>

            <button type="submit" className="btn-primary h-11 text-head-sm" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? 'Predicting…' : 'Predict churn'}
              {!loading && <ArrowRight size={16} />}
            </button>
            <div className="flex items-center justify-between text-body-sm">
              <button type="button" onClick={reset} className="text-muted hover:text-ink">
                Reset to defaults
              </button>
              <button type="button" onClick={() => setShowPayload((s) => !s)} className="flex items-center gap-1 text-brand-text">
                <Braces size={14} /> {showPayload ? 'Hide' : 'View'} raw payload
              </button>
            </div>
          </form>
          {showPayload && (
            <pre className="overflow-x-auto rounded-lg bg-subtle p-3 font-mono text-[11px] leading-relaxed text-ink">
              {`POST /api/predict\n${JSON.stringify(form, null, 2)}`}
            </pre>
          )}
        </section>

        <div className="flex flex-col gap-6 xl:col-span-7">
          {error && <Callout title="Prediction failed" tone="error">{error}</Callout>}
          {loading && !result ? <ResultSkeleton /> : result ? (
            <div className={cx('flex flex-col gap-6 transition-opacity', loading && 'opacity-60')}>
              <ResultView key={JSON.stringify(result.factors)} result={result} />
            </div>
          ) : (
            !error && <EmptyResult onExample={loadExample} />
          )}
        </div>
      </div>
    </>
  )
}
