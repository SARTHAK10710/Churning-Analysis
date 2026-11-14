import { useMemo, useRef, useState, type DragEvent } from 'react'
import { ChevronLeft, ChevronRight, CloudUpload, Download, FileCheck2, Loader2, Search, Users } from 'lucide-react'
import { api, type BatchResult, type Risk, type ScoredRow } from '../lib/api'
import { RISK, bytes, eur, num, pct } from '../lib/format'
import { Callout, Kpi, PageHeader, RiskBadge, Segmented, Tag, cx } from '../components/ui'

const PAGE_SIZE = 10
const COUNTRY_CODE: Record<string, string> = { France: 'FR', Germany: 'DE', Spain: 'ES' }
const REQUIRED =
  'CreditScore, Geography, Gender, Age, Tenure, Balance, NumOfProducts, HasCrCard, IsActiveMember, EstimatedSalary'

function toCsv(rows: ScoredRow[]) {
  const columns = Object.keys(rows[0] ?? {}) as (keyof ScoredRow)[]
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.join(','), ...rows.map((r) => columns.map((c) => escape(r[c])).join(','))].join('\n')
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

export default function Batch() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BatchResult | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | Risk>('all')
  const [page, setPage] = useState(0)

  async function upload(file: File | undefined) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      setResult(await api.predictBatch(file))
      setPage(0)
      setFilter('all')
      setQuery('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    upload(e.dataTransfer.files[0])
  }

  const filtered = useMemo(() => {
    if (!result) return []
    const q = query.trim().toLowerCase()
    return result.rows.filter(
      (r) =>
        (filter === 'all' || r.RiskLevel === filter) &&
        (!q || r.CustomerId.toLowerCase().includes(q) || r.Surname.toLowerCase().includes(q)),
    )
  }, [result, query, filter])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)
  const s = result?.summary

  return (
    <>
      <PageHeader
        eyebrow="Bulk scoring"
        title="Batch Scoring"
        description="Upload a CSV of customers to score everyone at once, rank them by churn risk and export the results."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          'card relative flex flex-col items-center gap-3 overflow-hidden border-2 border-dashed px-6 py-10 text-center transition',
          dragging ? 'border-brand bg-brand-soft/50' : 'border-line',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.05] via-transparent to-brand/[0.05]" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lift">
          {loading ? <Loader2 size={26} className="animate-spin" /> : <CloudUpload size={26} />}
        </span>
        <p className="relative text-head-md text-ink">
          {loading ? (
            'Scoring customers…'
          ) : (
            <>
              Drop a CSV of customers here, or{' '}
              <button type="button" onClick={() => inputRef.current?.click()} className="text-brand-text underline underline-offset-4">
                browse files
              </button>
            </>
          )}
        </p>
        <p className="relative max-w-2xl text-body-sm text-muted">
          <strong className="text-body">Required columns:</strong> {REQUIRED}. Optional: CustomerId, Surname. Up to 50,000 rows / 10 MB.
        </p>
        <a href={api.sampleCsvUrl} download className="relative flex items-center gap-1.5 text-body-md font-medium text-brand-text hover:underline">
          <Download size={15} /> Download sample CSV (250 real customers)
        </a>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      </div>

      {error && (
        <div className="mt-4">
          <Callout title="We couldn't score that file" tone="error">
            {error}
          </Callout>
        </div>
      )}

      {result && s && (
        <>
          <div className="card mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <FileCheck2 size={20} className="text-emerald-600" />
            <span className="max-w-[16rem] truncate text-head-sm text-ink" title={result.filename}>
              {result.filename}
            </span>
            <Tag>
              {num(s.total)} rows · {bytes(result.size_bytes)}
            </Tag>
            <span className="text-body-sm text-muted">Scored in {Math.round(result.processing_ms)}ms by Gradient Boosting</span>
            <span className="ml-auto flex items-center gap-1.5 text-body-sm font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ready to export
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Customers scored" value={num(s.total)} suffix="customers" note="All rows passed validation" bar={1} badge={<Users size={16} className="text-brand-text" />} />
            <Kpi
              label="High risk"
              value={num(s.high)}
              suffix="accounts"
              valueClass="text-rose-600 dark:text-rose-400"
              note="Probability ≥ 60% · contact first"
              badge={<Tag tone="bad">{pct(s.high / s.total)}</Tag>}
              bar={s.high / s.total}
              barClass="bg-rose-600"
            />
            <Kpi
              label="Medium risk"
              value={num(s.medium)}
              suffix="accounts"
              note="Probability 30–60% · retention target"
              badge={<Tag>{pct(s.medium / s.total)}</Tag>}
              bar={s.medium / s.total}
              barClass="bg-amber-500"
            />
            <Kpi
              label="Average probability"
              value={pct(s.mean_probability)}
              suffix={`median ${pct(s.median_probability)}`}
              note={`Dataset baseline: ${pct(result.baseline_rate)}`}
              bar={s.mean_probability}
              barClass="bg-emerald-600"
            />
          </div>

          <section className="card mt-4 overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line p-3 xl:flex-row xl:items-center">
              <label className="relative xl:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  className="input pl-9"
                  placeholder="Search by ID or surname…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(0)
                  }}
                />
              </label>
              <Segmented
                label="Filter by risk"
                className="xl:w-[30rem]"
                value={filter}
                onChange={(v) => {
                  setFilter(v)
                  setPage(0)
                }}
                options={[
                  { value: 'all', label: `All (${num(s.total)})` },
                  { value: 'high', label: `High (${num(s.high)})` },
                  { value: 'medium', label: `Medium (${num(s.medium)})` },
                  { value: 'low', label: `Low (${num(s.low)})` },
                ]}
              />
              <button
                type="button"
                className="btn-primary xl:ml-auto"
                onClick={() => download(result.filename.replace(/\.csv$/i, '') + '_scored.csv', toCsv(filtered))}
              >
                <Download size={15} /> Download {filter === 'all' && !query ? 'results' : 'filtered'} CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead className="border-b border-line bg-canvas">
                  <tr className="text-caps uppercase text-muted">
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Surname</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3 text-right">Age</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-center">Products</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Churn probability</th>
                    <th className="px-4 py-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.CustomerId} className="h-11 border-b border-subtle transition hover:bg-canvas">
                      <td className="tnum px-4 text-body">#{r.CustomerId}</td>
                      <td className="px-4 font-medium text-ink">{r.Surname || '—'}</td>
                      <td className="px-4 text-body">
                        <span className="mr-1.5 text-[10px] font-semibold text-muted">{COUNTRY_CODE[r.Geography]}</span>
                        {r.Geography}
                      </td>
                      <td className="tnum px-4 text-right text-body">{r.Age}</td>
                      <td className="tnum px-4 text-right text-body">{eur(r.Balance, 2)}</td>
                      <td className="px-4 text-center">
                        <span className="tnum inline-flex h-6 w-6 items-center justify-center rounded bg-brand-soft text-body-sm font-semibold text-brand-text">
                          {r.NumOfProducts}
                        </span>
                      </td>
                      <td className="px-4">
                        <span
                          className={cx(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-sm',
                            r.IsActiveMember ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-subtle text-muted',
                          )}
                        >
                          <span className={cx('h-1.5 w-1.5 rounded-full', r.IsActiveMember ? 'bg-emerald-500' : 'bg-faint')} />
                          {r.IsActiveMember ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <span className={cx('tnum w-12 text-body-md font-semibold', RISK[r.RiskLevel].text)}>{pct(r.ChurnProbability)}</span>
                          <div className="h-1.5 w-24 rounded-full bg-subtle">
                            <div className={cx('h-full rounded-full', RISK[r.RiskLevel].bar)} style={{ width: `${r.ChurnProbability * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4">
                        <RiskBadge risk={r.RiskLevel} short />
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-muted">
                        No customers match this search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 p-3 sm:flex-row">
              <span className="text-body-sm text-muted">
                Showing{' '}
                <strong className="text-ink">
                  {filtered.length ? current * PAGE_SIZE + 1 : 0}–{Math.min(filtered.length, (current + 1) * PAGE_SIZE)}
                </strong>{' '}
                of <strong className="text-ink">{num(filtered.length)}</strong> customers
              </span>
              <div className="flex items-center gap-1">
                <button type="button" className="btn-secondary" disabled={current === 0} onClick={() => setPage(current - 1)}>
                  <ChevronLeft size={15} /> Previous
                </button>
                <span className="tnum px-3 text-body-sm text-muted">
                  Page {current + 1} of {pages}
                </span>
                <button type="button" className="btn-secondary" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  )
}
